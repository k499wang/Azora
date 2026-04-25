# Auth, Onboarding, And Navigation Architecture

This document defines the scalable-clean architecture for auth, onboarding, and app navigation in this repo.

It is written for the current codebase, not a generic React Native app.

Relevant current files:

- `App.tsx`
- `src/app/navigation/RootNavigator.tsx`
- `src/services/supabase/client.ts`
- `src/services/supabase/authIdentitySync.ts`
- `src/components/onboarding/OnboardingFlow.tsx`

## Goal

The app flow should be:

1. User opens app
2. If not signed in, show a default auth landing page with:
   - Sign in with Apple
   - Sign in with Google
3. If signed in and onboarding is incomplete, show onboarding
4. If signed in and onboarding is complete, show the app home flow

The important part is that screens should not manually decide this flow.

The root app state should decide this flow.

## Core Principles

Use these boundaries:

- Supabase Auth is the source of truth for identity
- Zustand stores app-level auth/session state
- TanStack Query stores Supabase-backed user data
- Root navigation renders the correct tree from that state
- Onboarding completion is stored per user in Supabase, not only in AsyncStorage

This keeps responsibilities clean:

- Zustand answers: "who is logged in?"
- TanStack Query answers: "what does the backend say about this logged-in user?"
- Navigation answers: "which app tree should be visible right now?"

## Why This Split

### Zustand

Use Zustand for small, event-driven, app-global state:

- current auth session
- current user
- auth bootstrap/loading state

Do not put server data like profile, entitlement, streaks, or session history in Zustand.

### TanStack Query

Use TanStack Query for server state:

- profile
- onboarding completion
- entitlement
- streaks
- daily activity
- heart-rate history
- mutations and invalidation

This avoids building a homegrown cache and keeps mutations predictable.

## Recommended Root State Model

The root gate should reduce the app into one of these states:

- `booting`
- `signed_out`
- `needs_onboarding`
- `ready`

These are the only states `RootNavigator` should care about.

## Recommended Data Model

Onboarding completion should be stored in Supabase on the user record.

Recommended field:

- `profiles.onboarding_completed_at timestamptz null`

Reason:

- tied to the account, not the device
- survives reinstall
- survives new device login
- avoids bugs when different users sign into the same device

`AsyncStorage` can still be used for temporary local UX state, but not for the canonical onboarding-complete decision.

## Recommended Runtime Flow

### 1. App boot

`App.tsx` should mount providers:

- `SafeAreaProvider`
- `QueryClientProvider`
- `PostHogProvider`
- `NavigationContainer`

The Supabase client should already be initialized before app logic uses it.

### 2. Auth bootstrap

An auth store should:

- read the current Supabase session once on startup
- subscribe to Supabase auth changes
- expose a small auth status model

Suggested Zustand state:

```ts
type AuthStatus = 'booting' | 'signed_out' | 'signed_in';

type AuthStore = {
  status: AuthStatus;
  session: SupabaseSession | null;
  user: SupabaseUser | null;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
};
```

Rules:

- `booting` while initial session restore is happening
- `signed_out` when there is no session
- `signed_in` when a session exists

This store should not also fetch profile data.

### 3. Profile query

Once auth says `signed_in`, TanStack Query should fetch the user profile.

The profile query becomes the source of truth for:

- timezone
- display name
- onboarding completion

Suggested query key:

```ts
['profile', userId]
```

### 4. Root gate decision

`RootNavigator` should use:

- auth store state from Zustand
- profile query state from TanStack Query

Then derive:

- `booting`
  - auth is still restoring
  - or auth is signed in but profile is still loading
- `signed_out`
  - no session
- `needs_onboarding`
  - signed in and profile says onboarding incomplete
- `ready`
  - signed in and onboarding complete

## Recommended Navigation Structure

Keep one root navigator.

Do not manually bounce between auth, onboarding, and home with imperative navigation after sign-in.

Instead:

- auth success updates Supabase session
- auth store updates
- root gate re-evaluates
- root navigator renders the correct tree

Suggested structure:

```text
RootNavigator
  -> BootScreen
  -> AuthLandingScreen
  -> OnboardingFlow
  -> AppStack
       -> MainTabs
       -> HeartRate
       -> ExerciseSession
       -> DailyExercise
       -> DailyResult
```

Conceptually:

```ts
function RootNavigator() {
  const gate = useAppGate();

  if (gate.status === 'booting') {
    return <BootScreen />;
  }

  if (gate.status === 'signed_out') {
    return <AuthLandingScreen />;
  }

  if (gate.status === 'needs_onboarding') {
    return <OnboardingFlow onComplete={gate.completeOnboarding} />;
  }

  return <AppStack />;
}
```

This is the key architectural rule:

- screens do not decide the app tree
- the root gate decides the app tree

## Auth Landing Screen

Create a dedicated screen for the default signed-out experience.

Suggested responsibility:

- visual intro / brand
- Sign in with Apple button
- Sign in with Google button
- no onboarding logic
- no home navigation logic

