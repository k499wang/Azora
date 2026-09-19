import { Pressable, StyleSheet, View } from 'react-native';
import { MOODS, type Mood } from '../../data/moods';
import type { PlayfulHue } from '../../features/exercise/guidedBreathing/categoryPalette';
import { requireTechnique } from '../../features/exercise/guidedBreathing/techniques';
import { useOpenBreathingTechnique } from '../../features/exercise/shared/hooks/useOpenBreathingTechnique';
import { useFeatureAccess, type FeatureAccessState } from '../../hooks/useFeatureAccess';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';

const CARD_HEIGHT = 172;
/**
 * How far the right column starts below the left one. A third of a card, so
 * the two columns never line up and the eye zig-zags down the page rather than
 * reading it as a table.
 */
const COLUMN_OFFSET = CARD_HEIGHT / 3;
const WATERMARK_SIZE = 104;

/**
 * What a mood is asking for, which is what orders the grid: the feelings that
 * are too loud, then the ones that are too quiet, then the ones somebody
 * arrives in on purpose. Unlabelled — the run of related cards is the grouping.
 */
type MoodGroup = 'agitated' | 'heavy' | 'good';

const GROUP_ORDER: MoodGroup[] = ['agitated', 'heavy', 'good'];

/**
 * Moods borrow the library's `playful` hues so the grid reads as one palette,
 * and carry a shorter label than the check-in uses — a card is a destination,
 * not an answer to a question.
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
  lowMood: { label: 'Low mood', hue: colors.playful.violet, group: 'heavy' },
  lowEnergy: { label: 'Tired', hue: colors.playful.amber, group: 'heavy' },
  sleepless: { label: 'Sleepless', hue: colors.playful.night, group: 'heavy' },
  focus: { label: 'Focus', hue: colors.playful.sky, group: 'good' },
  morning: { label: 'Morning', hue: colors.playful.coral, group: 'good' },
  windDown: { label: 'Wind down', hue: colors.playful.teal, group: 'good' },
};

/**
 * Grouped, then split by index parity so the two columns keep the grouped
 * reading order rather than each holding a half of the list.
 */
const ORDERED_MOODS = GROUP_ORDER.flatMap((group) =>
  MOODS.filter((mood) => MOOD_STYLE[mood.id].group === group),
);

interface MoodCardProps {
  mood: Mood;
  exerciseAccess: FeatureAccessState;
}

function MoodCard({ mood, exerciseAccess }: MoodCardProps) {
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
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: hue.tint },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.watermark} pointerEvents="none">
        <Icon name={mood.icon} size={WATERMARK_SIZE} color={hue.ink} />
      </View>
      <Text style={[styles.label, { color: hue.ink }]} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: hue.ink }]}>
          {technique.duration}
        </Text>
        {locked ? <Icon name="lock" size={14} color={hue.ink} /> : null}
      </View>
    </Pressable>
  );
}

export default function MoodGrid() {
  const exerciseAccess = useFeatureAccess(FeatureKey.ExerciseLibrary);
  const columns = [
    ORDERED_MOODS.filter((_, index) => index % 2 === 0),
    ORDERED_MOODS.filter((_, index) => index % 2 === 1),
  ];

  return (
    <View style={styles.grid}>
      {columns.map((moods, index) => (
        <View
          key={index}
          style={[styles.column, index === 1 && styles.columnOffset]}
        >
          {moods.map((mood) => (
            <MoodCard
              key={mood.id}
              mood={mood}
              exerciseAccess={exerciseAccess}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
    // The offset column hangs past the last card in the other one, so the
    // bottom of the page needs the difference back.
    paddingBottom: COLUMN_OFFSET,
  },
  column: {
    flex: 1,
    gap: spacing.md,
  },
  columnOffset: {
    marginTop: COLUMN_OFFSET,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    padding: spacing.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
  },
  watermark: {
    position: 'absolute',
    right: -WATERMARK_SIZE / 4,
    top: -WATERMARK_SIZE / 5,
    opacity: 0.18,
  },
  label: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    opacity: 0.75,
  },
  meta: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
  },
});
