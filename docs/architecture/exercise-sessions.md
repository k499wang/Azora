# Exercise Session Architecture

This is the canonical map for guided breathing and the daily breath hold.
It documents current behavior and the intended extension points.

## Entry Points

- Guided breathing screen: `src/features/exercise/guidedBreathing/GuidedBreathingSessionScreen.tsx`
- Daily breath-hold screen: `src/features/exercise/dailyBreathHold/DailyBreathHoldScreen.tsx`
- Guided technique catalog: `src/features/exercise/guidedBreathing/techniques.ts`
- Guided plan builder: `src/features/exercise/guidedBreathing/domain/breathingSessionPlan.ts`
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

To add another technique with this shape, add one entry to
`src/features/exercise/guidedBreathing/techniques.ts`. Do not edit the runner.

If a future exercise needs a genuinely different shape—such as a warm-up,
recovery stage, or changing per-round timing—add a specifically named plan
builder. Do not turn the cyclic builder into a generic workflow language.

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
- guided heart-rate samples survive pause and resume; paused time is excluded from sample offsets
- daily preparation and hold clocks freeze while paused and resume without repeating a step
- daily heart-rate capture continues uninterrupted while its exercise clock is paused
- completion is delivered once
- heart-rate samples are collected before pulse cleanup
- completion navigation does not wait for backend persistence
- daily hold release is ignored while paused and during the first active second
- daily exit cancels the flow without saving or opening a result
- result processing disables the back gesture
- save failures do not discard the locally computed result

## Verification

Run `npm run check` after changes. For camera, haptic, timer, or navigation
changes, also manually smoke-test the affected flow on a device.
