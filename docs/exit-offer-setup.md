# Exit Offer Setup (Discounted Annual) + Safe Targeting Adoption

Two things in one doc, in dependency order:

1. **Adopt RevenueCat Targeting safely** — without breaking paywalls in
   already-released app versions running on real users' phones.
2. **Add the one-time exit-intent discount** (discounted annual) on top.

Covers **App Store Connect + RevenueCat dashboard config only**. App code is a
separate change once the dashboard is correct.

Related: [`revenuecat-supabase-paywall-guide.md`](./revenuecat-supabase-paywall-guide.md),
[`revenuecat-testing-checklist.md`](./revenuecat-testing-checklist.md).

---

## ⚠️ Read this first — why released versions are at risk

RevenueCat Targeting config lives on **RevenueCat's servers**, not in the app
binary. Every released version of the app — including ones already installed on
users' phones — asks RevenueCat for offerings at runtime via
`getRevenueCatOfferingForPlacement(...)`
(`src/services/subscriptions/revenueCatClient.ts`).

**So the instant you change Targeting, every live app version is affected — no
update required.** That is exactly why Targeting is powerful, and exactly why a
mistake hits production immediately.

### What the live (already-shipped) app requests

The shipped app requests these **five placements**
(`src/services/paywall/paywallPlacements.ts`):

```
onboarding_complete
profile_upgrade
heart_rate_pro_gate
daily_result_pro_gate
exercise_premium_gate
```

Today, with **no Targeting configured**, all five fall back to your current
default offering and work. The risk is this:

> 🚨 If you turn on Targeting and define **only** the new `exit_discount`
> placement, the five placements above may resolve to **null** → blank or broken
> paywalls for existing users.

### The good news (why this is controllable)

- **Old versions never request `exit_discount`** — that code only exists in the
  new build. So adding the `exit_discount` placement **cannot** affect any
  already-released version. The only thing that can hurt live users is
  mishandling the **five existing** placements.
- If every existing placement is mapped to the **same offering it already serves
  today**, the change is a **no-op for all users** — old and new.

**Golden rule:** define all five existing placements *before* you rely on
Targeting, each pointing at your current offering, each with a fallback. Add
`exit_discount` only after that's verified.

---

## Step 0 — Find your current offering identifier

1. RevenueCat → **Offerings**. The one labeled **"Current"** (the default) is
   what all your paywalls show today.
2. Note its identifier. Likely `default`. Write it here for reference:

   **Current offering = `__________`** (fill in, e.g. `default`)

Everywhere below that says `<CURRENT_OFFERING>`, use this identifier.

---

## Step 1 — Adopt Targeting safely (no-op for existing users)

Do this whole step and verify it before touching the exit offer.

1. RevenueCat → **Targeting** → create a **Placement** for **each** of the five
   existing identifiers, mapped to `<CURRENT_OFFERING>`:

   | Placement identifier | Serves offering |
   | --- | --- |
   | `onboarding_complete` | `<CURRENT_OFFERING>` |
   | `profile_upgrade` | `<CURRENT_OFFERING>` |
   | `heart_rate_pro_gate` | `<CURRENT_OFFERING>` |
   | `daily_result_pro_gate` | `<CURRENT_OFFERING>` |
   | `exercise_premium_gate` | `<CURRENT_OFFERING>` |

2. For **each** placement, set the **fallback offering** to `<CURRENT_OFFERING>`
   as well. Fallback = what a customer sees if they match no targeting rule.
   This guarantees a placement **never returns null**.

3. Do **not** add `exit_discount` yet. Do **not** change which products are in
   `<CURRENT_OFFERING>`.

### Verify Step 1 is a true no-op (before going further)

- On a **sandbox** build, open each paywall (onboarding, boot/profile upgrade,
  HR gate, daily result gate, exercise gate) and confirm each shows the **same
  products as before** (your standard yearly + weekly).
- Spot-check in RevenueCat **Customer History** that offering resolution looks
  right.
