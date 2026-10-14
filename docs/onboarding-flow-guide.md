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

After goal-specific questions and the shared daily-life and habit questions,
every goal runs the same sleep and load assessment: `sleep → sleepDuration
→ wakeEase → dayEnergy → sleepCause → sleepInsight → age → gender → stress
→ stressSignal → stressAwareness → piecesTogether`. It closes on the screen
where Azora names the whole picture. Every goal then asks the same personal
questions — `supportSystem → mentalHealth → homeFeeling` — then the plan
settings: `dailyTime → wakeTime → sleepTime → planBoost
→ planIntro → planLoading → diagnosis → planOutcome → planPersonalization
→ recommendedExercise → planDays → recommendedHabits → habitCurve
→ acquisitionSource → doctorReferral`. `dailyTime` asks “How much time can you
give every day?”. The original personality-profile-first reveal is restored,
with the two original plan-promise screens before the plan report.
The profile receives the existing mind-map scores, and the plan report uses the
user's answers and real plan facts and again displays the pentagon chart. The
profile shows today's shape; the report grows the projected aim out of it, so
the two screens no longer draw the same pentagon. `planRevealProps()` hands both
reports `projectScores(planMindMap.scores)` and `MindMapRadar` only turns the aim
on for the report (`showTarget={phase === 'plan'}`). Neither
report carries the coloured summary cards that used to sit
under the pentagon ("Your superpower", "Needs care", "Plan length", "Your
pace"). The intent-specific `habitCurve` proof
closes the reveal after the recommended habits.

The original goal-specific `GoalProofScreen` appears immediately after the final
intent follow-up, before `dayActivity`. Its “2× better/faster with Azora” headline
matches the selected primary goal. Cleaning reaches it after all six follow-ups;
other goals reach it after three. Back returns to the final intent question.

Back from the profile returns to `sleepTime`; Back from the plan report
returns to the personalization screen. The build is `planIntro` (“Everything's
in. Let's build your plan.”) followed by `planLoading`: the wait personalizes
between the last question and the reveal — its “We’re setting your
transformation” card works through five steps, “Defining your goals”, “Making your {goal} plan”
(the goal's own noun, so a sleep goal reads “Making your sleep plan”),
“Analyzing your habits”, “Building your daily routine”, and “Personalizing your
first step” — pauses twice to ask while it runs —
“When do the hard moments usually hit?” (mornings or evenings, which moves the
plan's own session time) and “Do you usually finish what you start?” (tracked
only) — finishes on its own, and Back steps over it so it is never replayed. The older simulated analysis screens and the
“A clear next step, each day” approach screen are removed. The morning/evening guided Reset question is removed; the plan's session
slot falls back to the plan's own default time. Saved
profiles still resume at the paywall. Historical screens remain inspectable in
Onboarding Lab.

The daily-life and habits section restores its original copy, with one order
change that puts the insight screen with the brain/CBT screens it belongs to:
`dayActivity → routineHappiness → fallingBehind → beforeAfter → choresOverwhelm
→ distraction → scrollInstead → socialMedia → procrastinationArea
→ procrastinationReason → putOffGuilt → habitsFocusInsight
→ habitsFocusScience1 → habitsFocusScience2 → habitsFocusScience3 → routineBrain
→ halfway`. The original illustration/statistics, three animated messages,
CBT/GST chalkboard, and Azo pause retain their original wording.

Cleaning restores its original omissions: `choresOverwhelm`, `procrastinationArea`,
`procrastinationReason`, and `putOffGuilt` are replaced by cleaning follow-ups.
The simulated habit analysis is removed. The behavioural-science insight screen
opens the brain/CBT block, so Back from the habit insight returns to the answer
before it: `putOffGuilt` for other goals or `socialMedia` for cleaning.
Continue and Back use the same sequence as the questions. The sleep and stress
questions follow `halfway` for every goal rather than only the goals they once
matched. Removed history and medical questions remain nullable in the persisted
schema; unasked stress/sleep sliders are not written as answered defaults.

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
  onComplete={(onboardingGoal) => gate.completeOnboarding({ onboardingGoal })}
/>
```

On completion:

1. `OnboardingFlow` calls its `onComplete` prop.
2. `useCompleteOnboardingMutation` calls `completeOnboarding(userId, input)`.
3. `onboardingStatusService` upserts the profile row with:
   - `onboarding_goal`
   - `onboarding_completed_at`
4. The onboarding status query is invalidated.
5. `useAppGate()` sees onboarding as complete and `RootNavigator` renders the main app stack.

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
