import { StyleSheet, type ViewStyle } from 'react-native';
import { colors } from './colors';

export const card: {
  base: ViewStyle;
  paper: ViewStyle;
  block: ViewStyle;
  blockShadow: ViewStyle;
  well: ViewStyle;
  shadow: ViewStyle;
  shadowElevated: ViewStyle;
  glass: ViewStyle;
  glassTint: ViewStyle;
} = {
  base: {
    backgroundColor: colors.background.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  // Warm cream sheet for letter/note surfaces. Flatter corners + a soft, wide,
  // low-opacity shadow so it reads as paper lying on the canvas, not a UI card.
  paper: {
    backgroundColor: colors.background.paper,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  // Flat color-block tile: deep radius, no border, clips its decoration. Clips
  // its own shadow too, so pair it with `blockShadow` on a wrapper view.
  block: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  blockShadow: {
    borderRadius: 28,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  // Panel inset into a color block. Charts and gauges live here so their
  // zone/accent colors keep meaning instead of fighting the saturated fill.
  // Shape only — fill it with the block's own `playful.*.soft` tint so the
  // panel recedes into the card instead of punching a white hole in it.
  well: {
    borderRadius: 18,
  },
  shadow: {
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  // Diffuse ambient depth for premium surfaces — colorless, large radius.
  // Apply to a wrapper view (no overflow) when paired with `glass`.
  shadowElevated: {
    shadowColor: colors.glass.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  // Frosted pane: hairline white edge + clip. Put a <BlurView> behind content
  // and overlay `glassTint`. Clips its own shadow, so wrap with shadowElevated.
  glass: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.edge,
    overflow: 'hidden',
  },
  glassTint: {
    backgroundColor: colors.glass.fill,
  },
};
