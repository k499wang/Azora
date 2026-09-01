import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
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
import MochiMouth from './MochiMouth';
import MochiSpeechBubble from './MochiSpeechBubble';
import {
  BLOB_HALF_W,
  START,
  planWalk,
  type FloorGrid,
} from './blobWalk';
import { flatFloor } from './roomLayers';
import {
  FLOOR_HALF_D,
  FLOOR_HALF_W,
  VIEW_BOX_HEIGHT,
  VIEW_BOX_WIDTH,
} from './roomGeometry';
import { useWhileVisible } from '../../hooks/useWhileVisible';

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
 * Where it walks and how it gets around the furniture lives in `blobWalk`; this
 * file owns only how the walking looks.
 */

/** viewBox units per second, and how long it stands about between trips */
const SPEED = 32;
const REST_MIN = 0.8;
const REST_VARY = 2.2;

/**
 * How far past a piece's front edge it has to be before it changes places with
 * it in the paint order. Without the band, a blob idling on the line would swap
 * layers every few frames and re-render the room with it.
 */
const CUT_HYSTERESIS = 3;

/** one full stride cycle is two steps */
const STEP_RATE = Math.PI * 2 * 0.95;

/**
 * Blob geometry, in viewBox units — scaled to the rendered room by `u`.
 *
 * He is a tall soft loaf drawn with one ink line all the way round: a full dome
 * on top, an almost-full one underneath, and his weight low. Nothing about him
 * is anatomy — the nubs and the feet are lobes stuck on a single shape.
 */
const BODY_W = BLOB_HALF_W * 2;
const BODY_H = 66;
const BODY_TOP_ROUND = BODY_W / 2;
const BODY_BOTTOM_ROUND = 26;
/** the line that wraps him; the eyes and mouth are the same ink */
const INK = 1.6;
/**
 * How far the body floats above the ground point, which is both how much of the
 * feet shows below it and — the other way round — how deeply they tuck into it.
 * The tuck has to stay deeper than anything the body does vertically, or a
 * walking blob opens daylight between itself and the foot it is standing on,
 * and the legs read as two pills following it around.
 */
const BODY_LIFT = 4;
const FOOT_W = 17;
const FOOT_H = 11.5;
const FOOT_X = 11.5;
const SHADOW_W = 62;
const SHADOW_H = 17;
/**
 * The nubs. They are arms only in the sense that they are on the sides — barely
 * a lobe each, drawn behind him so his own outline crosses their base and the
 * three shapes stay one creature. `NUB_OUT` is all that shows.
 */
const NUB_W = 11;
const NUB_H = 9.5;
const NUB_OUT = 5.5;
const NUB_TOP = 39;
/** the right nub hangs a shade lower — he is not a corporate icon */
const NUB_DROP = 1;
/** the sprite's box: the body plus whatever the nubs stick out past it */
const SPRITE_W = BODY_W + NUB_OUT * 2;
/**
 * The face is tiny and sits high, so the whole lower two-thirds of him is empty
 * body. Eye centres land 36% of the way down, which is what leaves the long
 * plush belly below them.
 */
const EYE_W = 5.4;
const EYE_H = 6;
const EYE_TOP = 21;
const EYE_DX = 11;
/** the whole face sits off-centre so the horizontal flip reads as a turn */
const EYE_SHIFT = 1.5;
const MOUTH_W = 13;
const MOUTH_H = 6;
const MOUTH_TOP = 26;
/** the blush, out past the eyes and a little below them */
const CHEEK_W = 9.5;
const CHEEK_H = 6.2;
const CHEEK_DX = 17;
const CHEEK_TOP = 28.5;
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

/**
 * The walk is a waddle: it rocks over the foot it is standing on rather than
 * hopping off the floor. The bounce is what used to carry it, and what used to
 * pull the body off its feet, so it is now barely there — the sway, the tip and
 * the scissoring feet do the work.
 */
