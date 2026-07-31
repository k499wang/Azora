import { useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Atlas,
  Canvas,
  Group,
  Skia,
  useRSXformBuffer,
  usePictureAsTexture,
} from '@shopify/react-native-skia';
import {
  Easing,
  cancelAnimation,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const SPRITE_PX = 24;
const DOT_SIZE = 8;
const COLUMNS = 7;
const ANCHOR = SPRITE_PX / 2;
const BASE_SCALE = DOT_SIZE / SPRITE_PX;

// Fraction of a phase the wave spends travelling from the centre to the
// corners. The same offset makes inhale ripple outward and exhale collapse
// inward, because exhale runs the drive value backwards.
const WAVE_SPREAD = 0.45;
const SCALE_MIN = 0.45;
const SCALE_MAX = 1;
const MAX_TURN = Math.PI / 4;

// The breathing circle is 300pt wide, so nothing is drawn inside 150pt of the
// centre and the lattice fades in over the next 70pt.
const CLEAR_RADIUS = 150;
const CLEAR_FEATHER = 70;

// Always-on drift so holds read as still rather than frozen.
const DRIFT_PERIOD_MS = 7000;
const DRIFT_TURN = 0.1;
const DRIFT_SCALE = 0.07;

const IDLE_OPACITY = 0.35;
const ACTIVE_OPACITY = 0.65;
const OPACITY_FADE_MS = 700;

interface LatticeDot {
  x: number;
  y: number;
  distanceRatio: number;
  weight: number;
  seed: number;
}

function smoothstep(value: number) {
  'worklet';
  const t = value < 0 ? 0 : value > 1 ? 1 : value;
  return t * t * (3 - 2 * t);
}

interface BreathLatticeProps {
  breath: SharedValue<number>;
  active: boolean;
  color: string;
}

export default function BreathLattice({
  breath,
  active,
  color,
}: BreathLatticeProps) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const drift = useSharedValue(0);

  const dots = useMemo<LatticeDot[]>(() => {
    const step = width / COLUMNS;
    const rows = Math.ceil(height / step) + 1;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.hypot(centerX, centerY);
    const built: LatticeDot[] = [];

    for (let row = 0; row < rows; row++) {
      const y = row * step;
      const rowOffset = row % 2 === 0 ? 0 : step / 2;

      for (let col = 0; col <= COLUMNS; col++) {
        const x = col * step + rowOffset;
        const distance = Math.hypot(x - centerX, y - centerY);
        const weight = smoothstep((distance - CLEAR_RADIUS) / CLEAR_FEATHER);
        if (weight <= 0) continue;

        const index = built.length;
        const noise = Math.sin(index * 127.1 + 311.7) * 43758.5453;

        built.push({
          x,
          y,
          distanceRatio: Math.min(1, distance / maxDistance),
          weight,
          seed: ((noise % 1) + 1) % 1,
        });
      }
    }

    return built;
  }, [height, width]);

  const picture = useMemo(() => {
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(
      Skia.XYWHRect(0, 0, SPRITE_PX, SPRITE_PX),
    );

    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setColor(Skia.Color(color));
    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(0, 0, SPRITE_PX, SPRITE_PX),
        SPRITE_PX * 0.32,
        SPRITE_PX * 0.32,
      ),
      paint,
    );

    return recorder.finishRecordingAsPicture();
  }, [color]);

  const image = usePictureAsTexture(picture, {
    width: SPRITE_PX,
    height: SPRITE_PX,
  });

  const sprites = useMemo(
    () =>
      dots.map(() => Skia.XYWHRect(0, 0, SPRITE_PX, SPRITE_PX)),
    [dots],
  );

  useEffect(() => {
    if (reduceMotion) return;

    drift.value = withRepeat(
      withTiming(1, { duration: DRIFT_PERIOD_MS, easing: Easing.linear }),
      -1,
      false,
    );

    return () => cancelAnimation(drift);
  }, [drift, reduceMotion]);

  const transforms = useRSXformBuffer(dots.length, (transform, index) => {
    'worklet';
    const dot = dots[index];
    const progress =
      (breath.value - dot.distanceRatio * WAVE_SPREAD) / (1 - WAVE_SPREAD);
    const eased = smoothstep(progress);
    const wobble = Math.sin((drift.value + dot.seed) * Math.PI * 2);

    const size =
      BASE_SCALE *
      dot.weight *
      (SCALE_MIN + eased * (SCALE_MAX - SCALE_MIN)) *
      (1 + wobble * DRIFT_SCALE);
    const angle = eased * MAX_TURN + wobble * DRIFT_TURN;
    const scos = Math.cos(angle) * size;
    const ssin = Math.sin(angle) * size;

    transform.set(
      scos,
      ssin,
      dot.x - (scos * ANCHOR - ssin * ANCHOR),
      dot.y - (ssin * ANCHOR + scos * ANCHOR),
    );
  });

  const opacity = useDerivedValue(
    () =>
      withTiming(active ? ACTIVE_OPACITY : IDLE_OPACITY, {
        duration: OPACITY_FADE_MS,
      }),
    [active],
  );

  if (reduceMotion) return null;

  return (
    <Canvas style={{ width, height }}>
      <Group opacity={opacity}>
        <Atlas image={image} sprites={sprites} transforms={transforms} />
      </Group>
    </Canvas>
  );
}
