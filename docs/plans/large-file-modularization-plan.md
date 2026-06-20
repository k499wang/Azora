# Large File Modularization Plan

This plan is for reducing the largest source files while preserving current
behavior. Correctness comes first: each phase should be small enough to review,
test, and revert independently.

## Current Targets

| File | Current role | Refactor risk | Direction |
| --- | --- | --- | --- |
| `src/services/supabase/database.types.ts` | Generated Supabase schema types | Low | Leave generated. Do not hand-edit. |
| `src/components/onboarding/screens/OnboardingPaywallScreen.tsx` | Onboarding paywall UI, package selection, trial copy | Low-medium | Split presentational paywall step components. |
| `src/components/onboarding/screens/BaselineScreen.tsx` | Onboarding baseline intro and heart-rate capture | Medium | Split intro/checklist UI from live capture UI first. |
| `src/screens/ExerciseSessionPage.tsx` | Guided breathing session workflow | High | Extract pure helpers and presentational sections before hooks. |
| `src/screens/DailyExercisePage.tsx` | Daily breath-hold workflow | High | Extract pure helpers and presentational sections before hooks. |
| `src/lib/heartRate/signalProcessing.ts` | Batch PPG analysis and HRV beat selection | High | Split last, only behind green heart-rate tests. |
| `src/components/onboarding/OnboardingFlow.tsx` | Onboarding state, analytics, save, notifications, paywall | Medium-high | Refactor after child screens are smaller. |

## Non-Negotiable Verification Gate

Before each phase:

- `git status --short`
- Confirm the target files are not carrying unrelated user edits.
- Keep the change scoped to one architectural seam.

After each phase:

- `npm test`
- `npx tsc --noEmit` when TypeScript validation is needed for moved exports.
- Manual Expo smoke test for any touched screen or native side-effect path.

Do not begin a high-risk phase while the unit test baseline is red.

## Phase 0: Test Baseline

Status: done.

Goals:

- Make the existing suite reliable in the Node test environment.
- Lock current `HeartRateManager` live BPM semantics before refactoring screens.
- Add a characterization test for the public batch capture API.

Coverage now protecting refactors:

- `src/lib/heartRate/heartRateManager.test.mjs`
  - live BPM publishes only after enough accepted intervals
  - measurement windows clear persisted IBIs and restart live BPM smoothing
- `src/lib/heartRate/signalProcessing.test.mjs`
  - `analyzeCapture` returns both a frequency BPM estimate and HRV beat series
  - batch HRV chooses the intended ROI/channel beat series
- `src/lib/heartRate/captureResult.test.mjs`
  - HRV availability gates reject unstable or low-quality intervals

## Phase 1: Paywall Presentational Split

Status: done.

Target:

- `src/components/onboarding/screens/OnboardingPaywallScreen.tsx`

Move local step components to:

- `src/components/onboarding/paywall/PaywallValueStep.tsx`
- `src/components/onboarding/paywall/PaywallPersonalizedPlanStep.tsx`
- `src/components/onboarding/paywall/PaywallTrialStep.tsx`
- `src/components/onboarding/paywall/PaywallFreeTrialHeroStep.tsx`
- `src/components/onboarding/paywall/PaywallChoosePlanStep.tsx`
- `src/components/onboarding/paywall/PaywallStepDots.tsx`

Keep in the parent screen:

- step state
- step transition animation
- selected package derivation
- purchase, restore, retry, and continue-free callbacks
- legal link handling

Tests:

- `npm test` passed.
- `npx tsc --noEmit` passed.
- Manual: paywall step navigation, package selection, disabled/loading states,
  restore, continue free, legal links.

## Phase 2: Baseline Screen Split

Status: implemented; automated checks passed, manual Expo smoke pending.

Target:

- `src/components/onboarding/screens/BaselineScreen.tsx`

Goal:

- Improve readability and future maintainability without chasing a specific
  line-count target.
- Stop once the screen reads as clear composition plus workflow orchestration.

Preferred home for extracted baseline-specific UI:

- `src/components/onboarding/baseline/`

Extract in small steps:

1. Intro-only content:
   - `BaselineIntroContent`
   - includes the heading copy and camera PPG illustration.
2. Science accordion:
   - `BaselineSciencePanel`
   - owns its own open/closed animation and measured height because that state
     is purely visual.
3. Checklist UI:
   - `BaselineChecklist`
   - keep checklist completion easy for the parent to read so the start button
     remains explicit.
4. Capture UI:
   - consider `BaselineCaptureStage` only after the intro/science/checklist
     pieces are out.
   - if the stage needs a large or unclear prop list, extract smaller pieces
     first, such as `BaselineCaptureMetric`, `BaselineSignalWarning`, or
     `BaselineCaptureActions`.

Keep in parent:

- phase transitions
- `useHeartRateStream`
- camera permission handling
- capture start/stop
- `finishCapture`
- stream cleanup
- placement-to-running delay
- result contract passed to `OnboardingFlow`

Do not change:

