import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { getAudioOption } from '../features/audioSettings/registry';
import { useAudioPreferences } from '../features/audioSettings/useAudioPreferences';

type BreathAudioPhase = 'inhale' | 'exhale' | null;

interface UseBreathPhaseAudioOptions {
  active?: boolean;
}

const DEFAULT_INHALE_AUDIO = require('../../assets/audio/chimes/inhale-bell.m4a');
const DEFAULT_EXHALE_AUDIO = require('../../assets/audio/chimes/exhale-bowl.m4a');

const FADE_STEP_MS = 50;
const FADE_IN_MS = 450;
const PHASE_SWITCH_FADE_OUT_MS = 350;
const HOLD_RELEASE_FADE_OUT_MS = 1400;
const INHALE_VOLUME = 0.5;
const EXHALE_VOLUME = 0.46;

function clearRamp(ref: MutableRefObject<ReturnType<typeof setInterval> | null>) {
  if (ref.current) {
    clearInterval(ref.current);
    ref.current = null;
  }
}

function safely(action: () => void) {
  try {
    action();
  } catch {
    // expo-audio can release the native shared object before React cleanup runs.
  }
}

function getPlayerNumber(read: () => number, fallback = 0) {
  try {
    return read();
  } catch {
    return fallback;
  }
}

function getPlayerBoolean(read: () => boolean, fallback = false) {
  try {
    return read();
  } catch {
    return fallback;
  }
}

function stopImmediately(player: AudioPlayer) {
  safely(() => {
    player.pause();
  });
  safely(() => {
    player.volume = 0;
  });
  safely(() => {
    player.seekTo(0).catch(() => {});
  });
}

function isActiveAppState(state: AppStateStatus) {
  return state === 'active';
}

export function useBreathPhaseAudio(
  phase: BreathAudioPhase,
  options: UseBreathPhaseAudioOptions = {},
) {
  const { active = true } = options;
  const { preferences } = useAudioPreferences();
  const voiceOption = getAudioOption('voice', preferences.voice);
  const hasVoice = voiceOption != null;
  const inhaleAsset =
    voiceOption?.phaseAssets?.inhale ?? voiceOption?.asset ?? DEFAULT_INHALE_AUDIO;
  const exhaleAsset =
    voiceOption?.phaseAssets?.exhale ?? voiceOption?.asset ?? DEFAULT_EXHALE_AUDIO;
  const [appActive, setAppActive] = useState(() =>
    isActiveAppState(AppState.currentState),
  );
  const inhalePlayer = useAudioPlayer(DEFAULT_INHALE_AUDIO, {
    updateInterval: 1000,
    keepAudioSessionActive: true,
  });
  const exhalePlayer = useAudioPlayer(DEFAULT_EXHALE_AUDIO, {
    updateInterval: 1000,
    keepAudioSessionActive: true,
  });

  useEffect(() => {
    safely(() => {
      inhalePlayer.replace(inhaleAsset);
    });
  }, [inhaleAsset, inhalePlayer]);

  useEffect(() => {
    safely(() => {
      exhalePlayer.replace(exhaleAsset);
    });
  }, [exhaleAsset, exhalePlayer]);
  const inhaleRampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exhaleRampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldPlayAudio = active && appActive && hasVoice;
  const effectivePhase = shouldPlayAudio ? phase : null;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppActive(isActiveAppState(nextState));
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  useEffect(() => {
    safely(() => {
      inhalePlayer.loop = true;
      inhalePlayer.volume = 0;
      exhalePlayer.loop = true;
      exhalePlayer.volume = 0;
    });
  }, [exhalePlayer, inhalePlayer]);

  const fadeOut = useCallback(
    (
      player: AudioPlayer,
      rampRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
      durationMs = PHASE_SWITCH_FADE_OUT_MS,
    ) => {
      clearRamp(rampRef);
      const startVolume = getPlayerNumber(() => player.volume);
      const isPlaying = getPlayerBoolean(() => player.playing);
      if (startVolume <= 0 || !isPlaying) {
        stopImmediately(player);
        return;
      }

      const steps = Math.max(1, Math.ceil(durationMs / FADE_STEP_MS));
      let step = 0;
      rampRef.current = setInterval(() => {
        step += 1;
        const nextVolume = startVolume * (1 - step / steps);
        safely(() => {
          player.volume = Math.max(0, nextVolume);
        });

        if (step >= steps) {
          clearRamp(rampRef);
          stopImmediately(player);
        }
      }, FADE_STEP_MS);
    },
    [],
  );

  const fadeIn = useCallback(
    (
      player: AudioPlayer,
      rampRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
      targetVolume: number,
    ) => {
      clearRamp(rampRef);
      safely(() => {
        player.loop = true;
        player.volume = 0;
      });
      safely(() => {
        player.seekTo(0).catch(() => {});
      });
      safely(() => {
        player.play();
      });

      const steps = Math.max(1, Math.ceil(FADE_IN_MS / FADE_STEP_MS));
      let step = 0;
      rampRef.current = setInterval(() => {
        step += 1;
        safely(() => {
          player.volume = Math.min(targetVolume, targetVolume * (step / steps));
        });

        if (step >= steps) {
          clearRamp(rampRef);
        }
      }, FADE_STEP_MS);
    },
    [],
  );

  useEffect(() => {
    if (effectivePhase === 'inhale') {
      fadeOut(exhalePlayer, exhaleRampRef);
      fadeIn(inhalePlayer, inhaleRampRef, INHALE_VOLUME);
      return;
    }

    if (effectivePhase === 'exhale') {
      fadeOut(inhalePlayer, inhaleRampRef);
      fadeIn(exhalePlayer, exhaleRampRef, EXHALE_VOLUME);
      return;
    }

    fadeOut(inhalePlayer, inhaleRampRef, HOLD_RELEASE_FADE_OUT_MS);
    fadeOut(exhalePlayer, exhaleRampRef, HOLD_RELEASE_FADE_OUT_MS);
  }, [effectivePhase, exhalePlayer, fadeIn, fadeOut, inhalePlayer]);

  useEffect(() => {
    if (shouldPlayAudio) return;

    clearRamp(inhaleRampRef);
    clearRamp(exhaleRampRef);
    stopImmediately(inhalePlayer);
    stopImmediately(exhalePlayer);
  }, [exhalePlayer, inhalePlayer, shouldPlayAudio]);

  useEffect(
    () => () => {
      clearRamp(inhaleRampRef);
      clearRamp(exhaleRampRef);
      stopImmediately(inhalePlayer);
      stopImmediately(exhalePlayer);
    },
    [exhalePlayer, inhalePlayer],
  );
}
