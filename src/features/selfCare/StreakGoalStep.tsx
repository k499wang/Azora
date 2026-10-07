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
import { easeOutBack, easeOutCubic, mix, phase } from './streakCelebrationMotion';

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
  subtitleAt: 160,
  rowsAt: 200,
  rowStagger: 50,
  rowDuration: 220,
  buttonAt: 460,
  revealDuration: 220,
  end: 700,
} as const;
const TURN_DURATION = 480;
const TURN_SHADE = 0.35;
const TURN_SHADOW = 0.25;
const SELECT_DURATION = 120;
const TILE_WIDTH = 96;
const TILE_BAND = 30;
const TILE_PAGE = 104;
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

  const turn = useSharedValue(1);
  const fromPage = useSharedValue(pageIndex(selectedGoal));
  const toPage = useSharedValue(pageIndex(selectedGoal));
  useEffect(() => {
    const next = pageIndex(selectedGoal);
    if (next === toPage.value) return;
    if (picked) AccessibilityInfo.announceForAccessibility(caption);
    cancelAnimation(turn);
    fromPage.value = reducedMotion ? next : toPage.value;
    toPage.value = next;
    turn.value = reducedMotion ? 1 : 0;
    if (!reducedMotion) {
      turn.value = withTiming(1, { duration: TURN_DURATION, easing: Easing.inOut(Easing.cubic) });
    }
    // Pages and caption are derived from the pick itself; the shared values are the only animation state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGoal]);
  useEffect(() => () => cancelAnimation(turn), [turn]);

  const sheetStyle = useAnimatedStyle(() => {
    const turning = turn.value < 1 && fromPage.value !== toPage.value;
    const angle = 180 * turn.value;
    return {
      opacity: turning ? 1 - phase(angle, 85, 10) : 0,
      transform: [{ perspective: 800 }, { rotateX: `${-angle}deg` }],
    };
  });
  const shadeStyle = useAnimatedStyle(() => ({ opacity: TURN_SHADE * turn.value }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: turn.value < 1 && fromPage.value !== toPage.value ? TURN_SHADOW * (1 - turn.value) : 0,
  }));
  const tileStyle = useAnimatedStyle(() => {
    const pop = phase(clock.value, 0, entrance.popDuration);
    return {
      opacity: easeOutCubic(pop),
      transform: [{ scale: mix(0.85, 1, easeOutBack(pop, 1.6)) }],
    };
  });
  const captionStyle = useClockReveal(clock, entrance.captionAt, entrance.revealDuration, 12);
  const titleStyle = useClockReveal(clock, entrance.titleAt, entrance.revealDuration, 12);
  const subtitleStyle = useClockReveal(clock, entrance.subtitleAt, entrance.revealDuration, 12);
  const buttonStyle = useClockReveal(clock, entrance.buttonAt, entrance.revealDuration, 24);
  const turnState = { turn, fromPage, toPage };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Animated.View
          style={[styles.tile, tileStyle]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {pages.map((page, index) => (
            <TurnLayer key={index} index={index} kind="crossfade" state={turnState} style={[styles.lip, page.goal != null && styles.lipLit]} />
          ))}
          <View style={styles.pageArea}>
            {pages.map((page, index) => (
              <TurnLayer key={index} index={index} kind="under" state={turnState} style={styles.pageLayer}>
                <CalendarPageFace page={page} />
              </TurnLayer>
            ))}
            <Animated.View style={[styles.pageOverlay, shadowStyle]} />
          </View>
          <Animated.View style={[styles.pageArea, styles.sheet, sheetStyle]}>
            {pages.map((page, index) => (
              <TurnLayer key={index} index={index} kind="sheet" state={turnState} style={styles.pageLayer}>
                <CalendarPageFace page={page} />
              </TurnLayer>
            ))}
            <Animated.View style={[styles.pageOverlay, shadeStyle]} />
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.caption, captionStyle]} accessible accessibilityLabel={caption}>
          {pages.map((page, index) => (
            <TurnLayer key={index} index={index} kind="crossfade" state={turnState} style={styles.captionLayer}>
              <Text style={styles.captionText} numberOfLines={1} adjustsFontSizeToFit>
                <Text style={styles.captionAccent}>{page.accent}</Text>
                <Text style={page.goal == null && styles.captionDormant}>{page.rest}</Text>
              </Text>
            </TurnLayer>
          ))}
        </Animated.View>
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>
            Pick your <Text style={styles.titleAccent}>streak goal</Text>
          </Text>
        </Animated.View>
        <Animated.View style={[styles.subtitle, subtitleStyle]}>
          <Text style={styles.subtitleText}>
            You'll be <Text style={styles.titleAccent}>3x</Text> as likely to stick with your routine!
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

