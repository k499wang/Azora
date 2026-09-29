/** Pick a plan day, then open its lesson in the real lesson player. */
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LessonLabScreenProps } from '../app/navigation';
import { Text } from '../components/common/Text';
import {
  LESSON_SEQUENCES,
  lessonById,
} from '../features/lessons/domain/lessonCatalogue';
import type { ProgramPlanId } from '../features/program/domain/programCatalogue';
import { latestProgramPreset } from '../features/program/domain/programCatalogue';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const PLANS: readonly { id: ProgramPlanId; label: string }[] = [
  { id: 'night', label: 'Sleep' },
  { id: 'morning', label: 'Morning energy' },
  { id: 'pressure', label: 'Stress and anger' },
  { id: 'focus', label: 'Focus' },
  { id: 'quiet', label: 'Quiet' },
  { id: 'home', label: 'Home' },
  { id: 'phone', label: 'Phone' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'selfTrust', label: 'Self trust' },
];

export default function LessonLabScreen({ navigation }: LessonLabScreenProps) {
  const insets = useSafeAreaInsets();
  const [planId, setPlanId] = useState<ProgramPlanId>('night');
  const isDev = __DEV__;
  if (!isDev) {
    return null;
  }

  const plan = latestProgramPreset(planId);
  const sequence = LESSON_SEQUENCES[planId];

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
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: planId === option.id }}
            onPress={() => setPlanId(option.id)}
            style={[styles.planChip, planId === option.id && styles.planChipSelected]}
          >
            <Text style={[styles.planChipText, planId === option.id && styles.planChipTextSelected]}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>{PLANS.find((item) => item.id === planId)?.label} · {sequence.length} days</Text>
      <FlatList
        data={sequence}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const phase = plan?.phases.find((entry) => index + 1 >= entry.startDay && index + 1 <= entry.endDay);
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Lesson', { previewLessonId: item })}
              style={styles.dayRow}
            >
              <Text style={styles.dayNumber}>Day {index + 1}</Text>
              <View style={styles.dayCopy}>
                <Text style={styles.dayTitle}>{lessonById(item).title}</Text>
                <Text style={styles.dayMeta}>{phase?.name ?? 'Plan lesson'} · {item}</Text>
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
  listContent: { paddingHorizontal: padding.screen.horizontal, paddingBottom: spacing.xl, gap: spacing.sm },
  dayRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 14, backgroundColor: colors.background.card, gap: spacing.md },
  dayNumber: { ...typography.body.small, color: colors.text.brand, width: 48 },
  dayCopy: { flex: 1, gap: spacing.xs },
  dayTitle: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.text.primary },
  dayMeta: { ...typography.body.small, color: colors.text.secondary },
  chevron: { fontSize: 24, color: colors.text.secondary },
});
