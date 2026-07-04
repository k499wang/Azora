# Attribution Test Matrix (AppsFlyer + RevenueCat + SKAN)

Full QA surface for the attribution stack and **how to verify each item is correct** —
where to look, what a pass looks like, what a failure looks like.

Companion to [`skan-testing.md`](./skan-testing.md) (SKAN-specific flow) and
[`attribution.md`](./attribution.md). Test on a **physical device**; SKAN and ATT do not
work in the simulator.

Key code references:
- `src/services/attribution/appsFlyerClient.ts` — SDK init, events, customer user id
- `src/services/attribution/attPrompt.ts` — ATT prompt
- `src/services/subscriptions/revenueCatClient.ts` — `$appsflyerId` linkage
- `src/services/paywall/paywallService.ts` — purchase / restore (`weekly`, `annual`)
- `src/services/analytics/onboarding.ts` — `af_complete_registration`

---

## A. RevenueCat event coverage (beyond first purchase)

RevenueCat is the **sole sender** of revenue events (S2S). Each lifecycle event behaves
differently, so test them individually.

### A1. Trial → paid renewal
- **Do:** start a trial, then let it convert (or force a sandbox renewal — sandbox
  renewals are time-compressed).
- **Verify correct:** RevenueCat → **Customer View → Customer History** shows a
  `RENEWAL` / conversion event, and its **AppsFlyer integration** sub-entry shows
  *delivered*. AppsFlyer reporting shows the revenue attributed to the same install.
- **Fail looks like:** event in RevenueCat but no AppsFlyer delivery row → missing
  `$appsflyerId` or sandbox key. Revenue in AppsFlyer but not RevenueCat → a stray SDK
  event (double-count source).

### A2. Restore purchases
- **Do:** call restore (`restorePaywallPurchases`) on a device with an existing entitlement.
- **Verify correct:** entitlement returns, and **no new revenue event** is emitted to
  AppsFlyer (restores must not re-bill or re-count).
- **Fail looks like:** a fresh `af_purchase`/revenue row appears on every restore.

### A3. Cancellation & refund
- **Do:** cancel a sandbox sub / issue a refund.
- **Verify correct:** RevenueCat Customer History shows `CANCELLATION` / refund; AppsFlyer
  revenue reflects the adjustment (no phantom positive revenue after refund).

### A4. Both products (price-point bucketing)
- **Do:** purchase the **weekly** and the **annual** (`azora_pro_yearly_5999_v2`) packages
  on separate test users.
- **Verify correct:** in **SKAN Conversion Studio**, each price lands in a **distinct
  revenue bucket** of the Subscription template. Decode shows the right value per product.
- **Fail looks like:** both products collapse into one bucket (bucket ranges too coarse,
  or `af_revenue` missing).

---

## B. Revenue integrity (double-count guard)

### B1. No SDK-side revenue events
- **Verify correct:** `grep -rn "af_purchase\|af_subscribe\|af_start_trial" src/` returns
  **nothing** in app code. Only `af_complete_registration` should exist.
- **Fail looks like:** any SDK revenue event → RevenueCat + SDK both send → double-count.

### B2. Totals reconcile
- **Do:** pick a test window with known purchases.
- **Verify correct:** AppsFlyer revenue total == RevenueCat revenue for that window
  (allowing currency rounding).
- **Fail looks like:** AppsFlyer ≈ 2× RevenueCat → duplicate sender.

### B3. Currency
- **Do:** purchase with a non-USD App Store region (if you sell internationally).
- **Verify correct:** the event carries the correct `af_currency`; AppsFlyer converts to
  your reporting currency rather than dumping everything as USD.

---

## C. ATT behavior (`attPrompt.ts`)

### C1. Prompt shows once
- **Verify correct:** ATT dialog appears once during onboarding, never again on relaunch
  (status moves off `undetermined`; `requestAttPermissionOnce` early-returns thereafter).

### C2. Allow and Deny both work
- **Do:** test a fresh install on the **Allow** path and another on **Deny**.
- **Verify correct:** onboarding completes either way; AppsFlyer still records an install
  on both. The SDK initializes in manual-start mode, then starts after ATT resolves so
  the install is sent with the resolved tracking state.