interface TurnState {
  turn: SharedValue<number>;
  fromPage: SharedValue<number>;
  toPage: SharedValue<number>;
}

interface TurnLayerProps {
  index: number;
  kind: 'under' | 'sheet' | 'crossfade';
  state: TurnState;
  style: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * One calendar page's layer: the new page waits underneath, the old one is the
 * sheet that turns away, and captions and the lip crossfade across the turn.
 */
function TurnLayer({ index, kind, state, style, children }: TurnLayerProps) {
  const { turn, fromPage, toPage } = state;
  const layerStyle = useAnimatedStyle(() => {
    const from = fromPage.value;
    const to = toPage.value;
    if (kind === 'under') return { opacity: index === to ? 1 : 0 };
    if (kind === 'sheet') return { opacity: index === from ? 1 : 0 };
    const blend = from === to ? 1 : turn.value;
    return { opacity: index === to ? blend : index === from ? 1 - blend : 0 };
  });
  return <Animated.View style={[style, layerStyle]}>{children}</Animated.View>;
}

interface CalendarPageFaceProps {
  page: CalendarPage;
}

function CalendarPageFace({ page }: CalendarPageFaceProps) {
  const lit = page.goal != null;
  return (
    <>
      <View style={[styles.band, lit && styles.bandLit]}>
        <Text style={[styles.month, lit && styles.tileTextLit]}>{page.month}</Text>
      </View>
      <View style={[styles.body, lit && styles.bodyLit]}>
        <Text style={[styles.day, lit && styles.tileTextLit]} numberOfLines={1} adjustsFontSizeToFit>
          {page.day}
        </Text>
      </View>
    </>
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
  tile: { width: TILE_WIDTH, height: TILE_PAGE + TILE_LIP, alignSelf: 'center' },
  lip: {
    position: 'absolute',
    top: TILE_LIP,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: TILE_RADIUS,
    backgroundColor: palette.dormantShadow,
  },
  lipLit: { backgroundColor: palette.copy },
  pageArea: { position: 'absolute', top: 0, left: 0, right: 0, height: TILE_PAGE },
  sheet: { transformOrigin: ['50%', '0%', 0], backfaceVisibility: 'hidden' },
  pageLayer: { ...StyleSheet.absoluteFillObject, borderRadius: TILE_RADIUS, overflow: 'hidden' },
  pageOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: TILE_RADIUS, backgroundColor: palette.night },
  band: { height: TILE_BAND, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.dormantShadow },
  bandLit: { backgroundColor: palette.count },
  month: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18, letterSpacing: 1, color: palette.dayLabel },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: palette.dayEmpty,
  },
  bodyLit: { backgroundColor: palette.flameCore },
  day: { fontFamily: fonts.semibold, fontSize: 48, lineHeight: 60, color: palette.dayLabel, textAlign: 'center' },
  tileTextLit: { color: palette.night },
  caption: { height: CAPTION_HEIGHT },
  captionLayer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center' },
  captionText: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: CAPTION_HEIGHT, color: palette.copy, textAlign: 'center' },
  captionDormant: { color: palette.dayLabel },
  captionAccent: { color: palette.label },
  title: { ...typography.title.title2, fontFamily: fonts.semibold, color: palette.copy, textAlign: 'center' },
  titleAccent: { fontFamily: fonts.semibold, color: palette.label },
  subtitle: { marginTop: -spacing.md },
  subtitleText: { ...typography.body.small, fontFamily: fonts.semibold, color: palette.copy, textAlign: 'center' },
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
