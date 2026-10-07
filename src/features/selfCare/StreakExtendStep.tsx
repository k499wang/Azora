import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import { fonts } from '../../theme/typography';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerHeavyHaptic, triggerLightHaptic } from '../../native/tapHaptics';
import StreakFlameHero from './StreakFlameHero';
import { isRoutineStreakWeekdayFilled, routineStreakCount, routineStreakSubtitle, ROUTINE_STREAK_WEEK_DAYS } from './domain/routineFirstCompletion';
import { streakCelebrationMotion as timing, streakCelebrationColors as palette } from './streakCelebrationMotion';

interface Props {
  streakDays: number;
  completedDaysAgo: readonly number[];
  active: boolean;
  onIgnite: () => void;
  onContinue: () => void;
}

/** The earned count is the focal point; the calendar and action follow its landing. */
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
  const [ready, setReady] = useState(reducedMotion);
  const onIgniteRef = useRef(onIgnite);
  useEffect(() => {
    onIgniteRef.current = onIgnite;
  }, [onIgnite]);
  useEffect(() => {
    if (!active) return;
    if (reducedMotion) {
      setReady(true);
      return;
    }
    setReady(false);
    const cancels = [
      startUiTimer(timing.igniteAt, () => onIgniteRef.current()),
      startUiTimer(timing.countAt + timing.countDuration, triggerHeavyHaptic),
      ...(filledDays[today] ? [startUiTimer(timing.todayAt, triggerLightHaptic)] : []),
      startUiTimer(timing.continueAt + timing.revealDuration, () => setReady(true)),
    ];
    return () => cancels.forEach(cancel => cancel());
    // Completion history is a snapshot for this celebration; leaving cancels the schedule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reducedMotion]);

  const roll = useSharedValue(reducedMotion ? 1 : 0);
  const bump = useSharedValue(1);
  useEffect(() => {
    if (!active) return;
    if (reducedMotion) {
      roll.value = 1;
      bump.value = 1;
      return;
    }
    roll.value = 0;
    bump.value = 1;
    roll.value = withDelay(
      timing.countAt,
      withTiming(1, { duration: timing.countDuration, easing: Easing.out(Easing.cubic) }),
    );
    bump.value = withDelay(
      timing.countAt + timing.countDuration,
      withSequence(
        withTiming(1.08, { duration: 100 }),
        withSpring(1, { damping: 13, stiffness: 190 }),
      ),
    );
    return () => { cancelAnimation(roll); cancelAnimation(bump);
    };
  }, [active, bump, reducedMotion, roll]);
  const countStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const previousStyle = useAnimatedStyle(() => ({
    opacity: 1 - roll.value,
    transform: [{ translateY: -roll.value * 55 }],
  }));
  const currentStyle = useAnimatedStyle(() => ({
    opacity: roll.value,
    transform: [{ translateY: (1 - roll.value) * 55 }],
  }));
  const labelStyle = useReveal(timing.labelAt, active, reducedMotion);
  const weekStyle = useReveal(timing.weekAt, active, reducedMotion);
  const copyStyle = useReveal(timing.copyAt, active, reducedMotion);
  const continueStyle = useReveal(timing.continueAt, active, reducedMotion);
  const countRevealStyle = useReveal(timing.igniteAt, active, reducedMotion);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.upperSpace} />
        <StreakFlameHero igniteAt={timing.igniteAt} idle={active} reducedMotion={reducedMotion} />
        <Animated.View
          style={[styles.countBlock, countRevealStyle]}
          accessible
          accessibilityLabel={`${count} day streak`}
        >
          <Animated.View style={[styles.countRoll, countStyle]}>
            <Animated.View style={[styles.countPrevious, previousStyle]}>
              <Text style={styles.countDigits}>{count - 1}</Text>
            </Animated.View>
            <Animated.View style={currentStyle}>
              <Text style={styles.countDigits}>{count}</Text>
            </Animated.View>
          </Animated.View>
          <Animated.View style={labelStyle}>
            <Text style={styles.countLabel}>day streak</Text>
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.week, weekStyle]}>
          <View style={styles.weekLabels}>
            {ROUTINE_STREAK_WEEK_DAYS.map(day => (
              <Text key={day} style={styles.weekLabel}>{day.slice(0, 2)}</Text>
            ))}
          </View>
          <View style={styles.weekTrack}>
            {filledDays.map((filled, index) => (
              <WeekSegment
                key={index}
                filled={filled}
                isToday={index === today}
                index={index}
                active={active}
                reducedMotion={reducedMotion}
              />
            ))}
          </View>
        </Animated.View>
        <Animated.View style={[styles.copy, copyStyle]}>
          <Text style={styles.subtitle}>{routineStreakSubtitle(streakDays)}</Text>
        </Animated.View>
        <View style={styles.lowerSpace} />
      </View>
      <Animated.View
        style={[styles.continue, continueStyle]}
        pointerEvents={ready && active ? 'auto' : 'none'}
        accessibilityElementsHidden={!ready || !active}
        importantForAccessibility={ready && active ? 'auto' : 'no-hide-descendants'}
      >
        <ChunkyButton
          label="CONTINUE"
          onPress={onContinue}
          shape="card"
          minHeight={48}
          tone={{ face: '#ffffff', lip: '#e5e5e5', label: palette.orange }}
        />
      </Animated.View>
    </View>
  );
}

