# RevenueCat Paywall Experiments Guide

This guide explains how to set up **remote paywalls and A/B tests** for this app using **RevenueCat**.

It is written for the current codebase and follows the repo rules:

- keep side effects behind services
- keep UI components small
- keep orchestration in hooks
- do not spread vendor SDK calls across the app

This is the recommended monetization workflow for this repo:

- **RevenueCat** handles subscriptions, offerings, paywalls, targeting, and paywall experiments
- **PostHog** handles broader product analytics and feature usage

That split keeps subscription logic where it belongs and avoids building a custom paywall experimentation system by hand.

## Why RevenueCat For Remote Paywall Testing

RevenueCat is the right system for this part of the stack because it is built specifically for:

- subscription products
- entitlements
- remote offerings
- remote paywall delivery
- targeting
- paywall experiments

For this app, that is much better than trying to remote-control subscription UI with a generic analytics tool.

## What This App Already Assumes

The current backend plan already defines the subscription model:

- entitlement: `pro`
- offering: `default`
- products:
  - `azora_pro_weekly`
  - `azora_pro_yearly`

See:

- [Phase 4: RevenueCat and Paywall](/Users/k3vinwvng/Documents/Azora/Azora/docs/backend-plan/phase-4-revenuecat-paywall.md:1)

That means the right next step is not inventing a new monetization model. It is wiring RevenueCat cleanly into the app.

## What Remote Paywall Testing Should Mean Here

When we say "remote paywall testing", the app should be able to:

- show different paywall variants without an app update
- target different variants by placement or audience
- test different paywall designs and offerings
- measure which variant actually converts better
- promote a winning variant without shipping new app code

This is exactly what RevenueCat Paywalls + Targeting + Experiments are for.

## High-Level Architecture

Recommended app shape:

```text
src/
  services/
    subscriptions/
      revenueCatClient.ts
      customerInfo.ts
      entitlements.ts
    paywall/
      paywallService.ts
      paywallPlacements.ts
      paywallResult.ts
      paywallEvents.ts
      index.ts
  hooks/
    usePaywall.ts
    useSubscriptionAccess.ts
  components/
    paywall/
      PaywallGate.tsx
  screens/
    ...
```

Responsibilities:

- `revenueCatClient.ts`
  - initialize RevenueCat
  - login/logout with app user id
  - restore purchases
  - fetch customer info

- `customerInfo.ts`
  - normalize RevenueCat customer info for the app

- `entitlements.ts`
  - helper functions like `hasProAccess(info)`

- `paywallService.ts`
  - request and display paywall for a placement
  - convert RevenueCat result into an app-friendly result

- `paywallPlacements.ts`
  - one place for placement ids

- `paywallResult.ts`
  - typed results like purchased, restored, cancelled, failed

- `paywallEvents.ts`
  - event names and property helpers for analytics

- `usePaywall.ts`
  - hook that opens a paywall and handles flow state for screens/hooks

- `useSubscriptionAccess.ts`
  - read whether the current user is Pro

The key rule is:

- screens decide **when**
- hooks/services decide **how**
- RevenueCat SDK stays behind a narrow boundary

## Recommended RevenueCat Setup

### 1. Create RevenueCat project

In RevenueCat:

1. Create a project for this app
2. Add iOS app
3. Add Android app later when Phase 7 is active
4. Configure products from App Store Connect / Play Console

### 2. Create the entitlement

Use:

- `pro`

That matches the repo plan.

### 3. Create products

Use:

- `azora_pro_weekly`
- `azora_pro_yearly`

### 4. Create packages and offerings

Start with:

- offering: `default`

This is the base offering the app expects.

Later, for experiments, create additional offerings such as:

- `onboarding_a`
- `onboarding_b`
- `profile_a`
- `profile_b`

You do not need to expose those names directly in UI code.

## Placements You Should Use

Do not treat all paywalls as one generic entry.

Use explicit placements. Recommended placements for this app:

- `onboarding_complete`
- `profile_upgrade`
- `heart_rate_pro_gate`
- `daily_result_pro_gate`
- `exercise_premium_gate`

