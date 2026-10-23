import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SkillsInPracticeScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import ScreenContent from '../components/common/ScreenContent';
import { Text } from '../components/common/Text';
import SkillPracticeRow, { skillPracticeResult } from '../features/plan/SkillPracticeRow';
import { triedSkills } from '../features/plan/LearningPracticeSummary';
import { allLessons } from '../features/lessons/domain/lessonCatalogue';
import { programDayLesson } from '../features/program/domain/programEnrollment';
import { usePlanPositionState } from '../hooks/usePlanPosition';
import { useLearningProgress } from '../queries/learning/useLearningProgress';
import { useAuthStore } from '../stores/authStore';
import { card, radius } from '../theme/card';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const PREVIEW_COUNT = 14;
const PREVIEW_RESULTS = [
  { detail: 'Helpful', helpful: true },
  { detail: 'Not helpful yet', helpful: false },
  { detail: 'Tried · Not rated', helpful: null },
  { detail: 'Adapted to fit · Not rated', helpful: null },
] as const;

interface SkillItem {
  key: string;
  title: string;
  detail: string;
  helpful: boolean | null;
}

/** Every skill the user reported trying in this plan, newest first. */
export default function SkillsInPracticeScreen({ route }: SkillsInPracticeScreenProps) {
  const insets = useSafeAreaInsets();
  const isPreview = __DEV__ && route.params?.preview === true;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { enrollment } = usePlanPositionState(isPreview ? null : userId);
  const learning = useLearningProgress(isPreview ? null : userId, enrollment?.enrollmentId ?? null);

  const items: SkillItem[] = isPreview
    ? allLessons().slice(0, PREVIEW_COUNT).map((lesson, index) => ({
      key: lesson.id,
      title: lesson.title,
      ...PREVIEW_RESULTS[index % PREVIEW_RESULTS.length],
    }))
    : enrollment == null ? [] : triedSkills(enrollment, learning.records).map((record) => ({
      key: String(record.programDay),
      title: programDayLesson(enrollment, record.programDay)?.title ?? '',
      detail: skillPracticeResult(record),
      helpful: record.helpful,
    }));

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent width="grouped">
          <AppTopBar title="Skills in practice" showBack showAvatar={false} showStreak={false} />
          <View style={styles.body}>
            <Text style={styles.summary}>
              {items.length === 0
                ? 'Skills you try from your lessons will show up here.'
                : `You’ve tried ${items.length} ${items.length === 1 ? 'skill' : 'skills'} in this plan.`}
            </Text>
            {items.length > 0 ? (
              <View style={[card.base, card.shadow, styles.card]}>
                {items.map((item, index) => (
                  <SkillPracticeRow
                    key={item.key}
                    title={item.title}
                    detail={item.detail}
                    helpful={item.helpful}
                    divided={index < items.length - 1}
                  />
                ))}
              </View>
            ) : null}
            {isPreview ? <Text style={styles.note}>Preview only — sample lessons, nothing saved.</Text> : null}
          </View>
        </ScreenContent>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  content: { flexGrow: 1 },
  body: { paddingHorizontal: padding.screen.horizontal, gap: spacing.md },
  summary: { ...typography.body.medium, color: colors.text.secondary },
  card: { borderRadius: radius.xl, paddingHorizontal: spacing.md },
  note: { ...typography.body.xsmall, color: colors.text.tertiary, textAlign: 'center' },
});
