# RevenueCat, Supabase, And The Paywall Flow

This guide explains how the current code works in this repo, in the order the app uses it.

It is written so you can debug later without having to rediscover the architecture from scratch.

## What Owns What

The app uses three separate layers:

- Supabase Auth owns user identity
- RevenueCat owns subscription and entitlement state
- Supabase tables own the server-side subscription record and entitlement mirror

The important rule is:

- Supabase decides who the user is
- RevenueCat is synced to that user id
- Supabase is not the source of truth for whether the user paid

## The Main Flow

When the app starts:

1. `App.tsx` mounts the app providers and navigation.
2. `src/stores/authStore.ts` reads the current Supabase session.
3. `src/services/supabase/authIdentitySync.ts` listens for auth changes and keeps RevenueCat identity in sync.
4. `src/hooks/useSubscriptionBootstrap.ts` refreshes RevenueCat customer info and the Supabase entitlement query for signed-in users.
5. `src/hooks/useAppGate.ts` decides whether the UI should show:
   - booting
   - signed out
   - onboarding
   - the main app
6. If the user reaches onboarding, `src/components/onboarding/OnboardingFlow.tsx` eventually mounts the paywall.
7. `src/hooks/usePaywall.ts` loads the offering and drives purchase / restore actions.

## Auth Flow

### `authStore`

File:

- [src/stores/authStore.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/stores/authStore.ts)

This store keeps the current Supabase session in memory.

It exposes:

- `status`
- `session`
- `user`
- `initialize()`

The status is one of:

- `booting`
- `signed_out`
- `signed_in`

Behavior:

- On app startup, it calls Supabase to get the current session.
- It subscribes to Supabase auth changes.
- When a session exists, it sets the user as signed in.
- When the session is gone, it sets the user as signed out.

This store does not know about RevenueCat.

### `useAppGate`

File:

- [src/hooks/useAppGate.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/hooks/useAppGate.ts)

This hook reads auth and onboarding state and decides what screen tree to show.

It returns:

- `booting`
- `signed_out`
- `needs_onboarding`
- `ready`

This is how the app decides the top-level route tree.

### `RootNavigator`

File:

- [src/app/navigation/RootNavigator.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/app/navigation/RootNavigator.tsx)

The navigator uses `useAppGate()` and renders:

- `AuthLandingScreen` when signed out
- `OnboardingFlow` when onboarding is needed
- the main app when ready

So if you are seeing onboarding or paywall, the app already believes you are signed in with Supabase.

## RevenueCat Identity Sync

### The Goal

RevenueCat should use the Supabase user id as its `appUserID`.

That means:

- one Supabase user
- one RevenueCat customer identity
- one entitlement record that can be mirrored back to Supabase

This repo intentionally avoids creating anonymous RevenueCat users on sign out.

### RevenueCat Identity Status

File:

- [src/stores/revenueCatIdentityStore.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/stores/revenueCatIdentityStore.ts)

RevenueCat sync is tracked explicitly now.

The status can be:

- `idle`
- `syncing`
- `synced`
- `signed_out`
- `unavailable`
- `failed`

The store also keeps:

- current RevenueCat app user id
- last error message
- last unavailable reason
- last attempted sync time
- last successful sync time

This is the state to inspect when the app is signed in but subscriptions are not behaving correctly.

### `authIdentitySync`

File:

- [src/services/supabase/authIdentitySync.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/supabase/authIdentitySync.ts)

This is the bridge between Supabase auth and RevenueCat.

It listens for auth changes and does this:

1. On sign out:
   - clear PostHog identity
   - clear RevenueCat local identity state
   - mark RevenueCat identity as `signed_out`
2. On sign in:
   - ensure the profile exists in Supabase
   - identify the user in PostHog
   - mark RevenueCat identity as `syncing`
   - sync the same user into RevenueCat
   - mark RevenueCat identity as `synced`

If RevenueCat is not configured for the current build or platform, identity status becomes `unavailable`.

If the native SDK or network call fails, identity status becomes `failed`.

The core work happens in:

- [src/services/supabase/authIdentitySyncCore.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/supabase/authIdentitySyncCore.ts)

### Why This Matters

RevenueCat can only fetch offerings and purchase state after it has an app user identity.

If the app asks RevenueCat for an offering before identity sync has finished, you can see errors like:

- `RevenueCat is unavailable while signed out.`

That is not always a real sign-out problem.

It often means:

- Supabase auth is signed in
- RevenueCat identity sync has not completed yet
- the paywall asked RevenueCat too early

## RevenueCat Client

### Adapter Layer

File:

- [src/services/subscriptions/revenueCatClient.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/subscriptions/revenueCatClient.ts)

This file adapts the native `react-native-purchases` SDK into the app’s internal service API.

Important details:

- The SDK methods are called through `Purchases.*` closures
- The app exposes helpers like:
  - `syncRevenueCatIdentity()`
  - `clearRevenueCatIdentity()`
  - `getRevenueCatOfferingForPlacement()`
  - `purchaseRevenueCatPackage()`
  - `restoreRevenueCatPurchases()`

Why the closure wrapping matters:

