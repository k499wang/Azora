import { StyleSheet, View, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * What the blob is saying.
 *
 * Two things keep the type crisp, and both are structural rather than cosmetic:
 *
 * - **The pill and the text are separate layers.** The pop lives on the pill,
 *   which holds no text, so it can overshoot and squash without ever softening
 *   a glyph. Nothing that contains type is scaled.
 * - **One `Text` per character.** `useAnimatedStyle` is a hook and cannot be
 *   called in a loop, so each letter is its own component. Letters only fade
 *   and rise; no scale touches them.
 *
 * The caller owns `progress` (0 closed, 1 open) so the same bubble can be
 * driven by a blob's own timing in the room, or by a screen's entrance.
 */

/**
 * How much of the entrance is spent staggering, and how much each piece takes.
 * The stagger is divided by the number of pieces so the last one always lands
 * at `progress` 1 — a fixed per-piece delay finishes a two-letter word and
 * leaves most of a sentence permanently invisible.
 */
const STAGGER_SPAN = 0.55;
const PIECE_RISE = 0.45;

export type BubbleTail = 'bottom' | 'bottomLeft';

/**
 * Letters for a word, words for a sentence.
 *
 * Per-letter reads as speech for the blob's one-word reactions, but a question
 * split into letters wraps mid-word, because every glyph is its own `Text` and
 * the layout may break between any two of them.
 */
export type BubbleUnit = 'character' | 'word';

interface MochiSpeechBubbleProps {
  text: string;
  progress: SharedValue<number>;
  /** which edge the tail points out of, toward whoever is speaking */
  tail: BubbleTail;
  unit: BubbleUnit;
  textStyle: TextStyle;
  tailStyle: TextStyle;
  fillStyle: TextStyle;
}

export default function MochiSpeechBubble({
  text,
  progress,
  tail,
  unit,
  textStyle,
  tailStyle,
  fillStyle,
}: MochiSpeechBubbleProps) {
  const pieces = unit === 'word' ? text.split(' ') : text.split('');
  const animatedFillStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 0.3 + progress.value * 0.7 },
      { translateY: (1 - progress.value) * 10 },
    ],
  }));

  return (
    <>
      <Animated.View style={[fillStyle, animatedFillStyle]}>
        <View style={tailStyle} />
      </Animated.View>
      <View style={tail === 'bottomLeft' ? styles.rowLeft : styles.rowCentered}>
        {pieces.map((piece, index) => (
          // the string is fixed per screen, so the index is a stable key
          <BubblePiece
            key={`${index}-${piece}`}
            progress={progress}
            index={index}
            count={pieces.length}
            piece={piece}
            spaced={unit === 'word' && index < pieces.length - 1}
            style={textStyle}
          />
        ))}
      </View>
    </>
  );
}

interface BubblePieceProps {
  progress: SharedValue<number>;
  index: number;
  count: number;
  piece: string;
  /** words need the gap the split removed; letters do not */
  spaced: boolean;
  style: TextStyle;
}

function BubblePiece({
  progress,
  index,
  count,
  piece,
  spaced,
  style,
}: BubblePieceProps) {
  const start = count > 1 ? (index / (count - 1)) * STAGGER_SPAN : 0;

  const pieceStyle = useAnimatedStyle(() => {
    const eased = Math.max(
      0,
      Math.min(1, (progress.value - start) / PIECE_RISE),
    );

    return {
      opacity: eased,
      transform: [{ translateY: (1 - eased) * 7 }],
    };
  });

  if (piece === ' ' || piece === '') {
    return <View style={styles.space} />;
  }

  return (
    <Animated.Text style={[style, pieceStyle]}>
      {spaced ? `${piece} ` : piece}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  rowCentered: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  /** a rendered gap where a space would be, since each glyph is its own Text */
  space: { width: 4 },
});
