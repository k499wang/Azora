/** Pick a plan day, then open its lesson in the real lesson player. */
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LessonLabScreenProps } from '../app/navigation';
import { Text } from '../components/common/Text';
import ChunkyButton from '../components/common/ChunkyButton';
import SectionHeader from '../components/common/SectionHeader';
import LearningPracticeSummary from '../features/plan/LearningPracticeSummary';
import { buildProgramEnrollment, programDayLesson } from '../features/program/domain/programEnrollment';
import type { LearningPracticeRecord } from '../features/lessons/domain/learningPractice';
import { lessonForDay } from '../features/lessons/domain/lessonCatalogue';
import type { PhoneLessonTrack } from '../features/lessons/domain/phoneLessonTrack';
import type { PressureLessonTrack } from '../features/lessons/domain/pressureLessonTrack';
import type { ProgramPlanId } from '../features/program/domain/programCatalogue';
import { latestProgramPreset } from '../features/program/domain/programCatalogue';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

type LessonPreviewOption = {
  id: ProgramPlanId;
  label: string;
  pressureTrack?: PressureLessonTrack;
  phoneTrack?: PhoneLessonTrack;
};

const PLANS: readonly LessonPreviewOption[] = [
  { id: 'night', label: 'Sleep' },
  { id: 'morning', label: 'Morning energy' },
  { id: 'pressure', label: 'Stress', pressureTrack: 'stress' },
  { id: 'pressure', label: 'Overthinking', pressureTrack: 'overthinking' },
  { id: 'pressure', label: 'Irritation / anger', pressureTrack: 'anger' },
  { id: 'focus', label: 'Focus' },
  { id: 'quiet', label: 'Quiet' },
  { id: 'home', label: 'Home' },
  { id: 'phone', label: 'Bedtime phone', phoneTrack: 'bedtime' },
  { id: 'phone', label: 'Phone at work', phoneTrack: 'work' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'selfTrust', label: 'Self trust' },
];

