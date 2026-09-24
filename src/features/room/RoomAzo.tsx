import { forwardRef, memo, useEffect, useMemo } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import AzoPortrait, { type AzoHandle } from '../mascot/AzoPortrait';
import { AZO_ASPECT, FEET_Y, STAGE_HEIGHT, STAGE_Y } from '../mascot/azoPaths';
import { colors } from '../../theme/colors';
import { duration } from '../../theme/motion';
import { fonts, typography } from '../../theme/typography';
import AzoSpeechBubble, { type BubbleUnit } from './AzoSpeechBubble';
import {
  FLOOR_HALF_D,
  FLOOR_HALF_W,
  VIEW_BOX_HEIGHT,
  VIEW_BOX_WIDTH,
} from './roomGeometry';

/**
 * The room's resident, standing in it.
 *
 * He is planted rather than wandering. A koala turning around is a different
 * drawing, not a mirrored one, so a walk would have to cut between two pictures
 * every time he changed direction — where standing still lets one drawing carry
 * him, and his idle do the work of making the room feel occupied.
 *
 * `AzoPortrait` owns everything he does; this file owns only where he stands and
 * what he says.
 */

/** the viewBox is centred, so its origin sits at half the box */
const ORIGIN_X = VIEW_BOX_WIDTH / 2;
const ORIGIN_Y = VIEW_BOX_HEIGHT / 2;

/**
 * Where he stands, in the floor's own `(a, b)` basis. Dead centre: a resident
 * who never moves belongs in the middle of his room, where the blob that used to
 * wander could start anywhere because it was about to leave.
 */
const STAND = { a: 0.5, b: 0.5 };

/**
 * Where his feet land, in the same centred viewBox `y` a decoration's front
 * edge is measured against. A host that paints the room in layers around him
 * slices them on this, once, instead of being told as he crosses them.
 */
export const AZO_FLOOR_Y = FLOOR_HALF_D * (STAND.a + STAND.b);

/** how wide his sprite box is, in viewBox units */
const AZO_W = 100;
const AZO_H = AZO_W * AZO_ASPECT;
/** the share of his box that is above the floor line he stands on */
const STANDING_SHARE = (FEET_Y - STAGE_Y) / STAGE_HEIGHT;

const BUBBLE_TAIL = 9;
/** let the room settle before he says anything */
export const SPEECH_OPEN_MS = 700;

const BUBBLE_VARIANTS = {
  compact: {
    width: 88,
    height: 40,
    fontSize: 17,
    lineHeight: 22,
    gap: 8,
    paddingHorizontal: 0,
    paddingVertical: 0,
    unit: 'character' as BubbleUnit,
    openDelayMs: SPEECH_OPEN_MS,
    openDurationMs: duration.slow,
  },
  quote: {
    width: 150,
    height: 78,
    fontSize: 15,
    lineHeight: 20,
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    unit: 'word' as BubbleUnit,
    openDelayMs: 0,
    openDurationMs: duration.base,
  },
} as const;

type SpeechVariant = keyof typeof BUBBLE_VARIANTS;

interface RoomAzoProps {
  /** must match the width handed to the room artwork */
  width: number;
  /** a line for him to say, opening on mount */
  speech?: string;
  /** compact dialogue is the default; quotes get room to breathe */
  speechVariant?: SpeechVariant;
  /** whether he is downcast */
  sad?: boolean;
}

const RoomAzo = forwardRef<AzoHandle, RoomAzoProps>(function RoomAzo(
  { width, speech, speechVariant = 'compact', sad = false },
  ref,
) {
  const u = width / VIEW_BOX_WIDTH;
  const activeVariant = BUBBLE_VARIANTS[speechVariant];
  const styles = useMemo(
    () => createStyles(u, activeVariant),
    [activeVariant, u],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.stand}>
        <AzoPortrait
          ref={ref}
          size={AZO_W * u}
          expression={sad ? 'sad' : 'happy'}
        />
      </View>

      {speech == null ? null : (
        <SpeechBubble
          key={speech}
          text={speech}
          variant={activeVariant}
          styles={styles}
        />
      )}
    </View>
  );
});

