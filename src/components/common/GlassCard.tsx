import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import GlassSurface from './GlassSurface';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface GlassCardProps {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  interactive?: boolean;
  variant?: 'clear' | 'regular';
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function GlassCard({
  children,
  contentStyle,
  interactive = true,
  variant = 'regular',
  radius,
  style,
}: GlassCardProps) {
  return (
    <GlassSurface
      interactive={interactive}
      variant={variant}
      radius={radius}
      style={[styles.card, style]}
    >
      <View pointerEvents="none" style={styles.highlight} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderTopColor: colors.glass.edgeStrong,
  },
  content: {},
});
