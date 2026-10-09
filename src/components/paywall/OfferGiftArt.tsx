import { useId, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { easing, spring } from '../../theme/motion';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerMediumHaptic } from '../../native/tapHaptics';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { GIFT_BOX_VIEWBOX, GiftBoxBody, GiftBoxLid, type GiftBoxPalette, type GiftBoxRibbonPalette } from '../common/GiftBoxArt';

const BLUE_BOX: GiftBoxPalette = {
  lidTop: colors.koala.light,
  face: colors.koala.body,
  side: colors.koala.shade,
  inside: colors.koala.iris,
  shine: colors.koala.light,
};
const PINK_RIBBON: GiftBoxRibbonPalette = {
  tint: colors.koala.earInner,
  mid: colors.playful.blush.tint,
  base: colors.playful.blush.mid,
  soft: colors.koala.eyeWhite,
};
const GLOW = colors.playful.amber;
const VIEWBOX = `0 0 ${GIFT_BOX_VIEWBOX} ${GIFT_BOX_VIEWBOX}`;
const LID_LIFT = 0.19;
const LID_TILT_DEG = -12;
const OPENING = { x: 150, y: 161 };
const BEAM_ROTATION_MS = 22000;
const BEAM_ANGLES = [0, 54, 116, 176, 242, 304];

const SPARKLES = [
  { x: 37.5, y: 79.5, r: 10.5, fill: GLOW.base },
  { x: 261, y: 54, r: 9, fill: GLOW.base },
  { x: 273, y: 177, r: 6, fill: GLOW.mid },
  { x: 214.5, y: 18, r: 6, fill: GLOW.mid },
];

function sparklePath(x: number, y: number, r: number) {
  return `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
}

interface Props {
  size: number;
  /** When the lid pops, in ms after mount. */
  delay: number;
}

/** The decoration reward gift, with a lid that pops open and lets the light out. */
export default function OfferGiftArt({ size, delay }: Props) {
  const gradientId = useId().replace(/:/g, '');
  const fill = (name: string) => `url(#${gradientId}-${name})`;
  const reducedMotion = useReducedMotion();
  const open = useSharedValue(reducedMotion ? 1 : 0);
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);
  const hasOpened = useRef(reducedMotion);
  const playOpenSound = useCompletionSound('gift');
  const playOpenSoundRef = useRef(playOpenSound);
  playOpenSoundRef.current = playOpenSound;

  useWhileVisible(() => {
    let stopTimer: (() => void) | undefined;
    if (reducedMotion) {
      hasOpened.current = true;
      open.value = 1;
    } else {
      const openingDelay = hasOpened.current ? 0 : delay;
      open.value = withDelay(openingDelay, withSpring(1, spring.pop));
      rotation.value = withDelay(
        openingDelay,
        withRepeat(withTiming(rotation.value + 360, {
          duration: BEAM_ROTATION_MS,
          easing: Easing.linear,
        }), -1, false),
      );
      pulse.value = 0;
      pulse.value = withDelay(
        openingDelay,
        withRepeat(withTiming(1, { duration: 2600, easing: easing.breathe }), -1, true),
      );
      if (!hasOpened.current) {
        stopTimer = startUiTimer(openingDelay, () => {
          hasOpened.current = true;
          triggerMediumHaptic();
          playOpenSoundRef.current();
        });
      }
    }
    return () => {
      stopTimer?.();
      cancelAnimation(open);
      cancelAnimation(rotation);
      cancelAnimation(pulse);
    };
  }, [delay, open, rotation, pulse, reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 1], [0, 1], 'clamp'),
  }));

  const beamStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.85, 1]),
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 1], [0, 1], 'clamp') *
      interpolate(pulse.value, [0, 1], [0.55, 0.95]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.96, 1.03]) }],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -size * LID_LIFT * open.value },
      { translateX: -size * 0.04 * open.value },
      { rotate: `${LID_TILT_DEG * open.value}deg` },
    ],
  }));

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={size} height={size} viewBox={VIEWBOX}>
          <Defs>
            <RadialGradient id={`${gradientId}-halo`}>
              <Stop offset="0" stopColor={GLOW.soft} stopOpacity="0.95" />
              <Stop offset="0.45" stopColor={GLOW.tint} stopOpacity="0.38" />
              <Stop offset="1" stopColor={GLOW.soft} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={OPENING.x} cy={OPENING.y - 15} rx="129" ry="118" fill={fill('halo')} />
        </Svg>
        {/* The square's center is the opening, so the light stays anchored as it turns. */}
        <Animated.View style={[StyleSheet.absoluteFill, { top: size * (OPENING.y / GIFT_BOX_VIEWBOX - 0.5), height: size }, beamStyle]}>
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Defs>
              <RadialGradient id={`${gradientId}-rays`} cx="100" cy="100" r="98" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={GLOW.soft} stopOpacity="0.9" />
                <Stop offset="0.3" stopColor={GLOW.tint} stopOpacity="0.8" />
                <Stop offset="0.7" stopColor={GLOW.soft} stopOpacity="0.3" />
                <Stop offset="1" stopColor={GLOW.soft} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {BEAM_ANGLES.map((angle, i) => (
              <G key={angle} rotation={angle} origin="100, 100" opacity={i % 2 === 0 ? 1 : 0.75}>
                <Path d="M100 100Q94 74 70 6Q100 -2 130 6Q106 74 100 100Z" fill={fill('rays')} opacity="0.16" />
                <Path d="M100 100Q96 69 79 4Q100 0 121 4Q104 69 100 100Z" fill={fill('rays')} opacity="0.2" />
                <Path d="M100 100Q98 62 90 2Q100 0 110 2Q102 62 100 100Z" fill={fill('rays')} opacity="0.16" />
              </G>
            ))}
          </Svg>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, sparkleStyle]}>
        <Svg width={size} height={size} viewBox={VIEWBOX}>
          {SPARKLES.map((p) => (
            <Path key={`${p.x}-${p.y}`} d={sparklePath(p.x, p.y, p.r)} fill={p.fill} />
          ))}
          <Ellipse cx="63" cy="48" rx="3" ry="3" fill={GLOW.mid} opacity="0.7" />
          <Ellipse cx="246" cy="118.5" rx="3" ry="3" fill={GLOW.mid} opacity="0.65" />
        </Svg>
      </Animated.View>

      <Svg width={size} height={size} viewBox={VIEWBOX} style={StyleSheet.absoluteFill}>
        <Ellipse cx="155" cy="269" rx="94" ry="11" fill={colors.koala.light} opacity="0.65" />
        <GiftBoxBody palette={BLUE_BOX} ribbon={PINK_RIBBON} />
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={size} height={size} viewBox={VIEWBOX}>
          <Path d="M72 170 108 152H228L192 170Z" fill={GLOW.soft} opacity="0.95" />
        </Svg>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, lidStyle]}>
        <Svg width={size} height={size} viewBox={VIEWBOX}>
          <GiftBoxLid palette={BLUE_BOX} ribbon={PINK_RIBBON} />
        </Svg>
      </Animated.View>
    </View>
  );
}