- capture duration
- BPM smoothing config
- placement good delay
- haptic timing
- permission-denied behavior
- skip behavior
- `BaselineResult` object shape

Pure helper guidance:

- Do not move a generic `average(values)` helper to `src/lib`.
- If result-building logic moves, prefer a specific helper such as
  `buildBaselineResult` or `computeBaselineBpmSummary`.
- Only promote placement/status mapping to `src/lib/heartRate/` if Phase 3 will
  reuse it across baseline, exercise sessions, and daily breath-hold screens.

Tests:

- UI-only extraction does not require new tests beyond existing coverage.
- Add focused pure helper tests if baseline result-building or placement/status
  mapping moves out of the screen.
- `npm test`
- `npx tsc --noEmit`
- Manual: skip baseline, deny camera permission, start capture, end early,
  completed capture flows into recommendation.

## Phase 3: Shared Heart-Rate UI

Targets:

- `BaselineScreen`
- `ExerciseSessionPage`
- `DailyExercisePage`

Extract reusable UI only:

- live BPM row
- signal warning row
- placement status helper
- camera props adapter if it can stay framework-light

Preferred homes:

- UI: `src/components/heartRate/`
- pure helpers: `src/lib/heartRate/`

Avoid:

- moving timers
- changing `useLivePulse`
- changing `useHeartRateStream`
- changing native camera boundaries

Tests:

- Add pure helper tests for placement/status mapping.
- `npm test`
- Manual: good signal, partial signal, no finger, live BPM pulse animation.

## Phase 4: Exercise Session Decomposition

Target first:

- `src/screens/ExerciseSessionPage.tsx`

Order:

1. Extract pure completion payload/stat builders.
2. Extract HUD and controls components.
3. Extract heart-rate display section.
4. Consider `useBreathingSessionFlow` only after the render tree is smaller.

Preserve carefully:

- pause/resume remaining-time semantics
- duplicate save guard
- completion navigation before backend persistence
- haptics stop/start ordering
- placement permission fallback

Tests:

- Add tests for extracted completion payload/stat builders.
- `npm test`
- Manual: start without HR, start with HR, pause/resume, abandon, complete,
  backend failure does not block completion screen.

## Phase 5: Daily Breath-Hold Decomposition

Target:

- `src/screens/DailyExercisePage.tsx`

Order:

1. Extract pure breath cue helpers.
2. Extract breath-hold BPM/result stat helpers.
3. Extract render sections.
4. Consider `useDailyBreathHoldFlow` only after pure and UI seams are out.

Preserve carefully:

- hold-release guard
- result navigation ordering
- duplicate save key
- `processingResults` gesture lock
- haptics and release audio cleanup
- capture sample handoff to `buildCaptureResult`

Tests:

- Add tests for cue sequencing and breath-hold result stats.
- `npm test`
- Manual: permission denied, HR enabled, HR disabled, release too early,
  normal release, new best, save failure.

## Phase 6: OnboardingFlow Cleanup

Target:

- `src/components/onboarding/OnboardingFlow.tsx`

Extract only after child screens are smaller:

- onboarding result builder
- analytics property builder
- notification enable/skip flow
- paywall completion handlers

Keep step rendering explicit unless a data-driven renderer clearly improves
readability without hiding navigation logic.

Tests:

- Add pure tests for result building and analytics property building.
- `npm test`
- Manual: new onboarding, saved profile entry, notification grant/deny/skip,
  save failure, paywall purchase/restore/free completion.

## Phase 7: Signal Processing Split

Target:

- `src/lib/heartRate/signalProcessing.ts`

Split last because it is pure but algorithmically sensitive.

Candidate structure:

- `src/lib/heartRate/signalProcessing/options.ts`
- `src/lib/heartRate/signalProcessing/candidates.ts`
- `src/lib/heartRate/signalProcessing/preprocess.ts`
- `src/lib/heartRate/signalProcessing/frequency.ts`
- `src/lib/heartRate/signalProcessing/peaks.ts`
- `src/lib/heartRate/signalProcessing/beatSeries.ts`
- `src/lib/heartRate/signalProcessing/index.ts`

Keep public imports stable:

- `computeBPM`
- `analyzeCapture`
- `extractBestCaptureBeatSeries`
- `buildIbiSamplesFromCaptureBeatSeries`

Rules:

- Move code without changing thresholds.
- Move code without changing algorithm order.
- Avoid new abstractions that make numeric behavior harder to follow.

Tests:

- `npm test`
- Add focused tests only if internal helpers become exported.
- Compare synthetic capture outputs before and after the split.

## Stop Conditions

Pause refactoring if:

- `npm test` fails for a reason not directly understood.
- a manual smoke test reveals changed user-visible behavior.
- a planned extraction requires broad prop drilling or a vague helper name.
- the new module boundary makes ownership less clear than the original file.

Summary of learnings: file size is only the visible symptom. The real risk is
screens mixing workflow state, timers, native side effects, analytics,
persistence, and rendering. The safest path is to move pure helpers and
presentational components first, then extract hooks only when the remaining
workflow boundary is obvious.
