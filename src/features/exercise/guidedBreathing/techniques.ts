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
    backgroundImage: require('../../../../assets/exercises/grass-v2.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/lights-v2.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/rocks-v2.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/sea-v2.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/flowers-v2.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/belly-v2.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/extended-exhale-v2.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/sitali-v2.jpg'),
  },
  {
    id: 'triangle',
    name: 'Triangle Breathing',
    recommendedName: 'The Three Corners',
    description:
      'A three-count rhythm drawn from the yogic samavritti tradition, where even breathing was used to steady the mind before long sittings. Inhale, hold, exhale, all to the same count. The pause on full lungs sharpens attention while the even cycle keeps your heart rate settled.',
    pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 0 },
    defaultRounds: 8,
    category: 'focus',
    heartRateResponse: 'stabilize',
    icon: 'triangle-outline',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/triangle-v2.jpg'),
  },
  {
    id: 'deep-box',
    name: 'Deep Box',
    recommendedName: 'The Wider Square',
    description:
      'An equal-count pattern stretched to six seconds a side, closer to the long tempos used in military and free-diving training to build tolerance to stillness. Everything slows down and gets deliberate. The even count gives your mind something simple to hold when it is busy.',
    pattern: { inhale: 6, holdIn: 6, exhale: 6, holdOut: 6 },
    defaultRounds: 6,
    category: 'focus',
    heartRateResponse: 'stabilize',
    icon: 'square-outline',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/deep-box-v2.jpg'),
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
    backgroundImage: require('../../../../assets/exercises/bhastrika-v2.jpg'),
  },
  {
    id: 'morning-charge',
    name: 'Morning Charge',
    recommendedName: 'The Sunrise Lift',
    description:
      'A longer inhale than exhale tips the balance toward your sympathetic nervous system, the same lever athletes use to lift alertness before warming up. It nudges your body awake instead of settling it. Made for the first few minutes after you get up, without the intensity of fast breathing.',
    pattern: { inhale: 4, holdIn: 0, exhale: 2, holdOut: 0 },
    defaultRounds: 15,
    category: 'energy',
    heartRateResponse: 'energize',
    icon: 'weather-sunny',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/morning-charge-v2.jpg'),
  },
  {
    id: 'night-settle',
    name: 'Night Settle',
    recommendedName: 'The Slow Fold',
    description:
      'A wind-down pattern built around a doubled exhale with only a brief hold. The long breath out is what does the real work, stimulating the vagus nerve and pulling your heart rate down. Keeping the hold short means you never end up short of air and thinking about your lungs instead of drifting off.',
    pattern: { inhale: 4, holdIn: 4, exhale: 8, holdOut: 0 },
    defaultRounds: 6,
    category: 'sleep',
    heartRateResponse: 'downshift',
    icon: 'weather-night',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/night-settle-v2.jpg'),
  },
  {
    id: 'sleep-descent',
    name: 'Sleep Descent',
    recommendedName: 'The Long Dark',
    description:
      'A doubled exhale with no holds at all, so there is nothing to concentrate on and nothing to count wrong. Sleep researchers have long noted that breathing slows and lengthens as the body drifts off. This walks you into that pattern deliberately. Made for lying down with your eyes already shut.',
    pattern: { inhale: 5, holdIn: 0, exhale: 10, holdOut: 0 },
    defaultRounds: 6,
    category: 'sleep',
    heartRateResponse: 'downshift',
    icon: 'bed',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/sleep-descent-v2.jpg'),
  },
  {
    id: 'coherent-6',
    name: 'Coherent 6',
    recommendedName: 'The Deep Tide',
    description:
      'Five breaths a minute, the slow end of the coherent breathing range studied since the 1990s for its effect on autonomic balance. Everyone has a pace where their heart rate variability peaks, and for plenty of people it sits down here. Slow enough that the whole body starts to follow the rhythm.',
    pattern: { inhale: 6, holdIn: 0, exhale: 6, holdOut: 0 },
    defaultRounds: 10,
    category: 'balance',
    heartRateResponse: 'resonance',
    icon: 'sine-wave',
    duration: '~2 min',
    backgroundImage: require('../../../../assets/exercises/coherent-6-v2.jpg'),
  },
];

export default TECHNIQUES;

export function getTechnique(id: string | null | undefined): BreathingTechnique | null {
  if (id == null) return null;
  return TECHNIQUES.find((technique) => technique.id === id) ?? null;
}
