/**
 * The daily check-in: what is asked, and what the answers add up to.
 *
 * Pure on purpose. The screen animates and the service stores, but the thing
 * worth being careful about is the meaning — which direction each scale runs,
 * and what counts as a bad day. That is all
 * here, where it can be read and tested without a device.
 */

import { daysBetweenLocalDates } from '../../plan/domain/azoraScore';
import { moodFeelingLabel } from './moodFeelings';

/**
 * Bumped when the questions change in a way that changes what an answer meant.
 * Stored on every row, so a chart drawn next year can tell a 3 from this set
 * apart from a 3 from the set that replaces it.
 */
export const MOOD_SCALE_REVISION = 2;

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
 * Shared by the check-in and its historical mood displays.
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

/** The direct mood rating, with higher meaning a more pleasant mood. */
export const MOOD_SCALES: readonly MoodQuestion[] = [
  {
    id: 'overall',
    question: 'How are you feeling?',
    labels: ['Rough', 'Not great', 'Okay', 'Good', 'Great'],
  },
];

export type MoodAnswers = Partial<Record<MoodScaleId, number>>;
/** Every scale answered, which is the only shape that may be stored. */
export type CompleteMoodAnswers = MoodAnswers & { overall: number };

export function isMoodScaleId(value: unknown): value is MoodScaleId {
  // Preserve revision 1 answers when reading historical entries.
  return value === 'overall' || value === 'energy' || value === 'sleep';
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

/** Mood alone as 0–100. Historical stored scores remain unchanged. */
export function moodScore(answers: CompleteMoodAnswers): number {
  return Math.round(
    ((answers.overall - MOOD_SCALE_MIN) / (MOOD_SCALE_MAX - MOOD_SCALE_MIN)) * 100,
  );
}

/** A stored 0–100 mood score mapped back to its five faces. */
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
 * "62" answers nobody.
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

/** Keep the reply face consistent with the mood band its sentence describes. */
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

/** Their word, lowercased to sit inside a sentence, or nothing. */
function feelingPrefix(feeling: string | null): string {
  const label = moodFeelingLabel(feeling);
  return label == null ? '' : `Feeling ${label.toLowerCase()}`;
}

/**
 * What the app says back.
 *
 * The headline over the suggested actions. It used to thank the user for
 * answering, which is the app congratulating itself for having asked.
 *
 * Never congratulatory about a bad day. `design.md` principle: numbers never
 * flatter, and neither does this.
 */
export function moodReply(band: MoodBand, feeling: string | null = null): string {
  return feelingPrefix(feeling) || bandReply(band);
}

function bandReply(band: MoodBand): string {
  switch (band) {
    case 'low':
      return 'Feeling low';
    case 'middling':
      return 'Feeling okay';
    case 'good':
      return 'Feeling good';
  }
}

/** A stored day, as much of it as a run of days is read by. */
export interface MoodDay {
  localDate: string;
  /** The stored 0–100 reading. */
  score: number;
}

/**
 * The recent run with today's row as it was just answered.
 *
 * The run is read from the server and may predate this check-in, or hold an
 * earlier answer for today that this one replaces. Newest first, like the run.
 */
export function withTodaysCheckIn<T extends MoodDay>(recent: readonly T[], today: T): T[] {
  return [today, ...recent.filter((day) => day.localDate !== today.localDate)].sort(
    (a, b) => (a.localDate < b.localDate ? 1 : a.localDate > b.localDate ? -1 : 0),
  );
}

/**
 * Where somebody who is not okay can find a person to talk to.
 *
 * An international directory that routes by country, so one link is right
 * wherever the app is used.
 */
export const MOOD_SUPPORT_URL = 'https://findahelpline.com';

/** How many low days in a row, and inside how many days, earn the link. */
const SUPPORT_RUN_DAYS = 3;
const SUPPORT_RUN_WINDOW_DAYS = 7;

export type MoodSupportReason = 'hopeless' | 'hard-run';

/**
 * Whether the reply should point at a person, and why.
 *
 * Two triggers. The word "hopeless" is enough by itself — it is the one word on
 * the list that asks for more than an exercise. Otherwise a run: the three most
 * recent check-ins, today's among them, all low and all inside a week. A week
 * because three low days scattered across a month are a person having a month,
 * not a run.
 *
 * The run wins when both hold, because it is the more specific thing to say.
 */
export function moodSupportReason(
  feeling: string | null,
  /** Newest first, today's row included. */
  days: readonly MoodDay[],
  todayLocalDate: string,
): MoodSupportReason | null {
  const latest = days.slice(0, SUPPORT_RUN_DAYS);
  const hardRun =
    latest.length === SUPPORT_RUN_DAYS &&
    latest.every(
      (day) =>
        moodBand(day.score) === 'low' &&
        daysBetweenLocalDates(day.localDate, todayLocalDate) <
          SUPPORT_RUN_WINDOW_DAYS,
    );

  if (hardRun) return 'hard-run';
  if (feeling === 'hopeless') return 'hopeless';
  return null;
}

export function moodSupportLine(reason: MoodSupportReason): string {
  switch (reason) {
    case 'hard-run':
      return 'A few hard days in a row. Talking to someone can help.';
    case 'hopeless':
      return 'That sounds heavy. Talking to someone can help.';
  }
}
