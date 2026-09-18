# Program Catalogue — Data Contract And Rollout

## Status

Proposed direction, not yet implemented. This is the storage and migration
companion to `program-catalogue-plan.md`. The product order is deliberate:
define useful plans first, then add only the data needed to deliver them.

## The short version

1. Plans are authored presets, not generated blobs.
2. Every published preset has an immutable revision.
3. A goal-specific profile compiles a preset revision into a resolved
   enrollment snapshot. Runtime code reads that snapshot instead of repeatedly
   interpreting old onboarding answers.
4. The snapshot freezes safe choices and fallbacks; progress stores where the
   user is in the program.
5. Existing V1/V2 users keep all history and remain on the legacy rotation
   until they explicitly opt in. A named plan always starts at Day 1.
6. V1/V2 decoders remain permanently. An unreadable enrollment falls back to
   the last valid enrollment or legacy mode; the app never discards or guesses.

## Plans first

The catalogue is product content behind a typed domain boundary. It must be
reviewable without a database and tested as pure data before enrollment or
migration work begins.

```ts
interface ProgramPresetRevision {
  planId: ProgramPlanId;
  revision: number;
  name: string;
  outcome: string;
  phases: readonly ProgramPhase[];
  days: readonly ProgramDayDefinition[];
  supportedProfileVersion: number;
}
```

The tuple `(planId, revision)` is permanent after publication. Corrections
publish a new revision rather than changing the meaning of a revision held by
an enrollment. Old revisions stay readable. Duration, phase boundaries,
activity sequence, rationale, and allowed substitutions belong to the preset,
not a per-user blob.

## Goal-specific profile

The mind map may recommend a plan family, but it cannot personalize every
outcome. Starting a plan collects only answers that change that plan's actions,
schedule, fallback, or safety eligibility.

```ts
interface ProgramProfile {
  version: number;
  goalId: string;
  desiredOutcome: string | null;
  baseline: Record<string, JsonValue>;
  constraints: Record<string, JsonValue>;
  schedule: Record<string, JsonValue>;
  barriers: readonly string[];
  safety: ProgramSafetyProfile;
}
```

Examples are sleep and wake times for Sleep Reset, trigger and body cue for
Calm Down Faster, distractor and preferred block length for Steady Head, or
surface, zone, and disposal constraints for One Clear Surface. Do not ask a
question merely because another plan needs it.

Persist only answers required for resume, consented re-resolution, safety, or
an explicit metric. Sensitive health answers need the existing profile service
boundary and a retention review; a generic answer bag on `profiles` is not the
default.

## Resolved enrollment snapshot

Enrollment is compilation:

```text
preset revision + goal-specific profile + user choices
                         ↓
              resolved enrollment snapshot
```

The resolver is pure and versioned. Its output reproduces what the user
accepted even after defaults or recommendation rules change.

```ts
interface ProgramEnrollmentV3 {
  version: 3;
  enrollmentId: string;
  planId: ProgramPlanId;
  presetRevision: number;
  resolverVersion: number;
  enrolledOn: string;
  programDay: number; // one-based
  lastAdvancedOn: string | null;
  status: 'active' | 'completed' | 'abandoned';
  resolved: {
    activities: readonly ResolvedProgramActivity[];
    schedule: ProgramScheduleSnapshot;
    acceptedHabitSeeds: readonly AcceptedHabitSeedSnapshot[];
    safetyDecisions: readonly SafetyDecisionSnapshot[];
  };
}
```

Resolved activities store stable activity ids and revisions, variants,
durations, authored substitutions, and the visible reason for the choice. They
do not copy large scripts, audio, or artwork. The snapshot is immutable except
for progress fields; user-owned overrides are stored separately. Progress changes through dedicated
mutations. Switching creates a new enrollment at Day 1; version one does not
retain abandoned-plan position.

The durable store is a `program_enrollments` row, not another interpretation of
`user_preferences.daily_plan_exercises`. It holds the definition id/revision,
resolver version, validated resolved snapshot, personalization snapshot,
separate overrides, status, and progress dates. A partial unique index permits
one active enrollment per user. `program_action_completions` records one row per
`(enrollment_id, program_day, action_id)` and may link to the modality-specific
session or todo completion that proves it.

## Activity model, not breathing-only content

Program days schedule modality-neutral definitions:

```ts
type ProgramModality =
  | 'breathing'
  | 'breathHold'
  | 'yoga'
  | 'mobility'
  | 'stretching'
  | 'workout'
  | 'meditation'
  | 'reflection'
  | 'lifeAction';

interface ProgramActivityDefinition {
  id: string;
  revision: number;
  modality: ProgramModality;
  title: string;
  estimatedDurationSeconds: number;
  intensity: 'restorative' | 'light' | 'moderate' | 'vigorous';
  completionUnit: 'session' | 'rounds' | 'repetitions' | 'duration' | 'check';
  constraints: readonly string[];
  fallbackActivityIds: readonly string[];
  delivery: BreathingDelivery | MovementSequenceDelivery | PromptDelivery;
}
```

Movement delivery is an ordered sequence with duration or repetitions, side,
transition/rest, body region, position, equipment, and modifications. Yoga and
stretching therefore do not masquerade as breathing patterns or opaque videos.
The scheduled prescription—time, frequency, duration override, phase, and
program day—stays separate from reusable content.

## User overrides and safety

Users may change a time, choose an authored equivalent variant, lower duration
or intensity, or choose an authored fallback. Overrides are stored on the
resolved snapshot and survive restarts.

