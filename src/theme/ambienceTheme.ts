import type { ExerciseDarkTheme } from './exerciseDarkThemes';

/**
 * Per-theme tuning for the breathing background. Colors are not repeated here —
 * the wash borrows the theme's own accent so a new exercise theme picks up an
 * ambience automatically. Only the weights differ, because a glow that reads
 * correctly on a near-black screen is invisible on the light one.
 */
export interface AmbienceConfig {
  /** Wash alpha at full exhale and full inhale. */
  washOpacityExhaled: number;
  washOpacityInhaled: number;
  /** Wash radius at full exhale, as a fraction of its inhaled size. */
  washScaleExhaled: number;
  vignetteOpacity: number;
  /** Grain sits over everything to break up banding in the wash gradient. */
  grainOpacity: number;
  /** Drawn through a single Atlas call, so the count is close to free. */
  particleCount: number;
  particleOpacity: number;
  particleMinSize: number;
  particleMaxSize: number;
}

// The light theme cannot glow: added light does nothing against #F8FBFF, so its
// wash leans on a denser tint and it carries almost no vignette.
export const AMBIENCE_CONFIGS: Record<ExerciseDarkTheme['id'], AmbienceConfig> = {
  light: {
    washOpacityExhaled: 0.06,
    washOpacityInhaled: 0.16,
    washScaleExhaled: 0.62,
    vignetteOpacity: 0.05,
    grainOpacity: 0.015,
    // Denser and darker: specks on near-white need weight to register at all.
    particleCount: 150,
    particleOpacity: 0.3,
    particleMinSize: 2,
    particleMaxSize: 5,
  },
  slate: {
    washOpacityExhaled: 0.1,
    washOpacityInhaled: 0.26,
    washScaleExhaled: 0.58,
    vignetteOpacity: 0.45,
    grainOpacity: 0.03,
    particleCount: 170,
    particleOpacity: 0.55,
    particleMinSize: 2,
    particleMaxSize: 7,
  },
  stone: {
    washOpacityExhaled: 0.08,
    washOpacityInhaled: 0.2,
    washScaleExhaled: 0.58,
    vignetteOpacity: 0.45,
    grainOpacity: 0.03,
    particleCount: 170,
    particleOpacity: 0.5,
    particleMinSize: 2,
    particleMaxSize: 7,
  },
  sage: {
    washOpacityExhaled: 0.09,
    washOpacityInhaled: 0.22,
    washScaleExhaled: 0.58,
    vignetteOpacity: 0.45,
    grainOpacity: 0.03,
    particleCount: 170,
    particleOpacity: 0.52,
    particleMinSize: 2,
    particleMaxSize: 7,
  },
};

export function resolveAmbienceConfig(theme: ExerciseDarkTheme): AmbienceConfig {
  return AMBIENCE_CONFIGS[theme.id];
}
