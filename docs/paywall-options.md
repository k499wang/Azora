# Paywall Options

How to get each paywall from RevenueCat, without shipping an app update. Everything here is read from the offering in `src/services/paywall/paywallService.ts`.

## Setting it up

1. In RevenueCat, create an offering and add the packages you want to sell.
2. In the offering's **Metadata**, add the keys below as JSON.
3. Use RevenueCat Targeting to serve that offering to a placement:
   - `onboarding_complete` is the paywall at the end of onboarding.
   - `profile_upgrade` and the `*_pro_gate` placements are in-app upgrades.
   - `exit_discount` is the special offer.
4. Trials are not set here. Create free trials and paid trials as introductory offers on the product in App Store Connect.

To see any combination with sample prices, use Settings → "Preview paywall plans: weekly, trials, any paywall (dev)". The picker does not apply the package rules in [Which plans people see](#which-plans-people-see), so check real offerings in sandbox.

## Metadata keys

All keys are optional. Any missing or unknown value uses the default.

| Key | Values | Default | What it does |
|---|---|---|---|
| `paywall_layout` | `deck`, `deck_plan`, `plan`, `home_card`, `long`, `long_then_trial` | `deck` | Which paywall to show |
| `paywall_mode` | `soft`, `hard` | `soft` | `hard` removes the way out, and non-Pro users stay locked |
| `plan_picker` | `stacked`, `side_by_side` | `stacked` | How two plans are shown on the steps paywalls |
| `trial_package` | `annual`, `monthly`, `weekly` | none | Sell only this plan |
| `trial_options` | `paid_only` | none | Sell only the short plan. Ignored if `trial_package` is a valid value |
| `benefits_title` | text, `{plan}` becomes the goal noun | built-in title | Headline on the first step of `deck`, for offerings with a free trial |
| `trial_title` | text, `{days}` becomes the trial length | built-in title | Headline on the plan step when only one plan is sold |
| `experiment_id` | text | none | Added to paywall analytics |
| `experiment_variant` | text | none | Added to paywall analytics |

## Paywalls

### Steps (`deck`)

Benefits, then reminder choice, then the plan step. Without a free trial, it goes straight to the plan step.

```json
{ "paywall_layout": "deck", "paywall_mode": "hard", "plan_picker": "side_by_side" }
```

### Steps, opens on the plan (`deck_plan`)

The 7-day plan screen replaces benefits, then reminder choice, then the plan step. Without a free trial, it goes from the plan screen to the plan step.

```json
{ "paywall_layout": "deck_plan", "paywall_mode": "hard", "plan_picker": "side_by_side" }
```

### Plan paywall (`plan`)

One page: the first 7 days with By Day 3, 5 and 7 callouts, above one package. There is no plan picker.

```json
{ "paywall_layout": "plan", "paywall_mode": "hard", "trial_package": "annual" }
```

### Home card (`home_card`)

Onboarding finishes unpaid, and one card sells over a blurred Home. Buying it closes the card and starts the tour, with no Pro welcome screen. It sells one package.

Only use this on `onboarding_complete`. On in-app placements it falls back to `deck`.

```json
{ "paywall_layout": "home_card", "paywall_mode": "soft", "trial_package": "annual" }
```

On `soft`, an X appears after 5 seconds, and closing the card queues the special offer. On `hard` there is no X. The card does not come back after a relaunch: non-Pro users get the tour, then the normal boot paywall.

### Long page (`long`)

A single scrolling page with plan cards and a pinned button. It ignores `plan_picker`.

```json
{ "paywall_layout": "long", "paywall_mode": "hard" }
```

### Long page, then trial (`long_then_trial`)

The long page, whose Continue button slides up the plan step.

```json
{ "paywall_layout": "long_then_trial", "paywall_mode": "hard" }
```

## Plan combinations

A paywall shows two plans at most.

| You want | Packages in the offering | Metadata |
|---|---|---|
| Annual free trial + monthly paid trial | Annual and monthly, each with its intro offer | none needed |
| Annual free trial + weekly paid trial | Annual and weekly, each with its intro offer | none needed |
| Annual + weekly, both paid trials | Annual and weekly, each with its intro offer | none needed |
| Monthly + weekly, any trials | Monthly and weekly | none needed |
| Monthly paid trial + weekly free trial | Monthly and weekly, each with its intro offer | `"plan_picker": "side_by_side"` if wanted |
| One plan, annual | Annual | `"trial_package": "annual"` |
| One plan, weekly with a free or paid trial | Weekly with its intro offer | `"trial_package": "weekly"` |
| One plan, monthly with a free or paid trial | Monthly with its intro offer | `"trial_package": "monthly"` |

## Which plans people see

These rules apply on every placement except `exit_discount`, which sells only what its own offering holds.

1. **Slots:** there are two. The first is annual. If the offering has monthly and weekly but no annual, monthly takes the first slot and weekly the second. The app's `annual` and `monthly` IDs refer to these slots, not always the billing period.
2. **Short plans without an intro offer get swapped:** if the offering's short plan has no intro offer, and no monthly + weekly pair applies, the app sells the short plan from the `paid_trial_monthly` offering instead, if that offering exists.
3. **Annual on its own still gets a second plan:** an annual-only offering also gets that `paid_trial_monthly` plan. Add `"trial_package": "annual"` to sell annual alone.
4. **Which plan is selected:** a weekly free trial is selected if no other plan has a free trial. Otherwise it's the first slot.
5. **Single-plan paywalls** (`plan`, `home_card`) sell the `trial_package` plan, otherwise the plan that would be selected by default.
6. **Eligibility:** someone who isn't eligible for an intro offer sees that plan without its trial.

## Behavior worth knowing

- **In-app upgrades:** these open directly on the plan step of the steps paywalls, skipping the benefits, plan screen and reminder steps.
- **Reminder step:** trials longer than 3 days ask whether to remind 2 or 3 days before. A 3-day trial says "We'll remind you 2 days before your trial ends", with no choice. Continue turns the reminder on and asks for notification permission. Trials of 2 days or less can't have a reminder.
- **Button text:** the button says "Redeem N-day trial", never a price. The billed price stays visible for Apple's 3.1.2(c) rule.
- **Known copy issue:** on combinations with a free and a paid trial, the steps still say "Design Your Free Trial Experience" and "No Payment Due Now" if someone selects the paid plan.
