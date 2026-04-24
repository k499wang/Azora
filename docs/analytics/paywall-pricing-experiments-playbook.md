# Paywall Pricing Experiments Playbook

How to set this app up so that **from day 1** you can run price experiments
and segment every downstream metric (conversion, retention, LTV, churn) by
pricing arm.

Companion to `revenuecat-paywall-experiments-guide.md` — that one covers how
to wire RevenueCat cleanly into the codebase. This one covers the *strategy*
and the *instrumentation contract* for pricing tests specifically.

## What this guide assumes

- Phase 4 backend is applied (see `docs/backend-plan/phase-4-revenuecat-paywall.md`).
- `subscriptions.initial_offering_id`, `subscriptions.experiment_id`, and
  `subscriptions.experiment_variant` exist (migration `20260424000300`).
- `user_entitlement_v` exposes those columns.
- The RevenueCat webhook Edge Function persists those columns on
  `INITIAL_PURCHASE` and never overwrites them on later events.

If any of the above is not true, stop and fix that first — the rest of this
playbook depends on it.

## Core principles (read these before doing anything)

### 1. You cannot show different prices for the same product
Apple's guideline 3.1.2 forbids it. Every price point needs its **own
product** in App Store Connect. If you want to test `$7.99/week` vs
`$9.99/week`, that's two products: `azora_pro_weekly_799` and
`azora_pro_weekly_999`.

### 2. You cannot add products instantly
New products go through App Review. Plan for 24–72h. **Create every price
point you might ever want to test before launch**, even if you expose only
one. You don't need to submit them for feature review — they just need to
exist in "Ready to Submit" or "Approved" status.

### 3. Pricing tests must be judged on revenue, not conversion
A cheaper price always converts better. What matters is **revenue per paywall
view** over a long enough window to see retention. RevenueCat's experiment
dashboard tracks this natively. Do not stop a test based on short-term
conversion lift alone.

### 4. Pricing experiments apply only to new customers
Apple does not let you change prices on existing subscribers without their
explicit consent. RevenueCat's offering experiments correctly segment new
customers only. Never try to retroactively "move" a user to a different
offering.

### 5. Statistical significance is volume-gated
Rough rule of thumb for a 2-arm price test detecting a ~10% revenue-per-view
difference at 95% confidence: **1,500–3,000 paywall views per arm.** If you
have 25 paywall views/day split 50/50, that's 120–240 days. There is no
shortcut. Design around your real traffic.

## Pre-launch setup

### Step 1 — Decide the price ladder

Pick three price points per plan — low, mid, high. Ship the `mid` price at
launch so you have a sane default if experiments are off.

| Plan   | Low             | Mid (launch default) | High            |
| ------ | --------------- | -------------------- | --------------- |
| Weekly | $5.99 (or $6.99) | $7.99                | $9.99           |
| Annual | $39.99           | $59.99               | $79.99          |

You can deviate, but keep the ratio roughly 0.75× / 1.0× / 1.25×. Arms that
are too close together need massive sample sizes to resolve.

### Step 2 — Create all six products in App Store Connect

One subscription group `Azora Pro`. Six auto-renewing subscriptions:

- `azora_pro_weekly_599` — $5.99 / week, no trial
- `azora_pro_weekly_799` — $7.99 / week, no trial
- `azora_pro_weekly_999` — $9.99 / week, no trial
- `azora_pro_yearly_3999` — $39.99 / year, with trial (e.g., 7 days)
- `azora_pro_yearly_5999` — $59.99 / year, with trial
- `azora_pro_yearly_7999` — $79.99 / year, with trial

Apple requires a subscription group to act as an "upgrade/downgrade" ladder.
Listing six price points in one group is fine — users only see the ones your
active offering presents them.

### Step 3 — Import products into RevenueCat

RevenueCat dashboard → Products → import from App Store Connect. All six
should appear.

### Step 4 — Create three offerings

| Offering id     | Weekly package              | Annual package              |
| --------------- | --------------------------- | --------------------------- |
| `default_low`   | `azora_pro_weekly_599`      | `azora_pro_yearly_3999`     |
| `default_mid`   | `azora_pro_weekly_799`      | `azora_pro_yearly_5999`     |
| `default_high`  | `azora_pro_weekly_999`      | `azora_pro_yearly_7999`     |

Mark `default_mid` as the **current offering**. At launch, every user sees
this one.

### Step 5 — Do not turn on the experiment yet

Ship V1 with `default_mid` only. You need a baseline:

- Paywall views / day
- Paywall view → trial start rate
- Trial start → paid rate
- Weekly vs annual mix
- Day 7 and day 30 retention of paid users

