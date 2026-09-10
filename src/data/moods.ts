import { colors } from '../theme/colors';
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
    | 'lowMood'
    | 'lowEnergy'
    | 'focus'
    | 'morning'
    | 'windDown'
    | 'sleepless';
  label: string;
  icon: IconName;
  accentColor: string;
  techniqueId: TechniqueId;
}

export const MOODS: Mood[] = [
  {
    id: 'stressed',
    label: 'Stressed',
    icon: 'mood-stressed',
    accentColor: colors.mood.stressed,
    techniqueId: MOOD_TECHNIQUE.stressed,
  },
  {
    id: 'anxious',
    label: 'Anxious',
    icon: 'mood-anxious',
    accentColor: colors.mood.anxious,
    techniqueId: MOOD_TECHNIQUE.anxious,
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    icon: 'mood-overwhelmed',
    accentColor: colors.mood.overwhelmed,
    techniqueId: MOOD_TECHNIQUE.overwhelmed,
  },
  {
    id: 'overthinking',
    label: 'Overthinking',
    icon: 'mood-overthinking',
    accentColor: colors.mood.overthinking,
    techniqueId: MOOD_TECHNIQUE.overthinking,
  },
  {
    id: 'angry',
    label: 'Angry',
    icon: 'mood-angry',
    accentColor: colors.mood.angry,
    techniqueId: MOOD_TECHNIQUE.angry,
  },
  {
    id: 'restless',
    label: 'Restless',
    icon: 'mood-restless',
    accentColor: colors.mood.restless,
    techniqueId: MOOD_TECHNIQUE.restless,
  },
  {
    id: 'lowMood',
    label: 'Low mood',
    icon: 'mood-low-mood',
    accentColor: colors.mood.lowMood,
    techniqueId: MOOD_TECHNIQUE.lowMood,
  },
  {
    id: 'lowEnergy',
    label: 'Low energy',
    icon: 'mood-low-energy',
    accentColor: colors.mood.lowEnergy,
    techniqueId: MOOD_TECHNIQUE.lowEnergy,
  },
  {
    id: 'focus',
    label: 'Need focus',
    icon: 'mood-focus',
    accentColor: colors.mood.focus,
    techniqueId: MOOD_TECHNIQUE.focus,
  },
  {
    id: 'morning',
    label: 'Just woke up',
    icon: 'mood-morning',
    accentColor: colors.mood.morning,
    techniqueId: MOOD_TECHNIQUE.morning,
  },
  {
    id: 'windDown',
    label: 'Winding down',
    icon: 'mood-wind-down',
    accentColor: colors.mood.windDown,
    techniqueId: MOOD_TECHNIQUE.windDown,
  },
  {
    id: 'sleepless',
    label: "Can't sleep",
    icon: 'mood-sleepless',
    accentColor: colors.mood.sleepless,
    techniqueId: MOOD_TECHNIQUE.sleepless,
  },
];
