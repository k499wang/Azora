import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { duration, spring } from '../../theme/motion';
import { fonts, typography } from '../../theme/typography';
import MochiSpeechBubble from './MochiSpeechBubble';
import { VIEW_BOX_HEIGHT, VIEW_BOX_WIDTH } from './RoomScene';

/**
 * The room's resident — a blob that wanders the floor of the hex room and
 * bounces when it is poked.
 *
 * It renders as an overlay sized to the same box as `HexRoom`, in the same
 * coordinate space, so a floor position here lands exactly where the artwork's
 * floor is. Views rather than svg because every part of it is animated and
 * transforms on views are the cheap, reliable path.
 */

/** the viewBox is centred, so its origin sits at half the box */
const ORIGIN_X = VIEW_BOX_WIDTH / 2;
const ORIGIN_Y = VIEW_BOX_HEIGHT / 2;

/**
 * The floor plane, in the same basis `roomShells.floorPoint` uses. A position
 * on it is a `depth` (how far toward the viewer) and a `side` (how far right):
 * `x = HALF_W * side`, `y = HALF_D * depth`.
 */
const HALF_W = 155.9;
const HALF_D = 90;

/**
 * Where it is allowed to walk — an ellipse over the open front-left floor.
 *
 * Three edges bound it, and all three are about the blob's full silhouette, not
 * just its feet, because the body floats above its contact point:
 *
 * - it stays past `depth` 1.01 (y=91), in front of the day 2 and day 3 wall
 *   furniture, whose footprints all end by y=73 in this x range;
 * - its right edge stays under x=14, clearing the day 4 floor accent at x=19;
 * - it stays off the front-left frame edge, which runs `x = -HALF_W * (2 - depth)`.
 *
 * So the blob is always genuinely nearer the viewer than anything it overlaps,
 * and painting it last on top of the room reads as correct depth rather than as
 * a sticker. Growing the blob tightens all three — shrink this ellipse to match.
 */
const WALK = { depth: 1.2, side: -0.33, rDepth: 0.19, rSide: 0.18 };

/** the room width the walk ellipse above was drawn for; narrower rooms tighten it */
const WANDER_FULL_WIDTH = 330;

/** floor units per second, and the shortest trip worth taking */
const SPEED = 0.12;
const MIN_TRIP = 0.19;

/** one full stride cycle is two steps */
const STEP_RATE = Math.PI * 2 * 0.95;

/** blob geometry, in viewBox units — scaled to the rendered room by `u` */
const BODY_W = 54;
const BODY_H = 48;
const BODY_ROUND = BODY_H / 2;
/** how far the body floats above the ground point, leaving the feet visible */
const BODY_LIFT = 6;
const FOOT_W = 19;
const FOOT_H = 9.5;
const FOOT_X = 13;
const SHADOW_W = 60;
const SHADOW_H = 20;
const EYE_W = 8;
const EYE_H = 9;
/** eyes sit off-centre so the horizontal flip reads as a turn */
const EYE_SHIFT = 2.5;
const EYE_DX = 8;
const CHEEK_SIZE = 4.8;
const CHEEK_DX = 15.5;
const CHEEK_TOP = 25.5;
const SPARKLE = 17;

/**
 * The speech bubble is in viewBox units like everything else here, so it tracks
 * the blob and shrinks with the room. Its type is rounded to whole pixels on the
 * way: a fractional font size lands glyphs on half pixels and renders soft.
 */
const BUBBLE_W = 88;
const BUBBLE_H = 40;
const BUBBLE_FONT = 15;
const BUBBLE_LINE = 20;
/** clear of the body, which already floats `BODY_LIFT` above the feet */
const BUBBLE_GAP = 9;
const BUBBLE_TAIL = 9;
/** let the room settle before it says anything */
export const SPEECH_OPEN_MS = 700;

