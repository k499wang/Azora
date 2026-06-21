import { Image, type ImageProps } from 'expo-image';
import { RESULT_BACKGROUND_ASSET } from '../../data/backgroundAssets';
import { getBackgroundImageSource } from '../../services/images/backgroundImageCache';

type ManagedImageProp =
  | 'source'
  | 'placeholder'
  | 'placeholderContentFit'
  | 'contentFit'
  | 'cachePolicy'
  | 'transition';
type Props = Omit<ImageProps, ManagedImageProp>;

export function Background2066({ style, ...rest }: Props) {
  return (
    <Image
      {...rest}
      source={getBackgroundImageSource('result')}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={0}
      style={[{ backgroundColor: RESULT_BACKGROUND_ASSET.fallbackColor }, style]}
    />
  );
}
