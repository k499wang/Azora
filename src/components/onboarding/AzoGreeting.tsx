import { Image } from 'expo-image';
import { View } from 'react-native';
import { useAnimatedImagePlayback } from '../../hooks/useAnimatedImagePlayback';
import { GREETING_ANIMATION } from './greetingAnimation';

interface AzoGreetingProps {
  width: number;
  onReady?: () => void;
}

/** The same waving greeting on the message invitation and personalized hello. */
export default function AzoGreeting({ width, onReady }: AzoGreetingProps) {
  const playback = useAnimatedImagePlayback(GREETING_ANIMATION);
  const size = { width, height: width * (578 / 600) };

  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Azo waving hello">
      <Image
        ref={playback.ref}
        source={GREETING_ANIMATION}
        style={size}
        contentFit="contain"
        autoplay={false}
        useAppleWebpCodec={false}
        cachePolicy="memory"
        onDisplay={() => {
          playback.onDisplay();
          onReady?.();
        }}
        onError={onReady}
        accessible={false}
      />
    </View>
  );
}
