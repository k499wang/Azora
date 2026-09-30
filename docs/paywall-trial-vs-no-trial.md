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

## Rules

- `"paywall_layout": "long"` works with or without a trial. With a trial the user is eligible for, the annual card reads "Try Free / then $59.99/yr" with "7 days / Free trial" on the right and the button reads "Try for $0.00". Without one it reads "Annual" and "Continue".
- Metadata values are lowercase and exact. A typo such as `"Long"` quietly falls back to the step deck.
- Changing Targeting affects **production immediately**, on every app version. To test first, add a condition (e.g. app version) so the rule only matches you.
- Even on a trial offering, a user who already used a trial (or whose eligibility check fails) sees the plan screen without a trial.

## Check what loaded

In a dev build, open the paywall and find `[revenuecat-debug] paywall_offering_loaded` in the console:

- `offeringIdentifier`: which offering loaded
- `hasIntroOffer`: whether the product has a free trial
- `introOfferEligibilityStatus`: whether this user gets it

## Reset a tester's trial

- Device: Settings → Developer → Sandbox Apple Account → Manage → Clear Purchase History.
- Simulator: Xcode → Debug → StoreKit → Manage Transactions → delete transactions.
