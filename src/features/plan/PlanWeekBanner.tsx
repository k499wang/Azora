import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { triggerMediumHaptic } from '../../native/tapHaptics';
import type { PlanCalendarWeek } from './domain/planCalendar';
import { isPlanWeekLocked } from './domain/planPath';
import { planWeekPurpose } from './domain/planWeekPurpose';
import { weekHue } from './weekHue';
import type { ProgramEnrollmentV3 } from '../program/domain/programEnrollment';
import { card, coloredCard } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const LOCK_ICON = 20;
/** How far back past a week's start the page must go before the banner gives that week up. */
const SWITCH_SLACK = spacing.md;

interface WeekBannerProps {
  week: PlanCalendarWeek;
  purpose: string | null;
  isLocked: boolean;
  hue: { base: string; ink: `#${string}` };
  onLockedPress: () => void;
  minHeight?: number;
}

export function WeekBanner({
  week,
  purpose,
  isLocked,
  hue,
  onLockedPress,
  minHeight,
}: WeekBannerProps) {
  const { backgroundColor, borderColor, borderWidth } = coloredCard(hue);
  const face = useSharedValue(backgroundColor as string);
  const edge = useSharedValue(borderColor as string);

  // Colour slides to the new week's rather than cutting, so passing into a week reads as arriving.
  useEffect(() => {
    face.value = withTiming(backgroundColor as string, { duration: duration.base });
    edge.value = withTiming(borderColor as string, { duration: duration.base });
  }, [backgroundColor, borderColor, edge, face]);

  const tintStyle = useAnimatedStyle(() => ({
    backgroundColor: face.value,
    borderColor: edge.value,
  }));

  return (
    <Pressable
      onPress={isLocked ? onLockedPress : undefined}
      accessibilityRole={isLocked ? 'button' : 'header'}
      accessibilityLabel={
        isLocked
          ? `Week ${week.week}, ${week.phaseName}, locked. Subscribe to Azora Pro to unlock the rest of your plan`
          : `Week ${week.week}, ${week.phaseName}`
      }
      style={card.blockShadow}
    >
      <Animated.View
        style={[card.block, { borderWidth, minHeight }, styles.banner, tintStyle]}
      >
        <View style={styles.bannerText}>
          <View style={styles.bannerEyebrowRow}>
            {isLocked ? <Icon name="lock" size={LOCK_ICON} color={colors.text.inverse} /> : null}
            <Text style={styles.bannerEyebrow}>Week {week.week}</Text>
            <Text style={[styles.bannerEyebrow, styles.bannerPhase]}>· {week.phaseName}</Text>
          </View>
          {purpose == null ? null : <Text style={styles.bannerPurpose}>{purpose}</Text>}
        </View>
      </Animated.View>
    </Pressable>
  );
}

interface TopBarWeekBannerProps {
  weeks: readonly PlanCalendarWeek[];
  planId: ProgramEnrollmentV3['planId'];
  isPro: boolean;
  onLockedPress: () => void;
  scrollY: SharedValue<number>;
  /** The path's y in the scroll content, null until laid out. */
  pathTop: SharedValue<number | null>;
  /** Each week's top within the path. */
  weekTops: SharedValue<number[]>;
  /** The scroll content's y at the top of the visible page, below the bar. */
  visibleTop: number;
  /** The banner's final height, once every week has been measured. */
  onSized: (height: number) => void;
}

/**
 * The week on screen, held in the screen's top bar. It names the week whose
 * start has passed under the bar, and takes the tallest week's height so the
 * bar never resizes as it changes.
 */
export function TopBarWeekBanner({
  weeks,
  planId,
  isPro,
  onLockedPress,
  scrollY,
  pathTop,
  weekTops,
  visibleTop,
  onSized,
}: TopBarWeekBannerProps) {
  const [heights, setHeights] = useState<Record<number, number>>({});
  const measured = weeks.every((week) => heights[week.week] != null);
  const bannerHeight = measured
    ? Math.max(...weeks.map((week) => heights[week.week]))
    : undefined;
  const [activeIndex, setActiveIndex] = useState(0);
  const shownIndex = useSharedValue(0);
  const active = weeks[Math.min(activeIndex, weeks.length - 1)];
  const activeLocked = isPlanWeekLocked(active.week, isPro);

  useEffect(() => {
    if (bannerHeight != null) onSized(bannerHeight);
  }, [bannerHeight, onSized]);

  const measureWeek = useCallback((week: number, height: number) => {
    setHeights((prev) => (prev[week] === height ? prev : { ...prev, [week]: height }));
  }, []);

  // A week already shown is only given up once its start is clearly back
  // below the bar, so resting on the line cannot flick between two weeks.
  useAnimatedReaction(
    () => {
      const top = pathTop.value;
      if (top == null) return 0;
      const line = scrollY.value + visibleTop - top;
      const tops = weekTops.value;
      let index = 0;
      for (let at = 1; at < tops.length; at += 1) {
        const reach = at <= shownIndex.value ? line + SWITCH_SLACK : line;
        if (tops[at] <= reach) index = at;
      }
      return index;
    },
    (next, previous) => {
      if (next === previous) return;
      shownIndex.value = next;
      runOnJS(setActiveIndex)(next);
      if (previous != null) runOnJS(triggerMediumHaptic)();
    },
    [visibleTop],
  );

  return (
    <View>
      {/* Every week's banner, unseen, so the one on show takes the tallest height and never resizes. */}
      {weeks.map((week) => (
        <View
          key={week.week}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onLayout={(event) => measureWeek(week.week, event.nativeEvent.layout.height)}
          style={styles.sizer}
        >
          <WeekBanner
            week={week}
            purpose={planWeekPurpose(planId, week.week)}
            isLocked={isPlanWeekLocked(week.week, isPro)}
            hue={weekHue(week.week)}
            onLockedPress={onLockedPress}
          />
        </View>
      ))}
      <WeekBanner
        week={active}
        purpose={planWeekPurpose(planId, active.week)}
        isLocked={activeLocked}
        hue={activeLocked ? colors.playful.stone : weekHue(active.week)}
        onLockedPress={onLockedPress}
        minHeight={bannerHeight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sizer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
  },
  banner: {
    borderBottomWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  bannerText: {
    flex: 1,
    gap: spacing.xs,
  },
  bannerEyebrowRow: {
    minHeight: LOCK_ICON,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bannerPhase: {
    flexShrink: 1,
  },
  bannerEyebrow: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.overline.letterSpacing,
    color: colors.onBlock.textMuted,
  },
  bannerPurpose: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
});
