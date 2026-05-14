import type { AudioCategory } from '../types';

export const ambientCategory: AudioCategory = {
  id: 'ambient',
  title: 'Background sound',
  description: 'A gentle loop while your session is running.',
  allowOff: true,
  previewable: true,
  options: [
    // Add ambient loops here. Example shape:
    // {
    //   id: 'rain',
    //   label: 'Rain',
    //   asset: require('../../../../assets/audio/ambient/rain.m4a'),
    // },
  ],
};
