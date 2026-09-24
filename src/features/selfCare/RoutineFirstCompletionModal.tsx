import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import ChunkyButton from '../../components/common/ChunkyButton';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { card, radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import {
  isRoutineStreakWeekdayFilled,
  routineStreakTitle,
  ROUTINE_STREAK_WEEK_DAYS,
  shouldOfferStreakGoal,
  streakGoalOptions,
} from './domain/routineFirstCompletion';

interface Props {
  visible: boolean;
  streakDays: number;
  completedDaysAgo: readonly number[];
  /** the goal already committed to, if any */
  streakGoal: number | null;
  onCommitStreakGoal: (days: number) => void;
  onContinue: () => void;
}

type Step = 'streak' | 'goal';

/**
 * A brief celebration for the first routine win of a day, followed — when no
 * goal is running — by a streak goal to commit to, in the same card.
 */
export default function RoutineFirstCompletionModal({
  visible,
  streakDays,
  completedDaysAgo,
  streakGoal,
  onCommitStreakGoal,
  onContinue,
}: Props) {
  const [mounted, setMounted] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const [step, setStep] = useState<Step>('streak');
  const [chosenGoal, setChosenGoal] = useState<number | null>(null);
  const reveal = useRef(new Animated.Value(0)).current;
  const stepSwap = useRef(new Animated.Value(1)).current;
  const firePop = useRef(new Animated.Value(0.55)).current;
  const todayFirePop = useRef(new Animated.Value(0.45)).current;
  const today = new Date().getDay();

  useEffect(() => {
    if (visible && !mounted) setMounted(true);
  }, [mounted, visible]);

  useEffect(() => {
    if (visible && mounted) {
      setLeaving(false);
      setStep('streak');
      stepSwap.setValue(1);
      reveal.setValue(0);
      firePop.setValue(0.55);
      todayFirePop.setValue(0.45);
      Animated.parallel([
        Animated.timing(reveal, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(firePop, {
            toValue: 1.16,
            useNativeDriver: true,
            friction: 5,
            tension: 95,
          }),
          Animated.spring(firePop, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 85,
          }),
        ]),
        Animated.sequence([
          Animated.delay(220),
          Animated.spring(todayFirePop, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 110,
          }),
        ]),
      ]).start();
    }
  }, [firePop, mounted, reveal, stepSwap, todayFirePop, visible]);

  /** plays the exit, then unmounts; `after` runs once it is off the screen */
  const leave = (after?: () => void) => {
    if (leaving) return;
    setLeaving(true);
    Animated.parallel([
      Animated.timing(reveal, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(firePop, {
        toValue: 0.78,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setMounted(false);
      after?.();
    });
  };
  const dismiss = () => leave(onContinue);

  const goalOptions = streakGoalOptions(streakDays);

  const continueFromStreak = () => {
    if (leaving || !shouldOfferStreakGoal(streakGoal, streakDays)) {
      dismiss();
      return;
    }
    Animated.timing(stepSwap, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setChosenGoal(goalOptions[0]);
      setStep('goal');
      Animated.timing(stepSwap, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const chooseGoal = (days: number) => {
    triggerTapHaptic();
    setChosenGoal(days);
  };

  const commitGoal = () => {
    if (chosenGoal == null || leaving) return;
    onCommitStreakGoal(chosenGoal);
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

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            card.base,
            styles.card,
            {
              opacity: reveal,
              transform: [
                { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) },
                { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
              ],
            },
          ]}
          accessibilityViewIsModal
        >
          <Animated.View style={[styles.step, { opacity: stepSwap }]}>
            {step === 'streak' || chosenGoal == null ? (
              <>
              <Animated.View style={[styles.fireHero, { transform: [{ scale: firePop }] }]}>
                <Icon name="streakFilled" size={136} color={colors.orange[500]} />
              </Animated.View>
              <Text style={styles.title}>{routineStreakTitle(streakDays)}</Text>
              <View style={styles.week}>
                {ROUTINE_STREAK_WEEK_DAYS.map((day, index) => {
                  const filled = isRoutineStreakWeekdayFilled(index, today, completedDaysAgo);
                  return (
                    <View key={day} style={styles.weekDay}>
                      <Text style={styles.weekLabel}>{day}</Text>
                      {index === today ? (
                        <Animated.View style={{ transform: [{ scale: todayFirePop }] }}>
                          <Icon
                            name="streakFilled"
                            size={30}
                            color={filled ? colors.orange[500] : colors.border.subtle}
                          />
                        </Animated.View>
                      ) : (
                        <Icon
                          name="streakFilled"
                          size={30}
                          color={filled ? colors.orange[500] : colors.border.subtle}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
              <ChunkyButton label="Continue" onPress={continueFromStreak} />
              </>
            ) : (
              <>
                <Text style={styles.goalTitle}>
                  Pick your <Text style={styles.goalTitleAccent}>streak goal</Text> and stay on track
                </Text>
                <View style={styles.goalPanel}>
                  <View style={styles.goalOptions} accessibilityRole="radiogroup">
                    {goalOptions.map((days) => {
                      const selected = days === chosenGoal;
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
                    <Icon name="streakFilled" size={22} color={colors.orange[500]} />
                    <Text style={styles.goalPromise}>
                      You'll be <Text style={styles.goalPromiseAccent}>3x</Text> as likely to stick
                      with your routine!
                    </Text>
                  </View>
                </View>
                <ChunkyButton label="Commit to my goal" onPress={commitGoal} />
              </>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(20, 24, 38, 0.58)' },
  card: { width: '100%', maxWidth: 460, padding: spacing.xl, borderRadius: radius.sheet },
  step: { width: '100%', alignItems: 'center', gap: spacing.lg },
  fireHero: { width: 148, height: 142, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title.title1, fontFamily: fonts.semibold, color: colors.text.primary },
  week: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.background.cardSoft },
  weekDay: { alignItems: 'center', gap: spacing.xs },
  weekLabel: { ...typography.label.detail, color: colors.text.secondary },
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
