import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { useGlassMode } from '../../hooks/useGlassMode';

type GlassVariant = 'regular' | 'clear';

interface Props {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  radius?: number;
  interactive?: boolean;
  variant?: GlassVariant;
}

export default function GlassSurface({
  children,
  style,
  radius = 24,
  interactive = false,
  variant = 'regular',
}: Props) {
  const mode = useGlassMode();
  const shadow = [styles.shadow, { borderRadius: radius }];
  const pane = [styles.pane, { borderRadius: radius }, style];

  if (mode === 'liquid') {
    return (
      <View style={shadow}>
        <GlassView
          glassEffectStyle={variant}
          isInteractive={interactive}
          style={pane}
        >
          {children}
        </GlassView>
      </View>
    );
  }

  if (mode === 'solid') {
    return (
      <View style={shadow}>
        <View style={[pane, styles.solid]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={shadow}>
      <View style={[pane, card.glass]}>
        <BlurView
          intensity={variant === 'clear' ? 10 : 18}
          tint="light"
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[StyleSheet.absoluteFill, styles.tint, variant === 'clear' && styles.tintClear]}
          pointerEvents="none"
        />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...card.shadowElevated,
    width: '100%',
  },
  pane: {
    width: '100%',
    overflow: 'hidden',
  },
  solid: {
    backgroundColor: colors.glass.scrim,
  },
  tint: {
    backgroundColor: colors.glass.fill,
  },
  tintClear: {
    backgroundColor: colors.glass.fillClear,
  },
});
