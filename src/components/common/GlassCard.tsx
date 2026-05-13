import type { ReactNode } from 'react';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BlurTint } from 'expo-blur';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

const defaultTint: BlurTint = Platform.OS === 'ios' ? 'systemUltraThinMaterialLight' : 'light';
const defaultBackgroundColor =
  Platform.OS === 'ios' ? `${colors.primary.blue600}66` : `${colors.primary.blue600}CC`;
const defaultLiquidGlassTintColor = `${colors.primary.blue600}57`;

interface GlassCardProps {
  children: ReactNode;
  backgroundColor?: string;
  colorScheme?: 'light' | 'dark' | 'system';
  contentStyle?: StyleProp<ViewStyle>;
  effect?: 'clear' | 'regular' | 'none';
  intensity?: number;
  interactive?: boolean;
  tintColor?: ColorValue;
  style?: StyleProp<ViewStyle>;
  tint?: BlurTint;
  useLiquidGlass?: boolean;
}

export default function GlassCard({
  backgroundColor = defaultBackgroundColor,
  children,
  colorScheme = 'light',
  contentStyle,
  effect = 'regular',
  intensity = Platform.OS === 'ios' ? 70 : 42,
  interactive = true,
  tintColor = defaultLiquidGlassTintColor,
  style,
  tint = defaultTint,
  useLiquidGlass = true,
}: GlassCardProps) {
  if (useLiquidGlass && isLiquidGlassSupported) {
    return (
      <LiquidGlassView
        colorScheme={colorScheme}
        effect={effect}
        interactive={interactive}
        style={[styles.card, style]}
        tintColor={tintColor}
      >
        <View pointerEvents="none" style={styles.highlight} />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </LiquidGlassView>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[styles.card, { backgroundColor }, style]}
    >
      <View pointerEvents="none" style={styles.highlight} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    padding: spacing.md,
    borderColor: 'rgba(255,255,255,0.44)',
    shadowColor: colors.primary.blue700,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    overflow: 'hidden',
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.58)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  content: {},
});