interface SpeechBubbleProps {
  text: string;
  variant: (typeof BUBBLE_VARIANTS)[SpeechVariant];
  styles: ReturnType<typeof createStyles>;
}

/**
 * Keyed by its line, so a new line mounts closed and opens fresh instead of
 * showing for a frame inside the bubble that was already open.
 */
function SpeechBubble({ text, variant, styles }: SpeechBubbleProps) {
  const bubble = useSharedValue(0);

  useEffect(() => {
    bubble.value = withDelay(
      variant.openDelayMs,
      withTiming(1, { duration: variant.openDurationMs }),
    );
    return () => cancelAnimation(bubble);
  }, [bubble, variant]);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, bubble.value * 2),
  }));

  return (
    <Animated.View style={[styles.bubble, bubbleStyle]}>
      <AzoSpeechBubble
        text={text}
        progress={bubble}
        tail="bottom"
        unit={variant.unit}
        fillStyle={styles.bubbleFill}
        tailStyle={styles.bubbleTail}
        textStyle={styles.bubbleText}
        contentStyle={styles.bubbleContent}
      />
    </Animated.View>
  );
}

export default memo(RoomAzo);

function createStyles(
  u: number,
  {
    width,
    height,
    fontSize,
    lineHeight,
    gap,
    paddingHorizontal,
    paddingVertical,
  }: (typeof BUBBLE_VARIANTS)[SpeechVariant],
) {
  /** snap to the device pixel grid — half-pixel edges are what read as low-res */
  const px = (value: number) => PixelRatio.roundToNearestPixel(value);

  const floorX = FLOOR_HALF_W * (STAND.a - STAND.b) + ORIGIN_X;
  const floorY = AZO_FLOOR_Y + ORIGIN_Y;
  /** the top of his box, measured from the floor point his feet are on */
  const crown = floorY - AZO_H * STANDING_SHARE;

  return StyleSheet.create({
    stand: {
      position: 'absolute',
      left: px((floorX - AZO_W / 2) * u),
      top: px(crown * u),
      width: px(AZO_W * u),
      height: px(AZO_H * u),
    },
    // The bubble inherits no scale and is rounded to the pixel grid: a
    // fractional font size lands glyphs on half pixels and renders soft.
    bubble: {
      position: 'absolute',
      left: px((floorX - width / 2) * u),
      top: px((crown - gap - height) * u),
      width: px(width * u),
      height: px(height * u),
    },
    // The pill, which holds no text and so is free to pop. No shadow: a
    // hairline border separates it from the wall for free and costs the
    // compositor nothing.
    bubbleFill: {
      ...StyleSheet.absoluteFillObject,
      // centres the tail, which is positioned from the bottom only
      alignItems: 'center',
      borderRadius: px((height / 2) * u),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.subtle,
      backgroundColor: colors.background.card,
    },
    bubbleText: {
      ...typography.label.small,
      fontFamily: fonts.semibold,
      fontSize: Math.round(fontSize * u),
      lineHeight: Math.round(lineHeight * u),
      color: colors.text.primary,
    },
    bubbleContent: {
      paddingHorizontal: px(paddingHorizontal * u),
      paddingVertical: px(paddingVertical * u),
    },
    // a square rotated onto its corner, tucked under the bubble so only the
    // bottom point shows
    bubbleTail: {
      position: 'absolute',
      bottom: px(-BUBBLE_TAIL * 0.35 * u),
      width: px(BUBBLE_TAIL * u),
      height: px(BUBBLE_TAIL * u),
      borderRadius: 2,
      backgroundColor: colors.background.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.subtle,
      transform: [{ rotate: '45deg' }],
    },
  });
}
