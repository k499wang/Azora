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
`src/components/onboarding/types.ts`. New users start with:

```text
azoChatInvite → azoChat → personalizeIntro → communityProof → …
```

The invitation and chat replace the old six-screen Azo backstory. The message
card and primary CTA open the same chat. Reply choices append a user bubble and
advance the finite authored transcript; they do not call a remote AI service.

`OnboardingFlow` owns the chat answers so Back from personalization restores the
transcript. Within the chat, Back undoes the most recent reply; at the first turn
it returns to the invitation. The chat completes with an `onContinue` callback.
It introduces the Life Reset Plan before the room reward, and its room preview
does not mutate room state. Users with a saved profile still resume at the
paywall. See [onboarding-screen-map.md](onboarding-screen-map.md) for all current
steps and [azo-story.md](azo-story.md) for character and dialogue rules.

Step views and transitions continue to use the existing onboarding analytics
events. The opening step IDs are now `azoChatInvite` and `azoChat`; historical
events under the removed story IDs remain historical data.

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
