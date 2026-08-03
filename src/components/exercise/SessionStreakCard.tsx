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
import { WEEK_LENGTH_DAYS } from '../../lib/weeklyProgress';

interface Props {
  currentStreak: number;
  completedDaysAgo: readonly number[];
}

export default function SessionStreakCard({
  currentStreak,
  completedDaysAgo,
}: Props) {
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

  return (
    <View style={[card.base, styles.container]}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons
          name="fire"
          size={26}
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
                  size={18}
                  color={colors.text.inverse}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  streakLabel: {
    ...typography.title.title3,
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
    width: 34,
    height: 34,
    borderRadius: 17,
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
});
