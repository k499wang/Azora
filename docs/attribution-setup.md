# Attribution Setup Checklist (Part A — dashboards)

Companion to `docs/plans/appsflyer-integration-plan.md`. This is the click-by-click
account/dashboard setup done **outside the codebase**. Work top to bottom. The code
side (Part B) cannot be verified end-to-end until Section 2 hands over the keys.

Apps: iOS bundle `com.azora.breath` (Android same package, later).

---

## 1. Meta — create the App and supporting infra

You need two distinct things. Don't conflate them:

- **Business Portfolio (Business Manager)** — the account umbrella: ad accounts, pages,
  datasets, people. Lives at business.facebook.com.
- **Meta App** — the developer object at developers.facebook.com that produces the
  **App ID + App Secret** AppsFlyer needs to link.

### 1.1 Business Portfolio (skip if you already run ads in one)
1. business.facebook.com → **Create account**.
2. Business name, your name, work email → confirm via email.
3. This Portfolio will hold the ad account, page, and dataset created below.

### 1.2 Create the Meta App — exact use case & settings

1. developers.facebook.com → log in (same account as Business Manager) →
   **My Apps → Create App**.

2. **"What do you want your app to do?" (use case selection)** → choose
   **"Create and manage app ads with Meta Ads Manager"**.
   - Why this one: it is purpose-built for running app install ads and measuring
     installs. It guides you through connecting the Business Portfolio, adding the
     iOS/Android **platforms + app stores**, and setting up **App Events** in one flow —
     exactly the plumbing AppsFlyer ↔ Meta attribution needs. Picking generic "Other"
     works too but leaves all of that for you to wire by hand and can leave app-ads
     features locked. Click **Next**.
   - Ref: https://developers.facebook.com/docs/development/create-an-app/app-install-ads-use-case
   - Note: attribution events still flow **server-to-server from AppsFlyer** — we do
     **not** add the Facebook SDK to the app. This use case just pre-wires the Meta-side
     app object correctly.

3. **App type / portfolio:** when prompted, attach the app to your **Business Portfolio**
   (from 1.1). The Ads Manager use case is the business/app-ads path; do not pick a
   Consumer/Gaming flow. Click **Next**.

4. **App details:**
   - **App name:** `Azora` (this is internal/dashboard-facing; not user-visible).
   - **App contact email:** your support/admin email.
   - **Business portfolio:** select the Portfolio from step 1.1. **Attach it now** — an
     app linked to a verified Business unlocks ad/dataset features and avoids re-linking later.
   - Click **Create App** (re-enter your password if prompted).

5. You land on the **App Dashboard**.

### 1.3 Record the credentials
1. Left nav → **App settings → Basic**.
2. Record:
   - **App ID** (public).
   - **App Secret** → click **Show**, re-enter password. **Treat as a secret** — this goes
     only into the AppsFlyer Meta integration page, never into the repo.
3. Fill required Basic fields so the app can leave Development mode later:
   - **Privacy Policy URL** (required), **Category** = Health & Fitness, **App icon**.

### 1.4 Add the iOS platform
1. App settings → Basic → scroll to bottom → **+ Add Platform → iOS**.
2. **Bundle ID:** `com.azora.breath` (must match `app.config.js`).
3. **iPhone Store ID / App Store ID:** add once the app exists in App Store Connect.
4. Toggle on relevant options if shown (e.g. "Enable SKAdNetwork"). Leave others default.
5. (Later) **+ Add Platform → Android**, package `com.azora.breath`.

### 1.5 Create the dataset (events destination)
1. Business Manager → **Events Manager → Connect data sources → App**.
2. Select the Azora app / create the **dataset**. This is where Meta receives the
   install + subscribe events AppsFlyer forwards. Record the **Dataset (Pixel) ID** if shown.

### 1.6 Ad account (confirm or create)
- If you already run Meta ads: confirm the **ad account lives in this Portfolio**
  (Business Settings → Accounts → Ad accounts).
- If not: **Add → Create a new ad account**, set name/currency/timezone, add billing.

### 1.7 Business verification (start early)
- Meta may require **business verification** (domain + business docs) before some ad/app
  features unlock. Begin it now — it can take a few days. Business Settings → **Security
  Center / Business verification**.

### 1.8 App Mode
- The app starts in **Development** mode (fine for setup/linking). Switch to **Live**
  before running real attributed campaigns — requires the Basic fields in 1.3 completed.

---

## 2. AppsFlyer — create account and register the app

1. Sign up at appsflyer.com → create the account.
2. **Add app** → iOS → bundle `com.azora.breath` + **App Store ID**.
3. Record the **Dev Key** (account-wide; under your account/app settings).
4. Pre-add Android `com.azora.breath`.
5. Configure the **SKAdNetwork conversion-value schema** — start from AppsFlyer's
   default subscription/wellness template.

---

## 3. Connect the integrations

### 3.1 AppsFlyer ↔ Meta (set up from the AppsFlyer side)

Configure this from **AppsFlyer**, not Meta's Events Manager — you control every field
and it's clearer. If you previously started a connection in **Events Manager → Partner
Integrations → AppsFlyer**, you can remove it there (optional; it won't block this).

1. AppsFlyer → **Collaborate → Partner Marketplace** → search **Meta ads** →
   **Set up integration**.
2. **Integration tab** → toggle **Activate partner** on. The toggle must stay on for as
   long as you run Meta campaigns.
3. **Facebook App ID** → paste the **Meta App ID** (from §1.3).
4. Turn on **In-app event postbacks**. `af_app_open → fb_mobile_activate_app` is mapped
   automatically; click **Add event** for the rest:
   - `af_start_trial → StartTrial`
   - `af_subscribe → Subscribe`
   - `af_purchase → Purchase` (af_revenue auto-maps to Meta `_valueToSum`)
5. **Save Integration.**
6. Advertiser Tracking Enabled flag = handled automatically by AppsFlyer; no action.
   iOS AEM measurement still works through this AppsFlyer-side link.

7. (TikTok later = same flow under Partner Marketplace.)

### 3.2 RevenueCat → AppsFlyer
1. RevenueCat dashboard → project → **Integrations → AppsFlyer**.
2. Paste AppsFlyer **Dev Key** + **App ID**.
3. Enable forwarding of **trial / conversion / renewal** events.
4. This is the server-to-server pipe that puts revenue into AppsFlyer attribution —
   the app does **not** send these directly.

### 3.3 RevenueCat → Meta (recommended)
- Enable so Meta's optimizer targets payers, not just installers.

---

## 4. Handoff to the code side (Part B)

Record and provide securely (these become `EXPO_PUBLIC_*` env vars, never committed):

| Value | Where from | Used by |
|-------|-----------|---------|
| `APPSFLYER_DEV_KEY` | AppsFlyer §2.3 | App SDK init + RevenueCat integration |
| `APPSFLYER_APP_ID` | App Store ID | App SDK init + dashboards |
| Meta App ID | Meta §1.3 | AppsFlyer ↔ Meta link (dashboard only) |
| Meta App Secret | Meta §1.3 | AppsFlyer Meta integration (dashboard only) |

---

## 5. Common gotchas

- **Dev portal login errors:** log into facebook.com first (shared session); disable
  ad-blockers/extensions; try incognito. New accounts may need phone verification + 2FA.
- **Can't switch app to Live:** missing Privacy Policy URL / category / icon in Basic.
- **Events not showing in Meta:** dataset not linked to the app, or AppsFlyer event mapping
  not enabled — re-check §3.1.
- **App not attached to Portfolio:** re-link under App settings → Advanced → Business, or
  recreate; some ad features stay locked otherwise.
