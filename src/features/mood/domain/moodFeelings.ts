/** Emotion vocabulary for check-ins and reflections. */

import type { IconName } from '../../../components/common/icons/paths';
import type { MoodAnswers } from './moodCheckIn';

export type MoodFeelingSetId = 'tense' | 'low' | 'mixed' | 'bright' | 'easy';

export interface MoodFeeling {
  /** Stable and stored. Kebab-case, never the label. */
  id: string;
  label: string;
  icon: IconName;
}

export const MOOD_FEELING_SETS = {
  tense: [
    { id: 'anxious', label: 'Anxious', icon: 'mood-anxious' },
    { id: 'stressed', label: 'Stressed', icon: 'mood-stressed' },
    { id: 'overwhelmed', label: 'Overwhelmed', icon: 'mood-overwhelmed' },
    { id: 'irritated', label: 'Irritated', icon: 'mood-angry' },
    { id: 'restless', label: 'Restless', icon: 'mood-restless' },
    { id: 'on-edge', label: 'On edge', icon: 'face-anxious' },
  ],
  low: [
    { id: 'sad', label: 'Sad', icon: 'face-sad' },
    { id: 'drained', label: 'Drained', icon: 'stat-stress-battery' },
    { id: 'flat', label: 'Flat', icon: 'face-neutral' },
    { id: 'numb', label: 'Numb', icon: 'snowflake' },
    { id: 'lonely', label: 'Lonely', icon: 'profile' },
    { id: 'hopeless', label: 'Hopeless', icon: 'mood-low-mood' },
  ],
  mixed: [
    { id: 'scattered', label: 'Scattered', icon: 'mood-overthinking' },
    { id: 'tired', label: 'Tired', icon: 'face-tired' },
    { id: 'bored', label: 'Bored', icon: 'clock' },
    { id: 'unsettled', label: 'Unsettled', icon: 'weather-windy' },
    { id: 'meh', label: 'Meh', icon: 'face-meh' },
    { id: 'fine', label: 'Fine', icon: 'face-calm' },
  ],
  bright: [
    { id: 'happy', label: 'Happy', icon: 'face-happy' },
    { id: 'excited', label: 'Excited', icon: 'celebration' },
    { id: 'motivated', label: 'Motivated', icon: 'streak' },
    { id: 'focused', label: 'Focused', icon: 'mood-focus' },
    { id: 'proud', label: 'Proud', icon: 'trophy' },
    { id: 'hopeful', label: 'Hopeful', icon: 'sunrise' },
  ],
  easy: [
    { id: 'calm', label: 'Calm', icon: 'lotus' },
    { id: 'content', label: 'Content', icon: 'heart' },
    { id: 'relaxed', label: 'Relaxed', icon: 'waves' },
    { id: 'grateful', label: 'Grateful', icon: 'heart-glow' },
    { id: 'rested', label: 'Rested', icon: 'bed-clock' },
    { id: 'cozy', label: 'Cozy', icon: 'home' },
  ],
} as const satisfies Record<MoodFeelingSetId, readonly MoodFeeling[]>;

export type MoodFeelingId =
  (typeof MOOD_FEELING_SETS)[MoodFeelingSetId][number]['id'];

/** Held by a constraint on the column too, so a client bug cannot widen it. */
export const MOOD_FEELING_MAX_LENGTH = 32;

const ALL_FEELINGS: readonly MoodFeeling[] = Object.values(
  MOOD_FEELING_SETS,
).flat();

/** A starting group for reflection prompts; the picker offers every group. */
export function moodFeelingSet(answers: MoodAnswers): MoodFeelingSetId | null {
  const { overall } = answers;
  if (overall == null) return null;
  if (overall <= 2) return 'low';
  if (overall === 3) return 'mixed';
  return 'bright';
}

/** Start with relevant words without excluding feelings that cross mood bands. */
export function moodFeelingChoices(answers: MoodAnswers): readonly MoodFeeling[] {
  const set = moodFeelingSet(answers);
  if (set == null) return [];
  if (set === 'low') return [...MOOD_FEELING_SETS.low, ...MOOD_FEELING_SETS.tense];
  if (set === 'bright') return [...MOOD_FEELING_SETS.bright, ...MOOD_FEELING_SETS.easy];
  return MOOD_FEELING_SETS.mixed;
}

export const MOOD_FEELINGS = ALL_FEELINGS;

export function isMoodFeelingId(value: unknown): value is MoodFeelingId {
  return ALL_FEELINGS.some((feeling) => feeling.id === value);
}

export function moodFeelingLabel(id: string | null): string | null {
  return ALL_FEELINGS.find((feeling) => feeling.id === id)?.label ?? null;
}

/**
 * A stored word, read back and written out defensively.
 *
 * The vocabulary is product content, so a row can hold a word this build no
 * longer offers. Unknown ones read as no word rather than being shown raw.
 */
export function sanitizeMoodFeeling(raw: unknown): MoodFeelingId | null {
  return isMoodFeelingId(raw) ? raw : null;
}
