import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import SkillPracticeRow, { skillPracticeResult } from './SkillPracticeRow';
import { programDayLesson, type ProgramEnrollmentV3 } from '../program/domain/programEnrollment';
import { learningPracticeForEnrollment } from '../lessons/domain/learningPracticeForEnrollment';
import type { LearningPracticeRecord } from '../lessons/domain/learningPractice';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const RECENT_COUNT = 3;

export function triedSkills(enrollment: ProgramEnrollmentV3, records: LearningPracticeRecord[]): LearningPracticeRecord[] {
  return learningPracticeForEnrollment(enrollment, records)
    .filter(record => record.response === 'tried' || record.response === 'adapted')
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export default function LearningPracticeSummary({ enrollment, records, isLoading, isError, onRetry, onSeeAll }: {
  enrollment: ProgramEnrollmentV3; records: LearningPracticeRecord[];
  isLoading: boolean; isError: boolean; onRetry: () => void; onSeeAll: () => void;
}) {
  const attempts = triedSkills(enrollment, records);
  const recent = attempts.slice(0, RECENT_COUNT);
  const hasMore = attempts.length > recent.length;
  if (isLoading) return <View style={[card.base, card.shadow, styles.card, styles.message]}><Text style={styles.detail}>Loading your practice…</Text></View>;
  if (isError) return <View style={[card.base, card.shadow, styles.card, styles.message]}>
    <Text style={styles.detail}>Your practice couldn’t load.</Text>
    <Pressable accessibilityRole="button" onPress={onRetry}><Text style={styles.link}>Try again</Text></Pressable>
  </View>;
  if (recent.length === 0) return <View style={[card.base, card.shadow, styles.card]}>
    <SkillPracticeRow title="Nothing here yet" detail="Try a lesson’s step, then tell us how it went." done={false} />
  </View>;
  return <View style={[card.base, card.shadow, styles.card]}>
    {recent.map((record, index) => <SkillPracticeRow
      key={record.programDay}
      title={programDayLesson(enrollment, record.programDay)?.title ?? ''}
      detail={skillPracticeResult(record)}
      helpful={record.helpful}
      divided={index < recent.length - 1 || hasMore}
    />)}
    {hasMore ? <Pressable accessibilityRole="button" onPress={onSeeAll} style={styles.seeAll}>
      <Text style={styles.link}>See all {attempts.length}</Text>
    </Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, paddingHorizontal: spacing.md },
  message: { paddingVertical: spacing.md, gap: spacing.xs },
  detail: { ...typography.body.small, color: colors.text.secondary },
  link: { ...typography.body.small, fontFamily: fonts.semibold, color: colors.primary.blue500 },
  seeAll: { alignItems: 'center', paddingVertical: spacing.md },
});