Users may not override a contraindication, unlock an activity that failed its
safety gate, exceed an authored maximum, or substitute an arbitrary activity
while retaining the plan's prescription claim. Resolution order is:

1. remove ineligible activities;
2. choose an authored safe fallback;
3. apply accessibility and equipment variants;
4. apply preference among eligible choices;
5. resolve schedule.

If no fallback is eligible, enrollment stops with an explanation. It never
silently drops a required activity or inserts an unrelated default.
High-ventilation and breath-hold activities require specific acknowledgements;
a general doctor-referral answer is not a safety gate.

A safety-relevant change creates a new reviewed snapshot rather than rewriting
history. Completion records continue to identify the activity revision that
was actually performed.

## Progress and atomic advancement

The program advances on completion of its program activity, not whole-room
completion. The client never increments `programDay` locally. A Supabase RPC
locks the row and advances only when the expected enrollment and day match,
`lastAdvancedOn` differs from the completed local date, and the completion
matches that day's resolved activity. It updates both progress fields together
and returns the canonical enrollment. Retries and two devices are idempotent.

Progress is participation-indexed. Missing Tuesday leaves the same program day
available Wednesday. There is no backlog, red missed date, decay, or automatic
skip, and progress advances at most once per local calendar day.

## Gamification and todos

The existing reward equation remains: three exercise dailies plus today's
user-owned todos. (`DAILIES_PER_DAY` was removed in the end: a day is as long as the plan's day.) The program
supplies the Hand-picked activity; Guided Reset and the Protocol keep their
completion rules. Room decorations, the completion latch, streaks, and history
are not rewritten.

Life plans may offer one habit at enrollment and a re-scoped replacement at a
phase boundary. Acceptance creates an ordinary `self_care_goals` row. It is
then user-owned: editable, reorderable, completable, and archivable. Rejection
or removal is durable; the plan never recreates it. Phase changes offer a
change rather than mutating a todo automatically.

Accepted plan habits require `source_enrollment_id` and a stable
`source_action_id` on `self_care_goals`. A unique source key prevents duplicate
creation. Program activities count through `dailiesDone` and habits through
`todosDone`; nothing is counted twice.

Nothing decays and no missed action damages Mochi or the room. Rewards respond
to participation, never absence or physiology.

## Legacy V1/V2 users

Legacy users do not migrate merely because a capable client reads their blob.
They stay in **legacy mode** until they explicitly choose a named plan. The
invitation may recommend a preset from the stored legacy axis, but it shows the
plan, duration, Day 1 start, safety choices, and habit offer before confirmation.

On opt-in:

- create a resolved enrollment at Day 1 with the current local date;
- preserve all sessions, daily activity, streaks, todos, completions, room
  state, decorations, entitlement, and analytics history;
- do not reinterpret rotating sessions as program progress;
- do not reuse the legacy `startsOn` as enrollment date.

V1/V2 decoders and their legacy axis union remain permanently. A reader returns
`legacyV1`, `legacyV2`, `enrollmentV3`, or `unsupported`. Unsupported versions,
corrupt V3, missing preset revisions, failed safety resolution, or a failed
write fall back to the last valid enrollment or legacy experience. Older
clients leave newer blobs untouched.

This explicitly replaces automatic V2-to-V3 migration. V2 has no program
progress to preserve, but it does have user choice and a working experience.

## Onboarding answers and mind-map axes

Sleep duration, wake ease, routine happiness, procrastination areas, and
procrastination reasons are currently discarded. Save an answer only when a
settled profile or Space/Rhythm score requires it. New fields are nullable;
existing users see unavailable axes as “not assessed,” never zero.

Legacy `resilience` and `breathEase` remain readable because V2 stores them.
Space and Rhythm require new scoring and technique mappings; they are not
renames. Axis work follows the permanent legacy reader and does not gate the
catalogue.

## Rollout sequence

1. Author and test immutable preset/activity revisions and pure goal-specific
   resolvers. Continue serving and writing V2.
2. Ship permanent V1/V2 readers, a V3 reader, and legacy fallback. Still do not
   write V3.
3. Add storage and the atomic advancement RPC behind a flag; test stale writes,
   retries, two devices, missing revisions, and rollback.
4. Enable explicit opt-in for existing users and resolved enrollment creation
   for new users. Failed enrollment leaves the old experience intact.
5. Add program identity to Home, then the Plan map, without changing rewards.
6. Add provenance-aware life-plan habit offers with idempotent creation and
   durable rejection.
7. Add yoga/stretching only through the activity and safety boundaries.
8. Separately add required profile fields and new mind-map scoring.
9. Consider variable daily counts, automatic re-resolution, or
   pause/realignment only after the core contract is stable.

Steps 1–4 are the reliability boundary. No UI promises a named plan until its
accepted revision can be reconstructed and legacy fallback works.

## Verification checklist

- [ ] Published preset/activity revisions are immutable and readable.
- [ ] Identical profile and resolver versions produce identical snapshots.
- [ ] Every activity has an eligible fallback or enrollment fails clearly.
- [ ] Overrides cannot bypass safety or exceed authored bounds.
- [ ] Advancement rejects stale days and duplicate local dates.
- [ ] Habit creation is idempotent and removal is durable.
- [ ] Rewards count three dailies plus todos exactly once.
- [ ] V1/V2 users remain in legacy mode until explicit opt-in.
- [ ] Opt-in starts Day 1 without changing history or entitlement.
- [ ] Missing, corrupt, or unsupported data returns a working fallback.
