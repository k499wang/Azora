import { useEffect, useState } from 'react';
import type { AudioPlayer } from 'expo-audio';

function readLoaded(player: Pick<AudioPlayer, 'isLoaded'>): boolean {
  try {
    return player.isLoaded;
  } catch {
    // expo-audio can release the native shared object before React cleanup runs.
    return false;
  }
}

/** Subscribe before reading readiness so a fast native load cannot be missed. */
export function subscribeToAudioLoaded(
  player: Pick<AudioPlayer, 'isLoaded' | 'addListener'>,
  onLoaded: () => void,
): () => void {
  let subscription: { remove(): void } | null = null;
  let completed = false;
  const detach = () => {
    subscription?.remove();
    subscription = null;
  };
  const complete = () => {
    if (completed) return;
    completed = true;
    detach();
    onLoaded();
  };
  subscription = player.addListener('playbackStatusUpdate', (status) => {
    if (status.isLoaded) complete();
  });
  if (completed) detach();
  else if (readLoaded(player)) complete();

  return () => {
    completed = true;
    detach();
  };
}

/**
 * Whether a player's asset is ready, and nothing else.
 *
 * `useAudioPlayerStatus` hands back the whole status object and re-renders its
 * owner on every native update — four a second per player at our
 * `updateInterval`. The cue hooks are called from the session screens
 * themselves, so five of those subscriptions were re-rendering the entire
 * session UI, character and phase label included, to watch a boolean that
 * flips once per asset.
 *
 * Same subscription, one boolean. Setting it to the value it already holds is
 * a no-op in React, so a session that is not loading anything renders nothing.
 *
 * The subscription is also dropped the moment the asset is ready, and never
 * opened for a player with no source: a bundled asset does not unload once it
 * has loaded, so holding it open only keeps four status messages a second per
 * player crossing into JS for the rest of the session.
 */
export function useAudioLoaded(player: AudioPlayer, enabled = true): boolean {
  const [loaded, setLoaded] = useState(() => enabled && readLoaded(player));

  useEffect(() => {
    if (!enabled) {
      setLoaded(false);
      return;
    }
    if (readLoaded(player)) {
      setLoaded(true);
      return;
    }
    setLoaded(false);

    return subscribeToAudioLoaded(player, () => setLoaded(true));
  }, [enabled, loaded, player]);

  return loaded;
}