const BOUNCE = 1.8;
const FOOT_LIFT = 3;
const STRIDE = 5.5;
const LEAN_DEG = 3.5;
/** how far it leans over the planted foot, and how far it tips doing it */
const WADDLE_X = 2.8;
const WADDLE_DEG = 6;
/** the feet come part of the way with the sway, so the three stay one creature */
const FOOT_SWAY = 0.35;
/** it rocks about the floor under it, not about its own middle */
const ROLL_PIVOT = BODY_H / 2 + BODY_LIFT;

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
  /**
   * Which floor it may walk, from `roomFloor(picks)`. Omit it and the blob
   * keeps to the floor no decoration can ever reach, which is the right answer
   * for a host that paints it on top of finished artwork.
   */
  floor?: FloorGrid;
  /**
   * The front edge of each floor-standing piece, ascending, when the host
   * paints the room in layers around the blob. It reports back how many of them
   * it is standing in front of, and only when that count changes.
   */
  frontEdges?: number[];
  onPassed?: (passed: number) => void;
}

const NO_EDGES: number[] = [];

const RoomBlob = forwardRef<RoomBlobHandle, Props>(function RoomBlob(
  { width, speech, sad = false, floor, frontEdges = NO_EDGES, onPassed },
  ref,
) {
  const u = width / VIEW_BOX_WIDTH;
  const reducedMotion = useReducedMotion();
  const walkable = floor ?? flatFloor();

  const pa = useSharedValue(START.a);
  const pb = useSharedValue(START.b);
  /** the route it is walking, as flat `a, b` pairs, and the leg it is on */
  const route = useSharedValue<number[]>([]);
  const leg = useSharedValue(0);
  const routing = useSharedValue(false);
  const edges = useSharedValue<number[]>(frontEdges);
  /** -1 until the first frame has worked out where it stands in the paint order */
  const passed = useSharedValue(-1);
  const rest = useSharedValue(REST_MIN);
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

  const planRoute = useCallback(
    (a: number, b: number) => {
      const flat: number[] = [];
      for (const point of planWalk(walkable, { a, b })) {
        flat.push(point.a, point.b);
      }

      route.value = flat;
      leg.value = 0;
      routing.value = false;
      // nowhere to go — wait out a rest rather than asking again every frame
      if (flat.length === 0) rest.value = REST_MIN + REST_VARY;
    },
    [leg, rest, route, routing, walkable],
  );

  const report = useCallback(
    (count: number) => onPassed?.(count),
    [onPassed],
  );

  useEffect(() => {
    // a redecorated room is a different floor plan: drop the route mid-walk
    route.value = [];
    leg.value = 0;
    routing.value = false;
  }, [leg, route, routing, walkable]);

  useEffect(() => {
    edges.value = frontEdges;
    passed.value = -1;
  }, [edges, frontEdges, passed]);

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
    // the branch that asks for somewhere new to walk
    if (sadness.value > 0.5) {
      rest.value = Math.max(rest.value, 0.5);
    }

    let moving = 0;
    if (rest.value > 0) {
      rest.value -= dt;
    } else if (leg.value * 2 >= route.value.length) {
      // Routes are planned on the js thread, so the blob idles for the frame or
      // two that takes rather than blocking here for them.
      if (!routing.value) {
        routing.value = true;
        runOnJS(planRoute)(pa.value, pb.value);
      }
    } else {
      const da = route.value[leg.value * 2] - pa.value;
      const db = route.value[leg.value * 2 + 1] - pb.value;
      const dx = FLOOR_HALF_W * (da - db);
      const dy = FLOOR_HALF_D * (da + db);
      const distance = Math.hypot(dx, dy);

      if (distance < 1) {
        pa.value += da;
        pb.value += db;
        leg.value += 1;
        if (leg.value * 2 >= route.value.length) {
          rest.value = REST_MIN + Math.random() * REST_VARY;
        }
      } else {
        const step = Math.min(1, (SPEED * dt) / distance);
        pa.value += da * step;
        pb.value += db * step;
        stride.value += dt;
        moving = 1;

        if (Math.abs(dx) > 0.5) {
          heading.value = dx > 0 ? 1 : -1;
        }
      }
    }

    if (edges.value.length > 0) {
      const y = FLOOR_HALF_D * (pa.value + pb.value);
      let count = 0;
      for (let k = 0; k < edges.value.length; k += 1) {
        const line =
          edges.value[k] + (k < passed.value ? -CUT_HYSTERESIS : CUT_HYSTERESIS);
        if (y > line) count += 1;
      }

      if (count !== passed.value) {
        passed.value = count;
        runOnJS(report)(count);
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

  useWhileVisible(() => {
    if (reducedMotion) return () => {};
    frame.setActive(true);
    return () => frame.setActive(false);
  }, [frame, reducedMotion]);

  const actorStyle = useAnimatedStyle(() => {
    const x = FLOOR_HALF_W * (pa.value - pb.value);
    const y = FLOOR_HALF_D * (pa.value + pb.value);

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

    // its weight is on whichever foot is down, so it leans that way and tips
    // with it — one phase, read by the body, the feet and the shadow alike
    const sway = stepCycle * walk.value;
    const slump = sadness.value;

    return {
      transform: [
        { translateX: sway * WADDLE_X * u },
        // the squash compensation keeps the blob's feet planted on the floor
        {
          translateY:
            (-air * BOUNCE -
              hop * CHEER_HOP +
              (BODY_H * (1 - scaleY)) / 2 +
              slump * 3) *
            u,
        },
        // rock about the floor rather than about the middle: pivot down, turn,
        // and come back up
        { translateY: ROLL_PIVOT * u },
        {
          rotateZ: `${
            sway * WADDLE_DEG + facing.value * LEAN_DEG * walk.value + wiggle
          }deg`,
        },
        { translateY: -ROLL_PIVOT * u },
        { scaleX: (scaleX + slump * 0.05) * flip },
        { scaleY: scaleY - slump * 0.06 },
      ],
    };
  }, [u]);

  // The two feet scissor against each other and lean the same way, so each
  // reads the stride itself and negates it. Spelling both out rather than
  // sharing a helper is deliberate: a worklet may call `footLift`, but a worklet
  // calling a helper that calls `footLift` is one hop too deep for the closure
  // to survive the trip to the ui thread.
  const backFootStyle = useAnimatedStyle(() => {
    const step = Math.sin(stride.value * STEP_RATE);

    return {
      transform: [
        {
          translateX:
            (facing.value * step * STRIDE + step * WADDLE_X * FOOT_SWAY) *
            walk.value *
            u,
        },
        { translateY: -footLift(step, walk.value, cheer.value) * u },
      ],
    };
  }, [u]);

  const frontFootStyle = useAnimatedStyle(() => {
    const step = Math.sin(stride.value * STEP_RATE);

    return {
      transform: [
        {
          translateX:
            (-facing.value * step * STRIDE + step * WADDLE_X * FOOT_SWAY) *
            walk.value *
            u,
        },
        { translateY: -footLift(-step, walk.value, cheer.value) * u },
      ],
    };
  }, [u]);

  const shadowStyle = useAnimatedStyle(() => {
    const cycle = Math.sin(stride.value * STEP_RATE);
    // the walk barely leaves the floor now, so the shadow only breathes under
    // it; the cheer is a real hop and still takes the full lift
    const air = Math.max(
      Math.abs(cycle) * walk.value * 0.35,
      cheer.value > 0
        ? Math.abs(Math.sin(cheerPhase(cheer.value) * Math.PI * 2))
        : 0,
    );

    return {
      opacity: 1 - air * 0.5,
      transform: [
        { translateX: cycle * walk.value * WADDLE_X * 0.5 * u },
        { scale: 1 - air * 0.24 },
      ],
    };
  }, [u]);

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

  // The shape of the mouth is `sad`'s job, not this one's — a stem-and-lobes
  // smile turned upside down is a squiggle, not a frown. This only carries it.
  const smileStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sadness.value * 3.5 * u },
      { scale: cheer.value > 0 ? 1.35 : 1 - sadness.value * 0.12 },
    ],
  }), [u]);

  const cheekStyle = useAnimatedStyle(() => ({
    opacity: 1 - sadness.value,
  }));

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
    const x = (FLOOR_HALF_W * (pa.value - pb.value) + ORIGIN_X) * u;
    const y = (FLOOR_HALF_D * (pa.value + pb.value) + ORIGIN_Y) * u;

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
        <Animated.View style={[styles.sprite, bodyStyle]}>
          <View style={[styles.nub, styles.leftNub]} />
          <View style={[styles.nub, styles.rightNub]} />
          <View style={styles.body}>
            <Animated.View style={[styles.cheek, styles.leftCheek, cheekStyle]} />
            <Animated.View
              style={[styles.cheek, styles.rightCheek, cheekStyle]}
            />
            <Animated.View style={[styles.eye, styles.leftEye, eyeStyle]} />
            <Animated.View style={[styles.eye, styles.rightEye, eyeStyle]} />
            <Animated.View style={[styles.smile, smileStyle]}>
              <MochiMouth
                kind={sad ? 'frown' : 'smile'}
                w={MOUTH_W}
                h={MOUTH_H}
                u={u}
              />
            </Animated.View>
          </View>
        </Animated.View>
        <Sparkle cheer={cheer} u={u} x={-27} y={-84} delay={0} />
        <Sparkle cheer={cheer} u={u} x={3} y={-96} delay={0.14} />
        <Sparkle cheer={cheer} u={u} x={27} y={-80} delay={0.28} />
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
 * Everything it animates lives in shared values, so a parent re-render can
 * never tell it anything it does not already know. Memoised because its hosts
 * (Home, the onboarding story beats) re-render for reasons that have nothing to
 * do with the blob — Home re-renders on every layer swap the blob itself asks
 * for, so this is what keeps that from feeding back.
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
    // Same fill and same ink as the body, drawn before it so his outline runs
    // across their tops and only the bean end shows.
    foot: {
      position: 'absolute',
      top: -FOOT_H * u,
      width: FOOT_W * u,
      height: FOOT_H * u,
      borderRadius: (FOOT_H / 2) * u,
      backgroundColor: colors.roomBlob.body,
      borderWidth: INK * u,
      borderColor: colors.roomBlob.ink,
    },
    backFoot: { left: (-FOOT_X - FOOT_W / 2) * u },
    frontFoot: { left: (FOOT_X - FOOT_W / 2) * u },
    /** the whole creature, nubs included, hinging and squashing as one */
    sprite: {
      position: 'absolute',
      left: (-SPRITE_W / 2) * u,
      top: -(BODY_H + BODY_LIFT) * u,
      width: SPRITE_W * u,
      height: BODY_H * u,
    },
    nub: {
      position: 'absolute',
      top: NUB_TOP * u,
      width: NUB_W * u,
      height: NUB_H * u,
      borderRadius: (NUB_H / 2) * u,
      backgroundColor: colors.roomBlob.body,
      borderWidth: INK * u,
      borderColor: colors.roomBlob.ink,
    },
    leftNub: { left: 0 },
    rightNub: {
      left: (SPRITE_W - NUB_W) * u,
      top: (NUB_TOP + NUB_DROP) * u,
    },
    body: {
      position: 'absolute',
      left: NUB_OUT * u,
      top: 0,
      width: BODY_W * u,
      height: BODY_H * u,
      borderTopLeftRadius: BODY_TOP_ROUND * u,
      borderTopRightRadius: BODY_TOP_ROUND * u,
      borderBottomLeftRadius: BODY_BOTTOM_ROUND * u,
      borderBottomRightRadius: BODY_BOTTOM_ROUND * u,
      backgroundColor: colors.roomBlob.body,
      borderWidth: INK * u,
      borderColor: colors.roomBlob.ink,
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
    // The face lives inside the body, and an absolutely positioned child sits
    // against the *inner* edge of a border — so every face offset is measured in
    // body units and then pulled back by the ink it is drawn inside.
    eye: {
      position: 'absolute',
      top: (EYE_TOP - INK) * u,
      width: EYE_W * u,
      height: EYE_H * u,
      borderRadius: (EYE_W / 2) * u,
      backgroundColor: colors.roomBlob.ink,
    },
    leftEye: {
      left: (BODY_W / 2 + EYE_SHIFT - EYE_DX - EYE_W / 2 - INK) * u,
    },
    rightEye: {
      left: (BODY_W / 2 + EYE_SHIFT + EYE_DX - EYE_W / 2 - INK) * u,
    },
    smile: {
      position: 'absolute',
      top: (MOUTH_TOP - INK) * u,
      left: (BODY_W / 2 + EYE_SHIFT - MOUTH_W / 2 - INK) * u,
    },
    cheek: {
      position: 'absolute',
      top: (CHEEK_TOP - INK) * u,
      width: CHEEK_W * u,
      height: CHEEK_H * u,
      borderRadius: (CHEEK_H / 2) * u,
      backgroundColor: colors.roomBlob.cheek,
    },
    leftCheek: {
      left: (BODY_W / 2 + EYE_SHIFT - CHEEK_DX - CHEEK_W / 2 - INK) * u,
    },
    rightCheek: {
      left: (BODY_W / 2 + EYE_SHIFT + CHEEK_DX - CHEEK_W / 2 - INK) * u,
    },
  });
}
