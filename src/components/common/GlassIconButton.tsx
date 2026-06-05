import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import GlassSurface from './GlassSurface';

const SIZE = 36;
const MUTED_SURFACE = {
  tintColor: 'rgba(203,213,225,0.20)',
  blurColor: 'rgba(241,245,249,0.50)',
  solidColor: colors.neutral[100],
};

interface Props {
  children: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'muted';
}

export default function GlassIconButton({ children, onPress, style, tone = 'default' }: Props) {
  const mutedSurface = tone === 'muted' ? MUTED_SURFACE : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.outer, pressed && styles.pressed, style]}
    >
      <GlassSurface
        variant="clear"
        radius={SIZE / 2}
        style={styles.surface}
        tintColor={mutedSurface?.tintColor}
        blurColor={mutedSurface?.blurColor}
        solidColor={mutedSurface?.solidColor}
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
});