Run for **at least 2 weeks** at `default_mid`. Longer is better. Without this
baseline, you cannot interpret experiment lift.

## Instrumentation contract

These are the fields and events that make pricing experiments analyzable.
Every paywall interaction must emit this shape. Every purchase must persist
it.

### Server-side: `subscriptions` columns

Already in the schema after migration `20260424000300`:

- `initial_offering_id` — which offering was shown when the user first
  subscribed. Set **once** on `INITIAL_PURCHASE`, preserved across renewals
  and product changes.
- `experiment_id` — RevenueCat experiment id if the user converted from
  within an active experiment. Set once.
- `experiment_variant` — the experiment arm they converted from (e.g.,
  `control`, `treatment_a`). Set once.

These are the **only** columns needed to segment every downstream metric
(revenue, retention, churn) by price arm, via joins on `subscriptions` to
any other user table.

### Client-side: PostHog events

Fire these four events from the app at every paywall lifecycle step. Keep
the property schema identical across events so PostHog cohorts are
consistent.

```ts
posthog.capture('paywall_viewed', {
  offering_id: offering.identifier,          // 'default_mid'
  experiment_id: offering.experimentId,      // null if not in an experiment
  experiment_variant: offering.variantName,  // null if not in an experiment
  trigger: 'onboarding_end',                 // 'profile' | 'inline_upsell' | 'deeplink'
  weekly_product_id: weeklyPkg.product.identifier,
  weekly_price_cents: Math.round(weeklyPkg.product.price * 100),
  yearly_product_id: yearlyPkg.product.identifier,
  yearly_price_cents: Math.round(yearlyPkg.product.price * 100),
  currency: weeklyPkg.product.currencyCode,
  has_trial: yearlyPkg.product.introPrice !== null,
});
```

Same property shape for:

- `paywall_purchase_started` — add `package_type: 'weekly' | 'annual'`
- `paywall_purchase_completed` — add `package_type`, `transaction_id`
- `paywall_purchase_cancelled` — add `package_type`, `cancel_reason`
- `paywall_dismissed` — no extra fields

Never drop the shared top-level fields between these events. If you do, you
lose the ability to funnel them together in PostHog.

### Why both sides

- **PostHog events** give you *funnel* analytics (view → started → completed)
  and *upstream* attribution (which onboarding step led to the purchase).
- **`subscriptions` columns** give you *server-of-record* attribution that
  survives PostHog data loss, client-side capture failures, and re-installs.
  These are also what retention and churn queries join against.

If you only have one of the two, your experiment analysis breaks the first
time something goes wrong in production.

## The first experiment: pricing tier

### When to start

After **2–4 weeks** of steady `default_mid` traffic. You need enough
baseline paywall views to confirm your conversion rate is stable
(±20% week-over-week is normal, >50% swings mean you don't have a stable
baseline yet).

### Experiment setup

RevenueCat dashboard → Experiments → New experiment.

- **Name:** `pricing_tier_v1`
- **Hypothesis:** `default_high` produces higher revenue per paywall view
  than `default_mid`, and `default_low` produces lower.
- **Control:** `default_mid`
- **Treatments:** `default_low`, `default_high`
- **Traffic split:** 34 / 33 / 33
- **Primary metric:** revenue per paywall view (RC native)
- **Secondary metrics:** trial-to-paid conversion, day-30 retention
- **Minimum duration:** 4 weeks
- **Minimum sample:** 1,500 paywall views per arm

### Reading results

- Ignore the dashboard's "winner" banner until **both** minimum duration and
  minimum sample thresholds are met.
- A low-price arm converting 2× better is not automatically a winner.
  Compare *revenue per view*. If low-price produces $0.60/view and mid-price
  produces $0.80/view, mid-price wins even though fewer people converted.
- Look at **day-30 and day-60 retention** per arm. High-price tests can show
  strong initial conversion but worse retention as users feel the pain at
  renewal time. Only revenue + retention together gives you the LTV story.

### After the test

1. Declare the winner.
2. Change the current offering in RevenueCat to the winning offering.
3. Stop the experiment.
4. Keep the non-winning offerings in place — you'll reuse them for future
   tests (seasonality, new countries, etc.).
5. Write a one-page summary: what you tested, what you learned, next test.

## What you can test next (and in what order)

1. **Annual price point** (the one above). Highest revenue leverage.
2. **Weekly price point**, separately. Run after annual is locked in.
3. **Trial length** — 3-day vs 7-day vs no-trial-on-annual. This is
   structurally similar to a price test and uses the same offering
   machinery.
