import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import ChunkyButton from '../../components/common/ChunkyButton';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  formatStreakGoalFinish,
  STREAK_GOAL_DAYS,
  STREAK_GOAL_LABELS,
  streakGoalFinishDate,
} from './domain/routineFirstCompletion';
import { easeInOutCubic, easeInQuad, easeOutBack, easeOutCubic, mix, phase } from './streakCelebrationMotion';

interface Props {
  streakDays: number;
  selectedGoal: number | null;
  active: boolean;
  onSelect: (days: number) => void;
  onCommit: () => void;
}

interface CalendarPage {
  goal: number | null;
  month: string;
  day: string;
  accent: string;
  rest: string;
}

const palette = colors.streakCelebration;
const entrance = {
  popDuration: 360,
  captionAt: 80,
  titleAt: 120,
  rowsAt: 200,
  rowStagger: 50,
  rowDuration: 220,
  buttonAt: 460,
  revealDuration: 220,
  end: 700,
} as const;
const FLIP_DOWN = 140;
const FLIP_UP = 160;
const FLIP_DURATION = FLIP_DOWN + FLIP_UP;
const FLIP_SWAP = FLIP_DOWN / FLIP_DURATION;
const FLIP_SETTLE = 1;
const BAND_BLEND = 0.1;
const SELECT_DURATION = 120;
const TILE_WIDTH = 96;
const TILE_BAND = 30;
const TILE_BODY = 78;
const TILE_RADIUS = 18;
const TILE_LIP = 4;
const CAPTION_HEIGHT = 24;
const ROW_HEIGHT = 64;
const ROW_LIP = 4;
const PRESS_DROP = 2;
const DORMANT_CAPTION = 'Pick a goal to see your finish line';
const outCubic = { easing: Easing.out(Easing.cubic) };

const pageIndex = (goal: number | null) => (goal == null ? 0 : STREAK_GOAL_DAYS.indexOf(goal) + 1);