After sign-in succeeds, do not manually `navigate('Onboarding')` or `navigate('Home')`.

Just let Supabase auth update, and let the root gate respond.

## Onboarding Completion Flow

When the user finishes onboarding:

1. Run a mutation that updates the user profile
2. Set `onboarding_completed_at`
3. Invalidate the profile query
4. Root gate re-runs
5. App transitions to `ready`

Suggested mutation result:

```ts
await updateProfile({
  onboardingCompletedAt: new Date().toISOString(),
});
```

Then:

```ts
queryClient.invalidateQueries({ queryKey: ['profile', userId] });
```

Do not set a long-lived global `hasCompletedOnboarding` boolean in Zustand as the source of truth.

That would duplicate server state.

## Sign-In Flow

Recommended sign-in sequence:

1. User taps Apple or Google on `AuthLandingScreen`
2. Supabase auth completes
3. Auth store receives session update
4. Identity sync runs:
   - PostHog identifies the user
   - RevenueCat syncs to the same Supabase user id
5. Ensure `profiles` and `user_preferences` exist
6. Profile query loads
7. Root gate decides onboarding vs app

Important:

- profile creation should happen immediately after login
- this matters for your RevenueCat webhook because the webhook expects the profile row to exist

## Sign-Out Flow

Recommended sign-out sequence:

1. Call Supabase sign-out
2. Auth store updates to `signed_out`
3. PostHog resets
4. RevenueCat local identity state is cleared, but do not create an anonymous RevenueCat user
5. Root gate renders `AuthLandingScreen`

Result:

- protected app routes disappear because the root tree changes
- you do not need to manually pop screens or reset nested stacks yourself

## useAppGate Responsibility

Create a small hook whose only job is to derive the root gate state.

Suggested inputs:

- auth store status
- auth store user
- profile query status
- profile query data

Suggested output:

```ts
type AppGate =
  | { status: 'booting' }
  | { status: 'signed_out' }
  | { status: 'needs_onboarding'; completeOnboarding: () => Promise<void> }
  | { status: 'ready' };
```

This hook should not perform heavy Supabase logic directly.

It should compose:

- Zustand auth state
- TanStack Query profile data
- onboarding completion mutation

## Recommended File Layout

The scalable-clean version for this repo should look like:

```text
src/
  app/
    navigation/
      RootNavigator.tsx
      MainTabs.tsx
      types.ts
    providers/
      AppProviders.tsx
  screens/
    AuthLandingScreen.tsx
  stores/
    authStore.ts
  queries/
    profile/
      useProfileQuery.ts
      useCompleteOnboardingMutation.ts
  hooks/
    useAppGate.ts
  services/
    supabase/
    profile/
    subscriptions/
    analytics/
```

This keeps:

- global state in `stores/`
- server state hooks in `queries/`
- external side effects in `services/`
- root orchestration in `hooks/`

## What Should Not Happen

Avoid these patterns:

- storing profile/onboarding server data permanently in Zustand
- using AsyncStorage as the canonical onboarding source of truth
- manually navigating to onboarding or home after sign-in
- letting screens individually check auth and redirect themselves
- keeping separate duplicated booleans for auth/onboarding in multiple places

These create state drift and make the app harder to reason about.

## Recommended Query And Store Responsibilities

### Zustand auth store owns

- `status`
- `session`
- `user`
- `initialize()`
- `signOut()`

### TanStack Query owns

- `useProfileQuery(userId)`
- `useEntitlementQuery(userId)`
- `useStreakQuery(userId)`
- `useDailyActivityQuery(userId)`
- `useCompleteOnboardingMutation()`

### Services own

- Supabase client access
- auth SDK integration
- profile reads/writes
- RevenueCat identity sync
- PostHog identity sync

## Minimal State Machine

The entire app flow should reduce to this:

```text
booting
  -> signed_out
  -> needs_onboarding
  -> ready

signed_out
  -> needs_onboarding   (after sign in + incomplete onboarding)
  -> ready              (after sign in + completed onboarding)

needs_onboarding
  -> ready              (after onboarding completion)
  -> signed_out         (if session is lost)

ready
  -> signed_out         (on sign out)
```

If this state machine stays clean, the navigation architecture stays clean.

## Practical Implementation Order

Build this in this order:

1. Add `QueryClientProvider`
2. Add Zustand auth store
3. Replace local onboarding gate in `RootNavigator`
4. Create `AuthLandingScreen`
5. Add `useProfileQuery`
6. Add `useAppGate`
7. Move onboarding completion to Supabase profile
8. Remove `useOnboardingComplete` as the canonical gate

## Final Recommendation

For this repo, the scalable-clean version is:

- Supabase auth identity in Zustand
- Supabase server data in TanStack Query
- root app gating in one `useAppGate()` hook
- one `RootNavigator` deciding between auth, onboarding, and app
- onboarding completion stored in Supabase per user

That gives you:

- simple mental model
- correct multi-device behavior
- clean navigation
- good cache/mutation behavior
- easy future extension for entitlement, streaks, and profile state
