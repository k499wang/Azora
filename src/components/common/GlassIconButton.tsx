import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { colors } from '../../theme/colors';

const canUseLiquidGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
const SIZE = 36;

interface Props {
  children: ReactNode;
  onPress: () => void;
  style?: object;
}

export default function GlassIconButton({ children, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.outer, pressed && styles.pressed, style]}
    >
      {canUseLiquidGlass ? (
        <GlassView
          colorScheme="light"
          glassEffectStyle="clear"
          style={styles.surface}
          tintColor="rgba(255,255,255,0.06)"
        >
          {children}
        </GlassView>
      ) : (
        <BlurView
          intensity={60}
          tint="systemUltraThinMaterialLight"
          style={[styles.surface, styles.fallback]}
        >
          {children}
        </BlurView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    shadowColor: colors.primary.blue700,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  surface: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  fallback: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
