import { memo } from 'react';
import { Image } from 'expo-image';
import { AZO_POSES, type AzoAnimationProps, type AzoPose } from './azoPoses';

/** Android cannot decode HEVC alpha; animated WebP keeps the transparency. */
const IMAGES: Record<AzoPose, number> = {
  proud: require('../../../assets/animations/azo-proud.webp'),
  celebrate: require('../../../assets/animations/azo-celebrate.webp'),
};

/** Nothing to warm: the WebP is local and expo-image decodes it in place. */
export function preloadAzoPose(_pose: AzoPose): void {}

function AzoAnimation({ pose, width }: AzoAnimationProps) {
  return (
    <Image
      source={IMAGES[pose]}
      style={{ width, aspectRatio: AZO_POSES[pose].aspectRatio }}
      contentFit="contain"
      autoplay
      transition={0}
      accessibilityIgnoresInvertColors
    />
  );
}

export default memo(AzoAnimation);
