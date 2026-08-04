import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRecommendedTechnique } from '../../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { useAuthStore } from '../../stores/authStore';
import { padding, spacing } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';
import { getBrowseExerciseGroups } from './exerciseCatalog';
import TechniqueCard, { TECHNIQUE_SHELF_CARD_WIDTH } from './TechniqueCard';

export default function BreathingLibrary() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const exerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const recommendedTechnique = useRecommendedTechnique(userId);
  const recommendedTechniqueId =
    recommendedTechnique.source === 'profile'
      ? recommendedTechnique.technique?.id ?? null
      : null;
  const exerciseGroups = useMemo(
    () => getBrowseExerciseGroups(recommendedTechniqueId),
    [recommendedTechniqueId],
  );

  return (
    <View style={styles.section}>
      {exerciseGroups.map((group) => (
        <View key={group.id} style={styles.exerciseGroup}>
          <View style={styles.headerWrap}>
            <SectionHeader title={group.title} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            decelerationRate="fast"
            snapToInterval={TECHNIQUE_SHELF_CARD_WIDTH + spacing.xs * 2}
          >
            {group.techniques.map((technique) => (
              <TechniqueCard
                key={technique.id}
                technique={technique}
                recommended={technique.id === recommendedTechniqueId}
                exerciseAccess={exerciseAccess}
                layout="shelf"
                sourceScreen="Explore"
                sourceAction="breathing_library"
              />
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  exerciseGroup: {
    gap: spacing.md,
  },
  headerWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  scrollContent: {
    paddingHorizontal: padding.screen.horizontal - spacing.xs,
  },
});
