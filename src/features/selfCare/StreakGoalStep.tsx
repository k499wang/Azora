import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import ChunkyButton from '../../components/common/ChunkyButton';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerSuccessHaptic } from '../../native/tapHaptics';
import {
  formatStreakGoalFinish,
  STREAK_GOAL_DAYS,
  STREAK_GOAL_LABELS,
  streakGoalFinishDate,
} from './domain/routineFirstCompletion';
import { easeInQuad, easeOutBack, easeOutCubic, mix, phase } from './streakCelebrationMotion';
import { FLAME_BOUNDS, FLAME_PATH, INNER_PATH, MIDDLE_TRANSFORM } from './streakFlameArt';

interface Props {
  streakDays: number;
  selectedGoal: number | null;
  active: boolean;
  onSelect: (days: number) => void;
  onCommit: () => void;
  /** the goal is saved; the picker stamps the calendar, then reports back */
  committing: boolean;
  onCommitFinished: () => void;
}

interface CalendarPage {
  goal: number | null;
  month: string;
  day: string;
  accent: string;
  rest: string;
  finish: string;
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
/** ms from the Commit tap until the picker hands back to the modal. */
export const streakGoalReaction = {
  fadeDuration: 240,
  riseDuration: 380,
  stampAt: 380,
  landAt: 540,
  settleDuration: 260,
  bumpDuration: 220,
  ringDuration: 360,
  confettiDuration: 500,
  captionDuration: 200,
  end: 2000,
  reducedEnd: 700,
} as const;
const STAMP_DROP = 60;
const STAMP_TILT = 12;
const STAMP_WIDTH = 44;
const STAMP_HEIGHT = STAMP_WIDTH * (FLAME_BOUNDS.height / FLAME_BOUNDS.width);
const RISE_SCALE = 1.2;
const BUMP_SCALE = 0.06;
const CONFETTI = [
  { angle: -150, distance: 52, spin: 540, color: palette.coin },
  { angle: -115, distance: 70, spin: -420, color: palette.flameYellow },
  { angle: -80, distance: 44, spin: 600, color: palette.flameOrange },
  { angle: -50, distance: 64, spin: -540, color: palette.coin },
  { angle: -20, distance: 40, spin: 480, color: palette.flameYellow },
  { angle: 15, distance: 58, spin: -600, color: palette.flameOrange },
].map(chip => ({ ...chip, angle: (chip.angle * Math.PI) / 180 }));
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

/** Duolingo's "next streak goal": nothing preselected, so committing is an active choice. */
export default function StreakGoalStep({
  streakDays,
  selectedGoal,
  active,
  onSelect,
  onCommit,
  committing,
  onCommitFinished,
}: Props) {
  const reducedMotion = useReducedMotion();
  const picked = selectedGoal != null;
  const [today] = useState(() => new Date());
  const current = useMemo<CalendarPage>(() => {
    if (selectedGoal == null) {
      return { goal: null, month: 'GOAL', day: '?', accent: '', rest: DORMANT_CAPTION, finish: '' };
    }
    const finish = formatStreakGoalFinish(streakGoalFinishDate(today, streakDays, selectedGoal));
    return {
      goal: selectedGoal,
      month: finish.month,
      day: finish.day,
      accent: `Day ${selectedGoal}`,
      rest: ` lands on ${finish.label}`,
      finish: finish.label,
    };
  }, [selectedGoal, streakDays, today]);
  const committedRest = ` See you on ${current.finish}`;
  const caption = committing ? `Committed!${committedRest}` : current.accent + current.rest;

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

  useEffect(() => {
    if (picked) AccessibilityInfo.announceForAccessibility(caption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGoal]);
  const commit = useSharedValue(0);
  const committedCaption = useSharedValue(0);
  const tileOffset = useSharedValue(0);
  const tileHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const onFinishedRef = useRef(onCommitFinished);
  useEffect(() => {
    onFinishedRef.current = onCommitFinished;
  }, [onCommitFinished]);
  useEffect(() => {
    if (!committing) {
      commit.value = 0;
      committedCaption.value = 0;
      return;
    }
    if (!active) return;
    triggerSuccessHaptic();
    AccessibilityInfo.announceForAccessibility(`Goal set. See you on ${current.finish}`);
    if (reducedMotion) {
      committedCaption.value = 1;
    } else {
      commit.value = 0;
      commit.value = withTiming(streakGoalReaction.end, {
        duration: streakGoalReaction.end,
        easing: Easing.linear,
      });
      committedCaption.value = withDelay(
        streakGoalReaction.landAt,
        withTiming(1, { duration: streakGoalReaction.captionDuration, ...outCubic }),
      );
    }
    const cancel = startUiTimer(
      reducedMotion ? streakGoalReaction.reducedEnd : streakGoalReaction.end,
      () => onFinishedRef.current(),
    );
    return () => {
      cancel();
      cancelAnimation(commit);
      cancelAnimation(committedCaption);
    };
    // The reaction is a snapshot of the committed goal; leaving cancels it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, committing, reducedMotion]);
  const onContentLayout = (event: LayoutChangeEvent) => {
    contentHeight.value = event.nativeEvent.layout.height;
  };
  const onTileLayout = (event: LayoutChangeEvent) => {
    tileOffset.value = event.nativeEvent.layout.y;
    tileHeight.value = event.nativeEvent.layout.height;
  };

  const tileStyle = useAnimatedStyle(() => {
    const pop = phase(clock.value, 0, entrance.popDuration);
    const rise = easeOutCubic(phase(commit.value, 0, streakGoalReaction.riseDuration));
    const bump = Math.sin(Math.PI * phase(commit.value, streakGoalReaction.landAt, streakGoalReaction.bumpDuration));
    const centre = contentHeight.value / 2 - (tileOffset.value + tileHeight.value / 2);
    return {
      opacity: easeOutCubic(pop),
      transform: [
        { translateY: centre * rise },
        { scale: mix(0.85, 1, easeOutBack(pop, 1.6)) * (mix(1, RISE_SCALE, rise) + BUMP_SCALE * bump) },
      ],
    };
  });
  const captionStyle = useAnimatedStyle(() => {
    const reveal = easeOutCubic(phase(clock.value, entrance.captionAt, entrance.revealDuration));
    const rise = easeOutCubic(phase(commit.value, 0, streakGoalReaction.riseDuration));
    const centre = contentHeight.value / 2 - (tileOffset.value + tileHeight.value / 2);
    return {
      opacity: reveal,
      transform: [{ translateY: (1 - reveal) * 12 + rise * (centre + ((RISE_SCALE - 1) * tileHeight.value) / 2) }],
    };
  });
  const selectionCaptionStyle = useAnimatedStyle(() => ({ opacity: 1 - committedCaption.value }));
  const committedCaptionStyle = useAnimatedStyle(() => ({ opacity: committedCaption.value }));
  const stampStyle = useAnimatedStyle(() => {
    const c = commit.value;
    const fall = easeInQuad(phase(c, streakGoalReaction.stampAt, streakGoalReaction.landAt - streakGoalReaction.stampAt));
    const settle = phase(c, streakGoalReaction.landAt, streakGoalReaction.settleDuration);
    const damp = c < streakGoalReaction.landAt ? 0 : Math.exp(-5 * settle) * Math.cos(3 * Math.PI * settle) * (1 - settle);
    return {
      opacity: phase(c, streakGoalReaction.stampAt, 60),
      transform: [
        { translateY: -STAMP_DROP * (1 - fall) },
        { rotate: `${STAMP_TILT}deg` },
        { scaleX: 1 + 0.2 * damp },
        { scaleY: 1 - 0.3 * damp },
      ],
    };
  });
  const ringStyle = useAnimatedStyle(() => {
    const r = phase(commit.value, streakGoalReaction.landAt, streakGoalReaction.ringDuration);
    const eased = easeOutCubic(r);
    return {
      opacity: r > 0 ? 1 - eased : 0,
      borderWidth: mix(6, 1, eased),
      transform: [{ scale: mix(0.9, 1.5, eased) }],
    };
  });
  const commitFadeState = { commit };
  const titleStyle = useClockReveal(clock, entrance.titleAt, entrance.revealDuration, 12, commitFadeState);
  const subtitleStyle = useClockReveal(clock, entrance.subtitleAt, entrance.revealDuration, 12, commitFadeState);
  const buttonStyle = useClockReveal(clock, entrance.buttonAt, entrance.revealDuration, 24, commitFadeState);

  return (
    <View style={styles.screen}>
      <View style={styles.content} onLayout={onContentLayout}>
        <Animated.View
          style={[styles.tile, tileStyle]}
          onLayout={onTileLayout}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Animated.View style={[styles.ring, ringStyle]} />
          <View style={[styles.lip, picked && styles.lipLit]} />
          <View style={styles.pageArea}>
            <View style={styles.pageLayer}>
              <CalendarPageFace page={current} />
            </View>
          </View>
          <Animated.View style={[styles.stamp, stampStyle]}>
            <StampFlame />
          </Animated.View>
          {CONFETTI.map((_, index) => (
            <ConfettiChip key={index} index={index} commit={commit} />
          ))}
        </Animated.View>
        <Animated.View style={[styles.caption, captionStyle]} accessible accessibilityLabel={caption}>
          <Animated.View style={[styles.captionLayer, selectionCaptionStyle]}>
            <Text style={styles.captionText} numberOfLines={1} adjustsFontSizeToFit>
              <Text style={styles.captionAccent}>{current.accent}</Text>
              <Text style={!picked && styles.captionDormant}>{current.rest}</Text>
            </Text>
          </Animated.View>
          <Animated.View style={[styles.captionLayer, committedCaptionStyle]}>
            <Text style={styles.captionText} numberOfLines={1} adjustsFontSizeToFit>
              <Text style={styles.captionAccent}>Committed!</Text>
              {committedRest}
            </Text>
          </Animated.View>
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
        <View style={styles.rows} accessibilityRole="radiogroup" pointerEvents={committing ? 'none' : 'auto'}>
          {STREAK_GOAL_DAYS.map((days, index) => (
            <GoalRow
              key={days}
              days={days}
              index={index}
              clock={clock}
              commit={commit}
              selected={days === selectedGoal}
              reducedMotion={reducedMotion}
              onPress={() => onSelect(days)}
            />
          ))}
        </View>
      </View>
      <Animated.View style={[styles.button, buttonStyle]} pointerEvents={committing ? 'none' : 'auto'}>
        <ChunkyButton label="COMMIT TO MY GOAL" onPress={onCommit} disabled={!picked} shape="card" minHeight={48} />
      </Animated.View>
    </View>
  );
}

interface CommitFade {
  commit: SharedValue<number>;
}

function useClockReveal(
  clock: SharedValue<number>,
  at: number,
  duration: number,
  distance: number,
  { commit }: CommitFade,
) {
  return useAnimatedStyle(() => {
    const progress = easeOutCubic(phase(clock.value, at, duration));
    const fade = commitFade(commit.value);
    return {
      opacity: progress * (1 - fade),
      transform: [{ translateY: (1 - progress) * distance + fade * 16 }],
    };
  });
}

function commitFade(c: number): number {
  'worklet';
  return easeInQuad(phase(c, 0, streakGoalReaction.fadeDuration));
}

function StampFlame() {
  return (
    <Svg
      width={STAMP_WIDTH}
      height={STAMP_HEIGHT}
      viewBox={`${FLAME_BOUNDS.x} ${FLAME_BOUNDS.y} ${FLAME_BOUNDS.width} ${FLAME_BOUNDS.height}`}
    >
      <Defs>
        <LinearGradient id="streakGoalStampMiddle" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.flameRed} />
          <Stop offset="1" stopColor={palette.flameOrange} />
        </LinearGradient>
      </Defs>
      <Path d={FLAME_PATH} fill={palette.flameYellow} />
      <Path d={FLAME_PATH} fill="url(#streakGoalStampMiddle)" transform={MIDDLE_TRANSFORM.svg} />
      <Path d={INNER_PATH} fill={palette.flameCore} />
    </Svg>
  );
}

interface ConfettiChipProps {
  index: number;
  commit: SharedValue<number>;
}

function ConfettiChip({ index, commit }: ConfettiChipProps) {
  const chip = CONFETTI[index];
  const chipStyle = useAnimatedStyle(() => {
    const f = phase(commit.value, streakGoalReaction.landAt, streakGoalReaction.confettiDuration);
    const reach = easeOutCubic(f) * chip.distance;
    return {
      opacity: f > 0 ? 1 - easeInQuad(f) : 0,
      transform: [
        { translateX: Math.cos(chip.angle) * reach },
        { translateY: Math.sin(chip.angle) * reach + 30 * f * f },
        { rotate: `${chip.spin * easeOutCubic(f)}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.chip, { backgroundColor: chip.color }, chipStyle]} />;
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
  commit: SharedValue<number>;
  selected: boolean;
  reducedMotion: boolean;
  onPress: () => void;
}

function GoalRow({ days, index, clock, commit, selected, reducedMotion, onPress }: GoalRowProps) {
  const label = STREAK_GOAL_LABELS[days];
  const selection = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    const target = selected ? 1 : 0;
    selection.value = reducedMotion ? target : withTiming(target, { duration: SELECT_DURATION, ...outCubic });
  }, [reducedMotion, selected, selection]);
  const rowAt = entrance.rowsAt + index * entrance.rowStagger;
  const enterStyle = useAnimatedStyle(() => {
    const progress = easeOutCubic(phase(clock.value, rowAt, entrance.rowDuration));
    const fade = commitFade(commit.value);
    return { opacity: progress * (1 - fade), transform: [{ translateY: (1 - progress) * 16 + fade * 16 }] };
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
  tile: { width: TILE_WIDTH, height: TILE_PAGE + TILE_LIP, alignSelf: 'center', zIndex: 1 },
  ring: {
    position: 'absolute',
    top: -spacing.sm,
    left: -spacing.sm,
    right: -spacing.sm,
    bottom: -spacing.sm,
    borderRadius: TILE_RADIUS + spacing.sm,
    borderColor: palette.ember,
  },
  stamp: {
    position: 'absolute',
    zIndex: 2,
    left: TILE_WIDTH - STAMP_WIDTH * 0.6,
    top: TILE_BAND - STAMP_HEIGHT * 0.75,
    transformOrigin: ['50%', '100%', 0],
  },
  chip: {
    position: 'absolute',
    zIndex: 2,
    left: TILE_WIDTH - spacing.md,
    top: TILE_BAND / 2,
    width: 6,
    height: 4,
    borderRadius: 1,
  },
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
  pageLayer: { ...StyleSheet.absoluteFillObject, borderRadius: TILE_RADIUS, overflow: 'hidden' },
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
