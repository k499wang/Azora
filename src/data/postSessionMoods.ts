import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type MoodIconName = NonNullable<ComponentProps<typeof MaterialCommunityIcons>['name']>;

/**
 * Post-session check-in. Deliberately separate from `MOODS` in `moods.ts`:
 * those are problem states used to route someone *into* a technique, these are
 * a valence scale read *after* one. Technique-agnostic on purpose — an
 * energising session and a calming session both land on the same scale.
 */
export interface PostSessionMood {
  id: 'great' | 'good' | 'okay' | 'meh' | 'rough';
  label: string;
  icon: MoodIconName;
  /** 5 is best. Sent to analytics so the scale stays orderable. */
  score: number;
  accentColor: string;
}

export const POST_SESSION_MOODS: PostSessionMood[] = [
  {
    id: 'great',
    label: 'Great',
    icon: 'weather-sunny',
    score: 5,
    accentColor: colors.primary.blue600,
  },
  {
    id: 'good',
    label: 'Good',
    icon: 'emoticon-happy-outline',
    score: 4,
    accentColor: colors.primary.blue500,
  },
  {
    id: 'okay',
    label: 'Okay',
    icon: 'emoticon-neutral-outline',
    score: 3,
    accentColor: colors.primary.blue400,
  },
  {
    id: 'meh',
    label: 'Meh',
    icon: 'weather-cloudy',
    score: 2,
    accentColor: colors.mood.lowEnergy,
  },
  {
    id: 'rough',
    label: 'Rough',
    icon: 'weather-pouring',
    score: 1,
    accentColor: colors.mood.stressed,
  },
];
