import { colors } from './colors';
import type { ExerciseDarkTheme } from './exerciseDarkThemes';

export interface HeartRateHelpPalette {
  sheet: string;
  statusSurface: string;
  title: string;
  detail: string;
  divider: string;
  markerSurface: string;
  markerText: string;
  buttonSurface: string;
  buttonText: string;
}

/** The subset the placement steps and illustration recolor themselves with. */
export type HeartRatePlacementPalette = Pick<
  HeartRateHelpPalette,
  'title' | 'detail' | 'divider' | 'markerSurface' | 'markerText'
>;

export const LIGHT_HEART_RATE_HELP_PALETTE: HeartRateHelpPalette = {
  sheet: colors.background.primary,
  statusSurface: colors.neutral[100],
  title: colors.text.primary,
  detail: colors.text.secondary,
  divider: colors.neutral[200],
  markerSurface: colors.primary.blue100,
  markerText: colors.primary.blue700,
  buttonSurface: colors.primary.blue600,
  buttonText: colors.text.inverse,
};

/**
 * Exercise sessions run full-bleed in the user's chosen theme, so the help
 * sheet borrows that theme rather than punching a white hole through it. The
 * sheet sits on `surface` and the status pill drops back to `screen`, which
 * keeps the pair separated in the light theme too.
 */
export function exerciseHeartRateHelpPalette(
  theme: ExerciseDarkTheme,
): HeartRateHelpPalette {
  return {
    sheet: theme.surface,
    statusSurface: theme.screen,
    title: theme.textPrimary,
    detail: theme.textSecondary,
    divider: theme.surfaceBorder,
    markerSurface: theme.surfaceBorder,
    markerText: theme.textAccent,
    buttonSurface: theme.textAccent,
    buttonText: theme.screen,
  };
}
