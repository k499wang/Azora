import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { getAudioPreferences, isAudioPreferencesLoaded } from '../features/audioSettings/preferences';
import { useAudioPreferences } from '../features/audioSettings/useAudioPreferences';
import { createCompletionSoundPlayback } from '../services/audio/completionSoundPlayback';
import { createNativeCompletionSoundPlayback } from '../services/audio/nativeCompletionSoundPlayback';
import { completionAudioNative, loadCompletionAudioUri } from '../native/completionAudio';
import { useAudioLoaded } from './useAudioLoaded';

const SOUNDS = {
  todo: require('../../assets/audio/effects/todo-complete.wav'),
  activity: require('../../assets/audio/effects/activity-complete.wav'),
  streak: require('../../assets/audio/effects/streak-continue.wav'),
  gift: require('../../assets/audio/effects/gift-open.wav'),
  place: require('../../assets/audio/effects/decoration-place.wav'),
  roomComplete: require('../../assets/audio/effects/room-complete.wav'),
  coinCount: require('../../assets/audio/effects/coin-count.wav'),
  cardPop: require('../../assets/audio/effects/card-pop.wav'),
  breathInhale: require('../../assets/audio/effects/breath-inhale.wav'),
  breathInhale2s: require('../../assets/audio/effects/breath-inhale-2s.wav'),
  breathInhale1s: require('../../assets/audio/effects/breath-inhale-1s.wav'),
  breathExhale: require('../../assets/audio/effects/breath-exhale.wav'),
  breathExhale2s: require('../../assets/audio/effects/breath-exhale-2s.wav'),
  breathExhale1s: require('../../assets/audio/effects/breath-exhale-1s.wav'),
  breathHold: require('../../assets/audio/effects/breath-hold.wav'),
  attentionSqueeze: require('../../assets/audio/effects/attention-squeeze.wav'),
  attentionRelease: require('../../assets/audio/effects/attention-release.wav'),
  attentionSense5: require('../../assets/audio/effects/attention-sense-5.wav'),
  attentionSense4: require('../../assets/audio/effects/attention-sense-4.wav'),
  attentionSense3: require('../../assets/audio/effects/attention-sense-3.wav'),
  attentionSense2: require('../../assets/audio/effects/attention-sense-2.wav'),
  attentionSense1: require('../../assets/audio/effects/attention-sense-1.wav'),
  pathTap: require('../../assets/audio/effects/path-tap.wav'),
  pathStamp: require('../../assets/audio/effects/path-stamp.wav'),
  pathUnlock: require('../../assets/audio/effects/path-unlock.wav'),
  pathGold: require('../../assets/audio/effects/path-gold.wav'),
};

function appAllowsPlayback(state: AppStateStatus | null) {
  // React Native may not yet know the initial state at startup.
  return state !== 'background' && state !== 'inactive';
}

type CompletionSoundKind = keyof typeof SOUNDS;

interface CompletionSoundOptions {
  autoPlay?: boolean;
  active?: boolean;
}

/** One player per owner; short cues never queue behind earlier taps. */
export function useCompletionSound(kind: CompletionSoundKind, options: CompletionSoundOptions = {}) {
  return useCompletionPlayback(kind, options).play;
}

export interface TimedCompletionSound {
  /** Sounds now, or not at all when the cue has not loaded: never late. */
  play: () => boolean;
  /** Whether waiting could still change what `play` does: false once loaded, or with sound off. */
  isLoading: () => boolean;
}

/** A cue timed to an animation, which is worse heard late than not heard. */
export function useTimedCompletionSound(kind: CompletionSoundKind): TimedCompletionSound {
  const { play, playback, canPlay } = useCompletionPlayback(kind, {});
  const isLoading = useCallback(
    () => !isAudioPreferencesLoaded() || (canPlay() && !playback.isPrimed()),
    [canPlay, playback],
  );
  const playNow = useCallback(() => playback.isPrimed() && play(), [play, playback]);
  return useMemo(() => ({ play: playNow, isLoading }), [playNow, isLoading]);
}

function useCompletionPlayback(
  kind: CompletionSoundKind,
  { autoPlay = false, active = true }: CompletionSoundOptions,
) {
  const focused = useIsFocused();
  const [appActive, setAppActive] = useState(() => appAllowsPlayback(AppState.currentState));
  const { preferences, loaded: preferencesLoaded } = useAudioPreferences();
  // Cache the small bundled WAV before playback rather than streaming a Metro
  // asset URL into AVPlayer during development.
  const player = useAudioPlayer(completionAudioNative == null ? SOUNDS[kind] : null, {
    downloadFirst: true,
    keepAudioSessionActive: false,
  });
  const expoLoaded = useAudioLoaded(player, completionAudioNative == null);
  const loaded = completionAudioNative != null || expoLoaded;
  const playedAutomatically = useRef(false);
  const playback = useMemo(() => {
    const configure = () => setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
    const report = (error: unknown) => {
      if (__DEV__) console.warn('Completion sound playback failed', error);
    };
    return completionAudioNative == null
      ? createCompletionSoundPlayback(player, configure, report)
      : createNativeCompletionSoundPlayback(
          completionAudioNative, () => loadCompletionAudioUri(SOUNDS[kind]), configure, report,
        );
  }, [kind, player]);

  useEffect(() => () => {
    if ('dispose' in playback && typeof playback.dispose === 'function') playback.dispose();
  }, [playback]);

  useEffect(() => {
    const updateActive = (state: AppStateStatus | null) => {
      const foreground = appAllowsPlayback(state);
      setAppActive(foreground);
      playback.setActive(active && focused && getAudioPreferences().soundEffects && foreground);
    };
    updateActive(AppState.currentState);
    const subscription = AppState.addEventListener('change', updateActive);
    return () => {
      subscription.remove();
      playback.setActive(false);
    };
  }, [active, focused, preferences.soundEffects, playback]);

  useEffect(() => {
    playback.setReady(loaded && preferencesLoaded);
  }, [loaded, preferencesLoaded, playback]);

  const canPlay = useCallback(
    () => active && focused && getAudioPreferences().soundEffects && appAllowsPlayback(AppState.currentState),
    [active, focused],
  );

  const play = useCallback(() => {
    if (!canPlay()) {
      playback.setActive(false);
      return false;
    }
    return playback.request();
  }, [canPlay, playback]);

  useEffect(() => {
    if (!autoPlay || !active || !focused || !appActive || !preferencesLoaded || playedAutomatically.current) return;
    playedAutomatically.current = play();
  }, [autoPlay, active, focused, appActive, preferencesLoaded, preferences.soundEffects, play]);

  return { play, playback, canPlay };
}