const BOUNCE = 6.5;
const FOOT_LIFT = 5.5;
const STRIDE = 4.3;
const LEAN_DEG = 3.5;

/** the poke reaction: two delighted hops, then back to wandering */
const CHEER_DUR = 1.05;
const CHEER_HOP = 14;
/** the pause held after the reaction before it walks off again */
const CHEER_SETTLE = 0.4;

export interface RoomBlobHandle {
  /** play the poke reaction; safe to call again mid-reaction */
  cheer: () => void;
}

interface Props {
  /** must match the width handed to `HexRoom` */
  width: number;
  /**
   * Slumped, droop-eyed and turned-down, and it stops wandering. A mood, not an
   * event: it holds until the prop changes rather than playing out like `cheer`.
   */
  sad?: boolean;
  /**
   * A line for the blob to say. It rides the actor, so it follows the walk;
   * it opens once shortly after mount and again on every `cheer()`, then packs
   * itself away. Omit it and no bubble is rendered at all.
   */
  speech?: string;
}

const RoomBlob = forwardRef<RoomBlobHandle, Props>(function RoomBlob(
  { width, speech, sad = false },
  ref,
) {
  const u = width / VIEW_BOX_WIDTH;
  /**
   * A small room gets a calmer resident. Everything here scales by `u`, so a
   * narrow room already shrinks the blob's steps in absolute terms — but the
   * wander stays just as wide *relative* to the artwork, which is what reads as
   * restless on a short phone. Tightening the ellipse itself settles it.
   */
  const wander = Math.min(1, width / WANDER_FULL_WIDTH);
  const reducedMotion = useReducedMotion();

  const depth = useSharedValue(WALK.depth);
  const side = useSharedValue(WALK.side);
  const targetDepth = useSharedValue(WALK.depth);
  const targetSide = useSharedValue(WALK.side);
  const rest = useSharedValue(0.8);
  const stride = useSharedValue(0);
  const clock = useSharedValue(0);
  const walk = useSharedValue(0);
  const heading = useSharedValue(1);
  const facing = useSharedValue(1);
  const blink = useSharedValue(1);
  const blinkIn = useSharedValue(2.5);
  const blinkFor = useSharedValue(0);
  const cheer = useSharedValue(0);
  const bubble = useSharedValue(0);
  const sadness = useSharedValue(sad ? 1 : 0);

  const frame = useFrameCallback((info) => {
    const dt = Math.min((info.timeSincePreviousFrame ?? 16) / 1000, 0.05);
    clock.value += dt;

    if (cheer.value > 0) {
      cheer.value -= dt;
      // stand still through the reaction and for a beat after it lands
      rest.value = Math.max(rest.value, cheer.value + CHEER_SETTLE);
    }

    blinkIn.value -= dt;
    if (blinkIn.value <= 0) {
      blinkIn.value = 2.5 + Math.random() * 4;
      blinkFor.value = 0.12;
    }
    if (blinkFor.value > 0) blinkFor.value -= dt;
    blink.value = blinkFor.value > 0 ? 0.12 : 1;

    // a sad blob stays put: topping rest up every frame means it never reaches
    // the branch that picks somewhere new to walk
    if (sadness.value > 0.5) {
      rest.value = Math.max(rest.value, 0.5);
    }

    let moving = 0;
    if (rest.value > 0) {
      rest.value -= dt;
    } else {
      const dDepth = targetDepth.value - depth.value;
      const dSide = targetSide.value - side.value;
      const distance = Math.hypot(dDepth, dSide);

      if (distance < 0.006) {
        rest.value = 0.7 + Math.random() * 2.6;

        for (let attempt = 0; attempt < 8; attempt += 1) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.sqrt(Math.random());
          const d = WALK.depth + Math.cos(angle) * WALK.rDepth * wander * radius;
          const s = WALK.side + Math.sin(angle) * WALK.rSide * wander * radius;
          if (Math.hypot(d - depth.value, s - side.value) > MIN_TRIP * wander) {
            targetDepth.value = d;
            targetSide.value = s;
            break;
          }
        }
      } else {
        const step = Math.min(distance, SPEED * dt);
        depth.value += (dDepth / distance) * step;
        side.value += (dSide / distance) * step;
        stride.value += dt;
        moving = 1;

        if (Math.abs(HALF_W * dSide) > 0.5) {
          heading.value = dSide > 0 ? 1 : -1;
        }
      }
    }

    walk.value += (moving - walk.value) * Math.min(1, dt * 7);
    facing.value += (heading.value - facing.value) * Math.min(1, dt * 6);
  }, false);

  const say = useCallback(() => {
    if (speech == null) return;
    // it stays open: the line is the screen's copy, not a passing flourish
    bubble.value = reducedMotion
      ? withTiming(1, { duration: duration.base })
      : withSpring(1, spring.pop);
  }, [bubble, reducedMotion, speech]);

  useEffect(() => {
    sadness.value = withTiming(sad ? 1 : 0, { duration: duration.slow });
  }, [sad, sadness]);

  useEffect(() => {
    if (speech == null) return;
    const timer = setTimeout(say, SPEECH_OPEN_MS);
    return () => clearTimeout(timer);
  }, [say, speech]);

  useImperativeHandle(
    ref,
    () => ({
      cheer: () => {
        say();
        // nothing decays `cheer` while the frame callback is off, so a reduced
        // motion blob would be stuck mid-hop
        if (reducedMotion) return;
        cheer.value = CHEER_DUR;
      },
    }),
    [cheer, reducedMotion, say],
  );

  useFocusEffect(
    useCallback(() => {
      if (reducedMotion) return;
      frame.setActive(true);
      return () => frame.setActive(false);
    }, [frame, reducedMotion]),
  );

  const actorStyle = useAnimatedStyle(() => {
    const x = HALF_W * side.value;
    const y = HALF_D * depth.value;

    return {
      transform: [
        { translateX: (x + ORIGIN_X) * u },
        { translateY: (y + ORIGIN_Y) * u },
        // nearer the front of the room reads slightly larger
        { scale: 0.9 + (y / 180) * 0.2 },
      ],
    };
  }, [u]);

  const bodyStyle = useAnimatedStyle(() => {
    const stepCycle = Math.sin(stride.value * STEP_RATE);
    const hopCycle = Math.sin(cheerPhase(cheer.value) * Math.PI * 2);
    const cheering = cheer.value > 0 ? 1 : 0;

    // both gaits are "airborne = 1, on the floor = 0", so the squash and the
    // shadow can read from the same number whichever one is playing
    const air = Math.abs(stepCycle) * walk.value;
    const hop = Math.abs(hopCycle) * cheering;
    const contact = Math.max(
      (1 - Math.abs(stepCycle)) * walk.value,
      (1 - Math.abs(hopCycle)) * cheering,
    );

    const breath =
      Math.sin(clock.value * 2) * 0.022 * (1 - walk.value) * (1 - cheering);
    const scaleY = 1 - contact * (0.1 + cheering * 0.08) + breath;
    const scaleX = 1 + contact * (0.08 + cheering * 0.07) - breath;

    const flip =
      facing.value >= 0
        ? Math.max(0.14, facing.value)
        : Math.min(-0.14, facing.value);
    const wiggle =
      Math.sin(cheerPhase(cheer.value) * Math.PI * 4) * 7 * cheering;

    const slump = sadness.value;

    return {
      transform: [
        // the squash compensation keeps the blob's feet planted on the floor
        {
          translateY:
            (-air * BOUNCE -
              hop * CHEER_HOP +
              (BODY_H * (1 - scaleY)) / 2 +
              slump * 3) *
            u,
        },
        {
          rotateZ: `${facing.value * LEAN_DEG * walk.value + wiggle}deg`,
        },
        { scaleX: (scaleX + slump * 0.05) * flip },
        { scaleY: scaleY - slump * 0.06 },
      ],
    };
  }, [u]);

  const backFootStyle = useAnimatedStyle(() => {
    const cycle = Math.sin(stride.value * STEP_RATE);

    return {
      transform: [
        { translateX: facing.value * cycle * STRIDE * walk.value * u },
        { translateY: -footLift(cycle, walk.value, cheer.value) * u },
      ],
    };
  }, [u]);

  const frontFootStyle = useAnimatedStyle(() => {
    const cycle = -Math.sin(stride.value * STEP_RATE);

    return {
      transform: [
        { translateX: facing.value * cycle * STRIDE * walk.value * u },
        { translateY: -footLift(cycle, walk.value, cheer.value) * u },
      ],
    };
  }, [u]);

  const shadowStyle = useAnimatedStyle(() => {
    const air = Math.max(
      Math.abs(Math.sin(stride.value * STEP_RATE)) * walk.value,
      cheer.value > 0
        ? Math.abs(Math.sin(cheerPhase(cheer.value) * Math.PI * 2))
        : 0,
    );

    return { opacity: 1 - air * 0.5, transform: [{ scale: 1 - air * 0.24 }] };
  }, []);

  const eyeStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateY: sadness.value * 2.5 * u },
        {
          // the happy squint while cheering, the heavy lid while sad
          scaleY:
            blink.value *
            (cheer.value > 0 ? 0.5 : 1 - sadness.value * 0.45),
        },
      ],
    }),
    [u],
  );

  const cheekStyle = useAnimatedStyle(() => ({
    opacity: 1 - sadness.value,
  }));

  // The smile is one curved stroke, so half a turn is the whole frown — no
  // second shape to keep in sync with the first.
  const smileStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sadness.value * 3.5 * u },
      { rotate: `${sadness.value * 180}deg` },
      { scale: cheer.value > 0 ? 1.45 : 1 - sadness.value * 0.12 },
    ],
  }), [u]);

  // Rides the actor rather than the body: the body carries the horizontal flip
  // that turns the blob around, and a mirrored bubble would read backwards.
  /**
   * Everything here is in service of crisp glyphs.
   *
   * The bubble is deliberately *not* a child of the actor. The actor is scaled
   * (nearer the front of the room reads larger) and sits at whatever sub-pixel
   * offset the walk has reached; text inheriting both is drawn at 1.04x on a
   * half pixel, which is exactly the soft, low-res look. So the bubble tracks
   * the blob by computing the same position itself, rounds it to the pixel
   * grid, and inherits no scale at all.
   */
  const bubblePositionStyle = useAnimatedStyle(() => {
    const x = (HALF_W * side.value + ORIGIN_X) * u;
    const y = (HALF_D * depth.value + ORIGIN_Y) * u;

    return {
      opacity: Math.min(1, bubble.value * 2),
      transform: [
        { translateX: Math.round(x) },
        { translateY: Math.round(y) },
      ],
    };
  }, [u]);

  const styles = useMemo(() => createStyles(u), [u]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.actor, actorStyle]}>
        <Animated.View style={[styles.shadow, shadowStyle]} />
        <Animated.View style={[styles.foot, styles.backFoot, backFootStyle]} />
        <Animated.View style={[styles.foot, styles.frontFoot, frontFootStyle]} />
        <Animated.View style={[styles.body, bodyStyle]}>
          <View style={styles.sheen} />
          <Animated.View style={[styles.cheeks, cheekStyle]}>
            {[-1, 1].map((side) => (
              <View
                key={`cheek-${side}`}
                style={[
                  styles.cheek,
                  side < 0 ? styles.leftCheek : styles.rightCheek,
                ]}
              />
            ))}
          </Animated.View>
          <Animated.View style={[styles.eye, styles.leftEye, eyeStyle]} />
          <Animated.View style={[styles.eye, styles.rightEye, eyeStyle]} />
          <Animated.View style={[styles.smile, smileStyle]} />
        </Animated.View>
        <Sparkle cheer={cheer} u={u} x={-27} y={-62} delay={0} />
        <Sparkle cheer={cheer} u={u} x={3} y={-74} delay={0.14} />
        <Sparkle cheer={cheer} u={u} x={27} y={-58} delay={0.28} />
      </Animated.View>

      {speech == null ? null : (
        <Animated.View style={[styles.bubble, bubblePositionStyle]}>
          <MochiSpeechBubble
            text={speech}
            progress={bubble}
            tail="bottom"
            unit="character"
            fillStyle={styles.bubbleFill}
            tailStyle={styles.bubbleTail}
            textStyle={styles.bubbleText}
          />
        </Animated.View>
      )}
    </View>
  );
});

