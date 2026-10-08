import { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { triggerMediumHaptic, triggerTapHaptic } from '../../native/tapHaptics';
import type { PlanCalendarWeek } from './domain/planCalendar';
import { planWeekPurpose } from './domain/planWeekPurpose';
import type { ProgramEnrollmentV3 } from '../program/domain/programEnrollment';
import type { PlanWeekPin } from './usePlanWeekPin';
import { card, coloredCard } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const LOCK_ICON = 20;
/** How far back past a week's start the page must go before the banner gives that week up. */
const SWITCH_SLACK = spacing.md;

/** Each week takes the next hue, so scrolling the path reads as moving through it. */
const WEEK_HUES = [
  colors.playful.sky,
  colors.playful.teal,
  colors.playful.violet,
  colors.playful.coral,
] as const;

export function weekHue(week: number) {
  return WEEK_HUES[(week - 1) % WEEK_HUES.length];
}

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

interface PinnedWeekBannerProps {
  pin: PlanWeekPin;
  weeks: readonly PlanCalendarWeek[];
  planId: ProgramEnrollmentV3['planId'];
  isPro: boolean;
  onLockedPress: () => void;
}

/**
 * Once laid out, one banner follows the path on the UI thread, then stops at the pin line.
 * Keeping the same visible view on both sides of that line avoids a handoff
 * between scrolling content and a fixed copy during native scrolling.
 *
 * The frame carries the animated opacity and is kept from re-rendering: a
 * render hands an animated view a stale value for a frame. The week lives in
 * the child.
 */
export const PinnedWeekBanner = memo(function PinnedWeekBanner(props: PinnedWeekBannerProps) {
  const { scrollY, stickTop, origin, overlayReady, inlineHeight, shown, measuredWeekCount, bannerHeight } = props.pin;
  const laidOutHeight = useSharedValue(0);
  const weekCount = props.weeks.length;

  useEffect(() => () => {
    overlayReady.value = false;
    inlineHeight.value = 0;
  }, [overlayReady, inlineHeight]);

  useAnimatedReaction(
    () => origin.value != null
      && measuredWeekCount === weekCount
      && bannerHeight > 0
      && Math.abs(inlineHeight.value - bannerHeight) < 1
      && Math.abs(laidOutHeight.value - bannerHeight) < 1,
    (ready) => {
      // Once shown it stays: inline and overlay take any later height in the same commit.
      if (ready) overlayReady.value = true;
    },
    [bannerHeight, measuredWeekCount, weekCount],
  );

  const shownStyle = useAnimatedStyle(() => {
    const start = origin.value;
    return {
      opacity: start != null && overlayReady.value ? shown.value : 0,
      transform: [{ translateY: start == null ? 0 : Math.max(0, start - scrollY.value - stickTop) }],
    };
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      onLayout={(event) => {
        // Reveal only after both layouts match the complete week measurements.
        laidOutHeight.value = event.nativeEvent.layout.height;
      }}
      style={shownStyle}
    >
      <ActiveWeekBanner {...props} />
    </Animated.View>
  );
});

function ActiveWeekBanner({ pin, weeks, planId, isPro, onLockedPress }: PinnedWeekBannerProps) {
  const { scrollY, stickTop, origin, weekTops, bannerHeight, measureWeek } = pin;
  const shownIndex = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pinned, setPinned] = useState(false);
  const active = weeks[Math.min(activeIndex, weeks.length - 1)];
  const activeLocked = !isPro && active.week >= 2;

  const handleLockedPress = useCallback(() => {
    triggerTapHaptic();
    onLockedPress();
  }, [onLockedPress]);

  useAnimatedReaction(
    () => {
      const start = origin.value;
      return start != null && start - scrollY.value <= stickTop;
    },
    (next, previous) => {
      if (next !== previous) runOnJS(setPinned)(next);
    },
    [stickTop],
  );

  // The banner is the week whose start has passed under it. A week already
  // shown is only given up once its start is clearly back below the line, so
  // resting on the line or a bounce at the edge cannot flick between two weeks.
  useAnimatedReaction(
    () => {
      const start = origin.value;
      if (start == null || start - scrollY.value > stickTop) return 0;
      const line = stickTop + bannerHeight - start + scrollY.value;
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
    [stickTop, bannerHeight],
  );

  return (
    <View pointerEvents={pinned ? 'box-none' : 'none'}>
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
            isLocked={!isPro && week.week >= 2}
            hue={weekHue(week.week)}
            onLockedPress={onLockedPress}
          />
        </View>
      ))}
      <View
        accessibilityElementsHidden={!pinned}
        importantForAccessibility={pinned ? 'auto' : 'no-hide-descendants'}
      >
        <WeekBanner
          week={active}
          purpose={planWeekPurpose(planId, active.week)}
          isLocked={activeLocked}
          hue={activeLocked ? colors.playful.stone : weekHue(active.week)}
          onLockedPress={handleLockedPress}
          minHeight={bannerHeight}
        />
      </View>
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