- Because config is server-side, you are testing the **same rules** that
  released versions now see — if sandbox looks unchanged, production is
  unchanged.

> If anything shows blank or wrong here, **fix it before Step 2.** At this point
> nothing new has been added, so reverting is just deleting the placements.

---

## Step 2 — App Store Connect: the discounted product

`azora_pro_yearly_3999` already exists in the existing subscription group, so
this is just adding the trial + finishing metadata.

1. **My Apps → app → Monetization → Subscriptions** → open the subscription
   group → click **`azora_pro_yearly_3999`**. Confirm price is **$39.99/yr**.
2. Confirm a **localized display name + description** exist (required to submit).
3. Add the **3-day Free Trial introductory offer:**
   - In the product, scroll to **Subscription Prices** → **Introductory Offers**
     → **Set Up Introductory Offer** (the **+**).
   - **Countries/Regions:** all (or match the main product).
   - **Start Date:** today. **End Date:** none / "No End Date".
   - **Type:** **Free** (not Pay Up Front / Pay As You Go — those are paid).
   - **Duration:** **3 days**.
   - Save.
4. Add a **review screenshot** showing the exit paywall where this product
   appears. Apple scrutinizes discount SKUs — show the context.
5. Set status to **Ready to Submit**. New IAP products are reviewed; submit
   attached to the next binary.

> **Trial eligibility is shared across the subscription group, per Apple ID.**
> A user who never started a trial sees "3 days free" on both the main paywall
> and the exit offer. A user who already used their trial sees only the
> discounted price ($39.99, charged immediately). This is Apple-enforced and
> handled automatically by `paywallTrialEligibility.ts`.

---

## Step 3 — RevenueCat: wire the discounted product + exit placement

1. **Products** → add `azora_pro_yearly_3999` (usually auto-detected from App
   Store Connect after a short delay).
2. **Entitlements** → open `Azora  Pro` → **attach** `azora_pro_yearly_3999`.
   - ⚠️ Critical: this is what makes the discounted purchase unlock Pro.
   - ⚠️ The entitlement name has a **double space** (`Azora  Pro`) — matches
     the code (`paywallService.ts`, `entitlementService.ts`).
3. **Offerings** → confirm `default_low`:
   - Its **Annual** package points to `azora_pro_yearly_3999` (the discounted
     SKU) — **not** the standard `azora_pro_yearly_5999_v2`.
   - It also contains `azora_pro_weekly_599`. Harmless — the exit screen renders
     annual only. Removing weekly is optional cleanup.
   - Make sure it is **published**, not draft.
