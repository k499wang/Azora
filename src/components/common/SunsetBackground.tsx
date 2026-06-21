import { ImageBackground, type ImageBackgroundProps } from 'expo-image';
import { colors } from '../../theme/colors';

// Single source of truth for the sunset paywall backdrop. App.tsx preloads
// and decodes this at startup; sharing the same module reference keeps the
// preload list and the on-screen usage from drifting apart.
export const SUNSET_BACKGROUND = require('../../../assets/backgrounds/sunset.jpg');

// Blurhash of sunset.jpg (4×4). Decodes synchronously to a blurred preview, so
// a cache miss resolves the actual sky into focus instead of flashing a flat
// color. Regenerate if the asset changes.
const SUNSET_BLURHASH = 'U~IhKkV@WBfk0ikCkBfQ#%j[jZa|xtayayjt';

type Props = Omit<ImageBackgroundProps, 'source'>;

// Renders on the first frame from the warm in-memory cache. On a rare cache
// miss the blurhash placeholder (matched to contentFit) fills the frame, with
// the sky-toned background as a final fallback under the placeholder decode.
export function SunsetBackground({ style, ...rest }: Props) {
  return (
    <ImageBackground
      source={SUNSET_BACKGROUND}
      placeholder={{ blurhash: SUNSET_BLURHASH }}
      placeholderContentFit="cover"
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={0}
      {...rest}
      style={[{ backgroundColor: colors.background.sunset }, style]}
    />
  );
}