function useReveal(at: number, active: boolean, reducedMotion: boolean) {
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!active) return;
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      at,
      withTiming(1, { duration: timing.revealDuration, easing: Easing.out(Easing.cubic) }),
    );
    return () => cancelAnimation(progress);
  }, [active, at, progress, reducedMotion]);
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));
}

function WeekSegment({ filled, isToday, index, active, reducedMotion }: {
  filled: boolean;
  isToday: boolean;
  index: number;
  active: boolean;
  reducedMotion: boolean;
}) {
  const fill = useSharedValue(reducedMotion || !isToday ? 1 : 0);
  useEffect(() => {
    if (!active) return;
    if (reducedMotion || !isToday) {
      fill.value = 1;
      return;
    }
    fill.value = 0;
    fill.value = withDelay(
      timing.todayAt,
      withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
    );
    return () => cancelAnimation(fill);
  }, [active, fill, isToday, reducedMotion]);
  const fillStyle = useAnimatedStyle(() => ({
    opacity: fill.value,
    transform: [{ scaleX: .5 + fill.value * .5 }],
  }));
  return (
    <View
      style={styles.segment}
      accessible
      accessibilityLabel={`${ROUTINE_STREAK_WEEK_DAYS[index]}${isToday ? ', today' : ''}, ${filled ? 'completed' : 'not completed'}`}
    >
      {filled && (
        <Animated.View style={[
          styles.segmentFill,
          index === 0 && styles.segmentFirst,
          index === 6 && styles.segmentLast,
          fillStyle,
        ]} />
      )}
      {isToday && (
        <Animated.View style={[styles.todayFlame, fillStyle]}>
          <Svg width={32} height={36} viewBox="0 0 100 110">
            <Path
              d="M50 8C38 25 28 31 21 25C22 38 9 51 9 68C9 91 26 103 50 103C74 103 90 87 90 67C90 48 72 28 57 12Q53 6 50 8Z"
              fill={filled ? '#ffffff' : '#d6d9e0'}
              stroke="#ffffff"
              strokeWidth="8"
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', alignItems: 'center', paddingHorizontal: 24 },
  content: { flex: 1, width: '100%', maxWidth: 460, alignItems: 'center' },
  upperSpace: { flex: 1.45, minHeight: 18 },
  lowerSpace: { flex: 1, minHeight: 22 },
  countBlock: { width: '100%', alignItems: 'center', marginTop: -14 },
  countRoll: { width: '100%', height: 104, overflow: 'hidden' },
  countPrevious: { position: 'absolute', top: 0, left: 0, right: 0 },
  countDigits: {
    fontFamily: fonts.heavy,
    fontSize: 96,
    lineHeight: 104,
    color: palette.cream,
    textAlign: 'center',
  },
  countLabel: { fontFamily: fonts.bold, fontSize: 27, lineHeight: 34, color: '#ffffff', marginTop: 4 },
  week: { width: '100%', marginTop: 42 },
  weekLabels: { flexDirection: 'row', marginBottom: 18 },
  weekLabel: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: palette.cream,
    textAlign: 'center',
  },
  weekTrack: { flexDirection: 'row', height: 24, borderRadius: 12, backgroundColor: '#ffa92e' },
  segment: { flex: 1, height: 24 },
  segmentFill: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.yellow },
  segmentFirst: { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  segmentLast: { borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  todayFlame: { position: 'absolute', alignSelf: 'center', top: -8, zIndex: 1 },
  copy: { marginTop: 28, maxWidth: 330 },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 19,
    lineHeight: 28,
    color: palette.cream,
    textAlign: 'center',
  },
  continue: { width: '100%', maxWidth: 460, paddingBottom: 8 },
});
