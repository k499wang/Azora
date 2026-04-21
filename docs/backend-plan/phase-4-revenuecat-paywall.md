# Phase 4: RevenueCat and Paywall

## Goal

Ship the full V1 subscription system and a production-ready paywall.

## Subscription Setup

Entitlement:

```text
pro
```

Offering:

```text
default
```

Products:

```text
azora_pro_weekly
azora_pro_yearly
```

Pricing:

- Weekly: $7.99/week
- Annual: $59.99/year
- Annual includes the trial
- Weekly has no trial

## Paywall Trigger

Primary V1 trigger:

- show once at the end of onboarding before landing on Home

Re-entry points:

- profile screen
- inline upsells on Pro-only surfaces

Do not re-show on every app launch.

## V1 Paywall Requirements

Must include:

- weekly + annual package selection
- annual trial messaging
- purchase flow states: loading, success, cancel, failure
- restore purchases
- entitlement refresh after purchase, restore, and app launch
- inline upsells on locked Pro screens
- profile entry point to reopen paywall
- manage subscription / billing help entry point
- legal/support links
- immediate unlock of Pro features after purchase

Recommended UI rules:

- annual visually recommended
- weekly always visible
- deterministic trial copy
- no dark patterns

## RevenueCat App Behavior

- Configure RevenueCat with the Supabase `user_id`.
- Fetch customer info on app start.
- Treat the user as Pro when the `pro` entitlement is active.
- Keep cloud sync free regardless of subscription.
- Write subscription event state server-side to `subscriptions` and `revenuecat_events`.

## Existing Schema Support

- `subscriptions`
- `revenuecat_events`

See:

- [create_launch_schema.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260420000100_create_launch_schema.sql)

## App Work In This Phase

- Add RevenueCat SDK wiring.
- Build the onboarding paywall UI.
- Add purchase and restore actions.
- Add post-purchase entitlement refresh handling.
- Add profile re-entry.
- Add Pro lock states and inline upsells.

## Exit Criteria

- Weekly and annual products are live.
- Annual trial is correctly shown.
- Purchase and restore flows work end to end.
- Pro access unlocks immediately after successful purchase.
- The paywall is complete enough for V1, not a temporary version.