- some native SDK methods depend on the correct `this`
- passing them as bare function references can break after app restore
- that is what caused `this.setLogHandler is not a function`

### Core Logic

File:

- [src/services/subscriptions/revenueCatClientCore.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/subscriptions/revenueCatClientCore.ts)

This is the stateful RevenueCat client logic.

It keeps one important piece of state:

- `currentAppUserId`

That state is the app’s local record of whether RevenueCat has been synced to a user.

Key rules:

- `isReady()` means platform supported + API key exists
- `requireCurrentAppUserId()` throws if RevenueCat identity is missing
- `syncIdentity()` configures RevenueCat or logs in as the given user
- `clearIdentity()` clears local identity only

This file intentionally does not create anonymous RevenueCat users on sign out.

### Why `isReady()` Is Not Enough

`isReady()` answers:

- do we have a RevenueCat SDK and API key available?

It does not answer:

- is RevenueCat already synced to the current authenticated user?

That distinction is the source of a lot of confusion.

## Paywall Flow

### `usePaywall`

File:

- [src/hooks/usePaywall.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/hooks/usePaywall.ts)

This hook drives the paywall UI state.

It does four jobs:

1. Determines whether the user is signed in
2. Reads RevenueCat identity status
3. Retries RevenueCat identity sync if needed
4. Loads the paywall offering only after identity is synced
4. Handles purchase, restore, analytics, and error messaging

The hook is used in onboarding like this:

- [src/components/onboarding/OnboardingFlow.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/components/onboarding/OnboardingFlow.tsx)

### What Happens When the Paywall Opens

When the onboarding step becomes `paywall`:

1. `usePaywall()` runs because the paywall screen is now mounted.
2. It reads the current Supabase user from `authStore`.
3. If there is no Supabase user, it shows a sign-in message.
4. It reads RevenueCat identity status from `revenueCatIdentityStore`.
5. If status is `idle`, `signed_out`, or synced to a different user, it starts sync.
6. If status is `syncing`, it keeps the paywall loading.
7. If status is `failed`, it shows a retryable error.
8. If status is `unavailable`, it shows a config/platform message.
9. If status is `synced` to the current Supabase user, it calls `getPaywallOffering()`.
10. If an offering exists, it renders the packages and tracks `PaywallViewed`.

### Offering Fetch

File:

- [src/services/paywall/paywallService.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/paywall/paywallService.ts)

This file reads RevenueCat data and converts it into app-friendly structures.

It checks:

- RevenueCat supported platform
- RevenueCat API key exists
- RevenueCat has a current app user id

If any of those are missing, the offering is treated as unavailable.

That is deliberate.

It prevents the UI from surfacing internal RevenueCat identity errors to users.

### Purchase Flow

When the user taps a package:

1. `usePaywall()` calls `purchasePaywallPackage()`
2. `paywallService` checks readiness and identity
3. RevenueCat purchase is executed
4. The returned `CustomerInfo` is checked for the `pro` entitlement
5. The UI updates based on the result

Possible purchase results:

- `purchased`
- `cancelled`
- `failed`
- `not_presented`

### Restore Flow

Restore follows the same idea:

1. `usePaywall()` calls `restorePaywallPurchases()`
2. RevenueCat restores purchases
3. The returned `CustomerInfo` is checked for `pro`
4. The app updates the UI and analytics

### Error Normalization

The paywall service now normalizes `RevenueCatSignedOutError` into a non-fatal result.

That means:

- the UI gets a user-facing message
- the app does not explode on the raw internal SDK error

This is the right boundary for that fix.

### Retry Flow

The paywall exposes a retry action.

Retry calls:

- [src/services/subscriptions/revenueCatIdentitySync.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/subscriptions/revenueCatIdentitySync.ts)

That service:

- reads the current Supabase user
- checks RevenueCat availability
- marks status as `syncing`
- calls RevenueCat identity sync
- marks status as `synced`, `unavailable`, or `failed`

This means a one-time RevenueCat SDK or network failure does not require restarting the app.

## Supabase Subscription Mirror

### Why There Is a Supabase Subscription Layer

RevenueCat is the subscription engine.

Supabase mirrors subscription state so the app can query entitlement state from the backend.

That helps with:

- secure server-side reads
- gating features from authenticated database views
- historical or analytics use cases

### `entitlementService`

File:

- [src/services/subscriptions/entitlementService.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/subscriptions/entitlementService.ts)

This service reads `user_entitlement_v` from Supabase and turns it into a typed entitlement object.

That view is the Supabase-side mirror of subscription state.

### Entitlement Query

File:

- [src/queries/subscriptions/useUserEntitlementQuery.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/queries/subscriptions/useUserEntitlementQuery.ts)

This query is the normal app-side way to ask:

- is this authenticated user Pro?

Most Pro gates should read this query, not call RevenueCat directly.

RevenueCat is still used for:

- fetching offerings
- starting purchases
- restoring purchases
- immediate post-purchase confirmation from `CustomerInfo`
- refreshing subscription state on app boot and foreground

Supabase entitlement is used for:

- stable app-wide Pro checks
- backend-backed feature gates
- state that survives temporary RevenueCat/network availability issues

