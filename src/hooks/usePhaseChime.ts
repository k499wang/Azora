import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { getAudioOption } from '../features/audioSettings/registry';
import { useAudioPreferences } from '../features/audioSettings/useAudioPreferences';

interface UsePhaseChimeOptions {
  active: boolean;
}

type PhaseKey = 'inhale' | 'exhale';

const FADE_STEP_MS = 50;
const FADE_IN_MS = 450;
const PHASE_SWITCH_FADE_OUT_MS = 350;
const INHALE_VOLUME = 0.6;
const EXHALE_VOLUME = 0.55;

function safely(action: () => void) {
  try {
    action();
  } catch {}
}

function clearRamp(ref: MutableRefObject<ReturnType<typeof setInterval> | null>) {
  if (ref.current) {
    clearInterval(ref.current);
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

function releasePlayer(player: AudioPlayer) {
  stopImmediately(player);
  safely(() => player.remove());
}

function phaseKindOf(phase: string | null): PhaseKey | null {
  if (phase == null) return null;
  if (phase === 'preInhale' || phase === 'inhale') return 'inhale';
  if (phase === 'preExhale' || phase === 'exhale') return 'exhale';
  return null;
}

export function usePhaseChime(
  phase: string | null,
  { active }: UsePhaseChimeOptions,
) {
  const { preferences } = useAudioPreferences();
  const option = getAudioOption('chime', preferences.chime);
  const inhaleAsset = option?.phaseAssets?.inhale ?? option?.asset ?? null;
  const exhaleAsset = option?.phaseAssets?.exhale ?? option?.asset ?? null;

  const inhalePlayerRef = useRef<AudioPlayer | null>(null);
  const exhalePlayerRef = useRef<AudioPlayer | null>(null);
  const inhaleRampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exhaleRampRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [appActive, setAppActive] = useState(() => AppState.currentState === 'active');

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    clearRamp(inhaleRampRef);
    const prev = inhalePlayerRef.current;
    if (prev) releasePlayer(prev);
    inhalePlayerRef.current = null;
    if (inhaleAsset != null) {
      const p = createAudioPlayer(inhaleAsset);
      safely(() => { p.loop = false; p.volume = 0; });
      inhalePlayerRef.current = p;
    }
    return () => {
      const cur = inhalePlayerRef.current;
      if (cur) releasePlayer(cur);
      inhalePlayerRef.current = null;
    };
  }, [inhaleAsset]);

  useEffect(() => {
    clearRamp(exhaleRampRef);
    const prev = exhalePlayerRef.current;
    if (prev) releasePlayer(prev);
    exhalePlayerRef.current = null;
    if (exhaleAsset != null) {
      const p = createAudioPlayer(exhaleAsset);
      safely(() => { p.loop = false; p.volume = 0; });
      exhalePlayerRef.current = p;
    }
    return () => {
      const cur = exhalePlayerRef.current;
      if (cur) releasePlayer(cur);
      exhalePlayerRef.current = null;
    };
  }, [exhaleAsset]);

  const fadeOut = useCallback(
    (
      player: AudioPlayer | null,
      rampRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
      durationMs = PHASE_SWITCH_FADE_OUT_MS,
    ) => {
      if (!player) return;
      clearRamp(rampRef);
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
      player: AudioPlayer | null,
      rampRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
      target: number,
    ) => {
      if (!player) return;
      clearRamp(rampRef);
      safely(() => { player.loop = false; player.volume = 0; });
      safely(() => { player.seekTo(0).catch(() => {}); });
      safely(() => player.play());
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

  const shouldPlay = active && appActive && option != null;
  const kind = shouldPlay ? phaseKindOf(phase) : null;

  useEffect(() => {
    if (kind === 'inhale') {
      fadeOut(exhalePlayerRef.current, exhaleRampRef);
      fadeIn(inhalePlayerRef.current, inhaleRampRef, INHALE_VOLUME);
      return;
    }
    if (kind === 'exhale') {
      fadeOut(inhalePlayerRef.current, inhaleRampRef);
      fadeIn(exhalePlayerRef.current, exhaleRampRef, EXHALE_VOLUME);
      return;
    }
    fadeOut(inhalePlayerRef.current, inhaleRampRef, PHASE_SWITCH_FADE_OUT_MS);
    fadeOut(exhalePlayerRef.current, exhaleRampRef, PHASE_SWITCH_FADE_OUT_MS);
  }, [kind, fadeIn, fadeOut]);

  useEffect(() => {
    if (shouldPlay) return;
    fadeOut(inhalePlayerRef.current, inhaleRampRef, PHASE_SWITCH_FADE_OUT_MS);
    fadeOut(exhalePlayerRef.current, exhaleRampRef, PHASE_SWITCH_FADE_OUT_MS);
  }, [shouldPlay, fadeOut]);

  useEffect(
    () => () => {
      clearRamp(inhaleRampRef);
      clearRamp(exhaleRampRef);
      const i = inhalePlayerRef.current;
      const e = exhalePlayerRef.current;
      if (i) releasePlayer(i);
      if (e) releasePlayer(e);
      inhalePlayerRef.current = null;
      exhalePlayerRef.current = null;
    },
    [],
  );
}
