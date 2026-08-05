import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import Icon from './icons/Icon';
import { buildWeekCalendarDays } from '../../lib/calendar/weekCalendarDays';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const WEEK_DAYS = 7;
const CIRCLE_SIZE = 28;
const TODAY_DOT_SIZE = 18;
const CHECK_SIZE = 16;
const RING_WIDTH = 2;

interface WeekCalendarStripProps {
  todayLocalDate: string;
  completedDaysAgo?: number[];
}

export default function WeekCalendarStrip({
  todayLocalDate,
  completedDaysAgo = [],
}: WeekCalendarStripProps) {
  const days = useMemo(
    () => buildWeekCalendarDays(todayLocalDate, completedDaysAgo, WEEK_DAYS),
    [completedDaysAgo, todayLocalDate],
  );

  return (
    <View style={styles.row}>
      {days.map((day) => (
        <View key={day.key} style={styles.dayItem}>
          <View
            style={[
              styles.circle,
              day.isCompleted && styles.circleCompleted,
              !day.isCompleted && !day.isToday && styles.circleEmpty,
            ]}
          >
            {day.isCompleted ? (
              <Icon name="check" size={CHECK_SIZE} color={colors.text.inverse} />
            ) : day.isToday ? (
              <View style={styles.todayDot} />
            ) : null}
          </View>
          <Text style={styles.dayLabel}>{day.dayShortLabel}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: colors.primary.blue700,
  },
  circleEmpty: {
    backgroundColor: colors.primary.blue100,
    borderWidth: RING_WIDTH,
    borderColor: colors.primary.blue100,
  },
  todayDot: {
    width: TODAY_DOT_SIZE,
    height: TODAY_DOT_SIZE,
    borderRadius: TODAY_DOT_SIZE / 2,
    backgroundColor: colors.primary.blue700,
  },
  dayLabel: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: colors.neutral[0],
    fontFamily: fonts.semibold,
  },
});
