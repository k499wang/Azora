# AppsFlyer Integration Plan

Status: **Proposed** — not yet implemented.
Owner: Kevin
Last updated: 2026-05-28

MMP decision: **AppsFlyer**. Chosen over Singular/Adjust/Tenjin/Branch for the most mature per-creator attribution (OneLink), the largest integration ecosystem, a free tier that covers our scale (~12k conversions/mo), and seamless scaling to enterprise with no re-migration. See `docs/plans/` discussion notes for the full comparison.

Context: Meta ads + influencer marketing now, TikTok later. iOS first, Android soon. Subscriptions via RevenueCat. Product analytics via PostHog (already wired).

---

## 0. The architectural keystone — one shared identity

We already mint a **RevenueCat app user ID** and sync it to Supabase + PostHog
(`src/services/subscriptions/revenueCatIdentitySync.ts`,
`src/stores/revenueCatIdentityStore.ts`,
`src/services/supabase/authIdentitySync.ts`).

AppsFlyer's **Customer User ID (CUID)** MUST be set to that **same** ID.

```
                 ┌─────────────────────────┐
                 │  RevenueCat app user ID  │  ← single source of truth
                 └────────────┬────────────┘
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
     RevenueCat            PostHog            AppsFlyer
   (subscriptions)   (distinctId/behavior)  (CUID/attribution)
```

Get this right and an influencer install in AppsFlyer joins to a PostHog funnel and a
RevenueCat subscription with zero guesswork. Get it wrong and you have three
disconnected datasets. **This is the most important decision in the integration.**

---

## 1. Target data flow

```
Meta / TikTok / Influencer OneLink
        │  (install + click attribution, SKAN postbacks)
        ▼
   AppsFlyer ──────────────► Meta & TikTok ad optimizers
        ▲                     (sends back: trial_start, subscribe, renewal)
        │ revenue events (server-to-server)
   RevenueCat ──────────────► PostHog (behavior + revenue)
        ▲
   Paywall / StoreKit (ProPaywallScreen.tsx, usePaywall.ts)
```

Revenue events reach AppsFlyer via the **RevenueCat → AppsFlyer** integration
(server-to-server, configured in the RevenueCat dashboard) — not from app code.
App code only handles SDK init, identity (CUID), ATT consent, deep links, and a
small number of funnel events RevenueCat does not send.

---

## 2. Part A — Account & dashboard setup (done outside the codebase)

These are prerequisites. Code cannot be verified end-to-end without the keys from here.

### A1. Meta (greenfield)
1. Create / confirm **Meta Business Manager**.
2. Create a **Meta App** → record the **Meta App ID** and **App Secret**.
3. Create the App's **dataset / pixel**.
4. Add iOS app: bundle `com.azora.breath`, link the **App Store ID**.
5. Pre-register Android package `com.azora.breath` for later.

### A2. AppsFlyer account
1. Create the AppsFlyer account, add the app.
2. Record the **Dev Key**.
3. Register iOS: bundle `com.azora.breath` + App Store ID.
4. Pre-register Android `com.azora.breath`.
5. Configure the **SKAdNetwork conversion-value schema** (start from AppsFlyer's
   default wellness/subscription template).

### A3. Connect the integrations (one-time, in dashboards)
1. **AppsFlyer ↔ Meta:** AppsFlyer integrated-partner page → paste Meta App ID,
   enable install + in-app event mapping. (TikTok later = same flow.)
2. **RevenueCat → AppsFlyer:** RevenueCat dashboard → Integrations → AppsFlyer →
   paste AppsFlyer **Dev Key + App ID**. Enable trial/conversion/renewal events.
   This is the piece that pipes revenue into AppsFlyer attribution.
3. **RevenueCat → Meta** (optional but recommended): forwards subscription events so
   Meta optimizes for payers, not installers.

### A4. Deliverables handed to the code side
- `APPSFLYER_DEV_KEY`
- `APPSFLYER_APP_ID` (iOS App Store ID)
- Meta App ID (for dashboard linking only; not needed in app code)

---

## 3. Part B — App code (implementation)

All code follows existing repo conventions: thin typed client mirroring
`revenueCatClient.ts`, config via `Constants.expoConfig.extra`, availability-gated
like `getRevenueCatAvailability`, no hardcoded secrets, no new color/font/shadow literals.

### B1. Dependencies + Expo config plugin
- Add `react-native-appsflyer` and its config plugin.
- Add `expo-tracking-transparency` (ATT).
- Register both plugins in `app.config.js` alongside existing plugins.
- New native code → requires an **EAS dev-client rebuild**. Already on dev client
  (vision-camera + custom plugins), so no workflow change.

### B2. Config wiring (`app.config.js`)
- Add to `extra`:
  ```js
  appsFlyerDevKey: process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY,
  appsFlyerAppId: process.env.EXPO_PUBLIC_APPSFLYER_APP_ID,
  ```
