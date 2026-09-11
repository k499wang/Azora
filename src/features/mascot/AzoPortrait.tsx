import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Polygon,
  Rect,
} from 'react-native-svg';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import {
  FACES,
  POKED,
  blinkFace,
  eyeOpenness,
  lerpFace,
  type AzoExpression,
  type AzoFace,
} from './azoFace';
import { eyePath, lensPath } from './faceGeometry';
import {
  ARM_LEFT_PATH,
  ARM_RIGHT_PATH,
  AZO_ASPECT,
  BELLY_PATH,
  BODY_PATH,
  EAR_INNER_LEFT_PATH,
  EAR_INNER_RIGHT_PATH,
  EAR_LEFT_PATH,
  EAR_RIGHT_PATH,
  EYE_LEFT_X,
  EYE_RIGHT_X,
  EYE_Y,
  FEET_Y,
  HEAD_CENTER_X,
  HEAD_PATH,
  HIGHLIGHT_IN,
  HIGHLIGHT_RADIUS,
  HIGHLIGHT_UP,
  IRIS_INSET,
  IRIS_LID_INSET,
  IRIS_RADIUS,
  MOUTH_X,
  MOUTH_Y,
  NOSE_PATH,
  SHADOW_CY,
  SHADOW_RX,
  SHADOW_RY,
  SHOULDER_Y,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  STAGE_X,
  STAGE_Y,
  VIEW_BOX,
} from './azoPaths';

/**
 * Azo, standing still and alive.
 *
 * He is drawn in parts because he moves in parts. Each layer below is the same
 * artwork viewBox under its own transform, stacked in the order the source file
 * draws them — arms behind the body, ears behind the head, face on top — so a
 * swell that starts in the chest arrives at the shoulders and carries the head
 * without anything being animated twice to match.
 *
 * Three things keep him from reading as a picture with a pulse:
 *
 * - **He pivots at his feet.** Every swell, lean and shimmy scales or rotates
 *   about the floor line, which is the one part of him that is nailed down.
 * - **His ears lag.** A single spring follows the body a beat behind, and the
 *   ears draw the difference. Top-heavy ears overshooting a landing is the whole
 *   of what makes him a koala rather than a recoloured blob — and it is the same
 *   spring in the idle sway and in the poke, so he has one weight, not two.
 * - **His face is geometry, not pictures.** Blinks and the poke interpolate the
 *   same numbers an expression is made of, so a squint blinks from where it
 *   already is instead of snapping open first.
 */

/** How far the chest swells on a full idle breath. */
const BREATH_FILL = 0.035;
/** A rib cage that got deeper got wider too, as a share of the swell. */
const WIDEN_SHARE = 0.5;
/** How much further than the chest the arms travel outward. */
const ARM_SWING_SHARE = 1.1;
const BREATH_MS = 3200;

/**
 * The idle sway, in degrees.
 *
 * A lean about the floor line and nothing else. Sliding him sideways as well
 * takes his feet with him, and a character whose feet travel is a cutout being
 * pushed around rather than one shifting its weight — so the whole of the bob is
 * this one angle, and everything below the knees stays where it was drawn: at
 * this lean an ankle moves a couple of units against the head's thirty.
 */
const LEAN_DEG = 2.8;
/** Deliberately not a multiple of the breath, so the two never lock into a beat. */
const SWAY_MS = 2600;

/**
 * The poke: his face, and his ears.
 *
 * Nothing about the head or the body moves. This drawing is flat, front-on and
 * symmetrical — it has no near ear and no far ear, no perspective on the muzzle
 * — so any transform of the whole silhouette reads as a cutout being moved
 * rather than an animal moving. A tip of the head is the worst of them: a real
 * head tipping shrinks the far ear and slides the nose across the face, and a
 * rigid pivot does neither, which is exactly what reads as uncanny.
 *
 * What the drawing can honestly do is redraw its face and swivel its ears. An
 * ear rotates in its own plane, so a flat drawing of one turning is correct
 * rather than a faked depth cue — and koalas do it constantly.
 */
