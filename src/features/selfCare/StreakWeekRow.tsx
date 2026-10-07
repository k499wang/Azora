import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  Picture,
  RoundedRect,
  Skia,
  createPicture,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { RoutineStreakWeekSlot } from './domain/routineFirstCompletion';
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
  slots: readonly RoutineStreakWeekSlot[];
}

const palette = colors.streakCelebration;
const LABEL_HEIGHT = 20;
const LABEL_GAP = 12;
const DIAMETER = 30;
const RADIUS = DIAMETER / 2;
const OVERFLOW_X = 28;
const CANVAS_HEIGHT = 104;
const CIRCLE_Y = 64;
const CANVAS_TOP = LABEL_HEIGHT + LABEL_GAP + RADIUS - CIRCLE_Y;
const COIN_RADIUS = 12;
const COIN_RISE = 34;
const OUTLINE_RADIUS = RADIUS + 2;
const CHECK_OVERSHOOT = 2;
const OUTLINE_FADE_SHARE = 0.2;
const LICK_REACH = 0.55;
const CONFETTI = [
  { angle: -160, distance: 36, color: palette.coin },
  { angle: -125, distance: 48, color: palette.flameYellow },
  { angle: -100, distance: 30, color: palette.flameOrange },
  { angle: -80, distance: 44, color: palette.coin },
  { angle: -55, distance: 50, color: palette.flameYellow },
  { angle: -20, distance: 34, color: palette.flameOrange },
].map(chip => ({ ...chip, angle: (chip.angle * Math.PI) / 180 }));
const PILL_GRADIENT = [palette.pillTop, palette.pillBottom];

