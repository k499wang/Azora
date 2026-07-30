import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MOOD_TECHNIQUE } from '../features/exercise/guidedBreathing/techniqueSelection';
import type { TechniqueId } from '../features/exercise/guidedBreathing/techniqueCatalog';

type MoodIconName = NonNullable<ComponentProps<typeof MaterialCommunityIcons>['name']>;

export interface Mood {
  id: 'stressed' | 'anxious' | 'sleepless' | 'focus' | 'angry' | 'lowEnergy';
  label: string;
  icon: MoodIconName;
  accentColor: string;
  techniqueId: TechniqueId;
}

export const MOODS: Mood[] = [
  {
    id: 'stressed',
    label: 'Stressed',
    icon: 'weather-cloudy',
    accentColor: colors.mood.stressed,
    techniqueId: MOOD_TECHNIQUE.stressed,
  },
  {
    id: 'anxious',
    label: 'Anxious',
    icon: 'heart-pulse',
    accentColor: colors.mood.anxious,
    techniqueId: MOOD_TECHNIQUE.anxious,
  },
  {
    id: 'sleepless',
    label: "Can't sleep",
    icon: 'moon-waning-crescent',
    accentColor: colors.mood.sleepless,
    techniqueId: MOOD_TECHNIQUE.sleepless,
  },
  {
    id: 'focus',
    label: 'Need focus',
    icon: 'target',
    accentColor: colors.mood.focus,
    techniqueId: MOOD_TECHNIQUE.focus,
  },
  {
    id: 'angry',
    label: 'Angry',
    icon: 'fire',
    accentColor: colors.mood.angry,
    techniqueId: MOOD_TECHNIQUE.angry,
  },
  {
    id: 'lowEnergy',
    label: 'Low energy',
    icon: 'battery-low',
    accentColor: colors.mood.lowEnergy,
    techniqueId: MOOD_TECHNIQUE.lowEnergy,
  },
];
