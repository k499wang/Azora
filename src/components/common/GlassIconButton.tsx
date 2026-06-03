import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import GlassSurface from './GlassSurface';

const SIZE = 36;

interface Props {
  children: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function GlassIconButton({ children, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.outer, pressed && styles.pressed, style]}
    >
      <GlassSurface variant="clear" radius={SIZE / 2} style={styles.surface}>
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
