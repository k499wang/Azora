/**
 * What else was going on, as a short fixed list.
 *
 * The scales say how the day went. These say what it was made of, and they are
 * the only thing that lets an insight name a cause the user recognises: "your
 * roughest days are work days" is a sentence the check-in alone can never
 * produce, because the only other thing it can be crossed against is our own
 * sessions — a narrow and self-serving question.
 *
 * Short and fixed on purpose. Every tracker that is praised for this is
 * praised for how fast it is to answer, and a long list is a decision rather
 * than a tap. No custom tags either: a tag somebody wrote once is a tag
 * nothing can ever be compared against.
 *
 * Neutral, never good or bad. "Alcohol" and "unwell" are here to be crossed
 * against a rating, not to be scored — the app does not have a view about
 * somebody's evening.
 */

import type { IconName } from '../../../components/common/icons/paths';

export interface MoodTag {
  id: string;
  label: string;
  icon: IconName;
}

/**
 * Doing, then who with, then the state of the body. The grouping is not drawn
 * on screen; it is the order the chips are laid out in, so related ones sit
 * near each other and the row can be read rather than scanned.
 */
export const MOOD_TAGS: readonly MoodTag[] = [
  { id: 'work', label: 'Work', icon: 'briefcase' },
  { id: 'study', label: 'Study', icon: 'book' },
  { id: 'busy', label: 'Busy day', icon: 'clock' },
  { id: 'rest', label: 'Rest day', icon: 'home' },
  { id: 'chores', label: 'Chores', icon: 'calendar-check-outline' },
  { id: 'travel', label: 'Travel', icon: 'plane' },
  { id: 'exercise', label: 'Exercise', icon: 'dumbbell' },
  { id: 'walk', label: 'Walk', icon: 'walk' },
  { id: 'stretch', label: 'Stretch', icon: 'yoga' },
  { id: 'outdoors', label: 'Outdoors', icon: 'sun' },
  { id: 'friends', label: 'Friends', icon: 'message' },
  { id: 'family', label: 'Family', icon: 'heart' },
  { id: 'alone', label: 'Alone', icon: 'profile' },
  { id: 'big-day', label: 'Big day', icon: 'celebration' },
  { id: 'early', label: 'Early start', icon: 'sunrise' },
  { id: 'late-night', label: 'Late night', icon: 'moon' },
  { id: 'caffeine', label: 'Caffeine', icon: 'coffee-outline' },
  { id: 'alcohol', label: 'Alcohol', icon: 'glass' },
  { id: 'unwell', label: 'Unwell', icon: 'stethoscope' },
];

/**
 * How many may be chosen.
 *
 * Not a storage limit — a reading one. A day tagged with eight things
 * correlates with nothing, and picking eight is no longer a tap.
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
