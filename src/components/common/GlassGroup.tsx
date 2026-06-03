import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassContainer } from 'expo-glass-effect';
import { useGlassMode } from '../../hooks/useGlassMode';

interface Props {
  children: ReactNode;
  // Distance at which sibling glass surfaces begin to merge/morph (iOS 26).
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}

// Wrap adjacent GlassSurface controls (e.g. a row of header buttons) so Liquid
// Glass blends them into one fluid shape. Off iOS 26 it is a plain layout View,
// so each child falls back independently.
export default function GlassGroup({ children, spacing, style }: Props) {
  const mode = useGlassMode();

  if (mode === 'liquid') {
    return (
      <GlassContainer spacing={spacing} style={style}>
        {children}
      </GlassContainer>
    );
  }

  return <View style={style}>{children}</View>;
}
