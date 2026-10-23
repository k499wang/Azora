# Onboarding Flow Guide

This guide explains how the current post-login onboarding flow works and how to extend it without turning onboarding into a separate navigation stack.

For a copyable starter, use [templates/onboarding-screen-template.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/templates/onboarding-screen-template.md:1).

## Current Flow

Onboarding is rendered by the root app gate, not by a registered React Navigation route.

The high-level app entry flow is:

1. `App.tsx` mounts providers, analytics, `NavigationContainer`, and `RootNavigator`.
2. `AppProviders` initializes auth and React Query.
3. `useAppGate()` combines auth state and onboarding status.
4. `RootNavigator` renders one of four trees:
   - boot indicator while auth or onboarding status is loading
   - `AuthLandingScreen` when signed out
   - `OnboardingFlow` when signed in and onboarding is incomplete
   - the main app stack when onboarding is complete

Relevant files:

- [App.tsx](/Users/k3vinwvng/Documents/Azora/Azora/App.tsx:1)
- [src/app/providers/AppProviders.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/app/providers/AppProviders.tsx:1)
- [src/hooks/useAppGate.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/hooks/useAppGate.ts:1)
- [src/app/navigation/RootNavigator.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/app/navigation/RootNavigator.tsx:1)
- [src/components/onboarding/OnboardingFlow.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/components/onboarding/OnboardingFlow.tsx:1)

## Active Step Sequence

`OnboardingFlow.tsx` owns the internal step state; its union lives in
`src/components/onboarding/types.ts`. The pure `onboardingStepOrder.ts` module
owns the active sequence, progress indices, and neighboring steps.
New users start with:

```text
azoChatInvite → azoChat → name → greeting → intent → personalizeIntro → intentDepth1
```

The goal question asks “What would you like to focus on right now?”, with “Pick
whichever feels most important — we’ll start small, and you can change this
anytime.”, and accepts one goal. The encouragement intro follows that choice, congratulating the first step
and explaining the plan, and the restored `communityProof` social-proof screen
follows that intro
before the goal's own follow-ups. Tapping another option replaces the selection;
tapping the same option keeps it selected. Only the chosen row is marked, and it
keeps the mark while the screen waits for Continue — this is the one list that
holds its answer instead of advancing on tap.
The priority step remains compatible with legacy multi-goal state, while new
onboarding continues into the encouragement intro and then that goal's follow-ups.

The invitation and chat replace the old six-screen Azo backstory. The message
card and primary CTA open the same chat. Reply choices append a user bubble and
advance the finite authored transcript; they do not call a remote AI service.

`OnboardingFlow` owns the chat answers so returning to the chat restores the
transcript. Within the chat, Back undoes the most recent reply; at the first turn
it returns to the invitation. The chat completes with an `onContinue` callback.
It introduces the Life Reset Plan before the room reward, and its room preview
does not mutate room state. Users with a saved profile still resume at the
paywall. See [onboarding-screen-map.md](onboarding-screen-map.md) for all current
steps and [azo-story.md](azo-story.md) for character and dialogue rules.

Step views and transitions continue to use the existing onboarding analytics
events. The opening step IDs are now `azoChatInvite` and `azoChat`; historical
events under the removed story IDs remain historical data.

## Plan promise

