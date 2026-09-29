/**
 * One word for the day, picked from a handful that fit the answers already
 * given.
 *
 * Naming a feeling precisely takes some of the edge off it (Lieberman 2007,
 * affect labeling), and a finer vocabulary for one's own emotions goes with
 * handling them better (Kashdan, Barrett & McKnight 2015). The scales say how
 * the day went; the word says what it felt like.
 *
 * Six words rather than sixty. The set is chosen by how pleasant the day was
 * and how much energy there was — the two axes every map of affect is drawn
 * on — so the six on screen are already close, and picking one is a tap rather
 * than a search. Sleep is not an axis of feeling, so it plays no part.
 */

import type { IconName } from '../../../components/common/icons/paths';
import type { TechniqueId } from '../../exercise/guidedBreathing/techniqueCatalog';
import type { MoodAnswers, MoodRemedy } from './moodCheckIn';

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

/**
 * Which six words fit, or nothing until both answers it reads are in.
 *
 * A 3 overall is its own set whatever the energy: a middling day is neither
 * tense nor bright, and offering either would be putting words in somebody's
 * mouth.
 */
export function moodFeelingSet(answers: MoodAnswers): MoodFeelingSetId | null {
  const { overall, energy } = answers;
  if (overall == null || energy == null) return null;

  if (overall === 3) return 'mixed';
  if (overall <= 2) return energy >= 3 ? 'tense' : 'low';
  return energy >= 3 ? 'bright' : 'easy';
}

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

export interface MoodFeelingOffer {
  techniqueId: TechniqueId;
  remedy: MoodRemedy;
}

/**
 * What a hard feeling earns on a low day, when it asks for something the
 * weakest scale would not.
 *
 * Only the tense and low words are here. Anxiety wants a slower exhale, not
 * the energizing exercise a low energy score would have picked; flatness wants
 * the opposite. None is high-ventilation: Wim Hof and Bellows are never offered
 * to somebody on a bad day.
 */
const OFFER_FOR_FEELING: Partial<Record<MoodFeelingId, MoodFeelingOffer>> = {
  anxious: { techniqueId: '478', remedy: 'steadying' },
  stressed: { techniqueId: 'extended-exhale', remedy: 'steadying' },
  overwhelmed: { techniqueId: 'relaxing', remedy: 'steadying' },
  irritated: { techniqueId: 'sitali', remedy: 'steadying' },
  restless: { techniqueId: 'belly', remedy: 'steadying' },
  'on-edge': { techniqueId: 'coherent-6', remedy: 'steadying' },
  sad: { techniqueId: 'resonance', remedy: 'steadying' },
  drained: { techniqueId: 'morning-charge', remedy: 'energizing' },
  flat: { techniqueId: 'morning-charge', remedy: 'energizing' },
  numb: { techniqueId: 'resonance', remedy: 'steadying' },
  lonely: { techniqueId: 'relaxing', remedy: 'steadying' },
  hopeless: { techniqueId: 'resonance', remedy: 'steadying' },
};

export function moodFeelingOffer(
  feeling: string | null,
): (MoodFeelingOffer & { feeling: MoodFeelingId }) | null {
  if (!isMoodFeelingId(feeling)) return null;
  const offer = OFFER_FOR_FEELING[feeling];
  return offer == null ? null : { ...offer, feeling };
}
