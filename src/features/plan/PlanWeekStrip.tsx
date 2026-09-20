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
 * No card and no fill: it sits on the canvas under the title, because the
 * first card on this page should be the score. A card here would open the page
 * on two cards about the same week.
 *
 * A day is a circle either way — dotted while it is still only a date, solid
 * once it was kept. So a week reads as seven slots waiting to be filled rather
 * than as one mark floating in a row of bare numbers.
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
/** Thick enough for the dots to read at this diameter. */
const DOTTED_WIDTH = 2;
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
}

export default function PlanWeekStrip({
  todayLocalDate,
  activity,
  selectedLocalDate,
  onSelectDay,
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
                  day.isCompleted && styles.circleDone,
                  day.isToday && !day.isCompleted && styles.circleToday,
                  day.localDate === selectedLocalDate &&
                    !day.isCompleted && styles.circleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dateNum,
                    day.isCompleted && styles.dateNumDone,
                    day.isToday && !day.isCompleted && styles.dateNumToday,
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
    color: colors.text.secondary,
  },
  // Dotted until the day is kept: an outline that is clearly not a solid one,
  // so an empty day reads as waiting rather than as missed.
  circle: {
    width: CELL_CIRCLE,
    height: CELL_CIRCLE,
    borderRadius: CELL_CIRCLE / 2,
    borderWidth: DOTTED_WIDTH,
    borderStyle: 'dotted',
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    borderStyle: 'solid',
    borderColor: colors.playful.sky.base,
    backgroundColor: colors.playful.sky.base,
  },
  circleToday: {
    borderStyle: 'solid',
    borderColor: colors.playful.sky.ink,
  },
  circleSelected: {
    backgroundColor: colors.playful.sky.soft,
  },
  dateNum: {
    ...typography.label.large,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  dateNumDone: {
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  dateNumToday: {
    fontFamily: fonts.semibold,
    color: colors.playful.sky.ink,
  },
});
