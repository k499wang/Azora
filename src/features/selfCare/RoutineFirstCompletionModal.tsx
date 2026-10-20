import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Modal, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import StreakExtendStep from './StreakExtendStep';
import StreakGoalStep from './StreakGoalStep';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { shouldOfferStreakGoal } from './domain/routineFirstCompletion';

interface Props {
  visible: boolean;
  /** the flame lights: the moment to play the streak sound */
  onIgnite: () => void;
  streakDays: number;
  completedDaysAgo: readonly number[];
  onCommitStreakGoal: (days: number) => void;
  onContinue: () => void;
}

type Step = 'streak' | 'goal';

/**
 * A brief celebration for the first routine win of a day, followed — on a
 * streak's first day — by a streak goal to commit to.
 *
 * Both steps share the full-screen frame. The goal card crossfades over the
 * settled celebration without resizing the screen or remounting the flame.
 */
export default function RoutineFirstCompletionModal({
  visible,
  onIgnite,
  streakDays,
  completedDaysAgo,
  onCommitStreakGoal,
  onContinue,
}: Props) {
  const [mounted, setMounted] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const [step, setStep] = useState<Step>('streak');
  const [chosenGoal, setChosenGoal] = useState<number | null>(null);
  const [committing, setCommitting] = useState(false);
  const committingRef = useRef(false);
  const reveal = useRef(new Animated.Value(0)).current;
  const stepProgress = useRef(new Animated.Value(0)).current;
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => () => {
    reveal.stopAnimation();
    stepProgress.stopAnimation();
  }, [reveal, stepProgress]);

  useEffect(() => {
    if (visible && !mounted) setMounted(true);
  }, [mounted, visible]);

  useEffect(() => {
    if (visible && mounted) {
      leavingRef.current = false;
      setLeaving(false);
      reveal.setValue(0);
      Animated.timing(reveal, {
        toValue: 1,
        duration: reducedMotion ? 0 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [mounted, reducedMotion, reveal, visible]);

  /** plays the exit, then unmounts; `after` runs once it is off the screen */
  const leave = (after?: () => void) => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    Animated.timing(reveal, {
      toValue: 0,
      duration: reducedMotion ? 0 : 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setMounted(false);
      setStep('streak');
      setChosenGoal(null);
      committingRef.current = false;
      setCommitting(false);
      stepProgress.setValue(0);
      after?.();
    });
  };
  const dismiss = () => leave(onContinue);

  // Once on the goal step it stays offered, so committing a goal cannot pull
  // the step out from under the card while it leaves.
  const offerGoal = step === 'goal' || shouldOfferStreakGoal(streakDays);

  const continueFromStreak = () => {
    if (leavingRef.current || step !== 'streak') return;
    if (!offerGoal) {
      dismiss();
      return;
    }
    setStep('goal');
    Animated.timing(stepProgress, {
      toValue: 1,
      duration: reducedMotion ? 0 : 420,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const chooseGoal = (days: number) => {
    if (committingRef.current) return;
    triggerTapHaptic();
    setChosenGoal(days);
  };

  // Saved on tap; the modal leaves once the picker has stamped the calendar.
  const commitGoal = () => {
    if (chosenGoal == null || leavingRef.current || committingRef.current) return;
    committingRef.current = true;
    onCommitStreakGoal(chosenGoal);
    setCommitting(true);
  };

  // Hidden from outside — its host lost focus, something with a better claim
  // to the screen arrived, or the win it announces was withdrawn. It leaves the
  // same way it would on Continue, without reporting a Continue.
  useEffect(() => {
    if (!visible && mounted) leave();
    // `leave` is rebuilt every render; this watches only the visibility.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, visible]);

  const onStreak = step === 'streak';

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <Animated.View style={[styles.root, { opacity: reveal }]}>
        {mounted && <StatusBar style="light" />}
        <Animated.View
          style={[styles.content, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          accessibilityViewIsModal
        >
          <View style={styles.steps}>
            <Animated.View
              pointerEvents={onStreak ? 'auto' : 'none'}
              accessibilityElementsHidden={!onStreak}
              importantForAccessibility={onStreak ? 'auto' : 'no-hide-descendants'}
              style={[
                styles.step,
                {
                  opacity: stepProgress.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' }),
                  transform: [
                    { translateY: stepProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
                    { scale: stepProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
                  ],
                },
              ]}
            >
              <StreakExtendStep
                streakDays={streakDays}
                completedDaysAgo={completedDaysAgo}
                active={onStreak && visible && foreground && !leaving}
                onIgnite={onIgnite}
                onContinue={continueFromStreak}
              />
            </Animated.View>
            {offerGoal && (
              <Animated.View
                pointerEvents={onStreak ? 'none' : 'auto'}
                accessibilityElementsHidden={onStreak}
                importantForAccessibility={onStreak ? 'no-hide-descendants' : 'auto'}
                style={[
                  styles.step,
                  styles.stackedStep,
                  {
                    opacity: stepProgress.interpolate({ inputRange: [0.35, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
                    transform: [
                      { translateY: stepProgress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                    ],
                  },
                ]}
              >
                <StreakGoalStep
                  streakDays={streakDays}
                  selectedGoal={chosenGoal}
                  active={!onStreak && visible && foreground && !leaving}
                  onSelect={chooseGoal}
                  onCommit={commitGoal}
                  committing={committing}
                  onCommitFinished={dismiss}
                />
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.streakCelebration.night, overflow: 'hidden' },
  content: { flex: 1 },
  steps: { flex: 1, width: '100%', flexDirection: 'row' },
  step: { width: '100%', flexShrink: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  stackedStep: { marginLeft: '-100%' },
});
