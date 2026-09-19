import type { IconName } from '../components/common/icons/paths';
import { MOOD_TECHNIQUE } from '../features/exercise/guidedBreathing/techniqueSelection';
import type { TechniqueId } from '../features/exercise/guidedBreathing/techniqueCatalog';

export interface Mood {
  id:
    | 'stressed'
    | 'anxious'
    | 'overwhelmed'
    | 'overthinking'
    | 'angry'
    | 'restless'
    | 'panicky'
    | 'tense'
    | 'lowMood'
    | 'lowEnergy'
    | 'sleepless'
    | 'foggy'
    | 'burntOut'
    | 'heavyHeart'
    | 'focus'
    | 'morning'
    | 'windDown'
    | 'midday'
    | 'preWorkout'
    | 'bigMoment';
  label: string;
  icon: IconName;
  techniqueId: TechniqueId;
}

export const MOODS: Mood[] = [
  {
    id: 'stressed',
    label: 'Stressed',
    icon: 'mood-stressed',
    techniqueId: MOOD_TECHNIQUE.stressed,
  },
  {
    id: 'anxious',
    label: 'Anxious',
    icon: 'mood-anxious',
    techniqueId: MOOD_TECHNIQUE.anxious,
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    icon: 'mood-overwhelmed',
    techniqueId: MOOD_TECHNIQUE.overwhelmed,
  },
  {
    id: 'overthinking',
    label: 'Overthinking',
    icon: 'mood-overthinking',
    techniqueId: MOOD_TECHNIQUE.overthinking,
  },
  {
    id: 'angry',
    label: 'Angry',
    icon: 'mood-angry',
    techniqueId: MOOD_TECHNIQUE.angry,
  },
  {
    id: 'restless',
    label: 'Restless',
    icon: 'mood-restless',
    techniqueId: MOOD_TECHNIQUE.restless,
  },
  {
    id: 'panicky',
    label: 'Panicky',
    icon: 'face-anxious',
    techniqueId: MOOD_TECHNIQUE.panicky,
  },
  {
    id: 'tense',
    label: 'Tense',
    icon: 'weather-windy',
    techniqueId: MOOD_TECHNIQUE.tense,
  },
  {
    id: 'lowMood',
    label: 'Low mood',
    icon: 'mood-low-mood',
    techniqueId: MOOD_TECHNIQUE.lowMood,
  },
  {
    id: 'lowEnergy',
    label: 'Low energy',
    icon: 'mood-low-energy',
    techniqueId: MOOD_TECHNIQUE.lowEnergy,
  },
  {
    id: 'sleepless',
    label: "Can't sleep",
    icon: 'mood-sleepless',
    techniqueId: MOOD_TECHNIQUE.sleepless,
  },
  {
    id: 'foggy',
    label: 'Foggy',
    icon: 'face-meh',
    techniqueId: MOOD_TECHNIQUE.foggy,
  },
  {
    id: 'burntOut',
    label: 'Burnt out',
    icon: 'face-tired',
    techniqueId: MOOD_TECHNIQUE.burntOut,
  },
  {
    id: 'heavyHeart',
    label: 'Heavy heart',
    icon: 'face-sad',
    techniqueId: MOOD_TECHNIQUE.heavyHeart,
  },
  {
    id: 'focus',
    label: 'Need focus',
    icon: 'mood-focus',
    techniqueId: MOOD_TECHNIQUE.focus,
  },
  {
    id: 'morning',
    label: 'Just woke up',
    icon: 'mood-morning',
    techniqueId: MOOD_TECHNIQUE.morning,
  },
  {
    id: 'windDown',
    label: 'Winding down',
    icon: 'mood-wind-down',
    techniqueId: MOOD_TECHNIQUE.windDown,
  },
  {
    id: 'midday',
    label: 'Midday dip',
    icon: 'coffee-outline',
    techniqueId: MOOD_TECHNIQUE.midday,
  },
  {
    id: 'preWorkout',
    label: 'Before a workout',
    icon: 'dumbbell',
    techniqueId: MOOD_TECHNIQUE.preWorkout,
  },
  {
    id: 'bigMoment',
    label: 'Big moment',
    icon: 'star-outline',
    techniqueId: MOOD_TECHNIQUE.bigMoment,
  },
];
