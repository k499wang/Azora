import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { card } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import GlassSurface from './GlassSurface';
import {
  DEFAULT_CARD_SURFACE,
  type CardSurfaceMode,
} from './cardSurfaceConfig';

const CARD_SURFACE_RADIUS = 22;

const GLASS_CONTAINER_STYLE_KEYS = [
  'alignSelf',
  'aspectRatio',
  'bottom',
  'display',
  'end',
  'flex',
  'flexBasis',
  'flexGrow',
  'flexShrink',
  'height',
  'left',
  'margin',
  'marginBottom',
  'marginEnd',
  'marginHorizontal',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginTop',
  'marginVertical',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'position',
  'right',
  'start',
  'top',
  'width',
  'zIndex',
] as const satisfies ReadonlyArray<keyof ViewStyle>;

interface CardSurfaceProps {
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  locked?: boolean;
  interactive?: boolean;
  onPress?: () => void;
  variant?: 'regular' | 'clear';
  surface?: CardSurfaceMode;
}

export default function CardSurface({
  children,
  containerStyle,
  style,
  contentStyle,
  locked = false,
  interactive = false,
  onPress,
  variant = 'regular',
  surface = DEFAULT_CARD_SURFACE,
}: CardSurfaceProps) {
  const glassContainerStyle = getGlassContainerStyle(style);
  const content = contentStyle ? (
    <View style={contentStyle}>{children}</View>
  ) : (
    children
  );

  const surfaceNode =
    surface === 'glass' ? (
      <GlassSurface
        containerStyle={glassContainerStyle}
        interactive={interactive || onPress != null}
        variant={variant}
        radius={CARD_SURFACE_RADIUS}
        style={[styles.glassSurface, locked && styles.locked, style]}
      >
        {content}
      </GlassSurface>
    ) : (
      <View style={[styles.solidSurface, locked && styles.locked, style]}>
        {content}
      </View>
    );

  if (!onPress) {
    return containerStyle ? (
      <View style={containerStyle}>{surfaceNode}</View>
    ) : (
      surfaceNode
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
    >
      {surfaceNode}
    </Pressable>
  );
}

function getGlassContainerStyle(style: StyleProp<ViewStyle>): ViewStyle | undefined {
  const flattenedStyle = StyleSheet.flatten(style);
  if (!flattenedStyle) {
    return undefined;
  }

  const containerStyle: Record<string, unknown> = {};
  let hasContainerStyle = false;

  GLASS_CONTAINER_STYLE_KEYS.forEach((key) => {
    const value = flattenedStyle[key];
    if (value !== undefined) {
      containerStyle[key] = value;
      hasContainerStyle = true;
    }
  });

  return hasContainerStyle ? (containerStyle as ViewStyle) : undefined;
}

const styles = StyleSheet.create({
  glassSurface: {
    ...card.glass,
    ...card.glassTint,
    borderRadius: CARD_SURFACE_RADIUS,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  solidSurface: {
    ...card.base,
    ...card.shadow,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  locked: {
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
  },
});
