import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import GlassSurface from './GlassSurface';

const SIZE = 36;
const MUTED_SURFACE = {
  tintColor: 'transparent',
  blurColor: 'transparent',
  solidColor: 'transparent',
};

interface Props {
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'muted';
}

export default function GlassIconButton({
  children,
  disabled = false,
  onPress,
  style,
  tone = 'default',
}: Props) {
  const isMuted = tone === 'muted';
  const mutedSurface = isMuted ? MUTED_SURFACE : undefined;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.outer,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <GlassSurface
        variant="clear"
        radius={SIZE / 2}
        style={styles.surface}
        tintColor={mutedSurface?.tintColor}
        blurColor={mutedSurface?.blurColor}
        solidColor={mutedSurface?.solidColor}
        blurIntensity={isMuted ? 20 : undefined}
        forceFallback={isMuted}
      >
        {children}
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: SIZE,
    height: SIZE,
  },
  surface: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
