/**
 * The daily check-in: what is asked, what the answers add up to, and what the
 * app does about a bad one.
 *
 * Pure on purpose. The screen animates and the service stores, but the thing
 * worth being careful about is the meaning — which direction each scale runs,
 * what counts as a bad day, and which exercise a bad day earns. That is all
 * here, where it can be read and tested without a device.
 */

import type { TechniqueId } from '../../exercise/guidedBreathing/techniqueCatalog';

/**
 * Bumped when the questions change in a way that changes what an answer meant.
 * Stored on every row, so a chart drawn next year can tell a 3 from this set
 * apart from a 3 from the set that replaces it.
 */
export const MOOD_SCALE_REVISION = 1;

export const MOOD_SCALE_MIN = 1;
export const MOOD_SCALE_MAX = 5;

export type MoodScaleId = 'overall' | 'energy' | 'sleep';

export interface MoodQuestion {
  id: MoodScaleId;
  /** What the screen asks, in the second person. */
  question: string;
  /**
   * What each point on the scale is called, from 1 to 5.
   *
   * Every one sits under its own face, five across a phone, so each has about
   * seven characters a line at reading size and two lines to use. A label may
   * wrap — the row reserves both lines whether or not it does — but a single
   * word longer than the column has nowhere to break and would be clipped, so
   * the length is held by test rather than by care.
   */
  labels: readonly [string, string, string, string, string];
}

/**
 * The face at each point of the scale, worst to best.
 *
 * One set for all four questions. Five faces that mean the same five things
 * wherever they appear is what lets somebody answer the fourth question without
 * re-reading it — the shape of the row is the scale, and only the words under it
 * change. Four different sets of faces would make each question a fresh puzzle.
 */
export const MOOD_FACES = [
  'face-sad',
  'face-meh',
  'face-neutral',
  'face-calm',
  'face-happy',
] as const;

export type MoodFaceName = (typeof MOOD_FACES)[number];

export function moodFaceFor(rating: number): MoodFaceName {
  const index = Math.min(
    Math.max(Math.round(rating) - MOOD_SCALE_MIN, 0),
    MOOD_FACES.length - 1,
  );
  return MOOD_FACES[index];
}

/**
 * Three scales, every one of them phrased so that **higher is better**.
 *
 * "How stressed are you?" would have run the other way, and a mixed set is how
 * an average silently becomes meaningless: one reversed scale turns a bad day
 * into an average one. The direction is a property of the whole set rather than
 * of each question.
 *
 * No question carries a subtitle. Every face has its word under it, so the
 * scale explains itself; a line of help above a row that is already legible is
 * one more thing to read on a screen whose whole point is that there is only
 * one thing on it.
 */
export const MOOD_SCALES: readonly MoodQuestion[] = [
  {
    id: 'overall',
    question: 'How are you doing?',
    labels: ['Rough', 'Not great', 'Okay', 'Good', 'Great'],
  },
  {
    id: 'energy',
    question: "How's your energy?",
    labels: ['Empty', 'Low', 'Steady', 'Good', 'Full'],
  },
  {
    id: 'sleep',
    question: 'How did you sleep?',
    labels: ['Badly', 'Poorly', 'Okay', 'Well', 'Deeply'],
  },
];

export type MoodAnswers = Partial<Record<MoodScaleId, number>>;
/** Every scale answered, which is the only shape that may be stored. */
export type CompleteMoodAnswers = Record<MoodScaleId, number>;

export function isMoodScaleId(value: unknown): value is MoodScaleId {
  return MOOD_SCALES.some((question) => question.id === value);
}

function isValidRating(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MOOD_SCALE_MIN &&
    value <= MOOD_SCALE_MAX
  );
}

/** Whether every question has an answer this build knows how to read. */
export function isCompleteMoodAnswers(
  answers: MoodAnswers,
): answers is CompleteMoodAnswers {
  return MOOD_SCALES.every((question) => isValidRating(answers[question.id]));
}

/**
 * A stored answer set, read back defensively.
 *
 * The column is jsonb and the questions change, so a row can hold a scale this
 * build no longer asks or be missing one it now does. Unknown keys are dropped
 * and missing ones stay missing rather than being filled with a middle value: a
 * 3 nobody gave is the one number that would quietly flatter a bad week.
 */
export function sanitizeMoodAnswers(raw: unknown): MoodAnswers {
  if (raw == null || typeof raw !== 'object') return {};

  const answers: MoodAnswers = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isMoodScaleId(key) || !isValidRating(value)) continue;
    answers[key] = value;
  }
  return answers;
}

/**
 * The day as one number, 0 to 100.
 *
 * A plain mean of the scales. Not weighted: a weighting is a claim about which
 * part of someone's day matters most, and we have no evidence for one. Stored
 * rather than recomputed, so a chart drawn next year does not depend on this
 * build's questions still existing.
 */
export function moodScore(answers: CompleteMoodAnswers): number {
  const ratings = MOOD_SCALES.map((question) => answers[question.id]);
  const mean = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  return Math.round(
    ((mean - MOOD_SCALE_MIN) / (MOOD_SCALE_MAX - MOOD_SCALE_MIN)) * 100,
  );
}

/**
 * A stored score put back on the five points it was answered on.
 *
 * The score is a percentage of a mean of three 1-to-5 answers, which is the
 * right shape for comparing days and the wrong shape for drawing one: a grid
 * of days has five colours because the check-in has five faces, and a day has
 * to land on one of them.
 */
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

