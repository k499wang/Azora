import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { audioMix } from '../features/audioSettings/audioMix';
import { getAudioOption } from '../features/audioSettings/registry';
import { useAudioPreferences } from '../features/audioSettings/useAudioPreferences';

interface UsePhaseChimeOptions {
  active: boolean;
}

type PhaseKey = 'inhale' | 'exhale';

const FADE_STEP_MS = 50;
const FADE_IN_MS = 450;
const PHASE_SWITCH_FADE_OUT_MS = 350;
const CUE_PLAY_RETRY_MS = 120;
const CUE_PLAY_RETRY_WINDOW_MS = 1200;
const CUE_PLAYER_OPTIONS = {
  updateInterval: 250,
  keepAudioSessionActive: true,
};

type RampRef = MutableRefObject<ReturnType<typeof setInterval> | null>;
type TimeoutRef = MutableRefObject<ReturnType<typeof setTimeout> | null>;

function safely(action: () => void) {
  try {
    action();
  } catch {
    // expo-audio can release the native shared object before React cleanup runs.
  }
}

function clearRamp(ref: RampRef) {
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

function readNumber(read: () => number, fallback = 0) {
  try {
    return read();
  } catch {
    return fallback;
  }
}

function readBool(read: () => boolean, fallback = false) {
  try {
    return read();
  } catch {
    return fallback;
  }
}

function stopImmediately(player: AudioPlayer) {
  safely(() => player.pause());
  safely(() => { player.volume = 0; });
  safely(() => { player.seekTo(0).catch(() => {}); });
}

function phaseKindOf(phase: string | null): PhaseKey | null {
  if (phase == null) return null;
  if (phase === 'preInhale' || phase === 'inhale') return 'inhale';
  if (phase === 'preExhale' || phase === 'exhale') return 'exhale';
  return null;
}

function isActiveAppState(state: AppStateStatus) {
  return state === 'active';
}

export function usePhaseChime(
  phase: string | null,
  { active }: UsePhaseChimeOptions,
) {
  const { preferences } = useAudioPreferences();
  const option = getAudioOption('chime', preferences.chime);
  const inhaleAsset = option?.phaseAssets?.inhale ?? option?.asset ?? null;
  const exhaleAsset = option?.phaseAssets?.exhale ?? option?.asset ?? null;

  const [appActive, setAppActive] = useState(() =>
    isActiveAppState(AppState.currentState),
  );

  const inhalePlayer = useAudioPlayer(inhaleAsset ?? null, CUE_PLAYER_OPTIONS);
  const exhalePlayer = useAudioPlayer(exhaleAsset ?? null, CUE_PLAYER_OPTIONS);
  const inhaleStatus = useAudioPlayerStatus(inhalePlayer);
  const exhaleStatus = useAudioPlayerStatus(exhalePlayer);

  const inhaleRampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exhaleRampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inhalePlayRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exhalePlayRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) =>
      setAppActive(isActiveAppState(s)),
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  useEffect(() => {
    safely(() => {
      inhalePlayer.loop = false;
      inhalePlayer.volume = 0;
      exhalePlayer.loop = false;
      exhalePlayer.volume = 0;
    });
  }, [exhalePlayer, inhalePlayer]);

  const fadeOut = useCallback(
    (
      player: AudioPlayer,
      rampRef: RampRef,
      playRetryRef: TimeoutRef,
      durationMs = PHASE_SWITCH_FADE_OUT_MS,
    ) => {
      clearRamp(rampRef);
      clearTimeoutRef(playRetryRef);
      const startVolume = readNumber(() => player.volume);
      const playing = readBool(() => player.playing);
      if (startVolume <= 0 || !playing) {
        stopImmediately(player);
        return;
      }
      const steps = Math.max(1, Math.ceil(durationMs / FADE_STEP_MS));
      let step = 0;
      rampRef.current = setInterval(() => {
        step += 1;
        const next = startVolume * (1 - step / steps);
        safely(() => { player.volume = Math.max(0, next); });
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
      rampRef: RampRef,
      playRetryRef: TimeoutRef,
      target: number,
    ) => {
      clearRamp(rampRef);
      clearTimeoutRef(playRetryRef);
      safely(() => { player.loop = false; player.volume = 0; });
      safely(() => { player.seekTo(0).catch(() => {}); });

      // Playback is gated on isLoaded, so the asset is ready here; this bounded
      // retry only covers the rare case where the first play() needs a nudge.
      const startedAt = Date.now();
      const tryPlay = () => {
        clearTimeoutRef(playRetryRef);
        safely(() => player.play());
        if (readBool(() => player.playing)) return;
        if (Date.now() - startedAt >= CUE_PLAY_RETRY_WINDOW_MS) return;
        playRetryRef.current = setTimeout(tryPlay, CUE_PLAY_RETRY_MS);
      };
      tryPlay();

      const steps = Math.max(1, Math.ceil(FADE_IN_MS / FADE_STEP_MS));
      let step = 0;
      rampRef.current = setInterval(() => {
        step += 1;
        safely(() => { player.volume = Math.min(target, target * (step / steps)); });
        if (step >= steps) clearRamp(rampRef);
      }, FADE_STEP_MS);
    },
    [],
  );

  const kind = phaseKindOf(phase);
  const phaseAssetReady =
    (kind === 'inhale' && inhaleAsset != null && inhaleStatus.isLoaded) ||
    (kind === 'exhale' && exhaleAsset != null && exhaleStatus.isLoaded);
  const shouldPlay = active && appActive && option != null && phaseAssetReady;
  const effectiveKind = shouldPlay ? kind : null;

  useEffect(() => {
    if (effectiveKind === 'inhale') {
      fadeOut(exhalePlayer, exhaleRampRef, exhalePlayRetryRef);
      fadeIn(inhalePlayer, inhaleRampRef, inhalePlayRetryRef, audioMix.chime.inhale);
      return;
    }
    if (effectiveKind === 'exhale') {
      fadeOut(inhalePlayer, inhaleRampRef, inhalePlayRetryRef);
      fadeIn(exhalePlayer, exhaleRampRef, exhalePlayRetryRef, audioMix.chime.exhale);
      return;
    }
    fadeOut(inhalePlayer, inhaleRampRef, inhalePlayRetryRef);
    fadeOut(exhalePlayer, exhaleRampRef, exhalePlayRetryRef);
  }, [effectiveKind, exhalePlayer, fadeIn, fadeOut, inhalePlayer]);

  useEffect(
    () => () => {
      clearRamp(inhaleRampRef);
      clearRamp(exhaleRampRef);
      clearTimeoutRef(inhalePlayRetryRef);
      clearTimeoutRef(exhalePlayRetryRef);
      stopImmediately(inhalePlayer);
      stopImmediately(exhalePlayer);
    },
    [exhalePlayer, inhalePlayer],
  );
}
