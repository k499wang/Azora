import type { AudioCategory } from '../types';

export const voiceCategory: AudioCategory = {
  id: 'voice',
  title: 'Voice cues',
  description: 'Spoken prompts at each breath phase.',
  allowOff: true,
  previewable: true,
  options: [
    {
      id: 'theo',
      label: 'Theo',
      asset: require('../../../../assets/audio/voices/theo_in.mp3'),
      phaseAssets: {
        inhale: require('../../../../assets/audio/voices/theo_in.mp3'),
        exhale: require('../../../../assets/audio/voices/theo_out.mp3'),
        hold: require('../../../../assets/audio/voices/theo_hold.mp3'),
      },
    },
  ],
};
