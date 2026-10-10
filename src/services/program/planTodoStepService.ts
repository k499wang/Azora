import { requireSupabaseClient } from '../supabase/client';
import type { Json } from '../supabase/database.types';

/** Postgres/PostgREST codes for "that table or function is not here". */
const MISSING_SCHEMA_CODES = new Set(['42P01', '42883', 'PGRST202', 'PGRST205']);

function isMissingSchema(error: { code?: string } | null): boolean {
  return error?.code != null && MISSING_SCHEMA_CODES.has(error.code);
}

export type ClaimPlanTodoStepOutcome =
  | 'recorded'
  /** The day on screen does not ask for the step; nothing was written. */
  | 'not_required'
  /** No routine to-do is ticked on that date yet; nothing was written. */
  | 'no_todo_ticked'
  | 'no_active_enrollment'
  | 'invalid_date'
  /** The function is not on this backend yet. Nothing was written. */
  | 'unavailable';

export interface ClaimPlanTodoStepResponse {
  outcome: ClaimPlanTodoStepOutcome;
  /** Zero when the day was already claimed. */
  coinsAwarded: number;
  enrollmentId: string | null;
  /** The day the server decided the claim belongs to. */
  programDay: number | null;
  activityId: string | null;
}

export interface ClaimPlanTodoStepRequest {
  localDate: string;
}

/**
 * Claims today's "Do a to-do" step.
 *
 * Through the definer function, because completions have no insert policy. The
 * server checks a to-do was ticked on `localDate` and picks the plan day itself.
 * Refusals are answers, not errors, as with `advanceProgramDayRemote`.
 */
export async function claimPlanTodoStep(
  request: ClaimPlanTodoStepRequest,
): Promise<ClaimPlanTodoStepResponse> {
  const { data, error } = await requireSupabaseClient().rpc('claim_plan_todo_step', {
    p_claim: { localDate: request.localDate } as unknown as Json,
  });

  if (error != null) {
    if (isMissingSchema(error)) {
      return { outcome: 'unavailable', coinsAwarded: 0, enrollmentId: null, programDay: null, activityId: null };
    }
    throw error;
  }

  const record = (data ?? {}) as Record<string, unknown>;
  return {
    outcome:
      typeof record.outcome === 'string'
        ? (record.outcome as ClaimPlanTodoStepOutcome)
        : 'unavailable',
    coinsAwarded: typeof record.coinsAwarded === 'number' ? record.coinsAwarded : 0,
    enrollmentId: typeof record.enrollmentId === 'string' ? record.enrollmentId : null,
    programDay: typeof record.programDay === 'number' ? record.programDay : null,
    activityId: typeof record.activityId === 'string' ? record.activityId : null,
  };
}
