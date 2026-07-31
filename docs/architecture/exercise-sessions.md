# Exercise Session Architecture

This is the canonical map for guided breathing and the daily breath hold.
It documents current behavior and the intended extension points.

## Entry Points

- Guided breathing screen: `src/features/exercise/guidedBreathing/GuidedBreathingSessionScreen.tsx`
- Daily breath-hold screen: `src/features/exercise/dailyBreathHold/DailyBreathHoldScreen.tsx`
- Guided technique catalog: `src/features/exercise/guidedBreathing/techniques.ts`
- Guided plan builder: `src/features/exercise/guidedBreathing/domain/breathingSessionPlan.ts`
- Seven-day exercise plan domain: `src/features/exercise/guidedBreathing/domain/dailyExercisePlan.ts`
- Seven-day exercise plan orchestration: `src/features/exercise/guidedBreathing/hooks/useDailyExercisePlan.ts`
- Seven-day exercise plan persistence: `src/services/dailyPlan/dailyPlanExercisesService.ts`
- Daily protocol: `src/features/exercise/dailyBreathHold/domain/dailyBreathHoldProtocol.ts`
- Exercise heart-rate profiles: `src/lib/heartRate/livePulseProfiles.ts`

## Dependency Direction

```text
screens -> orchestration hooks -> pure exercise and heart-rate domain logic
   |             |            -> native adapters
   |             -> query hooks -> services
   -> presentation components
```

Screens own navigation, analytics adaptation, persistence invocation, and visual
composition. Domain files must not import React, navigation, storage, or SDKs.

## Guided Breathing

`buildCyclicBreathingPlan(pattern, rounds)` creates the exact sequence executed
by `useGuidedBreathingFlow`:

```text
inhale -> holdIn -> exhale -> holdOut
```

Every round contains all four steps. Zero-duration holds remain in the plan and
complete immediately, preserving the current behavior.

To add another technique with this shape, follow the catalog, migration,
presentation, asset, and test checklist below. Do not edit the runner.

If a future exercise needs a genuinely different shape—such as a warm-up,
recovery stage, or changing per-round timing—add a specifically named plan
builder. Do not turn the cyclic builder into a generic workflow language.

## Azora Seven-Day Exercise Plan

The additional “Azora’s daily pick” card is backed by a persisted, versioned
seven-day plan. Exercise identity, display time, and notification behavior have
separate ownership:

```text
user_preferences.daily_plan_exercises   -> which exercise appears each day
user_preferences.daily_plan_schedule    -> device-local card display times
notification_preferences                -> notification consent and reminders
```

Changing an exercise plan must not schedule, cancel, or move a notification.
The hand-picked card currently displays the saved `handPicked` time without
creating an additional reminder.

### V1 daytime pool and generation

`GENERAL_DAYTIME_POOL_V1` in
`src/features/exercise/guidedBreathing/domain/dailyExercisePlan.ts` is the
source of truth for exercises eligible for the card:

```ts
[
  'box',
  'resonance',
  'relaxing',
  'belly',
  'extended-exhale',
  'sitali',
  'triangle',
  'coherent-6',
]
```

This is deliberately a general daytime pool. It excludes:

- sleep exercises: `478`, `night-settle`, and `sleep-descent`
- the time-specific `morning-charge`
- intense or advanced picks: `wimhof`, `bhastrika`, and `deep-box`

`buildSevenDayExercisePlan` removes the user's primary technique when it is in
the pool, hashes the user ID with 32-bit FNV-1a, and rotates the remaining pool
by `hash % available.length`. It then takes the first seven entries. This makes
the ordering user-specific but deterministic: the same user, primary technique,
pool version, and start date always produce the same stored plan. It does not
use `Math.random()`.

If the primary technique is not in the eight-entry pool, rotation still occurs
and one pool entry is omitted from that user's seven-day plan. If it is in the
pool, the other seven entries become the plan.

### Stored contract and cache

Migration `supabase/migrations/20260730000300_add_daily_plan_exercises.sql`
adds the nullable `user_preferences.daily_plan_exercises` JSONB column. A valid
V1 value has this shape:

