export interface BreathingTechnique {
  id: string;
  name: string;
  description: string;
  pattern: { inhale: number; holdIn: number; exhale: number; holdOut: number };
  defaultRounds: number;
  category: 'calm' | 'focus' | 'energy' | 'sleep';
  icon: string;
  duration: string;
}

/**
 * To add a new exercise, just add an entry here.
 * The picker and session will pick it up automatically.
 */
const TECHNIQUES: BreathingTechnique[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal parts inhale, hold, exhale, hold',
    pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
    defaultRounds: 8,
    category: 'focus',
    icon: 'checkbox-blank-outline',
    duration: '~2 min',
  },
  {
    id: '478',
    name: '4-7-8 Breathing',
    description: 'Calming technique for sleep and anxiety',
    pattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
    defaultRounds: 4,
    category: 'sleep',
    icon: 'moon-waning-crescent',
    duration: '~1 min',
  },
  {
    id: 'wimhof',
    name: 'Wim Hof',
    description: 'Rapid breathing for energy and focus',
    pattern: { inhale: 2, holdIn: 0, exhale: 2, holdOut: 0 },
    defaultRounds: 30,
    category: 'energy',
    icon: 'flash-outline',
    duration: '~2 min',
  },
  {
    id: 'resonance',
    name: 'Resonance',
    description: 'Balanced breathing at 6 breaths per minute',
    pattern: { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },
    defaultRounds: 10,
    category: 'calm',
    icon: 'waves',
    duration: '~2 min',
  },
  {
    id: 'relaxing',
    name: 'Relaxing Breath',
    description: 'Extended exhale for deep relaxation',
    pattern: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
    defaultRounds: 6,
    category: 'calm',
    icon: 'leaf',
    duration: '~1 min',
  },
];

export default TECHNIQUES;
