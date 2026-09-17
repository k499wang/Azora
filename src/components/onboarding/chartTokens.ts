import type { TextStyle, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { scaleVisual } from './onboardingVisualScale';

// Shared geometry for every onboarding chart so the plots occupy the same box
// on every screen in the flow. Change it here, not per screen.
export const chart = {
  height: scaleVisual(290),
  padLeft: 8,
  padRight: 8,
  padTop: 12,
  padBottom: 28,
  topInset: 10,
  axisWidth: 3,
  axisColor: colors.neutral[300],
  horizontalPadding: spacing.md,
  gap: spacing.md,
  // Chunky, rounded strokes — the onboarding charts are illustrations first and
  // data second, so they read heavier than a real analytics plot.
  lineWidth: scaleVisual(6),
  referenceWidth: scaleVisual(4),
  referenceDash: [9, 9],
  dotRadius: scaleVisual(7),
  dotHaloRadius: scaleVisual(11),
  fillOpacity: { top: '5c', bottom: '00' },
  /**
   * One colour for the series every onboarding chart is actually about, and one
   * muted colour for a comparison drawn beside it. A plot that picked its own
   * colour read as a different kind of chart, so the flow changed language every
   * time it showed one.
   */
  lineColor: colors.playful.sky.base,
  lineInk: colors.playful.sky.ink,
  referenceColor: colors.playful.stone.mid,
  referenceInk: colors.playful.stone.ink,
};

/**
 * How every onboarding chart draws itself in. One pace for all of them, so the
 * flow does not change speed from one plot to the next.
 */
export const chartReveal = {
  delayMs: 650,
  // Linear at the call site, because the x axis is time — an eased pen makes a
  // trace look like it speeds up mid-recording.
  durationMs: 2200,
};

export const chartText: {
  heading: TextStyle;
  note: TextStyle;
  tick: TextStyle;
  caption: TextStyle;
  axisLabel: TextStyle;
} = {
  heading: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text.primary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  tick: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  caption: {
    ...typography.body.small,
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  // Small grey line under the plot's own label — citations and study sources.
  note: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text.tertiary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  // Sits directly under the plot, pulled up into the canvas's bottom padding.
  axisLabel: {
    ...typography.body.small,
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: -spacing.md,
  },
};

/**
 * The column every chart sits in: its own label, the plot, and whatever lines
 * it prints underneath. Shared so the three charts cannot drift apart on the
 * spacing between those pieces.
 */
export const chartWrap: ViewStyle = {
  width: '100%',
  gap: chart.gap,
  marginTop: -spacing.xs,
  paddingHorizontal: chart.horizontalPadding,
};
