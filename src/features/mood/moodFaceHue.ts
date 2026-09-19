/**
 * A colour for each point of the check-in's scale.
 *
 * A journey through the palette rather than a red-to-green ramp: deep to
 * bright reads as a scale without colouring one end of somebody's week as a
 * failure. A rough day is not an error state.
 *
 * Shared, because a face means the same thing wherever it is drawn — the
 * month grid on the profile and the axis of the mood chart are the same five
 * answers, and two ramps would make them look like two scales.
 */
import type { MoodLevel } from './domain/moodCheckIn';
import { colors } from '../../theme/colors';

export interface MoodFaceHue {
  /** Behind the face, where it sits on a fill. */
  fill: string;
  /** The face itself, on that fill. */
  ink: string;
  /** The face with nothing behind it. */
  bare: string;
}

export const MOOD_FACE_HUE: Record<MoodLevel, MoodFaceHue> = {
  1: {
    fill: colors.playful.night.tintDeep,
    ink: colors.playful.night.ink,
    bare: colors.playful.night.base,
  },
  2: {
    fill: colors.playful.violet.tint,
    ink: colors.playful.violet.ink,
    bare: colors.playful.violet.base,
  },
  3: {
    fill: colors.playful.sky.tint,
    ink: colors.playful.sky.ink,
    bare: colors.playful.sky.base,
  },
  4: {
    fill: colors.playful.teal.tint,
    ink: colors.playful.teal.ink,
    bare: colors.playful.teal.base,
  },
  5: {
    fill: colors.playful.amber.tint,
    ink: colors.playful.amber.ink,
    bare: colors.playful.amber.base,
  },
};
