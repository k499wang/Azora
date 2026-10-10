import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { duration } from '../../theme/motion';
import type { AzoConversationState } from './data/azoConversation';
import { getAzoDeliveryState, startAzoChatDelivery } from './azoChatDelivery';

const MESSAGE_INTERVAL_MS = 900;

export function useAzoChatDelivery(conversation: AzoConversationState, onContinue: () => void) {
  const reducedMotion = useReducedMotion();
  const [delivery, setDelivery] = useState(() => getAzoDeliveryState(conversation));
  const [active, setActive] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const resolved = getAzoDeliveryState(conversation, delivery);
  const current = reducedMotion ? { ...resolved, visibleCount: resolved.messageCount } : resolved;
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
  }, [current.key, reducedMotion]);

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
        const timer = setTimeout(callback, finishing ? duration.beat : MESSAGE_INTERVAL_MS);
        return () => clearTimeout(timer);
      },
    });
    stopDelivery.current = stop;
    return () => {
      stop();
      setActive(false);
    };
  }, [current.key, finishing, reducedMotion]);

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
