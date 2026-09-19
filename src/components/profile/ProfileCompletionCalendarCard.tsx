/**
 * The month: how each day went, and which of them were kept.
 *
 * Two facts, one grid. The circle is how the day felt — the face it was
 * answered with in the check-in, on its own colour — and the dot beneath it
 * says the day was kept. They were two cards for a while, and two month grids
 * stacked on one screen read as the same calendar drawn twice.
 *
 * A day with no check-in keeps its date. Never a low colour: a grid that
 * paints an unanswered day as a bad one marks people down for the days they
 * were too flat to open the app.
 */
import { Text } from '../common/Text';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Icon from '../common/icons/Icon';
import { MOOD_FACES } from '../../features/mood/domain/moodCheckIn';
import {
  moodLevelsByDay,
  type MoodCalendarEntry,
} from '../../lib/moodCalendar';
import { MOOD_FACE_HUE } from '../../features/mood/moodFaceHue';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import { buildCompletionCalendar } from '../../lib/profileCompletionCalendar';
import { triggerTapHaptic } from '../../native/tapHaptics';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CELL_WIDTH = '14.2857%' as const;
/** Both sides of a day cell's gutter, which the circle sits inside. */
const CELL_GUTTER = 4;
/** What `dayCircle` is of its cell; the face fills that circle exactly. */
const CIRCLE_RATIO = 0.86;
/** Until the grid has been measured, and close to where it lands. */
const FALLBACK_FACE_SIZE = 32;
const DOT_SIZE = 5;

interface ProfileCompletionCalendarCardProps {
  monthDate?: Date;
  completedDays: number[];
  /** The check-ins behind the month, newest first; days outside it are ignored. */
  moodEntries?: MoodCalendarEntry[];
  /** Fill the height of a peer column so side-by-side cards match. */
  fill?: boolean;
  /** Opens the day. `localDate` is `YYYY-MM-DD`, as History reads dates. */
  onSelectDay?: (localDate: string) => void;
}

export default function ProfileCompletionCalendarCard({
  monthDate = new Date(),
  completedDays,
  moodEntries = [],
  fill = false,
  onSelectDay,
}: ProfileCompletionCalendarCardProps) {
  const completedSet = useMemo(() => new Set(completedDays), [completedDays]);
  const cells = useMemo(
    () => buildCompletionCalendar(monthDate, completedSet),
    [monthDate, completedSet],
  );
  const levels = useMemo(
    () => moodLevelsByDay(moodEntries, monthDate),
    [moodEntries, monthDate],
  );
  const monthLabel = monthDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const monthPrefix = `${monthDate.getFullYear()}-${String(
    monthDate.getMonth() + 1,
  ).padStart(2, '0')}-`;

  // The circle is a share of a cell, so the face can only match it once the
  // grid has a width. Measured rather than guessed: a face a few points out
  // reads as a wonky circle in a grid of round ones.
  const [faceSize, setFaceSize] = useState(FALLBACK_FACE_SIZE);
  const measureGrid = (event: LayoutChangeEvent) => {
    const cellWidth = event.nativeEvent.layout.width / WEEKDAY_LABELS.length;
    setFaceSize(Math.round((cellWidth - CELL_GUTTER) * CIRCLE_RATIO));
  };

  return (
    <View style={[styles.cardShadow, fill && styles.fill]}>
      <View style={[styles.card, fill && styles.fill]}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>

        <View style={styles.grid} onLayout={measureGrid}>
          {WEEKDAY_LABELS.map((label, index) => (
            <View key={`${label}-${index}`} style={styles.weekdayCell}>
              <Text style={styles.weekdayLabel}>{label}</Text>
            </View>
          ))}

          {cells.map((cell) => {
            const level = cell.isCurrentMonth
              ? levels.get(cell.dayNumber)
              : undefined;
            const hue = level == null ? null : MOOD_FACE_HUE[level];

            // Only this month's days open: a neighbouring month's date is
            // drawn to keep the row square, not to be read as a day of it.
            const openDay =
              onSelectDay == null || !cell.isCurrentMonth
                ? undefined
                : () => {
                    triggerTapHaptic();
                    onSelectDay(
                      `${monthPrefix}${String(cell.dayNumber).padStart(2, '0')}`,
                    );
                  };

            return (
              <Pressable
                key={cell.key}
                accessibilityRole={openDay == null ? undefined : 'button'}
                accessibilityLabel={
                  openDay == null ? undefined : `Open ${monthLabel} ${cell.dayNumber}`
                }
                disabled={openDay == null}
                onPress={openDay}
                style={({ pressed }) => [
                  styles.dayCell,
                  pressed && styles.dayCellPressed,
                ]}
              >
                {/* Today wears its face bare. The day being looked from is not
                    a day to mark up, and a disc there would read as one more
                    answered day rather than as where the grid is now. */}
                <View
                  style={[
                    styles.dayCircle,
                    hue != null && !cell.isToday && { backgroundColor: hue.fill },
                    cell.isToday && level == null && styles.dayCircleToday,
                  ]}
                >
                  {/* One slot, so a face never sits on top of its own date. */}
                  {hue == null || level == null ? (
                    <Text
                      style={[
                        styles.dayLabel,
                        !cell.isCurrentMonth && styles.dayLabelMuted,
                      ]}
                    >
                      {cell.dayNumber}
                    </Text>
                  ) : (
                    <Icon
                      name={MOOD_FACES[level - 1]}
                      size={faceSize}
                      color={cell.isToday ? hue.bare : hue.ink}
                    />
                  )}
                </View>

                {/* Always drawn, so a row of kept days is no taller than a row
                    without one. */}
                <View
                  style={[styles.dot, cell.isCompleted && styles.dotCompleted]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    ...card.blockShadow,
  },
  fill: {
    flex: 1,
  },
  // White surface like every other card on the screen. The only coloured marks
  // are the ones that carry meaning: how a day went, whether it was kept, and
  // today's ring.
  card: {
    ...card.block,
    backgroundColor: colors.background.card,
    padding: spacing.md,
    // The month sits close to the top edge and the weekday row and grid hang
    // further below it, so the dates read as the card's content.
    gap: spacing.lg,
  },
  monthLabel: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 23,
    color: colors.text.primary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // The weekday letters share the day columns so each sits over its own days.
  weekdayCell: {
    width: CELL_WIDTH,
    paddingHorizontal: 2,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  // As large as the dates they head, so the letters read as labels rather than
  // fine print above a grid of numbers.
  weekdayLabel: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  dayCell: {
    width: CELL_WIDTH,
    paddingHorizontal: 2,
    paddingVertical: 1,
    alignItems: 'center',
  },
  // Narrower than its column so the rows sit close together; the circle only
  // has to hold two digits, not fill the cell.
  dayCircle: {
    width: `${CIRCLE_RATIO * 100}%`,
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellPressed: {
    opacity: 0.55,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: colors.playful.sky.ink,
  },
  dayLabel: {
    ...typography.label.medium,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  dayLabelMuted: {
    color: colors.text.tertiary,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  dotCompleted: {
    backgroundColor: colors.playful.sky.base,
  },
});
