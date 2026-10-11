import { useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerMessageHaptic, triggerNotificationHaptic } from '../../native/tapHaptics';
import { duration } from '../../theme/motion';

export type AzoMessageEntrancePhase =
  | 'title'
  | 'headline'
  | 'notification'
  | 'prompt'
  | 'ready';

// The long flat deceleration the theme calls `easing.settle`, written in core
// Animated's own Easing: the native driver only takes React Native's easings.
const SETTLE = Easing.bezier(0.16, 1, 0.3, 1);

interface AzoEntranceStage {
  /** the phase the screen is in while it plays, or a beat held where it is */
  phase: AzoMessageEntrancePhase | 'hold';
  duration: number;
  easing: (value: number) => number;
}

/**
 * One step of the entrance, in the order the screen plays them.
 *
 * `progress` runs from 0 to the number of stages, so a hold advances the clock
 * without moving anything: the screen's own ranges are flat across those steps.
 * Each message is held long enough to be read before the next one arrives.
 */
const STAGES: readonly AzoEntranceStage[] = [
  // the greeting hands the line over to the headline
  { phase: 'headline', duration: duration.slow, easing: SETTLE },
  // the headline is left alone to be read
  { phase: 'hold', duration: duration.fill * 3, easing: Easing.linear },
  // the notification slides in
  { phase: 'notification', duration: duration.slow, easing: SETTLE },
  // the card is left alone to be read
  { phase: 'hold', duration: duration.fill, easing: Easing.linear },
  // the headline leaves on a step of its own, so the prompt follows it in
  // rather than moving against it
  { phase: 'prompt', duration: duration.slow, easing: SETTLE },
  // the prompt arrives and the invitation opens
  { phase: 'prompt', duration: duration.slow, easing: SETTLE },
];

/** The stage the buzz and the landing jolt belong to. */
const NOTIFICATION_STAGE = STAGES.findIndex(({ phase }) => phase === 'notification') + 1;
const LAST_STAGE = STAGES.length;

/**
 * Read the greeting, hand over to the headline, then receive the notification
 * and its invitation.
 *
 * `started` holds the sequence until the screen it plays over has painted. The
 * greeting artwork decodes for a moment after mount, and starting before it
 * lands is what made the entrance stutter and arrive against a half-drawn page.
 */
export function useAzoMessageEntrance(started = true) {
  const [phase, setPhase] = useState<AzoMessageEntrancePhase>('title');
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  // The jolt the card makes the moment it lands, kept apart from `progress`
  // because it plays after the drop has finished, on the buzz's beat.
  const arrival = useRef(new Animated.Value(0)).current;
  const completedStage = useRef(0);
  const pausedProgress = useRef(0);
  const readingTimeLeft = useRef(duration.fill * 3);
  const snapshotPending = useRef(false);
  const resumeAfterSnapshot = useRef<(() => void) | null>(null);
  const notificationArrived = useRef(false);
  const greetingArrived = useRef(false);

  useWhileVisible(() => {
    if (!started) return () => {};
    let stopped = false;
    let cancelReading: (() => void) | undefined;
    let readingStarted = 0;
    let animation: Animated.CompositeAnimation | undefined;
    let jolt: Animated.CompositeAnimation | undefined;

    // A buzz as a line arrives, so the words are felt as they land rather than
    // only seen. Reduced motion never animates a line in, so it stays quiet.
    const buzzLineArrival = () => {
      if (stopped || reducedMotion) return;
      triggerMessageHaptic();
    };

    // The buzz belongs to the banner *arriving*, not to it having landed, so it
    // plays as the slide-in starts. Reduced motion never drops the card in, so
    // there it simply sits there from the moment it arrives.
    const announceArrival = () => {
      if (stopped || notificationArrived.current) return;
      notificationArrived.current = true;
      triggerNotificationHaptic();
      if (reducedMotion) arrival.setValue(1);
    };

    // The recoil the card takes as it lands, after the fall it made on the buzz.
    const joltOnLanding = () => {
      if (stopped || reducedMotion) return;
      arrival.setValue(0);
      jolt = Animated.timing(arrival, {
        toValue: 1,
        duration: duration.base,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      });
      jolt.start(() => {
        jolt = undefined;
      });
    };

    const animateNextStage = () => {
      if (stopped || completedStage.current === LAST_STAGE) return;
      const target = completedStage.current + 1;
      const stage = STAGES[target - 1];
      if (stage.phase !== 'hold') setPhase(stage.phase);
      if (stage.phase === 'headline') buzzLineArrival();
      if (target === NOTIFICATION_STAGE) announceArrival();
      progress.setValue(pausedProgress.current);
      animation = Animated.timing(progress, {
        toValue: target,
        duration: stage.duration * (target - pausedProgress.current),
        easing: stage.easing,
        useNativeDriver: true,
        isInteraction: false,
      });
      animation.start(({ finished }) => {
        if (stopped || !finished || completedStage.current >= target) return;
        animation = undefined;
        completedStage.current = target;
        pausedProgress.current = target;
        if (target === NOTIFICATION_STAGE) joltOnLanding();
        if (target === LAST_STAGE) setPhase('ready');
        else animateNextStage();
      });
    };

    const deliverInvitation = () => {
      if (stopped || completedStage.current === LAST_STAGE) return;
      if (reducedMotion) {
        announceArrival();
        completedStage.current = LAST_STAGE;
        pausedProgress.current = LAST_STAGE;
        progress.setValue(LAST_STAGE);
        setPhase('ready');
      } else {
        animateNextStage();
      }
    };

    const resume = () => {
      if (stopped || completedStage.current === LAST_STAGE) return;
      if (!greetingArrived.current) {
        greetingArrived.current = true;
        buzzLineArrival();
      }
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
      // The jolt is a short cosmetic recoil, so an interrupted one settles on
      // the spot instead of resuming when the screen comes back.
      if (jolt) {
        jolt.stop();
        jolt = undefined;
        arrival.setValue(1);
      }
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
  }, [progress, arrival, reducedMotion, started]);

  return { progress, arrival, phase, ready: phase === 'ready' };
}
