import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import ChunkyButton from '../../components/common/ChunkyButton';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { routineStreakCount, STREAK_GOAL_DAYS, STREAK_GOAL_LABELS } from './domain/routineFirstCompletion';
import { FLAME_PATH, INNER_PATH } from './streakFlameArt';
import { easeOutBack, easeOutCubic, mix, phase } from './streakCelebrationMotion';

interface Props {
  streakDays: number;
  selectedGoal: number | null;
  active: boolean;
  onSelect: (days: number) => void;
  onCommit: () => void;
}

const palette = colors.streakCelebration;
const entrance = {
  popDuration: 360,
  titleAt: 80,
  rowsAt: 160,
  rowStagger: 50,
  rowDuration: 220,
  buttonAt: 420,
  revealDuration: 220,
  end: 700,
} as const;
const SELECT_DURATION = 120;
const FILL_DURATION = 320;
const ROLL_DURATION = 160;
const PROMISE_DURATION = 200;
const TILE_HEIGHT = 60;
const TILE_BAND = 10;
const NUMBER_HEIGHT = TILE_HEIGHT - TILE_BAND;
const TRACK_HEIGHT = 14;
const outCubic = { easing: Easing.out(Easing.cubic) };

/** Duolingo's "next streak goal": nothing preselected, so committing is an active choice. */
export default function StreakGoalStep({ streakDays, selectedGoal, active, onSelect, onCommit }: Props) {
  const reducedMotion = useReducedMotion();
  const count = routineStreakCount(streakDays);
  const goal = selectedGoal ?? STREAK_GOAL_DAYS[0];
  const picked = selectedGoal != null;

  const clock = useSharedValue<number>(reducedMotion ? entrance.end : 0);
  useEffect(() => {
    if (!active) return;
    if (reducedMotion) {
      clock.value = entrance.end;
      return;
    }
    clock.value = 0;
    clock.value = withTiming(entrance.end, { duration: entrance.end, easing: Easing.linear });
    return () => cancelAnimation(clock);
  }, [active, clock, reducedMotion]);

  const fill = useSharedValue(Math.min(1, count / goal));
  const trackWidth = useSharedValue(0);
  useEffect(() => {
    const target = Math.min(1, count / goal);
    fill.value = reducedMotion ? target : withTiming(target, { duration: FILL_DURATION, ...outCubic });
  }, [count, fill, goal, reducedMotion]);
  const onTrackLayout = (event: LayoutChangeEvent) => {
    trackWidth.value = event.nativeEvent.layout.width;
  };
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -(1 - fill.value) * trackWidth.value }],
  }));

  const [roll, setRoll] = useState({ from: goal, to: goal });
  if (roll.to !== goal) setRoll({ from: roll.to, to: goal });
  const rollProgress = useSharedValue(1);
  const goalPop = useSharedValue(1);
  useEffect(() => {
    if (roll.from === roll.to) return;
    if (reducedMotion) {
      rollProgress.value = 1;
      return;
    }
    rollProgress.value = 0;
    rollProgress.value = withTiming(1, { duration: ROLL_DURATION, ...outCubic });
    goalPop.value = withSequence(
      withTiming(1.08, { duration: ROLL_DURATION / 2, ...outCubic }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
    return () => {
      cancelAnimation(rollProgress);
      cancelAnimation(goalPop);
    };
  }, [goalPop, reducedMotion, roll, rollProgress]);
  const incomingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - rollProgress.value) * TILE_HEIGHT }],
  }));
  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: 1 - rollProgress.value,
    transform: [{ translateY: -rollProgress.value * TILE_HEIGHT }],
  }));

  const promise = useSharedValue(picked ? 1 : 0);
  useEffect(() => {
    const target = picked ? 1 : 0;
    promise.value = reducedMotion ? target : withTiming(target, { duration: PROMISE_DURATION, ...outCubic });
  }, [picked, promise, reducedMotion]);
  const promiseStyle = useAnimatedStyle(() => ({
    opacity: promise.value,
    transform: [{ translateY: (1 - promise.value) * 12 }],
  }));

  const tilePop = useAnimatedStyle(() => {
    const pop = phase(clock.value, 0, entrance.popDuration);
    return {
      opacity: easeOutCubic(pop),
      transform: [{ scale: mix(0.85, 1, easeOutBack(pop, 1.6)) }],
    };
  });
  const goalTileStyle = useAnimatedStyle(() => ({ transform: [{ scale: goalPop.value }] }));
  const titleStyle = useClockReveal(clock, entrance.titleAt, entrance.revealDuration, 12);
  const buttonStyle = useClockReveal(clock, entrance.buttonAt, entrance.revealDuration, 24);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Animated.View style={[styles.header, tilePop]}>
          <Tile face={palette.flameOrange} band={palette.pillTop} flame>
            <Text style={[styles.tileNumber, styles.tileNumberLit]}>{count}</Text>
          </Tile>
          <View style={styles.track} onLayout={onTrackLayout}>
            <Animated.View style={[styles.trackFill, fillStyle]}>
              <Svg width="100%" height={TRACK_HEIGHT}>
                <Defs>
                  <LinearGradient id="streakGoalFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={palette.pillTop} />
                    <Stop offset="1" stopColor={palette.pillBottom} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height={TRACK_HEIGHT} rx={TRACK_HEIGHT / 2} fill="url(#streakGoalFill)" />
              </Svg>
            </Animated.View>
          </View>
          <Animated.View style={goalTileStyle}>
            <Tile face={palette.dayEmpty} band={palette.dormantShadow}>
              <View>
                <View style={styles.tileSizer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Text style={styles.tileNumber}>{roll.from}</Text>
                  <Text style={[styles.tileNumber, styles.tileSizerStacked]}>{roll.to}</Text>
                </View>
                <Animated.View style={[styles.tileLayer, incomingStyle]}>
                  <Text style={styles.tileNumber}>{roll.to}</Text>
                </Animated.View>
                {roll.from !== roll.to && (
                  <Animated.View style={[styles.tileLayer, outgoingStyle]}>
                    <Text style={styles.tileNumber}>{roll.from}</Text>
                  </Animated.View>
                )}
              </View>
            </Tile>
          </Animated.View>
        </Animated.View>
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>
            Pick your <Text style={styles.titleAccent}>streak goal</Text>
          </Text>
        </Animated.View>
        <View style={styles.rows} accessibilityRole="radiogroup">
          {STREAK_GOAL_DAYS.map((days, index) => (
            <GoalRow
              key={days}
              days={days}
              index={index}
              clock={clock}
              selected={days === selectedGoal}
              reducedMotion={reducedMotion}
              onPress={() => onSelect(days)}
            />
          ))}
        </View>
        <Animated.View style={promiseStyle} accessibilityElementsHidden={!picked} importantForAccessibility={picked ? 'auto' : 'no-hide-descendants'}>
          <Text style={styles.promise}>
            You'll be <Text style={styles.promiseAccent}>3x</Text> as likely to stick with your routine!
          </Text>
        </Animated.View>
      </View>
      <Animated.View style={[styles.button, buttonStyle]}>
        <ChunkyButton label="COMMIT TO MY GOAL" onPress={onCommit} disabled={!picked} shape="card" minHeight={48} />
      </Animated.View>
    </View>
  );
}

