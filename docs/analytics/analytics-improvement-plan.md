# Analytics Improvement Plan

This plan lists the next instrumentation changes needed to make Azora's analytics stronger for conversion, revenue, retention, and LTV analysis.

## Current State

PostHog already covers basic app usage, onboarding steps, paywall funnel events, feature usage, notifications, and profile actions.

RevenueCat is the purchase source of truth. RevenueCat webhooks are stored in Supabase and mirrored into current subscription state.

The main gap is not missing all events. The main gap is that PostHog, RevenueCat, and Supabase are not yet joined tightly enough to answer exact revenue and cohort questions.

## Priority 1: Track Feature-Gate Intent

Add an event when a free user hits a locked feature before the paywall opens:

```text
feature_gate_hit
```

Recommended properties:

```text
feature
reason
used
limit
placement
source_screen
source_action
is_pro
```

Why this matters:

This shows which locked moments create purchase intent. For example, heart-rate limits, advanced stats, daily exercise limits, or session history may convert very differently.

Status: implemented with `feature_gate_hit`.

## Priority 2: Include Feature On Paywall Events

The app already passes a `feature` route param into `ProPaywall` in several places, but paywall analytics should include it directly.

Add `feature` to shared paywall properties for:

```text
paywall_viewed
paywall_package_selected
paywall_purchase_started
paywall_purchase_completed
paywall_purchase_cancelled
paywall_restore_started
paywall_restore_completed
paywall_dismissed
paywall_failed
```

Why this matters:

This makes it possible to answer which locked feature or paywall trigger converts best.

Status: implemented for shared paywall events.

## Priority 3: Persist Paywall Exposures Server-Side

Create a Supabase table for paywall exposures.

Suggested table:

```text
paywall_exposures
```

Suggested columns:

```text
user_id
paywall_view_id
placement
feature
source_screen
source_action
offering_id
experiment_id
experiment_variant
weekly_product_id
weekly_price_cents
annual_product_id
annual_price_cents
currency
shown_at
```

Why this matters:

PostHog has the client funnel. RevenueCat has purchase truth. A durable `paywall_exposures` table becomes the bridge between a specific paywall view and later subscription revenue.

## Priority 4: Normalize RevenueCat Lifecycle Events

Keep storing raw RevenueCat webhook payloads, but also write normalized rows that are easy to query.

Suggested table:

```text
subscription_events
```

Suggested columns:

```text
user_id
event_type
event_time
product_id
store
period_type
price
currency
transaction_id
original_transaction_id
expiration_at
cancel_reason
is_trial_conversion
environment
```

Why this matters:

This enables reliable MRR, ARR, LTV, churn, renewal rate, trial conversion, refund rate, billing issue rate, and product-mix analysis.

## Priority 5: Mirror Subscription State Into PostHog

Update PostHog person properties when subscription state changes.

Recommended properties:

```text
is_pro
subscription_status
product_id
store
will_renew
trial_ends_at
current_period_ends_at
initial_offering_id
experiment_id
experiment_variant
```

Why this matters:

This lets every PostHog dashboard and funnel be segmented by subscriber state without manually joining Supabase data.

## Priority 6: Improve Onboarding Segmentation

Onboarding step tracking is already strong, but downstream segmentation should use safe buckets instead of raw sensitive values.

Recommended properties:

```text
primary_intent
stress_bucket
sleep_bucket
experience_level
daily_minutes_bucket
age_bucket
```

Why this matters:

This helps answer which user types convert, retain, and subscribe best without sending overly sensitive raw health or profile data to analytics.

## Priority 7: Improve Feature Event Properties

Some feature events are too thin for deeper analysis.

For `heart_rate_capture_completed`, add:

```text
bpm
confidence
duration_ms
sample_count
capture_mode
rmssd_ms
sdnn_ms
hrv_availability_reason
context
```

For `daily_breath_hold_released`, add:

```text
hold_seconds
best_hold_seconds
is_new_best
hr_monitoring_enabled
```

Why this matters:

This ties feature quality and user results to retention, conversion, and subscription behavior.

## Priority 8: Add Account-Level Active User Tracking

Current app-return tracking is useful but device-local. Add a durable Supabase-backed daily active table.

Suggested table:

```text
app_daily_active
```

Suggested columns:

```text
user_id
local_date
first_seen_at
last_seen_at
session_count
```

Why this matters:

This gives reliable account-level D1, D7, and D30 retention across reinstalls and multiple devices.

## Recommended Implementation Order

1. Persist `paywall_exposures` in Supabase.
2. Normalize RevenueCat lifecycle events into `subscription_events`.
3. Mirror current subscription state into PostHog person properties.
4. Add onboarding segmentation buckets.
5. Expand heart-rate and breath-hold event properties.
6. Add account-level daily active tracking.

Feature-gate intent and paywall `feature` attribution are already implemented. The next two items provide the largest remaining improvement for conversion and revenue analysis.
