import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MOODS, type Mood } from '../../data/moods';
import type { PlayfulHue } from '../../features/exercise/guidedBreathing/categoryPalette';
import { requireTechnique } from '../../features/exercise/guidedBreathing/techniques';
import { useOpenBreathingTechnique } from '../../features/exercise/shared/hooks/useOpenBreathingTechnique';
import type { FeatureAccessState } from '../../hooks/useFeatureAccess';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';

interface ExtraPracticeSectionProps {
  exerciseAccess: FeatureAccessState;
}

interface ExtraPracticeCardProps {
  mood: Mood;
  exerciseAccess: FeatureAccessState;
}

/**
 * Moods borrow the shelf cards' `playful` hues so the row reads as part of the
 * same library, not a second palette stacked on top of it.
 */
const MOOD_STYLE: Record<Mood['id'], { label: string; hue: PlayfulHue }> = {
  stressed: { label: 'Stressed', hue: colors.playful.teal },
  anxious: { label: 'Anxious', hue: colors.playful.violet },
  sleepless: { label: 'Sleepless', hue: colors.playful.night },
  focus: { label: 'Focus', hue: colors.playful.sky },
  angry: { label: 'Angry', hue: colors.playful.coral },
  lowEnergy: { label: 'Tired', hue: colors.playful.amber },
};

function ExtraPracticeCard({ mood, exerciseAccess }: ExtraPracticeCardProps) {
  const technique = requireTechnique(mood.techniqueId);
  const { label, hue } = MOOD_STYLE[mood.id];
  const handlePress = useOpenBreathingTechnique({
    technique,
    exerciseAccess,
    sourceScreen: 'Explore',
    sourceAction: 'extra_practice',
  });
  const accessHint =
    !exerciseAccess.allowed && !exerciseAccess.isLoading
      ? 'Opens the Pro upgrade screen'
      : `Starts ${technique.name}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={mood.label}
      accessibilityHint={accessHint}
      onPress={handlePress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <View style={[styles.iconTile, { backgroundColor: hue.base }]}>
        <MaterialCommunityIcons
          name={mood.icon}
          size={30}
          color={colors.text.inverse}
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ExtraPracticeSection({
  exerciseAccess,
}: ExtraPracticeSectionProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {MOODS.map((mood) => (
        <ExtraPracticeCard
          key={mood.id}
          mood={mood}
          exerciseAccess={exerciseAccess}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
  item: {
    width: 84,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  itemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  iconTile: {
    width: 66,
    height: 66,
    borderRadius: card.base.borderRadius,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.body.medium,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
