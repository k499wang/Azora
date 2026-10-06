import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ChunkyButton from '../../components/common/ChunkyButton';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { duration, easing, spring, stagger, travel } from '../../theme/motion';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerHeavyHaptic, triggerLightHaptic, triggerMediumHaptic } from '../../native/tapHaptics';
import StreakFlameHero from './StreakFlameHero';
import {
  isRoutineStreakWeekdayFilled,
  routineStreakCount,
  routineStreakSubtitle,
  ROUTINE_STREAK_WEEK_DAYS,
} from './domain/routineFirstCompletion';

interface Props {
  streakDays: number;
  completedDaysAgo: readonly number[];
  /** false once the popup leaves or moves on: the flame rests and pending haptics are dropped */
  active: boolean;
  /** called the moment the flame lights */
  onIgnite: () => void;
  onContinue: () => void;
}

const IGNITE_AT = 450;
const COUNT_ROLL_MS = 320;
const LABEL_AT = IGNITE_AT + 380;
const WEEK_AT = LABEL_AT + stagger.loose;
const TODAY_FILL_AT = WEEK_AT + duration.base + stagger.base;
const CHECK_LAG = stagger.tight;
const COPY_AT = TODAY_FILL_AT + duration.base;
const CONTINUE_AT = COPY_AT + stagger.loose;
const DAY_DOT_SIZE = 30;

/**
 * The streak screen's first step, staged the way Duolingo stages it: a grey
 * flame and yesterday's count, then the flame lights as the number ticks
 * over, and the rest rises in from the bottom — label, then the week with the
 * days already done filled and today filling in, then the copy, Continue last.
 */
export default function StreakExtendStep({
  streakDays,
  completedDaysAgo,
  active,
  onIgnite,
  onContinue,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [today] = useState(() => new Date().getDay());
  const count = routineStreakCount(streakDays);
  const filledDays = ROUTINE_STREAK_WEEK_DAYS.map((_, index) =>
    isRoutineStreakWeekdayFilled(index, today, completedDaysAgo),
  );
  const todayFills = filledDays[today];

  const [ready, setReady] = useState(reducedMotion);
  const onIgniteRef = useRef(onIgnite);
  useEffect(() => {
    onIgniteRef.current = onIgnite;
  });

  // Fired once on mount: the step remounts with the popup, so every showing
  // replays the whole sequence.
  useEffect(() => {
    if (!active) return;
    if (reducedMotion) {
      onIgniteRef.current();
      triggerHeavyHaptic();
      return;
    }
    const cancels = [
      startUiTimer(IGNITE_AT, () => {
        onIgniteRef.current();
        triggerLightHaptic();
      }),
      startUiTimer(IGNITE_AT + COUNT_ROLL_MS, triggerHeavyHaptic),
      ...(todayFills ? [startUiTimer(TODAY_FILL_AT, triggerMediumHaptic)] : []),
      startUiTimer(CONTINUE_AT, () => setReady(true)),
    ];
    return () => cancels.forEach((cancel) => cancel());
    // The schedule is fixed for this mount; only leaving cancels it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const roll = useSharedValue(reducedMotion ? 1 : 0);
  const bump = useSharedValue(1);
  useEffect(() => {
    if (reducedMotion) return;
    roll.value = withDelay(
      IGNITE_AT,
      withTiming(1, { duration: COUNT_ROLL_MS, easing: Easing.out(Easing.back(1.6)) }),
    );
    bump.value = withDelay(
      IGNITE_AT + COUNT_ROLL_MS,
      withSequence(withTiming(1.14, { duration: duration.fast, easing: easing.enter }), withSpring(1, spring.bounce)),
    );
    return () => {
      cancelAnimation(roll);
      cancelAnimation(bump);
    };
  }, [bump, reducedMotion, roll]);

  const countStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const previousStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - roll.value * 2),
    transform: [{ scale: 1 - 0.4 * Math.min(1, roll.value) }],
  }));
  const currentStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (roll.value - 0.2) * 1.6)),
    transform: [{ translateY: (1 - roll.value) * travel.drop * 1.5 }],
  }));

  const labelStyle = useRiseIn(LABEL_AT, reducedMotion);
  const weekStyle = useRiseIn(WEEK_AT, reducedMotion);
  const copyStyle = useRiseIn(COPY_AT, reducedMotion);
  const continueStyle = useRiseIn(CONTINUE_AT, reducedMotion);

  return (
    <>
      <StreakFlameHero igniteAt={IGNITE_AT} idle={active} reducedMotion={reducedMotion} />
      <View style={styles.countBlock} accessible accessibilityLabel={`${count} day streak`}>
        <Animated.View style={[styles.countRoll, countStyle]}>
          <Animated.View style={[styles.countPrevious, previousStyle]}>
            <Text style={[styles.countDigits, styles.countDigitsUnlit]}>{count - 1}</Text>
          </Animated.View>
          <Animated.View style={currentStyle}>
            <Text style={styles.countDigits}>{count}</Text>
          </Animated.View>
        </Animated.View>
        <Animated.View style={labelStyle}>
          <Text style={styles.countLabel}>day streak</Text>
        </Animated.View>
      </View>
      <Animated.View style={[styles.week, weekStyle]}>
        {ROUTINE_STREAK_WEEK_DAYS.map((day, index) => (
          <WeekDay
            key={day}
            label={day}
            isToday={index === today}
            filled={filledDays[index]}
            fillsAt={index === today ? TODAY_FILL_AT : null}
            reducedMotion={reducedMotion}
          />
        ))}
      </Animated.View>
      <Animated.View style={copyStyle}>
        <Text style={styles.subtitle}>{routineStreakSubtitle(streakDays)}</Text>
      </Animated.View>
      <Animated.View style={[styles.continue, continueStyle]} pointerEvents={ready ? 'auto' : 'none'}>
        <ChunkyButton label="Continue" onPress={onContinue} />
      </Animated.View>
    </>
  );
}

