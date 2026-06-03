import type { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { useGlassMode } from '../../hooks/useGlassMode';

type GlassVariant = 'regular' | 'clear';

interface Props {
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  interactive?: boolean;
  variant?: GlassVariant;
  colorScheme?: 'light' | 'dark';
  // Emit only the raw surface (no shadow wrapper, radius, or tint), so masked
  // and full-bleed callers control their own layout. Fallback fills below apply.
  bare?: boolean;
  pointerEvents?: ViewProps['pointerEvents'];
  tintColor?: string;
  blurTint?: BlurTint;
  blurIntensity?: number;
  blurColor?: string;
  solidColor?: string;
  // Downgrade liquid -> blur for this surface even where Liquid Glass is
  // available. For surfaces that must obscure content (locks) rather than act
  // as see-through chrome, or where liquid reads poorly over the backdrop.
  forceFallback?: boolean;
}

export default function GlassSurface({
  children,
  containerStyle,
  style,
  radius = 24,
  interactive = false,
  variant = 'regular',
  colorScheme = 'light',
  bare = false,
  pointerEvents,
  tintColor,
  blurTint,
  blurIntensity,
  blurColor,
  solidColor,
  forceFallback = false,
}: Props) {
  const resolvedMode = useGlassMode();
  const mode = forceFallback && resolvedMode === 'liquid' ? 'blur' : resolvedMode;
  const isClear = variant === 'clear';

  // Resolve every fallback knob once so `bare` and framed paths stay identical,
  // and so colorScheme is honored even when Liquid Glass is unavailable.
  const resolvedBlurTint: BlurTint =
    blurTint ?? (colorScheme === 'dark' ? 'dark' : 'light');
  const resolvedBlurIntensity = blurIntensity ?? (isClear ? 10 : 18);
  const resolvedBlurFill =
    blurColor ?? (isClear ? colors.glass.fillClear : colors.glass.fill);
  const resolvedSolid =
    solidColor ?? (colorScheme === 'dark' ? colors.glass.scrimDark : colors.glass.scrim);

  if (bare) {
    if (mode === 'liquid') {
      return (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle={variant}
          isInteractive={interactive}
          tintColor={tintColor}
          style={style}
          pointerEvents={pointerEvents}
        >
          {children}
        </GlassView>
      );
    }
    if (mode === 'solid') {
      return (
        <View
          style={[style, { backgroundColor: resolvedSolid }]}
          pointerEvents={pointerEvents}
        >
          {children}
        </View>
      );
    }
    return (
      <BlurView
        intensity={resolvedBlurIntensity}
        tint={resolvedBlurTint}
        experimentalBlurMethod="dimezisBlurView"
        style={[style, { backgroundColor: resolvedBlurFill }]}
        pointerEvents={pointerEvents}
      >
        {children}
      </BlurView>
    );
  }

  const shadow = [styles.shadow, { borderRadius: radius }, containerStyle];
  const pane = [styles.pane, { borderRadius: radius }, style];

  if (mode === 'liquid') {
    return (
      <View style={shadow}>
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle={variant}
          isInteractive={interactive}
          tintColor={tintColor}
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
        <View style={[pane, { backgroundColor: resolvedSolid }]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={shadow}>
      <View style={[pane, card.glass]}>
        <BlurView
          intensity={resolvedBlurIntensity}
          tint={resolvedBlurTint}
          experimentalBlurMethod="dimezisBlurView"
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: resolvedBlurFill }]}
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
});