/**
 * Its only prop is a width, and everything it animates lives in shared values —
 * so a parent re-render can never tell it anything it does not already know.
 * Memoised because its hosts (Home, the onboarding story beats) re-render for
 * reasons that have nothing to do with the blob.
 */
export default memo(RoomBlob);

/** 0 at the start of the reaction, 1 at the end */
function cheerPhase(remaining: number) {
  'worklet';
  return 1 - Math.max(0, remaining) / CHEER_DUR;
}

/** feet lift on their own half of the stride, and tuck up on every hop */
function footLift(cycle: number, walking: number, remaining: number) {
  'worklet';
  const stepping = Math.max(0, cycle) * walking;
  const hopping =
    remaining > 0
      ? Math.abs(Math.sin(cheerPhase(remaining) * Math.PI * 2))
      : 0;

  return Math.max(stepping * FOOT_LIFT, hopping * CHEER_HOP);
}

interface SparkleProps {
  cheer: SharedValue<number>;
  u: number;
  /** position above the blob, in viewBox units relative to its ground point */
  x: number;
  y: number;
  /** fraction of the reaction to wait before popping */
  delay: number;
}

function Sparkle({ cheer, u, x, y, delay }: SparkleProps) {
  const style = useAnimatedStyle(() => {
    if (cheer.value <= 0) return { opacity: 0 };

    const local = Math.min(
      1,
      Math.max(0, (cheerPhase(cheer.value) - delay) / (1 - delay)),
    );
    const fade = Math.sin(local * Math.PI);

    return {
      opacity: fade,
      transform: [
        { translateY: -22 * local * u },
        { scale: 0.45 + 0.75 * fade },
      ],
    };
  }, [u, delay]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: (x - SPARKLE / 2) * u,
          top: y * u,
        },
        style,
      ]}
    >
      <Icon name="sparkle" size={SPARKLE * u} color={colors.roomBlob.sparkle} />
    </Animated.View>
  );
}