/** Duolingo's week: seven days ending today, today's coin dropping in to extend the run. */
export default function StreakWeekRow({ clock, slots }: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const slotWidth = width / slots.length;
  const centre = (index: number) => OVERFLOW_X + slotWidth * (index + 0.5);
  const todayIndex = slots.findIndex(slot => slot.isToday);
  const todayFilled = todayIndex >= 0 && slots[todayIndex].filled;
  const todayX = centre(todayIndex);
  const perfect = slots.every(slot => slot.filled);

  const runs = useMemo(() => {
    const found: { from: number; to: number }[] = [];
    slots.forEach((slot, index) => {
      if (!slot.filled || slot.isToday) return;
      const last = found[found.length - 1];
      if (last && last.to === index - 1) last.to = index;
      else found.push({ from: index, to: index });
    });
    return found;
  }, [slots]);
  const extended = todayFilled ? runs.find(run => run.to === todayIndex - 1) : undefined;
  const staticRuns = runs.filter(run => run !== extended);
  const extendLeft = (extended ? centre(extended.from) : todayX) - RADIUS;
  const extendFrom = extended ? centre(extended.to) + RADIUS : todayX - RADIUS;
  const extendTo = todayX + RADIUS;

  const art = useMemo(() => {
    const check = Skia.Path.Make().moveTo(-6, 0.5).lineTo(-2, 4.5).lineTo(6, -4.5);
    const left = OVERFLOW_X + slotWidth / 2 - OUTLINE_RADIUS;
    const right = OVERFLOW_X + width - slotWidth / 2 + OUTLINE_RADIUS;
    const top = CIRCLE_Y - OUTLINE_RADIUS;
    const size = OUTLINE_RADIUS * 2;
    const outline = Skia.Path.Make()
      .moveTo((left + right) / 2, top)
      .lineTo(right - OUTLINE_RADIUS, top)
      .arcToOval(Skia.XYWHRect(right - size, top, size, size), -90, 180, false)
      .lineTo(left + OUTLINE_RADIUS, top + size)
      .arcToOval(Skia.XYWHRect(left, top, size, size), 90, 180, false)
      .close();
    const confettiPaints = CONFETTI.map(chip => {
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      paint.setColor(Skia.Color(chip.color));
      return paint;
    });
    return { check, outline, confettiPaints, chip: Skia.XYWHRect(-3, -2, 6, 4) };
  }, [slotWidth, width]);

  const extendWidth = useDerivedValue(
    () =>
      mix(extendFrom, extendTo, easeInOutCubic(phase(clock.value, timing.extendAt, timing.extendDuration))) -
      extendLeft,
  );
  const todayCheckTransform = useDerivedValue(() => [
    { translateX: todayX },
    { translateY: CIRCLE_Y },
    { scale: easeOutBack(phase(clock.value, timing.checkAt, timing.checkPopDuration), CHECK_OVERSHOOT) },
  ]);

  const coin = useDerivedValue(() => {
    const t = clock.value;
    const flip = easeOutCubic(phase(t, timing.coinAt, timing.coinFlipDuration));
    const drop = phase(t, timing.dropAt, timing.checkAt - timing.dropAt);
    const merge = phase(t, timing.checkAt, timing.mergeDuration);
    const flat =
      Math.abs(Math.cos(Math.PI / 2 + flip * Math.PI * 1.5)) *
      mix(1, 0.5, easeInOutCubic(phase(drop, 0.6, 0.4)));
    const lift = mix(0.8, 1.3, flip);
    return {
      opacity: t < timing.coinAt ? 0 : 1 - easeInQuad(merge),
      flat,
      transform: [
        { translateX: todayX },
        { translateY: CIRCLE_Y - COIN_RISE * (1 - easeInQuad(drop)) },
        { scale: mix(lift, 1, easeInOutCubic(drop)) * mix(1, 0.6, easeOutCubic(merge)) },
      ],
    };
  });
  const coinTransform = useDerivedValue(() => coin.value.transform);
  const coinOpacity = useDerivedValue(() => coin.value.opacity);
  const coinFaceTransform = useDerivedValue(() => [{ scaleY: coin.value.flat }]);
  const coinRimTransform = useDerivedValue(() => [
    { translateY: 3 * (1 - coin.value.flat) },
    { scaleY: coin.value.flat },
  ]);

  const confetti = useDerivedValue(() =>
    createPicture(canvas => {
      const f = phase(clock.value, timing.checkAt, timing.confettiDuration);
      if (f <= 0 || f >= 1) return;
      const reach = easeOutCubic(f);
      for (let i = 0; i < CONFETTI.length; i += 1) {
        const chip = CONFETTI[i];
        const paint = art.confettiPaints[i];
        paint.setAlphaf(1 - easeInQuad(f));
        canvas.save();
        canvas.translate(
          todayX + Math.cos(chip.angle) * chip.distance * reach,
          CIRCLE_Y + Math.sin(chip.angle) * chip.distance * reach + 24 * f * f,
        );
        canvas.rotate((i % 2 === 0 ? 540 : -540) * reach, 0, 0);
        canvas.drawRect(art.chip, paint);
        canvas.restore();
      }
    }),
  );

  const outlineOpacity = useDerivedValue(() =>
    easeInOutCubic(phase(clock.value, timing.perfectAt, timing.perfectDuration * OUTLINE_FADE_SHARE)),
  );
  const lick = useDerivedValue(() => {
    const progress = phase(clock.value, timing.perfectAt, timing.perfectDuration);
    const end = LICK_REACH * easeInOutCubic(progress);
    return {
      start: Math.max(0, end - mix(0.12, 0.02, progress)),
      end,
      width: mix(10, 2, progress),
      opacity: 1 - easeInQuad(phase(progress, 0.75, 0.25)),
    };
  });
  const lickStart = useDerivedValue(() => lick.value.start);
  const lickEnd = useDerivedValue(() => lick.value.end);
  const lickWidth = useDerivedValue(() => lick.value.width);
  const lickOpacity = useDerivedValue(() => lick.value.opacity);

  const accessibilityLabel = `This week: ${slots
    .map(slot => `${slot.name}${slot.isToday ? ' today' : ''} ${slot.filled ? 'done' : 'not done'}`)
    .join(', ')}`;

  return (
    <View style={styles.row} onLayout={onLayout} accessible accessibilityLabel={accessibilityLabel}>
      <View style={styles.labels}>
        {slots.map((slot, index) => (
          <Text key={index} style={[styles.label, slot.isToday && styles.labelToday]}>
            {slot.label}
          </Text>
        ))}
      </View>
      <View style={styles.circles} />
      <Canvas style={[styles.canvas, { width: width + OVERFLOW_X * 2 }]} pointerEvents="none">
        <Group opacity={width > 0 ? 1 : 0}>
          {slots.map((slot, index) =>
            !slot.filled || slot.isToday ? (
              <Circle key={index} cx={centre(index)} cy={CIRCLE_Y} r={RADIUS} color={palette.dayEmpty} />
            ) : null,
          )}
          {staticRuns.map(run => (
            <RoundedRect
              key={run.from}
              x={centre(run.from) - RADIUS}
              y={CIRCLE_Y - RADIUS}
              width={centre(run.to) - centre(run.from) + DIAMETER}
              height={DIAMETER}
              r={RADIUS}
            >
              <LinearGradient start={vec(0, CIRCLE_Y - RADIUS)} end={vec(0, CIRCLE_Y + RADIUS)} colors={PILL_GRADIENT} />
            </RoundedRect>
          ))}
          {todayFilled && (
            <RoundedRect x={extendLeft} y={CIRCLE_Y - RADIUS} width={extendWidth} height={DIAMETER} r={RADIUS}>
              <LinearGradient start={vec(0, CIRCLE_Y - RADIUS)} end={vec(0, CIRCLE_Y + RADIUS)} colors={PILL_GRADIENT} />
            </RoundedRect>
          )}
          {slots.map((slot, index) =>
            slot.filled && !slot.isToday ? (
              <Group key={index} transform={[{ translateX: centre(index) }, { translateY: CIRCLE_Y }]}>
                <CheckMark path={art.check} />
              </Group>
            ) : null,
          )}
          {todayFilled && (
            <Group transform={todayCheckTransform}>
              <CheckMark path={art.check} />
            </Group>
          )}
          {perfect && (
            <Group>
              <Path
                path={art.outline}
                style="stroke"
                strokeWidth={3}
                color={palette.flameYellow}
                opacity={outlineOpacity}
              />
              <Path
                path={art.outline}
                start={lickStart}
                end={lickEnd}
                style="stroke"
                strokeWidth={lickWidth}
                strokeCap="round"
                color={palette.flameYellow}
                opacity={lickOpacity}
              />
            </Group>
          )}
          {todayFilled && (
            <Group transform={coinTransform} opacity={coinOpacity}>
              <Group transform={coinRimTransform}>
                <Circle cx={0} cy={0} r={COIN_RADIUS} color={palette.flameOrange} />
              </Group>
              <Group transform={coinFaceTransform}>
                <Circle cx={0} cy={0} r={COIN_RADIUS} color={palette.coin} />
              </Group>
            </Group>
          )}
          {todayFilled && <Picture picture={confetti} />}
        </Group>
      </Canvas>
    </View>
  );
}

interface CheckMarkProps {
  path: SkPath;
}

function CheckMark({ path }: CheckMarkProps) {
  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={3}
      strokeCap="round"
      strokeJoin="round"
      color={palette.check}
    />
  );
}

const styles = StyleSheet.create({
  row: { width: '100%' },
  labels: { flexDirection: 'row', marginBottom: LABEL_GAP },
  label: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: LABEL_HEIGHT,
    color: palette.dayLabel,
    textAlign: 'center',
  },
  labelToday: { color: palette.label },
  circles: { height: DIAMETER },
  canvas: {
    position: 'absolute',
    top: CANVAS_TOP,
    left: -OVERFLOW_X,
    height: CANVAS_HEIGHT,
  },
});
