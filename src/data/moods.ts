import { colors } from '../theme/colors';
import type { IconName } from '../components/common/icons/paths';
import { MOOD_TECHNIQUE } from '../features/exercise/guidedBreathing/techniqueSelection';
import type { TechniqueId } from '../features/exercise/guidedBreathing/techniqueCatalog';

export interface Mood {
  id: 'stressed' | 'anxious' | 'sleepless' | 'focus' | 'angry' | 'lowEnergy';
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
    id: 'sleepless',
    label: "Can't sleep",
    icon: 'mood-sleepless',
    accentColor: colors.mood.sleepless,
    techniqueId: MOOD_TECHNIQUE.sleepless,
  },
  {
    id: 'focus',
    label: 'Need focus',
    icon: 'mood-focus',
    accentColor: colors.mood.focus,
    techniqueId: MOOD_TECHNIQUE.focus,
  },
  {
    id: 'angry',
    label: 'Angry',
    icon: 'mood-angry',
    accentColor: colors.mood.angry,
    techniqueId: MOOD_TECHNIQUE.angry,
  },
  {
    id: 'lowEnergy',
    label: 'Low energy',
    icon: 'mood-low-energy',
    accentColor: colors.mood.lowEnergy,
    techniqueId: MOOD_TECHNIQUE.lowEnergy,
  },
];
