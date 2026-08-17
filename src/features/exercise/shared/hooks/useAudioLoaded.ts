import { useEffect, useState } from 'react';
import type { AudioPlayer } from 'expo-audio';

function readLoaded(player: AudioPlayer): boolean {
  try {
    return player.isLoaded;
  } catch {
    // expo-audio can release the native shared object before React cleanup runs.
    return false;
  }
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
 */
export function useAudioLoaded(player: AudioPlayer): boolean {
  const [loaded, setLoaded] = useState(() => readLoaded(player));

  useEffect(() => {
    setLoaded(readLoaded(player));
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      setLoaded(status.isLoaded);
    });
    return () => subscription.remove();
  }, [player]);

  return loaded;
}
