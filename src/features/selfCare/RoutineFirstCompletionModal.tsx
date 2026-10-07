import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import ChunkyButton from '../../components/common/ChunkyButton';
import { Text } from '../../components/common/Text';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import StreakExtendStep from './StreakExtendStep';
import { streakCelebrationMotion, streakCelebrationColors } from './streakCelebrationMotion';
import { triggerTapHaptic } from '../../native/tapHaptics';
import {
  shouldOfferStreakGoal,
  STREAK_GOAL_DAYS,
} from './domain/routineFirstCompletion';

interface Props {
  visible: boolean;
  /** the flame lights: the moment to play the streak sound */
  onIgnite: () => void;
  streakDays: number;
  completedDaysAgo: readonly number[];
  /** Previous commitment, preselected when a new streak asks for one. */
  streakGoal: number | null;
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
  streakGoal,
  onCommitStreakGoal,
  onContinue,
}: Props) {
  const [mounted, setMounted] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const [step, setStep] = useState<Step>('streak');
  const [chosenGoal, setChosenGoal] = useState<number | null>(null);
  const reveal = useRef(new Animated.Value(0)).current;
  const stepProgress = useRef(new Animated.Value(0)).current;
  const bloom = useRef(new Animated.Value(0)).current;
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // Scale a small layer rather than allocating a circle larger than the screen.
  const bloomSize = 160;
  const bloomScale = Math.hypot(window.width / 2, window.height * 0.68) * 2 / bloomSize;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!visible || !mounted || !foreground || leaving) return;
    if (step === 'goal') {
      bloom.setValue(1);
      return;
    }
    bloom.setValue(reducedMotion ? 1 : 0);
    if (!reducedMotion) {
      Animated.timing(bloom, {
        toValue: 1,
        delay: streakCelebrationMotion.igniteAt,
        duration: streakCelebrationMotion.bloomDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    return () => bloom.stopAnimation();
  }, [bloom, foreground, leaving, mounted, reducedMotion, step, visible]);

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
      stepProgress.setValue(0);
      after?.();
    });
  };
  const dismiss = () => leave(onContinue);

  const selectedGoal =
    chosenGoal ??
    (streakGoal != null && STREAK_GOAL_DAYS.includes(streakGoal) ? streakGoal : STREAK_GOAL_DAYS[0]);
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
    triggerTapHaptic();
    setChosenGoal(days);
  };

  const commitGoal = () => {
    if (selectedGoal == null || leavingRef.current) return;
    onCommitStreakGoal(selectedGoal);
    dismiss();
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
          pointerEvents="none"
          style={[styles.bloom, {
            width: bloomSize,
            height: bloomSize,
            borderRadius: bloomSize / 2,
            left: window.width / 2 - bloomSize / 2,
            top: window.height * 0.32 - bloomSize / 2,
            transform: [{ scale: bloom.interpolate({ inputRange: [0, 1], outputRange: [0, bloomScale] }) }],
          }]}
        />
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
            {offerGoal && selectedGoal != null && (
              <Animated.View
                pointerEvents={onStreak ? 'none' : 'auto'}
                accessibilityElementsHidden={onStreak}
                importantForAccessibility={onStreak ? 'no-hide-descendants' : 'auto'}
                style={[
                  styles.step,
                  styles.stackedStep,
                  styles.goalStep,
                  {
                    opacity: stepProgress.interpolate({ inputRange: [0.35, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
                    transform: [
                      { translateY: stepProgress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                    ],
                  },
                ]}
              >
                <View style={styles.goalCard}>
                  <Text style={styles.goalTitle}>
                    Pick your <Text style={styles.goalTitleAccent}>streak goal</Text> and stay on track
                  </Text>
                  <View style={styles.goalPanel}>
                    <View style={styles.goalOptions} accessibilityRole="radiogroup">
                      {STREAK_GOAL_DAYS.map((days) => {
                        const selected = days === selectedGoal;
                        return (
                          <Pressable
                            key={days}
                            onPress={() => chooseGoal(days)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            accessibilityLabel={`${days} days`}
                            style={[styles.goalChip, selected && styles.goalChipSelected]}
                          >
                            <Text style={[styles.goalChipLabel, selected && styles.goalChipLabelSelected]}>
                              {days}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={styles.goalPromiseRow}>
                      <TaskIllustration name="streakFilled" size={22} />
                      <Text style={styles.goalPromise}>
                        You'll be <Text style={styles.goalPromiseAccent}>3x</Text> as likely to stick
                        with your routine!
                      </Text>
                    </View>
                  </View>
                  <ChunkyButton label="Commit to my goal" onPress={commitGoal} />
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: streakCelebrationColors.dark, overflow: 'hidden' },
  bloom: { position: 'absolute', backgroundColor: streakCelebrationColors.orange },
  content: { flex: 1 },
  steps: { flex: 1, width: '100%', flexDirection: 'row' },
  step: { width: '100%', flexShrink: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  stackedStep: { marginLeft: '-100%' },
  goalStep: { paddingHorizontal: spacing.lg },
  goalCard: { width: '100%', maxWidth: 460, padding: spacing.xl, borderRadius: radius.sheet, backgroundColor: colors.background.card, gap: spacing.lg },
  goalTitle: { ...typography.title.title2, fontFamily: fonts.semibold, color: colors.text.primary, textAlign: 'center' },
  goalTitleAccent: { fontFamily: fonts.heavy, color: colors.orange[500] },
  goalPanel: { width: '100%', gap: spacing.md, padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.background.cardSoft },
  goalOptions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  goalChip: { flex: 1, aspectRatio: 1, maxWidth: 72, alignItems: 'center', justifyContent: 'center', borderRadius: radius.card, borderBottomWidth: 4, borderColor: colors.border.subtle, backgroundColor: colors.background.card },
  goalChipSelected: { borderColor: colors.orange[700], backgroundColor: colors.orange[500] },
  goalChipLabel: { ...typography.title.title3, fontFamily: fonts.semibold, color: colors.text.secondary },
  goalChipLabelSelected: { color: colors.text.inverse },
  goalPromiseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  goalPromise: { ...typography.body.small, flex: 1, fontFamily: fonts.semibold, color: colors.text.secondary },
  goalPromiseAccent: { fontFamily: fonts.heavy, color: colors.orange[500] },
});
