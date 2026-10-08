import { Children, useEffect, useState, type ReactNode, type Ref } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Star } from './RewardSparkles';
import { Text } from './Text';
import Icon, { type IconName } from './icons/Icon';
import TaskIllustration from './icons/TaskIllustration';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerLightHaptic } from '../../native/tapHaptics';
import { useStatCardPopSound } from '../../hooks/useStatCardPopSound';

const ICON_SIZE = 26;
const COIN_ICON = { name: 'coin', color: colors.reward.gold } as const;

const FRAME_WIDTH = 3;

/*
 * A result card arriving, timed frame by frame off a lesson-complete recording,
 * in ms from `enterAt`. The framed body comes alone, swelling past full size
 * while its number counts, sinks back as the count lands, then the tab pops up
 * from behind it with a halo and a few sparkles thrown off.
 */
const BODY_FROM = 0.72;
const BODY_PEAK = 1.19;
const BODY_DIP = 0.97;
const SWELL = [0, 260] as const;
const POP_AT = 400;
const SINK = [SWELL[1] + 25, POP_AT] as const;
const COUNT_MS = 300;
/** at most one number per frame */
const COUNT_STEPS = 18;
const TAB_RISE = [POP_AT, POP_AT + 320] as const;
/** the share of the tab still behind the body the frame it pops */
const TAB_HIDDEN_AT_POP = 1 / 3;
/** how far past full size the card swells as the tab pops, before it settles */
const POP_BOUNCE = 0.07;
const HALO_WIDTH = 5;
const HALO_GROW = [POP_AT, POP_AT + 250] as const;
/** the halo draws back into the card's edge, fading only as it reaches it */
const HALO_RETRACT = [POP_AT + 380, POP_AT + 620] as const;
const HALO_FADE = [POP_AT + 540, POP_AT + 620] as const;
const TAKEOVER = [TAB_RISE[1], TAB_RISE[1] + 120] as const;
const ENTRANCE_END = POP_AT + 570;
const BUZZ_TICK_MS = 30;

const SPARKLE_SIZE = 16;
/** how long before the first card arrives its sparkles gather */
export const STAT_CARD_SPARKLE_LEAD_MS = 490;
const RING_BURST_MS = 220;
const RING_ABSORB_MS = 125;
/**
 * Where the first card's sparkles hang around its body, in card widths from
 * the body's centre, and when each bursts out and is pulled into the icon.
 */
const RING = [
  { x: -0.025, y: -0.483, appear: 50, absorb: -65 },
  { x: -0.483, y: -0.05, appear: 83, absorb: -55 },
  { x: 0.417, y: -0.325, appear: 50, absorb: 0 },
  { x: 0.175, y: 0.3, appear: 83, absorb: 30 },
  { x: 0.425, y: 0.183, appear: 50, absorb: 75 },
  { x: -0.367, y: -0.317, appear: 17, absorb: 120 },
  { x: -0.292, y: 0.208, appear: 0, absorb: 165 },
  { x: 0.533, y: -0.15, appear: 50, absorb: 200 },
] as const;
type RingSpark = (typeof RING)[number];
/**
 * The sparkles the pop throws off, in card widths: x from the left edge, y out
 * from the top edge (or the bottom one), ms from the pop.
 */
const POP_SPARKS = [
  { from: [0.733, -0.025], to: [0.758, -0.092], below: false, at: 0, move: 120, size: 1, shrink: [300, 460], gone: 470 },
  { from: [0.092, 0.075], to: [0.017, 0.15], below: true, at: 50, move: 200, size: 1, shrink: [400, 490], gone: 500 },
  { from: [0.917, -0.05], to: [0.917, -0.05], below: false, at: 500, move: 1, size: 0.7, shrink: [500, 560], gone: 565 },
] as const;
type PopSpark = (typeof POP_SPARKS)[number];