- **Watch (`__DEV__`):** console `[appsflyer-diag] install conversion OK` confirms the
  device reached AppsFlyer's servers.

### C3. SKAN works regardless of ATT
- **Verify correct:** SKAN install/conversion still reports even when ATT is **denied**.
  This is the entire point of SKAN — it does not depend on the IDFA or ATT consent.

---

## D. Identity linkage

### D1. Customer user id lifecycle
- **Do:** log in, then log out.
- **Verify correct:** `setAppsFlyerCustomerUserId` is set on login and
  `clearAppsFlyerCustomerUserId` on logout (`appsFlyerClient.ts`); the AppsFlyer customer
  user id matches your Supabase user id.

### D2. `$appsflyerId` set before first purchase
- **Verify correct:** in RevenueCat Customer View, the customer has the `$appsflyerId`
  attribute **before** the purchase event (set in `revenueCatClient.ts`). Without it the
  S2S event cannot attribute to the AppsFlyer install.
- **Fail looks like:** purchase event delivered to AppsFlyer but unattributed / "organic".

---

## E. Android (separate pipeline — currently untested)

Android does **not** use SKAN. It uses Google Play Install Referrer. None of the iOS
testing carries over.

### E1. Install attribution
- **Verify correct:** install on a real Android device attributes in AppsFlyer via Play
  Install Referrer.

### E2. RevenueCat events on Android
- **Verify correct:** purchase events flow RevenueCat → AppsFlyer using the **Android** dev
  key; revenue appears under the Android app.

### E3. Card/shadow parity is unrelated — but run the flow on Android at least once before
relying on attribution numbers there.

---

## F. Production config hygiene

### F1. Sandbox key removed in production
- **Verify correct:** RevenueCat AppsFlyer integration has **no sandbox dev key** on the
  production side, so sandbox purchases never reach production reporting.

### F2. Release build is not debug
- **Verify correct:** `isDebug` resolves `false` in a release build (it's `__DEV__` in
  `appsFlyerClient.ts`). Confirm against a production EAS build, not a dev client.

### F3. `SKAdNetworkItems` shipped in the binary
- **Do:** unzip the built `.ipa` (or inspect the EAS build) and open `Info.plist`.
- **Verify correct:** the `SKAdNetworkItems` array is present and contains **AppsFlyer's
  full downloaded ID list** (not just the seeded subset in `app.config.js`), including the
  Meta IDs.
- **Fail looks like:** array missing → Apple sends no postbacks for those networks.

---

## G. Deep links & Meta cost sync

### G1. Deferred + direct deep links (`onDeepLink`)
- **Do:** open a OneLink both with the app installed (direct) and not installed (deferred).
- **Verify correct:** the handler resolves `deepLinkValue`, and `media_source` / `campaign`
  are populated; routing lands on the intended screen.

### G2. Meta cost data sync ("Jaay Bo" panel)
- **Verify correct:** after the campaign runs, the SKAN reporting panel's **Last sync time**
  updates and status is healthy; spend/impressions appear so ROAS can compute.
- **Fail looks like:** "never synced" persists → Meta reporting API token lacks `ads_read`
  or account access; reconnect with an Admin/Analyst Meta user.

---

## Priority

Highest risk if skipped: **B (double-count)**, **A1/A2 (renewal & restore)**, **E
(Android)** — these silently corrupt data or break an entire platform. Do those before the
nice-to-haves (G1, C1).

## Quick verification cheat-sheet

| Check | Where | Pass = |
| --- | --- | --- |
| Event delivered to AppsFlyer | RC → Customer History → event → integrations | "delivered" row |
| No SDK revenue events | `grep af_purchase src/` | no matches |
| Revenue reconciles | AppsFlyer vs RevenueCat totals | equal (±rounding) |
| ATT once | relaunch app | no second prompt |
| SKAN ID list shipped | `.ipa` Info.plist | full array present |
| Install attributed | AppsFlyer dashboard | non-organic w/ media source |
| Conversion value decoded | AppsFlyer SKAN overview | maps to funnel/revenue |
