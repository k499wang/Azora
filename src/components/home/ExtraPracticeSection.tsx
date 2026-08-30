import { Pressable, StyleSheet, View } from 'react-native';
import TechniqueCard from '../explore/TechniqueCard';
import TechniqueShelf from '../explore/TechniqueShelf';
import { getExtraPracticeTechniques } from '../explore/exerciseCatalog';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type { FeatureAccessState } from '../../hooks/useFeatureAccess';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import SectionHeader from '../common/SectionHeader';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';
import { useTourTarget } from '../../features/tour/tourTargets';

interface ExtraPracticeSectionProps {
  recommendedTechniqueId: string | null;
  excludedTechniqueIds: ReadonlyArray<string | null | undefined>;
  exerciseAccess: FeatureAccessState;
  /** Caps the shelf so a tablet clips the row on the content margin. */
  contentMaxWidth?: number;
  contentInset?: number;
  onSeeAll: () => void;
}

export default function ExtraPracticeSection({
  recommendedTechniqueId,
  excludedTechniqueIds,
  exerciseAccess,
  contentMaxWidth,
  contentInset = padding.screen.horizontal,
  onSeeAll,
}: ExtraPracticeSectionProps) {
  const techniques = getExtraPracticeTechniques(
    recommendedTechniqueId,
    excludedTechniqueIds,
  );
  const seeAllTarget = useTourTarget('seeAll');

  const handleSeeAll = () => {
    triggerTapHaptic();
    onSeeAll();
  };

  return (
    <View
      style={[
        styles.section,
        contentMaxWidth != null && { maxWidth: contentMaxWidth },
      ]}
    >
      <View style={{ paddingHorizontal: contentInset }}>
        <SectionHeader
          icon="waves"
          title="What are you feeling?"
          right={
            <View {...seeAllTarget}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See all resets"
                onPress={handleSeeAll}
                hitSlop={spacing.sm}
                style={({ pressed }) => [
                  styles.seeAll,
                  pressed && styles.seeAllPressed,
                ]}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Icon name="chevron-right" size={16} color={colors.text.brand} />
              </Pressable>
            </View>
          }
        />
      </View>

      <TechniqueShelf contentInset={contentInset}>
        {techniques.map((technique) => (
          <TechniqueCard
            key={technique.id}
            technique={technique}
            recommended={technique.id === recommendedTechniqueId}
            exerciseAccess={exerciseAccess}
            layout="shelf"
            sourceScreen="Home"
            sourceAction="extra_practice"
          />
        ))}
      </TechniqueShelf>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAllText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
  },
  seeAllPressed: {
    opacity: 0.6,
  },
});
