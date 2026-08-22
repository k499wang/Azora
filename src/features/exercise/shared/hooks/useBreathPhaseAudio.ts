import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { AudioPlayer, AudioSource } from 'expo-audio';
import { audioMix } from '../../../audioSettings/audioMix';
import { getAudioOption } from '../../../audioSettings/registry';
import { useAudioPreferences } from '../../../audioSettings/useAudioPreferences';
import { useAudioLoaded } from './useAudioLoaded';

type BreathAudioPhase = 'inhale' | 'exhale' | 'hold' | null;

interface UseBreathPhaseAudioOptions {
  active?: boolean;
}

const FADE_STEP_MS = 50;
const FADE_IN_MS = 450;
const PHASE_SWITCH_FADE_OUT_MS = 350;
const HOLD_RELEASE_FADE_OUT_MS = 1400;
const CUE_PLAY_RETRY_MS = 120;
const CUE_PLAY_RETRY_WINDOW_MS = 1200;
const CUE_PREWARM_STOP_MS = 80;
const CUE_PLAYER_OPTIONS = {
  updateInterval: 250,
  keepAudioSessionActive: true,
};

type TimerRef = MutableRefObject<ReturnType<typeof setInterval> | null>;
type TimeoutRef = MutableRefObject<ReturnType<typeof setTimeout> | null>;

function clearRamp(ref: MutableRefObject<ReturnType<typeof setInterval> | null>) {
  if (ref.current) {
    clearInterval(ref.current);
    ref.current = null;
  }
}

