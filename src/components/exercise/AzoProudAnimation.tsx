import { memo } from 'react';
import { Image } from 'expo-image';

const AZO_PROUD = require('../../../assets/animations/azo-proud.webp');
const ASPECT_RATIO = 516 / 540;

interface Props {
  width: number;
}

/**
 * Azo's "proud" loop, as an animated WebP rather than video: it keeps its
 * transparency on both platforms and needs no player.
 */
function AzoProudAnimation({ width }: Props) {
  return (
    <Image
      source={AZO_PROUD}
      style={{ width, aspectRatio: ASPECT_RATIO }}
      contentFit="contain"
      autoplay
      transition={0}
      accessibilityIgnoresInvertColors
    />
  );
}

export default memo(AzoProudAnimation);
