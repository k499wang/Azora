import type { AudioCategory } from '../types';

export const chimeCategory: AudioCategory = {
  id: 'chime',
  title: 'Phase chime',
  description: 'A short tone at each phase transition.',
  allowOff: true,
  previewable: true,
  options: [
    {
      id: 'singingBowl',
      label: 'Singing Bowl',
      asset: require('../../../../assets/audio/chimes/inhale-bell.m4a'),
      phaseAssets: {
        inhale: require('../../../../assets/audio/chimes/inhale-bell.m4a'),
        exhale: require('../../../../assets/audio/chimes/exhale-bowl.m4a'),
      },
    },
  ],
};
