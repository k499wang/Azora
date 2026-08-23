import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import MochiPortrait, {
  type MochiAccessory,
  type MochiExpression,
} from '../../features/room/MochiPortrait';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { duration, easing } from '../../theme/motion';

/**
 * Mochi adding a line beside something the screen is showing.
 *
 * This is a footnote, not a narrator: it belongs under a visual that has already
 * made the point, and it says one thing. He does not run the screen, and the
 * copy above him is still the app's own voice.
 *
 * Two restraints keep it cheap and crisp:
 *
 * - **One shared value, two animated styles.** The entrance is a single 0→1
 *   tween read by the pill and the text, so a long line costs what a short one
 *   does and nothing is timed in JavaScript.
 * - **The pill moves, the type does not.** Scaling a layer that holds text
 *   resamples every glyph, which is the soft, low-resolution look. The pill
 *   holds no text and is free to pop; the sentence only fades, and it stays a
 *   single `Text` so line breaks and kerning are the font's own.
 */

const MOCHI_SIZE = 52;
const TAIL = 13;
const PILL_START_SCALE = 0.9;

interface MochiAsideProps {
  text: string;
  /** what he is wearing or holding — pick one that fits the screen */
  accessory?: MochiAccessory;
  expression?: MochiExpression;
  /** lets the screen's own visual land first */
  delayMs?: number;
}

export default function MochiAside({
  text,
  accessory,
  expression,
  delayMs = 320,
}: MochiAsideProps) {
  const enter = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      enter.value = 1;
      return undefined;
    }

    enter.value = 0;
    enter.value = withDelay(
      delayMs,
      withTiming(1, { duration: duration.slow, easing: easing.settle }),
    );

    // The screen unmounts on every step, so the tween goes with it.
    return () => cancelAnimation(enter);
  }, [delayMs, enter, reducedMotion, text]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { scale: PILL_START_SCALE + enter.value * (1 - PILL_START_SCALE) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
  }));

  return (
    <View style={styles.row} accessible accessibilityLabel={text}>
      <MochiPortrait
        size={MOCHI_SIZE}
        accessory={accessory}
        expression={expression}
      />
      <View style={styles.bubble}>
        <Reanimated.View style={[styles.pill, pillStyle]}>
          <View style={styles.tail} />
        </Reanimated.View>
        <Reanimated.Text style={[styles.text, textStyle]}>
          {text}
        </Reanimated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  // The text sits in flow and gives the box its height; the pill fills whatever
  // that comes to, so a line that wraps to three needs no measuring.
  bubble: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  // No shadow. This layer scales as it pops, and an unrasterised shadow on a
  // scaling layer is redrawn every frame — a hairline border reads as cleanly
  // and costs nothing.
  pill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.card,
  },
  // a square rotated onto its corner, tucked behind the pill so only the point
  // aimed at Mochi shows
  tail: {
    position: 'absolute',
    left: -TAIL * 0.35,
    width: TAIL,
    height: TAIL,
    borderRadius: 2,
    backgroundColor: colors.background.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
    transform: [{ rotate: '45deg' }],
  },
  text: {
    ...typography.body.small,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
  },
});
