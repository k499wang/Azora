import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MOODS, type Mood } from '../../data/moods';
import type { PlayfulHue } from '../../features/exercise/guidedBreathing/categoryPalette';
import { requireTechnique } from '../../features/exercise/guidedBreathing/techniques';
import { useOpenBreathingTechnique } from '../../features/exercise/shared/hooks/useOpenBreathingTechnique';
import { useFeatureAccess, type FeatureAccessState } from '../../hooks/useFeatureAccess';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { margin, padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import SectionHeader from '../common/SectionHeader';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';

const TILE_WIDTH = 152;

/**
 * What a mood is asking for, which is what orders the shelves: the feelings
 * that are too loud, then the ones that are too quiet, then the ones somebody
 * arrives in on purpose.
 */
type MoodGroup = 'agitated' | 'heavy' | 'good';

const GROUPS: { id: MoodGroup; title: string }[] = [
  { id: 'agitated', title: "When it's too loud" },
  { id: 'heavy', title: "When it's too heavy" },
  { id: 'good', title: 'On purpose' },
];

/**
 * Moods borrow the library's `playful` hues, and carry a shorter label than the
 * check-in uses — a tile is a destination, not an answer to a question. The hue
 * only ever fills the art tile: the label below it sits on the bare canvas, so
 * the shelf reads as artwork rather than a wall of coloured cards.
 */
const MOOD_STYLE: Record<
  Mood['id'],
  { label: string; hue: PlayfulHue; group: MoodGroup }
> = {
  stressed: { label: 'Stressed', hue: colors.playful.teal, group: 'agitated' },
  anxious: { label: 'Anxious', hue: colors.playful.violet, group: 'agitated' },
  overwhelmed: { label: 'Overload', hue: colors.playful.amber, group: 'agitated' },
  overthinking: { label: 'Spiraling', hue: colors.playful.blush, group: 'agitated' },
  angry: { label: 'Angry', hue: colors.playful.coral, group: 'agitated' },
  restless: { label: 'Restless', hue: colors.playful.sky, group: 'agitated' },
  panicky: { label: 'Panicky', hue: colors.playful.blush, group: 'agitated' },
  tense: { label: 'Tense', hue: colors.playful.stone, group: 'agitated' },
  lowMood: { label: 'Low mood', hue: colors.playful.violet, group: 'heavy' },
  lowEnergy: { label: 'Tired', hue: colors.playful.amber, group: 'heavy' },
  sleepless: { label: 'Sleepless', hue: colors.playful.night, group: 'heavy' },
  foggy: { label: 'Foggy', hue: colors.playful.stone, group: 'heavy' },
  burntOut: { label: 'Burnt out', hue: colors.playful.coral, group: 'heavy' },
  heavyHeart: { label: 'Heavy heart', hue: colors.playful.teal, group: 'heavy' },
  focus: { label: 'Focus', hue: colors.playful.sky, group: 'good' },
  morning: { label: 'Morning', hue: colors.playful.coral, group: 'good' },
  windDown: { label: 'Wind down', hue: colors.playful.teal, group: 'good' },
  midday: { label: 'Midday dip', hue: colors.playful.amber, group: 'good' },
  preWorkout: { label: 'Pre-workout', hue: colors.playful.night, group: 'good' },
  bigMoment: { label: 'Big moment', hue: colors.playful.violet, group: 'good' },
};

interface MoodTileProps {
  mood: Mood;
  exerciseAccess: FeatureAccessState;
}

function MoodTile({ mood, exerciseAccess }: MoodTileProps) {
  const technique = requireTechnique(mood.techniqueId);
  const { label, hue } = MOOD_STYLE[mood.id];
  const locked = !exerciseAccess.allowed && !exerciseAccess.isLoading;
  const handlePress = useOpenBreathingTechnique({
    technique,
    exerciseAccess,
    feature: FeatureKey.ExerciseLibrary,
    sourceScreen: 'Explore',
    sourceAction: 'mood_grid',
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${technique.duration}${locked ? ', Pro' : ''}`}
      accessibilityHint={
        locked ? 'Opens the Pro upgrade screen' : `Starts ${technique.name}`
      }
      onPress={handlePress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <View style={[styles.art, { backgroundColor: hue.soft }]}>
        <Image
          source={technique.backgroundImage}
          style={styles.artImage}
          contentFit="cover"
          transition={200}
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{technique.duration}</Text>
        {locked ? (
          <Icon name="lock" size={13} color={colors.text.secondary} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function MoodGrid() {
  const exerciseAccess = useFeatureAccess(FeatureKey.ExerciseLibrary);

  return (
    <View style={styles.sections}>
      {GROUPS.map((group) => (
        <View key={group.id} style={styles.section}>
          <View style={styles.header}>
            <SectionHeader title={group.title} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shelf}
          >
            {MOODS.filter((mood) => MOOD_STYLE[mood.id].group === group.id).map(
              (mood) => (
                <MoodTile
                  key={mood.id}
                  mood={mood}
                  exerciseAccess={exerciseAccess}
                />
              ),
            )}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: margin.sectionGap,
  },
  section: {
    gap: spacing.md,
  },
  // Only the heading is inset — the shelf keeps its own padding so the first
  // tile lines up with it and the last one runs off the edge of the screen.
  header: {
    paddingHorizontal: padding.screen.horizontal,
  },
  shelf: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
  tile: {
    width: TILE_WIDTH,
  },
  tilePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  // The hue stays as the fill under the photo, so a tile whose image has not
  // decoded yet is still the mood's colour rather than a grey hole.
  art: {
    aspectRatio: 1,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  label: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
});
