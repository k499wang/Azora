import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { programDayLesson, type ProgramEnrollmentV3 } from '../program/domain/programEnrollment';
import { learningPracticeForEnrollment } from '../lessons/domain/learningPracticeForEnrollment';
import type { LearningPracticeRecord } from '../lessons/domain/learningPractice';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const ILLUSTRATION_SIZE = 36;

export default function LearningPracticeSummary({ enrollment, records, isLoading, isError, onRetry }: {
  enrollment: ProgramEnrollmentV3; records: LearningPracticeRecord[];
  isLoading: boolean; isError: boolean; onRetry: () => void;
}) {
  const attempts = learningPracticeForEnrollment(enrollment, records).filter(record => record.response === 'tried' || record.response === 'adapted');
  const recent = [...attempts].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 3);
  if (isLoading) return <View style={[card.base, card.lipped, styles.card, styles.message]}><Text style={styles.detail}>Loading your practice…</Text></View>;
  if (isError) return <View style={[card.base, card.lipped, styles.card, styles.message]}>
    <Text style={styles.detail}>Your practice couldn’t load.</Text>
    <Pressable accessibilityRole="button" onPress={onRetry}><Text style={styles.retry}>Try again</Text></Pressable>
  </View>;
  if (recent.length === 0) return <View style={[card.base, card.lipped, styles.card]}>
    <View style={styles.row}>
      <View style={card.taskIcon}><TaskIllustration name="calendar-check-outline" size={ILLUSTRATION_SIZE} /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>Nothing here yet</Text>
        <Text style={styles.detail}>Try a lesson’s step, then tell us how it went.</Text>
      </View>
    </View>
  </View>;
  return <View style={[card.base, card.lipped, styles.card]}>
    {recent.map((record, index) => <View key={record.programDay} style={[styles.row, index < recent.length - 1 && styles.rowDivided]}>
      <View style={card.taskIcon}><TaskIllustration name="calendar-check-outline" size={ILLUSTRATION_SIZE} done /></View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>{programDayLesson(enrollment, record.programDay)?.title}</Text>
        <Text style={styles.detail}>{record.helpful === true ? 'Helpful' : record.response === 'adapted' ? 'Adapted to fit' : 'Tried'}</Text>
      </View>
    </View>)}
    {attempts.length > recent.length ? <Text style={styles.more}>{attempts.length} steps tried in this plan</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, paddingHorizontal: spacing.md },
  message: { paddingVertical: spacing.md, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  rowDivided: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle },
  copy: { flex: 1, gap: spacing['2xs'] },
  title: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.text.primary },
  detail: { ...typography.body.small, color: colors.text.secondary },
  retry: { ...typography.body.small, fontFamily: fonts.semibold, color: colors.primary.blue500 },
  more: { ...typography.body.xsmall, color: colors.text.tertiary, paddingBottom: spacing.sm },
});
