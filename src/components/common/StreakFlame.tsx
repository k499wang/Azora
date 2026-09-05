import { memo } from 'react';
import { Image } from 'expo-image';
import { getBackgroundImageSource } from '../../services/images/backgroundImageCache';

interface Props {
  size: number;
}

/**
 * The streak flame.
 *
 * The art is a local square PNG with its own gradient and contact shadow. It
 * reuses a retained decode when another flow has already warmed it, without
 * delaying app startup for an image used only by this celebration.
 * `transition={0}` avoids adding a second entrance over the sheet choreography.
 */
function StreakFlame({ size }: Props) {
  return (
    <Image
      source={getBackgroundImageSource('streakFlame')}
      style={{ width: size, height: size }}
      contentFit="contain"
      transition={0}
      cachePolicy="memory-disk"
      accessibilityIgnoresInvertColors
    />
  );
}

export default memo(StreakFlame);