These should live in:

- `src/services/paywall/paywallPlacements.ts`

Example:

```ts
export const PaywallPlacement = {
  OnboardingComplete: 'onboarding_complete',
  ProfileUpgrade: 'profile_upgrade',
  HeartRateProGate: 'heart_rate_pro_gate',
  DailyResultProGate: 'daily_result_pro_gate',
  ExercisePremiumGate: 'exercise_premium_gate',
} as const;
```

Why placements matter:

- they tell RevenueCat where the paywall was shown
- they let you run different experiments for different app moments
- they keep your analytics clean

## What You Should A/B Test

Good first paywall experiments:

- annual highlighted vs weekly highlighted
- trial-first headline vs value-first headline
- short paywall vs more educational paywall
- social proof block vs no social proof
- onboarding paywall vs delayed paywall
- feature-specific benefit copy by placement

Good things to vary:

- copy
- layout
- package emphasis
- trial messaging
- iconography / illustration
- benefit order

Things not to vary recklessly:

- entitlement names
- unlock rules
- purchase handling logic
- restore logic
- account linking

Those are app correctness concerns, not experiment concerns.

## Recommended First Experiment

For this app, the cleanest first test is:

- placement: `onboarding_complete`

Variant A:

- annual visually recommended
- headline focuses on free trial
- shorter copy

Variant B:

- annual visually recommended
- headline focuses on yearly savings / value
- slightly more educational benefits section

Primary metric:

- purchase conversion

Secondary metrics:

- restore rate
- cancellation from paywall
- downstream feature use after purchase

Do not optimize for just button taps.

## How RevenueCat Experiments Should Fit This App

The app should not know the full experiment logic.

The app should only know:

- I want to show a paywall for placement `X`
- RevenueCat decides which offering / paywall variant the user gets
- the app receives a purchase / cancel / restore / failure result

That means the app-side API should feel simple.

Example desired usage:

```ts
const { presentPaywall } = usePaywall();

const result = await presentPaywall({
  placement: PaywallPlacement.ProfileUpgrade,
  source: 'profile_screen',
});
```

The screen should not need to know:

- experiment variant ids
- offering resolution details
- purchase flow internals

That belongs in the service layer.

## Recommended App-Side API

### `paywallResult.ts`

Define a simple result contract:

```ts
export type PaywallResult =
  | { status: 'purchased' }
  | { status: 'restored' }
  | { status: 'cancelled' }
  | { status: 'not_presented'; reason: 'missing_offering' | 'not_ready' }
  | { status: 'failed'; errorCode: string };
```

That keeps the rest of the app independent from RevenueCat-specific types.

### `paywallService.ts`

Recommended public API:

```ts
presentPaywall(options: {
  placement: PaywallPlacementValue;
  source?: string;
}): Promise<PaywallResult>
```

Optional later APIs:

```ts
restorePurchases(): Promise<RestoreResult>
refreshCustomerInfo(): Promise<void>
```

### `usePaywall.ts`

Recommended hook output:

```ts
{
  presentPaywall,
  isPresenting,
}
```

The hook can:

- call the service
- emit analytics events
- refresh entitlements after success

## How To Track Paywall Analytics

RevenueCat gives subscription-specific data, but you should still emit app events for product context.

Recommended app-side paywall events:

- `paywall_opened`
- `paywall_closed`
- `paywall_purchase_started`
- `paywall_purchase_completed`
- `paywall_purchase_cancelled`
- `paywall_restore_started`
- `paywall_restore_completed`
- `paywall_failed`

Recommended properties:

- `placement`
- `source_screen`
- `source_action`
- `offering_id` if available
- `paywall_variant_id` if available

These should live in:

- `src/services/paywall/paywallEvents.ts`

The paywall service or hook should emit these events. Screens should not duplicate them.

## How To Target Different Users

RevenueCat Targeting should decide who sees which paywall for a placement.

Useful targeting dimensions:

- app version
- platform
- country
- first-time vs returning user
- placement
- custom attributes later

For this app, good early targeting examples:

