import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

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
const BODY_W = 54;
const BODY_H = 48;
/** how far his bottom corners are rounded off, in body units */
const BODY_ROUND = BODY_H / 2;
/** how far he floats above his feet, which is what lets them show below him */
const BODY_LIFT = 6;

const FOOT_W = 19;
const FOOT_H = 9.5;
const FOOT_X = 13;

/** straight on, so the face is centred rather than carrying his usual offset */
const FACE_CX = BODY_W / 2;
const EYE_DX = 8.5;
const EYE_W = 8;
const EYE_H = 9;
const EYE_TOP = 16;

const MOUTH_W = 11.5;
const MOUTH_H = 6.5;
const MOUTH_TOP = 30.5;

const CHEEK_SIZE = 4.8;
const CHEEK_DX = 15.5;
const CHEEK_TOP = 25.5;

const SHEEN_LEFT = 8;
const SHEEN_TOP = 7;
const SHEEN_W = 12;
const SHEEN_H = 6;

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
    <View style={{ width: BODY_W * u, height: (BODY_H + BODY_LIFT) * u }}>
      {[-FOOT_X, FOOT_X].map((offset, index) => (
        <Animated.View
          key={`foot-${offset}`}
          style={[
            styles.foot,
            {
              left: (FACE_CX + offset - FOOT_W / 2) * u,
              width: FOOT_W * u,
              height: FOOT_H * u,
              borderRadius: (FOOT_H / 2) * u,
            },
            index === 0 ? leftFootStyle : rightFootStyle,
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.face,
          {
            bottom: BODY_LIFT * u,
            width: BODY_W * u,
            height: BODY_H * u,
            borderTopLeftRadius: (BODY_W / 2) * u,
            borderTopRightRadius: (BODY_W / 2) * u,
            borderBottomLeftRadius: BODY_ROUND * u,
            borderBottomRightRadius: BODY_ROUND * u,
          },
          bodyStyle,
        ]}
      >
        <View
          style={[
            styles.sheen,
            {
              left: SHEEN_LEFT * u,
              top: SHEEN_TOP * u,
              width: SHEEN_W * u,
              height: SHEEN_H * u,
              borderRadius: (SHEEN_H / 2) * u,
              transform: [{ rotate: '-28deg' }],
            },
          ]}
        />

        {[-1, 1].map((side) => (
          <View
            key={`cheek-${side}`}
            style={[
              styles.cheek,
              {
                left: (FACE_CX + side * CHEEK_DX - CHEEK_SIZE / 2) * u,
                top: CHEEK_TOP * u,
                width: CHEEK_SIZE * u,
                height: CHEEK_SIZE * u,
                borderRadius: (CHEEK_SIZE / 2) * u,
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
                left: (FACE_CX + offset - EYE_W / 2) * u,
                top: EYE_TOP * u,
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
              left: (FACE_CX - MOUTH_W / 2) * u,
              top: MOUTH_TOP * u,
              width: MOUTH_W * u,
              height: MOUTH_H * u,
              borderBottomLeftRadius: MOUTH_H * u,
              borderBottomRightRadius: MOUTH_H * u,
            },
          ]}
        />
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
  foot: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.roomBlob.foot,
  },
  // Clips the sheen, cheeks and mouth to his silhouette, so each one can stay a
  // plain rectangle placed by its own numbers.
  face: {
    position: 'absolute',
    left: 0,
    backgroundColor: colors.roomBlob.body,
    overflow: 'hidden',
  },
  sheen: { position: 'absolute', backgroundColor: colors.roomBlob.bodyLight },
  cheek: { position: 'absolute', backgroundColor: colors.roomBlob.cheek },
  eye: { position: 'absolute', backgroundColor: colors.roomBlob.face },
  mouth: { position: 'absolute', backgroundColor: colors.roomBlob.face },
});

// Its only prop is a number, so without this it rebuilds its shared values'
// consumers on every parent render for no change on screen.
export default memo(MochiFace);
