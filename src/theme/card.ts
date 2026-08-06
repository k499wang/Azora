import { StyleSheet, type ViewStyle } from 'react-native';
import { colors } from './colors';

// Apple-style corner radius scale. Pair every radius with
// `borderCurve: 'continuous'` — the squircle curve is the native iOS
// treatment and is what makes surfaces read as Apple-designed rather than
// generic rounded rectangles.
export const radius = {
  small: 10, // chips, small cells, paper
  card: 16, // standard cards and grouped cells
  hero: 20, // color-block heroes, glass panes
  sheet: 24, // large sheets / modals
} as const;

export const card: {
  base: ViewStyle;
  paper: ViewStyle;
  block: ViewStyle;
  blockShadow: ViewStyle;
  well: ViewStyle;
  shadow: ViewStyle;
  shadowElevated: ViewStyle;
  trayShadow: ViewStyle;
  glass: ViewStyle;
  glassTint: ViewStyle;
} = {
  // Elevated surface: borderless, like Apple's cards — depth comes from the
  // canvas contrast and shadow, never an outline.
  base: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  // Warm cream sheet for letter/note surfaces. Flatter corners + a soft, wide,
  // low-opacity shadow so it reads as paper lying on the canvas, not a UI card.
  paper: {
    backgroundColor: colors.background.paper,
    borderRadius: radius.small,
    borderCurve: 'continuous',
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
    borderRadius: radius.hero,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  // Diffuse, neutral depth for color blocks — Apple shadows are soft, low
  // opacity, and never colored. Apply to a wrapper view (no overflow).
  blockShadow: {
    borderRadius: radius.hero,
    borderCurve: 'continuous',
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  // Panel inset into a color block. Charts and gauges live here so their
  // zone/accent colors keep meaning instead of fighting the saturated fill.
  // Shape only — fill it with the block's own `playful.*.soft` tint so the
  // panel recedes into the card instead of punching a white hole in it.
  well: {
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  shadow: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
  // Bottom-docked action tray: shadow casts upward so the tray reads as
  // floating above the content scrolling beneath it.
  trayShadow: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  // Frosted pane: hairline white edge + clip. Put a <BlurView> behind content
  // and overlay `glassTint`. Clips its own shadow, so wrap with shadowElevated.
  glass: {
    borderRadius: radius.card,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.edge,
    overflow: 'hidden',
  },
  glassTint: {
    backgroundColor: colors.glass.fill,
  },
};
