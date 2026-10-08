export const ANIMATED_KOALA = {
  proud: require('../../../assets/animations/proud.webp'),
  excited: require('../../../assets/animations/excited.webp'),
} as const;

export type AnimatedRewardPose = keyof typeof ANIMATED_KOALA;
