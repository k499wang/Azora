import { memo, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  getBackgroundImageSource,
  loadBackgroundImage,
} from '../../services/images/backgroundImageCache';
import { AZO_POSES, type AzoAnimationProps, type AzoPose } from './azoPoses';

/**
 * Required here rather than in `azoPoses` so the Android WebPs stay out of the
 * iOS bundle, and these out of Android's. Both are 60fps with every frame
 * evenly spaced. The proud loop is four cycles long: the player hitches on its
 * seek back to the start, so that comes round every 8s rather than every 2s.
 */
const VIDEOS: Record<AzoPose, number> = {
  proud: require('../../../assets/animations/azo-proud.mov'),
  celebrate: require('../../../assets/animations/azo-celebrate.mov'),
};

const localVideoUris: Partial<Record<AzoPose, string>> = {};

/**
 * Decode the still and put the video on disk from the screen before. A dev
 * build otherwise streams the video from Metro while it plays, and stalls.
 */
export function preloadAzoPose(pose: AzoPose): void {
  void loadBackgroundImage(AZO_POSES[pose].poster).catch(() => {});
  if (localVideoUris[pose] != null) return;
  Asset.fromModule(VIDEOS[pose])
    .downloadAsync()
    .then((asset) => {
      if (asset.localUri != null) localVideoUris[pose] = asset.localUri;
    })
    .catch(() => {});
}

/**
 * HEVC with alpha, decoded in hardware — the animated WebP could not hold
 * 60fps. The predecoded still of frame 0 covers the player while it loads;
 * the video waits on that same frame until the still is gone, then plays, so
 * the handover cannot be seen.
 */
function AzoAnimation({ pose, width }: AzoAnimationProps) {
  const { aspectRatio, loop, poster } = AZO_POSES[pose];
  const [videoReady, setVideoReady] = useState(false);
  const [source] = useState(() => localVideoUris[pose] ?? VIDEOS[pose]);
  const player = useVideoPlayer(source, (instance) => {
    instance.muted = true;
    instance.audioMixingMode = 'mixWithOthers';
    instance.loop = loop;
  });

  useEffect(() => {
    if (videoReady) player.play();
  }, [player, videoReady]);

  const handleFirstFrame = useCallback(() => setVideoReady(true), []);

  return (
    <View style={{ width, aspectRatio }} pointerEvents="none">
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        allowsPictureInPicture={false}
        allowsVideoFrameAnalysis={false}
        onFirstFrameRender={handleFirstFrame}
      />
      {videoReady ? null : (
        <Image
          source={getBackgroundImageSource(poster)}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={0}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

export default memo(AzoAnimation);
