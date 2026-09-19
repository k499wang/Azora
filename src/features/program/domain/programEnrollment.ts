/**
 * Enrolling is compiling, and advancing is a rule — both pure, both here.
 *
 * The point of a resolved snapshot is that the plan a user accepted keeps
 * meaning what it meant. Recommendation rules change, defaults change, copy gets
 * re-authored; none of that may reach into a running enrollment. So enrollment
 * resolves once, writes down what it chose and why, and every screen afterwards
 * reads that instead of re-deriving anything from old answers.
 *
 * `RESOLVER_VERSION` is stored with the snapshot so a future resolver can tell
 * what produced it. Bump it when the *meaning* of resolution changes, never for
 * a refactor.
 */

import {
  activityCompletionCriteria,
  completionProvesActivity,
  type ProgramActivityRegistry,
  type ProgramCompletionEvidence,
} from './programActivity';
import {
  PROGRAM_ACTIVITIES,
  programPresetRevision,
  type ProgramPlanId,
  type ProgramPresetRevision,
} from './programCatalogue';

export const RESOLVER_VERSION = 1;

export type ProgramEnrollmentStatus = 'active' | 'completed' | 'abandoned';

/**
 * One day of the plan as it was resolved for this user: which activity, and the
 * reason it is there. Frozen at enrollment so re-authoring the catalogue cannot
 * change what someone is part-way through.
 */
export interface ResolvedProgramActivity {
  activityId: string;
  activityRevision: number;
  /**
   * What would satisfy this activity, written down rather than derived.
   *
   * The server checks a completion against this, so `advance_program_day` never
   * has to know what a technique is or take meaning from an activity id. An
   * activity whose modality the server cannot check refuses instead of counting.
   */
  match: ProgramCompletionEvidence;
}

export interface ResolvedProgramDay {
  day: number;
  why: string;
  /** Everything the day asks for, in the order it is meant to be done. */
  activities: readonly ResolvedProgramActivity[];
}

export interface ProgramEnrollmentV3 {
  version: 3;
  enrollmentId: string;
  planId: ProgramPlanId;
  presetRevision: number;
  resolverVersion: number;
  enrolledOn: string;
  /** 1-based. The day that is available now, not the last one finished. */
  programDay: number;
  lastAdvancedOn: string | null;
  status: ProgramEnrollmentStatus;
  resolved: {
    days: readonly ResolvedProgramDay[];
  };
}

export type ProgramResolutionResult =
  | { status: 'resolved'; days: readonly ResolvedProgramDay[] }
  /** The plan exists but has no authored days yet. */
  | { status: 'unauthored'; planId: ProgramPlanId }
  /** A day names an activity that is not in the registry. */
  | { status: 'invalid'; reason: string };

/**
 * Compiles a preset revision into the days this user will actually be given.
 *
 * Refusing is a real outcome and not an error to swallow: a plan whose content
 * is missing must leave the user on what they had, because a named plan with
 * empty days is worse than no plan at all.
 */
export function resolveProgramDays(
  preset: ProgramPresetRevision,
  activities: ProgramActivityRegistry = PROGRAM_ACTIVITIES,
): ProgramResolutionResult {
  if (preset.days.length === 0) {
    return { status: 'unauthored', planId: preset.planId };
  }

  const days: ResolvedProgramDay[] = [];
  for (const definition of preset.days) {
    const resolved: ResolvedProgramActivity[] = [];
    for (const activityId of definition.activityIds) {
      const activity = activities.get(activityId);
      if (activity == null) {
        return {
          status: 'invalid',
          reason: `${preset.planId} day ${definition.day} names unknown activity ${activityId}`,
        };
      }
      resolved.push({
        activityId: activity.id,
        activityRevision: activity.revision,
        match: activityCompletionCriteria(activity),
      });
    }
    days.push({
      day: definition.day,
      why: definition.why,
      activities: resolved,
    });
  }

  return { status: 'resolved', days };
}