### Why Pro Checks Do Not Need RevenueCat Every Second

RevenueCat is the payment source of truth, but the app mirrors subscription events into Supabase through the webhook.

That means normal feature gates can read `user_entitlement_v` from Supabase.

If RevenueCat is temporarily unreachable after the app is already running, the app can still use the last server-confirmed entitlement from Supabase.

RevenueCat only needs to be contacted when:

- the app boots or returns to foreground and wants to refresh
- the user opens a paywall
- the user purchases
- the user restores
- the app needs fresh `CustomerInfo`

This makes Pro checks resilient. They do not fail just because RevenueCat cannot be reached at that exact second.

### Subscription Bootstrap

File:

- [src/hooks/useSubscriptionBootstrap.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/hooks/useSubscriptionBootstrap.ts)

This hook runs for signed-in users.

It:

- ensures RevenueCat identity is synced on app boot
- fetches RevenueCat `CustomerInfo`
- invalidates the Supabase entitlement query
- repeats that refresh when the app returns to foreground

It is mounted from:

- [src/app/providers/AppProviders.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/app/providers/AppProviders.tsx)

### Webhook

File:

- [supabase/functions/revenuecat-webhook/index.ts](/Users/k3vinwvng/Documents/Azora/Azora/supabase/functions/revenuecat-webhook/index.ts)

RevenueCat sends subscription events to Supabase through a webhook.

The webhook:

- authenticates the request
- maps the RevenueCat event to the correct user
- writes the subscription state into Supabase

This is how purchase events move from RevenueCat into your backend.

## The Two Common Failure Classes

### 1. “RevenueCat is unavailable while signed out.”

Usually means one of these:

- the user is actually signed out in Supabase
- RevenueCat identity has not synced yet
- the paywall asked RevenueCat too early

How to debug:

1. Check whether the app shows `AuthLandingScreen`.
2. Check `[identity-sync]` logs.
3. Confirm `supabase.initial_session_loaded` ran.
4. Confirm `revenuecat.configure_completed` or `revenuecat.login_completed` ran before paywall fetch.

### 2. `this.setLogHandler is not a function`

Usually means:

- a native RevenueCat method was called without the correct receiver context

In this repo, the fix is to call SDK methods through closures in:

- [src/services/subscriptions/revenueCatClient.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/subscriptions/revenueCatClient.ts)

That keeps the native SDK bound correctly.

## Debugging Checklist

Use this order when something subscription-related breaks:

1. Confirm Supabase session state in `authStore`
2. Confirm `RootNavigator` is showing the expected tree
3. Confirm `revenueCatIdentityStore.status`
4. Confirm RevenueCat app user id matches Supabase user id
5. Confirm auth identity sync ran
6. Confirm the paywall offering fetch returned an offering
7. Confirm purchase or restore returned a `CustomerInfo` object with `pro` active
8. Confirm `useUserEntitlementQuery()` sees the Supabase entitlement mirror
9. Confirm the Supabase webhook wrote the mirrored entitlement row

Helpful dev snapshot:

- [src/services/debug/revenueCatDebugSnapshot.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/debug/revenueCatDebugSnapshot.ts)

It logs:

- auth status
- Supabase user id
- RevenueCat identity status
- RevenueCat app user id
- RevenueCat readiness
- unavailable reason
- last sync error
- last synced time

## Files To Know

These are the main files to read when debugging:

- [App.tsx](/Users/k3vinwvng/Documents/Azora/Azora/App.tsx)
- [src/stores/authStore.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/stores/authStore.ts)
- [src/hooks/useAppGate.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/hooks/useAppGate.ts)
- [src/app/navigation/RootNavigator.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/app/navigation/RootNavigator.tsx)
- [src/services/supabase/authIdentitySyncCore.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/supabase/authIdentitySyncCore.ts)
- [src/stores/revenueCatIdentityStore.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/stores/revenueCatIdentityStore.ts)
- [src/services/subscriptions/revenueCatClientCore.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/subscriptions/revenueCatClientCore.ts)
- [src/services/subscriptions/revenueCatClient.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/subscriptions/revenueCatClient.ts)
- [src/services/subscriptions/revenueCatIdentitySync.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/subscriptions/revenueCatIdentitySync.ts)
- [src/hooks/useSubscriptionBootstrap.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/hooks/useSubscriptionBootstrap.ts)
- [src/queries/subscriptions/useUserEntitlementQuery.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/queries/subscriptions/useUserEntitlementQuery.ts)
- [src/services/paywall/paywallService.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/paywall/paywallService.ts)
- [src/hooks/usePaywall.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/hooks/usePaywall.ts)
- [src/components/onboarding/OnboardingFlow.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/components/onboarding/OnboardingFlow.tsx)
- [supabase/functions/revenuecat-webhook/index.ts](/Users/k3vinwvng/Documents/Azora/Azora/supabase/functions/revenuecat-webhook/index.ts)

## Mental Model

If you only remember one thing:

- Supabase says who the user is
- RevenueCat is synced to that user
- the paywall should never assume RevenueCat identity exists before sync completes

That is the core rule that prevents most subscription bugs in this codebase.
