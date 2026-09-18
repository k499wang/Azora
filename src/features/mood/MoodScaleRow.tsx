import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';
import {
  MOOD_FACES,
  MOOD_SCALE_MIN,
  type MoodQuestion,
} from './domain/moodCheckIn';

/**
 * Five across, in one row, with the word under each free to take two lines.
 *
 * One row is what makes the scale read as a continuum: worst on the left, best
 * on the right, one glance. Wrapping the faces themselves broke that, and a
 * colour ramp across two rows is a weaker substitute than the row itself.
 *
 * The width has to come from somewhere, so it comes from the words. Each column
 * is about 71pt, which is seven or eight characters at reading size, and "Not
 * great" simply sits on two lines. Two lines of a legible word beat one line of
 * a small one, because the word is what tells you what the face means.
 */
/** Big enough to read as a face, small enough for five of them across. */
const FACE_SIZE = 46;
/** Reading size, not caption size. See `label` below. */
const LABEL_SIZE = 16;
const LABEL_LINE_HEIGHT = 20;
const SELECTED_SCALE = 1.22;
/**
 * The selection has to be *finished* before anything else moves.
 *
 * A soft spring is still settling a third of a second after the tap, so the
 * page began sliding while the face was mid-bounce and the answer never
 * visibly landed — it read as a flicker rather than as a choice. This is stiff
 * enough to arrive and stop inside `MOOD_SELECT_SETTLE_MS`.
 */
const SELECT_SPRING = { friction: 9, tension: 320 } as const;

/**
 * How long the selection takes to come to rest. The screen waits at least this
 * long before it turns the page, so the two animations never overlap.
 */
export const MOOD_SELECT_SETTLE_MS = 200;

/**
 * The colour of each point, worst to best.
 *
 * A ramp rather than one accent: the row reads as a scale before a single word
 * is read, which is the whole reason a face row beats five numbers. It runs
 * warm to cool because that is the direction every one of these scales runs —
 * and it stops short of red and green, which would make a bad day a failure and
 * a good one a score.
 */
const FACE_HUES = [
  colors.playful.coral,
  colors.playful.amber,
  colors.playful.stone,
  colors.playful.sky,
  colors.playful.teal,
] as const;

/**
 * One scale, as five faces, each with its own word under it.
 *
 * Faces rather than numbers because the question is about a feeling, and a
 * feeling answered on a 1-to-5 makes the user translate it twice: once into a
 * number, and once back out again when they read their own history. A face is
 * the answer, not a code for it.
 *
 * Every word is on screen from the start. Showing only the chosen one meant the
 * label appeared on tap and vanished on the next tap, so the thing that told
 * you what a face *meant* was the one thing you could not read until after you
 * had already picked it — and it popped in and out while you were reading the
 * row. Five quiet words is not clutter; it is the scale, legible before it is
 * answered.
 *
 * The selection is carried by the face instead: it is the only one coloured and
 * the only one at full size, and its word darkens with it.
 */
export default function MoodScaleRow({
  question,
  value,
  onChange,
}: {
  question: MoodQuestion;
  value: number | null;
  onChange: (rating: number) => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {MOOD_FACES.map((face, index) => {
          const rating = MOOD_SCALE_MIN + index;
          return (
            <FaceButton
              key={face}
              face={face}
              hue={FACE_HUES[index]}
              label={question.labels[index]}
              rating={rating}
              selected={value === rating}
              onPress={() => onChange(rating)}
            />
          );
        })}
      </View>
    </View>
  );
}

function FaceButton({
  face,
  hue,
  label,
  rating,
  selected,
  onPress,
}: {
  face: (typeof MOOD_FACES)[number];
  hue: (typeof FACE_HUES)[number];
  label: string;
  rating: number;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(selected ? SELECTED_SCALE : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? SELECTED_SCALE : 1,
      useNativeDriver: true,
      ...SELECT_SPRING,
    }).start();
  }, [scale, selected]);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint={`${rating} of ${MOOD_FACES.length}`}
      style={styles.faceButton}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
    >
      {/* The face scales; the word does not. A label that grew with its face
          would push its neighbours around every time the answer changed. */}
      <View style={styles.faceSlot}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Icon
            name={face}
            size={FACE_SIZE}
            color={selected ? hue.base : colors.text.tertiary}
          />
        </Animated.View>
      </View>
      <Text
        style={[styles.label, selected && { color: hue.ink }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  /**
   * One row, pulled 8pt past the page's own margin on each side.
   *
   * Those 16pt are the difference between a column of 68pt and one of 71, which
   * at reading size is most of a character per line. Every point of width here
   * is a point the words get.
   */
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: -spacing.sm,
  },
  // Equal columns, so five words of different lengths still sit under their
  // own faces rather than drifting off them.
  faceButton: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  /**
   * Room for the face at its selected size, held whether or not it is selected.
   * Without it the row's height changes as the answer moves along it.
   */
  faceSlot: {
    height: FACE_SIZE * SELECTED_SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * The word is what the face means, so it is set at reading size rather than
   * as a caption. At 12pt it was legible and ignorable at the same time, which
   * on the row that carries the whole scale is the wrong trade.
   */
  label: {
    fontSize: LABEL_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    textAlign: 'center',
    // Two lines' worth, always. A row where one word wraps and four do not
    // would otherwise stand taller than its neighbours and drag the faces out
    // of line with each other.
    minHeight: LABEL_LINE_HEIGHT * 2,
  },
});
