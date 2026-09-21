import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MOODS, type Mood } from '../../data/moods';
import {
  HOME_CARE_GUIDES,
  ROUTINE_TEMPLATES,
  type RoutineLibraryEntry,
} from '../../data/routineLibrary';
import {
  CATEGORY_STYLE,
  TECHNIQUE_GLYPH,
  type PlayfulHue,
} from '../../features/exercise/guidedBreathing/categoryPalette';
import {
  requireTechnique,
} from '../../features/exercise/guidedBreathing/techniques';
import { useOpenBreathingTechnique } from '../../features/exercise/shared/hooks/useOpenBreathingTechnique';
import { useFeatureAccess, type FeatureAccessState } from '../../hooks/useFeatureAccess';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import {
  fonts,
  typography,
  wrappedLineHeight,
} from '../../theme/typography';
import { Text } from '../common/Text';
import ActivityGlyph from './ActivityGlyph';
import ExploreShelf from './ExploreShelf';
import RoutineLibraryArt from './RoutineLibraryArt';

const TILE_WIDTH = 176;
/** Barely landscape: wider than it is tall, but still close to a square. */
const ART_ASPECT = 4 / 3;
const GLYPH_SIZE = 76;

/**
 * The shelves follow the order somebody arrives in: wound up, running on empty,
 * unable to switch off, then the days that are already fine and only want
 * steering. A mood moves shelves by changing its `group` below.
 */
type MoodGroup = 'woundUp' | 'empty' | 'switchOff' | 'sharp';

/**
 * A heading is a situation written the way somebody would say it about
 * themselves — a sentence, not a list of feelings. It is the only copy read
 * before the tile, so it names where the person is standing instead of
 * summarising the shelf underneath it.
 */
type ExploreSection =
  | { id: MoodGroup; kind: 'mood'; title: string }
  | { id: 'routineTemplates' | 'homeCareGuides'; kind: 'library'; title: string };

const EXPLORE_SECTIONS: ExploreSection[] = [
  { id: 'woundUp', kind: 'mood', title: "When you're wound up" },
  { id: 'routineTemplates', kind: 'library', title: 'Routine templates' },
  { id: 'empty', kind: 'mood', title: "When you're running on empty" },
  { id: 'switchOff', kind: 'mood', title: "When you can't switch off" },
  { id: 'sharp', kind: 'mood', title: 'When you want to be sharp' },
  { id: 'homeCareGuides', kind: 'library', title: 'Home-care guides' },
];

/**
 * Moods borrow the library's `playful` hues, and carry a fuller title than the
 * check-in's one-word chip — a tile names what it does for you, not the feeling
 * you arrived with. The hue only ever fills the art plate: the text below it
 * sits on the bare canvas, so the shelf reads as artwork rather than a wall of
 * coloured cards.
 */
const MOOD_STYLE: Record<
  Mood['id'],
  { title: string; hue: PlayfulHue; group: MoodGroup }
> = {
  stressed: { title: 'Let the stress out', hue: colors.playful.teal, group: 'woundUp' },
  anxious: { title: 'Quiet an anxious mind', hue: colors.playful.violet, group: 'woundUp' },
  overwhelmed: { title: 'Come back from overload', hue: colors.playful.amber, group: 'woundUp' },
  overthinking: { title: 'Stop the spiral', hue: colors.playful.blush, group: 'woundUp' },
  angry: { title: 'Cool the anger down', hue: colors.playful.coral, group: 'woundUp' },
  restless: { title: 'Settle a restless body', hue: colors.playful.sky, group: 'woundUp' },
  panicky: { title: 'Steady a panic surge', hue: colors.playful.blush, group: 'woundUp' },
  tense: { title: 'Unclench and soften', hue: colors.playful.stone, group: 'woundUp' },
  lowMood: { title: 'Lift a low mood', hue: colors.playful.violet, group: 'empty' },
  lowEnergy: { title: 'Find some energy again', hue: colors.playful.amber, group: 'empty' },
  sleepless: { title: 'Fall asleep tonight', hue: colors.playful.night, group: 'switchOff' },
  foggy: { title: 'Clear a foggy head', hue: colors.playful.stone, group: 'sharp' },
  burntOut: { title: 'Recover from burnout', hue: colors.playful.coral, group: 'empty' },
  heavyHeart: { title: 'Carry a heavy heart', hue: colors.playful.teal, group: 'empty' },
  focus: { title: 'Sharpen your focus', hue: colors.playful.sky, group: 'sharp' },
  morning: { title: 'Start the morning awake', hue: colors.playful.coral, group: 'sharp' },
  windDown: { title: 'Wind down the day', hue: colors.playful.teal, group: 'switchOff' },
  midday: { title: 'Beat the midday dip', hue: colors.playful.amber, group: 'sharp' },
  preWorkout: { title: 'Prime for a workout', hue: colors.playful.night, group: 'sharp' },
  bigMoment: { title: 'Ready for a big moment', hue: colors.playful.violet, group: 'sharp' },
};

