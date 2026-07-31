import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Atlas,
  Canvas,
  Circle,
  ColorMatrix,
  FractalNoise,
  Group,
  Paint,
  RadialGradient,
  Rect,
  Skia,
  TileMode,
  vec,
} from '@shopify/react-native-skia';
import {
  interpolate,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '../../../../theme/colors';
import {
  resolveAmbienceConfig,
  type AmbienceConfig,
} from '../../../../theme/ambienceTheme';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { BREATH_EXHALED, BREATH_INHALED, type BreathEnvelope } from '../breathEnvelope';
import { createBreathParticleField } from '../breathParticleField';

const WASH_STOPS = [0, 0.45, 1];
const VIGNETTE_STOPS = [0, 0.55, 1];
// Fine enough to read as grain rather than as a visible pattern.
const GRAIN_FREQUENCY = 0.9;
const GRAIN_OCTAVES = 3;
const GRAIN_SEED = 7;

// One texture drawn at this size, then scaled per mote by the Atlas.
const SPRITE_SIZE = 32;
// Starts just outside the circle's 150px outline ring, so the field surrounds
// the circle instead of crowding through it.
const PARTICLE_INNER_RADIUS = 165;
// Reach past the corners so the field never shows an edge.
const PARTICLE_RADIUS_OVERSCAN = 1.08;
// How far the field is pushed out at full inhale and pulled in at full exhale.
const FIELD_CONTRACTED = 0.82;
const FIELD_EXPANDED = 1.1;
// Motes brighten as the breath fills, the same way the wash does.
const PARTICLE_DIM = 0.6;
const PARTICLE_BRIGHT = 1;

// Luminance weights — the noise shader emits color, and colored static looks
// like a broken screen rather than film grain.
const DESATURATE = [
  0.213, 0.715, 0.072, 0, 0,
  0.213, 0.715, 0.072, 0, 0,
  0.213, 0.715, 0.072, 0, 0,
  0, 0, 0, 1, 0,
];

interface BreathingAmbienceProps {
  envelope: BreathEnvelope;
  theme: ExerciseDarkTheme;
  config?: AmbienceConfig;
}

function withAlpha(color: string, alpha: number): Float32Array {
  const parsed = Skia.Color(color);
  return new Float32Array([parsed[0], parsed[1], parsed[2], alpha]);
}

export function BreathingAmbience({
  envelope,
  theme,
  config,
}: BreathingAmbienceProps) {
  const { width, height } = useWindowDimensions();
  const resolved = config ?? resolveAmbienceConfig(theme);

  const centerX = width / 2;
  const centerY = height / 2;
  const center = useMemo(() => vec(centerX, centerY), [centerX, centerY]);
  // Reaches the corners at full inhale so the wash never shows a circular edge.
  const radius = useMemo(
    () => Math.hypot(width, height) / 2,
    [height, width],
  );

  const washColors = useMemo(
    () => [
      withAlpha(theme.textAccent, 1),
      withAlpha(theme.textAccent, 0.45),
      withAlpha(theme.textAccent, 0),
    ],
    [theme.textAccent],
  );

  const vignetteColors = useMemo(
    () => [
      withAlpha(colors.neutral[900], 0),
      withAlpha(colors.neutral[900], 0.25),
      withAlpha(colors.neutral[900], 1),
    ],
    [],
  );

  const washTransform = useDerivedValue(() => [
    {
      scale: interpolate(
        envelope.value,
        [BREATH_EXHALED, BREATH_INHALED],
        [resolved.washScaleExhaled, 1],
      ),
    },
  ]);

  const washOpacity = useDerivedValue(() =>
    interpolate(
      envelope.value,
      [BREATH_EXHALED, BREATH_INHALED],
      [resolved.washOpacityExhaled, resolved.washOpacityInhaled],
    ),
  );

  // A white dot with a soft falloff, tinted per theme by the Atlas blend.
  const sprite = useMemo(() => {
    const surface = Skia.Surface.MakeOffscreen(SPRITE_SIZE, SPRITE_SIZE);
    if (!surface) return null;

    const paint = Skia.Paint();
    paint.setShader(
      Skia.Shader.MakeRadialGradient(
        vec(SPRITE_SIZE / 2, SPRITE_SIZE / 2),
        SPRITE_SIZE / 2,
        [
          new Float32Array([1, 1, 1, 1]),
          new Float32Array([1, 1, 1, 0.5]),
          new Float32Array([1, 1, 1, 0]),
        ],
        [0, 0.4, 1],
        TileMode.Clamp,
      ),
    );
    surface
      .getCanvas()
      .drawCircle(SPRITE_SIZE / 2, SPRITE_SIZE / 2, SPRITE_SIZE / 2, paint);

    return surface.makeImageSnapshot();
  }, []);

  const particles = useMemo(
    () =>
      createBreathParticleField({
        count: resolved.particleCount,
        innerRadius: PARTICLE_INNER_RADIUS,
        outerRadius: radius * PARTICLE_RADIUS_OVERSCAN,
        minSize: resolved.particleMinSize,
        maxSize: resolved.particleMaxSize,
        spriteSize: SPRITE_SIZE,
      }),
    [
      radius,
      resolved.particleCount,
      resolved.particleMaxSize,
      resolved.particleMinSize,
    ],
  );

  const spriteRects = useMemo(
    () => particles.map(() => Skia.XYWHRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)),
    [particles],
  );

  // Per-mote tint. Static, so only the transforms are rebuilt each frame.
  const particleColors = useMemo(
    () => particles.map((particle) => withAlpha(theme.textAccent, particle.alpha)),
    [particles, theme.textAccent],
  );

  // Orbit needs a clock that never wraps, or every mote would jump when it did.
  const elapsedSeconds = useSharedValue(0);
  useFrameCallback((frame) => {
    elapsedSeconds.value += (frame.timeSincePreviousFrame ?? 0) / 1000;
  });

  const particleTransforms = useDerivedValue(() => {
    const spread = interpolate(
      envelope.value,
      [BREATH_EXHALED, BREATH_INHALED],
      [FIELD_CONTRACTED, FIELD_EXPANDED],
    );
    const time = elapsedSeconds.value;

    return particles.map((particle) => {
      const angle = particle.angle + particle.orbitSpeed * time;
      const distance = particle.radius * spread;
      const offset = (particle.scale * SPRITE_SIZE) / 2;

      return Skia.RSXform(
        particle.scale,
        0,
        centerX + Math.cos(angle) * distance - offset,
        centerY + Math.sin(angle) * distance - offset,
      );
    });
  });

  const particleOpacity = useDerivedValue(
    () =>
      resolved.particleOpacity *
      interpolate(
        envelope.value,
        [BREATH_EXHALED, BREATH_INHALED],
        [PARTICLE_DIM, PARTICLE_BRIGHT],
      ),
  );

  return (
    <>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Group opacity={washOpacity}>
          <Group transform={washTransform} origin={center}>
            <Circle cx={centerX} cy={centerY} r={radius}>
              <RadialGradient
                c={center}
                r={radius}
                colors={washColors}
                positions={WASH_STOPS}
              />
            </Circle>
          </Group>
        </Group>

        {sprite ? (
          <Group opacity={particleOpacity}>
            <Atlas
              image={sprite}
              sprites={spriteRects}
              transforms={particleTransforms}
              colors={particleColors}
              blendMode="modulate"
            />
          </Group>
        ) : null}
      </Canvas>

      {/* Vignette and grain never move, so they paint once instead of being
          re-rasterized alongside the wash on every frame. */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Group opacity={resolved.vignetteOpacity}>
          <Rect x={0} y={0} width={width} height={height}>
            <RadialGradient
              c={center}
              r={radius}
              colors={vignetteColors}
              positions={VIGNETTE_STOPS}
            />
          </Rect>
        </Group>

        <Group
          opacity={resolved.grainOpacity}
          layer={
            <Paint>
              <ColorMatrix matrix={DESATURATE} />
            </Paint>
          }
        >
          <Rect x={0} y={0} width={width} height={height}>
            <FractalNoise
              freqX={GRAIN_FREQUENCY}
              freqY={GRAIN_FREQUENCY}
              octaves={GRAIN_OCTAVES}
              seed={GRAIN_SEED}
            />
          </Rect>
        </Group>
      </Canvas>
    </>
  );
}