- Add to iOS `infoPlist`:
  ```js
  NSUserTrackingUsageDescription:
    'Allow $(PRODUCT_NAME) to measure ad performance so we can improve Azora.',
  ```
- Confirm SKAdNetwork identifiers are present (the AppsFlyer plugin injects these).

### B3. New module — `src/services/attribution/appsFlyerClient.ts`
Mirror the `revenueCatClient.ts` pattern:
- Read dev key + app ID from `Constants.expoConfig.extra`.
- `getAppsFlyerAvailability()` → `ready | unavailable(missing_key | unsupported_platform)`.
- `initAppsFlyer()` — configure SDK; do **not** start until ATT consent is resolved
  (short timeout fallback so we never hang).
- `setAppsFlyerCustomerUserId(id)` / `clearAppsFlyerCustomerUserId()`.
- `logAppsFlyerEvent(name, values)` — thin typed wrapper.
- Keep it platform-safe (no-ops cleanly on web/unsupported).

### B4. ATT prompt (you chose: show it)
- Use `expo-tracking-transparency`.
- Show the prompt **after** a value-demonstrating onboarding step in
  `src/components/onboarding/OnboardingFlow.tsx` — never on cold launch.
  Materially higher opt-in for wellness apps.
- Optional lightweight **pre-prompt** screen ("We use this to improve Azora —
  the next popup is from Apple") before the system dialog to lift opt-in.
- AppsFlyer init awaits the ATT result (with timeout) so consent state is correct.

### B5. Identity wiring (the keystone)
- Hook into the existing RevenueCat identity sync so that whenever the RevenueCat
  app user ID is set/cleared, `setAppsFlyerCustomerUserId` / `clear` fires with the
  **same** ID. Single code path — no parallel identity logic.
- Verify CUID is set **before** the first attributable conversion event.

### B6. Event bridge (minimal)
- Revenue (trial_start, subscribe, renewal) comes from **RevenueCat → AppsFlyer**
  server-side. Do **not** double-send these from the app.
- In-app, log only the funnel milestones AppsFlyer needs that RC does not send:
  - `af_complete_registration` (account/onboarding complete)
  - `af_content_view` or onboarding-complete milestone (optional)
- Reuse existing PostHog event call sites so AppsFlyer + PostHog stay in lockstep.

### B7. Influencer attribution (OneLink)
- One **OneLink** per creator (created in AppsFlyer dashboard).
- Implement deferred deep-link handling in the app's link listener (AppsFlyer
  `onDeepLink` / `onInstallConversionData`).
- Start with **2–3 creators** to validate attribution before scaling.
- Document the per-creator naming convention (campaign / pid / af_channel).

### B8. Documentation
- `docs/attribution.md` — identity model, event map, OneLink convention, and the
  "when to revisit / add TikTok / add Meta SDK" triggers, so future changes are mechanical.
- `docs/attribution-setup.md` — copy-paste checklist mirroring Part A.

---

## 4. Verification / Definition of Done

- [ ] `npx tsc --noEmit` clean.
- [ ] Dev-client build launches; AppsFlyer debug log shows install event.
- [ ] AppsFlyer **CUID matches the RevenueCat app user ID** for a test user.
- [ ] ATT prompt appears at the correct onboarding step on a **real device**.
- [ ] A **sandbox subscription** appears as a revenue event in **both** RevenueCat
      and AppsFlyer, attributed to the test source.
- [ ] A test **OneLink** click → install attributes to the right creator in AppsFlyer.
- [ ] Android plumbing present in config (validated during the Android pass, not blocking iOS).
- [ ] No hardcoded color/font/shadow literals; secrets only via `extra` / env.

---

## 5. Sequencing & dependencies

1. **Part A first** — Dev Key + App ID + Meta App ID are required to link and verify.
2. Part B code can be written against placeholder env vars **in parallel** with Part A.
3. End-to-end verification (Section 4) requires the real keys + a dev-client build.

---

## 6. Scope notes & tradeoffs

- **No direct Meta SDK.** RevenueCat → AppsFlyer → Meta is the simpler chain and avoids
  a redundant SDK. Add the Meta SDK only if we later need Advanced Matching beyond what
  AppsFlyer forwards. Separate effort.
- **Android** is configured now, validated during the scheduled Android pass.
- **TikTok** is a dashboard toggle later — no app code change expected.
- **SKAN at low spend** can return null/coarse conversion values until campaigns clear
  Apple's privacy thresholds. OneLink (click-based) is unaffected — which is exactly why
  influencer attribution is the near-term payoff.
- **When to revisit the MMP choice:** if operational overhead outweighs value, or if
  cost↔revenue ROAS aggregation becomes the priority, re-evaluate Singular.
