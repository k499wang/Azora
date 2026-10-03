import type { BackgroundImageKey } from '../../services/images/backgroundImageCache';

export const AZO_POSES = {
  proud: { aspectRatio: 688 / 720, loop: true, poster: 'azoProud' },
  celebrate: { aspectRatio: 752 / 720, loop: false, poster: 'azoCelebrate' },
} as const satisfies Record<
  string,
  { aspectRatio: number; loop: boolean; poster: BackgroundImageKey }
>;

export type AzoPose = keyof typeof AZO_POSES;

export interface AzoAnimationProps {
  pose: AzoPose;
  width: number;
}
