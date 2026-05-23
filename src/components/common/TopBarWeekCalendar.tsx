import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildWeekCalendarDays } from '../../lib/calendar/weekCalendarDays';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const TOP_BAR_DAYS = 7;
const DAY_WIDTH = 18;
const CALENDAR_HEIGHT = 30;
const UNDERLINE_HEIGHT = 2;

interface TopBarWeekCalendarProps {
  todayLocalDate: string;
  selectedLocalDate?: string;
  completedDaysAgo?: number[];
  onSelectDay?: (localDate: string) => void;
}

export default function TopBarWeekCalendar({
  todayLocalDate,
  selectedLocalDate = todayLocalDate,
  completedDaysAgo = [],
  onSelectDay,
}: TopBarWeekCalendarProps) {
  const days = useMemo(
    () => buildWeekCalendarDays(todayLocalDate, completedDaysAgo, TOP_BAR_DAYS),
    [completedDaysAgo, todayLocalDate],
  );

  return (
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
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: CALENDAR_HEIGHT,
  },
  dayItem: {
    width: DAY_WIDTH,
    alignItems: 'center',
    gap: 2,
  },
  dayLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.tertiary,
    fontFamily: fonts.medium,
  },
  dayLabelCompleted: {
    color: colors.orange[500],
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  dayLabelSelected: {
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  underline: {
    width: 12,
    height: UNDERLINE_HEIGHT,
    backgroundColor: 'transparent',
  },
  underlineSelected: {
    borderRadius: UNDERLINE_HEIGHT / 2,
    backgroundColor: colors.text.primary,
  },
});