export interface BuildEnrollmentInput {
  enrollmentId: string;
  planId: ProgramPlanId;
  presetRevision: number;
  /** The local date enrollment happened, `YYYY-MM-DD`. */
  enrolledOn: string;
}

export type BuildEnrollmentResult =
  | { status: 'enrolled'; enrollment: ProgramEnrollmentV3 }
  | { status: 'refused'; reason: string };

/** A named plan always starts at day one. */
export function buildProgramEnrollment(
  input: BuildEnrollmentInput,
  activities: ProgramActivityRegistry = PROGRAM_ACTIVITIES,
): BuildEnrollmentResult {
  const preset = programPresetRevision(input.planId, input.presetRevision);
  if (preset == null) {
    return {
      status: 'refused',
      reason: `No published revision ${input.presetRevision} of ${input.planId}`,
    };
  }

  const resolution = resolveProgramDays(preset, activities);
  if (resolution.status !== 'resolved') {
    return {
      status: 'refused',
      reason:
        resolution.status === 'unauthored'
          ? `${input.planId} has no authored days`
          : resolution.reason,
    };
  }

  return {
    status: 'enrolled',
    enrollment: {
      version: 3,
      enrollmentId: input.enrollmentId,
      planId: input.planId,
      presetRevision: preset.revision,
      resolverVersion: RESOLVER_VERSION,
      enrolledOn: input.enrolledOn,
      programDay: 1,
      lastAdvancedOn: null,
      status: 'active',
      resolved: { days: resolution.days },
    },
  };
}

export function programEnrollmentLength(
  enrollment: ProgramEnrollmentV3,
): number {
  return enrollment.resolved.days.length;
}

export function currentProgramDay(
  enrollment: ProgramEnrollmentV3,
): ResolvedProgramDay | null {
  return (
    enrollment.resolved.days.find(
      (day) => day.day === enrollment.programDay,
    ) ?? null
  );
}

/**
 * Which day of the plan today is, which is not always where the plan resumes.
 *
 * `programDay` is where the next day's work starts. The moment the last of a
 * day's activities is finished the server moves it on, under the same lock that
 * records the completion — so an enrollment read a second later already points
 * at the day after.
 *
 * Read literally, that is what broke the day someone actually did everything
 * asked of them: they finished their one exercise, the plan moved to day two,
 * and Home swapped the exercise they had just completed for a fresh unfinished
 * one. Nothing was lost — the completion is stored and the day did advance —
 * but on screen the work had simply not counted. Worse, the new day cannot be
 * done either: the server refuses a second advance on the same local date, so
 * the row was unfinishable as well as unfinished.
 *
 * So a day finished today stays on screen until the calendar turns.
 * `lastAdvancedOn` is the server's own record of when that happened, written in
 * the same statement as the move, which is why this needs no second source of
 * truth and cannot disagree with one.
 */
export function programDayForDate(
  enrollment: ProgramEnrollmentV3,
  localDate: string,
): number {
  const finishedToday =
    enrollment.status === 'active' &&
    enrollment.lastAdvancedOn === localDate &&
    enrollment.programDay > 1;

  return finishedToday ? enrollment.programDay - 1 : enrollment.programDay;
}

/** The day today is showing, resolved. Null when the plan does not author it. */
export function programDayOnDate(
  enrollment: ProgramEnrollmentV3,
  localDate: string,
): ResolvedProgramDay | null {
  const day = programDayForDate(enrollment, localDate);
  return enrollment.resolved.days.find((entry) => entry.day === day) ?? null;
}

export type AdvanceRefusal =
  | 'not_active'
  | 'already_advanced_today'
  | 'no_current_day'
  | 'completion_does_not_match';

export type AdvanceProgramDayResult =
  /** Counted, and the day still has work left on it. */
  | { status: 'recorded'; activityId: string; remaining: number }
  | { status: 'advanced'; enrollment: ProgramEnrollmentV3 }
  | { status: 'completed'; enrollment: ProgramEnrollmentV3 }
  | { status: 'refused'; reason: AdvanceRefusal };

