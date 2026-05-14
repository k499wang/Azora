import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { getAudioOption } from '../features/audioSettings/registry';
import { useAudioPreferences } from '../features/audioSettings/useAudioPreferences';

interface UseAmbientAudioOptions {
  active: boolean;
}

const FADE_STEP_MS = 50;
const FADE_IN_MS = 800;
const FADE_OUT_MS = 600;

function safely(action: () => void) {
  try {
    action();
  } catch {
    // expo-audio can release native resources before cleanup runs.
  }
}

export function useAmbientAudio({ active }: UseAmbientAudioOptions) {
  const { preferences } = useAudioPreferences();
  const option = useMemo(
    () => getAudioOption('ambient', preferences.ambient),
    [preferences.ambient],
  );
  const targetVolume = preferences.ambientVolume;

  const playerRef = useRef<AudioPlayer | null>(null);
  const rampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetVolumeRef = useRef(targetVolume);
  const [appActive, setAppActive] = useState(() => AppState.currentState === 'active');
  const effectiveActive = active && appActive;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    targetVolumeRef.current = targetVolume;
  }, [targetVolume]);

  useEffect(() => {
    const clearRamp = () => {
      if (rampRef.current) {
        clearInterval(rampRef.current);
        rampRef.current = null;
      }
    };

    const teardown = (immediate = false) => {
      clearRamp();
      const player = playerRef.current;
      if (!player) return;
      if (immediate) {
        safely(() => player.pause());
        safely(() => { player.volume = 0; });
        safely(() => player.remove());
        playerRef.current = null;
        return;
      }

      const startVolume = (() => {
        try { return player.volume; } catch { return 0; }
      })();
      if (startVolume <= 0) {
        safely(() => player.pause());
        safely(() => player.remove());
        playerRef.current = null;
        return;
      }
      const steps = Math.max(1, Math.ceil(FADE_OUT_MS / FADE_STEP_MS));
      let step = 0;
      rampRef.current = setInterval(() => {
        step += 1;
        safely(() => {
          player.volume = Math.max(0, startVolume * (1 - step / steps));
        });
        if (step >= steps) {
          clearRamp();
          safely(() => player.pause());
          safely(() => player.remove());
          playerRef.current = null;
        }
      }, FADE_STEP_MS);
    };

    if (!effectiveActive) {
      teardown(true);
      return;
    }

    if (option?.asset == null) {
      teardown();
      return;
    }

    clearRamp();
    safely(() => {
      if (playerRef.current) playerRef.current.remove();
    });
    const player = createAudioPlayer(option.asset);
    playerRef.current = player;
    safely(() => { player.loop = true; });
    safely(() => { player.volume = 0; });
    safely(() => { player.play(); });

    const steps = Math.max(1, Math.ceil(FADE_IN_MS / FADE_STEP_MS));
    let step = 0;
    rampRef.current = setInterval(() => {
      step += 1;
      safely(() => {
        const volume = Math.max(0, Math.min(1, targetVolumeRef.current));
        player.volume = Math.min(volume, volume * (step / steps));
      });
      if (step >= steps) {
        clearRamp();
      }
    }, FADE_STEP_MS);

    return () => {
      clearRamp();
      const p = playerRef.current;
      if (p) {
        safely(() => p.pause());
        safely(() => p.remove());
        playerRef.current = null;
      }
    };
  }, [effectiveActive, option]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    safely(() => {
      player.volume = Math.max(0, Math.min(1, targetVolume));
    });
  }, [targetVolume]);
}
