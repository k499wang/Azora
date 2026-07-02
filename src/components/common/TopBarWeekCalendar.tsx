import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildWeekCalendarDays } from '../../lib/calendar/weekCalendarDays';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const TOP_BAR_DAYS = 7;
const DAY_WIDTH = 22;
const CALENDAR_HEIGHT = 30;
const UNDERLINE_HEIGHT = 2;

interface TopBarWeekCalendarProps {
  todayLocalDate: string;
  selectedLocalDate?: string;
  completedDaysAgo?: number[];
  streakDays?: number;
  onSelectDay?: (localDate: string) => void;
}

export default function TopBarWeekCalendar({
  todayLocalDate,
  selectedLocalDate = todayLocalDate,
  completedDaysAgo = [],
  streakDays,
  onSelectDay,
}: TopBarWeekCalendarProps) {
  const days = useMemo(
    () => buildWeekCalendarDays(todayLocalDate, completedDaysAgo, TOP_BAR_DAYS),
    [completedDaysAgo, todayLocalDate],
  );

  return (
    <View style={styles.container}>
      {streakDays != null && streakDays > 0 && (
        <Text style={styles.streakLabel}>
          <Text style={styles.streakCount}>{streakDays} day</Text> streak
        </Text>
      )}
      <View style={styles.row}>
      {days.map((day) => {
        const isSelected = day.localDate === selectedLocalDate;
        const disabled = onSelectDay == null;

        return (
          <Pressable
            key={day.key}
            style={styles.dayItem}
            onPress={() => onSelectDay?.(day.localDate)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.dayLabel,
                isSelected && styles.dayLabelSelected,
                day.isCompleted && styles.dayLabelCompleted,
              ]}
            >
              {day.dayLabel}
            </Text>
            <View style={[styles.underline, isSelected && styles.underlineSelected]} />
          </Pressable>
        );
      })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 4,
  },
  streakLabel: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.secondary,
    fontFamily: fonts.regular,
    fontWeight: '400',
  },
  streakCount: {
    color: colors.orange[500],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: CALENDAR_HEIGHT,
    marginLeft: -((DAY_WIDTH - 9) / 2),
  },
  dayItem: {
    width: DAY_WIDTH,
    alignItems: 'center',
    gap: 2,
  },
  dayLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.neutral[600],
    fontFamily: fonts.medium,
  },
  dayLabelCompleted: {
    color: colors.neutral[600],
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  dayLabelSelected: {
    color: colors.neutral[600],
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  underline: {
    width: 12,
    height: UNDERLINE_HEIGHT,
    backgroundColor: 'transparent',
  },
  underlineSelected: {
    borderRadius: UNDERLINE_HEIGHT / 2,
    backgroundColor: colors.neutral[600],
  },
});
