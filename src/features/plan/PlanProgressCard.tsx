import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import ProgressBar from '../../components/common/ProgressBar';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const ICON_SIZE = 44;
const BAR_HEIGHT = 20;

interface PlanProgressCardProps {
  planName: string;
  phaseName: string;
  week: number;
  totalWeeks: number;
  daysDone: number;
  totalDays: number;
  isFinished: boolean;
}

export default function PlanProgressCard({
  planName,
  phaseName,
  week,
  totalWeeks,
  daysDone,
  totalDays,
  isFinished,
}: PlanProgressCardProps) {
  const where = isFinished
    ? 'Plan complete'
    : [`Week ${week} of ${totalWeeks}`, phaseName].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TaskIllustration name="todo-plan" size={ICON_SIZE} />
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {planName}
          </Text>
          <Text style={styles.caption} numberOfLines={1}>
            {where}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={totalDays === 0 ? 0 : daysDone / totalDays}
        height={BAR_HEIGHT}
        trackColor={colors.primary.blue100}
        fillColor={colors.primary.blue500}
        shine
      >
        <Text style={styles.count}>
          {daysDone} / {totalDays} days
        </Text>
      </ProgressBar>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.lipped,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 23,
    color: colors.text.primary,
  },
  caption: {
    ...typography.label.detail,
    color: colors.text.secondary,
  },
  count: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
    color: colors.primary.blue700,
  },
});