const OUT_QUAD = Easing.out(Easing.quad);
const OUT_CUBIC = Easing.out(Easing.cubic);
const IN_QUAD = Easing.in(Easing.quad);
const IN_CUBIC = Easing.in(Easing.cubic);
const IN_OUT_CUBIC = Easing.inOut(Easing.cubic);
const OVERSHOOT = Easing.out(Easing.back(2));
const LINEAR = Easing.linear;

const TONES = {
  amber: colors.playful.amber.base,
  sky: colors.playful.sky.mid,
} as const;

export type HeaderStripTone = keyof typeof TONES;

const HALOS: Record<HeaderStripTone, string> = {
  amber: colors.playful.amber.tint,
  sky: colors.playful.sky.tint,
};
type StatIcon = { name: IconName; color: string };

interface Props {
  label: string;
  value: string;
  tone: HeaderStripTone;
  icon?: StatIcon;
  accessibilityLabel?: string;
  /**
   * ms from mount to arrive the way a lesson's results do: the body alone,
   * counting, then the tab popping up behind it. Omit to simply be there.
   */
  enterAt?: number;
  /** the number `value` shows, counted up from zero as the card arrives */
  countTo?: number;
  /** how a counted number is written; `value` is `formatCount(countTo)` */
  formatCount?: (count: number) => string;
  /** what a `value` counted elsewhere ends on, so the card is sized for it from the start */
  finalValue?: string;
  /** gathers the sparkles that fly into its icon first, for the first card of a row */
  sparkleRing?: boolean;
  /** measured as the point anything earned flies from */
  ref?: Ref<View>;
}

function StatIconView({ icon }: { icon: StatIcon }) {
  return icon.name === 'coin' || icon.name === 'streakFilled' || icon.name === 'streak' ? (
    <TaskIllustration name={icon.name} size={ICON_SIZE} />
  ) : (
    <Icon name={icon.name} size={ICON_SIZE} color={icon.color} />
  );
}

/** One number under a coloured header strip naming it. */
export default function HeaderStripStatCard({
  label,
  value,
  tone,
  icon,
  accessibilityLabel,
  enterAt,
  countTo,
  formatCount = String,
  finalValue = value,
  sparkleRing = false,
  ref,
}: Props) {
  const spoken = accessibilityLabel ?? `${label} ${finalValue}`;

  if (enterAt != null) {
    return (
      <EnteringStatCard
        ref={ref}
        label={label}
        value={value}
        countTo={countTo}
        formatCount={formatCount}
        finalValue={finalValue}
        tone={tone}
        icon={icon}
        enterAt={enterAt}
        sparkleRing={sparkleRing}
        accessibilityLabel={spoken}
      />
    );
  }

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { backgroundColor: TONES[tone] }]}
      accessible
      accessibilityLabel={spoken}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.body}>
        {icon == null ? null : <StatIconView icon={icon} />}
        <Text
          style={styles.value}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

interface EnteringProps {
  label: string;
  value: string;
  countTo?: number;
  formatCount: (count: number) => string;
  finalValue: string;
  tone: HeaderStripTone;
  icon?: StatIcon;
  enterAt: number;
  sparkleRing: boolean;
  accessibilityLabel: string;
  ref?: Ref<View>;
}

function progress(
  ms: number,
  [from, to]: readonly [number, number],
  ease: (x: number) => number,
) {
  'worklet';
  return ease(Math.min(1, Math.max(0, (ms - from) / (to - from))));
}

function bodyScaleAt(ms: number) {
  'worklet';
  if (ms >= POP_AT) return 1;
  if (ms >= SINK[0]) return BODY_PEAK + (BODY_DIP - BODY_PEAK) * progress(ms, SINK, IN_CUBIC);
  return BODY_FROM + (BODY_PEAK - BODY_FROM) * progress(ms, SWELL, OUT_QUAD);
}

