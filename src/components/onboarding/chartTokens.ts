import type { TextStyle, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { scaleVisual } from './onboardingVisualScale';

// Shared geometry for every onboarding chart so the plots occupy the same box
// on every screen in the flow. Change it here, not per screen.
/** how far each axis end stops short of the canvas edge, clear of its round cap */
const AXIS_END_INSET = scaleVisual(6);

export const chart = {
  height: scaleVisual(290),
  // Room outside the plot for the axes and the titles beside them.
  padLeft: 14,
  // The plot runs all the way to the end of the x axis.
  padRight: AXIS_END_INSET,
  padTop: 30,
  padBottom: 30,
  topInset: 10,
  // Rounded and soft — a frame, not a ruler.
  axisWidth: scaleVisual(3),
  axisColor: colors.neutral[400],
  axisTipInset: AXIS_END_INSET,
  horizontalPadding: spacing.md,
  gap: spacing.md,
  // Chunky, rounded strokes — the onboarding charts are illustrations first and
  // data second, so they read heavier than a real analytics plot.
  lineWidth: scaleVisual(6),
  gridWidth: 1.5,
  gridCount: 3,
  gridColor: colors.neutral[200],
  faceSize: scaleVisual(34),
  // The bubble chart: the series it is about as a filled area, and the
  // comparison as a line drawn over it.
  areaColor: colors.playful.sky.tint,
  comparisonColor: colors.playful.coral.base,
  // The milestone chart: one coloured line with ringed stops dropping to the x
  // axis, over a faint line for what happens without the exercise.
  milestone: {
    lineColor: colors.playful.teal.base,
    lineWidth: scaleVisual(4),
    comparisonColor: colors.neutral[300],
    comparisonWidth: 3,
    ringRadius: scaleVisual(7),
    ringWidth: 3,
    ringFill: colors.neutral[0],
    dropColor: colors.neutral[200],
    dropWidth: 2,
    endIconSize: scaleVisual(30),
    endIconColor: colors.playful.coral.base,
  },
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
  axisTitle: TextStyle;
  tick: TextStyle;
  bubble: TextStyle;
  milestone: TextStyle;
} = {
  axisTitle: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  tick: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  bubble: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  milestone: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text.primary,
  },
};

/**
 * The column every chart sits in: the plot and whatever lines it prints
 * underneath. Shared so the charts cannot drift apart on the spacing between
 * those pieces.
 */
export const chartWrap: ViewStyle = {
  width: '100%',
  gap: chart.gap,
  marginTop: -spacing.xs,
  paddingHorizontal: chart.horizontalPadding,
};
