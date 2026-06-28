import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BreathingTechniqueBpmResponse } from '../lib/heartRate/bpmInsight';

type TechniqueIconName = NonNullable<ComponentProps<typeof MaterialCommunityIcons>['name']>;

export interface BreathingTechnique {
  id: string;
  name: string;
  recommendedName: string;
  description: string;
  pattern: { inhale: number; holdIn: number; exhale: number; holdOut: number };
  defaultRounds: number;
  category: 'calm' | 'focus' | 'energy' | 'sleep' | 'balance';
  heartRateResponse: BreathingTechniqueBpmResponse;
  icon: TechniqueIconName;
  duration: string;
  backgroundImage: ImageSourcePropType;
}

/**
 * To add a new exercise, just add an entry here.
 * The picker and session will pick it up automatically. Choose
 * heartRateResponse based on the intended cardiovascular effect so the
 * post-session HR graph can interpret rises and drops correctly.
 */
const TECHNIQUES: BreathingTechnique[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    recommendedName: 'The Steady Sentinel',
    description:
      'A technique trusted by Navy SEALs, pilots, and elite athletes to stay razor-sharp under extreme pressure. By equalizing each phase of the breath, you stabilize your nervous system, slow your heart rate, and clear mental noise in seconds.',
    pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
    defaultRounds: 8,
    category: 'focus',
    heartRateResponse: 'stabilize',
    icon: 'checkbox-blank-outline',
    duration: '~2 min',
    backgroundImage: require('../../assets/exercises/grass.jpg'),
  },
  {
    id: '478',
    name: '4-7-8 Breathing',
    recommendedName: 'The Quiet Drift',
    description:
      "Developed by Dr. Andrew Weil as a natural tranquilizer for the nervous system. The extended exhale gently coaxes your body out of fight-or-flight and into deep rest. Many people use it to fall asleep faster or ease anxiety before a big moment.",
    pattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
    defaultRounds: 4,
    category: 'sleep',
    heartRateResponse: 'downshift',
    icon: 'moon-waning-crescent',
    duration: '~1 min',
    backgroundImage: require('../../assets/exercises/lights.jpg'),
  },
  {
    id: 'wimhof',
    name: 'Wim Hof',
    recommendedName: 'The Inner Spark',
    description:
      "Popularized by the 'Iceman,' this rapid cyclic breathing floods your body with oxygen, alkalizing the blood and energizing every cell. Research links it to reduced inflammation, stronger immunity, and a measurable boost in energy and mental clarity.",
    pattern: { inhale: 2, holdIn: 0, exhale: 2, holdOut: 0 },
    defaultRounds: 30,
    category: 'energy',
    heartRateResponse: 'energize',
    icon: 'flash-outline',
    duration: '~2 min',
    backgroundImage: require('../../assets/exercises/rocks.jpg'),
  },
  {
    id: 'resonance',
    name: 'Resonance',
    recommendedName: 'The Inner Tide',
    description:
      'Also known as coherent breathing, this rhythm matches your body\'s natural resonant frequency. At five to six breaths per minute, you maximize heart rate variability, improve autonomic balance, and train your nervous system to recover faster from stress.',
    pattern: { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },
    defaultRounds: 10,
    category: 'balance',
    heartRateResponse: 'resonance',
    icon: 'waves',
    duration: '~2 min',
    backgroundImage: require('../../assets/exercises/sea.jpg'),
  },
  {
    id: 'relaxing',
    name: 'Relaxing Breath',
    recommendedName: 'The Calm Explorer',
    description:
      'A simple but powerful pattern that activates the vagus nerve and triggers your parasympathetic relaxation response. By extending the exhale, you measurably lower heart rate and blood pressure, making this perfect for unwinding after a hectic day.',
    pattern: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
    defaultRounds: 6,
    category: 'calm',
    heartRateResponse: 'downshift',
    icon: 'leaf',
    duration: '~1 min',
    backgroundImage: require('../../assets/exercises/flowers.jpg'),
  },
];

export default TECHNIQUES;
