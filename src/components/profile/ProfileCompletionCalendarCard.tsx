import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarCell {
  key: string;
  dayNumber: number | null;
  isCurrentMonth: boolean;
  isCompleted: boolean;
  isToday: boolean;
}

interface ProfileCompletionCalendarCardProps {
  monthDate?: Date;
  completedDays: number[];
}

function buildCalendar(monthDate: Date, completedDays: Set<number>): CalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingSlots = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const today = new Date();

  const cells: CalendarCell[] = [];

  for (let index = 0; index < leadingSlots; index += 1) {
    cells.push({
      key: `leading-${index}`,
      dayNumber: null,
      isCurrentMonth: false,
      isCompleted: false,
      isToday: false,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const isToday =
      today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

    cells.push({
      key: `day-${day}`,
      dayNumber: day,
      isCurrentMonth: true,
      isCompleted: completedDays.has(day),
      isToday,
    });
  }

  while (cells.length % 7 !== 0) {
    const trailingIndex = cells.length - (leadingSlots + totalDays);
    cells.push({
      key: `trailing-${trailingIndex}`,
      dayNumber: null,
      isCurrentMonth: false,
      isCompleted: false,
      isToday: false,
    });
  }

  return cells;
}

export default function ProfileCompletionCalendarCard({
  monthDate = new Date(),
  completedDays,
}: ProfileCompletionCalendarCardProps) {
  const completedSet = useMemo(() => new Set(completedDays), [completedDays]);
  const cells = useMemo(() => buildCalendar(monthDate, completedSet), [monthDate, completedSet]);
  const monthLabel = monthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Completion calendar</Text>

      <View style={styles.monthRow}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Text style={styles.monthMeta}>{completedDays.length} completed days</Text>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.key} style={styles.cellWrap}>
            <View
              style={[
                styles.dayCard,
                !cell.isCurrentMonth && styles.dayCardMuted,
                cell.isCompleted && styles.dayCardCompleted,
                cell.isToday && styles.dayCardToday,
                cell.isCompleted && cell.isToday && styles.dayCardCompletedToday,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  !cell.isCurrentMonth && styles.dayLabelMuted,
                  cell.isCompleted && styles.dayLabelCompleted,
                ]}
              >
                {cell.dayNumber ?? ''}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    padding: spacing.md,
    gap: spacing.md,
  },
  title: {
    ...typography.heading.heading2,
    color: colors.text.primary,
    fontSize: 18,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  monthLabel: {
    ...typography.label.large,
    color: colors.text.primary,
  },
  monthMeta: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  weekdayLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    width: '14.2857%',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWrap: {
    width: '14.2857%',
    paddingHorizontal: 3,
    paddingVertical: 4,
  },
  dayCard: {
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardMuted: {
    backgroundColor: colors.background.primary,
    borderColor: 'transparent',
  },
  dayCardCompleted: {
    backgroundColor: colors.orange[500],
    borderColor: colors.orange[500],
  },
  dayCardToday: {
    borderWidth: 2,
    borderColor: colors.primary.blue600,
  },
  dayCardCompletedToday: {
    borderColor: colors.text.inverse,
  },
  dayLabel: {
    ...typography.label.small,
    color: colors.text.primary,
  },
  dayLabelMuted: {
    color: colors.text.tertiary,
    opacity: 0.4,
  },
  dayLabelCompleted: {
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
});
