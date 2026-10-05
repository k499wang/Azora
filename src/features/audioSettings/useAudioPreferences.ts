import { useCallback, useEffect, useState } from 'react';
import {
  getAudioPreferences,
  isAudioPreferencesLoaded,
  resetAudioPreferences,
  setAmbientVolume,
  setAudioSelection,
  setExerciseThemeId,
  setSoundEffectsEnabled,
  subscribeAudioPreferences,
} from './preferences';
import type { ExerciseDarkTheme } from '../../theme/exerciseDarkThemes';
import type { AudioCategoryId, AudioPreferences } from './types';

export function useAudioPreferences() {
  const [preferences, setPreferences] = useState<AudioPreferences>(
    getAudioPreferences,
  );
  const [loaded, setLoaded] = useState(isAudioPreferencesLoaded);

  useEffect(() => {
    setPreferences(getAudioPreferences());
    setLoaded(isAudioPreferencesLoaded());
    return subscribeAudioPreferences((next) => {
      setPreferences(next);
      setLoaded(isAudioPreferencesLoaded());
    });
  }, []);

  const select = useCallback(
    (category: AudioCategoryId, optionId: string | null) => {
      setAudioSelection(category, optionId).catch(() => {});
    },
    [],
  );

  const setVolume = useCallback((volume: number) => {
    setAmbientVolume(volume).catch(() => {});
  }, []);

  const setThemeId = useCallback((themeId: ExerciseDarkTheme['id']) => {
    setExerciseThemeId(themeId).catch(() => {});
  }, []);

  const reset = useCallback(() => {
    resetAudioPreferences().catch(() => {});
  }, []);

  const setSoundEffects = useCallback((enabled: boolean) => {
    setSoundEffectsEnabled(enabled).catch(() => {});
  }, []);

  return { preferences, loaded, select, setVolume, setThemeId, setSoundEffects, reset };
}