const FLICK_DEG = 7;
/** the ears splay outward together, so one impulse mirrors across the pair */
const EAR_BASE_RIGHT_X = 300;
const EAR_BASE_LEFT_X = 591;
const EAR_BASE_Y = 300;

/** How hard the ears are tied to the head, and how freely they overshoot. */
const EAR_STIFFNESS = 165;
const EAR_DAMPING = 12;
/** How much of the lag the ears actually draw, once the head has moved. */
const EAR_TRAIL = 0.8;

const BLINK_MIN_S = 2.4;
const BLINK_RANGE_S = 4;
const BLINK_HOLD_S = 0.11;

/**
 * Where the lids stop reading as a squint and start reading as shut. The ink
 * that fills the aperture fades in across this range, so a closing eye darkens
 * as it narrows instead of snapping to a line.
 */
const LID_SHUT_AT = 0.3;
const LID_OPEN_AT = 0.58;

/** How far the face climbs the skull at the top of a breath, in artwork units. */
const FACE_CLIMB = 7;

const SPARKLES = [
  { x: 168, y: 196, r: 34 },
  { x: 726, y: 168, r: 28 },
  { x: 108, y: 452, r: 24 },
  { x: 782, y: 424, r: 32 },
  { x: 446, y: -46, r: 26 },
] as const;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A four-pointed star: four quadratics that all pinch back to the centre. */
function sparklePath(x: number, y: number, r: number): string {
  return (
    `M ${x} ${y - r} Q ${x} ${y} ${x + r} ${y} ` +
    `Q ${x} ${y} ${x} ${y + r} Q ${x} ${y} ${x - r} ${y} ` +
    `Q ${x} ${y} ${x} ${y - r} Z`
  );
}

/**
 * How far the head rides above where the artwork puts it, in artwork units.
 *
 * Carried by what the shoulders gained rather than animated to match by hand,
 * and read by the ears in the same frame, so they can never come apart from it.
 */
function headLiftArt(fill: number): number {
  'worklet';
  return -(fill - 1) * (FEET_Y - SHOULDER_Y);
}

/** 1 where the lids are shut, 0 where the eye is wide. */
function lidInk(face: AzoFace): number {
  'worklet';
  const open = eyeOpenness(face);
  return Math.min(
    1,
    Math.max(0, (LID_OPEN_AT - open) / (LID_OPEN_AT - LID_SHUT_AT)),
  );
}

function aperture(face: AzoFace, cx: number): string {
  'worklet';
  return eyePath(
    cx,
    EYE_Y,
    face.eyeWidth,
    face.eyeTop,
    face.eyeBottom,
    face.eyeRoundness,
  );
}

/**
 * The eyeball, held inside the lids rather than clipped by them. A lens that
 * narrows with the aperture still runs past its ends, where the two lids have
 * already met, so a closing eye would sprout a whisker either side.
 */
function eyeball(face: AzoFace, cx: number, toward: number): string {
  'worklet';
  const top = Math.max(face.eyeTop + IRIS_LID_INSET, -IRIS_RADIUS) + face.irisUp;
  const bottom = Math.max(
    top,
    Math.min(face.eyeBottom - IRIS_LID_INSET, IRIS_RADIUS) + face.irisUp,
  );
  const width = Math.min(IRIS_RADIUS, face.eyeWidth - IRIS_LID_INSET);
  return eyePath(
    cx + toward * IRIS_INSET + face.irisSide,
    EYE_Y,
    width,
    top,
    bottom,
    face.eyeRoundness,
  );
}

export interface AzoHandle {
  /** play the poke reaction; safe to call again mid-reaction */
  cheer: () => void;
}

interface AzoPortraitProps {
  /** rendered width of the whole sprite box; everything else scales from it */
  size: number;
  expression?: AzoExpression;
  wearing?: AzoWearable;
  holding?: AzoHeld;
  /** false parks every loop — for a screen that is mounted but not on top */
  active?: boolean;
}

export type AzoWearable = 'glasses';
export type AzoHeld = 'notes';

