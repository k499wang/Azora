import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  if (record.helpful === true) return 'Helpful';
  if (record.helpful === false) return 'Not helpful yet';
  return record.response === 'adapted' ? 'Adapted to fit · Not rated' : 'Tried · Not rated';
}

interface Props {
  title: string;
  detail: string;
  helpful?: LearningPracticeRecord['helpful'];
  divided?: boolean;
  /** false for the empty state, where nothing has been tried yet */
  done?: boolean;
}

/** One skill the user reported trying, as Profile and the full list both show it. */
export default function SkillPracticeRow({ title, detail, helpful = null, divided = false, done = true }: Props) {
  const feedbackIcon = helpful === true ? 'thumb-up-outline' : helpful === false ? 'thumb-down-outline' : 'minus';
  return (
    <View style={[styles.row, divided && styles.divided]}>
      <View style={card.taskIcon}>
        {done ? (
          <MaterialCommunityIcons
            name={feedbackIcon}
            size={28}
            color={helpful === true ? colors.success[600] : colors.text.secondary}
          />
        ) : (
          <TaskIllustration name="calendar-check-outline" size={ILLUSTRATION_SIZE} done={false} />
        )}
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