export default function LessonLabScreen({ navigation }: LessonLabScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedOption, setSelectedOption] = useState<LessonPreviewOption>(PLANS[0]);
  const [showPracticePreview, setShowPracticePreview] = useState(false);
  const isDev = __DEV__;
  if (!isDev) {
    return null;
  }

  const plan = latestProgramPreset(selectedOption.id, selectedOption.pressureTrack);
  const sequence = plan?.days.map(({ day }) => lessonForDay(
    selectedOption.id, day, plan.revision, selectedOption.pressureTrack, selectedOption.phoneTrack,
  )).filter((lesson) => lesson != null) ?? [];
  const samplePlan = showPracticePreview && plan != null ? buildProgramEnrollment({
    enrollmentId: 'lesson-lab-practice-preview',
    planId: selectedOption.id,
    presetRevision: plan.revision,
    pressureLessonTrack: selectedOption.pressureTrack,
    phoneLessonTrack: selectedOption.phoneTrack,
    enrolledOn: '2026-01-01',
  }) : null;
  const previewEnrollment = samplePlan?.status === 'enrolled' ? samplePlan.enrollment : null;
  const previewRecords: LearningPracticeRecord[] = previewEnrollment == null ? [] : previewEnrollment.resolved.days
    .filter((day) => day.lessonActivityId != null)
    .slice(0, 4)
    .flatMap((day, index) => {
      const lesson = programDayLesson(previewEnrollment, day.day);
      return lesson == null ? [] : [{
        programDay: day.day,
        lessonId: lesson.id,
        response: index === 2 ? 'adapted' as const : 'tried' as const,
        helpful: index === 3 ? true : null,
        updatedAt: `2026-01-0${index + 1}T12:00:00.000Z`,
      }];
    });

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Settings</Text>
        </Pressable>
        <Text style={styles.heading}>Lesson preview</Text>
        <Text style={styles.caption}>Choose a day to play its lesson. Previews do not count toward the plan.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planStrip} contentContainerStyle={styles.planStripContent}>
        {PLANS.map((option) => (
          <Pressable
            key={option.phoneTrack ?? option.pressureTrack ?? option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedOption === option }}
            onPress={() => setSelectedOption(option)}
            style={[styles.planChip, selectedOption === option && styles.planChipSelected]}
          >
            <Text style={[styles.planChipText, selectedOption === option && styles.planChipTextSelected]}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {sequence.length >= 2 ? (
        <View style={styles.followUpPreview}>
          <ChunkyButton
            shape="card"
            label="Preview next-lesson check-in"
            onPress={() => navigation.navigate('Lesson', {
              previewLessonId: sequence[1].id,
              previewPreviousLessonId: sequence[0].id,
            })}
          />
          <Text style={styles.caption}>Try the follow-up to the first {selectedOption.label.toLowerCase()} lesson. Answers are not saved.</Text>
        </View>
      ) : null}
      <View style={styles.followUpPreview}>
        <ChunkyButton
          shape="card"
          label={showPracticePreview ? 'Hide filled Profile preview' : 'Preview filled skills in Profile'}
          onPress={() => setShowPracticePreview((shown) => !shown)}
        />
      </View>
      <Text style={styles.sectionTitle}>{selectedOption.label} · {sequence.length} days</Text>
      <FlatList
        key={selectedOption.phoneTrack ?? selectedOption.pressureTrack ?? selectedOption.id}
        data={sequence}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={previewEnrollment == null ? null : (
          <View style={styles.practicePreview}>
            <Text style={styles.caption}>Sample data only. This is the same card used on Profile; your records are unchanged.</Text>
            <SectionHeader title="Skills in practice" />
            <LearningPracticeSummary
              enrollment={previewEnrollment}
              records={previewRecords}
              isLoading={false}
              isError={false}
              onRetry={() => {}}
            />
          </View>
        )}
        renderItem={({ item, index }) => {
          const phase = plan?.phases.find((entry) => index + 1 >= entry.startDay && index + 1 <= entry.endDay);
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Lesson', { previewLessonId: item.id })}
              style={styles.dayRow}
            >
              <Text style={styles.dayNumber}>Day {index + 1}</Text>
              <View style={styles.dayCopy}>
                <Text style={styles.dayTitle}>{item.title}</Text>
                <Text style={styles.dayMeta}>{phase?.name ?? 'Plan lesson'} · {item.id}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  header: { paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.md, gap: spacing.xs },
  back: { ...typography.body.medium, color: colors.text.brand },
  heading: { ...typography.title.title1, fontFamily: fonts.semibold, color: colors.text.primary },
  caption: { ...typography.body.small, color: colors.text.secondary },
  planStrip: { flexGrow: 0, marginTop: spacing.lg },
  planStripContent: { paddingHorizontal: padding.screen.horizontal, gap: spacing.sm },
  planChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.background.card },
  planChipSelected: { backgroundColor: colors.primary.blue500 },
  planChipText: { ...typography.body.small, color: colors.text.primary },
  planChipTextSelected: { color: colors.text.inverse },
  sectionTitle: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.text.primary, margin: spacing.md },
  followUpPreview: { paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.md, gap: spacing.sm },
  practicePreview: { gap: spacing.md, paddingBottom: spacing.lg },
  listContent: { paddingHorizontal: padding.screen.horizontal, paddingBottom: spacing.xl, gap: spacing.sm },
  dayRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 14, backgroundColor: colors.background.card, gap: spacing.md },
  dayNumber: { ...typography.body.small, color: colors.text.brand, width: 48 },
  dayCopy: { flex: 1, gap: spacing.xs },
  dayTitle: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.text.primary },
  dayMeta: { ...typography.body.small, color: colors.text.secondary },
  chevron: { fontSize: 24, color: colors.text.secondary },
});
