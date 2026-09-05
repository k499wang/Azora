import { memo } from 'react';
import { Image } from 'expo-image';
import { getBackgroundImageSource } from '../../services/images/backgroundImageCache';

interface Props {
  size: number;
}

/**
 * The streak flame.
 *
 * The art is a square PNG with its own gradient and contact shadow, predecoded
 * at launch alongside the hero backgrounds — the source it renders is the
 * retained decode when there is one, so the screen never appears before the
 * flame does. `transition={0}` for the same reason: a fade here would be the
 * very flash the predecode exists to prevent.
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
