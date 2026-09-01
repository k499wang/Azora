import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import MochiMouth from './MochiMouth';

/**
 * Mochi cropped to his face, standing on a pair of feet — and waddling on the
 * spot.
 *
 * `MochiPortrait` draws the whole character — a lean, a stance, the ground
 * shadow he stands on. This is the app-icon crop: one shape, straight on, and
 * nothing else. It exists for the places where he is the frame rather than
 * someone standing in it, which today means the sign-in landing.
 *
 * His feet stay square under him rather than taking the portrait's uneven
 * stance. Off-centre feet are what stop him reading as a mannequin when he is
 * standing in a room; centred under a wordmark they only look like he is about
 * to tip over.
 *
 * The waddle is in place: he is centred under the wordmark, so walking anywhere
 * would only pull him off it. He rocks for a short burst of whole steps, then
 * stands and breathes — the same rhythm `RoomBlob` wanders on, which is what
 * keeps him a character idling rather than a looping ornament. Bursts end on a
 * planted foot so he never freezes mid-air when one runs out.
 *
 * His friendly cheeks stay readable at this crop, where the face has to carry
 * the whole character without a room or a prop around him.
 *
 * The constants below mirror `MochiPortrait`'s deliberately rather than
 * importing them, which is the same arrangement `MochiPortrait` has with
 * `RoomBlob`: each renderer measures in its own basis and keeps its own numbers
 * legible in one file.
 */
const BODY_W = 56;
const BODY_H = 66;
/**
 * His corners. The top is a full dome — `BODY_TOP_ROUND` is exactly half his
 * width — and the bottom is nearly one, so the short straight run left on each
 * side reads as a soft loaf rather than a capsule.
 */
const BODY_TOP_ROUND = BODY_W / 2;
const BODY_BOTTOM_ROUND = 26;
/** the line that wraps him; the eyes and mouth are the same ink */
const INK = 1.6;
/** how far he floats above his feet, which is what lets them show below him */
const BODY_LIFT = 4;

const FOOT_W = 17;
const FOOT_H = 11.5;
const FOOT_X = 11.5;

/** the nubs, drawn behind him so his own outline crosses their base */
const NUB_W = 11;
const NUB_H = 9.5;
const NUB_OUT = 5.5;
const NUB_TOP = 39;
/** the right nub hangs a shade lower — he is not a corporate icon */
const NUB_DROP = 1;
const SPRITE_W = BODY_W + NUB_OUT * 2;

/** straight on, so the face is centred rather than carrying his usual offset */
const FACE_CX = BODY_W / 2;
const EYE_DX = 11;
const EYE_W = 5.4;
const EYE_H = 6;
/** high on the body, so the empty plush belly below is most of what you see */
const EYE_TOP = 21;

const MOUTH_W = 13;
const MOUTH_H = 6;
const MOUTH_TOP = 26;

/** the blush, out past the eyes and a little below them */
const CHEEK_W = 9.5;
const CHEEK_H = 6.2;
const CHEEK_DX = 17;
const CHEEK_TOP = 28.5;

/** one full stride cycle is two steps; 0.8 of a cycle a second is an amble */
const STEP_RATE = Math.PI * 2 * 0.8;
/** seconds of stride per step, so a burst can be counted in whole steps */
const STEP_SECONDS = Math.PI / STEP_RATE;

/** the waddle itself, in body units and degrees */
const ROCK_DEG = 5;
const SWAY = 1.6;
const BOUNCE = 2.6;
const FOOT_LIFT = 3.2;
/** how far the free foot swings out from under him as it lifts */
const FOOT_SWING = 1.6;
/** the body pivots on its base rather than its middle, like a weight shift */
const PIVOT_Y = BODY_H / 2;

/** how fast the gait fades in and out, per second */
const WALK_EASE = 6;
/** the standing-still rise and fall */
const BREATH_RATE = 2;

