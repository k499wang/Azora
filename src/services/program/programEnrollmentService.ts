/**
 * Reading, starting and advancing the user's plan.
 *
 * Progress is never written from here. `program_day` moves only through
 * `advance_program_day`, which locks the row and re-checks the rule server-side;
 * this module hands it a completion and takes back whatever the server decided.
 *
 * Every read tolerates the tables not being there. A build can reach a project
 * whose migration has not been applied — a TestFlight tester on an older
 * backend, a staging database, a rollback — and the right answer then is "this
 * user has no plan", which is exactly the state the app already handles. It is
 * never a crash on Home.
 */

import { requireSupabaseClient } from '../supabase';
import type { Json } from '../supabase/database.types';
import {
  buildProgramEnrollment,
  type ProgramEnrollmentStatus,
  type ProgramEnrollmentV3,
  type ResolvedProgramDay,
} from '../../features/program/domain/programEnrollment';
import type { ProgramPlanId } from '../../features/program/domain/programCatalogue';

/** Postgres/PostgREST codes for "that table or function is not here". */
const MISSING_SCHEMA_CODES = new Set(['42P01', '42883', 'PGRST202', 'PGRST205']);

function isMissingSchema(error: { code?: string } | null): boolean {
  return error?.code != null && MISSING_SCHEMA_CODES.has(error.code);
}

interface EnrollmentRow {
  id: string;
  plan_id: string;
  preset_revision: number;
  resolver_version: number;
  enrolled_on: string;
  program_day: number;
  last_advanced_on: string | null;
  status: string;
  resolved: unknown;
}

const ENROLLMENT_COLUMNS =
  'id, plan_id, preset_revision, resolver_version, enrolled_on, program_day, last_advanced_on, status, resolved';

const PLAN_IDS: readonly ProgramPlanId[] = [
  'night',
  'morning',
  'pressure',
  'focus',
  'quiet',
  'home',
  'phone',
  'recovery',
  'selfTrust',
];

function isPlanId(value: unknown): value is ProgramPlanId {
  return PLAN_IDS.includes(value as ProgramPlanId);
}

function isStatus(value: unknown): value is ProgramEnrollmentStatus {
  return value === 'active' || value === 'completed' || value === 'abandoned';
}

/**
 * The stored snapshot, checked rather than trusted.
 *
 * The row outlives the build that wrote it and may have been written by a newer
 * one. A snapshot this build cannot read is refused whole — a half-read plan
 * would put someone on a day that does not describe what they were given.
 */
function sanitizeResolvedDays(raw: unknown): readonly ResolvedProgramDay[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const days: ResolvedProgramDay[] = [];
  for (const [index, entry] of raw.entries()) {
    if (entry == null || typeof entry !== 'object') return null;
    const record = entry as Record<string, unknown>;
    const activities = record.activities;
    if (
      record.day !== index + 1 ||
      typeof record.why !== 'string' ||
      !Array.isArray(activities) ||
      activities.length === 0
    ) {
      return null;
    }

    const resolved = [];
    for (const candidate of activities) {
      if (candidate == null || typeof candidate !== 'object') return null;
      const activity = candidate as Record<string, unknown>;
      const match = activity.match as Record<string, unknown> | undefined;
      if (
        typeof activity.activityId !== 'string' ||
        typeof activity.activityRevision !== 'number' ||
        match == null ||
        typeof match.modality !== 'string'
      ) {
        return null;
      }
      resolved.push({
        activityId: activity.activityId,
        activityRevision: activity.activityRevision,
        match: {
          modality: match.modality as ResolvedProgramDay['activities'][number]['match']['modality'],
          techniqueId:
            typeof match.techniqueId === 'string' ? match.techniqueId : undefined,
        },
      });
    }

    days.push({
      day: record.day,
      why: record.why,
      activities: resolved,
      // Active plans created before exact lesson ids were frozen still require
      // a lesson; new plans additionally validate which lesson it was.
      lessonActivityId:
        typeof record.lessonActivityId === 'string' && record.lessonActivityId.length > 0
          ? record.lessonActivityId
          : null,
    });
  }

  return days;
}

export function sanitizeEnrollmentRow(
  row: EnrollmentRow,
): ProgramEnrollmentV3 | null {
  const resolvedRecord = row.resolved as Record<string, unknown> | null;
  const days = sanitizeResolvedDays(resolvedRecord?.days);

  if (
    days == null ||
    !isPlanId(row.plan_id) ||
    !isStatus(row.status) ||
    !Number.isInteger(row.program_day) ||
    row.program_day < 1
  ) {
    return null;
  }

  return {
    version: 3,
    enrollmentId: row.id,
    planId: row.plan_id,
    presetRevision: row.preset_revision,
    resolverVersion: row.resolver_version,
    enrolledOn: row.enrolled_on,
    programDay: row.program_day,
    lastAdvancedOn: row.last_advanced_on,
    status: row.status,
    resolved: { days },
  };
}

