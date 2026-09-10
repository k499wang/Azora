import { forwardRef, memo, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
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
  lensPath,
  lerpFace,
  type BreathFace,
  type FaceShape,
} from './breathFaces';
import {
  BREATH_RISE_RATIO,
  FACE_ORIGIN_Y,
  getBreathingStage,
  INSEAM_Y,
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
const CHEST_FILL = 0.06;
// Every sideways movement is a share of how far the chest has filled, so one
// number drives the whole torso: a hold that only trembles vertically is a rib
// cage that got deeper without getting wider.
const CHEST_WIDEN_SHARE = 0.5;
// The share of the stage between the shoulders and the pivot: how much of the
// chest's growth has arrived by the time it reaches the arms and the head.
const SHOULDER_LEVER = (INSEAM_Y - SHOULDER_Y) / STAGE_VIEWBOX_H;
// How much further than the chest the arms travel outward, again as a share of
// the fill. They are drawn symmetrically about the centre line, so one scale
// pushes both away from it.
const ARM_SWING_SHARE = 0.9;
// The ears are the lightest thing on him and the last to arrive.
const EAR_TRAIL_MS = 320;
// How much of that trail actually shows. They are attached to the skull, so
// they travel with it and only give a little — a full lag would slide them off
// the head they are growing out of.
const EAR_GIVE = 0.55;

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
const AURA_INHALE_SCALE = 1.3;

// A lung fills and empties on a curve, not a ramp. Sinusoidal in and out also
// puts zero velocity at both ends of every phase, so a pattern with no hold
// between inhale and exhale turns over instead of reversing on a corner. The
// phase clock is a separate one-second timer, so this changes how the breath
// looks, never how long it lasts.
const BREATH_EASING = Easing.inOut(Easing.sin);

// Long enough that the eye visibly travels closed rather than blinking there.
const FACE_MORPH_MS = 560;
// Eased, not sprung: an overshoot would carry the character past the position
// the first inhale starts from.
const ENTER_MS = 700;
const EXIT_MS = 320;

// Under 2.5% on purpose — a hold should read as effort, not as a bounce.
const HOLD_IN_STRAIN = 0.02;
const HOLD_OUT_STRAIN = 0.009;
const HOLD_IN_PERIOD_MS = 1100;
const HOLD_OUT_PERIOD_MS = 2400;

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
  if (face === 'holdIn') return HOLD_IN_STRAIN;
  if (face === 'holdOut') return HOLD_OUT_STRAIN;
  return 0;
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
    const entered = useSharedValue(active && visible ? 1 : 0);
    const faceFrom = useSharedValue(FACE_SHAPES[face]);
    const faceTo = useSharedValue(FACE_SHAPES[face]);
    const faceProgress = useSharedValue(1);

    useEffect(() => {
      if (!active) {
        cancelAnimation(breath);
        cancelAnimation(strain);
        cancelAnimation(entered);
        cancelAnimation(faceProgress);
        strain.value = 0;
      }

      return () => {
        cancelAnimation(breath);
        cancelAnimation(strain);
        cancelAnimation(entered);
        cancelAnimation(faceProgress);
      };
    }, [active, breath, entered, faceProgress, strain]);

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

    useEffect(() => {
      if (!active) {
        cancelAnimation(strain);
        strain.value = 0;
        return;
      }

      if (amplitude === 0 || reducedMotion) {
        cancelAnimation(strain);
        strain.value = withTiming(0, { duration: 300 });
        return;
      }

      const halfPeriod =
        (face === 'holdIn' ? HOLD_IN_PERIOD_MS : HOLD_OUT_PERIOD_MS) / 2;
      strain.value = 0;
      strain.value = withRepeat(
        withTiming(1, { duration: halfPeriod, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );

      return () => {
        cancelAnimation(strain);
      };
    }, [active, amplitude, face, reducedMotion, strain]);

    const shape = useDerivedValue(() =>
      lerpFace(faceFrom.value, faceTo.value, faceProgress.value),
    );

    /** How far the chest has filled, strain included. 1 is a resting chest. */
    const chest = useDerivedValue(
      () => 1 + CHEST_FILL * breath.value + strain.value * amplitude,
    );

    // A copy of the chest that arrives late. It follows the chest rather than
    // the breath so that the strain of a hold reaches the ears too: anything the
    // head does, they do, or they come loose from it.
    const trailingChest = useSharedValue(1);

    useAnimatedReaction(
      () => chest.value,
      (value) => {
        trailingChest.value = withTiming(value, {
          duration: reducedMotion ? 0 : EAR_TRAIL_MS,
          easing: Easing.out(Easing.quad),
        });
      },
      [reducedMotion, trailingChest],
    );

    // Measured from the layer's centre, which is what a React Native transform
    // scales about.
    const chestPivot = (INSEAM_Y / STAGE_VIEWBOX_H - 0.5) * stageHeight;

    const lift = (fill: number) => {
      'worklet';
      return -(fill - 1) * SHOULDER_LEVER * stageHeight;
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
    // arm that translated instead would lift its own tip off the bottom edge
    // and show background under it. The swing is the only thing they add.
    const armStyle = useAnimatedStyle(() => ({
      transform: [
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

    // Lifted by exactly what the shoulders gained, so the head rides the chest
    // instead of floating away from it.
    const headStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: lift(chest.value) }],
    }));

    // Carried by the head, with a little give — they arrive where it does, just
    // after it does.
    const earStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: lift(
            chest.value + (trailingChest.value - chest.value) * EAR_GIVE,
          ),
        },
      ],
    }));

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

    // The eyeball is held inside the lids rather than clipped by them: a lens
    // narrower than the aperture is always inside it, so a squint squeezes the
    // iris down with it and no mask is needed.
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
    // air is going. The exhale is the only phase it leaves through the mouth:
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
        d: lensPath(
          MOUTH_X,
          MOUTH_Y,
          s.mouthWidth * round * (1 + 0.12 * press),
          s.mouthTop * open * (1 - 0.34 * press),
          s.mouthBottom * open * (1 - 0.34 * press),
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
              <AnimatedPath fill={colors.koala.shade} animatedProps={mouthProps} />
            </Svg>
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
