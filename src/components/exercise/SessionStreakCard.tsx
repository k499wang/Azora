import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import {
  buildWeekCalendarDays,
  formatLocalDate,
} from '../../lib/calendar/weekCalendarDays';
import { buildWeeklyProgress, WEEK_LENGTH_DAYS } from '../../lib/weeklyProgress';

interface Props {
  currentStreak: number;
  completedDaysAgo: readonly number[];
}

export default function SessionStreakCard({
  currentStreak,
  completedDaysAgo,
}: Props) {
  const progress = useMemo(
    () => buildWeeklyProgress(completedDaysAgo),
    [completedDaysAgo],
  );

  const days = useMemo(
    () =>
      buildWeekCalendarDays(
        formatLocalDate(new Date()),
        [...completedDaysAgo],
        WEEK_LENGTH_DAYS,
      ),
    [completedDaysAgo],
  );

  const remaining = Math.max(0, progress.goal - progress.daysCompleted);
  const footerLabel = progress.goalMet
    ? `${progress.goal} active days in the last 7 — weekly goal reached`
    : `${remaining} more day${remaining === 1 ? '' : 's'} to reach your weekly goal`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconWell}>
          <Icon name="streak" size={24} color={colors.orange[500]} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.streakValue}>{currentStreak}</Text>
          <Text style={styles.streakUnit}>
            day{currentStreak === 1 ? '' : 's'} in a row
          </Text>
        </View>

        <View style={[styles.pill, progress.goalMet && styles.pillMet]}>
          <Text style={[styles.pillLabel, progress.goalMet && styles.pillLabelMet]}>
            {progress.daysCompleted}/{progress.goal}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.weekRow}>
        {days.map((day) => (
          <View key={day.key} style={styles.dayItem}>
            <Text
              style={[
                styles.dayLabel,
                day.isCompleted && styles.dayLabelDone,
                day.isFuture && styles.dayLabelFuture,
              ]}
            >
              {day.dayLabel}
            </Text>
            <View
              style={[
                styles.dayCell,
                day.isFuture && styles.dayCellFuture,
                day.isCompleted && styles.dayCellDone,
                day.isToday && styles.dayCellToday,
                day.isToday && day.isCompleted && styles.dayCellDoneToday,
              ]}
            >
              {day.isCompleted ? (
                <Icon name="check" size={13} color={colors.text.inverse} />
              ) : (
                <Text
                  style={[
                    styles.dayNum,
                    day.isFuture && styles.dayNumFuture,
                  ]}
                >
                  {day.dateNum}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footerLabel}>{footerLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...card.base,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange[100],
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  streakValue: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  streakUnit: {
    ...typography.label.detail,
    color: colors.text.secondary,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.background.accentSoft,
  },
  pillMet: {
    backgroundColor: colors.orange[100],
  },
  pillLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
  },
  pillLabelMet: {
    color: colors.orange[700],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayLabel: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
  },
  dayLabelDone: {
    color: colors.text.secondary,
  },
  dayLabelFuture: {
    opacity: 0.5,
  },
  dayCell: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  dayCellFuture: {
    backgroundColor: colors.background.primary,
    borderColor: 'transparent',
  },
  dayCellDone: {
    backgroundColor: colors.orange[500],
    borderColor: colors.orange[500],
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.primary.blue600,
  },
  dayCellDoneToday: {
    borderColor: colors.text.inverse,
  },
  dayNum: {
    ...typography.label.small,
    color: colors.text.secondary,
  },
  dayNumFuture: {
    color: colors.text.tertiary,
    opacity: 0.5,
  },
  footerLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
});
