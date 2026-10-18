import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import type { LearningPracticeRecord } from '../lessons/domain/learningPractice';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const ILLUSTRATION_SIZE = 36;

export function skillPracticeResult(record: LearningPracticeRecord): string {
  return record.helpful === true ? 'Helpful' : record.response === 'adapted' ? 'Adapted to fit' : 'Tried';
}

interface Props {
  title: string;
  detail: string;
  divided?: boolean;
  /** false for the empty state, where nothing has been tried yet */
  done?: boolean;
}

/** One skill the user reported trying, as Profile and the full list both show it. */
export default function SkillPracticeRow({ title, detail, divided = false, done = true }: Props) {
  return (
    <View style={[styles.row, divided && styles.divided]}>
      <View style={card.taskIcon}>
        <TaskIllustration name="calendar-check-outline" size={ILLUSTRATION_SIZE} done={done} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  divided: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle },
  copy: { flex: 1, gap: spacing['2xs'] },
  title: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.text.primary },
  detail: { ...typography.body.small, color: colors.text.secondary },
});