/** Duolingo's "next streak goal": nothing preselected, so committing is an active choice. */
export default function StreakGoalStep({ streakDays, selectedGoal, active, onSelect, onCommit }: Props) {
  const reducedMotion = useReducedMotion();
  const picked = selectedGoal != null;
  const [today] = useState(() => new Date());
  const pages = useMemo<CalendarPage[]>(
    () => [
      { goal: null, month: 'GOAL', day: '?', accent: '', rest: DORMANT_CAPTION },
      ...STREAK_GOAL_DAYS.map(goal => {
        const finish = formatStreakGoalFinish(streakGoalFinishDate(today, streakDays, goal));
        return { goal, month: finish.month, day: finish.day, accent: `Day ${goal}`, rest: ` lands on ${finish.label}` };
      }),
    ],
    [streakDays, today],
  );
  const current = pages[pageIndex(selectedGoal)];
  const caption = current.accent + current.rest;

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

  const flip = useSharedValue(1);
  const fromPage = useSharedValue(pageIndex(selectedGoal));
  const toPage = useSharedValue(pageIndex(selectedGoal));
  useEffect(() => {
    const next = pageIndex(selectedGoal);
    if (next === toPage.value) return;
    if (picked) AccessibilityInfo.announceForAccessibility(caption);
    if (reducedMotion) {
      cancelAnimation(flip);
      fromPage.value = next;
      toPage.value = next;
      flip.value = 1;
      return;
    }
    // Before the swap the old page is still showing, so a re-pick keeps flipping it toward the newest page.
    const start = flip.value < FLIP_SWAP ? flip.value : 0;
    if (start === 0) fromPage.value = toPage.value;
    toPage.value = next;
    flip.value = start;
    flip.value = withTiming(1, { duration: FLIP_DURATION * (1 - start), easing: Easing.linear });
    // Pages and caption are derived from the pick itself; the shared values are the only animation state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGoal]);
  useEffect(() => () => cancelAnimation(flip), [flip]);

  const bodyStyle = useAnimatedStyle(() => {
    const f = flip.value;
    const angle =
      f < FLIP_SWAP
        ? 90 * easeInQuad(f / FLIP_SWAP)
        : -90 * (1 - easeOutBack((f - FLIP_SWAP) / (1 - FLIP_SWAP), FLIP_SETTLE));
    return { transform: [{ perspective: 600 }, { rotateX: `${angle}deg` }] };
  });
  const tileStyle = useAnimatedStyle(() => {
    const pop = phase(clock.value, 0, entrance.popDuration);
    return {
      opacity: easeOutCubic(pop),
      transform: [{ scale: mix(0.85, 1, easeOutBack(pop, 1.6)) }],
    };
  });
  const captionStyle = useClockReveal(clock, entrance.captionAt, entrance.revealDuration, 12);
  const titleStyle = useClockReveal(clock, entrance.titleAt, entrance.revealDuration, 12);
  const buttonStyle = useClockReveal(clock, entrance.buttonAt, entrance.revealDuration, 24);
  const flipState = { flip, fromPage, toPage };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Animated.View
          style={[styles.tile, tileStyle]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.band}>
            {pages.map((page, index) => (
              <FlipLayer key={index} index={index} kind="band" state={flipState} style={[styles.bandLayer, page.goal != null && styles.bandLit]}>
                <Text style={[styles.month, page.goal != null && styles.tileTextLit]}>{page.month}</Text>
              </FlipLayer>
            ))}
          </View>
          <Animated.View style={[styles.body, bodyStyle]}>
            {pages.map((page, index) => (
              <FlipLayer key={index} index={index} kind="face" state={flipState} style={[styles.bodyLayer, page.goal != null && styles.bodyLit]}>
                <Text
                  style={[styles.day, page.goal != null && styles.tileTextLit]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {page.day}
                </Text>
              </FlipLayer>
            ))}
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.caption, captionStyle]} accessible accessibilityLabel={caption}>
          {pages.map((page, index) => (
            <FlipLayer key={index} index={index} kind="caption" state={flipState} style={styles.captionLayer}>
              <Text style={styles.captionText} numberOfLines={1} adjustsFontSizeToFit>
                <Text style={styles.captionAccent}>{page.accent}</Text>
                <Text style={page.goal == null && styles.captionDormant}>{page.rest}</Text>
              </Text>
            </FlipLayer>
          ))}
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

interface FlipState {
  flip: SharedValue<number>;
  fromPage: SharedValue<number>;
  toPage: SharedValue<number>;
}

interface FlipLayerProps {
  index: number;
  kind: 'face' | 'band' | 'caption';
  state: FlipState;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * One calendar page's layer. The tile face swaps while edge-on; the band blends
 * briefly around the swap; the caption crossfades across the whole flip.
 */
function FlipLayer({ index, kind, state, style, children }: FlipLayerProps) {
  const { flip, fromPage, toPage } = state;
  const layerStyle = useAnimatedStyle(() => {
    const from = fromPage.value;
    const to = toPage.value;
    const blend =
      kind === 'face'
        ? (flip.value < FLIP_SWAP ? 0 : 1)
        : kind === 'band'
          ? easeInOutCubic(phase(flip.value, FLIP_SWAP - BAND_BLEND, BAND_BLEND * 2))
          : easeInOutCubic(flip.value);
    const opacity = index === to ? (from === to ? 1 : blend) : index === from ? 1 - blend : 0;
    return { opacity };
  });
  return <Animated.View style={[style, layerStyle]}>{children}</Animated.View>;
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
              <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
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
  tile: { width: TILE_WIDTH, height: TILE_BAND + TILE_BODY, alignSelf: 'center' },
  band: {
    height: TILE_BAND,
    borderTopLeftRadius: TILE_RADIUS,
    borderTopRightRadius: TILE_RADIUS,
    overflow: 'hidden',
  },
  bandLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.dormantShadow,
  },
  bandLit: { backgroundColor: palette.count },
  month: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18, letterSpacing: 1, color: palette.dayLabel },
  body: { height: TILE_BODY, transformOrigin: ['50%', '0%', 0] },
  bodyLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomLeftRadius: TILE_RADIUS,
    borderBottomRightRadius: TILE_RADIUS,
    borderBottomWidth: TILE_LIP,
    backgroundColor: palette.dayEmpty,
    borderColor: palette.dormantShadow,
  },
  bodyLit: { backgroundColor: palette.flameCore, borderColor: palette.copy },
  day: { fontFamily: fonts.semibold, fontSize: 48, lineHeight: 60, color: palette.dayLabel, textAlign: 'center' },
  tileTextLit: { color: palette.night },
  caption: { height: CAPTION_HEIGHT },
  captionLayer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center' },
  captionText: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: CAPTION_HEIGHT, color: palette.copy, textAlign: 'center' },
  captionDormant: { color: palette.dayLabel },
  captionAccent: { color: palette.label },
  title: { ...typography.title.title2, fontFamily: fonts.semibold, color: palette.copy, textAlign: 'center' },
  titleAccent: { fontFamily: fonts.semibold, color: palette.label },
  rows: { gap: spacing.sm },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: ROW_LIP,
  },
  rowPressed: { marginTop: PRESS_DROP, height: ROW_HEIGHT - PRESS_DROP, borderBottomWidth: ROW_LIP - PRESS_DROP },
  rowDays: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 24 },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: palette.count },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: palette.dayLabel, flexShrink: 1 },
  button: { width: '100%', maxWidth: 460, paddingBottom: 8 },
});
