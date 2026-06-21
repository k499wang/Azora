import { ImageBackground, type ImageBackgroundProps } from 'expo-image';
import { SUNSET_BACKGROUND_ASSET } from '../../data/backgroundAssets';
import { getBackgroundImageSource } from '../../services/images/backgroundImageCache';

type ManagedImageProp =
  | 'source'
  | 'placeholder'
  | 'placeholderContentFit'
  | 'contentFit'
  | 'cachePolicy'
  | 'transition';
type Props = Omit<ImageBackgroundProps, ManagedImageProp>;

export function SunsetBackground({ style, ...rest }: Props) {
  return (
    <ImageBackground
      {...rest}
      source={getBackgroundImageSource('sunset')}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={0}
      style={[{ backgroundColor: SUNSET_BACKGROUND_ASSET.fallbackColor }, style]}
    />
  );
}