export interface AdvanceProgramDayInput {
  enrollment: ProgramEnrollmentV3;
  /** What the user just finished. */
  evidence: ProgramCompletionEvidence;
  /** The user's local date, `YYYY-MM-DD`. */
  localDate: string;
  /**
   * Today's activities already recorded, by activity id.
   *
   * The day only turns over when its last piece lands, so the rule has to know
   * what is already behind it. Read from `program_action_completions` rather
   * than trusted from the device.
   */
  completedActivityIds?: readonly string[];
}

/**
 * The advancement rule, stated once.
 *
 * The server owns the write — this is the same decision, made locally so the
 * client can show the result without waiting and so the rule can be tested
 * without a database. The RPC re-runs it under a row lock; if the two ever
 * disagree, the server wins and the client refetches.
 *
 * A day can ask for one exercise or three, and it advances only when every one
 * of them is done. That is the whole progression: the plan gets harder by
 * asking for more, not by asking longer.
 *
 * Three refusals matter and none of them is an error:
 *
 * - **Already advanced today.** A day the plan has moved past cannot be moved
 *   again by a keen evening, or a week of plan disappears in one night.
 * - **Wrong activity.** Any session still counts for the streak and the room; it
 *   just does not move a plan that asked for something else.
 * - **Not active.** A finished plan does not roll over into another day.
 *
 * Missing a day is not on the list. The day simply stays available: there is no
 * catch-up, no backlog and nothing to lose by being away.
 */
export function advanceProgramDay({
  enrollment,
  evidence,
  localDate,
  completedActivityIds = [],
}: AdvanceProgramDayInput): AdvanceProgramDayResult {
  if (enrollment.status !== 'active') {
    return { status: 'refused', reason: 'not_active' };
  }
  if (enrollment.lastAdvancedOn === localDate) {
    return { status: 'refused', reason: 'already_advanced_today' };
  }

  const today = currentProgramDay(enrollment);
  if (today == null) {
    return { status: 'refused', reason: 'no_current_day' };
  }

  // The first activity of the day this completion satisfies and that is not
  // already recorded. Two days on the same technique are two separate days, and
  // a repeated session within one day counts once.
  const matched = today.activities.find((candidate) => {
    if (completedActivityIds.includes(candidate.activityId)) return false;
    const activity = PROGRAM_ACTIVITIES.get(candidate.activityId);
    return activity != null && completionProvesActivity(activity, evidence);
  });

  if (matched == null) {
    return { status: 'refused', reason: 'completion_does_not_match' };
  }

  const done = new Set([...completedActivityIds, matched.activityId]);
  const remaining = today.activities.filter(
    (candidate) => !done.has(candidate.activityId),
  ).length;

  if (remaining > 0) {
    return { status: 'recorded', activityId: matched.activityId, remaining };
  }

  const isLastDay = today.day >= programEnrollmentLength(enrollment);

  return {
    status: isLastDay ? 'completed' : 'advanced',
    enrollment: {
      ...enrollment,
      programDay: isLastDay ? today.day : today.day + 1,
      lastAdvancedOn: localDate,
      status: isLastDay ? 'completed' : 'active',
    },
  };
}

/**
 * How many exercises today asks for, which is never a constant.
 *
 * Today's day, read the way every screen reads it: `programDay` moves the
 * moment the last piece of a day lands, so taking the count straight from it
 * would have the evening of a finished day ask for tomorrow's workload — a
 * reminder booked for an exercise the plan does not hand over until the
 * calendar turns. See `programDayForDate`.
 */
export function programDayActivityCount(
  enrollment: ProgramEnrollmentV3,
  localDate: string,
): number {
  return programDayOnDate(enrollment, localDate)?.activities.length ?? 0;
}