const BURST_MIN_STEPS = 3;
const BURST_EXTRA_STEPS = 4;
const REST_MIN = 1.1;
const REST_SPAN = 2.4;
/** he is standing when the screen opens, and starts up a beat later */
const FIRST_REST = 0.9;

interface MochiFaceProps {
  /** rendered width of his face; everything else scales from it */
  size: number;
}

function MochiFace({ size }: MochiFaceProps) {
  const u = size / BODY_W;
  const reducedMotion = useReducedMotion();

  const clock = useSharedValue(0);
  const stride = useSharedValue(0);
  const strideEnd = useSharedValue(0);
  const walk = useSharedValue(0);
  const rest = useSharedValue(FIRST_REST);

  const frame = useFrameCallback((info) => {
    const dt = Math.min((info.timeSincePreviousFrame ?? 16) / 1000, 0.05);
    clock.value += dt;

    let moving = 0;
    if (rest.value > 0) {
      rest.value -= dt;
      if (rest.value <= 0) {
        const steps =
          BURST_MIN_STEPS + Math.floor(Math.random() * (BURST_EXTRA_STEPS + 1));
        strideEnd.value = stride.value + steps * STEP_SECONDS;
      }
    } else if (stride.value < strideEnd.value) {
      stride.value = Math.min(strideEnd.value, stride.value + dt);
      moving = 1;
      if (stride.value >= strideEnd.value) {
        rest.value = REST_MIN + Math.random() * REST_SPAN;
      }
    }

    walk.value += (moving - walk.value) * Math.min(1, dt * WALK_EASE);
  }, false);

  useEffect(() => {
    if (reducedMotion) return;
    frame.setActive(true);
    return () => frame.setActive(false);
  }, [frame, reducedMotion]);

  const bodyStyle = useAnimatedStyle(() => {
    const cycle = Math.sin(stride.value * STEP_RATE);
    const rock = cycle * walk.value;
    // airborne at mid-step, on the floor at the ends of it
    const air = Math.abs(rock);
    const contact = (1 - Math.abs(cycle)) * walk.value;

    const breath = Math.sin(clock.value * BREATH_RATE) * 0.022 * (1 - walk.value);
    const scaleY = 1 - contact * 0.075 + breath;
    const scaleX = 1 + contact * 0.06 - breath;

    return {
      transform: [
        { translateX: rock * SWAY * u },
        // the squash compensation keeps his base planted on the floor
        {
          translateY: (-air * BOUNCE + (BODY_H * (1 - scaleY)) / 2) * u,
        },
        { translateY: PIVOT_Y * u },
        { rotateZ: `${rock * ROCK_DEG}deg` },
        { translateY: -PIVOT_Y * u },
        { scaleX },
        { scaleY },
      ],
    };
  }, [u]);

  // He leans onto one foot and lifts the other, so each foot is free exactly
  // when the rock is running away from it.
  const leftFootStyle = useAnimatedStyle(() => {
    const rock = Math.sin(stride.value * STEP_RATE) * walk.value;
    return footTransform(rock, -1, u);
  }, [u]);

  const rightFootStyle = useAnimatedStyle(() => {
    const rock = Math.sin(stride.value * STEP_RATE) * walk.value;
    return footTransform(rock, 1, u);
  }, [u]);

  return (
    <View style={{ width: SPRITE_W * u, height: (BODY_H + BODY_LIFT) * u }}>
      {[-FOOT_X, FOOT_X].map((offset, index) => (
        <Animated.View
          key={`foot-${offset}`}
          style={[
            styles.foot,
            {
              left: (SPRITE_W / 2 + offset - FOOT_W / 2) * u,
              width: FOOT_W * u,
              height: FOOT_H * u,
              borderRadius: (FOOT_H / 2) * u,
              borderWidth: INK * u,
            },
            index === 0 ? leftFootStyle : rightFootStyle,
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.sprite,
          { bottom: BODY_LIFT * u, width: SPRITE_W * u, height: BODY_H * u },
          bodyStyle,
        ]}
      >
        {[-1, 1].map((side) => (
          <View
            key={`nub-${side}`}
            style={[
              styles.nub,
              {
                left: side < 0 ? 0 : (SPRITE_W - NUB_W) * u,
                top: (NUB_TOP + (side < 0 ? 0 : NUB_DROP)) * u,
                width: NUB_W * u,
                height: NUB_H * u,
                borderRadius: (NUB_H / 2) * u,
                borderWidth: INK * u,
              },
            ]}
          />
        ))}

        <View
          style={[
            styles.face,
            {
              left: NUB_OUT * u,
              width: BODY_W * u,
              height: BODY_H * u,
              borderTopLeftRadius: BODY_TOP_ROUND * u,
              borderTopRightRadius: BODY_TOP_ROUND * u,
              borderBottomLeftRadius: BODY_BOTTOM_ROUND * u,
              borderBottomRightRadius: BODY_BOTTOM_ROUND * u,
              borderWidth: INK * u,
            },
          ]}
        >
          {[-1, 1].map((side) => (
            <View
              key={`cheek-${side}`}
              style={[
                styles.cheek,
                {
                  left: (FACE_CX + side * CHEEK_DX - CHEEK_W / 2 - INK) * u,
                  top: (CHEEK_TOP - INK) * u,
                  width: CHEEK_W * u,
                  height: CHEEK_H * u,
                  borderRadius: (CHEEK_H / 2) * u,
                },
              ]}
            />
          ))}

          {[-EYE_DX, EYE_DX].map((offset) => (
            <View
              key={`eye-${offset}`}
              style={[
                styles.eye,
                {
                  left: (FACE_CX + offset - EYE_W / 2 - INK) * u,
                  top: (EYE_TOP - INK) * u,
                  width: EYE_W * u,
                  height: EYE_H * u,
                  borderRadius: (EYE_W / 2) * u,
                },
              ]}
            />
          ))}

          <View
            style={[
              styles.mouth,
              {
                left: (FACE_CX - MOUTH_W / 2 - INK) * u,
                top: (MOUTH_TOP - INK) * u,
              },
            ]}
          >
            <MochiMouth kind="smile" w={MOUTH_W} h={MOUTH_H} u={u} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/** `side` is -1 for the left foot, 1 for the right */
function footTransform(rock: number, side: -1 | 1, u: number) {
  'worklet';
  const free = Math.max(0, -side * rock);

  return {
    transform: [
      { translateX: (rock * SWAY * 0.4 + side * free * FOOT_SWING) * u },
      { translateY: -free * FOOT_LIFT * u },
    ],
  };
}

const styles = StyleSheet.create({
  // Same fill and same ink as the body, drawn before it so his outline runs
  // across their tops and only the bean end shows.
  foot: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.roomBlob.body,
    borderColor: colors.roomBlob.ink,
  },
  /** the whole creature, nubs included, rocking as one */
  sprite: { position: 'absolute', left: 0 },
  nub: {
    position: 'absolute',
    backgroundColor: colors.roomBlob.body,
    borderColor: colors.roomBlob.ink,
  },
  // Clips the mouth to his silhouette, so it can stay a plain rectangle placed
  // by its own numbers.
  face: {
    position: 'absolute',
    top: 0,
    backgroundColor: colors.roomBlob.body,
    borderColor: colors.roomBlob.ink,
    overflow: 'hidden',
  },
  cheek: { position: 'absolute', backgroundColor: colors.roomBlob.cheek },
  eye: { position: 'absolute', backgroundColor: colors.roomBlob.ink },
  mouth: { position: 'absolute' },
});

// Its only prop is a number, so without this it rebuilds its shared values'
// consumers on every parent render for no change on screen.
export default memo(MochiFace);