const AzoPortrait = forwardRef<AzoHandle, AzoPortraitProps>(
  function AzoPortrait(
    { size, expression = 'happy', wearing, holding, active = true },
    ref,
  ) {
    const width = size;
    const height = size * AZO_ASPECT;
    const unit = size / STAGE_WIDTH;
    const reducedMotion = useReducedMotion();
    const alive = active && !reducedMotion;

    const breath = useSharedValue(0);
    const sway = useSharedValue(0);
    const flick = useSharedValue(0);
    const joy = useSharedValue(0);
    const sparkle = useSharedValue(0);

    const blink = useSharedValue(0);
    const blinkIn = useSharedValue(BLINK_MIN_S);
    const blinkFor = useSharedValue(0);

    // The ears' own position, and the velocity carrying it. One spring for the
    // lean and one for the vertical, both integrated here rather than sprung by
    // Reanimated, because what they chase is itself moving every frame.
    const earTilt = useSharedValue(0);
    const earTiltVel = useSharedValue(0);
    const earDrop = useSharedValue(0);
    const earDropVel = useSharedValue(0);
    const earSplay = useSharedValue(0);
    const earSplayVel = useSharedValue(0);

    /** Where the layer's centre sits, so a pivot can be measured from it. */
    const atY = useCallback(
      (artY: number) => (artY - (STAGE_Y + STAGE_HEIGHT / 2)) * unit,
      [unit],
    );
    const atX = useCallback(
      (artX: number) => (artX - (STAGE_X + STAGE_WIDTH / 2)) * unit,
      [unit],
    );

    const feetPivot = atY(FEET_Y);
    const earPivotY = atY(EAR_BASE_Y);
    const earPivotRightX = atX(EAR_BASE_RIGHT_X);
    const earPivotLeftX = atX(EAR_BASE_LEFT_X);

    useEffect(() => {
      if (!alive) {
        cancelAnimation(breath);
        cancelAnimation(sway);
        breath.value = 0;
        sway.value = 0;
        return undefined;
      }

      breath.value = 0;
      breath.value = withRepeat(
        withTiming(1, { duration: BREATH_MS, easing: easing.breathe }),
        -1,
        true,
      );
      sway.value = -1;
      sway.value = withRepeat(
        withTiming(1, { duration: SWAY_MS, easing: easing.breathe }),
        -1,
        true,
      );

      return () => {
        cancelAnimation(breath);
        cancelAnimation(sway);
      };
    }, [alive, breath, sway]);

    useEffect(
      () => () => {
        cancelAnimation(flick);
        cancelAnimation(joy);
        cancelAnimation(sparkle);
      },
      [flick, joy, sparkle],
    );

    useEffect(() => {
      if (alive) return;
      blink.value = 0;
      earTilt.value = 0;
      earTiltVel.value = 0;
      earDrop.value = 0;
      earDropVel.value = 0;
      earSplay.value = 0;
      earSplayVel.value = 0;
    }, [
      alive,
      blink,
      earDrop,
      earDropVel,
      earSplay,
      earSplayVel,
      earTilt,
      earTiltVel,
    ]);

    // One frame callback for everything that has to be integrated rather than
    // tweened: the blink clock, and the two springs the ears ride.
    useFrameCallback((frame) => {
      const dt = Math.min(0.05, (frame.timeSincePreviousFrame ?? 16) / 1000);

      blinkIn.value -= dt;
      if (blinkIn.value <= 0) {
        blinkIn.value = BLINK_MIN_S + Math.random() * BLINK_RANGE_S;
        blinkFor.value = BLINK_HOLD_S;
      }
      if (blinkFor.value > 0) blinkFor.value -= dt;
      blink.value = blinkFor.value > 0 ? 1 : 0;

      const leanTarget = sway.value * LEAN_DEG;
      earTiltVel.value +=
        (leanTarget - earTilt.value) * EAR_STIFFNESS * dt -
        earTiltVel.value * EAR_DAMPING * dt;
      earTilt.value += earTiltVel.value * dt;

      // What the ears chase is the head's own height, so they lag the breath
      // rather than being animated to match it.
      const dropTarget = headLiftArt(1 + BREATH_FILL * breath.value);
      earDropVel.value +=
        (dropTarget - earDrop.value) * EAR_STIFFNESS * dt -
        earDropVel.value * EAR_DAMPING * dt;
      earDrop.value += earDropVel.value * dt;

      // The flick is an impulse, not a pose: it is gone in a fifth of a second
      // and the spring is what actually draws the ear — up, past where it was
      // going, and wobbling back down. The overshoot belongs here and nowhere
      // else on him, because an ear is the one light thing he has.
      const splayTarget = flick.value * FLICK_DEG;
      earSplayVel.value +=
        (splayTarget - earSplay.value) * EAR_STIFFNESS * dt -
        earSplayVel.value * EAR_DAMPING * dt;
      earSplay.value += earSplayVel.value * dt;
    }, alive);

    useImperativeHandle(ref, () => ({
      cheer() {
        if (reducedMotion) return;

        flick.value = withSequence(
          withTiming(1, { duration: 110, easing: easing.enter }),
          withTiming(0, { duration: 190, easing: easing.exit }),
        );
        // The face holds well past the ears, because it is the reaction and they
        // are only the punctuation on it.
        joy.value = withSequence(
          withTiming(1, { duration: duration.base, easing: easing.enter }),
          withDelay(
            1000,
            withTiming(0, { duration: duration.slow, easing: easing.exit }),
          ),
        );
        sparkle.value = withSequence(
          withTiming(1, { duration: duration.fast, easing: easing.enter }),
          withTiming(0, { duration: duration.slower, easing: easing.burst }),
        );
      },
    }));

    const face = useDerivedValue(() =>
      blinkFace(lerpFace(FACES[expression], POKED, joy.value), blink.value),
    );

    /** The lid tilt is held by the expression, so a poke never straightens it. */
    const droop = FACES[expression].eyeDroop;

    /** How full the chest is. 1 is a resting chest, and a poke never moves it. */
    const fill = useDerivedValue(() => 1 + BREATH_FILL * breath.value);

    const leanStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: feetPivot },
        { rotate: `${sway.value * LEAN_DEG}deg` },
        { translateY: -feetPivot },
      ],
    }));

    const chestTransform = (widen: number) => {
      'worklet';
      return [
        { translateY: feetPivot },
        { scaleY: fill.value },
        { scaleX: 1 + (fill.value - 1) * widen },
        { translateY: -feetPivot },
      ];
    };

    const bodyStyle = useAnimatedStyle(() => ({
      transform: chestTransform(WIDEN_SHARE),
    }));

    // Part of the same mass as the chest, so they take the same transform: an
    // arm that translated instead would come away from the shoulder it hangs
    // from. The extra swing outward is the only thing they add.
    const armStyle = useAnimatedStyle(() => ({
      transform: chestTransform(WIDEN_SHARE + ARM_SWING_SHARE),
    }));

    const headStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: headLiftArt(fill.value) * unit }],
    }));

    // Each ear turns about its own base, where it actually joins the skull, and
    // carries two things at once: the lag behind the idle sway, which both take
    // the same way, and the flick, which they mirror so the pair splays open
    // rather than leaning together.
    const earTransform = (pivotX: number, pivotY: number, side: number) => {
      'worklet';
      const angle =
        earTilt.value - sway.value * LEAN_DEG + side * earSplay.value;

      return [
        { translateY: headLiftArt(fill.value) * unit },
        {
          translateY:
            (earDrop.value - headLiftArt(fill.value)) * EAR_TRAIL * unit,
        },
        { translateY: pivotY },
        { translateX: pivotX },
        { rotate: `${angle}deg` },
        { translateX: -pivotX },
        { translateY: -pivotY },
      ];
    };

    const earRightStyle = useAnimatedStyle(() => ({
      transform: earTransform(earPivotRightX, earPivotY, -1),
    }));
    const earLeftStyle = useAnimatedStyle(() => ({
      transform: earTransform(earPivotLeftX, earPivotY, 1),
    }));

    // Nested inside the head so it takes the head's lift first and only adds the
    // climb. Without this the head travels and the face reads as painted on the
    // wall behind it.
    const faceStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: -FACE_CLIMB * breath.value * unit }],
    }));

    // He never leaves the ground and his weight never shifts off it, so the
    // shadow only breathes with him.
    const shadowStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 1 + (fill.value - 1) * 0.4 }],
    }));

    const sparkleStyle = useAnimatedStyle(() => ({
      opacity: sparkle.value,
      transform: [{ scale: 0.7 + sparkle.value * 0.45 }],
    }));

    const leftWhiteProps = useAnimatedProps(() => ({
      d: aperture(face.value, EYE_LEFT_X),
    }));
    const rightWhiteProps = useAnimatedProps(() => ({
      d: aperture(face.value, EYE_RIGHT_X),
    }));
    const leftIrisProps = useAnimatedProps(() => ({
      d: eyeball(face.value, EYE_LEFT_X, 1),
      fillOpacity: 1 - lidInk(face.value),
    }));
    const rightIrisProps = useAnimatedProps(() => ({
      d: eyeball(face.value, EYE_RIGHT_X, -1),
      fillOpacity: 1 - lidInk(face.value),
    }));
    // Ink poured into the aperture as the lids come together, so a shut eye is
    // the closing arc itself rather than a separate drawing of one.
    const leftLidProps = useAnimatedProps(() => ({
      d: aperture(face.value, EYE_LEFT_X),
      fillOpacity: lidInk(face.value),
    }));
    const rightLidProps = useAnimatedProps(() => ({
      d: aperture(face.value, EYE_RIGHT_X),
      fillOpacity: lidInk(face.value),
    }));
    const leftGlintProps = useAnimatedProps(() => ({
      fillOpacity: 1 - lidInk(face.value),
    }));
    const rightGlintProps = useAnimatedProps(() => ({
      fillOpacity: 1 - lidInk(face.value),
    }));
    const mouthProps = useAnimatedProps(() => ({
      d: lensPath(
        MOUTH_X,
        MOUTH_Y,
        face.value.mouthWidth,
        face.value.mouthTop,
        face.value.mouthBottom,
      ),
    }));

    const layer = { width, height };

    return (
      <View style={layer} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFillObject, shadowStyle]}>
          <Svg width={width} height={height} viewBox={VIEW_BOX}>
            <Ellipse
              cx={HEAD_CENTER_X}
              cy={SHADOW_CY}
              rx={SHADOW_RX}
              ry={SHADOW_RY}
              fill={colors.koala.shadow}
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFillObject, leanStyle]}>
          <Animated.View style={[StyleSheet.absoluteFillObject, armStyle]}>
            <Svg width={width} height={height} viewBox={VIEW_BOX}>
              <Path d={ARM_RIGHT_PATH} fill={colors.koala.body} />
              <Path d={ARM_LEFT_PATH} fill={colors.koala.body} />
            </Svg>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFillObject, bodyStyle]}>
            <Svg width={width} height={height} viewBox={VIEW_BOX}>
              <Path d={BODY_PATH} fill={colors.koala.body} />
              <Path d={BELLY_PATH} fill={colors.koala.light} />
              {holding === 'notes' ? <Clipboard /> : null}
            </Svg>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFillObject, earRightStyle]}>
            <Svg width={width} height={height} viewBox={VIEW_BOX}>
              <Path d={EAR_RIGHT_PATH} fill={colors.koala.shade} />
              <Path d={EAR_INNER_RIGHT_PATH} fill={colors.koala.earInner} />
            </Svg>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFillObject, earLeftStyle]}>
            <Svg width={width} height={height} viewBox={VIEW_BOX}>
              <Path d={EAR_LEFT_PATH} fill={colors.koala.shade} />
              <Path d={EAR_INNER_LEFT_PATH} fill={colors.koala.earInner} />
            </Svg>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFillObject, headStyle]}>
            <Svg width={width} height={height} viewBox={VIEW_BOX}>
              <Path d={HEAD_PATH} fill={colors.koala.body} />
            </Svg>

            <Animated.View style={[StyleSheet.absoluteFillObject, faceStyle]}>
              <Svg width={width} height={height} viewBox={VIEW_BOX}>
                <G rotation={droop} origin={`${EYE_LEFT_X}, ${EYE_Y}`}>
                  <AnimatedPath
                    fill={colors.koala.eyeWhite}
                    animatedProps={leftWhiteProps}
                  />
                  <AnimatedPath
                    fill={colors.koala.iris}
                    animatedProps={leftIrisProps}
                  />
                  <AnimatedCircle
                    cx={EYE_LEFT_X + IRIS_INSET + HIGHLIGHT_IN}
                    cy={EYE_Y - HIGHLIGHT_UP}
                    r={HIGHLIGHT_RADIUS}
                    fill={colors.koala.eyeWhite}
                    animatedProps={leftGlintProps}
                  />
                  <AnimatedPath
                    fill={colors.koala.iris}
                    animatedProps={leftLidProps}
                  />
                </G>
                <G rotation={-droop} origin={`${EYE_RIGHT_X}, ${EYE_Y}`}>
                  <AnimatedPath
                    fill={colors.koala.eyeWhite}
                    animatedProps={rightWhiteProps}
                  />
                  <AnimatedPath
                    fill={colors.koala.iris}
                    animatedProps={rightIrisProps}
                  />
                  <AnimatedCircle
                    cx={EYE_RIGHT_X - IRIS_INSET - HIGHLIGHT_IN}
                    cy={EYE_Y - HIGHLIGHT_UP}
                    r={HIGHLIGHT_RADIUS}
                    fill={colors.koala.eyeWhite}
                    animatedProps={rightGlintProps}
                  />
                  <AnimatedPath
                    fill={colors.koala.iris}
                    animatedProps={rightLidProps}
                  />
                </G>

                <Path d={NOSE_PATH} fill={colors.koala.shade} />
                <AnimatedPath
                  fill={colors.koala.shade}
                  animatedProps={mouthProps}
                />

                {wearing === 'glasses' ? <Glasses /> : null}
              </Svg>
            </Animated.View>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFillObject, sparkleStyle]}>
          <Svg width={width} height={height} viewBox={VIEW_BOX}>
            {SPARKLES.map((star) => (
              <Path
                key={`${star.x}-${star.y}`}
                d={sparklePath(star.x, star.y, star.r)}
                fill={colors.koala.sparkle}
              />
            ))}
          </Svg>
        </Animated.View>
      </View>
    );
  },
);

