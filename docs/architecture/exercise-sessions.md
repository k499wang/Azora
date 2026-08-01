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

Today’s Dailies sorts the primary session, daily pick, and breath-hold check-in
chronologically by their normalized device-local `HH:mm` values. Equal times
use the stable order `session`, `handPicked`, then `checkIn`. This presentation
ordering does not change the stored exercise order.

New onboarding enables one local reminder for each daily plan action: the
primary guided session, Azora's daily breathing exercise, and the breath-hold
check-in. Reminder consent lives in `notification_preferences`, while all three
device-local times remain authoritative in `daily_plan_schedule`. Reminder copy
identifies the action type without coupling notification scheduling to a
specific technique. Tapping a reminder opens the app normally; it does not
deep-link into an exercise.

### Plan versions and eligible pools

The domain in
`src/features/exercise/guidedBreathing/domain/dailyExercisePlan.ts` reads both
persisted versions. Keep each version's pool and ordering constants immutable.

V1 uses `GENERAL_DAYTIME_POOL_V1`:

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

V2 uses `GENERAL_DAYTIME_POOL_V2`, which is V1 plus three exercises:

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
  'deep-box',
  'wimhof',
  'bhastrika',
]
```

Both are daytime pools and exclude the time-specific or sleep-focused
techniques:

- sleep exercises: `478`, `night-settle`, and `sleep-descent`
- the time-specific `morning-charge`

V2 deliberately makes `deep-box`, `wimhof`, and `bhastrika` eligible through
growth-area ordering. These orders are product affinities for variety and
relevance, not clinical rankings or medical recommendations.

### Growth-area orders

Historical V1 growth-area plans used `GROWTH_AREA_TECHNIQUE_ORDER`:

```ts
const GROWTH_AREA_TECHNIQUE_ORDER = {
  calm: [
    'extended-exhale', 'resonance', 'relaxing', 'belly',
    'sitali', 'coherent-6', 'triangle', 'box',
  ],
  recovery: [
    'resonance', 'coherent-6', 'relaxing', 'belly',
    'extended-exhale', 'triangle', 'sitali', 'box',
  ],
  focus: [
    'box', 'resonance', 'triangle', 'coherent-6',
    'belly', 'extended-exhale', 'sitali', 'relaxing',
  ],
  resilience: [
    'resonance', 'box', 'sitali', 'triangle',
    'coherent-6', 'extended-exhale', 'belly', 'relaxing',
  ],
  breathEase: [
    'belly', 'resonance', 'relaxing', 'coherent-6',
    'extended-exhale', 'sitali', 'triangle', 'box',
  ],
} as const;
```

New onboarding uses `GROWTH_AREA_TECHNIQUE_ORDER_V2`:

```ts
const GROWTH_AREA_TECHNIQUE_ORDER_V2 = {
  calm: [
    'extended-exhale', 'resonance', 'relaxing', 'belly',
    'sitali', 'coherent-6', 'triangle', 'box',
    'deep-box', 'wimhof', 'bhastrika',
  ],
  recovery: [
    'resonance', 'coherent-6', 'relaxing', 'belly',
    'extended-exhale', 'triangle', 'sitali', 'deep-box',
    'box', 'wimhof', 'bhastrika',
  ],
  focus: [
    'box', 'triangle', 'deep-box', 'resonance',
    'bhastrika', 'coherent-6', 'wimhof', 'belly',
    'extended-exhale', 'sitali', 'relaxing',
  ],
  resilience: [
    'resonance', 'box', 'sitali', 'triangle',
    'deep-box', 'coherent-6', 'wimhof', 'extended-exhale',
    'bhastrika', 'belly', 'relaxing',
  ],
  breathEase: [
    'belly', 'relaxing', 'resonance', 'coherent-6',
    'extended-exhale', 'sitali', 'triangle', 'box',
    'deep-box', 'wimhof', 'bhastrika',
  ],
} as const;
```

`buildGrowthAreaSevenDayExercisePlanV2` receives the current
`planMindMap.growthArea.axis`, removes the user's primary technique from that
axis order, and takes the first seven IDs. It persists the axis so later
in-memory primary replacement can use the same order.

V1 has eight eligible exercises and V2 has eleven, but both contracts store
exactly seven slots. If the primary is eligible, it is removed before taking
seven. Any remaining lower-priority entries are omitted. Day eight repeats day
one.

The growth area is a product score, not a diagnosis. `computeMindMap` derives it
from stress, sleep, racing/exhaustion/reactivity answers, fixed baseline values,
and a deterministic tie priority. Onboarding experience is no longer an input
to the scores, growth-area axis, or exercise picks.

The explicit primary onboarding intent continues to own the primary session's
intent-based time: focus and energy use the morning slot, while sleep uses the
night slot. When the primary intent has no time-specific rule, sleep quality is
the fallback that can move the session to night; otherwise it uses the evening
slot. This scheduling decision is separate from the growth-area daily picks.

`dailyMinutes` and onboarding experience do not affect technique selection or
guided-session sizing. Guided exercises continue to use each technique's
`defaultRounds`; do not imply that the onboarding time answer changes their
executed duration.

### New onboarding and plan rebuilds

New onboarding calls `buildGrowthAreaSevenDayExercisePlanV2` and writes:

```json
{
  "version": 2,
  "poolVersion": "growth_area_daytime_v2",
  "growthAreaAxis": "focus",
  "startsOn": "2026-07-31",
  "techniqueIds": [
    "triangle",
    "deep-box",
    "resonance",
    "bhastrika",
    "coherent-6",
    "wimhof",
    "belly"
  ]
}
```

This example excludes a `box` primary. The plan starts on the current
device-local onboarding date and uses the existing
`user_preferences.daily_plan_exercises` JSONB column, query key, service, and
mutation.

Valid stored V2 plans are always reused as stored. They do not regenerate when
the app recalculates a growth area or changes the primary technique.

The service returns a `DailyPlanExercisesReadResult` with one of these statuses:

```text
available V2 -> use the stored plan
available V1 -> rebuild onto the V2 pool and persist
missing      -> build and persist a V2 plan
invalid_v1   -> build and persist a V2 plan
invalid_v2   -> build and persist a V2 plan
unsupported  -> do not rebuild or overwrite
```

`shouldRebuildDailyPlanAsV2` makes that call. Only `unsupported` — a payload
from a future contract — is left untouched, so a rolled-back client cannot
destroy a newer write.

`buildRebuiltSevenDayExercisePlan` builds the replacement. Only V2 plans store
`growthAreaAxis`, so a rebuild has to establish it again. `resolveGrowthAreaAxis`
does that in two steps:

1. The mind map itself is never persisted, but its inputs are.
   `profiles.stress_level`, `profiles.sleep_quality`, and
   `profiles.agreement_responses` are written by `saveOnboardingProfile` and
   read back by `getSavedOnboardingProfile`, and `computeMindMap` is
   deterministic over them, so the axis the user actually saw during onboarding
   is recomputed rather than guessed. `racingLevel` is not persisted and is
   omitted, which can move a borderline axis.
2. When `stress_level` or `sleep_quality` is null — the user skipped those
   questions, or the account predates `20260504000100_add_onboarding_assessment`
   — `GROWTH_AREA_AXIS_BY_TECHNIQUE` derives an axis from the primary
   technique, defaulting to `DEFAULT_GROWTH_AREA_AXIS` (`calm`) when the primary
   is missing or unrecognized.

The plan is otherwise built exactly like a new onboarding V2 plan. This is what carries `deep-box`, `wimhof`, and `bhastrika`
to existing accounts instead of only new ones. A rebuilt V1 plan keeps its
stored `startsOn`, so upgrading the pool does not restart the seven-day
rotation.

`useSavedOnboardingProfileQuery` is enabled only when a rebuild is needed, so
accounts that already store their axis do not pay for the assessment read.

The hook keeps showing a stored V1 plan while the rebuild resolves, and shows
the rebuilt plan as soon as the profile inputs, assessment, and plan lookup
settle. After a
successful lookup it attempts the write once per mounted resolution. A query
failure may display a derived plan but is not a successful classification and
does not trigger a write.

`buildSevenDayExercisePlan` — the user-ID-hashed V1 builder — is no longer used
in the app and is retained only as the canonical shape of the V1 rows still in
the database.

For reference, V1 remains this contract:

```json
{
  "version": 1,
  "poolVersion": "general_daytime_v1",
  "startsOn": "2026-07-30",
  "techniqueIds": [
    "belly",
    "resonance",
    "relaxing",
    "coherent-6",
    "extended-exhale",
    "sitali",
    "triangle"
  ]
}
```

Both versions require a real `YYYY-MM-DD` calendar date and seven unique IDs
from their matching pool. V2 additionally requires a recognized
`growthAreaAxis`. `sanitizeDailyPlanExercises` accepts valid V1 and V2 writes;
`readDailyPlanExercises` preserves the more specific invalid/unsupported read
classification.

`useDailyPlanExercisesQuery` caches the value under
`['daily-plan-exercises', userId]` for five minutes. A successful update first
places `{ status: 'available', plan }` in that exact user-scoped cache and then
exactly invalidates it. Keep `docs/query-cache-invalidation-map.md` synchronized
with any query or mutation changes.

### Database storage

Migration `supabase/migrations/20260730000300_add_daily_plan_exercises.sql`
added the nullable JSONB column. There is no server-side version guard: an
older client that writes V1 over a stored V2 plan will succeed. Client read
classification prevents the current app from repairing V2 or future versions,
but nothing protects a stored plan from app versions already in the wild.

### Resolving today's exercise

`resolveDailyExerciseTechniqueId` parses `startsOn` and today's device-local
calendar date without timezone-offset arithmetic. Dates before the plan start
clamp to day zero. Otherwise it selects:

```text
elapsed local calendar days % 7
```

The resolver always indexes a seven-item in-memory list with
`elapsedDays % 7`, so day eight repeats day one. If the user's primary technique
changed and now occupies a stored daily-pick slot,
`resolveDailyExerciseTechniqueIds` replaces that same slot in memory with the
first unused eligible technique. V2 uses its persisted `growthAreaAxis` order;
V1 uses `GENERAL_DAYTIME_POOL_V1`. The stored JSON is not rewritten, the two Home
cards cannot duplicate, and the cycle remains seven days rather than shrinking.

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

Treat both versioned pools and all of their growth-area orders as immutable. Do
not add, remove, or reorder entries in place. Stored V1 plans still resolve
against the V1 pool order, while onboarding, rebuilds, and V2 primary
replacement depend on the V2 axis orders. An in-place edit can change a generated plan or make another client
reject a stored payload.

Use this checklist before making another exercise eligible:

1. Confirm the exercise is suitable at the plan's general daytime slot. Keep
   sleep and morning-only techniques out unless the product explicitly
   introduces time-aware pool selection. Review the product and safety case for
   advanced or intense exercises before assigning their axis positions.
2. Create a new pool constant and marker, such as V3; keep every V1 and V2
   constant and parser unchanged. Define a complete order for all five axes.
3. Extend the stored-plan union, sanitizer, reader, and resolver to read V1,
   V2, and the new version. Existing plans must retain their original order.
4. Keep unknown future versions in the `unsupported` non-rebuild path. Never
   collapse them into `missing` or `invalid_v1`.
5. Define which users receive the new version. Older-version plans are rebuilt
   onto the newest pool and keep their stored `startsOn`; state the axis and
   start-date policy explicitly rather than regenerating silently.
6. Add tests covering every supported-version fixture and resolver, exact axis
   orders, primary replacement, the rebuild path, and unknown-version
   non-overwrite behavior.

### Plan verification

Changes to plan generation, parsing, or day resolution must cover at least:

- all five exact V1 and V2 growth-area orders, primary exclusion, and seven slots
- V2 persistence of `growthAreaAxis`
- axis recomputation from a stored assessment, and the technique-derived
  fallback with its `calm` default when the assessment is incomplete
- preservation of every valid V2 plan without regeneration
- rebuilds for stored V1, `missing`, `invalid_v1`, and `invalid_v2`; never
  `unsupported`
- a rebuilt V1 plan keeping its stored `startsOn`
- primary-intent timing precedence and sleep-quality fallback behavior
- no score, growth-area, or pick effect from experience
- no selection or guided-session-sizing effect from `dailyMinutes`
- same-slot in-memory primary replacement and an unchanged seven-day cycle
- chronological Today’s Dailies ordering, including stable equal-time behavior
- one primary-session notification and no pick/check-in notifications
- exclusion of the primary technique and all sleep/time-specific techniques
- valid local dates, pre-start clamping, day-one/day-seven mapping, and repeat
- malformed, duplicate, unsupported-version, and unsupported-pool payloads
- a primary technique changed after persistence
- missing-plan and stored-V1 rebuild and persistence behavior in the hook
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