/** Up past full size and back, with a slight dip, done by the time the tab is up. */
function popScaleAt(ms: number) {
  'worklet';
  const p = progress(ms, TAB_RISE, Easing.linear);
  return 1 + POP_BOUNCE * Math.sin(p * Math.PI * 1.5) * (1 - p);
}

/** The number counted up over the card's arrival, one step a frame at most. */
function useArrivalCount(countTo: number | undefined, enterAt: number) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (countTo == null) return;
    const steps = Math.max(1, Math.min(countTo, COUNT_STEPS));
    const cancels = Array.from({ length: steps }, (_, step) =>
      startUiTimer(enterAt + (COUNT_MS * step) / steps, () =>
        setShown(Math.round((countTo * (step + 1)) / steps)),
      ),
    );
    return () => cancels.forEach((cancel) => cancel());
  }, [countTo, enterAt]);

  return shown;
}

/** A light buzz under the count, the whole time it runs. */
function useCountBuzz(enterAt: number) {
  useEffect(() => {
    const cancels = Array.from({ length: Math.floor(COUNT_MS / BUZZ_TICK_MS) + 1 }, (_, tick) =>
      startUiTimer(enterAt + tick * BUZZ_TICK_MS, triggerLightHaptic),
    );
    return () => cancels.forEach((cancel) => cancel());
  }, [enterAt]);
}

/**
 * The finished card is laid out unseen so the row never moves, and takes over
 * once the tab is up, bringing its shadow. Over it the entrance is drawn from
 * the tab behind and the framed body in front; the halo sits under both.
 */
