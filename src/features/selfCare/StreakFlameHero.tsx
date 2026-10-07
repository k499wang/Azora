import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Group,
  LinearGradient,
  Oval,
  PaintStyle,
  Path,
  Picture,
  Skia,
  StrokeCap,
  createPicture,
  interpolateColors,
  vec,
} from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { FLAME_BASE, FLAME_BOUNDS, FLAME_PATH, INNER_PATH, MIDDLE_TRANSFORM } from './streakFlameArt';
import {
  easeInOutCubic,
  easeInQuad,
  easeOutBack,
  easeOutCubic,
  mix,
  phase,
  streakCelebrationMotion as timing,
} from './streakCelebrationMotion';

interface Props {
  clock: SharedValue<number>;
  active: boolean;
  reducedMotion: boolean;
}

const palette = colors.streakCelebration;

const HERO_WIDTH = 140;
const HERO_HEIGHT = 150;
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 360;
const BASE_X = CANVAS_WIDTH / 2;
const BASE_Y = 300;
const HERO_BASE_Y = 138;
const SETTLED_HEIGHT = 116;
const FLAME_SCALE = SETTLED_HEIGHT / FLAME_BOUNDS.height;
const VIEW_BOX = [{ scale: FLAME_SCALE }, { translateX: -FLAME_BASE.x }, { translateY: -FLAME_BASE.y }];
const GROUND = { rx: 41, ry: 11 };

const SQUASH = { x: 1.25, y: 0.45 };
const PUDDLE = { x: 1.3, y: 0.4 };
const TALL = { x: 0.82, y: 1.8 };
const STRETCH_OVERSHOOT = 1.4;
const HEAD_RATIO = 0.3;
const HEAD_CENTRE = (SETTLED_HEIGHT * HEAD_RATIO) / 2;
const PUDDLE_GROW_FROM = 0.6;
const APEX = 160;
const BOB = 6;
const SWAY_DEGREES = 2.5;
const SPECK_LAUNCH = 0.05;
const SPECK_FLIGHT = 0.8;
const SPECK_ANGLES = Array.from({ length: 8 }, (_, i) => ((-160 + i * 20) * Math.PI) / 180);
const SPARK_ANGLES = Array.from({ length: 6 }, (_, i) => ((-150 + i * 24) * Math.PI) / 180);

const toRadians = (degrees: number) => {
  'worklet';
  return (degrees * Math.PI) / 180;
};

/** The leap's head, as its base point's offset from B: up-left, a bob over the top, then right and down. */
const headOffset = (p: number) => {
  'worklet';
  const hover = phase(p, 0.35, 0.35);
  return {
    x: -15 * Math.sin(2 * Math.PI * p),
    y:
      -APEX * easeOutCubic(phase(p, 0, 0.35)) -
      BOB * Math.sin(2 * Math.PI * hover) * Math.sin(Math.PI * hover) +
      APEX * easeInQuad(phase(p, 0.7, 0.3)),
  };
};
const SPECK_ORIGIN = headOffset(SPECK_LAUNCH);

/** The body's squash → puddle → stretch → damped settle, one continuous pose. */
const bodyPose = (t: number) => {
  'worklet';
  const squash = easeInQuad(phase(t, timing.squashAt, timing.squashDuration));
  const ignite = easeInOutCubic(phase(t, timing.igniteAt, timing.igniteDuration));
  const stretchLinear = phase(t, timing.stretchAt, timing.stretchDuration);
  const stretch = easeOutBack(stretchLinear, STRETCH_OVERSHOOT);
  const settle = phase(t, timing.settleAt, timing.settleDuration);
  const damp = Math.exp(-5 * settle) * Math.cos(3 * Math.PI * settle) * (1 - settle);
  const preX = mix(mix(1, SQUASH.x, squash), PUDDLE.x, ignite);
  const preY = mix(mix(1, SQUASH.y, squash), PUDDLE.y, ignite);
  const flicker = stretchLinear * (1 - easeInOutCubic(settle));
  return {
    x: 1 + (mix(preX, TALL.x, stretch) - 1) * damp,
    y:
      (1 + (mix(preY, TALL.y, stretch) - 1) * damp) *
      (1 + flicker * (0.04 * Math.sin(t / 29) + 0.025 * Math.sin(t / 18.7))),
    skew: flicker * 0.05 * Math.sin(t / 22.3),
    tilt: -8 * Math.sin(Math.PI * ignite),
  };
};

