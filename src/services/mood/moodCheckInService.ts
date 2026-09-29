import { requireSupabaseClient } from '../supabase';
import type { Json } from '../supabase/database.types';
import {
  MOOD_SCALE_REVISION,
  moodScore,
  sanitizeMoodAnswers,
  sanitizeMoodNote,
  type CompleteMoodAnswers,
  type MoodAnswers,
} from '../../features/mood/domain/moodCheckIn';
import { sanitizeMoodTags } from '../../features/mood/domain/moodTags';
import {
  sanitizeMoodFeeling,
  type MoodFeelingId,
} from '../../features/mood/domain/moodFeelings';

const COLUMNS =
  'id, local_date, scale_revision, answers, score, tags, note, feeling, created_at';
/**
 * The row as it was before the feeling existed.
 *
 * Its own step rather than straight to the legacy shape, so a backend that is
 * behind by one migration keeps the tags and the note it already has.
 */
const WITHOUT_FEELING_COLUMNS =
  'id, local_date, scale_revision, answers, score, tags, note, created_at';
/**
 * The same row as it was before tags and the note existed.
 *
 * A build can ship before its migration is applied. A missing *table* is
 * already tolerated below; a missing *column* would otherwise fail the select
 * outright and leave a user unable to read or write a check-in at all, which
 * is worse than losing a feature they have never seen. One fallback covers
 * both of those columns: either missing means this backend is behind, and the
 * check-in itself matters more than telling the two cases apart.
 */
const LEGACY_COLUMNS = 'id, local_date, scale_revision, answers, score, created_at';

/** Newest shape first; each step drops what the one before it added. */
const COLUMN_FALLBACKS = [COLUMNS, WITHOUT_FEELING_COLUMNS, LEGACY_COLUMNS];

interface MoodCheckInRow {
  id: string;
  local_date: string;
  scale_revision: number;
  answers: Json;
  score: number;
  /** All absent on a backend that predates their columns. */
  tags?: unknown;
  note?: unknown;
  feeling?: unknown;
  created_at: string;
}

export interface MoodCheckIn {
  id: string;
  localDate: string;
  /** Which set of questions produced this. Answers outlive the wording. */
  scaleRevision: number;
  answers: MoodAnswers;
  /** What else was going on. Empty when none were given. */
  tags: string[];
  /** The line they wrote, or null when they wrote none. */
  note: string | null;
  /** The one word they picked, or null for "Not sure" or none offered. */
  feeling: MoodFeelingId | null;
  score: number;
  createdAt: string;
}

/**
 * Postgres codes for "this database does not have the check-in yet".
 *
 * A build can ship before its migration is applied, and a user on an older
 * backend must not see an error where a row is simply absent. The same
 * tolerance the program enrollment reads with, for the same reason.
 */
const MISSING_SCHEMA_CODES = new Set(['42P01', 'PGRST205']);
/** `undefined_column`, and PostgREST's name for a column it cannot find. */
const MISSING_COLUMN_CODES = new Set(['42703', 'PGRST204']);

function isMissingSchema(error: { code?: string } | null): boolean {
  return error?.code != null && MISSING_SCHEMA_CODES.has(error.code);
}

function isMissingColumn(error: { code?: string } | null): boolean {
  return error?.code != null && MISSING_COLUMN_CODES.has(error.code);
}

/**
 * Runs a query for the current row shape, and again for each older one while
 * this backend is missing a column the newer shape reads.
 */
async function withColumnFallback<T>(
  run: (columns: string) => PromiseLike<{ data: T; error: { code?: string } | null }>,
): Promise<{ data: T; error: { code?: string } | null }> {
  let attempt = await run(COLUMN_FALLBACKS[0]);
  for (const columns of COLUMN_FALLBACKS.slice(1)) {
    if (attempt.error == null || !isMissingColumn(attempt.error)) return attempt;
    attempt = await run(columns);
  }
  return attempt;
}

