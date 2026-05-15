import { useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { audioMix } from './audioMix';

export function useAudioPreview() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [previewingAsset, setPreviewingAsset] = useState<number | null>(null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  const stop = () => {
    const player = playerRef.current;
    if (player) {
      try {
        player.pause();
      } catch {}
      try {
        player.remove();
      } catch {}
      playerRef.current = null;
    }
    setPreviewingAsset(null);
  };

  const play = (asset: number) => {
    stop();
    try {
      const player = createAudioPlayer(asset);
      playerRef.current = player;
      setPreviewingAsset(asset);
      player.volume = audioMix.preview.volume;
      player.play();
    } catch {
      playerRef.current = null;
      setPreviewingAsset(null);
    }
  };

  useEffect(() => () => stop(), []);

  return { play, stop, previewingAsset };
}