function clearTimeoutRef(ref: TimeoutRef) {
  if (ref.current) {
    clearTimeout(ref.current);
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

function prewarmPlayer(player: AudioPlayer, stopRef: TimeoutRef) {
  clearTimeoutRef(stopRef);
  safely(() => {
    player.loop = false;
    player.volume = 0;
  });
  safely(() => {
    player.seekTo(0).catch(() => {});
  });
  safely(() => {
    player.play();
  });

  stopRef.current = setTimeout(() => {
    clearTimeoutRef(stopRef);
    stopImmediately(player);
  }, CUE_PREWARM_STOP_MS);
}

function isActiveAppState(state: AppStateStatus) {
  return state === 'active';
}

function hasPhaseAsset(
  phase: BreathAudioPhase,
  inhaleAsset: AudioSource,
  exhaleAsset: AudioSource,
  holdAsset: AudioSource,
) {
  return (
    (phase === 'inhale' && inhaleAsset != null) ||
    (phase === 'exhale' && exhaleAsset != null) ||
    (phase === 'hold' && holdAsset != null)
  );
}

export function useBreathPhaseAudio(
  phase: BreathAudioPhase,
  options: UseBreathPhaseAudioOptions = {},
) {
  const { active = true } = options;
  const { preferences } = useAudioPreferences();
  const voiceOption = getAudioOption('voice', preferences.voice);
  // Voice cues must not fall back to chime assets; chimes are owned by usePhaseChime.
  const inhaleAsset =
    voiceOption?.phaseAssets?.inhale ?? voiceOption?.asset ?? null;
  const exhaleAsset =
    voiceOption?.phaseAssets?.exhale ?? voiceOption?.asset ?? null;
  const holdAsset =
    voiceOption?.phaseAssets?.hold ?? voiceOption?.asset ?? null;
  const [appActive, setAppActive] = useState(() =>
    isActiveAppState(AppState.currentState),
  );
  // Voice cues are off by default, and then none of the machinery below has
  // anything to drive: no status to watch, no app-state to track, and no
  // players to stop and rewind on every phase change.
  const hasVoiceCues =
    inhaleAsset != null || exhaleAsset != null || holdAsset != null;
  const inhalePlayer = useAudioPlayer(inhaleAsset ?? null, CUE_PLAYER_OPTIONS);
  const exhalePlayer = useAudioPlayer(exhaleAsset ?? null, CUE_PLAYER_OPTIONS);
  const holdPlayer = useAudioPlayer(holdAsset ?? null, CUE_PLAYER_OPTIONS);
  const inhaleLoaded = useAudioLoaded(inhalePlayer, inhaleAsset != null);
  const exhaleLoaded = useAudioLoaded(exhalePlayer, exhaleAsset != null);
  const holdLoaded = useAudioLoaded(holdPlayer, holdAsset != null);
  const inhaleRampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exhaleRampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdRampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inhalePlayRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exhalePlayRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdPlayRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prewarmedPlayerIdsRef = useRef({
    inhale: null as number | null,
    exhale: null as number | null,
    hold: null as number | null,
  });

  useEffect(() => {
    if (!hasVoiceCues) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppActive(isActiveAppState(nextState));
    });

    return () => subscription.remove();
  }, [hasVoiceCues]);

  useEffect(() => {
    if (!hasVoiceCues) return;

    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, [hasVoiceCues]);

  useEffect(() => {
    if (!hasVoiceCues) return;

    safely(() => {
      inhalePlayer.loop = false;
      inhalePlayer.volume = 0;
      exhalePlayer.loop = false;
      exhalePlayer.volume = 0;
      holdPlayer.loop = false;
      holdPlayer.volume = 0;
    });
  }, [exhalePlayer, hasVoiceCues, holdPlayer, inhalePlayer]);

  const fadeOut = useCallback(
    (
      player: AudioPlayer,
      rampRef: TimerRef,
      playRetryRef: TimeoutRef,
      durationMs = PHASE_SWITCH_FADE_OUT_MS,
    ) => {
      clearRamp(rampRef);
      clearTimeoutRef(playRetryRef);
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
      rampRef: TimerRef,
      playRetryRef: TimeoutRef,
      targetVolume: number,
    ) => {
      clearRamp(rampRef);
      clearTimeoutRef(playRetryRef);
      safely(() => {
        player.loop = false;
        player.volume = 0;
      });
      safely(() => {
        player.seekTo(0).catch(() => {});
      });

      const startedAt = Date.now();
      const tryPlay = () => {
        clearTimeoutRef(playRetryRef);
        safely(() => {
          player.play();
        });
        if (getPlayerBoolean(() => player.playing)) return;
        if (Date.now() - startedAt >= CUE_PLAY_RETRY_WINDOW_MS) return;
        playRetryRef.current = setTimeout(() => {
          tryPlay();
        }, CUE_PLAY_RETRY_MS);
      };
      tryPlay();

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

  const phaseHasAsset = hasPhaseAsset(phase, inhaleAsset, exhaleAsset, holdAsset);
  const phaseLoaded =
    (phase === 'inhale' && inhaleLoaded) ||
    (phase === 'exhale' && exhaleLoaded) ||
    (phase === 'hold' && holdLoaded);
  const shouldPlayAudio = active && appActive && phaseHasAsset && phaseLoaded;
  const waitingForPhaseAudio =
    active && appActive && phaseHasAsset && !phaseLoaded;
  const effectivePhase = shouldPlayAudio ? phase : null;

  useEffect(() => {
    if (!hasVoiceCues) return;
    if (!appActive || shouldPlayAudio || waitingForPhaseAudio) return;

    if (
      inhaleAsset != null &&
      inhaleLoaded &&
      prewarmedPlayerIdsRef.current.inhale !== inhalePlayer.id
    ) {
      prewarmedPlayerIdsRef.current.inhale = inhalePlayer.id;
      prewarmPlayer(inhalePlayer, inhalePlayRetryRef);
    }

    if (
      exhaleAsset != null &&
      exhaleLoaded &&
      prewarmedPlayerIdsRef.current.exhale !== exhalePlayer.id
    ) {
      prewarmedPlayerIdsRef.current.exhale = exhalePlayer.id;
      prewarmPlayer(exhalePlayer, exhalePlayRetryRef);
    }

    if (
      holdAsset != null &&
      holdLoaded &&
      prewarmedPlayerIdsRef.current.hold !== holdPlayer.id
    ) {
      prewarmedPlayerIdsRef.current.hold = holdPlayer.id;
      prewarmPlayer(holdPlayer, holdPlayRetryRef);
    }
  }, [
    appActive,
    exhaleAsset,
    exhalePlayer,
    exhaleLoaded,
    holdAsset,
    holdPlayer,
    hasVoiceCues,
    holdLoaded,
    inhaleAsset,
    inhalePlayer,
    inhaleLoaded,
    shouldPlayAudio,
    waitingForPhaseAudio,
  ]);

  useEffect(() => {
    if (!hasVoiceCues) return;

    if (waitingForPhaseAudio) {
      if (phase === 'inhale') {
        fadeOut(exhalePlayer, exhaleRampRef, exhalePlayRetryRef);
        fadeOut(holdPlayer, holdRampRef, holdPlayRetryRef);
        clearRamp(inhaleRampRef);
        clearTimeoutRef(inhalePlayRetryRef);
        safely(() => {
          inhalePlayer.volume = 0;
        });
        return;
      }

      if (phase === 'exhale') {
        fadeOut(inhalePlayer, inhaleRampRef, inhalePlayRetryRef);
        fadeOut(holdPlayer, holdRampRef, holdPlayRetryRef);
        clearRamp(exhaleRampRef);
        clearTimeoutRef(exhalePlayRetryRef);
        safely(() => {
          exhalePlayer.volume = 0;
        });
        return;
      }

      if (phase === 'hold') {
        fadeOut(inhalePlayer, inhaleRampRef, inhalePlayRetryRef);
        fadeOut(exhalePlayer, exhaleRampRef, exhalePlayRetryRef);
        clearRamp(holdRampRef);
        clearTimeoutRef(holdPlayRetryRef);
        safely(() => {
          holdPlayer.volume = 0;
        });
        return;
      }
    }

    if (effectivePhase === 'inhale') {
      fadeOut(exhalePlayer, exhaleRampRef, exhalePlayRetryRef);
      fadeOut(holdPlayer, holdRampRef, holdPlayRetryRef);
      fadeIn(inhalePlayer, inhaleRampRef, inhalePlayRetryRef, audioMix.voice.inhale);
      return;
    }

    if (effectivePhase === 'exhale') {
      fadeOut(inhalePlayer, inhaleRampRef, inhalePlayRetryRef);
      fadeOut(holdPlayer, holdRampRef, holdPlayRetryRef);
      fadeIn(exhalePlayer, exhaleRampRef, exhalePlayRetryRef, audioMix.voice.exhale);
      return;
    }

    if (effectivePhase === 'hold') {
      fadeOut(inhalePlayer, inhaleRampRef, inhalePlayRetryRef);
      fadeOut(exhalePlayer, exhaleRampRef, exhalePlayRetryRef);
      fadeIn(holdPlayer, holdRampRef, holdPlayRetryRef, audioMix.voice.hold);
      return;
    }

    fadeOut(inhalePlayer, inhaleRampRef, inhalePlayRetryRef, HOLD_RELEASE_FADE_OUT_MS);
    fadeOut(exhalePlayer, exhaleRampRef, exhalePlayRetryRef, HOLD_RELEASE_FADE_OUT_MS);
    fadeOut(holdPlayer, holdRampRef, holdPlayRetryRef, HOLD_RELEASE_FADE_OUT_MS);
  }, [
    effectivePhase,
    exhalePlayer,
    fadeIn,
    fadeOut,
    hasVoiceCues,
    holdPlayer,
    inhalePlayer,
    phase,
    waitingForPhaseAudio,
  ]);

  useEffect(() => {
    if (!hasVoiceCues) return;
    if (shouldPlayAudio || waitingForPhaseAudio) return;

    clearRamp(inhaleRampRef);
    clearRamp(exhaleRampRef);
    clearRamp(holdRampRef);
    clearTimeoutRef(inhalePlayRetryRef);
    clearTimeoutRef(exhalePlayRetryRef);
    clearTimeoutRef(holdPlayRetryRef);
    stopImmediately(inhalePlayer);
    stopImmediately(exhalePlayer);
    stopImmediately(holdPlayer);
  }, [
    exhalePlayer,
    hasVoiceCues,
    holdPlayer,
    inhalePlayer,
    shouldPlayAudio,
    waitingForPhaseAudio,
  ]);

  useEffect(
    () => () => {
      clearRamp(inhaleRampRef);
      clearRamp(exhaleRampRef);
      clearRamp(holdRampRef);
      clearTimeoutRef(inhalePlayRetryRef);
      clearTimeoutRef(exhalePlayRetryRef);
      clearTimeoutRef(holdPlayRetryRef);
      stopImmediately(inhalePlayer);
      stopImmediately(exhalePlayer);
      stopImmediately(holdPlayer);
    },
    [exhalePlayer, holdPlayer, inhalePlayer],
  );
}
