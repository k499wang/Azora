import {
  EXERCISE_DARK_THEMES,
  type ExerciseDarkTheme,
} from '../../theme/exerciseDarkThemes';
import type { AudioPreferences } from './types';

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  voice: null,
  ambient: null,
  ambientVolume: 0.5,
  themeId: EXERCISE_DARK_THEMES[0].id,
};

const VALID_THEME_IDS = new Set<ExerciseDarkTheme['id']>(
  EXERCISE_DARK_THEMES.map((theme) => theme.id),
);

interface ParsedAudioPreferences {
  preferences: AudioPreferences;
  shouldPersist: boolean;
}

export function isAudioThemeId(
  value: unknown,
): value is ExerciseDarkTheme['id'] {
  return (
    typeof value === 'string' &&
    VALID_THEME_IDS.has(value as ExerciseDarkTheme['id'])
  );
}

export function sanitizeAudioPreferences(raw: unknown): AudioPreferences {
  const preferences = isRecord(raw) ? raw : null;

  return {
    // Voice cues and background sound are always off and cannot be re-enabled.
    voice: null,
    ambient: null,
    ambientVolume:
      typeof preferences?.ambientVolume === 'number' &&
      Number.isFinite(preferences.ambientVolume) &&
      preferences.ambientVolume >= 0 &&
      preferences.ambientVolume <= 1
        ? preferences.ambientVolume
        : DEFAULT_AUDIO_PREFERENCES.ambientVolume,
    themeId: isAudioThemeId(preferences?.themeId)
      ? preferences.themeId
      : DEFAULT_AUDIO_PREFERENCES.themeId,
  };
}

export function parseStoredAudioPreferences(
  raw: string | null,
): ParsedAudioPreferences {
  if (raw == null) {
    return {
      preferences: { ...DEFAULT_AUDIO_PREFERENCES },
      shouldPersist: true,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      preferences: { ...DEFAULT_AUDIO_PREFERENCES },
      shouldPersist: true,
    };
  }

  const preferences = sanitizeAudioPreferences(parsed);
  return {
    preferences,
    shouldPersist:
      hasOwnLegacyChime(parsed) || !isCurrentAudioPreferences(parsed, preferences),
  };
}

function isCurrentAudioPreferences(
  raw: unknown,
  preferences: AudioPreferences,
): boolean {
  if (!isRecord(raw)) return false;

  return (
    raw.voice === preferences.voice &&
    raw.ambient === preferences.ambient &&
    raw.ambientVolume === preferences.ambientVolume &&
    raw.themeId === preferences.themeId
  );
}

function hasOwnLegacyChime(raw: unknown): boolean {
  return isRecord(raw) && Object.prototype.hasOwnProperty.call(raw, 'chime');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
