import { useCallback, useEffect, useState } from 'react';
import {
  getAudioPreferences,
  resetAudioPreferences,
  setAmbientVolume,
  setAudioSelection,
  subscribeAudioPreferences,
} from './preferences';
import type { AudioCategoryId, AudioPreferences } from './types';

export function useAudioPreferences() {
  const [preferences, setPreferences] = useState<AudioPreferences>(
    getAudioPreferences,
  );

  useEffect(() => {
    setPreferences(getAudioPreferences());
    return subscribeAudioPreferences(setPreferences);
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

  const reset = useCallback(() => {
    resetAudioPreferences().catch(() => {});
  }, []);

  return { preferences, select, setVolume, reset };
}
