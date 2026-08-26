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
import Svg, { Circle, G, Path } from 'react-native-svg';
import type { BreathingCircleRef } from './BreathingCircle';
import {
  CHEEK_LEFT_X,
  CHEEK_RIGHT_X,
  CHEEK_Y,
  EYE_LEFT_X,
  EYE_RIGHT_X,
  EYE_Y,
  FACE_SHAPES,
  MOUTH_Y,
  eyePath,
  lensPath,
  lerpFace,
  type BreathFace,
} from './breathFaces';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { colors } from '../../../../theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// The stage pose: a standing blob whose sides and base run off the screen, so
// the breath reads as the character rising and settling rather than a shape
// resizing. Straight flanks below y=60 give the crop something to hold onto at
// every point of the travel.
const VIEWBOX_W = 100;
const VIEWBOX_H = 160;
const STAGE_BODY_PATH =
  'M 1,160 L 1,60 C 1,29 22,9 50,9 C 78,9 99,29 99,60 L 99,160 Z';

// The face is authored in the 100-unit blob space shared with the home screen,
// then blown up about its own centre to fill this much larger body.
const FACE_SCALE = 1.6;
const FACE_ORIGIN_Y = 60;

const WIDTH_RATIO = 1.02;
// Caps the character on short, wide screens, where the width ratio alone would
// push the face off the top.
const MAX_WIDTH_FROM_HEIGHT = 0.62;
const FACE_REST_RATIO = 0.66;
const TRAVEL_RATIO = 0.085;

const BODY_SQUASH_X = 1.03;
const BODY_STRETCH_X = 0.99;
const BODY_SQUASH_Y = 0.98;
const BODY_STRETCH_Y = 1.03;
// The face rides the body at a third of its stretch so the eyes stay round.
const FACE_SQUASH_Y = 0.99;
const FACE_STRETCH_Y = 1.01;

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

    const stageWidth = Math.min(width * WIDTH_RATIO, viewport * MAX_WIDTH_FROM_HEIGHT);
    const stageHeight = stageWidth * (VIEWBOX_H / VIEWBOX_W);
    const faceOffsetFromTop = stageHeight * (FACE_ORIGIN_Y / VIEWBOX_H);
    const stageTop = viewport * FACE_REST_RATIO - faceOffsetFromTop;
    const travel = viewport * TRAVEL_RATIO;
    const auraOffset = (FACE_ORIGIN_Y / VIEWBOX_H - 0.5) * stageHeight;
    const auraSize = stageWidth * AURA_OUTER * 2;
    // Far enough that the crown clears the bottom edge before it settles.
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

    const stageStyle = useAnimatedStyle(() => {
      const rise = reducedMotion ? 0 : (0.5 - breath.value) * 2 * travel;
      return {
        opacity: Math.min(1, Math.max(0, entered.value)),
        transform: [{ translateY: rise + (1 - entered.value) * enterDistance }],
      };
    });

    const bodyStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scaleX: BODY_SQUASH_X + (BODY_STRETCH_X - BODY_SQUASH_X) * breath.value,
        },
        {
          scaleY:
            (BODY_SQUASH_Y + (BODY_STRETCH_Y - BODY_SQUASH_Y) * breath.value) *
            (1 + strain.value * amplitude),
        },
      ],
    }));

    const faceStyle = useAnimatedStyle(() => ({
      transform: [
        { scaleY: FACE_SQUASH_Y + (FACE_STRETCH_Y - FACE_SQUASH_Y) * breath.value },
      ],
    }));

    const auraStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: auraOffset },
        {
          scale:
            AURA_EXHALE_SCALE +
            (AURA_INHALE_SCALE - AURA_EXHALE_SCALE) * breath.value,
        },
      ],
    }));

    const leftEyeProps = useAnimatedProps(() => ({
      d: eyePath(
        EYE_LEFT_X,
        EYE_Y,
        shape.value.eyeWidth,
        shape.value.eyeTop,
        shape.value.eyeBottom,
        shape.value.eyeRoundness,
      ),
    }));

    const rightEyeProps = useAnimatedProps(() => ({
      d: eyePath(
        EYE_RIGHT_X,
        EYE_Y,
        shape.value.eyeWidth,
        shape.value.eyeTop,
        shape.value.eyeBottom,
        shape.value.eyeRoundness,
      ),
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
          VIEWBOX_W / 2,
          MOUTH_Y,
          s.mouthWidth * round * (1 + 0.12 * press),
          s.mouthTop * open * (1 - 0.34 * press),
          s.mouthBottom * open * (1 - 0.34 * press),
        ),
      };
    });

    const cheekProps = useAnimatedProps(() => ({
      r: 4 + 3 * shape.value.cheek,
      fillOpacity: 0.38 + 0.42 * shape.value.cheek,
    }));

    const stageBox = {
      position: 'absolute' as const,
      left: (width - stageWidth) / 2,
      top: stageTop,
      width: stageWidth,
      height: stageHeight,
    };

    const ink = theme.textPrimary;

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

          <Animated.View style={[StyleSheet.absoluteFillObject, bodyStyle]}>
            <Svg
              width={stageWidth}
              height={stageHeight}
              viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
            >
              <Path d={STAGE_BODY_PATH} fill={theme.circleOuter} />
            </Svg>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFillObject, faceStyle]}>
            <Svg
              width={stageWidth}
              height={stageHeight}
              viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
            >
              <G scale={FACE_SCALE} originX={VIEWBOX_W / 2} originY={FACE_ORIGIN_Y}>
                <AnimatedCircle
                  cx={CHEEK_LEFT_X}
                  cy={CHEEK_Y}
                  r={4}
                  fill={colors.roomBlob.cheek}
                  animatedProps={cheekProps}
                />
                <AnimatedCircle
                  cx={CHEEK_RIGHT_X}
                  cy={CHEEK_Y}
                  r={4}
                  fill={colors.roomBlob.cheek}
                  animatedProps={cheekProps}
                />
                <AnimatedPath fill={ink} animatedProps={leftEyeProps} />
                <AnimatedPath fill={ink} animatedProps={rightEyeProps} />
                <AnimatedPath fill={ink} animatedProps={mouthProps} />
              </G>
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