```json
{
  "version": 1,
  "poolVersion": "general_daytime_v1",
  "startsOn": "2026-07-30",
  "techniqueIds": [
    "belly",
    "resonance",
    "triangle",
    "relaxing",
    "coherent-6",
    "sitali",
    "extended-exhale"
  ]
}
```

`sanitizeDailyPlanExercises` accepts only version 1, the exact V1 pool marker,
a real `YYYY-MM-DD` calendar date, and seven unique IDs from the V1 daytime
pool. The service applies this validation on both reads and writes.

`useDailyPlanExercisesQuery` caches the value under
`['daily-plan-exercises', userId]` for five minutes. A successful update first
places the returned plan in that exact user-scoped cache and then exactly
invalidates it. Keep `docs/query-cache-invalidation-map.md` synchronized with
any query or mutation changes.

### Persistence and backward compatibility

New users receive a plan during onboarding. After the profile owns its
`user_preferences` row, onboarding saves the exercise plan and the independent
display-time schedule together. The exercise plan starts on the user's current
device-local onboarding date.

For an existing account, `useDailyExercisePlan` follows this path:

```text
load saved plan
  -> valid plan: use it
  -> null or malformed plan: derive a deterministic fallback immediately
       -> display the fallback
       -> after a successful null lookup, try once per mounted resolution to
          persist it through the normal mutation
```

The hook waits until the saved-plan lookup, primary technique, and onboarding
date have resolved before deriving. It uses the device-local date of
`onboarding_completed_at` as `startsOn`; if that value is absent or invalid, it
uses today's local date. This avoids replaying onboarding for legacy users.

Malformed JSON is sanitized to `null`, so it follows the same repair path. If
the initial lookup fails, Home can still display the deterministic fallback,
but it does not attempt a write until a later successful lookup. A failed
background write does not hide the card; a future Home mount may try again.

### Resolving today's exercise

`resolveDailyExerciseTechniqueId` parses `startsOn` and today's device-local
calendar date without timezone-offset arithmetic. Dates before the plan start
clamp to day zero. Otherwise it selects:

```text
elapsed local calendar days % eligible technique count
```

With the original seven entries, day eight repeats day one. At read time, the
resolver filters the user's current primary technique again. This matters if
the primary was changed after the plan was saved: the two Home cards still
cannot duplicate one another. While that filter applies, the effective cycle
uses the remaining entry count rather than seven; the stored plan itself is not
rewritten.

Home resolves the selected ID through `techniques.ts` for its title, icon, and
image. Completion is independent for the primary and picked cards:
`useCompletedBreathingTechniqueIdsQuery` reads completed
`breathing_sessions.technique_id` values under
`['completed-breathing-technique-ids', userId, localDate]`. Completing a guided
session exactly invalidates this user-and-date key, so only the matching card is
marked complete.

### Adding an exercise

Adding an exercise to the app catalog does **not** automatically add it to the
daily pool. Complete this checklist in one change:

1. Add an immutable ID and display name to
   `src/features/exercise/guidedBreathing/techniqueCatalog.ts`. Never rename an
   existing ID because historical `breathing_sessions` rows reference it.
2. Add the same ID and display name to
   `public.breathing_technique_catalog` in a **new** Supabase migration. Do not
   edit a migration that may already have been applied.
3. Add its full presentation and execution entry to
   `src/features/exercise/guidedBreathing/techniques.ts`: breathing pattern,
   rounds, category, heart-rate response, icon, duration, description, and
   names.
4. Add the referenced image under `assets/exercises/` and wire it through the
   entry's static `require()`. Confirm the image and icon work in the library,
   session, and Today’s Dailies card where applicable.
5. Run the catalog contract tests in
   `src/features/exercise/guidedBreathing/techniqueCatalog.test.mjs`. Add or
   update guided-plan tests when the new breathing pattern introduces behavior
   not already characterized.

### Expanding the daily pool safely

Treat `GENERAL_DAYTIME_POOL_V1`, including its order, as immutable. Do not add,
remove, or reorder entries in place. The rotation depends on pool length and
order, so an in-place edit can change a legacy user's not-yet-persisted fallback
plan. It can also make a plan written by a new client fail validation on an old
client, which knows only the exact V1 ID set.

Use this checklist before making another exercise eligible:

1. Confirm the exercise is suitable at the plan's general daytime slot. Keep
   sleep, morning-only, intense, or advanced techniques out unless the product
   explicitly introduces time-aware pool selection.
