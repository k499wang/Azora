# Switching between the trial and no-trial paywall

Everything is done in the RevenueCat dashboard. No app release is needed.

## What decides what a user sees

| Setting | Where | Result |
|---|---|---|
| Which **offering** a user gets | Targeting rule for the placement (or the Default offering) | Trial products or no-trial products |
| `paywall_layout` metadata on that offering | Offering → Metadata | `"long"` = long scrolling page (trial or no trial), missing = step deck |
| `paywall_mode` metadata on that offering | Offering → Metadata | `"hard"` = no close button, missing = soft |

Offerings:

| Offering | Products | Metadata |
|---|---|---|
| Trial (current default) | Annual with free trial + weekly | `paywall_layout` missing or `"deck"` |
| `no_trial_main` | Annual $59.99, no trial (+ weekly) | `"paywall_layout": "long"` |
| `no_trial_exit` | Annual $39.99, no trial | none needed |

Placements the app asks for:

- `onboarding_complete`: the onboarding paywall
- `exit_discount`: the exit offer
- `profile_upgrade` and the other `*_gate` placements: the in-app Pro paywall

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