function EnteringStatCard({
  label,
  value,
  countTo,
  formatCount,
  finalValue,
  tone,
  icon,
  enterAt,
  sparkleRing,
  accessibilityLabel,
  ref,
}: EnteringProps) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const tabHeight = useSharedValue(0);
  const iconX = useSharedValue(0);
  const lead = sparkleRing ? STAT_CARD_SPARKLE_LEAD_MS : 0;
  const clock = useSharedValue(-lead - 1);
  const counted = useArrivalCount(countTo, enterAt);
  useCountBuzz(enterAt);
  useStatCardPopSound(clock, POP_AT);

  useEffect(() => {
    clock.value = withDelay(
      Math.max(0, enterAt - lead),
      withTiming(ENTRANCE_END, { duration: ENTRANCE_END + lead + 1, easing: LINEAR }),
    );
    return () => cancelAnimation(clock);
  }, [clock, enterAt, lead]);

  const width = box?.width ?? 0;
  const height = box?.height ?? 0;
  const shown =
    countTo == null ? value : formatCount(counted).padStart(finalValue.length, '0');
  const bodyY = useDerivedValue(() => (tabHeight.value + height) / 2);
  const tabDrop = useDerivedValue(
    () => tabHeight.value * TAB_HIDDEN_AT_POP * (1 - progress(clock.value, TAB_RISE, OVERSHOOT)),
  );

  const finishedStyle = useAnimatedStyle(() => ({
    opacity: progress(clock.value, TAKEOVER, LINEAR),
  }));

  const stageStyle = useAnimatedStyle(() => ({
    opacity: clock.value >= ENTRANCE_END ? 0 : 1,
    transform: [{ scale: popScaleAt(clock.value) }],
  }));

  const haloStyle = useAnimatedStyle(() => {
    const ms = clock.value;
    const grown = 0.4 + 0.6 * progress(ms, HALO_GROW, OUT_CUBIC);
    const ring = HALO_WIDTH * grown * (1 - progress(ms, HALO_RETRACT, IN_OUT_CUBIC));
    const drop = tabDrop.value;
    return {
      opacity: ms < POP_AT ? 0 : 1 - progress(ms, HALO_FADE, LINEAR),
      transform: [
        { scale: popScaleAt(ms) },
        { translateY: drop / 2 },
        { scaleX: (width + ring * 2) / (width + HALO_WIDTH * 2) },
        { scaleY: (height - drop + ring * 2) / (height + HALO_WIDTH * 2) },
      ],
    };
  });

  const tabStyle = useAnimatedStyle(() => ({
    opacity: clock.value >= POP_AT ? 1 : 0,
    transform: [{ translateY: tabDrop.value }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: clock.value > 0 ? 1 : 0,
    transform: [{ scale: bodyScaleAt(clock.value) }],
  }));

  const onFinishedLayout = (event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setBox((current) =>
      current?.width === w && current.height === h ? current : { width: w, height: h },
    );
  };
  const onTabLayout = (event: LayoutChangeEvent) => {
    tabHeight.value = FRAME_WIDTH + event.nativeEvent.layout.height;
  };
  const onValueLayout = (event: LayoutChangeEvent) => {
    if (icon != null) iconX.value = -(event.nativeEvent.layout.width + spacing.sm) / 2;
  };

  const background = { backgroundColor: TONES[tone] };
  const sparkleColor = TONES[tone];

  return (
    <View ref={ref} collapsable={false} accessible accessibilityLabel={accessibilityLabel}>
      {box == null ? null : (
        <Animated.View
          style={[styles.halo, { backgroundColor: HALOS[tone] }, haloStyle]}
          pointerEvents="none"
        />
      )}

      <Animated.View
        style={finishedStyle}
        onLayout={onFinishedLayout}
        importantForAccessibility="no-hide-descendants"
      >
        <HeaderStripStatCard label={label} value={shown} tone={tone} icon={icon} />
      </Animated.View>

      {box == null ? null : (
        <Animated.View style={[styles.layer, stageStyle]} pointerEvents="none">
          <Animated.View style={[styles.tab, background, tabStyle]}>
            <Text style={styles.label} numberOfLines={1} onLayout={onTabLayout}>
              {label}
            </Text>
          </Animated.View>

          <View style={styles.layer}>
            <View style={styles.tabSpace}>
              <Text style={[styles.label, styles.hidden]} numberOfLines={1}>
                {label}
              </Text>
            </View>
            <Animated.View style={[styles.plate, background, bodyStyle]}>
              <View style={[styles.body, styles.fill]}>
                {icon == null ? null : <StatIconView icon={icon} />}
                <View style={styles.valueContainer} onLayout={onValueLayout}>
                  <Text style={[styles.value, styles.hidden]} numberOfLines={1}>
                    {finalValue}
                  </Text>
                  <Text style={[styles.value, styles.counting]} numberOfLines={1}>
                    {shown}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {sparkleRing
            ? RING.map((spark, index) => (
                <RingSparkle
                  key={index}
                  spark={spark}
                  clock={clock}
                  width={width}
                  bodyY={bodyY}
                  iconX={iconX}
                  color={sparkleColor}
                />
              ))
            : null}
          {POP_SPARKS.map((spark, index) => (
            <PopSparkle
              key={index}
              spark={spark}
              clock={clock}
              width={width}
              height={height}
              color={sparkleColor}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

/** Bursts out of the body before it arrives, hangs, then is pulled into the icon. */
function RingSparkle({
  spark,
  clock,
  width,
  bodyY,
  iconX,
  color,
}: {
  spark: RingSpark;
  clock: SharedValue<number>;
  width: number;
  bodyY: SharedValue<number>;
  iconX: SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const ms = clock.value;
    const appear = spark.appear - STAT_CARD_SPARKLE_LEAD_MS;
    const centreX = width / 2;
    const centreY = bodyY.value;
    const out = 0.3 + 0.7 * progress(ms, [appear, appear + RING_BURST_MS], OUT_CUBIC);
    const hangX = centreX + spark.x * width * out;
    const hangY = centreY + spark.y * width * out;
    const pull = progress(ms, [spark.absorb, spark.absorb + RING_ABSORB_MS], IN_QUAD);
    const iconCentreX = centreX + iconX.value * bodyScaleAt(ms);
    const shown = ms > appear && ms < spark.absorb + RING_ABSORB_MS;
    return {
      opacity: shown ? Math.min(1, (1 - pull) * 4) : 0,
      transform: [
        { translateX: hangX + (iconCentreX - hangX) * pull },
        { translateY: hangY + (centreY - hangY) * pull },
        { scale: 0.4 + 0.6 * progress(ms, [appear, appear + 50], OUT_QUAD) },
      ],
    };
  });

  return <Star x={0} y={0} size={SPARKLE_SIZE} color={color} style={style} />;
}

/** Thrown off a corner as the tab pops, drifts a little, shrinks and is gone. */
function PopSparkle({
  spark,
  clock,
  width,
  height,
  color,
}: {
  spark: PopSpark;
  clock: SharedValue<number>;
  width: number;
  height: number;
  color: string;
}) {
  const edge = spark.below ? height : 0;
  const style = useAnimatedStyle(() => {
    const ms = clock.value - POP_AT;
    const drift = progress(ms, [spark.at, spark.at + spark.move], OUT_CUBIC);
    const fade = progress(ms, spark.shrink, IN_QUAD);
    const [fromX, fromY] = spark.from;
    const [toX, toY] = spark.to;
    return {
      opacity: ms > spark.at && ms < spark.gone ? 1 : 0,
      transform: [
        { translateX: (fromX + (toX - fromX) * drift) * width },
        { translateY: edge + (fromY + (toY - fromY) * drift) * width },
        { scale: spark.size * (1 - 0.5 * fade) },
      ],
    };
  });

  return <Star x={0} y={0} size={SPARKLE_SIZE} color={color} style={style} />;
}

/** The coins just earned, the card they fly from. */
export function EarnedCoinsCard({
  coins,
  ref,
  enterAt,
  finalCoins,
  sparkleRing,
}: {
  coins: number;
  ref?: Ref<View>;
  enterAt?: number;
  /** the total a counting `coins` ends on */
  finalCoins?: number;
  sparkleRing?: boolean;
}) {
  const finalValue = `${finalCoins ?? coins}`;
  return (
    <HeaderStripStatCard
      ref={ref}
      label="Coins"
      value={`${coins}`.padStart(finalValue.length, '0')}
      finalValue={finalValue}
      tone="amber"
      icon={COIN_ICON}
      enterAt={enterAt}
      sparkleRing={sparkleRing}
      accessibilityLabel={`${finalValue} coins earned`}
    />
  );
}

/** Cards side by side, sharing the width equally. */
export function HeaderStripStatRow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.row}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={styles.cell}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.shadow,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    padding: FRAME_WIDTH,
  },
  label: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    textAlign: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs + FRAME_WIDTH,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: ICON_SIZE + spacing.md * 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.small,
    borderCurve: 'continuous',
    backgroundColor: colors.background.card,
  },
  value: {
    ...typography.title.title3,
    color: colors.text.primary,
    minWidth: 0,
    flexShrink: 1,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  valueContainer: {
    minWidth: 0,
    flexShrink: 1,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  halo: {
    position: 'absolute',
    top: -HALO_WIDTH,
    left: -HALO_WIDTH,
    right: -HALO_WIDTH,
    bottom: -HALO_WIDTH,
    borderRadius: radius.medium + HALO_WIDTH,
    borderCurve: 'continuous',
  },
  // Deep enough that its rounded foot stays tucked behind the body even while
  // it is still dropped.
  tab: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    paddingTop: FRAME_WIDTH,
    paddingHorizontal: FRAME_WIDTH,
    paddingBottom: radius.medium * 2,
  },
  tabSpace: {
    paddingTop: FRAME_WIDTH,
  },
  // `card` without its shadow, which the finished card brings as it takes over.
  plate: {
    flex: 1,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    padding: FRAME_WIDTH,
  },
  fill: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
  // Wider than the final value it overlays, so a count with wider digits is
  // never squeezed or clipped.
  counting: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -spacing.md,
    right: -spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
  },
});
