/**
 * This week, as seven dated cells — the weeks behind it a swipe away, and next
 * week a swipe the other way, so to-dos planned ahead can be looked at.
 *
 * The score below it says how much of the week was kept; this says which days
 * those were. That split is the only reason both are on the screen: a second
 * rendering of the same number would be the bar-and-cells mistake the week
 * cards used to make.
 *
 * Dated, unlike everything else here. The plan is deliberately counted in days
 * done rather than dates so nobody is ever "behind", but the current week is
 * the one stretch where a real Tuesday is the thing being asked about, and a
 * strip without dates cannot say which Tuesday.
 *
 * No card: it sits on the screen's colour block under the title, so it is
 * drawn in white on the block's hue rather than as a surface of its own.
 *
 * Bare white dates on the block; only the day being read gets a solid circle,
 * today keeps a ring, and a kept day a faint fill behind its number.
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../../components/common/Text';
import type { PlayfulHue } from '../exercise/guidedBreathing/categoryPalette';
import {
  buildWeekCalendarDays,
  getCompletedDaysAgoFromActivityDates,
  parseLocalDate,
  type WeekCalendarDay,
} from '../../lib/calendar/weekCalendarDays';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const DAYS_IN_WEEK = 7;
const CELL_CIRCLE = 36;
const TODAY_RING_WIDTH = 2;
/** A day still to come is present but not yet anything. */
const FUTURE_OPACITY = 0.45;
/** How far back a swipe can go. Beyond this the plan screen is not the place. */
export const PLAN_WEEK_STRIP_WEEKS = 8;
/** Every day those weeks cover, which is what the activity query must load. */
export const PLAN_WEEK_STRIP_DAYS = PLAN_WEEK_STRIP_WEEKS * DAYS_IN_WEEK;
/** Next week, after the current one: far enough to see a to-do planned up to six days out. */
const WEEKS_AHEAD = 1;

interface PlanWeekStripProps {
  todayLocalDate: string;
  activity: Array<{ activityDate: string; qualifiesForStreak: boolean }>;
  selectedLocalDate: string;
  onSelectDay: (localDate: string) => void;
  /** the colour block the strip sits on; the selected day is a circle of its ink */
  hue: PlayfulHue;
}

/** Whole Sunday-to-Saturday weeks, latest first: next week, then the week in play, then earlier ones. */
function buildWeeks(
  todayLocalDate: string,
  activity: PlanWeekStripProps['activity'],
): WeekCalendarDay[][] {
  const today = parseLocalDate(todayLocalDate);
  const completedDaysAgo = getCompletedDaysAgoFromActivityDates(
    activity,
    today,
    PLAN_WEEK_STRIP_DAYS,
  );
  const days = buildWeekCalendarDays(
    todayLocalDate,
    completedDaysAgo,
    PLAN_WEEK_STRIP_DAYS + WEEKS_AHEAD * DAYS_IN_WEEK,
    PLAN_WEEK_STRIP_DAYS - DAYS_IN_WEEK + today.getDay(),
  );
  const weeks: WeekCalendarDay[][] = [];
  for (let start = days.length - DAYS_IN_WEEK; start >= 0; start -= DAYS_IN_WEEK) {
    weeks.push(days.slice(start, start + DAYS_IN_WEEK));
  }
  return weeks;
}

export default function PlanWeekStrip({
  todayLocalDate,
  activity,
  selectedLocalDate,
  onSelectDay,
  hue,
}: PlanWeekStripProps) {
  const weeks = useMemo(
    () => buildWeeks(todayLocalDate, activity),
    [todayLocalDate, activity],
  );
  // Paging lands on week boundaries only if a page is exactly as wide as the
  // strip, which is inset by the screen margin, so it is measured.
  const [pageWidth, setPageWidth] = useState(0);

  const renderWeek = (week: WeekCalendarDay[], style?: StyleProp<ViewStyle>) => (
    <View key={week[0].key} style={[styles.week, style]}>
      {week.map((day) => {
        const selected = day.localDate === selectedLocalDate;
        return (
          <Pressable
            key={day.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${day.dayShortLabel} ${day.dateNum}, ${
              day.isCompleted ? 'kept' : day.isFuture ? 'to come' : 'not kept'
            }`}
            onPress={() => onSelectDay(day.localDate)}
            style={({ pressed }) => [
              styles.cell,
              day.isFuture && !selected && styles.cellFuture,
              pressed && styles.cellPressed,
            ]}
          >
            <Text style={styles.letter}>{day.dayShortLabel}</Text>
            <View
              style={[
                styles.circle,
                day.isCompleted && styles.circleKept,
                selected ? { backgroundColor: hue.ink } : day.isToday && styles.circleToday,
              ]}
            >
              <Text style={[styles.dateNum, (day.isToday || selected) && styles.dateNumStrong]}>
                {day.dateNum}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
      {pageWidth > 0 ? (
        // Mirrored, with each page mirrored back, so earlier weeks lie to the
        // left and next week to the right. It opens one page in, on the week in
        // play, through its initial offset rather than a scroll to wait on.
        <ScrollView
          key={todayLocalDate}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: pageWidth * WEEKS_AHEAD, y: 0 }}
          style={styles.mirrored}
        >
          {weeks.map((week) => renderWeek(week, [styles.mirrored, { width: pageWidth }]))}
        </ScrollView>
      ) : (
        renderWeek(weeks[WEEKS_AHEAD])
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  // Each page owns seven equal columns, independent of date text or selection.
  week: {
    flexDirection: 'row',
    flexShrink: 0,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  cellFuture: {
    opacity: FUTURE_OPACITY,
  },
  cellPressed: {
    opacity: 0.7,
  },
  letter: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.onBlock.textMuted,
  },
  circle: {
    width: CELL_CIRCLE,
    height: CELL_CIRCLE,
    borderRadius: CELL_CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleKept: {
    backgroundColor: colors.onBlock.fill,
  },
  circleToday: {
    borderWidth: TODAY_RING_WIDTH,
    borderColor: colors.text.inverse,
  },
  dateNum: {
    ...typography.label.large,
    color: colors.text.inverse,
    fontVariant: ['tabular-nums'],
  },
  dateNumStrong: {
    fontFamily: fonts.semibold,
  },
});