/**
 * The clipboard and pencil he takes notes with.
 *
 * Drawn into the body layer rather than a layer of their own, so they swell and
 * lean with the chest they are held against instead of floating in front of one,
 * and drawn after it so each sits over the hand that holds it.
 *
 * Nothing about him moves to hold them. The arms stay exactly where the artwork
 * puts them — down at his sides — and the board and the pencil are placed at the
 * point each arm ends on, so he is holding them in the pose he already stands
 * in. Both anchors are those two path endpoints, which is why they are the only
 * coordinates here that are not round numbers.
 */
const HAND_RIGHT_X = 239.73;
const HAND_LEFT_X = 651.32;
const HAND_Y = 785.98;

/** set outboard of the paw and lifted, so it hangs off the hand rather than the chest */
const BOARD_X = HAND_RIGHT_X - 22;
const BOARD_Y = HAND_Y - 46;
const BOARD_W = 248;
const BOARD_H = 282;
const BOARD_TILT = -12;
/** the back of the clip, the one fitting still visible from behind */
const CLIP_W = 0.34;
const CLIP_H = 0.12;

/** held through its middle, out past the paw and angled up away from the board */
const PENCIL_X = HAND_LEFT_X + 62;
const PENCIL_Y = HAND_Y - 34;
const PENCIL_TILT = 35;
const PENCIL_W = 58;
const PENCIL_HALF = 152;
const ERASER_H = 26;
const FERRULE_H = 19;
const TIP_H = 56;
const LEAD_H = 19;

