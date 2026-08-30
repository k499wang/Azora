import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRecommendedTechnique } from '../../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { useAuthStore } from '../../stores/authStore';
import { padding, spacing } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';
import { getBrowseExerciseGroups } from './exerciseCatalog';
import TechniqueCard from './TechniqueCard';
import TechniqueShelf from './TechniqueShelf';

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
          <TechniqueShelf>
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
          </TechniqueShelf>
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
    gap: spacing.lg,
  },
  headerWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
});
