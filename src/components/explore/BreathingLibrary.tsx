import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { MainTabNavigationProp } from '../../app/navigation';
import { BREATH_HOLD_STYLE } from '../../features/exercise/guidedBreathing/categoryPalette';
import { useRecommendedTechnique } from '../../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useStartDaily } from '../../hooks/useStartDaily';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { useAuthStore } from '../../stores/authStore';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import Icon from '../common/icons/Icon';
import SectionHeader from '../common/SectionHeader';
import { Text } from '../common/Text';
import { getExploreShelves } from './exerciseCatalog';
import ExtraPracticeSection from './ExtraPracticeSection';
import ExploreActionCard from './ExploreActionCard';
import HeartRateCheckCard from './HeartRateCheckCard';
import TechniqueCard from './TechniqueCard';
import TechniqueShelf from './TechniqueShelf';

export default function BreathingLibrary() {
  const navigation = useNavigation<MainTabNavigationProp<'Explore'>>();
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
  const shelves = useMemo(
    () => getExploreShelves(recommendedTechniqueId),
    [recommendedTechniqueId],
  );

  return (
    <View style={styles.section}>
      <ExtraPracticeSection exerciseAccess={exerciseAccess} />
      <View style={styles.heartCard}>
        <HeartRateCheckCard />
      </View>
      <View style={styles.protocolCard}>
        <ExploreActionCard
          title="The Azora Protocol"
          subtitle="Test your breath hold"
          hue={BREATH_HOLD_STYLE.hue}
          glyph="orb"
          accessibilityLabel="Start The Azora Protocol"
          accessibilityHint="Starts today's hold"
          onPress={() => start('breathHold')}
        />
      </View>
      {shelves.map((shelf) => (
        <View key={shelf.id} style={styles.exerciseGroup}>
          <View style={styles.headerWrap}>
            <SectionHeader
              title={shelf.title}
              right={
                shelf.id === 'for-you' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Browse every reset"
                    hitSlop={spacing.sm}
                    onPress={() => {
                      triggerTapHaptic();
                      navigation.navigate('ExerciseSearch');
                    }}
                    style={({ pressed }) => [
                      styles.browseLink,
                      pressed && pressable.subtle,
                    ]}
                  >
                    <Text style={styles.browseLinkText}>Browse all</Text>
                    <Icon
                      name="chevron-right"
                      size={16}
                      color={colors.text.brand}
                    />
                  </Pressable>
                ) : null
              }
            />
          </View>
          <TechniqueShelf>
            {shelf.techniques.map((technique) => (
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
  // Pulled down toward the protocol card it pairs with; the smaller bottom
  // margin lifts it and everything below by the difference.
  heartCard: {
    marginTop: spacing.md,
    marginBottom: -spacing.mdPlus,
  },
  // Sits nearer the shelf below it, without moving that shelf.
  protocolCard: {
    marginTop: spacing.sm,
    marginBottom: -spacing.sm,
  },
  exerciseGroup: {
    gap: spacing.lg,
  },
  headerWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  browseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  browseLinkText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
  },
});