function Pencil() {
  const left = PENCIL_X - PENCIL_W / 2;
  const top = PENCIL_Y - PENCIL_HALF;
  const point = PENCIL_Y + PENCIL_HALF;
  const wood = point - TIP_H;
  const lead = point - LEAD_H;
  const barrel = top + ERASER_H + FERRULE_H;
  // the graphite is the last stretch of the same cone, so it narrows in step
  const leadHalf = (PENCIL_W / 2) * (LEAD_H / TIP_H);

  return (
    <G rotation={PENCIL_TILT} origin={`${PENCIL_X}, ${PENCIL_Y}`}>
      <Rect
        x={left}
        y={top}
        width={PENCIL_W}
        height={ERASER_H}
        rx={11}
        fill={colors.koala.sheet}
      />
      <Rect
        x={left}
        y={top + ERASER_H}
        width={PENCIL_W}
        height={FERRULE_H}
        fill={colors.koala.rule}
      />
      <Rect
        x={left}
        y={barrel}
        width={PENCIL_W}
        height={wood - barrel}
        fill={colors.koala.sparkle}
      />
      <Polygon
        points={`${left},${wood} ${left + PENCIL_W},${wood} ${PENCIL_X},${point}`}
        fill={colors.koala.board}
      />
      <Polygon
        points={`${PENCIL_X - leadHalf},${lead} ${PENCIL_X + leadHalf},${lead} ${PENCIL_X},${point}`}
        fill={colors.koala.iris}
      />
    </G>
  );
}

