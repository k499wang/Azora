import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type MoodIconName = NonNullable<ComponentProps<typeof MaterialCommunityIcons>['name']>;

export interface Mood {
  id: 'stressed' | 'anxious' | 'sleepless' | 'focus' | 'angry' | 'lowEnergy';
  label: string;
  icon: MoodIconName;
  accentColor: string;
  techniqueId: string;
}

export const MOODS: Mood[] = [
  {
    id: 'stressed',
    label: 'Stressed',
    icon: 'weather-cloudy',
    accentColor: colors.mood.stressed,
    techniqueId: 'relaxing',
  },
  {
    id: 'anxious',
    label: 'Anxious',
    icon: 'heart-pulse',
    accentColor: colors.mood.anxious,
    techniqueId: '478',
  },
  {
    id: 'sleepless',
    label: "Can't sleep",
    icon: 'moon-waning-crescent',
    accentColor: colors.mood.sleepless,
    techniqueId: '478',
  },
  {
    id: 'focus',
    label: 'Need focus',
    icon: 'target',
    accentColor: colors.mood.focus,
    techniqueId: 'box',
  },
  {
    id: 'angry',
    label: 'Angry',
    icon: 'fire',
    accentColor: colors.mood.angry,
    techniqueId: 'relaxing',
  },
  {
    id: 'lowEnergy',
    label: 'Low energy',
    icon: 'battery-low',
    accentColor: colors.mood.lowEnergy,
    techniqueId: 'wimhof',
  },
];
