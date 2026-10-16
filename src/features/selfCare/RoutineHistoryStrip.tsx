import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  SELF_CARE_GOAL_HISTORY_DAYS,
  type SelfCareGoalDay,
  type SelfCareGoalDayState,
} from './domain/selfCareGoalHistory';

const CELL_HEIGHT = 12;
const CELL_RADIUS = 3;
const TODAY_BORDER = 2;

interface Props {
  days: SelfCareGoalDay[] | null;
}

function historyCounts(days: SelfCareGoalDay[]): { done: number; due: number } {
  const done = days.filter((day) => day.state === 'done').length;
  const due = days.filter(
    (day) => day.state === 'done' || day.state === 'missed' || day.state === 'pending',
  ).length;
  return { done, due };
}

export default function RoutineHistoryStrip({ days }: Props) {
  if (days == null) {
    return (
      <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.cells}>
          {Array.from({ length: SELF_CARE_GOAL_HISTORY_DAYS }, (_, index) => (
            <View key={index} style={[styles.cell, stateStyles['not-due']]} />
          ))}
        </View>
      </View>
    );
  }
  const { done, due } = historyCounts(days);
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Done ${done} of ${due} days in the last ${days.length}`}
    >
      <View style={styles.cells}>
        {days.map((day) => (
          <View key={day.date} style={[styles.cell, stateStyles[day.state]]} />
        ))}
      </View>
      <Text style={styles.count}>
        {done}/{due}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cells: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing['2xs'],
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    borderRadius: CELL_RADIUS,
  },
  count: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
});

const stateStyles: Record<SelfCareGoalDayState, object> = StyleSheet.create({
  done: { backgroundColor: colors.text.brand },
  missed: { backgroundColor: colors.neutral[300] },
  pending: {
    backgroundColor: colors.background.card,
    borderWidth: TODAY_BORDER,
    borderColor: colors.text.brand,
  },
  'not-due': { backgroundColor: colors.neutral[100] },
  'before-start': { backgroundColor: colors.neutral[100] },
});
