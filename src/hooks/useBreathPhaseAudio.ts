import { useCallback, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

type BreathAudioPhase = 'inhale' | 'exhale' | null;

const INHALE_AUDIO = require('../../assets/audio/breath-inhale-bell.m4a');
const EXHALE_AUDIO = require('../../assets/audio/breath-exhale-bowl.m4a');

const FADE_STEP_MS = 50;
const FADE_IN_MS = 450;
const FADE_OUT_MS = 550;
const INHALE_VOLUME = 0.24;
const EXHALE_VOLUME = 0.2;

function clearRamp(ref: MutableRefObject<ReturnType<typeof setInterval> | null>) {
  if (ref.current) {
    clearInterval(ref.current);
    ref.current = null;
  }
}

function stopImmediately(player: AudioPlayer) {
  player.pause();
  player.volume = 0;
  player.seekTo(0).catch(() => {});
}

export function useBreathPhaseAudio(phase: BreathAudioPhase) {
  const inhalePlayer = useAudioPlayer(INHALE_AUDIO, {
    updateInterval: 1000,
    keepAudioSessionActive: true,
  });
  const exhalePlayer = useAudioPlayer(EXHALE_AUDIO, {
    updateInterval: 1000,
    keepAudioSessionActive: true,
  });
  const inhaleRampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exhaleRampRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  useEffect(() => {
    inhalePlayer.loop = true;
    inhalePlayer.volume = 0;
    exhalePlayer.loop = true;
    exhalePlayer.volume = 0;
  }, [exhalePlayer, inhalePlayer]);

  const fadeOut = useCallback(
    (
      player: AudioPlayer,
      rampRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
    ) => {
      clearRamp(rampRef);
      const startVolume = player.volume;
      if (startVolume <= 0 || !player.playing) {
        stopImmediately(player);
        return;
      }

      const steps = Math.max(1, Math.ceil(FADE_OUT_MS / FADE_STEP_MS));
      let step = 0;
      rampRef.current = setInterval(() => {
        step += 1;
        const nextVolume = startVolume * (1 - step / steps);
        player.volume = Math.max(0, nextVolume);

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
      player.loop = true;
      player.volume = 0;
      player.seekTo(0).catch(() => {});
      player.play();

      const steps = Math.max(1, Math.ceil(FADE_IN_MS / FADE_STEP_MS));
      let step = 0;
      rampRef.current = setInterval(() => {
        step += 1;
        player.volume = Math.min(targetVolume, targetVolume * (step / steps));

        if (step >= steps) {
          clearRamp(rampRef);
        }
      }, FADE_STEP_MS);
    },
    [],
  );

  useEffect(() => {
    if (phase === 'inhale') {
      fadeOut(exhalePlayer, exhaleRampRef);
      fadeIn(inhalePlayer, inhaleRampRef, INHALE_VOLUME);
      return;
    }

    if (phase === 'exhale') {
      fadeOut(inhalePlayer, inhaleRampRef);
      fadeIn(exhalePlayer, exhaleRampRef, EXHALE_VOLUME);
      return;
    }

    fadeOut(inhalePlayer, inhaleRampRef);
    fadeOut(exhalePlayer, exhaleRampRef);
  }, [exhalePlayer, fadeIn, fadeOut, inhalePlayer, phase]);

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
