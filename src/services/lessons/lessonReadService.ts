import { requireSupabaseClient } from '../supabase/client';
import type { Json } from '../supabase/database.types';
import type { LessonId } from '../../features/lessons/domain/lessonCatalogue';

/** Postgres/PostgREST codes for "that table or function is not here". */
const MISSING_SCHEMA_CODES = new Set(['42P01', '42883', 'PGRST202', 'PGRST205']);

function isMissingSchema(error: { code?: string } | null): boolean {
  return error?.code != null && MISSING_SCHEMA_CODES.has(error.code);
}

export type RecordLessonReadOutcome =
  | 'recorded'
  | 'no_active_enrollment'
  | 'invalid_lesson'
  | 'invalid_date'
  /** The function is not on this backend yet. Nothing was written. */
  | 'unavailable';

export interface RecordLessonReadResponse {
  outcome: RecordLessonReadOutcome;
  /** The day the server decided it landed on, which the client is not asked. */
  programDay: number | null;
  activityId: string | null;
}

export interface RecordLessonReadRequest {
  lessonId: LessonId;
  revision: number;
  localDate: string;
}

/**
 * Writes down that the day's lesson was read.
 *
 * Through the definer function rather than an insert, because the table has no
 * insert policy: a client that could write its own completion rows could credit
 * itself a day it never did. The server decides which program day the row lands
 * on — the client's day number is never sent, and would not be believed.
 */
export async function recordLessonRead(
  request: RecordLessonReadRequest,
): Promise<RecordLessonReadResponse> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('record_lesson_read', {
    p_read: {
      lessonId: request.lessonId,
      revision: request.revision,
      localDate: request.localDate,
    } as unknown as Json,
  });

  if (error != null) {
    if (isMissingSchema(error)) {
      return { outcome: 'unavailable', programDay: null, activityId: null };
    }
    throw error;
  }

  const record = (data ?? {}) as Record<string, unknown>;
  return {
    outcome:
      typeof record.outcome === 'string'
        ? (record.outcome as RecordLessonReadOutcome)
        : 'unavailable',
    programDay:
      typeof record.programDay === 'number' ? record.programDay : null,
    activityId:
      typeof record.activityId === 'string' ? record.activityId : null,
  };
}
