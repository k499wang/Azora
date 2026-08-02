import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../common/Text';
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

  const streakLabel =
    currentStreak > 0
      ? `${currentStreak} day${currentStreak === 1 ? '' : 's'} in a row`
      : 'Streak started';

  const goalLabel = progress.goalMet
    ? 'Weekly goal reached'
    : `${progress.daysCompleted} of ${progress.goal} days this week`;

  return (
    <View style={[card.base, styles.container]}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons
          name="fire"
          size={22}
          color={colors.mood.lowEnergy}
        />
        <Text style={styles.streakLabel}>{streakLabel}</Text>
      </View>

      <View style={styles.weekRow}>
        {days.map((day) => (
          <View key={day.key} style={styles.dayItem}>
            <Text
              style={[styles.dayLabel, day.isCompleted && styles.dayLabelDone]}
            >
              {day.dayLabel}
            </Text>
            <View
              style={[
                styles.dayDot,
                day.isCompleted && styles.dayDotDone,
                day.isToday && styles.dayDotToday,
              ]}
            >
              {day.isCompleted ? (
                <MaterialCommunityIcons
                  name="check"
                  size={14}
                  color={colors.text.inverse}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.goalLabel}>{goalLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
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
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  dayLabelDone: {
    color: colors.text.secondary,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  dayDotDone: {
    backgroundColor: colors.primary.blue600,
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: colors.primary.blue400,
  },
  goalLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
});
