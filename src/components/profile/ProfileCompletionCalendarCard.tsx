import { Text } from '../common/Text';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card, coloredCard } from '../../theme/card';
import ActivityGlyph from '../explore/ActivityGlyph';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const GLYPH_SIZE = 180;

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
  /** Fill the height of a peer column so side-by-side cards match. */
  fill?: boolean;
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
  fill = false,
}: ProfileCompletionCalendarCardProps) {
  const completedSet = useMemo(() => new Set(completedDays), [completedDays]);
  const cells = useMemo(() => buildCalendar(monthDate, completedSet), [monthDate, completedSet]);
  const monthLabel = monthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={[styles.cardShadow, fill && styles.fill]}>
      <View style={[styles.card, fill && styles.fill]}>
        <View style={styles.cardGlyph} pointerEvents="none">
          <ActivityGlyph
            shape="rings"
            size={GLYPH_SIZE}
            color={colors.text.inverse}
            opacity={0.12}
          />
        </View>

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
  card: {
    ...card.block,
    ...coloredCard(colors.playful.sky),
    padding: spacing.md,
    gap: spacing.md,
  },
  cardGlyph: {
    position: 'absolute',
    right: -64,
    top: -70,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  monthLabel: {
    ...typography.title.title3,
    fontFamily: fonts.medium,
    fontWeight: '500',
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.inverse,
  },
  monthMeta: {
    ...typography.caption.caption1,
    color: colors.onBlock.textMuted,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  weekdayLabel: {
    ...typography.caption.caption1,
    color: colors.onBlock.textMuted,
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
    paddingVertical: spacing.xs,
  },
  dayCard: {
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.onBlock.fill,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardMuted: {
    backgroundColor: 'transparent',
  },
  dayCardCompleted: {
    backgroundColor: colors.onBlock.fillActive,
  },
  dayCardToday: {
    borderColor: colors.text.inverse,
  },
  dayLabel: {
    ...typography.label.small,
    color: colors.text.inverse,
  },
  dayLabelMuted: {
    color: colors.onBlock.textFaint,
  },
  dayLabelCompleted: {
    fontFamily: fonts.semibold,
  },
});