4. **Paywall UI variant** (copy, imagery, package ordering) — RevenueCat
   Paywalls + Experiments feature. Separate from pricing.
5. **Gate timing** — when to show the paywall. This is a PostHog feature-flag
   test, not a RevenueCat test.

Never test more than one of these at a time against the same audience. If
traffic is high enough, you can interleave: finish pricing, then run UI
variant, then run trial length, etc.

## Segmentation queries you'll want

Once `subscriptions.initial_offering_id` is populated, you can answer:

- **Revenue by arm:** group `subscriptions` by `initial_offering_id`, sum
  whatever revenue you compute from product prices.
- **Retention by arm:** join `subscriptions` → `daily_activity`, filter by
  `initial_offering_id`, compute activity by days-since-signup.
- **Feature-use by arm:** join `subscriptions` → `breath_hold_sessions`,
  segment by `initial_offering_id` to see if high-price buyers use the app
  more (likely — they self-selected into paying more).
- **Churn by arm:** filter `subscriptions` where `status in ('expired',
  'cancelled')` and group by `initial_offering_id`.

All of this is possible **only** because `initial_offering_id` is written
once at `INITIAL_PURCHASE` and preserved. If it were overwritten on
`RENEWAL` or `PRODUCT_CHANGE`, you'd lose the attribution.

## Common mistakes

- **Shipping without the three `subscriptions` columns.** You cannot
  retroactively attribute existing users to arms. Ship them from day 1.
- **Letting the webhook overwrite `initial_offering_id` on renewal.** This
  is why the webhook logic is `only on INITIAL_PURCHASE`. Don't "simplify"
  it.
- **Testing during launch week.** Launch-week traffic is curious, not
  representative. Wait for steady-state before starting any experiment.
- **Running pricing experiments during seasonal events** (holidays, New
  Year). Re-run any promising result outside the season before committing.
- **Not instrumenting PostHog with the same offering/experiment fields the
  webhook captures.** If the two don't match, you can't cross-reference
  funnel analysis with server revenue.
- **Peeking at results daily and stopping early.** RevenueCat's significance
  calculation is optimistic. Commit to your minimum sample before starting.
- **Moving an existing user across arms.** Apple won't let you, and trying
  to fake it via app logic will make your data unanalyzable.

## Edge cases and recovery

### The webhook missed an `INITIAL_PURCHASE`

If Supabase or the Edge Function was down during a user's first purchase,
the follow-up `RENEWAL` webhook is what creates the `subscriptions` row.
In that case `initial_offering_id` stays null permanently. You will not be
able to attribute that user to an arm. Two mitigations:

1. Keep webhook uptime monitored (alert on RevenueCat delivery failures in
   their dashboard).
2. Backfill at the application layer: when the app first reads
   `user_entitlement_v` after a purchase and finds `initial_offering_id =
   null`, you can call an authenticated RPC to write it from the RevenueCat
   SDK's `customerInfo` response. This is a v2 improvement, not shipped in
   v1.

### A user purchases, refunds, then re-purchases under a different offering

The first subscription row's `initial_offering_id` reflects the first
purchase. A refund event does not clear the row; a second `INITIAL_PURCHASE`
*should* arrive with the new offering. The current webhook preserves the
first `initial_offering_id` even then. If you care about the "effective
current arm" for recovered users, add a separate `most_recent_offering_id`
column. Not in v1.

### RevenueCat changes their webhook payload shape

They have, historically. The webhook defensively reads multiple possible
field names (`presented_offering_id`, `presented_offering_identifier`) and
falls back to null. If RevenueCat introduces a new field name, the webhook
will silently stop capturing — add a monitor: alert when the rate of rows
with `initial_offering_id is null` for new `INITIAL_PURCHASE` events
exceeds 5%.

## Summary checklist

Before you launch:

- [ ] Six products created in App Store Connect, across three price points
- [ ] Three offerings created in RevenueCat (`default_low/mid/high`)
- [ ] `default_mid` marked as current offering
- [ ] Migration `20260424000300` applied
- [ ] Webhook deployed and capturing `initial_offering_id` on
      `INITIAL_PURCHASE`
- [ ] PostHog events wired with the property shape above
- [ ] No experiment running yet

After 2–4 weeks of baseline:

- [ ] Launch `pricing_tier_v1` experiment
- [ ] Do not peek early
- [ ] Evaluate on revenue per view + day-30 retention
- [ ] Declare winner, change current offering, stop experiment
- [ ] Write post-mortem for the next test