function Clipboard() {
  return (
    <>
      <G rotation={BOARD_TILT} origin={`${BOARD_X}, ${BOARD_Y}`}>
        <Rect
          x={BOARD_X - BOARD_W / 2}
          y={BOARD_Y - BOARD_H / 2}
          width={BOARD_W}
          height={BOARD_H}
          rx={20}
          fill={colors.koala.board}
        />
        <Rect
          x={BOARD_X - (BOARD_W * CLIP_W) / 2}
          y={BOARD_Y - BOARD_H / 2 - BOARD_H * CLIP_H * 0.3}
          width={BOARD_W * CLIP_W}
          height={BOARD_H * CLIP_H}
          rx={10}
          fill={colors.koala.boardEdge}
        />
      </G>
      <Pencil />
    </>
  );
}

/**
 * Reading glasses, sized to clear the nose rather than sit on it — the bridge
 * passes above the muzzle the artwork gives him, which is where a pair on a
 * koala has to go.
 */
const LENS_W = 172;
const LENS_H = 152;
const RIM = 13;

function Glasses() {
  const lens = (cx: number) => (
    <Rect
      x={cx - LENS_W / 2}
      y={EYE_Y - LENS_H / 2}
      width={LENS_W}
      height={LENS_H}
      rx={46}
      fill={colors.koala.eyeWhite}
      fillOpacity={0.3}
      stroke={colors.koala.iris}
      strokeWidth={RIM}
    />
  );

  return (
    <G>
      {lens(EYE_LEFT_X)}
      {lens(EYE_RIGHT_X)}
      <Path
        d={`M ${EYE_LEFT_X + LENS_W / 2} ${EYE_Y - 18} Q ${HEAD_CENTER_X} ${EYE_Y - 58} ${EYE_RIGHT_X - LENS_W / 2} ${EYE_Y - 18}`}
        fill="none"
        stroke={colors.koala.iris}
        strokeWidth={RIM}
        strokeLinecap="round"
      />
      <Path
        d={`M ${EYE_LEFT_X - LENS_W / 2} ${EYE_Y - 8} L ${EYE_LEFT_X - LENS_W / 2 - 46} ${EYE_Y + 16}`}
        fill="none"
        stroke={colors.koala.iris}
        strokeWidth={RIM}
        strokeLinecap="round"
      />
      <Path
        d={`M ${EYE_RIGHT_X + LENS_W / 2} ${EYE_Y - 8} L ${EYE_RIGHT_X + LENS_W / 2 + 46} ${EYE_Y + 16}`}
        fill="none"
        stroke={colors.koala.iris}
        strokeWidth={RIM}
        strokeLinecap="round"
      />
    </G>
  );
}

export default memo(AzoPortrait);
