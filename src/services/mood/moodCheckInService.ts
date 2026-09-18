import { requireSupabaseClient } from '../supabase';
import type { Json } from '../supabase/database.types';
import {
  MOOD_SCALE_REVISION,
  moodScore,
  sanitizeMoodAnswers,
  type CompleteMoodAnswers,
  type MoodAnswers,
} from '../../features/mood/domain/moodCheckIn';

const COLUMNS = 'id, local_date, scale_revision, answers, score, created_at';

interface MoodCheckInRow {
  id: string;
  local_date: string;
  scale_revision: number;
  answers: Json;
  score: number;
  created_at: string;
}

export interface MoodCheckIn {
  id: string;
  localDate: string;
  /** Which set of questions produced this. Answers outlive the wording. */
  scaleRevision: number;
  answers: MoodAnswers;
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

function isMissingSchema(error: { code?: string } | null): boolean {
  return error?.code != null && MISSING_SCHEMA_CODES.has(error.code);
}

function mapCheckIn(row: MoodCheckInRow): MoodCheckIn {
  return {
    id: row.id,
    localDate: row.local_date,
    scaleRevision: row.scale_revision,
    answers: sanitizeMoodAnswers(row.answers),
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
  const { data, error } = await supabase
    .from('mood_check_ins')
    .select(COLUMNS)
    .eq('user_id', userId)
    .eq('local_date', localDate)
    .maybeSingle();

  if (error != null) {
    if (isMissingSchema(error)) return { available: false, checkIn: null };
    throw error;
  }

  return {
    available: true,
    checkIn: data == null ? null : mapCheckIn(data as MoodCheckInRow),
  };
}

export interface SaveMoodCheckInInput {
  userId: string;
  localDate: string;
  answers: CompleteMoodAnswers;
}

/**
 * Writes today's check-in, replacing an earlier answer for the same day.
 *
 * Upsert rather than insert: someone who opens the check-in twice is correcting
 * themselves, not logging a second day, and two rows for one date is what would
 * silently double-weight a day in every chart drawn afterwards.
 */
export async function saveMoodCheckIn({
  userId,
  localDate,
  answers,
}: SaveMoodCheckInInput): Promise<MoodCheckIn> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('mood_check_ins')
    .upsert(
      {
        user_id: userId,
        local_date: localDate,
        scale_revision: MOOD_SCALE_REVISION,
        answers: answers as unknown as Json,
        score: moodScore(answers),
      },
      { onConflict: 'user_id,local_date' },
    )
    .select(COLUMNS)
    .single();

  if (error != null) throw error;

  return mapCheckIn(data as MoodCheckInRow);
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
  const { data, error } = await supabase
    .from('mood_check_ins')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('local_date', { ascending: false })
    .limit(limit);

  if (error != null) {
    if (isMissingSchema(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => mapCheckIn(row as MoodCheckInRow));
}
