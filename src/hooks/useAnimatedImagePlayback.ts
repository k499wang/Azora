import { useCallback, useMemo } from 'react';
import type { Image } from 'expo-image';
import { useWhileVisible } from './useWhileVisible';

function setImagePlayback(image: Image, active: boolean) {
  try {
    void (active ? image.startAnimating() : image.stopAnimating()).catch(() => {});
  } catch {
    // The native image can already be detached when its owner closes.
  }
}

/** Plays a loaded local animation only while its owner is active and visible. */
export function useAnimatedImagePlayback(source: number | null, active = true) {
  // Each source owns its readiness, so an old load event cannot start its replacement.
  const playback = useMemo(() => ({
    image: null as Image | null,
    loaded: false,
    visible: false,
    playing: false,
  }), [source]);

  const start = useCallback(() => {
    if (!playback.visible || !playback.loaded || playback.playing || playback.image == null) return;
    playback.playing = true;
    setImagePlayback(playback.image, true);
  }, [playback]);

  const ref = useCallback((image: Image | null) => {
    if (playback.image != null) setImagePlayback(playback.image, false);
    playback.image = image;
    playback.loaded = false;
    playback.playing = false;
  }, [playback]);

  useWhileVisible(() => {
    playback.visible = active;
    start();
    return () => {
      playback.visible = false;
      playback.playing = false;
      if (playback.image != null) setImagePlayback(playback.image, false);
    };
  }, [active, playback, start]);

  const onLoad = useCallback(() => {
    if (playback.image == null) return;
    playback.loaded = true;
    start();
  }, [playback, start]);

  return { ref, onLoad };
}
