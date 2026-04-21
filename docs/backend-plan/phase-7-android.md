# Phase 7: Android

## Goal

Extend the authenticated tracking and subscription model to Android without changing the core backend model.

## Scope

- Add Google Play subscription products.
- Add Android RevenueCat products.
- Reuse the same `pro` entitlement.
- Reuse the same Supabase schema.
- Test login, restore purchases, and entitlement refresh on Android.

## What Should Not Change

- core Supabase data model
- `daily_activity`
- streak logic
- `heart_rate_samples` definition
- free vs paid boundaries

## Risks To Validate

- Android auth edge cases
- purchase restore behavior
- entitlement propagation after purchase
- UI differences for paywall and billing flows

## Exit Criteria

- Android users can sign in, track, subscribe, restore, and sync using the same backend model as iOS.