function mapCheckIn(row: MoodCheckInRow): MoodCheckIn {
  return {
    id: row.id,
    localDate: row.local_date,
    scaleRevision: row.scale_revision,
    answers: sanitizeMoodAnswers(row.answers),
    tags: sanitizeMoodTags(row.tags),
    note: sanitizeMoodNote(row.note),
    feeling: sanitizeMoodFeeling(row.feeling),
    score: row.score,
    createdAt: row.created_at,
  };
}

/**
 * Today's check-in, and whether this backend can hold one at all.
 *
 * Two states that look identical from a null and are not: "they have not
 * answered yet" and "this database has no check-in table". The day's completion
 * counts the check-in, so collapsing them would hand a user on an older backend
 * a day that can never be finished and a room that can never be unlocked.
 */
export interface MoodCheckInState {
  available: boolean;
  checkIn: MoodCheckIn | null;
}

export async function getMoodCheckIn(
  userId: string,
  localDate: string,
): Promise<MoodCheckInState> {
  const supabase = requireSupabaseClient();
  const { data, error } = await withColumnFallback((columns) =>
    supabase
      .from('mood_check_ins')
      .select(columns)
      .eq('user_id', userId)
      .eq('local_date', localDate)
      .maybeSingle(),
  );

  if (error != null) {
    if (isMissingSchema(error)) return { available: false, checkIn: null };
    throw error;
  }

  return {
    available: true,
    checkIn: data == null ? null : mapCheckIn(data as unknown as MoodCheckInRow),
  };
}

export interface SaveMoodCheckInInput {
  userId: string;
  localDate: string;
  answers: CompleteMoodAnswers;
  /** Chosen from `MOOD_TAGS`; anything else is dropped before it is written. */
  tags?: string[];
  /** Trimmed and capped before it is written; blank is stored as null. */
  note?: string | null;
  /** From `MOOD_FEELING_SETS`; anything else is stored as null. */
  feeling?: string | null;
}

/**
 * Writes today's check-in, replacing an earlier answer for the same day.
 *
 * Upsert rather than insert: someone who opens the check-in twice is correcting
 * themselves, not logging a second day, and two rows for one date is what would
 * silently double-weight a day in every chart drawn afterwards.
 *
 * Tags, the note and the feeling are written with the ratings and dropped on a
 * backend without their columns: losing one day's context is recoverable, and
 * refusing to store the day at all is not.
 */
export async function saveMoodCheckIn({
  userId,
  localDate,
  answers,
  tags = [],
  note,
  feeling,
}: SaveMoodCheckInInput): Promise<MoodCheckIn> {
  const supabase = requireSupabaseClient();
  const row = {
    user_id: userId,
    local_date: localDate,
    scale_revision: MOOD_SCALE_REVISION,
    answers: answers as unknown as Json,
    score: moodScore(answers),
  };
  const context = {
    tags: sanitizeMoodTags(tags),
    note: sanitizeMoodNote(note),
  };
  const payloadFor = (columns: string) => {
    if (columns === COLUMNS) {
      return { ...row, ...context, feeling: sanitizeMoodFeeling(feeling) };
    }
    if (columns === WITHOUT_FEELING_COLUMNS) return { ...row, ...context };
    return row;
  };
  const write = (columns: string) =>
    supabase
      .from('mood_check_ins')
      .upsert(payloadFor(columns), { onConflict: 'user_id,local_date' })
      .select(columns)
      .single();

  const { data, error } = await withColumnFallback(write);

  if (error != null) throw error;

  return mapCheckIn(data as unknown as MoodCheckInRow);
}

/**
 * The most recent check-ins, newest first, for the views that read a run of
 * days rather than one.
 */
export async function getRecentMoodCheckIns(
  userId: string,
  limit: number,
): Promise<MoodCheckIn[]> {
  const supabase = requireSupabaseClient();
  const { data, error } = await withColumnFallback((columns) =>
    supabase
      .from('mood_check_ins')
      .select(columns)
      .eq('user_id', userId)
      .order('local_date', { ascending: false })
      .limit(limit),
  );

  if (error != null) {
    if (isMissingSchema(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => mapCheckIn(row as unknown as MoodCheckInRow));
}
