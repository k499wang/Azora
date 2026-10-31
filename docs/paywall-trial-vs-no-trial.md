# How the paywall works (every remote control)

Almost everything about the paywall is controlled remotely, in **RevenueCat**,
with a few copy switches in **PostHog**. No app release is needed for anything
in this section; users pick up a change the next time the app loads offerings
(fully close and reopen to check).

## The pieces

1. **Placement** — where in the app the paywall opens. The app asks RevenueCat
   for "the offering for placement X".
2. **Offering** — what RevenueCat answers with: the products (packages) to sell
   plus metadata keys that shape the screen. Which offering a placement gets is
   set by RevenueCat **Targeting** rules (or the Default offering).
3. **Products / trials** — prices, free trials and paid intro offers live on
   the products in App Store Connect. The app only shows a trial if the product
   has one **and** RevenueCat says this user is still eligible.
4. **PostHog flags** — a few copy switches on top.

## Placements the app asks for

| Placement | Where it opens |
|---|---|
| `onboarding_complete` | The onboarding paywall (end of onboarding) |
| `exit_discount` | Exit offer: after onboarding without buying, after cancelling the purchase sheet, or after sitting idle on the paywall |
| `profile_upgrade` | The in-app Pro paywall, and the paywall shown on app start for non-Pro users |
| `heart_rate_pro_gate`, `daily_result_pro_gate`, `exercise_premium_gate`, `routine_preset_pro_gate`, `routine_todo_limit_pro_gate`, `plan_week_pro_gate`, `azo_assist_pro_gate` | Pro gates on those features |

In Targeting, "All other cases" covers every placement you don't list.

## Offerings

| Offering | Products | Metadata |
|---|---|---|
| Trial (current default) | Annual with free trial + weekly | `paywall_layout` missing or `"deck"` |
| `no_trial_main` | Annual $59.99, no trial (+ weekly) | `"paywall_layout": "long"` |
| `no_trial_exit` | Annual $39.99, no trial | none needed |
| `paid_trial_monthly` | The one short plan (monthly or weekly) with a paid intro offer | not a placement offering — see below |

**`paid_trial_monthly` is special.** Every paywall takes its short plan from
this offering, whatever offering the placement got. It must contain one
monthly or weekly package. If it is missing or empty, the app falls back to
the placement offering's own monthly package. The annual plan always comes
from the placement offering; leave annual out of an offering and the paywall
sells only the short plan.

## Offering metadata keys

Set in RevenueCat → Offering → Metadata. Values are lowercase and exact; a typo
quietly falls back to the default.

| Key | Values | Effect | Default when missing |
|---|---|---|---|
| `paywall_layout` | `"deck"` | Step deck: benefits → free-trial gift → reminder → trial timeline + plans | ✔ |
| | `"long"` | One long scrolling page with plan cards, comparison, testimonials, journey | |
| | `"long_then_trial"` | The long page; its Continue slides up the deck's trial timeline screen | |
| `paywall_mode` | `"hard"` | No way out: no close / "continue without Pro" in onboarding, and the app-start paywall (read from `profile_upgrade`) blocks the app | `soft` (closeable) |
| `trial_package` | `"annual"` | Trial timeline screen offers only the annual plan (free or paid trial); no plan card, review cards instead. Both packages stay in the offering | every package |
| | `"weekly"` (or `"monthly"`) | Same, but only the short plan (which still comes from `paid_trial_monthly`) | |
| `trial_options` | `"paid_only"` | Older name for `trial_package: "weekly"`; still works | |
| `trial_title` | any text, `{days}` = trial length | Title of the paid-trial-only timeline screen, e.g. `"Try your plan for {days} days"` | `"How your {days}-day trial works"` |
| `benefits_title` | any text, `{plan}` = goal noun | Replaces the deck's benefits-step title (only when a free trial is shown) | built-in title |
| `experiment_id`, `experiment_variant` | any text | Attached to every paywall analytics event so PostHog can split by variant | null |

Rules that apply to every layout:

- If the offering fails to load, the app uses `soft` + `deck`, so a config
  or network problem never locks anyone out.
- **The plan card only appears when there are two plans to pick from.** With a
  single plan (annual-only offering, short-plan-only offering, or
  `trial_package`) the timeline screen shows just the timeline
  and the button.
