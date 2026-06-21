import { Image, type ImageProps } from 'expo-image';
import { colors } from '../../theme/colors';

// Single source of truth for the warm result-screen backdrop. App.tsx preloads
// and decodes this at startup; sharing the module reference keeps the preload
// list and on-screen usage from drifting apart.
export const BACKGROUND_2066 = require('../../../assets/backgrounds/2066.jpg');

// Blurhash of 2066.jpg (4×3). Decodes synchronously to a blurred preview, so a
// cache miss resolves the actual image into focus instead of flashing a flat
// color. Regenerate if the asset changes.
const BLURHASH_2066 = 'LHT71ix]a*t7z8b:bXjGXAbYj?j[';

type Props = Omit<ImageProps, 'source'>;

// Renders on the first frame from the warm in-memory cache. On a rare cache
// miss the blurhash placeholder (matched to contentFit) fills the frame, with
// the dawn-toned background as a final fallback under the placeholder decode.
export function Background2066({ style, ...rest }: Props) {
  return (
    <Image
      source={BACKGROUND_2066}
      placeholder={{ blurhash: BLURHASH_2066 }}
      placeholderContentFit="cover"
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={0}
      {...rest}
      style={[{ backgroundColor: colors.background.dawn }, style]}
    />
  );
}
