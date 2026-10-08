import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { ANIMATED_KOALA, type AnimatedRewardPose } from './rewardAnimations';

/** Warm just the next reward using the same decoder as the visible hero. */
export default function RewardAnimationPreload({
  pose,
  enabled = true,
}: {
  pose: AnimatedRewardPose;
  enabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useWhileVisible(() => {
    setVisible(true);
    return () => setVisible(false);
  }, []);

  if (!enabled || !visible) return null;

  return (
    <Image
      source={ANIMATED_KOALA[pose]}
      style={styles.hidden}
      pointerEvents="none"
      accessible={false}
      autoplay={false}
      allowDownscaling={false}
      cachePolicy="memory-disk"
      useAppleWebpCodec={false}
    />
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