4. **Targeting** → add the new placement:

   | Placement identifier | Serves offering | Fallback |
   | --- | --- | --- |
   | `exit_discount` | `default_low` | `default_low` |

   - This is safe for live versions: **no released app requests `exit_discount`**
     (the code doesn't exist there yet), so this placement is dormant until the
     new build ships.

---

## Step 4 — Sandbox test the full exit flow (before going live)

1. App Store Connect → **Users and Access → Sandbox** → create a sandbox tester.
2. On a real device: **Settings → App Store → Sandbox Account** → sign in.
3. Run the new build, reach the exit offer, purchase with the sandbox account.
   - Sandbox renewals are accelerated (a "year" ≈ minutes).
4. Verify in RevenueCat **Customer History** that the purchase grants the
   `Azora  Pro` entitlement.
5. Confirm trial display: a fresh sandbox Apple ID shows "3 days free"; one that
   already consumed a trial in this group shows only the $39.99 price.

---

## Step 5 — App code ✅ IMPLEMENTED

Presented as a **modal sheet that slides up over Home** after onboarding
finishes (not inside onboarding, and the standalone `ProPaywallScreen` is
untouched). Reuses the existing paywall stack — no new purchase logic.

Flow:
1. User dismisses the onboarding paywall without buying.
2. `OnboardingFlow.continueWithoutPro` sets `useExitOfferStore.pending = true`
   (only when not already Pro), then finishes onboarding normally.
3. `useAppGate` flips to ready → `AppStack` mounts → `MainTabsRoute` reads the
   pending flag once at mount and mounts `ExitOfferPresenter` (instead of the
   boot paywall, so the user never sees both).
4. `ExitOfferPresenter` lets Home paint, then after ~450ms
   `navigation.navigate('ExitOffer')` slides the sheet up.

Files:
- `src/services/paywall/paywallPlacements.ts` — `ExitDiscount: 'exit_discount'`.
- `src/stores/exitOfferStore.ts` — zustand `pending` flag bridging onboarding →
  Home.
- `src/screens/ExitOfferScreen.tsx` — the screen: a **solid single-color**
  (`blue900`) hero with a **curved bottom edge** flowing into the white section,
  big **centered** "One Time Offer / You'll never see this again." + **X close**;
  then "Here's N% Off", "Only $X/mo", a large **countdown timer**, fine-print
  (`trial, then …/yr ($X/mo) · Cancel anytime`), a **Claim Offer** CTA (same
  `blue900`), and Restore / Terms / Privacy. Countdown is honest: at 00:00 the
  timer dims, the CTA disables and becomes "Continue". The curve is the hero
  shape's bottom radius + horizontal `scaleX` (tweak in the `heroShape` style).
- `src/app/navigation/types.ts` + `RootNavigator.tsx` — new `ExitOffer` route
  registered with `presentation: 'modal'` (iOS sheet with the top gap) +
  `slide_from_bottom`; `MainTabsRoute` + `ExitOfferPresenter` added.
- `src/components/onboarding/OnboardingFlow.tsx` — sets the pending flag on
  dismiss; no longer renders the offer itself.

Trigger rules:
- Shows **once per onboarding run** — gated by the in-memory store flag, not
  persisted (no AsyncStorage).
- **`isPro` guard** in two places — `OnboardingFlow` only sets pending when not
  Pro; the boot paywall (also Pro-gated) is suppressed while the offer is
  pending.

Behavior notes:
- Two `usePaywall` hooks on the screen: `exit_discount` (→ `default_low`, the
  discounted price) and `profile_upgrade` (→ `default_mid`) purely to read the
  live standard annual price as the strike-through **anchor**. Discount % and
  the `$X/mo` figure are computed at runtime (≈33% for $59.99 → $39.99; the
  mockup's "40%" is illustrative — the real number reflects live prices).
- `$X/mo` uses RevenueCat's `pricePerMonthString` when present, else annual ÷ 12.
- Analytics come for free via `usePaywall`: `PaywallViewed`,
  `PaywallPurchaseStarted/Completed`, `PaywallDismissed`, all with
  `placement: exit_discount`.
- Degrades safely: if `default_low` isn't live yet it shows a loader then a
  "Try again" path — never traps the user.

### Previewing during development

The screen is a normal route — from any screen with a typed navigation prop call
`navigation.navigate('ExitOffer')`, or temporarily set `pending: true` as the
initial value in `src/stores/exitOfferStore.ts` to have it present on the next
launch into Home.

### Client-side consequences (accepted for v1)

- Gating is per-onboarding-run (in-memory store flag), not persisted — a user
  who re-runs onboarding can see the offer again. RevenueCat/Apple still
  validate the actual purchase server-side.
- The exit offer code is new, so it only runs on the new build.

---

## ⚠️ App Store review risk (read before submitting)

Apple has **rejected apps** for exit-offer popups under Guideline 3.1.1, citing:
> "The app attempts to manipulate customers into making unwanted in-app
> purchases. Specifically, after users close the subscription screen, another
> offer appears."

To stay on the safe side of this:
- Keep the **"No thanks, continue free"** dismiss obvious and easy (we do).
- Show the exit offer **once per onboarding run**, never in a loop (we do —
  in-memory `useExitOfferStore` flag, cleared after presenting).
- The countdown is a *real* expiry (CTA disables and the offer becomes
  "Continue free" at 0:00) — not a fake/resetting timer, which is what Apple
  flags. Keep it that way.
- Consider rolling out / testing on **Android first**, then submit iOS.
- Have the review screenshot show the exit screen *and* its dismiss button.

---

## References — what good exit offers look like

Visual galleries & teardowns:
- [Mobbin — subscription paywall screens](https://mobbin.com/explore/mobile/screens/subscription-paywall)
  (filter for discount / "special offer" screens)
- [Funnel Teardowns — Blinkist](https://www.funnelteardowns.net/teardown/blinkist)
  (the canonical escalating-discount example: 50% → 60% → 75% off annual)
- [FunnelFox — effective paywall screen designs](https://blog.funnelfox.com/effective-paywall-screen-designs-mobile-apps/)
- [Adapty — 10 types of mobile app paywalls](https://adapty.io/blog/the-10-types-of-mobile-app-paywalls/)

Strategy & implementation:
- [RevenueCat — Exit offers in RevenueCat Paywalls](https://www.revenuecat.com/blog/engineering/exit-offers-in-revenuecat-paywalls/)
- [RevenueCat changelog — native "exit offers when a paywall is dismissed"](https://www.revenuecat.com/release/show-exit-offers-when-a-paywall-is-dismissed-2025-12-31)
  (native feature for RevenueCat's Paywall Builder; ours is custom RN UI, but
  useful context if we ever adopt their prebuilt paywalls)
- [RevenueCat — 8 paywall test ideas to grow revenue](https://www.revenuecat.com/blog/growth/paywall-tests-grow-app-revenue/)
- [RevenueCat — what top apps get right about paywalls](https://www.revenuecat.com/blog/growth/how-top-apps-approach-paywalls/)
- [Retention.blog — expert paywall tips](https://www.retention.blog/p/expert-paywall-tips)
- [DEV — exit offers and paywall A/B testing that moves revenue](https://dev.to/software_mvp-factory/exit-offers-and-paywall-ab-testing-that-actually-moves-revenue-4ke3)

Reported impact: exit offers have added **~15–20% total revenue** for some apps
(per RevenueCat).

---

## Rollback / panic plan

- **A live paywall breaks after Targeting changes:** in Targeting, set the
  affected placement's offering **and** fallback back to `<CURRENT_OFFERING>`.
  Effect is near-instant (server-side) — no app update needed.
- **Worst case:** delete all the placements you created. With no placements,
  behavior reverts to "every placement falls back to the current offering" —
  exactly today's state.
- Keep `<CURRENT_OFFERING>` and its products unchanged throughout this work so
  there is always a known-good offering to fall back to.

---

## Checklist

### Targeting (do first, verify before exit offer)
- [ ] Current offering identifier recorded (`<CURRENT_OFFERING>`)
- [ ] All five existing placements created, each serving `<CURRENT_OFFERING>`
- [ ] Each placement's fallback set to `<CURRENT_OFFERING>`
- [ ] Sandbox: all five existing paywalls show the same products as before
- [ ] Confirmed no visible change for existing users

### Exit offer
- [ ] `azora_pro_yearly_3999` is $39.99 in the existing group
- [ ] 3-day free-trial intro offer added to the product
- [ ] Localized name/description + review screenshot added
- [ ] Product status: Ready to Submit
- [ ] Product added in RevenueCat + attached to `Azora  Pro` entitlement
- [ ] `default_low` annual package points to `azora_pro_yearly_3999`, published
- [ ] `exit_discount` placement created → serves `default_low` (fallback `default_low`)
- [ ] Sandbox purchase grants `Azora  Pro`
- [ ] Trial display verified for fresh vs. trial-exhausted Apple IDs

### App code
- [x] Exit offer implemented (onboarding-paywall dismiss only)
- [x] `npx tsc --noEmit` passes
- [ ] Reviewed against App Store 3.1.1 risk before submitting