- show onboarding paywall only once after onboarding
- show profile paywall to non-Pro users only
- show a different `profile_upgrade` paywall for returning users vs brand-new users

Do not rebuild targeting logic locally in the app if RevenueCat can do it remotely.

## How To Handle Subscription Identity

The repo plan already says:

- use the same Supabase `user_id` as the RevenueCat app user id

That is the correct model.

App rules:

- on login: identify RevenueCat with Supabase `user_id`
- on logout: clear or reset subscription state appropriately
- on app launch: refresh customer info
- after purchase/restore: refresh customer info immediately

This keeps Pro access deterministic.

## What Screens Should Trigger Paywalls

Based on the current plan and app structure:

### 1. Onboarding completion

Primary trigger:

- show once after onboarding before Home

### 2. Profile screen

Re-entry point:

- user taps upgrade CTA

### 3. Pro-gated feature surfaces

Inline upsell points:

- locked HRV / premium insights
- locked advanced analytics
- locked premium breathing content later

The trigger point can live in screens or feature hooks, but the presentation logic should stay in the paywall service/hook.

## What Not To Do

Do not:

- hardcode paywall copy in multiple screens if RevenueCat Paywalls will own it
- put RevenueCat SDK calls directly in UI components
- mix purchase logic into presentational components
- use generic event names like `upgrade_clicked`
- build a second local experimentation system for paywalls

That will make the flow harder to reason about later.

## Recommended Metrics For Evaluating Paywall Tests

Use one primary metric per test.

Good primary metrics:

- purchase conversion rate
- trial start rate
- revenue per paywall view

Good secondary metrics:

- restore rate
- paywall dismissal rate
- subscription retention later
- downstream feature usage after purchase

Bad primary metrics:

- button tap rate alone
- view time alone

Those can be misleading for paywalls.

## Suggested Experiment Workflow

### Phase 1: Get baseline

Ship one clean `default` paywall first.

Measure:

- views
- purchases
- restores
- cancellations

Do not start with three experiments before you have a baseline.

### Phase 2: Run one experiment

Pick one placement and one hypothesis.

Example:

- placement: `onboarding_complete`
- hypothesis: trial-first copy converts better than value-first copy

### Phase 3: Declare winner

Once you have enough data:

- promote the winner
- stop the losing variant

### Phase 4: Test the next thing

Then try:

- package emphasis
- layout density
- benefit stack

Change one major idea at a time.

## How This Should Evolve Later

Later, this architecture can support:

- RevenueCat web paywalls if needed
- Android subscriptions without changing app-side service boundaries
- placement-specific experiments
- user segmentation by subscription state
- server-side enrichment from subscription events

That is why the service boundary matters now.

## Recommended Implementation Order In This Repo

1. Add RevenueCat SDK wiring in `src/services/subscriptions/`
2. Add entitlement helpers
3. Add paywall placements constants
4. Add `paywallService.ts`
5. Add `usePaywall.ts`
6. Add profile and onboarding triggers
7. Add paywall analytics events
8. Add RevenueCat Targeting / Experiments remotely
9. Measure baseline
10. Start first A/B test

This is the lowest-risk path.

## Practical Starting Configuration

If you want a concrete starting point:

### RevenueCat

- entitlement: `pro`
- base offering: `default`
- products:
  - `azora_pro_weekly`
  - `azora_pro_yearly`

### App placements

- `onboarding_complete`
- `profile_upgrade`

### First experiment

- two onboarding paywalls
- same products
- same entitlement
- different copy/layout emphasis

### App events

- `paywall_opened`
- `paywall_purchase_completed`
- `paywall_purchase_cancelled`

### PostHog correlation

Add placement + source context to app analytics so you can answer:

- which paywall entry point converts best
- which features lead to upgrades
- which variant users saw before converting

## Final Rule

For this app, the cleanest remote paywall experimentation workflow is:

- RevenueCat owns paywall content, targeting, and experiments
- the app owns when to request a paywall
- services/hooks own the integration boundary
- PostHog owns broader product analytics around the paywall

That is the right long-term shape.
