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
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';

/** The drop the mood tiles' faces sit above, matching `ChunkyButton`'s lip. */
const TILE_LIP_DEPTH = 4;

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
  overwhelmed: { label: 'Overload', hue: colors.playful.amber },
  overthinking: { label: 'Spiraling', hue: colors.playful.blush },
  angry: { label: 'Angry', hue: colors.playful.coral },
  restless: { label: 'Restless', hue: colors.playful.sky },
  lowMood: { label: 'Low mood', hue: colors.playful.violet },
  lowEnergy: { label: 'Tired', hue: colors.playful.amber },
  focus: { label: 'Focus', hue: colors.playful.sky },
  morning: { label: 'Morning', hue: colors.playful.coral },
  windDown: { label: 'Wind down', hue: colors.playful.teal },
  sleepless: { label: 'Sleepless', hue: colors.playful.night },
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
      style={styles.item}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.tileLip, { backgroundColor: hue.mid }]}>
            <View
              style={[
                styles.iconTile,
                { backgroundColor: hue.tint },
                pressed && styles.iconTilePressed,
              ]}
            >
              <Icon name={mood.icon} size={32} color={hue.ink} />
            </View>
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
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
    gap: spacing.xs,
  },
  item: {
    width: 80,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tileLip: {
    borderRadius: card.base.borderRadius,
    borderCurve: 'continuous',
    paddingBottom: TILE_LIP_DEPTH,
  },
  iconTile: {
    width: 62,
    height: 62,
    borderRadius: card.base.borderRadius,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Exactly the lip's depth, so the face lands flush on it when pressed.
  iconTilePressed: {
    transform: [{ translateY: TILE_LIP_DEPTH }],
  },
  label: {
    ...typography.body.medium,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