2. Create a new pool constant and marker, such as
   `GENERAL_DAYTIME_POOL_V2` and `general_daytime_v2`; keep the V1 constant and
   parser unchanged for existing stored plans and legacy derivation.
3. Extend the stored-plan union and sanitizer to **read and resolve both V1 and
   V2**. Existing V1 plans must remain valid and retain their original order.
4. Add explicit unsupported-future-version handling before any V2 client can
   write. The current V1 read boundary collapses unsupported versions into
   `null`; without a distinct result, an older client could derive V1 and
   overwrite a newer plan. Unknown versions must be preserved and must not
   enter the lazy-repair write path.
5. Define which users receive V2: normally new plans only. If existing users
   should migrate, specify an intentional migration rule and start-date policy
   rather than regenerating silently.
6. Ship read compatibility and unsupported-version protection before, or in a
   release guaranteed to precede, any V2 writes. Only then enable V2 generation.
7. Add tests covering V1 fixtures, V2 fixtures, both resolvers, deterministic
   ordering, primary exclusion, legacy fallback stability, and unknown-version
   non-overwrite behavior.

### Plan verification

Changes to plan generation, parsing, or day resolution must cover at least:

- deterministic seven-entry output and user-specific rotation
- exclusion of the primary technique and all non-daytime techniques
- valid local dates, pre-start clamping, day-one/day-seven mapping, and repeat
- malformed, duplicate, unsupported-version, and unsupported-pool payloads
- a primary technique changed after persistence
- missing-plan legacy derivation and persistence behavior in the hook
- exact cache updates and invalidation for plan writes and daily completion

Run `npm run check` after code, migration, or contract changes. For a new
exercise, also smoke-test its library card, guided session, Today’s Dailies card
when eligible, completion state, and persisted session on a device.

## Daily Breath Hold

`DAILY_BREATH_HOLD_PROTOCOL` is the source of truth for:

- preparation cycle count
- preparation inhale and exhale durations
- final inhale duration
- early-release guard

`buildDailyBreathHoldPreparationPlan(protocol)` turns those values into the
ordered preparation steps consumed by the phase runner.

`useBreathHoldPhaseSequence` owns the pausable preparation and hold clocks.
Preparation resumes the same animation step with its exact active-time
remainder. Hold duration and the early-release guard both use active hold time,
so paused time is never counted.

The workflow intentionally keeps two heart-rate boundaries:

- raw capture measurement starts when preparation breathing starts
- persisted BPM sample collection starts when the hold starts

Do not merge or move those boundaries without characterization tests and a
product decision.

## Heart-Rate Profiles

Screens select a mount-lifetime semantic profile with the `initialProfile`
option when calling `useLivePulse`:

- `guidedBreathing`
- `dailyBreathHold`
- `continuousMonitoring`

The two exercise profiles currently resolve to the same responsive detector and
presentation behavior. They remain separate names so either exercise can change
later without introducing screen-level tuning flags.

Profiles select existing behavior; they do not redefine algorithm thresholds.
Live BPM, final BPM, and final HRV remain separate pipelines.

## Behavior Invariants

Preserve these when changing exercise orchestration:

- cancellation is checked between phases
- pause and resume retain the remaining phase duration
- guided heart-rate capture and live presentation continue through pause, while
  persisted BPM sampling pauses; collected samples survive resume and paused
  time is excluded from their offsets
- daily Pause is visible during the no-HR entrance animation but remains inert until the first timed preparation phase begins
- daily preparation and hold clocks freeze while paused and resume without repeating a step
- daily heart-rate capture continues uninterrupted while its exercise clock is paused
- completion is delivered once
- heart-rate samples are collected before pulse cleanup
- completion navigation does not wait for backend persistence
- daily hold release is ignored while paused and during the first active second
- after that guard, the active daily hold uses the whole screen as its release target
- daily exit cancels the flow without saving or opening a result
- result processing disables the back gesture
- successful daily hold processing replaces the exercise route with the result route, so Back cannot reopen a completed hold
- save failures do not discard the locally computed result

## Verification

Run `npm run check` after changes. For camera, haptic, timer, or navigation
changes, also manually smoke-test the affected flow on a device.
