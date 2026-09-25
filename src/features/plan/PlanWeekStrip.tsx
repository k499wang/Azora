/**
 * This week, as seven dated cells — and the weeks behind it, a swipe away.
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
import { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
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

interface PlanWeekStripProps {
  todayLocalDate: string;
  activity: Array<{ activityDate: string; qualifiesForStreak: boolean }>;
  selectedLocalDate: string;
  onSelectDay: (localDate: string) => void;
  /** the colour block the strip sits on; the selected day is a circle of its ink */
  hue: PlayfulHue;
}

export default function PlanWeekStrip({
  todayLocalDate,
  activity,
  selectedLocalDate,
  onSelectDay,
  hue,
}: PlanWeekStripProps) {
  const today = parseLocalDate(todayLocalDate);
  const completedDaysAgo = getCompletedDaysAgoFromActivityDates(
    activity,
    today,
    PLAN_WEEK_STRIP_DAYS,
  );
  // The run ends on this week's Saturday, so every page is one whole Sunday to
  // Saturday week and the last one is the week in play.
  const days = buildWeekCalendarDays(
    todayLocalDate,
    completedDaysAgo,
    PLAN_WEEK_STRIP_DAYS,
    PLAN_WEEK_STRIP_DAYS - DAYS_IN_WEEK + today.getDay(),
  );
  const weeks: WeekCalendarDay[][] = [];
  for (let start = 0; start < days.length; start += DAYS_IN_WEEK) {
    weeks.push(days.slice(start, start + DAYS_IN_WEEK));
  }

  // A page has to be exactly as wide as the strip for paging to land on week
  // boundaries, and the strip is inset by the screen margin, so its width has
  // to be measured rather than taken from the window.
  const [pageWidth, setPageWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const openedForLayout = useRef<string | null>(null);

  const measure = (event: LayoutChangeEvent) => {
    setPageWidth(event.nativeEvent.layout.width);
  };

  // Opens on the week in play rather than eight weeks ago. Waiting for the
  // content size means the jump lands after layout instead of before it.
  const openOnThisWeek = useCallback((contentWidth: number) => {
    // The first content layout can arrive before each page has its measured width.
    if (pageWidth <= 0 || Math.abs(contentWidth - pageWidth * weeks.length) > 1) return;
    const layoutKey = `${todayLocalDate}:${pageWidth}`;
    if (openedForLayout.current === layoutKey) return;
    openedForLayout.current = layoutKey;
    scrollRef.current?.scrollToEnd({ animated: false });
  }, [pageWidth, todayLocalDate, weeks.length]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onLayout={measure}
      onContentSizeChange={openOnThisWeek}
    >
      {weeks.map((week) => (
        <View
          key={week[0].key}
          style={[styles.week, pageWidth > 0 && { width: pageWidth }]}
        >
          {week.map((day) => (
            <Pressable
              key={day.key}
              accessibilityRole="button"
              accessibilityState={{
                disabled: day.isFuture,
                selected: day.localDate === selectedLocalDate,
              }}
              accessibilityLabel={`${day.dayShortLabel} ${day.dateNum}, ${
                day.isCompleted ? 'kept' : day.isFuture ? 'to come' : 'not kept'
              }`}
              disabled={day.isFuture}
              onPress={() => onSelectDay(day.localDate)}
              style={({ pressed }) => [
                styles.cell,
                day.isFuture && styles.cellFuture,
                pressed && styles.cellPressed,
              ]}
            >
              <Text style={styles.letter}>{day.dayShortLabel}</Text>
              <View
                style={[
                  styles.circle,
                  day.isCompleted && styles.circleKept,
                  day.localDate === selectedLocalDate
                    ? { backgroundColor: hue.ink }
                    : day.isToday && styles.circleToday,
                ]}
              >
                <Text
                  style={[
                    styles.dateNum,
                    (day.isToday || day.localDate === selectedLocalDate) && styles.dateNumStrong,
                  ]}
                >
                  {day.dateNum}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Spread rather than seven equal columns, so the first and last circles sit
  // flush with the screen margin — level with the title above and the cards
  // below, instead of inset by half a column of their own.
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    width: CELL_CIRCLE,
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
