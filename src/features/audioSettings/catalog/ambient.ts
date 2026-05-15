import type { AudioCategory } from '../types';

export const ambientCategory: AudioCategory = {
  id: 'ambient',
  title: 'Background sound',
  description: 'A gentle loop while your session is running.',
  allowOff: true,
  previewable: true,
  options: [
    {
      id: 'rain',
      label: 'Rain',
      asset: require('../../../../assets/audio/ambient/rain.mp3'),
    },
  ],
};