- The deck only shows the benefits / gift / reminder intro steps when the
  annual plan has a free trial this user is eligible for. Otherwise it opens
  straight on the plan screen.
- The timeline and button follow the selected plan: annual free trial
  ("Redeem 7 days for $0.00"), a paid intro on either plan ("Redeem 7 days for
  $4.99"), or plain prices ("Subscribe yearly" / "Continue with monthly") when
  the user is not eligible for a trial.

- **A paid intro on the annual plan only shows on the trial timeline screen.**
  The long page and plan cards still show annual as its full price ("Annual",
  "Subscribe yearly"). Don't serve an annual paid-trial product to `long` or
  `long_then_trial` offerings.

## PostHog feature flags

| Flag | Type | Effect on the paywall |
|---|---|---|
| `cleaning_mode` | boolean | Serves the cleaning onboarding flow; its paywall uses cleaning-only copy |
| `paywall_transformation_headline` | boolean | Cleaning flow only: swaps the long page's "4.2X" headline for the cleaning transformation headline |
| `skip_azo_chat` | boolean | Onboarding only (drops the Azo chat); no paywall effect |

Products, prices and which offering a user gets are **never** decided by
PostHog — only by RevenueCat.

## Recipes

| I want… | Do this in RevenueCat |
|---|---|
| Only the annual paid trial on the trial timeline | Add `"trial_package": "annual"` to the offering |
| Only the weekly paid trial on the trial timeline | Add `"trial_package": "weekly"` to the offering |
| Only the paid trial everywhere (long page too) | Make an offering without the annual package |
| No trial | See "Switch to no trial" below |
| No way to skip the paywall | `"paywall_mode": "hard"` |
| A/B test the paid-trial title | See "A/B test the paid-trial title" below |
| A/B test two paywalls | RevenueCat Experiment between two offerings, each with its own `experiment_variant` |
| Test before production | Add a Targeting condition (e.g. app version) that only matches you |

## A/B test the paid-trial title

1. Make sure the current paid-trial offering has `"trial_package": "weekly"`.
2. Duplicate it twice (same packages), with metadata:

   | Offering | Metadata |
   |---|---|
   | `paid_trial_title_a` | `{ "trial_package": "weekly", "experiment_id": "paid_trial_title", "experiment_variant": "how_it_works" }` (no `trial_title`, uses the default) |
   | `paid_trial_title_b` | `{ "trial_package": "weekly", "experiment_id": "paid_trial_title", "experiment_variant": "try_your_plan", "trial_title": "Try your plan for {days} days" }` |

   Keep any other metadata (`paywall_layout`, `paywall_mode`, …) identical in both.
3. RevenueCat → **Experiments** → new experiment on placement
   `onboarding_complete`, control `paid_trial_title_a`, treatment
   `paid_trial_title_b`, 50/50, new customers only.
4. Read results in RevenueCat (trial starts, conversion to paid, revenue), or in
   PostHog by splitting `paywall_step_viewed` (`paywall_step: plan`) and
   `paywall_purchase_started` by `experiment_variant`.
5. Run until each arm has a few hundred plan-screen views before calling it.

Needs the build with `trial_title` support; older builds ignore the key and
show their built-in title in both arms.

## Tracking the deck

`paywall_viewed` means subscription options loaded. For the deck, use
`paywall_step_viewed` with `paywall_step: benefits`, `hero`, `reminder`, and `plan`
to measure progress through benefits, the free-trial gift, reminder timing choice,
and pricing. The trial deck has four steps; earlier builds have three and no
separate `reminder` event.
The gift screen shows the eligible store trial's actual duration. The reminder
screen shows a bell and offers two or three days before billing;
choosing a time still requires notification consent and a successful preference save.
Each event waits for layout and a completed entrance while foregrounded, and
includes the shared `paywall_view_id`. Direct upgrades and no-trial decks emit
only `plan` at index 1 of 1. Previews and long layouts do not emit deck steps.
These events become available after the instrumented app build ships; older
sessions cannot be reconstructed from offering-load events. See
[the analytics contract](analytics/current-posthog-events.md#paywall).

## Switch to no trial

1. RevenueCat → **Targeting** → open (or create) the rule.
2. Set `onboarding_complete` → `no_trial_main`.
3. Set `exit_discount` → `no_trial_exit`.
4. Set **all other cases** → `no_trial_main` if the in-app paywall should also be no-trial.
5. Save. Users get it the next time the app loads offerings (fully close and reopen to check).

## Switch back to trial

1. RevenueCat → **Targeting** → open the same rule.
2. Point the placements back at the trial offering, or turn the rule off so everyone gets the Default offering.
3. Save.

## Trial timeline in onboarding, long page everywhere else

The layout belongs to the offering, so this needs two offerings.

1. Duplicate the trial offering as `trial_long` (same packages) and set its metadata:
   ```json
   { "paywall_layout": "long" }
   ```
   Leave the original trial offering without a `paywall_layout` key.
2. RevenueCat → **Targeting** → open the rule and set:

   | Placement | Offering | User sees |
   |---|---|---|
   | `onboarding_complete` | trial offering | Trial timeline deck |
   | `exit_discount` | exit offering | Exit offer |
   | All other cases | `trial_long` | Long scrolling page |

3. Save.

"All other cases" covers `profile_upgrade`, the paywall shown on app start, and every `*_gate` placement. For a no-trial long page in the app instead, point "All other cases" at `no_trial_main`.

Most users reaching the in-app paywall have already used their trial in onboarding, so they will usually see the no-trial version of the long page ("Annual" / "Continue").

## Rules

- `"paywall_layout": "long"` works with or without a trial. With a trial the user is eligible for, the annual card reads "Try Free / then $59.99/yr" with "7 days / Free trial" on the right and the button reads "Start my free trial". Without one it reads "Annual" and "Continue".
- Metadata values are lowercase and exact. A typo such as `"Long"` quietly falls back to the step deck.
- Changing Targeting affects **production immediately**, on every app version. To test first, add a condition (e.g. app version) so the rule only matches you.
- Even on a trial offering, a user who already used a trial (or whose eligibility check fails) sees the plan screen without a trial.
- The deck's timeline and checkout follow the selected package: the annual free
  trial or the eligible paid monthly intro from `paid_trial_monthly`. That
  offering must contain a monthly package; otherwise the app uses the placement's
  monthly package. Without an eligible monthly intro, it shows regular monthly
  subscription copy.

## Personalized long page and Settings preview

The long page leads with the user's name, resolved plan outcome, and actual plan
duration, using the assigned onboarding nickname (such as Cool Head or Phone
Detox). It keeps the package picker, Pro comparison, research, testimonials,
and pinned purchase controls, and adds a playful journey with three dated plan
milestones and the onboarding pentagon. Tap **With your plan** to animate from
the assessment to the same goal projection used by onboarding; **Today** returns to the starting
shape. Both controls provide selection haptics and respect the Settings haptics
preference. The projection illustrates goals rather than measured future scores.

Journey descriptions use the assigned preset and selected intent, with the
user's name and stated goal woven into their first step and final milestone.
They describe the feelings and everyday achievements the user is working
toward. The onboarding recommendation screen and paywall both read this copy
from `src/lib/onboardingPlanJourney.ts`, so matching days use identical
descriptions. The recommendation screen retains its early day-three and
day-seven encouragement and its daily activity preview.
Goals that share a plan (such as stress and repeated worries) keep their own
wording, while refined plans such as Phone Detox retain their specific focus.

Onboarding passes its current assessment and refined preset directly. In-app
upgrades read the saved profile and enrolled preset only for long offerings.
The in-app pentagon requires saved stress and sleep answers; it reconstructs
scores from the persisted assessment, which does not include every contextual
strain used during onboarding. Target dates count today as day one and assume
one completed plan day each calendar day. The page explains that the plan waits
when a day is missed.

In a development build, open **Settings → Preview onboarding paywall (dev)**.
The preview uses Alex's sample stress-relief plan and sample prices, without
an extra header or layout switch.
Purchase and restore buttons show a preview-only alert; reminders remain local
and no RevenueCat offering is changed. This preview opens only the long
scrollable paywall.

## Check what loaded

In a dev build, open the paywall and find `[revenuecat-debug] paywall_offering_loaded` in the console:

- `offeringIdentifier`: which offering loaded
- `hasIntroOffer`: whether the product has a free trial
- `introOfferEligibilityStatus`: whether this user gets it

## Reset a tester's trial

- Device: Settings → Developer → Sandbox Apple Account → Manage → Clear Purchase History.
- Simulator: Xcode → Debug → StoreKit → Manage Transactions → delete transactions.