/** Rises a short way and fades in at `at` ms after mount. */
function useRiseIn(at: number, reducedMotion: boolean) {
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    progress.value = withDelay(at, withTiming(1, { duration: duration.base, easing: easing.enter }));
    return () => cancelAnimation(progress);
  }, [at, progress, reducedMotion]);
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * travel.drop }],
  }));
}

interface WeekDayProps {
  label: string;
  isToday: boolean;
  filled: boolean;
  /** ms after mount at which this day fills in on screen; null for a day already settled */
  fillsAt: number | null;
  reducedMotion: boolean;
}

/** A calendar day: grey until done, an orange check once it is. Only today fills in on screen. */
function WeekDay({ label, isToday, filled, fillsAt, reducedMotion }: WeekDayProps) {
  const animates = filled && fillsAt != null && !reducedMotion;
  const fill = useSharedValue(animates ? 0 : 1);
  const check = useSharedValue(animates ? 0 : 1);
  const ripple = useSharedValue(0);

  useEffect(() => {
    if (!animates || fillsAt == null) return;
    fill.value = withDelay(fillsAt, withSpring(1, spring.bounce));
    check.value = withDelay(fillsAt + CHECK_LAG, withSpring(1, spring.pop));
    ripple.value = withDelay(fillsAt, withTiming(1, { duration: duration.slower, easing: easing.burst }));
    return () => {
      cancelAnimation(fill);
      cancelAnimation(check);
      cancelAnimation(ripple);
    };
  }, [animates, check, fill, fillsAt, ripple]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scale: fill.value }] }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, check.value * 2),
    transform: [{ scale: check.value }, { rotate: `${(1 - check.value) * -30}deg` }],
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: ripple.value === 0 ? 0 : 0.5 * (1 - ripple.value),
    transform: [{ scale: 1 + 0.8 * ripple.value }],
  }));

  return (
    <View style={styles.weekDay}>
      <Text style={[styles.weekLabel, isToday && styles.weekLabelToday]}>{label}</Text>
      <View style={styles.dayTrack}>
        {animates && <Animated.View style={[styles.dayDot, styles.dayRipple, rippleStyle]} />}
        <View style={styles.dayDot} />
        {filled && (
          <Animated.View style={[styles.dayDot, styles.dayDotFilled, fillStyle]}>
            <Animated.View style={checkStyle}>
              <Icon name="check-bold" size={18} color={colors.text.inverse} />
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  countBlock: { width: '100%', alignItems: 'center', marginTop: -spacing.lg },
  countRoll: { width: '100%' },
  countPrevious: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  countDigits: { ...typography.display.hero, color: colors.orange[500], textAlign: 'center' },
  countDigitsUnlit: { color: colors.neutral[300] },
  countLabel: { ...typography.title.title3, fontFamily: fonts.semibold, color: colors.orange[500], marginTop: -spacing.sm },
  week: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.background.cardSoft,
  },
  weekDay: { flex: 1, alignItems: 'center', gap: spacing.xs },
  weekLabel: { ...typography.label.detail, color: colors.text.secondary },
  weekLabelToday: { fontFamily: fonts.semibold, color: colors.orange[500] },
  dayTrack: { width: '100%', height: DAY_DOT_SIZE, alignItems: 'center', justifyContent: 'center' },
  dayDot: { width: DAY_DOT_SIZE, height: DAY_DOT_SIZE, borderRadius: DAY_DOT_SIZE / 2, backgroundColor: colors.border.subtle },
  dayDotFilled: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orange[500] },
  dayRipple: { position: 'absolute', backgroundColor: colors.orange[300] },
  subtitle: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.text.secondary, textAlign: 'center' },
  continue: { width: '100%' },
});