function createStyles(u: number) {
  /** snap to the device pixel grid — half-pixel edges are what read as low-res */
  const px = (value: number) => PixelRatio.roundToNearestPixel(value);

  return StyleSheet.create({
    /** a zero-size anchor at the blob's contact point with the floor */
    actor: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    },
    shadow: {
      position: 'absolute',
      left: (-SHADOW_W / 2) * u,
      top: (-SHADOW_H / 2) * u,
      width: SHADOW_W * u,
      height: SHADOW_H * u,
      borderRadius: (SHADOW_H / 2) * u,
      backgroundColor: colors.roomBlob.shadow,
    },
    foot: {
      position: 'absolute',
      top: -FOOT_H * u,
      width: FOOT_W * u,
      height: FOOT_H * u,
      borderRadius: (FOOT_H / 2) * u,
      backgroundColor: colors.roomBlob.foot,
    },
    backFoot: { left: (-FOOT_X - FOOT_W / 2) * u },
    frontFoot: { left: (FOOT_X - FOOT_W / 2) * u },
    body: {
      position: 'absolute',
      left: (-BODY_W / 2) * u,
      top: -(BODY_H + BODY_LIFT) * u,
      width: BODY_W * u,
      height: BODY_H * u,
      borderTopLeftRadius: (BODY_W / 2) * u,
      borderTopRightRadius: (BODY_W / 2) * u,
      borderBottomLeftRadius: BODY_ROUND * u,
      borderBottomRightRadius: BODY_ROUND * u,
      backgroundColor: colors.roomBlob.body,
    },
    // No shadow: this view is re-composited on every frame the blob walks, and
    // an unrasterised shadow makes the compositor redraw it each time — which
    // is the stutter, and it softens the edge into the bargain. A hairline
    // border separates it from the wall for free.
    // The container carries position only. Its box and its type scale with the
    // room, both rounded to whole pixels: a fractional font size lands glyphs on
    // half pixels, and a pill that shrank while its text did not used to overflow.
    bubble: {
      position: 'absolute',
      left: px((-BUBBLE_W / 2) * u),
      top: px(-(BODY_H + BODY_LIFT + BUBBLE_GAP + BUBBLE_H) * u),
      width: px(BUBBLE_W * u),
      height: px(BUBBLE_H * u),
    },
    // The pill, which holds no text and so is free to pop. No shadow: this is
    // re-composited on every frame the blob walks, and an unrasterised shadow
    // makes the compositor redraw it each time — the stutter, and a softer edge
    // into the bargain. A hairline border separates it from the wall for free.
    bubbleFill: {
      ...StyleSheet.absoluteFillObject,
      // centres the tail, which is positioned from the bottom only
      alignItems: 'center',
      borderRadius: px((BUBBLE_H / 2) * u),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.subtle,
      backgroundColor: colors.background.card,
    },
    bubbleText: {
      ...typography.label.small,
      fontFamily: fonts.semibold,
      fontSize: Math.round(BUBBLE_FONT * u),
      lineHeight: Math.round(BUBBLE_LINE * u),
      color: colors.text.primary,
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
    sheen: {
      position: 'absolute',
      left: 8 * u,
      top: 7 * u,
      width: 12 * u,
      height: 6 * u,
      borderRadius: 3 * u,
      backgroundColor: colors.roomBlob.bodyLight,
      transform: [{ rotate: '-28deg' }],
    },
    cheeks: {
      ...StyleSheet.absoluteFillObject,
    },
    cheek: {
      position: 'absolute',
      top: CHEEK_TOP * u,
      width: CHEEK_SIZE * u,
      height: CHEEK_SIZE * u,
      borderRadius: (CHEEK_SIZE / 2) * u,
      backgroundColor: colors.roomBlob.cheek,
    },
    leftCheek: {
      left: (BODY_W / 2 + EYE_SHIFT - CHEEK_DX - CHEEK_SIZE / 2) * u,
    },
    rightCheek: {
      left: (BODY_W / 2 + EYE_SHIFT + CHEEK_DX - CHEEK_SIZE / 2) * u,
    },
    eye: {
      position: 'absolute',
      top: 16 * u,
      width: EYE_W * u,
      height: EYE_H * u,
      borderRadius: (EYE_W / 2) * u,
      backgroundColor: colors.roomBlob.face,
    },
    leftEye: { left: (BODY_W / 2 + EYE_SHIFT - EYE_DX - EYE_W / 2) * u },
    rightEye: { left: (BODY_W / 2 + EYE_SHIFT + EYE_DX - EYE_W / 2) * u },
    smile: {
      position: 'absolute',
      top: 30.5 * u,
      left: (BODY_W / 2 + EYE_SHIFT - 5.75) * u,
      width: 11.5 * u,
      height: 6.5 * u,
      borderBottomLeftRadius: 6.5 * u,
      borderBottomRightRadius: 6.5 * u,
      backgroundColor: colors.roomBlob.face,
    },
  });
}
