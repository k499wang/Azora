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
  type MochiExpression,
  type MochiHeld,
  type MochiWearable,
} from '../../features/room/MochiPortrait';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { duration, easing } from '../../theme/motion';

/**
 * Mochi saying one line from a speech bubble.
 *
 * In its default `aside` variant this is a footnote, not a narrator: it belongs
 * under a visual that has already made the point, and it says one thing. In
 * `question` and `heading` he is doing the title's job instead — asking the
 * screen's question, or introducing a section of a longer page — so he is
 * larger and the line carries a title's weight.
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

// Not on the onboarding visual scale, deliberately: the tour renders this
// inside a fixed-height cluster, so a tablet-sized Mochi would grow out of the
// box the arrow and speech bubble are placed against.
const MOCHI_SIZE = 52;
const LEAD_MOCHI_SIZE = 64;
const TAIL = 13;
const PILL_START_SCALE = 0.9;

/**
 * `aside` is the footnote above. `question` is Mochi asking the screen's own
 * question, standing in for the title the screen no longer prints, and
 * `heading` is him introducing a section of a longer page; both of those carry
 * a title's weight, so they share its size.
 */
export type MochiAsideVariant = 'aside' | 'question' | 'heading';

interface MochiAsideProps {
  text: string;
  variant?: MochiAsideVariant;
  expression?: MochiExpression;
  wearing?: MochiWearable;
  holding?: MochiHeld;
  /** lets the screen's own visual land first */
  delayMs?: number;
}

export default function MochiAside({
  text,
  variant = 'aside',
  expression,
  wearing,
  holding,
  delayMs = 320,
}: MochiAsideProps) {
  const lead = variant !== 'aside';
  const heading = variant === 'heading';
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
        size={lead ? LEAD_MOCHI_SIZE : MOCHI_SIZE}
        expression={expression}
        wearing={wearing}
        holding={holding}
      />
      <View style={[styles.bubble, lead && styles.bubbleLead]}>
        <Reanimated.View
          style={[styles.pill, lead && styles.pillLead, pillStyle]}
        >
          <View style={styles.tail} />
        </Reanimated.View>
        <Reanimated.Text
          style={[
            styles.text,
            lead && styles.textLead,
            heading && styles.textHeading,
            textStyle,
          ]}
        >
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
  bubbleLead: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
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
  pillLead: {
    borderRadius: 22,
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
  // He introduces a section rather than titling it, so it sits below the
  // weight of a question and above the footnote.
  textHeading: {
    fontSize: 14,
    lineHeight: 20,
  },
  textLead: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 19,
    lineHeight: 26,
    letterSpacing: -0.2,
    color: colors.text.primary,
  },
});
