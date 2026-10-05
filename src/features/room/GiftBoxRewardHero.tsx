import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { duration, easing, spring } from '../../theme/motion';
import { decorationRewardPalette } from './decorationRewardPalette';

interface Props {
  size: number;
  active: boolean;
  reducedMotion: boolean;
  delay: number;
}

/** The gift represents an earned choice; the picker reveals the actual pieces. */
export default function GiftBoxRewardHero({ size, active, reducedMotion, delay }: Props) {
  const enter = useSharedValue(0);
  const open = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(enter);
    cancelAnimation(open);
    enter.value = active && reducedMotion ? 1 : 0;
    open.value = active && reducedMotion ? 1 : 0;
    if (active && !reducedMotion) {
      enter.value = withDelay(delay, withSpring(1, spring.pop));
      open.value = withDelay(delay + duration.slower, withTiming(1, {
        duration: duration.slow,
        easing: easing.settle,
      }));
    }
    return () => {
      cancelAnimation(enter);
      cancelAnimation(open);
    };
  }, [active, delay, enter, open, reducedMotion]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.5], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(enter.value, [0, 1], [0.7, 1]) }],
  }));
  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -size * 0.1 * open.value }, { rotate: `${-5 * open.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: open.value }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, heroStyle]}
    >
      <Svg width={size} height={size} viewBox="0 0 300 300">
        <Defs>
          <RadialGradient id="giftSpotlight" cx="50%" cy="45%" r="50%">
            <Stop offset="0" stopColor={decorationRewardPalette.surface} stopOpacity={0.85} />
            <Stop offset="1" stopColor={decorationRewardPalette.surface} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="150" cy="145" r="145" fill="url(#giftSpotlight)" />
        <Ellipse cx="150" cy="264" rx="90" ry="10" fill={colors.playful.night.ink} opacity={0.3} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={size} height={size} viewBox="0 0 300 300">
          <Defs>
            <LinearGradient id="giftLight" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={colors.playful.amber.soft} stopOpacity={0.75} />
              <Stop offset="1" stopColor={colors.playful.amber.soft} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d="M88 151 55 42 245 42 212 151Z" fill="url(#giftLight)" />
          <Path d="M63 74 67 86 79 90 67 94 63 106 59 94 47 90 59 86Z M241 132 245 144 257 148 245 152 241 164 237 152 225 148 237 144Z" fill={colors.reward.gold} />
          <Path d="M218 55 221 64 230 67 221 70 218 79 215 70 206 67 215 64Z" fill={colors.playful.amber.soft} />
          <Circle cx="84" cy="185" r="3" fill={colors.playful.coral.tint} />
          <Circle cx="192" cy="34" r="3" fill={colors.playful.violet.tint} />
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} viewBox="0 0 300 300" style={StyleSheet.absoluteFill}>
        <G transform="translate(-37.5 -42.5) scale(1.25)">
        <Rect x="87" y="145" width="126" height="98" rx="12" fill={colors.playful.violet.tint} />
        <Path d="M181 145H213V231Q213 243 201 243H181Z" fill={colors.playful.violet.tintDeep} />
        <Rect x="137" y="145" width="26" height="98" fill={colors.playful.coral.tint} />
        <Path d="M87 145H213V159H87Z" fill={colors.playful.violet.ink} opacity={0.15} />
        <Path d="M98 174V224Q98 232 106 232" fill="none" stroke={colors.playful.violet.soft} strokeWidth="5" strokeLinecap="round" />
        </G>
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, lidStyle]}>
        <Svg width={size} height={size} viewBox="0 0 300 300">
          <G transform="translate(-37.5 -42.5) scale(1.25)">
          <Path d="M82 132 99 117H201L218 132Z" fill={colors.playful.violet.soft} />
          <Rect x="79" y="132" width="142" height="24" rx="7" fill={colors.playful.violet.tint} />
          <Path d="M137 132 140 117H160L163 132V156H137Z" fill={colors.playful.coral.tint} />
          <Path d="M149 116C132 88 109 87 108 102 107 116 131 121 149 116Z" fill={colors.playful.coral.tint} stroke={colors.playful.coral.mid} strokeWidth="3" />
          <Path d="M151 116C168 88 191 87 192 102 193 116 169 121 151 116Z" fill={colors.playful.coral.tint} stroke={colors.playful.coral.mid} strokeWidth="3" />
          <Rect x="141" y="107" width="18" height="15" rx="6" fill={colors.playful.coral.mid} />
          </G>
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
