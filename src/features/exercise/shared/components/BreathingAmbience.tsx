import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Group, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

interface BreathingAmbienceProps {
  envelope: SharedValue<number>;
  color: string;
  active?: boolean;
}

interface LayerConfig {
  count: number;
  fallSpeed: number;
  windSpeed: number;
  minRadius: number;
  maxRadius: number;
  opacity: number;
  swayAmplitude: number;
}

const LAYERS: LayerConfig[] = [
  {
    count: 28,
    fallSpeed: 22,
    windSpeed: 34,
    minRadius: 1,
    maxRadius: 1.8,
    opacity: 0.16,
    swayAmplitude: 7,
  },
  {
    count: 18,
    fallSpeed: 40,
    windSpeed: 62,
    minRadius: 1.7,
    maxRadius: 2.9,
    opacity: 0.28,
    swayAmplitude: 11,
  },
  {
    count: 10,
    fallSpeed: 62,
    windSpeed: 96,
    minRadius: 2.6,
    maxRadius: 4.2,
    opacity: 0.42,
    swayAmplitude: 16,
  },
];

const MARGIN = 24;

// The field reads the envelope's velocity rather than its phase, so it inherits
// pause, resume, and every timing change for free. Rising envelope (inhale)
// makes drift negative and lifts the motes into the breath; falling envelope
// (exhale) drops them. Holds settle to BASE_DRIFT on their own.
const BASE_DRIFT = 0.28;
const BASE_WIND = 0.12;
const DRIFT_PER_VELOCITY = 3.2;
const WIND_PER_VELOCITY = 3.5;
const VELOCITY_SMOOTHING = 0.12;

// Fully exhaled the field sits expanded; fully inhaled it converges on the circle.
const SCALE_EXHALED = 1.035;
const SCALE_INHALED = 0.965;

interface Particle {
  x: number;
  y: number;
  radius: number;
  swayPhase: number;
  swayFrequency: number;
  speedJitter: number;
}

interface FieldOffsets {
  time: number;
  y: number[];
  x: number[];
}

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createLayerParticles(
  layer: LayerConfig,
  seed: number,
  width: number,
  height: number,
): Particle[] {
  const random = createRandom(seed);
  const span = height + MARGIN * 2;

  return Array.from({ length: layer.count }, () => ({
    x: random() * (width + MARGIN * 2),
    y: random() * span,
    radius: layer.minRadius + random() * (layer.maxRadius - layer.minRadius),
    swayPhase: random() * Math.PI * 2,
    swayFrequency: 0.25 + random() * 0.5,
    speedJitter: 0.8 + random() * 0.45,
  }));
}

function buildLayerPath(
  particles: Particle[],
  layer: LayerConfig,
  offsets: FieldOffsets,
  layerIndex: number,
  width: number,
  height: number,
): SkPath {
  'worklet';
  const path = Skia.Path.Make();
  const verticalSpan = height + MARGIN * 2;
  const horizontalSpan = width + MARGIN * 2;
  const offsetY = offsets.y[layerIndex];
  const offsetX = offsets.x[layerIndex];

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];
    const sway =
      Math.sin(offsets.time * particle.swayFrequency + particle.swayPhase) *
      layer.swayAmplitude;

    const rawY = particle.y + offsetY * particle.speedJitter;
    const rawX = particle.x + offsetX * particle.speedJitter + sway;

    const y = (((rawY % verticalSpan) + verticalSpan) % verticalSpan) - MARGIN;
    const x =
      (((rawX % horizontalSpan) + horizontalSpan) % horizontalSpan) - MARGIN;

    path.addCircle(x, y, particle.radius);
  }

  return path;
}

function useLayerPath(
  particles: Particle[],
  layer: LayerConfig,
  layerIndex: number,
  offsets: SharedValue<FieldOffsets>,
  width: number,
  height: number,
) {
  return useDerivedValue(
    () =>
      buildLayerPath(particles, layer, offsets.value, layerIndex, width, height),
    [particles, width, height],
  );
}

export default function BreathingAmbience({
  envelope,
  color,
  active = true,
}: BreathingAmbienceProps) {
  const { width, height } = useWindowDimensions();

  const layerParticles = useMemo(
    () =>
      LAYERS.map((layer, index) =>
        createLayerParticles(layer, 0x9e37 + index * 7919, width, height),
      ),
    [width, height],
  );

  const lastEnvelope = useSharedValue(envelope.value);
  const velocity = useSharedValue(0);
  const offsets = useSharedValue<FieldOffsets>({
    time: 0,
    y: [0, 0, 0],
    x: [0, 0, 0],
  });

  const frame = useFrameCallback((info) => {
    'worklet';
    const delta = Math.min(info.timeSincePreviousFrame ?? 16, 50) / 1000;
    if (delta <= 0) return;

    const rawVelocity = (envelope.value - lastEnvelope.value) / delta;
    lastEnvelope.value = envelope.value;
    velocity.value += (rawVelocity - velocity.value) * VELOCITY_SMOOTHING;

    const drift = BASE_DRIFT - velocity.value * DRIFT_PER_VELOCITY;
    const wind = BASE_WIND + Math.abs(velocity.value) * WIND_PER_VELOCITY;

    const previous = offsets.value;
    const nextY = [0, 0, 0];
    const nextX = [0, 0, 0];

    for (let i = 0; i < LAYERS.length; i += 1) {
      nextY[i] = previous.y[i] + LAYERS[i].fallSpeed * drift * delta;
      nextX[i] = previous.x[i] + LAYERS[i].windSpeed * wind * delta;
    }

    offsets.value = { time: previous.time + delta, y: nextY, x: nextX };
  }, active);

  useEffect(() => {
    frame.setActive(active);
  }, [active, frame]);

  const backPath = useLayerPath(
    layerParticles[0],
    LAYERS[0],
    0,
    offsets,
    width,
    height,
  );
  const midPath = useLayerPath(
    layerParticles[1],
    LAYERS[1],
    1,
    offsets,
    width,
    height,
  );
  const frontPath = useLayerPath(
    layerParticles[2],
    LAYERS[2],
    2,
    offsets,
    width,
    height,
  );

  const transform = useDerivedValue(() => [
    { scale: SCALE_EXHALED + envelope.value * (SCALE_INHALED - SCALE_EXHALED) },
  ]);
  const origin = useMemo(
    () => ({ x: width / 2, y: height / 2 }),
    [width, height],
  );

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group transform={transform} origin={origin}>
        <Group opacity={LAYERS[0].opacity}>
          <Path path={backPath} color={color} />
        </Group>
        <Group opacity={LAYERS[1].opacity}>
          <Path path={midPath} color={color} />
        </Group>
        <Group opacity={LAYERS[2].opacity}>
          <Path path={frontPath} color={color} />
        </Group>
      </Group>
    </Canvas>
  );
}