/** Dormant grey flame that squashes, leaps as a spark, lands lit, and stretches into its settled sway. */
export default function StreakFlameHero({ clock, active, reducedMotion }: Props) {
  const art = useMemo(() => {
    const flame = Skia.Path.MakeFromSVGString(FLAME_PATH)!;
    const paint = (color: string) => {
      const next = Skia.Paint();
      next.setAntiAlias(true);
      next.setColor(Skia.Color(color));
      return next;
    };
    const dash = paint(palette.flameYellow);
    dash.setStyle(PaintStyle.Stroke);
    dash.setStrokeWidth(4);
    dash.setStrokeCap(StrokeCap.Round);
    return {
      flame,
      middle: flame.copy().transform([...MIDDLE_TRANSFORM.matrix]),
      core: Skia.Path.MakeFromSVGString(INNER_PATH)!,
      circle: Skia.Path.Make().addCircle(0, 0, 1),
      upperArc: Skia.Path.Make().addArc(Skia.XYWHRect(-1, -1, 2, 2), 180, 180),
      speckPaints: [paint(palette.flameYellow), paint(palette.flameOrange)],
      dashPaint: dash,
      dotPaint: paint(palette.flameRed),
    };
  }, []);

  const sway = useSharedValue(0);
  useEffect(() => {
    sway.value = 0;
    if (!active || reducedMotion) return;
    const side = { duration: timing.swaySide, easing: Easing.inOut(Easing.sin) };
    sway.value = withDelay(
      timing.settleAt + timing.settleDuration,
      withSequence(
        withTiming(SWAY_DEGREES, { ...side, duration: timing.swaySide / 2 }),
        withRepeat(withTiming(-SWAY_DEGREES, side), -1, true),
      ),
    );
    return () => cancelAnimation(sway);
  }, [active, reducedMotion, sway]);

  const lit = useDerivedValue(() => easeInOutCubic(phase(clock.value, timing.igniteAt, timing.igniteDuration)));
  const groundColor = useDerivedValue(() => interpolateColors(lit.value, [0, 1], [palette.dormantShadow, palette.ember]));
  const outerColor = useDerivedValue(() => interpolateColors(lit.value, [0, 1], [palette.dormant, palette.flameYellow]));
  const coreColor = useDerivedValue(() => interpolateColors(lit.value, [0, 1], [palette.dormantCore, palette.flameCore]));
  const groundTransform = useDerivedValue(() => {
    const t = clock.value;
    const spread = mix(0.8, 1.15, easeInOutCubic(phase(t, timing.leapAt, timing.leapDuration)));
    return [{ scale: mix(spread, 1, easeOutCubic(phase(t, timing.landAt, timing.puddleDuration))) }];
  });

  const body = useDerivedValue(() => {
    const t = clock.value;
    const pose = bodyPose(t);
    const morph = easeInOutCubic(phase(t, timing.leapAt, timing.morphDuration));
    const land = easeOutCubic(phase(t, timing.landAt, timing.puddleDuration));
    const grow = mix(PUDDLE_GROW_FROM, 1, land);
    return {
      opacity: 1 - morph + land,
      transform: [
        { rotate: toRadians(pose.tilt + sway.value) },
        { skewX: pose.skew },
        { scaleX: t < timing.landAt ? mix(pose.x, HEAD_RATIO, morph) : pose.x * grow },
        { scaleY: t < timing.landAt ? mix(pose.y, HEAD_RATIO, morph) : pose.y * grow },
      ],
    };
  });
  const bodyTransform = useDerivedValue(() => body.value.transform);
  const bodyOpacity = useDerivedValue(() => body.value.opacity);

  const head = useDerivedValue(() => {
    const t = clock.value;
    const p = phase(t, timing.leapAt, timing.leapDuration);
    const morph = easeInOutCubic(phase(t, timing.leapAt, timing.morphDuration));
    const land = easeOutCubic(phase(t, timing.landAt, timing.puddleDuration));
    const offset = headOffset(p);
    const turn = easeInOutCubic(p);
    const radius = mix(70, 30, turn);
    const fade = morph * (1 - easeInQuad(phase(p, 0.85, 0.15)));
    const at = [{ translateX: offset.x }, { translateY: offset.y - HEAD_CENTRE }];
    return {
      p,
      opacity: morph * (1 - land),
      transform: [
        { translateX: offset.x },
        { translateY: offset.y },
        { scaleX: mix(mix(PUDDLE.x, HEAD_RATIO, morph), PUDDLE.x * PUDDLE_GROW_FROM, land) },
        { scaleY: mix(mix(PUDDLE.y, HEAD_RATIO, morph), PUDDLE.y * PUDDLE_GROW_FROM, land) },
      ],
      swooshA: {
        opacity: fade,
        width: mix(12, 6, p) / radius,
        transform: [...at, { rotate: toRadians(-90 + 540 * turn) }, { scale: radius }],
      },
      swooshB: {
        opacity: fade * 0.8,
        width: 5 / (radius + 18),
        transform: [...at, { rotate: toRadians(90 + 540 * turn) }, { scale: radius + 18 }],
      },
    };
  });
  const headTransform = useDerivedValue(() => head.value.transform);
  const headOpacity = useDerivedValue(() => head.value.opacity);
  const swooshATransform = useDerivedValue(() => head.value.swooshA.transform);
  const swooshAOpacity = useDerivedValue(() => head.value.swooshA.opacity);
  const swooshAWidth = useDerivedValue(() => head.value.swooshA.width);
  const swooshBTransform = useDerivedValue(() => head.value.swooshB.transform);
  const swooshBOpacity = useDerivedValue(() => head.value.swooshB.opacity);
  const swooshBWidth = useDerivedValue(() => head.value.swooshB.width);

  const shock = useDerivedValue(() => {
    const s = phase(clock.value, timing.landAt, timing.shockDuration);
    const radius = 50 + 80 * easeOutCubic(s);
    return {
      opacity: s > 0 ? 1 - easeInQuad(s) : 0,
      width: (10 * (1 - s) + 3) / radius,
      transform: [{ scale: radius }],
    };
  });
  const shockTransform = useDerivedValue(() => shock.value.transform);
  const shockWidth = useDerivedValue(() => shock.value.width);
  const shockOpacity = useDerivedValue(() => shock.value.opacity);

  const particles = useDerivedValue(() =>
    createPicture(canvas => {
      const q = phase(head.value.p, SPECK_LAUNCH, SPECK_FLIGHT);
      if (q > 0 && q < 1) {
        const reach = 140 * easeOutCubic(q);
        for (let i = 0; i < SPECK_ANGLES.length; i += 1) {
          const paint = art.speckPaints[i % 2];
          paint.setAlphaf(1 - easeInQuad(q));
          canvas.drawCircle(
            BASE_X + SPECK_ORIGIN.x + Math.cos(SPECK_ANGLES[i]) * reach,
            BASE_Y + SPECK_ORIGIN.y - HEAD_CENTRE + Math.sin(SPECK_ANGLES[i]) * reach + 80 * q * q,
            4 - 2 * q,
            paint,
          );
        }
      }
      const k = phase(clock.value, timing.settleAt, timing.sparkDuration);
      if (k > 0 && k < 1) {
        const distance = 20 + 50 * easeOutCubic(k);
        art.dashPaint.setAlphaf(1 - easeInQuad(k));
        art.dotPaint.setAlphaf(1 - easeInQuad(k));
        for (let i = 0; i < SPARK_ANGLES.length; i += 1) {
          const dx = Math.cos(SPARK_ANGLES[i]);
          const dy = Math.sin(SPARK_ANGLES[i]);
          const x = BASE_X + dx * distance;
          const y = BASE_Y - SETTLED_HEIGHT + dy * distance;
          if (i % 2 === 0) {
            canvas.drawLine(x, y, x + dx * 10, y + dy * 10, art.dashPaint);
          } else {
            canvas.drawCircle(x, y, 3, art.dotPaint);
          }
        }
      }
    }),
  );

  return (
    <View style={styles.hero} pointerEvents="none">
      <Canvas style={styles.canvas}>
        <Group transform={[{ translateX: BASE_X }, { translateY: BASE_Y }]}>
          <Group transform={shockTransform}>
            <Path
              path={art.upperArc}
              style="stroke"
              strokeWidth={shockWidth}
              color={palette.ember}
              opacity={shockOpacity}
            />
          </Group>
          <Group transform={groundTransform}>
            <Oval
              x={-GROUND.rx}
              y={-GROUND.ry}
              width={GROUND.rx * 2}
              height={GROUND.ry * 2}
              color={groundColor}
            />
          </Group>
          <Group transform={bodyTransform} opacity={bodyOpacity}>
            <Group transform={VIEW_BOX}>
              <Path path={art.flame} color={outerColor} />
              <Path path={art.middle} opacity={lit}>
                <LinearGradient
                  start={vec(FLAME_BASE.x, MIDDLE_TRANSFORM.top)}
                  end={vec(FLAME_BASE.x, FLAME_BASE.y)}
                  colors={[palette.flameRed, palette.flameOrange]}
                />
              </Path>
              <Path path={art.core} color={coreColor} />
            </Group>
          </Group>
          <Group transform={swooshBTransform} opacity={swooshBOpacity}>
            <Path
              path={art.circle}
              start={0}
              end={0.2}
              style="stroke"
              strokeWidth={swooshBWidth}
              strokeCap="round"
              color={palette.flameYellow}
            />
          </Group>
          <Group transform={swooshATransform} opacity={swooshAOpacity}>
            <Path
              path={art.circle}
              start={0}
              end={0.35}
              style="stroke"
              strokeWidth={swooshAWidth}
              strokeCap="round"
              color={palette.flameYellow}
            />
          </Group>
          <Group transform={headTransform} opacity={headOpacity}>
            <Group transform={VIEW_BOX}>
              <Path path={art.flame} color={palette.flameOrange} />
              <Path path={art.core} color={palette.flameCore} />
            </Group>
          </Group>
        </Group>
        <Picture picture={particles} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: HERO_WIDTH, height: HERO_HEIGHT },
  canvas: {
    position: 'absolute',
    left: HERO_WIDTH / 2 - BASE_X,
    top: HERO_BASE_Y - BASE_Y,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
});
