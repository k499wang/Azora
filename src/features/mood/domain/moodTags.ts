/** Mood context: activities, people, and places, stored as stable tag IDs. */

import type { IconName } from '../../../components/common/icons/paths';

export type MoodTagGroupId = 'activities' | 'people' | 'places';

export const MOOD_TAG_GROUPS: readonly {
  id: MoodTagGroupId;
  label: string;
}[] = [
  { id: 'activities', label: 'Activities' },
  { id: 'people', label: 'People' },
  { id: 'places', label: 'Places' },
];

export interface MoodTag {
  group: MoodTagGroupId;
  id: string;
  label: string;
  icon: IconName;
}

export const MOOD_TAGS: readonly MoodTag[] = [
  { group: 'activities', id: 'work', label: 'Work', icon: 'briefcase' },
  { group: 'activities', id: 'study', label: 'Study', icon: 'book' },
  { group: 'activities', id: 'busy', label: 'Busy day', icon: 'clock' },
  { group: 'activities', id: 'rest', label: 'Rest day', icon: 'home' },
  { group: 'activities', id: 'chores', label: 'Chores', icon: 'calendar-check-outline' },
  { group: 'activities', id: 'travel', label: 'Travel', icon: 'plane' },
  { group: 'activities', id: 'exercise', label: 'Exercise', icon: 'dumbbell' },
  { group: 'activities', id: 'walk', label: 'Walk', icon: 'walk' },
  { group: 'activities', id: 'stretch', label: 'Stretch', icon: 'yoga' },
  { group: 'places', id: 'outdoors', label: 'Outdoors', icon: 'sun' },
  { group: 'people', id: 'friends', label: 'Friends', icon: 'message' },
  { group: 'people', id: 'family', label: 'Family', icon: 'heart' },
  { group: 'people', id: 'alone', label: 'Alone', icon: 'profile' },
  { group: 'activities', id: 'big-day', label: 'Big day', icon: 'celebration' },
  { group: 'activities', id: 'early', label: 'Early start', icon: 'sunrise' },
  { group: 'activities', id: 'late-night', label: 'Late night', icon: 'moon' },
  { group: 'activities', id: 'caffeine', label: 'Caffeine', icon: 'coffee-outline' },
  { group: 'activities', id: 'alcohol', label: 'Alcohol', icon: 'glass' },
  { group: 'activities', id: 'unwell', label: 'Unwell', icon: 'stethoscope' },
  { group: 'people', id: 'partner', label: 'Partner', icon: 'heart' },
  { group: 'people', id: 'coworkers', label: 'Coworkers', icon: 'briefcase' },
  { group: 'places', id: 'home', label: 'Home', icon: 'home' },
  { group: 'places', id: 'workplace', label: 'Workplace', icon: 'briefcase' },
  { group: 'places', id: 'school', label: 'School', icon: 'book' },
  { group: 'places', id: 'gym', label: 'Gym', icon: 'dumbbell' },
  { group: 'places', id: 'cafe', label: 'Café', icon: 'coffee-outline' },
];

/**
 * How many may be chosen.
 *
 * Shared across all three groups so the optional check-in stays quick.
 * Historical entries with more tags remain readable.
 */
export const MOOD_TAG_LIMIT = 5;

const TAG_IDS = new Set(MOOD_TAGS.map((tag) => tag.id));

export function moodTagLabel(id: string): string | null {
  return MOOD_TAGS.find((tag) => tag.id === id)?.label ?? null;
}

/**
 * A stored list, read back defensively.
 *
 * The catalogue is product content, so a row can hold a tag this build no
 * longer offers. Unknown ones are dropped rather than shown raw, duplicates
 * collapse, and the order the catalogue defines wins over the order they
 * happened to be tapped — two days tagged with the same things should read the
 * same way.
 */
export function sanitizeMoodTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const chosen = new Set(
    raw.filter((value): value is string => typeof value === 'string' && TAG_IDS.has(value)),
  );

  return MOOD_TAGS.filter((tag) => chosen.has(tag.id)).map((tag) => tag.id);
}