function useClockReveal(clock: SharedValue<number>, at: number, duration: number, distance: number) {
  return useAnimatedStyle(() => {
    const progress = easeOutCubic(phase(clock.value, at, duration));
    return { opacity: progress, transform: [{ translateY: (1 - progress) * distance }] };
  });
}

interface TileProps {
  face: string;
  band: string;
  flame?: boolean;
  children: ReactNode;
}

function Tile({ face, band, flame = false, children }: TileProps) {
  return (
    <View style={styles.tileFrame}>
      <View style={[styles.tile, { backgroundColor: face }]}>
        {children}
        <View style={[styles.tileBand, { backgroundColor: band }]} />
      </View>
      {flame && (
        <View style={styles.tileFlame}>
          <Svg width={22} height={25} viewBox="0 0 100 112">
            <Path d={FLAME_PATH} fill={palette.flameYellow} />
            <Path d={INNER_PATH} fill={palette.flameCore} />
          </Svg>
        </View>
      )}
    </View>
  );
}

interface GoalRowProps {
  days: number;
  index: number;
  clock: SharedValue<number>;
  selected: boolean;
  reducedMotion: boolean;
  onPress: () => void;
}

function GoalRow({ days, index, clock, selected, reducedMotion, onPress }: GoalRowProps) {
  const label = STREAK_GOAL_LABELS[days];
  const selection = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    const target = selected ? 1 : 0;
    selection.value = reducedMotion ? target : withTiming(target, { duration: SELECT_DURATION, ...outCubic });
  }, [reducedMotion, selected, selection]);
  const rowAt = entrance.rowsAt + index * entrance.rowStagger;
  const enterStyle = useAnimatedStyle(() => {
    const progress = easeOutCubic(phase(clock.value, rowAt, entrance.rowDuration));
    return { opacity: progress, transform: [{ translateY: (1 - progress) * 16 }] };
  });
  const faceStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(selection.value, [0, 1], [palette.dayEmpty, palette.count]),
    backgroundColor: interpolateColor(selection.value, [0, 1], [palette.night, palette.selectedTint]),
  }));
  const daysStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selection.value, [0, 1], [palette.copy, palette.count]),
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: selection.value,
    transform: [{ scale: mix(0.6, 1, selection.value) }],
  }));

  return (
    <Animated.View style={enterStyle}>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${days} days, ${label}`}
      >
        {({ pressed }) => (
          <Animated.View style={[styles.row, pressed && styles.rowPressed, faceStyle]}>
            <Animated.Text allowFontScaling={false} style={[styles.rowDays, daysStyle]}>
              {days} days
            </Animated.Text>
            <View style={styles.rowEnd}>
              <Animated.View style={[styles.badge, badgeStyle]}>
                <Svg width={22} height={22} viewBox="0 0 22 22">
                  <Path
                    d="M6.5 11.5l3 3 6-6.5"
                    stroke={palette.night}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </Animated.View>
              <Text style={styles.rowLabel}>{label}</Text>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', alignItems: 'center', paddingHorizontal: 24 },
  content: { flex: 1, width: '100%', maxWidth: 460, justifyContent: 'center', gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md },
  tileFrame: { minWidth: 56, height: TILE_HEIGHT },
  tile: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: TILE_BAND,
    paddingHorizontal: spacing.sm,
  },
  tileBand: { position: 'absolute', top: 0, left: 0, right: 0, height: TILE_BAND },
  tileFlame: { position: 'absolute', top: -14, alignSelf: 'center' },
  tileSizer: { opacity: 0 },
  tileSizerStacked: { marginTop: -NUMBER_HEIGHT },
  tileLayer: { position: 'absolute', top: 0, left: 0, right: 0 },
  tileNumber: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: NUMBER_HEIGHT,
    color: palette.dayLabel,
    textAlign: 'center',
  },
  tileNumberLit: { color: palette.night },
  track: {
    flex: 1,
    height: TRACK_HEIGHT,
    marginHorizontal: spacing.sm,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
    backgroundColor: palette.dayEmpty,
  },
  trackFill: { ...StyleSheet.absoluteFillObject },
  title: { ...typography.title.title2, fontFamily: fonts.semibold, color: palette.copy, textAlign: 'center' },
  titleAccent: { fontFamily: fonts.semibold, color: palette.label },
  rows: { gap: spacing.sm },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  rowPressed: { marginTop: 2, borderBottomWidth: 2 },
  rowDays: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 24 },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: palette.count },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: palette.dayLabel, flexShrink: 1 },
  promise: { ...typography.body.small, fontFamily: fonts.semibold, color: palette.copy, textAlign: 'center' },
  promiseAccent: { fontFamily: fonts.semibold, color: palette.label },
  button: { width: '100%', maxWidth: 460, paddingBottom: 8 },
});