For a primary sleep goal, the goal questions and sleep assessment form one early
section: `intentDepth1 → sleepDuration → sleepTime → wakeTime → sleep → wakeEase
→ sleepCause → intentDepth2 → dayEnergy → intentDepth3 → sleepInsight → goalProof`.
It asks about the main sleep difficulty, hours and timing, morning rest and
getting up, barriers, previous attempts, daytime energy, and desired improvement.
The first question identifies the sleep problem; `sleepCause` separately asks
what makes settling at night difficult. Bedtime and waking time are asked here
once, and are omitted from the later plan settings.
Other goals reach the sleep assessment after the daily-life and habit questions:
`sleep → sleepDuration
→ wakeEase → dayEnergy → sleepCause → sleepInsight → age → gender → stress
→ stressSignal → stressAwareness → piecesTogether`. For the sleep goal, the
later assessment starts at `age`, because the sleep questions are already
answered. It closes on `piecesTogether`, where the subtitle echoes up to two
answered details and connects them to the chosen goal. Missing answers fall
back to neutral copy. Every goal then asks the same personal
questions — `supportSystem → mentalHealth → homeAtmosphere` — then
`habitsToBreak`, the goal named one last time in habit form, the three teaching
screens that close the question phase — `cbtFamiliarity → cbtIntro →
routineBrain` — and the plan settings: `dailyTime → wakeTime → sleepTime → planBoost
→ planIntro → planLoading → diagnosis → planOutcome → planPersonalization
→ recommendedExercise → planDays → habitPicks → habitCurve
→ acquisitionSource → doctorReferral`. `dailyTime` asks “How much time can you
give every day?”. For the sleep goal, plan settings go directly from `dailyTime`
to `planBoost`; `habitsToBreak` remains in its usual position for every goal.
The original personality-profile-first reveal is restored,
with the two original plan-promise screens before the plan report.
The profile receives the existing mind-map scores, and the plan report uses the
user's answers and real plan facts and again displays the pentagon chart. The
plan report also welcomes the user to the course: it echoes selected context and
starting barriers, states the published plan outcome, shows weekly learning aims,
and previews the actual first lesson and its action. The outline reuses
`planWeekPurpose`, and the first lesson comes from `lessonForDay`, using the
selected preset revision and goal-specific pressure/phone track. Cleaning can
echo the selected starting area. Missing answers never become claimed personal
facts. This replaces the generic plan-inclusions list within the existing report;
it does not add another onboarding step or start/complete an activity.
The profile shows today's shape; the report grows the projected aim out of it, so
the two screens no longer draw the same pentagon. Both draw faint grey ring
pentagons under the opaque colored shapes. The rings only show where the
colored area does not cover them. `planRevealProps()` hands both
reports `projectScores(planMindMap.scores)` and `MindMapRadar` only turns the aim
on for the report (`showTarget={phase === 'plan'}`). Neither
report carries the coloured summary cards that used to sit
under the pentagon ("Your superpower", "Needs care", "Plan length", "Your
pace"). The intent-specific `habitCurve` proof
closes the reveal after the recommended habits.

The original goal-specific `GoalProofScreen` appears before `routineHappiness`.
Its “2× better/faster with Azora” headline matches the selected primary goal.
Sleep reaches it after `sleepInsight`; other goals reach it immediately after
their final intent follow-up. Back returns to that preceding screen.

`habitsToBreak` (“What habits would you like to break?”, a plain multi-select
with no hint line, like the other multi-select questions) follows
`homeAtmosphere`: its five rows are authored per goal — cleaning asks about
dishes, laundry, clutter, skipped cleaning and all-or-nothing cleaning — and
every other goal has its own set, with a neutral one for goals that have no set
of their own. It is tracked, not read by the plan.

The method behind the plan arrives as one run of three, last in the question
phase and straight after `habitsToBreak`: `cbtFamiliarity` (“How familiar are you
with CBT?”, with a one-line explainer under the question) hands to `cbtIntro`,
the CBT chalkboard, which hands to `routineBrain`, the GST one — then the plan's
own settings begin. Back returns through them to `habitsToBreak`.

Back from the profile returns to `planIntro`, skipping the build wait;
Back from the plan report
returns to the personalization screen. The build is `planIntro` (“Everything's
in. Let's build your plan.”) followed by `planLoading`: the wait personalizes
between the last question and the reveal — its “We’re setting your
transformation” card works through five steps, “Defining your goals”, “Making your {goal} plan”
(the goal's own noun, so a sleep goal reads “Making your sleep plan”),
“Analyzing your habits”, “Building your daily routine”, and “Personalizing your
first step” — pauses twice to ask while it runs —
“Have you heard of habit stacking?” (yes or no) and “Do you usually finish
what you start?” — both tracked only — finishes on its own, and Back steps over it so it is never replayed. The older simulated analysis screens and the
“A clear next step, each day” approach screen are removed. The morning/evening guided Reset question is removed; the plan's session
slot falls back to the plan's own default time. Saved
profiles still resume at the paywall. Historical screens remain inspectable in
Onboarding Lab.

The daily-life and habits section restores its original copy, with one order
change that puts the insight screen with the brain-science screens it belongs to:
`routineHappiness → fallingBehind → homeFeeling → beforeAfter → lifestyleHappiness
→ habitMotivation → greatDaysChart → choresOverwhelm
→ scrollInstead → socialMedia → procrastinationArea
→ procrastinationReason → putOffGuilt → distraction → habitsFocusInsight
→ habitsFocusScience1 → habitsFocusScience2 → habitsFocusScience3 → halfway`.
The original illustration/statistics, three animated messages, and Azo pause
retain their original wording; the CBT/GST chalkboard moves into the teaching run
that closes the question phase.

Cleaning restores its original omissions: `choresOverwhelm`, `procrastinationArea`,
`procrastinationReason`, and `putOffGuilt` are replaced by cleaning follow-ups.
The simulated habit analysis is removed. The behavioural-science insight screen
opens the brain-science block, so Back from the habit insight returns to the answer
before it: `putOffGuilt` for other goals or `socialMedia` for cleaning.
Continue and Back use the same sequence as the questions. For the primary sleep
goal, `halfway` leads to `age`; other goals continue into `sleep`. Stress questions
remain in the later assessment for every goal. Removed history and medical
questions remain nullable in the persisted schema; unasked stress/sleep sliders
are not written as answered defaults.

## Habit Recommendations

`src/lib/onboardingStarterPlan.ts` builds three to four habit cards from the
primary goal and routine answers. The cleaning goal supplies three small tasks:
clear one surface, put five things away, and wash three dishes.

Other goals can also receive laundry-basket and kitchen-surface habits when the
user puts off chores, struggles to keep their space together, or finds chores
overwhelming often or almost every day. These matches rank after wind-down,
waking, and enjoyable activity, ahead of generic planning and movement tasks.
Goal habits keep their slots, and the plan stays capped at four cards. Only
habits the user accepts become daily routine tasks when they save their pact.

## Completion And Persistence

The canonical onboarding-complete source is Supabase, not local storage.

`RootNavigator` passes this callback into onboarding:

```tsx
<OnboardingFlow
  onSaveProfile={gate.saveOnboardingProfile}
  onComplete={gate.completeOnboarding}
/>
```

At the pact, after the gate has bootstrapped the user's profile:

1. Save accepted starter tasks, the daily schedule, and the exercise plan in parallel.
2. Reset the device's journey ordering. Program enrollment retains its existing
   best-effort behavior: a failed enrollment is logged without blocking access.
3. Save the core profile, including `onboarding_goal`, only after required
   writes succeed. The nonempty goal is the restart recovery marker; writing it
   earlier could send a user to the paywall with missing settings after a failed
   save. The celebration runs alongside these writes.
4. Continue to the paywall once the save and celebration are finished. Required
   save failures stay at the pact and can be retried.

The stamp lands, holds for 250 ms, then the celebration fades in and draws its
checkmark. A frame timer starts the celebration if the stamp callback is lost.
Keep the same keyed pact mounted beneath the paywall until its whole-page fade
finishes and reports `onReady`; fading only the content leaves an opaque empty
canvas between screens. While offerings load, keep the completed checkmark and
status visible. After eight seconds, expose loading recovery controls without
removing the underlay. Resumed paywalls skip the pact entirely.

After the user completes the paywall flow, `onComplete` calls
`useCompleteOnboardingMutation`, whose service writes
`profiles.onboarding_completed_at` without replacing the saved profile. The
completion query is updated and refreshed, and the root gate opens the app.

Uploaded data includes the core goal/name/demographics, daily minutes, default
technique, answered stress/sleep scores, legacy agreement responses, accepted
routine tasks, schedule, exercise plan, enrollment snapshot, and separately saved
acquisition source. Detailed interview/chat answers remain analytics and
in-memory personalization inputs; they do not have database columns.

Backend read errors do not sign the user out. Usable cached data keeps the
current gate, and a first-load failure offers a connection retry. The auth store
still owns session loss and explicit sign-out.

See the onboarding verification commands in [the Supabase README](../supabase/README.md#onboarding-persistence-verification).

Relevant files:

- [src/queries/profile/useOnboardingStatusQuery.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/queries/profile/useOnboardingStatusQuery.ts:1)
- [src/queries/profile/useCompleteOnboardingMutation.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/queries/profile/useCompleteOnboardingMutation.ts:1)
- [src/services/profile/onboardingStatusService.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/profile/onboardingStatusService.ts:1)

## How To Add A Screen

Use this path when adding a normal onboarding step:

1. Add a presentational component under `src/components/onboarding/screens/`.
2. Reuse `OnboardingScreenLayout`, `OnboardingPrimaryButton`, and theme tokens.
3. Add static options under `src/components/onboarding/data/` when needed.
4. Add or update shared types in `src/components/onboarding/types.ts`.
5. Add state and transitions in `OnboardingFlow.tsx`.
6. Only call `onComplete(...)` from the final step.
7. If the answer must be saved, add the Supabase column and update the profile service and mutation input.

Do not add a navigation route for a normal onboarding step. `OnboardingFlow` should remain an internal state machine unless the product needs deep links, browser-like back history, or route-level analytics per onboarding step.

## Wiring Pattern

A new step usually adds one answer state, one step union member, and one render branch.

Example shape:

```tsx
const [step, setStep] = useState<OnboardingStep>('intent');
const [dailyMinutes, setDailyMinutes] = useState(5);

if (step === 'dailyTime') {
  return (
    <DailyTimeScreen
      value={dailyMinutes}
      stepIndex={3}
      stepCount={4}
      onChange={setDailyMinutes}
      onBack={() => setStep('intentReflection')}
      onContinue={() => {
        void completeOnboarding(selectedIntent ?? '');
      }}
    />
  );
}
```

For answers that should persist, change the completion input from a single goal string into a typed payload at the flow boundary. Keep Supabase writes in `src/services/profile/onboardingStatusService.ts`.

## Rules Of Thumb

- Keep each screen UI-only.
- Keep step transitions in `OnboardingFlow.tsx`.
- Keep persistence in `services/` and React Query mutation hooks.
- Keep route names out of onboarding unless the step is truly a route.
- Keep `stepCount` and `stepIndex` aligned with the active path.
- Update [templates/onboarding-screen-template.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/templates/onboarding-screen-template.md:1) when the standard screen pattern changes.


### Habit history and support questions (October 2026)

Every goal now follows `loseMotivation` with `habitAttempts` →
`habitRestartFrequency` → `selfDiscipline` → `greatDaysChart`. These are three
separate single-select questions: previous attempts, how often a habit restarts,
and what keeping going feels like. Both history questions include an option for
someone who has not tried building a habit; the attempts question also lets
someone say their habits usually stick. Self-discipline answers describe
consistency, losing momentum, helpful structure/reminders, or day-to-day variation.
Continue, Skip, and Back use the shared sequence. Answers are saved under the
matching camelCase question IDs; continuation analytics use `habit_attempts`,
`habit_restart_frequency`, and `self_discipline`. These answers are collected as
context and do not change plan selection rules.


### Separate ADHD context

The personal-context section now asks `adhdStatus` immediately before
`mentalHealth`: “Do you have ADHD or do you suspect you have it?” with the note
“Your answer helps us better understand your needs”. A diagnosed or suspected
answer leads directly to `adhdSupport`, then to the diagnoses question. No or
Skip goes straight to diagnoses; Back follows the chosen branch. ADHD no longer
appears in the diagnoses list. The separate `adhdStatus` answer is persisted,
and continuation analytics record `adhd_status`. Suspected ADHD is not saved as
a diagnosis. A diagnosed answer preserves the existing starter-plan support;
legacy diagnosis-list answers remain compatible.