interface MoodTileProps {
  mood: Mood;
  exerciseAccess: FeatureAccessState;
}

function MoodTile({ mood, exerciseAccess }: MoodTileProps) {
  const technique = requireTechnique(mood.techniqueId);
  const { title, hue } = MOOD_STYLE[mood.id];
  const categoryLabel = CATEGORY_STYLE[technique.category].label;
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
      accessibilityLabel={`${title}, ${technique.name}, ${categoryLabel}, ${technique.duration}${locked ? ', Pro' : ''}`}
      accessibilityHint={
        locked ? 'Opens the Pro upgrade screen' : `Starts ${technique.name}`
      }
      onPress={handlePress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <View style={[styles.art, { backgroundColor: hue.soft }]}>
        <ActivityGlyph
          shape={TECHNIQUE_GLYPH[technique.id]}
          size={GLYPH_SIZE}
          color={hue.base}
          opacity={0.9}
        />
        {locked ? (
          <View style={[styles.proBadge, { backgroundColor: hue.ink }]}>
            <Text style={[styles.proText, { color: hue.soft }]}>PRO</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {technique.name}
      </Text>
    </Pressable>
  );
}

function TemplateCard({ entry, onPress }: { entry: RoutineLibraryEntry; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={entry.title}
      accessibilityHint="Opens this routine"
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.templateCard, pressed && pressable.subtle]}
    >
      {entry.kind === 'pdf' ? (
        <Image
          source={require('../../../assets/routines/house-cleaning-preview.png')}
          contentFit="cover"
          style={styles.pdfThumbnail}
        />
      ) : <RoutineLibraryArt entry={entry} size="card" />}
      <View style={styles.cardCopy}>
        <Text style={styles.title} numberOfLines={2}>{entry.title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {entry.kind === 'pdf' ? 'PDF · 10 pages' : entry.eyebrow}
        </Text>
      </View>
    </Pressable>
  );
}

interface MoodGridProps {
  onOpenRoutine: (entry: RoutineLibraryEntry) => void;
  onPreviewHomeCareGuide: () => void;
}

export default function MoodGrid({ onOpenRoutine, onPreviewHomeCareGuide }: MoodGridProps) {
  const exerciseAccess = useFeatureAccess(FeatureKey.ExerciseLibrary);

  return (
    <View style={styles.sections}>
      {EXPLORE_SECTIONS.map((section) => (
        <View
          key={section.id}
          style={section.kind === 'library' && styles.librarySection}
        >
          <ExploreShelf title={section.title}>
            {section.kind === 'mood'
              ? MOODS.filter((mood) => MOOD_STYLE[mood.id].group === section.id).map(
                (mood) => (
                  <MoodTile
                    key={mood.id}
                    mood={mood}
                    exerciseAccess={exerciseAccess}
                  />
                ),
              )
              : (section.id === 'routineTemplates' ? ROUTINE_TEMPLATES : HOME_CARE_GUIDES).map((entry) => (
                <TemplateCard
                  key={entry.id}
                  entry={entry}
                  onPress={() => (
                    section.id === 'routineTemplates'
                      ? onOpenRoutine(entry)
                      : onPreviewHomeCareGuide()
                  )}
                />
              ))}
          </ExploreShelf>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.lg,
  },
  librarySection: {
    marginTop: spacing.xs - spacing.lg,
  },
  templateCard: {
    width: TILE_WIDTH,
    marginBottom: -spacing.sm,
  },
  pdfThumbnail: {
    width: TILE_WIDTH,
    height: 240,
    borderRadius: 22,
    backgroundColor: colors.background.card,
  },
  cardCopy: {
    paddingTop: spacing.xs,
  },
  tile: {
    width: TILE_WIDTH,
    // Cancels the subtitle's local breathing room so the shared section gap
    // remains the only space between shelves.
    marginBottom: -spacing.sm,
  },
  tilePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  art: {
    width: '100%',
    aspectRatio: ART_ASPECT,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // Sits tight under the plate: the caption belongs to this picture, and a
    // wider gap reads as a gap between two unrelated things.
    marginBottom: spacing.xs,
  },
  proBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  proText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    letterSpacing: 0.6,
  },
  // A one-line title keeps its natural height, so the exercise name stays
  // directly beneath it instead of leaving a blank caption line.
  title: {
    ...typography.body.medium,
    lineHeight: wrappedLineHeight(typography.body.medium.fontSize),
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.label.medium,
    // A hair of air under the title: the two lines are spaced for paragraphs at
    // their own line heights, which is tight once they are stacked as a caption.
    marginTop: spacing.xs,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
});
