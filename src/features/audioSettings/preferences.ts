import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExerciseDarkTheme } from '../../theme/exerciseDarkThemes';
import type { AudioCategoryId, AudioPreferences } from './types';
import {
  DEFAULT_AUDIO_PREFERENCES,
  isAudioThemeId,
  parseStoredAudioPreferences,
} from './audioPreferencesCore';

const STORAGE_KEY = 'settings:audio_v1';

let current: AudioPreferences = { ...DEFAULT_AUDIO_PREFERENCES };
let loaded = false;
const listeners = new Set<(prefs: AudioPreferences) => void>();

function emit() {
  for (const listener of listeners) listener(current);
}

export function getAudioPreferences(): AudioPreferences {
  return current;
}

export async function loadAudioPreferences(): Promise<AudioPreferences> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed = parseStoredAudioPreferences(raw);
  current = parsed.preferences;
  if (parsed.shouldPersist) {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
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
  if (!isAudioThemeId(themeId)) return;
  current = { ...current, themeId };
  emit();
  await persist();
}

export async function resetAudioPreferences(): Promise<void> {
  current = { ...DEFAULT_AUDIO_PREFERENCES };
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