export async function getCurrentProgramEnrollment(
  userId: string,
): Promise<ProgramEnrollmentV3 | null> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('program_enrollments')
    .select(ENROLLMENT_COLUMNS)
    .eq('user_id', userId)
    .in('status', ['active', 'completed'])
    // Active sorts before completed; otherwise retain the latest finished plan.
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error != null) {
    if (isMissingSchema(error)) return null;
    throw error;
  }

  return data == null ? null : sanitizeEnrollmentRow(data as EnrollmentRow);
}

export interface StartProgramInput {
  userId: string;
  planId: ProgramPlanId;
  presetRevision: number;
  /** The user's local date, `YYYY-MM-DD`. */
  enrolledOn: string;
}

/**
 * Starts a plan at day one.
 *
 * Resolution happens here rather than on the server so the snapshot is the same
 * object the domain tests cover. A plan whose content this build cannot resolve
 * is not started at all — better no plan than a named one with nothing in it.
 */
export async function startProgramEnrollment({
  userId,
  planId,
  presetRevision,
  enrolledOn,
}: StartProgramInput): Promise<ProgramEnrollmentV3 | null> {
  const built = buildProgramEnrollment({
    // Replaced by the row's own id; the database owns identity.
    enrollmentId: '',
    planId,
    presetRevision,
    enrolledOn,
  });

  if (built.status === 'refused') return null;

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('program_enrollments')
    .insert({
      user_id: userId,
      plan_id: planId,
      preset_revision: presetRevision,
      resolver_version: built.enrollment.resolverVersion,
      enrolled_on: enrolledOn,
      resolved: { days: built.enrollment.resolved.days } as unknown as Json,
    })
    .select(ENROLLMENT_COLUMNS)
    .single();

  if (error != null) {
    if (isMissingSchema(error)) return null;
    throw error;
  }

  return sanitizeEnrollmentRow(data as EnrollmentRow);
}

/** The activity ids already credited for a given day of a given enrollment. */
export async function getProgramDayCompletions(
  userId: string,
  enrollmentId: string,
  programDay: number,
): Promise<readonly string[]> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('program_action_completions')
    .select('activity_id')
    .eq('user_id', userId)
    .eq('enrollment_id', enrollmentId)
    .eq('program_day', programDay);

  if (error != null) {
    if (isMissingSchema(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => (row as { activity_id: string }).activity_id);
}

export type AdvanceOutcome =
  | 'advanced'
  | 'completed'
  | 'recorded'
  | 'already_advanced_today'
  | 'completion_does_not_match'
  | 'no_current_day'
  | 'no_active_enrollment'
  | 'unavailable';

export interface AdvanceProgramDayResponse {
  outcome: AdvanceOutcome;
  remaining: number | null;
  enrollment: ProgramEnrollmentV3 | null;
}

export interface AdvanceProgramDayRequest {
  localDate: string;
  modality: 'breathing';
  techniqueId: string;
  /** The session row that proves it, when the caller has one. */
  breathingSessionId?: string | null;
}

/**
 * Hands a finished piece of work to the server and takes back its decision.
 *
 * Refusals are ordinary answers, not errors: finishing something the plan did
 * not ask for is a perfectly normal thing to do, and it must not surface as a
 * failure to the user.
 */
export async function advanceProgramDayRemote(
  request: AdvanceProgramDayRequest,
): Promise<AdvanceProgramDayResponse> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('advance_program_day', {
    p_completion: {
      local_date: request.localDate,
      modality: request.modality,
      technique_id: request.techniqueId,
      breathing_session_id: request.breathingSessionId ?? null,
    } as unknown as Json,
  });

  if (error != null) {
    if (isMissingSchema(error)) {
      return { outcome: 'unavailable', remaining: null, enrollment: null };
    }
    throw error;
  }

  const record = (data ?? {}) as Record<string, unknown>;
  const outcome = record.outcome;
  const row = record.enrollment as EnrollmentRow | undefined;

  return {
    outcome: typeof outcome === 'string' ? (outcome as AdvanceOutcome) : 'unavailable',
    remaining: typeof record.remaining === 'number' ? record.remaining : null,
    enrollment: row == null ? null : sanitizeEnrollmentRow(row),
  };
}
