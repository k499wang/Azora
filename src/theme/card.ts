import { StyleSheet, type ViewStyle } from 'react-native';
import { colors } from './colors';

export const card: {
  base: ViewStyle;
  shadow: ViewStyle;
  shadowElevated: ViewStyle;
  glass: ViewStyle;
  glassTint: ViewStyle;
} = {
  base: {
    backgroundColor: colors.background.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
