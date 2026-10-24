import type { PressureLessonTrack } from '../lessons/domain/pressureLessonTrack';
import type { PhoneLessonTrack } from '../lessons/domain/phoneLessonTrack';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
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
  fill?: boolean;
}

export function WeekBanner({
  week,
  purpose,
  isLocked,
  hue,
  onLockedPress,
  fill = false,
}: WeekBannerProps) {
  const { backgroundColor, borderColor, borderWidth } = coloredCard(hue);
  // Colour slides to the new week's rather than cutting, so passing into a week reads as arriving.
  // A CSS transition keeps the target colour in props, so a re-render can never restore a stale one.
  const tintStyle = {
    backgroundColor,
    borderColor,
    transitionProperty: ['backgroundColor', 'borderColor'],
    transitionDuration: duration.base,
  } as const;

  return (
    <Pressable
      onPress={isLocked ? onLockedPress : undefined}
      accessibilityRole={isLocked ? 'button' : 'header'}
      accessibilityLabel={
        isLocked
          ? `Week ${week.week}, ${week.phaseName}, locked. Subscribe to Azora Pro to unlock the rest of your plan`
          : `Week ${week.week}, ${week.phaseName}`
      }
      style={[card.blockShadow, fill && styles.fill]}
    >
      <Animated.View
        style={[card.block, { borderWidth }, styles.banner, tintStyle, fill && styles.fill]}
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
  phoneLessonTrack?: PhoneLessonTrack;
  pressureLessonTrack?: PressureLessonTrack;
  presetRevision?: number;
  isPro: boolean;
  onLockedPress: () => void;
  scrollY: SharedValue<number>;
  /** The path's y in the scroll content, null until laid out. */
  pathTop: SharedValue<number | null>;
  /** Each week's top within the path. */
  weekTops: SharedValue<number[]>;
}

/**
 * The week on screen, held in the screen's top bar. It names the week whose
 * start has passed under the bar, and takes the tallest week's height so the
 * bar never resizes as it changes.
 */
export function TopBarWeekBanner({
  weeks,
  planId,
  phoneLessonTrack,
  pressureLessonTrack,
  presetRevision,
  isPro,
  onLockedPress,
  scrollY,
  pathTop,
  weekTops,
}: TopBarWeekBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const shownIndex = useSharedValue(0);
  const active = weeks[Math.min(activeIndex, weeks.length - 1)];
  const activeLocked = isPlanWeekLocked(active.week, isPro);

  // A week already shown is only given up once its start is clearly back
  // below the bar, so resting on the line cannot flick between two weeks.
  useAnimatedReaction(
    () => {
      const top = pathTop.value;
      if (top == null) return 0;
      const line = scrollY.value - top;
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
  );

  return (
    <View>
      {/* Full-width siblings give native layout the tallest card height on its first pass. */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.sizers}
      >
        {weeks.map((week) => (
          <View key={week.week} style={styles.sizer}>
            <WeekBanner
              week={week}
              purpose={planWeekPurpose(planId, week.week, phoneLessonTrack, pressureLessonTrack, presetRevision)}
              isLocked={isPlanWeekLocked(week.week, isPro)}
              hue={weekHue(week.week)}
              onLockedPress={onLockedPress}
            />
          </View>
        ))}
      </View>
      <View style={StyleSheet.absoluteFill}>
        <WeekBanner
          week={active}
          purpose={planWeekPurpose(planId, active.week, phoneLessonTrack, pressureLessonTrack, presetRevision)}
          isLocked={activeLocked}
          hue={activeLocked ? colors.playful.stone : weekHue(active.week)}
          onLockedPress={onLockedPress}
          fill
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sizers: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    opacity: 0,
  },
  sizer: {
    width: '100%',
    flexShrink: 0,
  },
  fill: { flex: 1 },
  banner: {
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