/**
 * The longest a check-in's line may be.
 *
 * A line, not a journal. The check-in is the thing that has to cost nothing to
 * answer, and a box that invites paragraphs is a box people skip on the days
 * they have least to give — which are the days worth hearing about.
 */
export const MOOD_NOTE_MAX_LENGTH = 280;

/**
 * A written line, read back and written out defensively.
 *
 * Whitespace-only is nothing written, not an empty string stored: a row with
 * `''` in it would render as a note that exists and says nothing.
 */
export function sanitizeMoodNote(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, MOOD_NOTE_MAX_LENGTH);
  return trimmed.length === 0 ? null : trimmed;
}

export function moodLevel(score: number): MoodLevel {
  const clamped = Math.min(Math.max(score, 0), 100);
  const mean =
    MOOD_SCALE_MIN + (clamped / 100) * (MOOD_SCALE_MAX - MOOD_SCALE_MIN);
  return Math.round(mean) as MoodLevel;
}

/**
 * Where the day stands, for copy that has to say something back.
 *
 * Three bands rather than a number, because the check-in answers a person and
 * "62" answers nobody. `low` is the band that earns a recommendation.
 */
export type MoodBand = 'low' | 'middling' | 'good';

/** A mean at or below 2.5 of 5. Half the scale, and not a judgement call. */
const LOW_SCORE_CEILING = 37;
const GOOD_SCORE_FLOOR = 63;

export function moodBand(score: number): MoodBand {
  if (score <= LOW_SCORE_CEILING) return 'low';
  if (score >= GOOD_SCORE_FLOOR) return 'good';
  return 'middling';
}

/**
 * The face the reply page shows, from the band the reply page is speaking.
 *
 * Read off the band, never off one scale. It used to take the face for whatever
 * they rated "How are you doing?", which is one of three answers the reply is
 * not based on: somebody could rate that a 3, score well on the other two, and
 * be told "Good to hear" under a flat, neutral face. The sentence and the face
 * are the same statement, so they come from the same number.
 */
export function moodFaceForBand(band: MoodBand): MoodFaceName {
  switch (band) {
    case 'low':
      return 'face-sad';
    case 'middling':
      return 'face-neutral';
    case 'good':
      return 'face-happy';
  }
}

/**
 * The scale that dragged the day down, which is what a recommendation answers.
 *
 * Ties break in question order, and question order is the order they were
 * asked in: `overall` first, because if everything is equally low then what
 * they said about the day as a whole is the honest thing to respond to.
 */
export function weakestMoodScale(answers: CompleteMoodAnswers): MoodScaleId {
  let weakest = MOOD_SCALES[0];
  for (const question of MOOD_SCALES) {
    if (answers[question.id] < answers[weakest.id]) weakest = question;
  }
  return weakest.id;
}

/**
 * What each scale earns when the feeling itself asks for nothing.
 *
 * Drawn from the same techniques the plans are built from, so a suggestion is
 * never something the app cannot deliver. None is high-ventilation: Wim Hof and
 * Bellows are not offered to somebody on a bad day, or on any day, until the
 * acknowledgement they need exists.
 */
const TECHNIQUE_FOR_SCALE: Record<MoodScaleId, TechniqueId> = {
  energy: 'morning-charge',
  sleep: 'relaxing',
  overall: 'resonance',
};

/**
 * The one word the recommendation is described by.
 *
 * "Calming" is wrong for somebody flat on their back — that one is offered the
 * opposite — so the adjective travels with the technique rather than being
 * written once into the sentence.
 */
export type MoodRemedy = 'steadying' | 'energizing' | 'wind-down';

const REMEDY_FOR_SCALE: Record<MoodScaleId, MoodRemedy> = {
  overall: 'steadying',
  energy: 'energizing',
  sleep: 'wind-down',
};

export interface MoodSuggestion {
  /** The scale that dragged the day down, which the offer answers. */
  answering: MoodScaleId;
  techniqueId: TechniqueId;
  remedy: MoodRemedy;
}

/**
 * What the screen says above the offer.
 *
 * Their own sentence, with the remedy in it. A single line rather than a
 * headline and a subtitle: the page is one statement and two buttons, and a
 * second paragraph would make it a page to read rather than a choice to make.
 */
export function moodRecommendationLine(remedy: MoodRemedy): string {
  return `We understand how you are feeling. We recommend a short ${remedy} exercise to help you feel better.`;
}

/**
 * What to offer after a check-in, or nothing.
 *
 * Only a low day earns an offer. An app that answers "I'm good" with a list of
 * exercises is not listening, it is selling — and the one thing the check-in
 * has to be is a question rather than a funnel.
 */
export function moodSuggestion(
  answers: CompleteMoodAnswers,
): MoodSuggestion | null {
  if (moodBand(moodScore(answers)) !== 'low') return null;

  const scale = weakestMoodScale(answers);
  return {
    answering: scale,
    techniqueId: TECHNIQUE_FOR_SCALE[scale],
    remedy: REMEDY_FOR_SCALE[scale],
  };
}

/**
 * What the app says back.
 *
 * On a low day this is the headline over an offer, not the whole reply — the
 * page it sits on is carried by the exercise underneath it. It used to thank
 * the user for answering, which is the app congratulating itself for having
 * asked, and it left the actual help buried under a label further down.
 *
 * Never congratulatory about a bad day. `design.md` principle: numbers never
 * flatter, and neither does this.
 */
export function moodReply(band: MoodBand): string {
  switch (band) {
    case 'low':
      return 'We understand how you feel.';
    case 'middling':
      return 'Logged. Somewhere in the middle is most days, honestly.';
    case 'good':
      return 'Good to hear. Logged.';
  }
}
