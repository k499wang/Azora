import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import GlassSurface from './GlassSurface';
import { pressable } from '../../theme/pressable';
import { triggerTapHaptic } from '../../native/tapHaptics';

export const GLASS_ICON_BUTTON_SIZE = 36;

const MUTED_SURFACE = {
  tintColor: 'transparent',
  blurColor: 'transparent',
  solidColor: 'transparent',
};

interface Props {
  accessibilityLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'muted';
  // `regular` is Apple's default material for controls on ordinary backgrounds.
  // `clear` only holds up over media or a dimmed layer, so it stays opt-in.
  variant?: 'regular' | 'clear';
}

export default function GlassIconButton({
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
  size = GLASS_ICON_BUTTON_SIZE,
  style,
  tone = 'default',
  variant = 'clear',
}: Props) {
  const isMuted = tone === 'muted';
  const mutedSurface = isMuted ? MUTED_SURFACE : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        { width: size, height: size },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <GlassSurface
        variant={variant}
        interactive
        radius={size / 2}
        style={[styles.surface, { width: size, height: size }]}
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
  surface: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: pressable.control,
  disabled: pressable.disabled,
});
