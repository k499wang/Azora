import { StyleSheet, type ViewStyle } from 'react-native';
import { colors } from './colors';

// Apple-style corner radius scale. Pair every radius with
// `borderCurve: 'continuous'` — the squircle curve is the native iOS
// treatment and is what makes surfaces read as Apple-designed rather than
// generic rounded rectangles.
/**
 * The ink line, in points, for the surfaces that carry one.
 *
 * The room, mascot, and the pieces of UI that belong to them use it with a
 * darker shade of their own fill. Saturated cards use their separate, heavier
 * line below; neutral cards stay borderless.
 *
 * Fixed rather than proportional: a tile is a fraction of the size of a room,
 * and a line that scaled with each would read as a different drawing on every
 * one of them.
 */
export const LINE = 1.25;
/** Saturated cards need a stronger edge than the finer room drawing. */
export const COLORED_CARD_LINE = 2;

type ColoredCardHue = {
  base: string;
  ink: `#${string}`;
};

/** Gives a saturated card a softened darker outline from its own color family. */
export function coloredCard(hue: ColoredCardHue): ViewStyle {
  return {
    backgroundColor: hue.base,
    borderColor: `${hue.ink}B3`,
    borderWidth: COLORED_CARD_LINE,
  };
}

export const radius = {
  xs: 8, // tiny chips, skeleton blocks
  small: 10, // paper, small cells
  medium: 12, // inputs, utility controls, dialog buttons
  card: 16, // standard cards and grouped cells
  hero: 20, // color-block heroes, glass panes
  // `large` is the spec name for the hero size; keep `hero` for back-compat.
  large: 20,
  sheet: 24, // large sheets / modals
  xl: 28, // reward cards, mascot bubbles, gamified containers
  full: 999, // pills, avatars, circular controls
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
  shadowModal: ViewStyle;
  shadowReward: ViewStyle;
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
  // Color-block shape: deep radius and clipped decoration. Add fill and its
  // own-color line with `coloredCard`; pair with `blockShadow` when it must lift.
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
  // Floating dialogs and centered sheets: strong enough to separate the layer
  // from the dimmed backdrop, still colorless and soft-edged.
  shadowModal: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  // Reward reveals and special collectible states may carry slightly more
  // dimensionality, but never a colored or neon glow.
  shadowReward: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
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
