import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BreathingTechniqueBpmResponse } from '../../../lib/heartRate/bpmInsight';
import type { TechniqueId } from './techniqueCatalog';

type TechniqueIconName = NonNullable<ComponentProps<typeof MaterialCommunityIcons>['name']>;

export interface BreathingTechnique {
  id: TechniqueId;
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
 * To add a new exercise: register its id in `techniqueCatalog.ts`, ship the
 * matching migration row, then add the entry here. The picker, library, and
 * session pick it up automatically.
 *
 * Choose `heartRateResponse` from the existing union based on the intended
 * cardiovascular effect — the post-session HR graph derives all of its copy
 * from that value, so a new exercise never needs new insight text.
 *
 * `duration` is a display string; keep it consistent with
 * `(inhale + holdIn + exhale + holdOut) * defaultRounds`.
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
    backgroundImage: require('../../../../assets/exercises/grass.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/lights.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/rocks.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/sea.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/flowers.jpg'),
  },
  {
    id: 'belly',
    name: 'Belly Breathing',
    recommendedName: 'The First Anchor',
    description:
      'Start here. Most of us breathe high in the chest without noticing, especially on a stressful day. This one asks you to breathe low, into the belly, which is where your body actually calms itself down. No holds and nothing to count. Just the basics, done properly.',
    pattern: { inhale: 4, holdIn: 0, exhale: 4, holdOut: 0 },
    defaultRounds: 10,
    category: 'calm',
    heartRateResponse: 'stabilize',
    icon: 'lungs',
    duration: '~1 min',
    backgroundImage: require('../../../../assets/exercises/belly.jpg'),
  },
  {
    id: 'extended-exhale',
    name: 'Extended Exhale',
    recommendedName: 'The Long Release',
    description:
      'Breathe out for twice as long as you breathe in. It sounds almost too simple, but a long exhale is the fastest way to tell your body the emergency is over, and your heart rate follows within a few rounds. This is the one to reach for when you need to come down now.',
    pattern: { inhale: 4, holdIn: 0, exhale: 8, holdOut: 0 },
    defaultRounds: 8,
    category: 'calm',
    heartRateResponse: 'downshift',
    icon: 'weather-windy',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/extended-exhale.jpg'),
  },
  {
    id: 'sitali',
    name: 'Cooling Breath',
    recommendedName: 'The Cool Current',
    description:
      'Curl your tongue and sip the air in through it. Yogis have used Sitali for centuries to cool down, and it works on the emotional kind of heat as much as the physical kind. The short hold and long exhale settle whatever is churning underneath. Good for anger and frustration.',
    pattern: { inhale: 4, holdIn: 2, exhale: 6, holdOut: 0 },
    defaultRounds: 8,
    category: 'calm',
    heartRateResponse: 'downshift',
    icon: 'snowflake',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/sitali.jpg'),
  },
  {
    id: 'triangle',
    name: 'Triangle Breathing',
    recommendedName: 'The Three Corners',
    description:
      'Box breathing minus the pause on empty lungs, which is the bit most people find unpleasant at first. You still get the steady rhythm and the sharpening that comes with holding a breath, but the cycle is much easier to stay with. A good way in before you try the full box.',
    pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 0 },
    defaultRounds: 8,
    category: 'focus',
    heartRateResponse: 'stabilize',
    icon: 'triangle-outline',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/triangle.jpg'),
  },
  {
    id: 'deep-box',
    name: 'Deep Box',
    recommendedName: 'The Wider Square',
    description:
      'Box breathing, stretched to six seconds a side. Everything slows down and gets more deliberate, but you keep the even count that makes box breathing so easy to hold onto when your head is busy. Move up to this once four seconds stops feeling like work.',
    pattern: { inhale: 6, holdIn: 6, exhale: 6, holdOut: 6 },
    defaultRounds: 6,
    category: 'focus',
    heartRateResponse: 'stabilize',
    icon: 'square-outline',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/deep-box.jpg'),
  },
  {
    id: 'bhastrika',
    name: 'Bellows Breath',
    recommendedName: 'The Forge',
    description:
      'Bhastrika means bellows, and it feels like it. Short, forceful breaths driven from the belly, in and out at the same pace, fanning the fire. You will feel warmer and noticeably more awake inside a minute. This is the fastest pattern here and by far the most physical.',
    pattern: { inhale: 1, holdIn: 0, exhale: 1, holdOut: 0 },
    defaultRounds: 30,
    category: 'energy',
    heartRateResponse: 'energize',
    icon: 'fan',
    duration: '~1 min',
    backgroundImage: require('../../../../assets/exercises/bhastrika.jpg'),
  },
  {
    id: 'morning-charge',
    name: 'Morning Charge',
    recommendedName: 'The Sunrise Lift',
    description:
      'Take the calming pattern and turn it around. A longer inhale than exhale nudges your body awake instead of settling it. Use this in the first few minutes after you get up, when you want to feel switched on but are not ready for anything as intense as fast breathing.',
    pattern: { inhale: 4, holdIn: 0, exhale: 2, holdOut: 0 },
    defaultRounds: 15,
    category: 'energy',
    heartRateResponse: 'energize',
    icon: 'weather-sunny',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/morning-charge.jpg'),
  },
  {
    id: 'night-settle',
    name: 'Night Settle',
    recommendedName: 'The Slow Fold',
    description:
      '4-7-8 with a hold you can actually manage. The long exhale is what does the real work of winding you down, and that stays. What goes is the seven second hold, which leaves a lot of people short of air and thinking about their lungs instead of drifting off. Same destination, gentler road.',
    pattern: { inhale: 4, holdIn: 4, exhale: 8, holdOut: 0 },
    defaultRounds: 6,
    category: 'sleep',
    heartRateResponse: 'downshift',
    icon: 'weather-night',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/night-settle.jpg'),
  },
  {
    id: 'sleep-descent',
    name: 'Sleep Descent',
    recommendedName: 'The Long Dark',
    description:
      'The longest exhale here and no holds at all, so there is nothing to concentrate on. Made for lying down with your eyes already shut. Holding a breath at that point tends to pull you back awake, which is the opposite of what you want, so this one never asks you to.',
    pattern: { inhale: 5, holdIn: 0, exhale: 10, holdOut: 0 },
    defaultRounds: 6,
    category: 'sleep',
    heartRateResponse: 'downshift',
    icon: 'bed',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/sleep-descent.jpg'),
  },
  {
    id: 'coherent-6',
    name: 'Coherent 6',
    recommendedName: 'The Deep Tide',
    description:
      'Five breaths a minute, one notch slower than Resonance. Everyone has a pace where their heart rate variability peaks, and for plenty of people it sits down here rather than at six. Try both across a week and let your own HRV numbers tell you which one is yours.',
    pattern: { inhale: 6, holdIn: 0, exhale: 6, holdOut: 0 },
    defaultRounds: 10,
    category: 'balance',
    heartRateResponse: 'resonance',
    icon: 'sine-wave',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/coherent-6.jpg'),
  },
];

export default TECHNIQUES;

export function getTechnique(id: string | null | undefined): BreathingTechnique | null {
  if (id == null) return null;
  return TECHNIQUES.find((technique) => technique.id === id) ?? null;
}
