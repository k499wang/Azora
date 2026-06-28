import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EXERCISE_DARK_THEMES,
  type ExerciseDarkTheme,
} from '../../theme/exerciseDarkThemes';
import type { AudioCategoryId, AudioPreferences } from './types';

const STORAGE_KEY = 'settings:audio_v1';

const DEFAULT_PREFERENCES: AudioPreferences = {
  voice:  null,
  ambient:  null,
  chime: 'singingBowl',
  ambientVolume: 0.5,
  themeId: EXERCISE_DARK_THEMES[0].id,
};

const VALID_THEME_IDS = new Set<ExerciseDarkTheme['id']>(
  EXERCISE_DARK_THEMES.map((t) => t.id),
);

let current: AudioPreferences = { ...DEFAULT_PREFERENCES };
let loaded = false;
const listeners = new Set<(prefs: AudioPreferences) => void>();

function emit() {
  for (const listener of listeners) listener(current);
}

function sanitize(raw: unknown): AudioPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFERENCES };
  const r = raw as Partial<AudioPreferences>;
  return {
    voice: typeof r.voice === 'string' || r.voice === null ? r.voice : null,
    ambient: typeof r.ambient === 'string' || r.ambient === null ? r.ambient : null,
    chime: typeof r.chime === 'string' || r.chime === null ? r.chime : null,
    ambientVolume:
      typeof r.ambientVolume === 'number' &&
      r.ambientVolume >= 0 &&
      r.ambientVolume <= 1
        ? r.ambientVolume
        : DEFAULT_PREFERENCES.ambientVolume,
    themeId:
      typeof r.themeId === 'string' &&
      VALID_THEME_IDS.has(r.themeId as ExerciseDarkTheme['id'])
        ? (r.themeId as ExerciseDarkTheme['id'])
        : DEFAULT_PREFERENCES.themeId,
  };
}

export function getAudioPreferences(): AudioPreferences {
  return current;
}

export async function loadAudioPreferences(): Promise<AudioPreferences> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw != null) {
    try {
      current = sanitize(JSON.parse(raw));
    } catch {
      current = { ...DEFAULT_PREFERENCES };
    }
  }
  loaded = true;
  emit();
  return current;
}

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export async function setAudioSelection(
  category: AudioCategoryId,
  optionId: string | null,
): Promise<void> {
  current = { ...current, [category]: optionId };
  emit();
  await persist();
}

export async function setAmbientVolume(volume: number): Promise<void> {
  const clamped = Math.max(0, Math.min(1, volume));
  current = { ...current, ambientVolume: clamped };
  emit();
  await persist();
}

export async function setExerciseThemeId(
  themeId: ExerciseDarkTheme['id'],
): Promise<void> {
  if (!VALID_THEME_IDS.has(themeId)) return;
  current = { ...current, themeId };
  emit();
  await persist();
}

export async function resetAudioPreferences(): Promise<void> {
  current = { ...DEFAULT_PREFERENCES };
  emit();
  await persist();
}

export function subscribeAudioPreferences(
  listener: (prefs: AudioPreferences) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isAudioPreferencesLoaded(): boolean {
  return loaded;
}

void loadAudioPreferences().catch(() => {});
