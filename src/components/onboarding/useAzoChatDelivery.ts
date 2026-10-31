import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { duration } from '../../theme/motion';
import type { AzoConversationState } from './data/azoConversation';
import { getAzoDeliveryState, getAzoMessageReadDelay, startAzoChatDelivery } from './azoChatDelivery';

export function useAzoChatDelivery(conversation: AzoConversationState, onContinue: () => void) {
  const reducedMotion = useReducedMotion();
  const [delivery, setDelivery] = useState(() => getAzoDeliveryState(conversation));
  const [active, setActive] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const current = getAzoDeliveryState(conversation, delivery);
  const latest = useRef(current);
  latest.current = current;
  const stopDelivery = useRef<() => void>(() => {});
  const finishingRef = useRef(false);
  const continueRef = useRef(onContinue);
  continueRef.current = onContinue;

  useEffect(() => {
    setDelivery(current);
    // A changed answer prefix starts a new group or restores a reached one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.key]);

  useWhileVisible(() => {
    setActive(true);
    const key = current.key;
    const stop = startAzoChatDelivery({
      visibleCount: latest.current.visibleCount,
      messageCount: latest.current.messageCount,
      finishing,
      onMessage: (visibleCount) => {
        if (latest.current.key !== key) return;
        const updated = { ...latest.current, visibleCount };
        latest.current = updated;
        setDelivery(updated);
      },
      onFinish: () => {
        if (!finishingRef.current || latest.current.key !== key) return;
        finishingRef.current = false;
        setFinishing(false);
        continueRef.current();
      },
      schedule: (callback) => {
        const delay = finishing
          ? duration.beat
          : getAzoMessageReadDelay(conversation.messages[latest.current.visibleCount - 1]);
        const timer = setTimeout(callback, delay);
        return () => clearTimeout(timer);
      },
    });
    stopDelivery.current = stop;
    return () => {
      stop();
      setActive(false);
    };
  }, [current.key, finishing]);

  const cancel = () => {
    stopDelivery.current();
    finishingRef.current = false;
    setFinishing(false);
  };

  const finish = () => {
    if (finishingRef.current) return;
    stopDelivery.current();
    finishingRef.current = true;
    setFinishing(true);
  };

  return {
    messages: conversation.messages.slice(0, current.visibleCount),
    ready: current.visibleCount === current.messageCount,
    animateFrom: current.animateFrom,
    active,
    reducedMotion,
    finish,
    cancel,
  };
}
