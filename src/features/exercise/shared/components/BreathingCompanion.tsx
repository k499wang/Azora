import { forwardRef, memo, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import type { BreathingCircleRef } from './BreathingCircle';
import {
  EYE_LEFT_X,
  EYE_RIGHT_X,
  EYE_Y,
  FACE_SHAPES,
  HIGHLIGHT_IN,
  HIGHLIGHT_RADIUS,
  HIGHLIGHT_UP,
  IRIS_INSET,
  IRIS_LID_INSET,
  IRIS_RADIUS,
  MOUTH_X,
  MOUTH_Y,
  eyeOpenness,
  eyePath,
  lerpFace,
  type BreathFace,
  type FaceShape,
} from './breathFaces';
import {
  BREATH_RISE_RATIO,
  FACE_ORIGIN_Y,
  getBreathingStage,
  INSEAM_Y,
  NECK_STRETCH_RATIO,
  STAGE_VIEWBOX_H,
  STAGE_VIEWBOX_W,
} from './breathingStage';
import {
  ARM_LEFT_PATH,
  ARM_RIGHT_PATH,
  BELLY_PATH,
  BODY_PATH,
  EAR_INNER_LEFT_PATH,
  EAR_INNER_RIGHT_PATH,
  EAR_LEFT_PATH,
  EAR_RIGHT_PATH,
  HEAD_PATH,
  NOSE_PATH,
  SHOULDER_Y,
} from './koalaPaths';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { colors } from '../../../../theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// He is drawn in parts, so he breathes in parts. The chest inflates from the
// point where his legs part — the lowest thing still on screen — and everything
// above is carried by what the chest gained rather than animated to match by
// hand. Pinning the scale there rather than at the foot of the stage is what
// keeps a full inhale from lifting his legs into view.
const CHEST_FILL = 0.13;
// Every sideways movement is a share of how far the chest has filled, so one
// number drives the whole torso: a hold that only trembles vertically is a rib
// cage that got deeper without getting wider.
const CHEST_WIDEN_SHARE = 0.58;
// The share of the stage between the shoulders and the pivot: how much of the
// chest's growth has arrived by the time it reaches the arms and the head.
const SHOULDER_LEVER = (INSEAM_Y - SHOULDER_Y) / STAGE_VIEWBOX_H;
// How much further than the chest the arms travel outward, again as a share of
// the fill. They are drawn symmetrically about the centre line, so one scale
// pushes both away from it.
const ARM_SWING_SHARE = 1.85;
// And a little way up, on top of what the chest carries them. Kept small on
// purpose: the arms are drawn behind the body and their tips rest near the
// bottom of what the window shows, so a big lift would pull them off it.
const ARM_LIFT = 0.012;
// A deep breath is a lift as much as a swell, and the top of it is a chin
// coming up. A front view cannot rotate a head to show that, so the tilt is
// spelled out entirely in what a nod moves, never in what it deforms: the neck
// comes out of the shoulders, the face climbs the skull, and the ears settle
// down it. Nothing is squashed or stretched to sell it — a head that changes
// shape as it tips reads as rubber, and the parallax between a face riding up a
// silhouette and ears riding down it is the whole of the illusion anyway. The
// neck lives with the layout, since what it lifts is headroom above the ears.
//
// How far the face climbs its own skull at the top of an inhale, as a share of
// the stage. This is the tilt as far as the eye is concerned.
const FACE_CLIMB = 0.042;
// A breath in lifts the chin; a breath out only settles it. Empty lungs are not
// the same pose as a head hanging, so the down half of the nod is the smaller —
// and it is the head alone that takes it, never the face on the head.
const NOD_SETTLE = 0.2;

// The ears are the lightest thing on him, and they hang back — but as a share of
// the travel, never as a delay in time. A second timeline for them is what put a
// jump at the turn of a phase: the moment the breath reverses, a copy that is
// still catching up sits on the wrong side of the head and has to cross it. Read
// off the same number the head is read off, in the same frame, they cannot come
// apart from it — they take the same journey on a softer curve, and agree with
// the head exactly at both ends of it.
// A head going back takes its ears with it, but not to the same place on the
// silhouette: they sit lower down the skull, which is the front view of an ear
// rotating away from you. The other half of the parallax the face gives.
const EAR_SETTLE = 0.018;
// How far behind the head they hang through the middle of a breath. They are
// attached to the skull, so they only give a little — a full lag would slide
// them off the head they are growing out of.
const EAR_GIVE = 0.3;

// Concentric and drawn into one canvas rather than three stacked views: the
// aura is the largest thing on screen and it rescales every frame, so it is
// worth one composited layer instead of three. Radii are in stage widths.
const AURA_RINGS = [
  { radius: 0.92, opacity: 0.08 },
  { radius: 0.75, opacity: 0.13 },
  { radius: 0.6, opacity: 0.2 },
] as const;
const AURA_OUTER = AURA_RINGS[0].radius;
const AURA_EXHALE_SCALE = 0.55;
const AURA_INHALE_SCALE = 1.45;

// A lung fills and empties on a curve, not a ramp — but a shallow one. A full
// sinusoid loiters at both ends of the phase and rushes the middle, which reads
// as the count drifting out of time with the character; this keeps most of the
// travel at an even pace and softens only the last of each end, which is all the
// turnover needs to roll instead of reversing on a corner. The phase clock is a
// separate one-second timer, so this changes how the breath looks, never how
// long it lasts.
const BREATH_EASING = Easing.bezier(0.36, 0.14, 0.64, 0.86);

// Long enough that the eye visibly travels closed rather than blinking there.
const FACE_MORPH_MS = 560;
// Eased, not sprung: an overshoot would carry the character past the position
// the first inhale starts from.
const ENTER_MS = 700;
const EXIT_MS = 320;

// A hold should read as a held breath, not as a bounce: well under a percent of
// the chest, and slow. Both holds get the same tremble — a fuller chest is not a
// busier one, and two holds that shake differently read as two different
// characters rather than one holding two different amounts of air.
const HOLD_STRAIN = 0.006;
const HOLD_PERIOD_MS = 2400;
/** How long a tremble takes to arrive, and to leave when the phase turns over. */
const STRAIN_FADE_MS = 320;

// Where the lids stop reading as a squint and start reading as shut. The ink
// that fills the aperture fades in across this range, so a closing eye darkens
// as it narrows instead of snapping to a line.
const LID_SHUT_AT = 0.3;
const LID_OPEN_AT = 0.58;

interface BreathingCompanionProps {
  /** Whether the owning route is currently visible and allowed to animate. */
  active: boolean;
  face: BreathFace;
  theme: ExerciseDarkTheme;
  reducedMotion: boolean;
  /** False on the technique screen, where the character would cover the copy. */
  visible: boolean;
}

function strainAmplitude(face: BreathFace): number {
  return face === 'holdIn' || face === 'holdOut' ? HOLD_STRAIN : 0;
}

/** Both lids, as one two-subpath outline. */
function eyeAperture(shape: FaceShape): string {
  'worklet';
  const { eyeWidth, eyeTop, eyeBottom, eyeRoundness } = shape;
  return (
    eyePath(EYE_LEFT_X, EYE_Y, eyeWidth, eyeTop, eyeBottom, eyeRoundness) +
    eyePath(EYE_RIGHT_X, EYE_Y, eyeWidth, eyeTop, eyeBottom, eyeRoundness)
  );
}

/** 1 where the lids are shut, 0 where the eye is wide. */
function lidInk(shape: FaceShape): number {
  'worklet';
  const open = eyeOpenness(shape);
  return Math.min(1, Math.max(0, (LID_OPEN_AT - open) / (LID_OPEN_AT - LID_SHUT_AT)));
}

const BreathingCompanion = forwardRef<BreathingCircleRef, BreathingCompanionProps>(
  function BreathingCompanion(
    { active, face, theme, reducedMotion, visible },
    ref,
  ) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // The stage is laid out inside the scaffold's safe area, so every ratio
    // below is measured against that box rather than the whole window.
    const viewport = height - insets.top;

    const {
      width: stageWidth,
      height: stageHeight,
      top: stageTop,
    } = getBreathingStage(width, viewport);
    // The whole of him drifts up on a full breath, on top of what the chest and
    // the shoulders do on their own.
    const rise = viewport * BREATH_RISE_RATIO;
    const auraOffset = (FACE_ORIGIN_Y / STAGE_VIEWBOX_H - 0.5) * stageHeight;
    const auraSize = stageWidth * AURA_OUTER * 2;
    // Far enough that the ears clear the bottom edge before they settle.
    const enterDistance = viewport - stageTop + stageHeight * 0.1;

    const breath = useSharedValue(0);
    const strain = useSharedValue(0);
    const strainDepth = useSharedValue(0);
    const entered = useSharedValue(active && visible ? 1 : 0);
    const faceFrom = useSharedValue(FACE_SHAPES[face]);
    const faceTo = useSharedValue(FACE_SHAPES[face]);
    const faceProgress = useSharedValue(1);

    useEffect(() => {
      if (!active) {
        cancelAnimation(breath);
        cancelAnimation(strain);
        cancelAnimation(strainDepth);
        cancelAnimation(entered);
        cancelAnimation(faceProgress);
        strain.value = 0;
        strainDepth.value = 0;
      }

      return () => {
        cancelAnimation(breath);
        cancelAnimation(strain);
        cancelAnimation(strainDepth);
        cancelAnimation(entered);
        cancelAnimation(faceProgress);
      };
    }, [active, breath, entered, faceProgress, strain, strainDepth]);

    const run = (
      toValue: number,
      durationSeconds: number,
      onComplete?: () => void,
    ) => {
      if (!active) return;

      breath.value = withTiming(
        toValue,
        { duration: durationSeconds * 1000, easing: BREATH_EASING },
        (finished) => {
          'worklet';
          if (finished && onComplete) runOnJS(onComplete)();
        },
      );
    };

    useImperativeHandle(ref, () => ({
      expand(duration, onComplete) {
        run(1, duration, onComplete);
      },
      contract(duration, onComplete) {
        run(0, duration, onComplete);
      },
      pause() {
        cancelAnimation(breath);
      },
      resumeExpand(remainingSecs, onComplete) {
        run(1, remainingSecs, onComplete);
      },
      resumeContract(remainingSecs, onComplete) {
        run(0, remainingSecs, onComplete);
      },
      reset() {
        cancelAnimation(breath);
        breath.value = 0;
      },
    }));

    useEffect(() => {
      if (!active) return;

      // Start from wherever the morph currently sits, so a phase that changes
      // mid-transition continues from the drawn face instead of snapping.
      faceFrom.value = lerpFace(faceFrom.value, faceTo.value, faceProgress.value);
      faceTo.value = FACE_SHAPES[face];
      faceProgress.value = 0;
      faceProgress.value = withTiming(1, {
        duration: reducedMotion ? 0 : FACE_MORPH_MS,
        easing: Easing.inOut(Easing.quad),
      });
    }, [active, face, faceFrom, faceProgress, faceTo, reducedMotion]);

    useEffect(() => {
      if (!active) return;

      if (visible) {
        // Arrive at the position the first inhale starts from, whatever the
        // last session left behind.
        cancelAnimation(breath);
        breath.value = 0;
        entered.value = withTiming(1, {
          duration: ENTER_MS,
          easing: Easing.out(Easing.cubic),
        });
        return;
      }
      entered.value = withTiming(0, {
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
      });
    }, [active, breath, entered, visible]);

    const amplitude = strainAmplitude(face);

    // The tremble is an oscillator times a depth, and the depth is a shared
    // value rather than the plain number it multiplies by. That is what keeps a
    // phase change from stepping: `amplitude` swaps on the JS thread the moment
    // the phase does, and anything reading it directly would drop the whole
    // tremble in one frame — a step the head and the ears both land on. Eased,
    // it goes out the way it came in.
    useEffect(() => {
      if (!active) {
        cancelAnimation(strain);
        cancelAnimation(strainDepth);
        strain.value = 0;
        strainDepth.value = 0;
        return;
      }

      const depth = reducedMotion ? 0 : amplitude;
      strainDepth.value = withTiming(depth, { duration: STRAIN_FADE_MS });

      if (depth === 0) return;

      // Safe to start the new oscillator from zero: the depth it is multiplied
      // by has been easing to nothing since the last hold ended, so the restart
      // has nothing to show.
      strain.value = 0;
      strain.value = withRepeat(
        withTiming(1, {
          duration: HOLD_PERIOD_MS / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );

      return () => {
        cancelAnimation(strain);
      };
    }, [active, amplitude, face, reducedMotion, strain, strainDepth]);

    const shape = useDerivedValue(() =>
      lerpFace(faceFrom.value, faceTo.value, faceProgress.value),
    );

    /** How far the chest has filled, strain included. 1 is a resting chest. */
    const chest = useDerivedValue(
      () => 1 + CHEST_FILL * breath.value + strain.value * strainDepth.value,
    );

    // The chest as the ears have it: the same breath, taken slower through the
    // middle of the phase and landing on the same place at the end of it. The
    // tremble of a hold is passed through untouched, because anything the head
    // does the ears do, or they come loose from it.
    const earChest = (fill: number) => {
      'worklet';
      if (reducedMotion) return fill;
      const filled = Math.min(1, Math.max(0, (fill - 1) / CHEST_FILL));
      const eased = filled * (1 - EAR_GIVE + EAR_GIVE * filled);
      return fill + CHEST_FILL * (eased - filled);
    };

    // Measured from the layer's centre, which is what a React Native transform
    // scales about.
    const chestPivot = (INSEAM_Y / STAGE_VIEWBOX_H - 0.5) * stageHeight;

    const lift = (fill: number) => {
      'worklet';
      return -(fill - 1) * SHOULDER_LEVER * stageHeight;
    };

    // The nod, read off the same number that drives the torso rather than off a
    // second clock: -NOD_SETTLE on empty lungs, +1 on full ones. Strain pushes
    // past the ends and is clamped, so a hold holds the chin where it is and
    // trembles there.
    const nodOf = (fill: number) => {
      'worklet';
      if (reducedMotion) return 0;
      const filled = Math.min(1, Math.max(0, (fill - 1) / CHEST_FILL));
      return filled * (1 + NOD_SETTLE) - NOD_SETTLE;
    };

    const stageStyle = useAnimatedStyle(() => {
      const drift = reducedMotion ? 0 : -rise * breath.value;
      return {
        opacity: Math.min(1, Math.max(0, entered.value)),
        transform: [{ translateY: drift + (1 - entered.value) * enterDistance }],
      };
    });

    // Scaled about the point where his legs part: that is the one part of him
    // that is nailed down, because it is the lowest thing the window shows.
    const chestStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: chestPivot },
        { scaleY: chest.value },
        { scaleX: 1 + (chest.value - 1) * CHEST_WIDEN_SHARE },
        { translateY: -chestPivot },
      ],
    }));

    // Part of the same mass as the chest, so they take the same transform: an
    // arm that only translated would lift its own tip off the bottom edge and
    // show background under it. What they add is the swing, and a slight rise on
    // top of what the chest already carries them — shoulders coming up with the
    // breath. The rise is the up half of the breath only, so on empty lungs they
    // hang exactly where the artwork draws them.
    const armStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY:
            -ARM_LIFT * stageHeight * Math.max(0, nodOf(chest.value)),
        },
        { translateY: chestPivot },
        { scaleY: chest.value },
        {
          scaleX:
            1 +
            (chest.value - 1) *
              (CHEST_WIDEN_SHARE + (reducedMotion ? 0 : ARM_SWING_SHARE)),
        },
        { translateY: -chestPivot },
      ],
    }));

    // Lifted by what the shoulders gained and then by the neck on top of it, and
    // tipped back about the point where it sits on the chest.
    const tiltStyle = (fill: number) => {
      'worklet';
      return {
        transform: [
          {
            translateY:
              lift(fill) - NECK_STRETCH_RATIO * stageHeight * nodOf(fill),
          },
        ],
      };
    };

    const headStyle = useAnimatedStyle(() => tiltStyle(chest.value));

    // The face climbing the skull it is drawn on, nested inside the head so it
    // takes the head's own lift and foreshortening first and only adds the
    // climb. Without this the head travels and the face reads as painted on the
    // wall behind it.
    //
    // Only the up half of the nod moves it. Where the artwork puts the face on
    // the head is where it belongs, so that is the floor: the settle at the
    // bottom of a breath is the head sinking into the shoulders, not the face
    // sliding down toward the chin.
    const faceStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY:
            -FACE_CLIMB * stageHeight * Math.max(0, nodOf(chest.value)),
        },
      ],
    }));

    // Carried by the head, with a little give — the same transform it takes, on
    // the ears' slower reading of the same breath. What they add on top of it is
    // the swing: ears do not hold still on a skull that is turning.
    const earStyle = useAnimatedStyle(() => {
      const fill = earChest(chest.value);
      const { transform } = tiltStyle(fill);
      return {
        transform: [
          ...transform,
          {
            translateY: EAR_SETTLE * stageHeight * Math.max(0, nodOf(fill)),
          },
        ],
      };
    });

    // Centred on his face, so it goes where his face goes.
    const auraStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: auraOffset + lift(chest.value) },
        {
          scale:
            AURA_EXHALE_SCALE +
            (AURA_INHALE_SCALE - AURA_EXHALE_SCALE) * breath.value,
        },
      ],
    }));

    // Both eyes are one path each: they always hold the same shape, so drawing
    // them as two subpaths of one `d` halves the geometry the UI thread rebuilds
    // every frame.
    const eyeWhitesProps = useAnimatedProps(() => ({
      d: eyeAperture(shape.value),
    }));

    // The eyeball is held inside the lids rather than clipped by them, and it
    // hands over to them as they close: a lens that narrows with the aperture
    // still runs past its ends, where the two lids have already met, so a
    // closing eye would sprout a whisker either side. The lid ink it fades into
    // is the same colour, so the handover itself is invisible.
    const irisesProps = useAnimatedProps(() => {
      const s = shape.value;
      const top = Math.max(s.eyeTop + IRIS_LID_INSET, -IRIS_RADIUS);
      const bottom = Math.max(
        top,
        Math.min(s.eyeBottom - IRIS_LID_INSET, IRIS_RADIUS),
      );
      const width = Math.min(IRIS_RADIUS, s.eyeWidth - IRIS_LID_INSET);
      return {
        d:
          eyePath(EYE_LEFT_X + IRIS_INSET, EYE_Y, width, top, bottom, s.eyeRoundness) +
          eyePath(EYE_RIGHT_X - IRIS_INSET, EYE_Y, width, top, bottom, s.eyeRoundness),
        fillOpacity: 1 - lidInk(s),
      };
    });

    const highlightProps = useAnimatedProps(() => ({
      fillOpacity: 1 - lidInk(shape.value),
    }));

    // Ink poured into the aperture as the lids come together, so a shut eye is
    // the closing arc itself rather than a separate drawing of one.
    const lidsProps = useAnimatedProps(() => ({
      d: eyeAperture(shape.value),
      fillOpacity: lidInk(shape.value),
    }));

    // The mouth keeps moving inside a phase, and which way depends on where the
    // air is going. It is drawn on the same two-lidded outline the eyes are, and
    // rounds off with the breath: sealed it is a lens with corners, and the
    // further the exhale opens it the closer it gets to a true O.
    // The exhale is the only phase it leaves through the mouth:
    // there the breath pushes it open on full lungs and lets it narrow shut as
    // they empty. Everywhere else the air is nasal, so the mouth stays sealed
    // and the breath only presses the lips thin and wide.
    const mouthProps = useAnimatedProps(() => {
      const s = shape.value;
      const filled = breath.value;
      const open = 1 - s.mouthBreath + s.mouthBreath * (0.18 + 0.82 * filled);
      const round = 1 - 0.18 * s.mouthBreath * (1 - filled);
      const press = s.mouthPress * filled;
      return {
        d: eyePath(
          MOUTH_X,
          MOUTH_Y,
          s.mouthWidth * round * (1 + 0.12 * press),
          s.mouthTop * open * (1 - 0.34 * press),
          s.mouthBottom * open * (1 - 0.34 * press),
          s.mouthBreath * filled,
        ),
      };
    });

    const stageBox = {
      position: 'absolute' as const,
      left: (width - stageWidth) / 2,
      top: stageTop,
      width: stageWidth,
      height: stageHeight,
    };

    const viewBox = `0 0 ${STAGE_VIEWBOX_W} ${STAGE_VIEWBOX_H}`;

    return (
      <View style={styles.clip} pointerEvents="none">
        <Animated.View style={[stageBox, stageStyle]}>
          <Animated.View style={[StyleSheet.absoluteFillObject, auraStyle]}>
            <Svg
              width={auraSize}
              height={auraSize}
              viewBox="-1 -1 2 2"
              style={{
                position: 'absolute',
                left: (stageWidth - auraSize) / 2,
                top: (stageHeight - auraSize) / 2,
              }}
            >
              {AURA_RINGS.map((ring) => (
                <Circle
                  key={ring.radius}
                  cx={0}
                  cy={0}
                  r={ring.radius / AURA_OUTER}
                  fill={theme.circleOuter}
                  fillOpacity={ring.opacity}
                />
              ))}
            </Svg>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFillObject, armStyle]}>
            <Svg width={stageWidth} height={stageHeight} viewBox={viewBox}>
              <Path d={ARM_RIGHT_PATH} fill={colors.koala.body} />
              <Path d={ARM_LEFT_PATH} fill={colors.koala.body} />
            </Svg>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFillObject, chestStyle]}>
            <Svg width={stageWidth} height={stageHeight} viewBox={viewBox}>
              <Path d={BODY_PATH} fill={colors.koala.body} />
              <Path d={BELLY_PATH} fill={colors.koala.light} />
            </Svg>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFillObject, earStyle]}>
            <Svg width={stageWidth} height={stageHeight} viewBox={viewBox}>
              <Path d={EAR_RIGHT_PATH} fill={colors.koala.shade} />
              <Path d={EAR_INNER_RIGHT_PATH} fill={colors.koala.light} />
              <Path d={EAR_LEFT_PATH} fill={colors.koala.shade} />
              <Path d={EAR_INNER_LEFT_PATH} fill={colors.koala.light} />
            </Svg>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFillObject, headStyle]}>
            <Svg width={stageWidth} height={stageHeight} viewBox={viewBox}>
              <Path d={HEAD_PATH} fill={colors.koala.body} />
            </Svg>

            <Animated.View style={[StyleSheet.absoluteFillObject, faceStyle]}>
              <Svg width={stageWidth} height={stageHeight} viewBox={viewBox}>
                <AnimatedPath fill={colors.koala.eyeWhite} animatedProps={eyeWhitesProps} />
                <AnimatedPath fill={colors.koala.iris} animatedProps={irisesProps} />
                <AnimatedCircle
                  cx={EYE_LEFT_X + IRIS_INSET + HIGHLIGHT_IN}
                  cy={EYE_Y - HIGHLIGHT_UP}
                  r={HIGHLIGHT_RADIUS}
                  fill={colors.koala.eyeWhite}
                  animatedProps={highlightProps}
                />
                <AnimatedCircle
                  cx={EYE_RIGHT_X - IRIS_INSET - HIGHLIGHT_IN}
                  cy={EYE_Y - HIGHLIGHT_UP}
                  r={HIGHLIGHT_RADIUS}
                  fill={colors.koala.eyeWhite}
                  animatedProps={highlightProps}
                />
                <AnimatedPath fill={colors.koala.iris} animatedProps={lidsProps} />

                <Path d={NOSE_PATH} fill={colors.koala.shade} />
                <AnimatedPath
                  fill={colors.koala.shade}
                  animatedProps={mouthProps}
                />
              </Svg>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    );
  },
);

export default memo(BreathingCompanion);

const styles = StyleSheet.create({
  clip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
