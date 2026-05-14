import type { AudioCategory } from '../types';

export const voiceCategory: AudioCategory = {
  id: 'voice',
  title: 'Voice cues',
  description: 'Spoken prompts at each breath phase.',
  allowOff: true,
  previewable: true,
  options: [
    // Add voice packs here. Example shape:
    // {
    //   id: 'calm-female',
    //   label: 'Calm (female)',
    //   asset: require('../../../../assets/audio/voices/calm-female-inhale.m4a'),
    // },
  ],
};
