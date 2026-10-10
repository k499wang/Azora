import { useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerSuccessHaptic } from '../../native/tapHaptics';
import { duration } from '../../theme/motion';

export type AzoMessageEntrancePhase = 'title' | 'notification' | 'prompt' | 'ready';

/** Read the title, then receive the notification and its invitation. */
export function useAzoMessageEntrance() {
  const [phase, setPhase] = useState<AzoMessageEntrancePhase>('title');
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const completedStage = useRef(0);
  const pausedProgress = useRef(0);
  const readingTimeLeft = useRef(duration.fill * 2);
  const snapshotPending = useRef(false);
  const resumeAfterSnapshot = useRef<(() => void) | null>(null);
  const notificationArrived = useRef(false);

  useWhileVisible(() => {
    let stopped = false;
    let cancelReading: (() => void) | undefined;
    let readingStarted = 0;
    let animation: Animated.CompositeAnimation | undefined;

    const buzzOnArrival = () => {
      if (stopped || notificationArrived.current) return;
      notificationArrived.current = true;
      triggerSuccessHaptic();
    };

    const animateNextStage = () => {
      if (stopped || completedStage.current === 2) return;
      const target = completedStage.current + 1;
      setPhase(target === 1 ? 'notification' : 'prompt');
      progress.setValue(pausedProgress.current);
      animation = Animated.timing(progress, {
        toValue: target,
        duration: duration.slow * (target - pausedProgress.current),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      });
      animation.start(({ finished }) => {
        if (stopped || !finished || completedStage.current >= target) return;
        animation = undefined;
        completedStage.current = target;
        pausedProgress.current = target;
        if (target === 1) buzzOnArrival();
        if (target === 2) setPhase('ready');
        else animateNextStage();
      });
    };

    const deliverInvitation = () => {
      if (stopped || completedStage.current === 2) return;
      if (reducedMotion) {
        buzzOnArrival();
        completedStage.current = 2;
        pausedProgress.current = 2;
        progress.setValue(2);
        setPhase('ready');
      } else {
        animateNextStage();
      }
    };

    const resume = () => {
      if (stopped || completedStage.current === 2) return;
      if (readingTimeLeft.current > 0) {
        readingStarted = Date.now();
        cancelReading = startUiTimer(readingTimeLeft.current, () => {
          cancelReading = undefined;
          if (stopped) return;
          readingTimeLeft.current = 0;
          deliverInvitation();
        });
      } else {
        deliverInvitation();
      }
    };

    // A native stop snapshot can return after foregrounding. Wait for it so
    // resuming never rewinds a partially visible notification or prompt.
    if (snapshotPending.current) resumeAfterSnapshot.current = resume;
    else resume();

    return () => {
      stopped = true;
      resumeAfterSnapshot.current = null;
      if (cancelReading) {
        cancelReading();
        readingTimeLeft.current = Math.max(0, readingTimeLeft.current - (Date.now() - readingStarted));
      }
      if (animation) {
        snapshotPending.current = true;
        progress.stopAnimation((value) => {
          pausedProgress.current = value;
          snapshotPending.current = false;
          const continueEntrance = resumeAfterSnapshot.current;
          resumeAfterSnapshot.current = null;
          continueEntrance?.();
        });
      }
    };
  }, [progress, reducedMotion]);

  return { progress, phase, ready: phase === 'ready' };
}
