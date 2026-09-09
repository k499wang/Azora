import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BREATH_HOLD_STYLE } from '../../features/exercise/guidedBreathing/categoryPalette';
import { useRecommendedTechnique } from '../../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useStartDaily } from '../../hooks/useStartDaily';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { useAuthStore } from '../../stores/authStore';
import { padding, spacing } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';
import { getBrowseExerciseGroups } from './exerciseCatalog';
import ExtraPracticeSection from './ExtraPracticeSection';
import ExploreActionCard from './ExploreActionCard';
import HeartRateCheckCard from './HeartRateCheckCard';
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
  const { start } = useStartDaily('Explore', {
    guidedTechnique: null,
    handPickedTechnique: null,
  });
  const exerciseGroups = useMemo(
    () => getBrowseExerciseGroups(recommendedTechniqueId),
    [recommendedTechniqueId],
  );

  return (
    <View style={styles.section}>
      <ExtraPracticeSection exerciseAccess={exerciseAccess} />
      <HeartRateCheckCard />
      <ExploreActionCard
        title="The Azora Protocol"
        subtitle="Two minutes, one hold"
        hue={BREATH_HOLD_STYLE.hue}
        glyph={BREATH_HOLD_STYLE.glyph}
        accessibilityLabel="Start The Azora Protocol"
        accessibilityHint="Starts today's hold"
        onPress={() => start('breathHold')}
      />
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
  // Pulled down toward the protocol card it pairs with; the negative bottom
  // margin keeps every other row where it was.
  heartCard: {
    marginTop: spacing.md,
    marginBottom: -spacing.md,
  },
  exerciseGroup: {
    gap: spacing.lg,
  },
  headerWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
});
