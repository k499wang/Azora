# RevenueCat + Apple Setup Runbook

Step-by-step setup from **zero** to a working sandbox paywall, then to a live
pricing experiment. Written for the Azora iOS Expo app.

**Expected total wall-clock time:** 3–7 days. Most of that is waiting (Apple
Developer enrollment review, Paid Agreements processing, App Review of
products). Active work is roughly 4–6 hours across the phases.

Companion docs:
- [paywall-pricing-experiments-playbook.md](paywall-pricing-experiments-playbook.md) — strategy, what prices to test, how to analyze results
- [revenuecat-paywall-experiments-guide.md](revenuecat-paywall-experiments-guide.md) — how to wire RevenueCat into the codebase (services/hooks shape)
- [phase-4-revenuecat-paywall.md](../backend-plan/phase-4-revenuecat-paywall.md) — backend plan

> **IMPORTANT — order matters.** Several steps unblock each other. Do them in
> the order below. Skipping ahead causes things like "my sandbox purchase
> silently fails with no error" which is almost always "you didn't sign the
> Paid Apps Agreement."

---

## Phase 0 — Prerequisites

Before you start, have these ready:

- A Mac with Xcode installed (required for any iOS dev builds later)
- An Apple ID that is **not** already tied to an existing Apple Developer
  Program account — you'll use this as the account owner
- A credit card for the $99/year Apple Developer fee
- Your legal name / business name / DBA — Apple will use this as the "Seller"
  name shown in App Store and in purchase receipts. You **cannot easily
  change this later.** Decide now.
- Tax / banking info (US: EIN or SSN; Canada: SIN or BN; EU: VAT ID, etc.)
  for the Paid Apps Agreement. Apple sends subscription revenue to the bank
  account listed here.
- An email address you control for the RevenueCat account
- A separate "sandbox tester" email that is **not** already an Apple ID.
  Easiest: use a Gmail `+alias` like `yourname+sandbox@gmail.com`. Apple
  rejects emails that already belong to Apple accounts.

---

## Phase 1 — Apple Developer Program enrollment

**Time:** 24–48h for Apple's review, 20 min active work.

1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with the Apple ID you want to own the account
3. Choose **Individual** or **Organization**:
   - **Individual**: faster (usually approved same day), cheaper on paperwork,
     but Seller name is your personal legal name
   - **Organization**: requires a D-U-N-S number (free, ~1–2 days to get from
     https://developer.apple.com/enroll/duns-lookup/), but Seller name is
     your company. Recommended if you're shipping under a brand name
4. Pay the $99/year fee
5. Wait for Apple's confirmation email. Individual enrollments often arrive
   within hours; organization enrollments can take 1–3 days

**Do not proceed to Phase 2 until you get the "Welcome to the Apple Developer
Program" email.**

---

## Phase 2 — App Store Connect: register the app

**Time:** 30 min.

### 2.1 Sign into App Store Connect

https://appstoreconnect.apple.com — sign in with the same Apple ID from
Phase 1.

### 2.2 Pick a permanent bundle identifier

The Expo `app.json` is set to `com.azora.breath` for both iOS
(`expo.ios.bundleIdentifier`) and Android (`expo.android.package`). Use the
same id when registering in App Store Connect and the Apple Developer
Portal. **You can't change it later without creating a new app listing**,
so do not deviate.

If you had previously run `npx expo prebuild`, the generated `ios/` and
`android/` folders still carry the old id — run `npx expo prebuild --clean`
to regenerate them from the new `app.json`.

### 2.3 Register the bundle id in the Developer Portal

1. https://developer.apple.com/account/resources/identifiers/list
2. Click the blue `+` to register a new identifier
3. Pick **App IDs** → Continue → **App** → Continue
4. Description: "Azora" (or whatever)
5. Bundle ID: **Explicit**, enter your chosen id exactly
6. Capabilities: enable **In-App Purchase** (required for subscriptions)
7. Continue → Register

### 2.4 Create the App Store Connect app

1. https://appstoreconnect.apple.com/apps → blue `+` → **New App**
2. Platform: iOS
3. Name: "Azora" (visible in App Store; max 30 chars)
4. Primary language
5. Bundle ID: select the one you just registered
6. SKU: any internal identifier, e.g. `azora-ios`
7. User Access: Full Access (you're solo right now)
8. Create

---

## Phase 3 — Sign the Paid Apps Agreement

**Time:** 15 min active, up to 24h processing. **This is the most commonly
missed step and it silently breaks everything downstream.**

1. App Store Connect → **Agreements, Tax, and Banking** (sidebar)
2. Under "Paid Apps" — click **Request**
3. Fill out:
   - **Contact info** (one person each for: legal, technical, financial, marketing — can all be you)
   - **Bank account** for payouts
   - **Tax forms** — US developers fill W-9 or W-8BEN, Canadians fill W-8BEN, etc. Follow the in-form prompts
4. Submit
5. Status will show "Pending" — wait until it shows **Active** for all four
   sections (Contacts, Banking, Tax, Tax Forms). This can take an hour to
   24h depending on Apple's verification

**Do not create subscription products before this is Active** — they will
look created but will silently fail in sandbox with cryptic errors.

---

## Phase 4 — Create the six subscription products

**Time:** 1 hour, if you have screenshots ready.

### 4.1 Create the subscription group

1. App Store Connect → your app → **Subscriptions** (sidebar under
   Monetization)
2. Click **Create** next to Subscription Groups
3. Reference Name: `Azora Pro`
4. Save

### 4.2 Create all six products

Per the pricing playbook, create all six price points now — you can't add
new products instantly later without an App Review cycle.

For each of the six below:

1. Inside `Azora Pro` group → **Create** next to Subscriptions
2. Reference Name (internal) and Product ID (external) per the table

| # | Reference Name         | Product ID                    | Duration | Price (USD)    | Intro Offer           |
|---|------------------------|-------------------------------|----------|----------------|-----------------------|
| 1 | Pro Weekly $5.99       | `azora_pro_weekly_599`        | 1 Week   | Tier for $5.99 | None                  |
| 2 | Pro Weekly $7.99       | `azora_pro_weekly_799`        | 1 Week   | Tier for $7.99 | None                  |
| 3 | Pro Weekly $9.99       | `azora_pro_weekly_999`        | 1 Week   | Tier for $9.99 | None                  |
| 4 | Pro Annual $39.99      | `azora_pro_yearly_3999`       | 1 Year   | Tier for $39.99| 7-day free trial      |
| 5 | Pro Annual $59.99      | `azora_pro_yearly_5999`       | 1 Year   | Tier for $59.99| 7-day free trial      |
| 6 | Pro Annual $79.99      | `azora_pro_yearly_7999`       | 1 Year   | Tier for $79.99| 7-day free trial      |

For each product you'll need to fill:

- **Subscription Display Name** (what users see — e.g. "Azora Pro Weekly")
- **Description** (2–3 sentences, what they get)
- **Review screenshot** (1024×1024, showing the paywall; Apple requires this
  even for review — a placeholder is fine to submit for now, update before
  production)
- **Pricing** — pick the tier closest to the target USD price. Apple
  auto-converts to other currencies
- For annuals: add an **Introductory Offer** → Free → 7 days → "Available to
  new subscribers only"

Click **Save** on each. Status will be "Missing Metadata" → "Ready to
Submit" once complete. You do **not** need to submit them for formal review
yet — they're usable in sandbox once in "Ready to Submit."

---

## Phase 5 — Create a sandbox tester

**Time:** 5 min.

1. App Store Connect → **Users and Access** → **Sandbox** tab → **Testers**
2. Click the blue `+`
3. Fill fake but parseable info:
   - First/Last: any
   - Email: **NOT an existing Apple ID** — use a `+alias`, e.g.
     `you+azora-sandbox@gmail.com`
   - Password: any (write it down)
   - Country: US (or your target market)
4. Create

---

## Phase 6 — Generate the App Store Connect API key for RevenueCat

**Time:** 10 min. RevenueCat needs this to read your products and verify
receipts.

### 6.1 Create an In-App Purchase key

1. https://appstoreconnect.apple.com/access/api (Users and Access → Keys)
2. Tab: **In-App Purchase**
3. Click **Generate In-App Purchase Key** (or `+` if you already have others)
4. Name: `RevenueCat`
5. Download the `.p8` file — **you can only download it once.** Save it
   somewhere safe
6. Note the **Key ID** (10-char string) and **Issuer ID** (UUID at the top
   of the page)

### 6.2 Also note your App Store Connect Shared Secret

For older receipt verification paths:

1. App Store Connect → your app → **App Information** (sidebar)
2. Scroll to **App-Specific Shared Secret** → Generate / View
3. Copy it

---

## Phase 7 — RevenueCat: create project and link Apple

**Time:** 20 min.

### 7.1 Sign up and create project

1. https://app.revenuecat.com/signup
2. Sign up with email
3. Create a new project: `Azora`

### 7.2 Add the iOS app

1. Inside project → **Apps** (sidebar) → **New** → **App Store**
2. App name: "Azora iOS"
3. Bundle ID: paste your iOS bundle id exactly
4. **App Store Connect API Key:**
   - Upload the `.p8` file from Phase 6.1
   - Paste the Key ID and Issuer ID
5. **App-Specific Shared Secret:** paste from Phase 6.2
6. Save

RevenueCat will now fetch your products from App Store Connect automatically.

### 7.3 Verify products imported

1. RevenueCat → **Products** (sidebar)
2. You should see all six products with their pricing. If any are missing,
   they're likely still in "Missing Metadata" in App Store Connect — fix
   them, then return and hit **Refresh Products**

---

## Phase 8 — Entitlement + Offerings in RevenueCat

**Time:** 15 min.

### 8.1 Create the entitlement

1. RevenueCat → **Entitlements** → **New Entitlement**
2. Identifier: `pro`
3. Display name: "Pro"
4. Description: "Full access to Azora"
5. Save

### 8.2 Attach all six products to the `pro` entitlement

1. Inside the `pro` entitlement page → **Attach Products**
2. Select all six — weekly × 3 and yearly × 3
3. Save

This tells RevenueCat: "if the user owns any of these products, they have
the `pro` entitlement."

### 8.3 Create the three offerings

For each offering below:

1. RevenueCat → **Offerings** → **New Offering**
2. Identifier as listed in the table
3. Add packages:
   - Package type: **Weekly** → attach the weekly product
   - Package type: **Annual** → attach the annual product
4. Save

| Offering identifier | Weekly product            | Annual product            |
|---------------------|---------------------------|---------------------------|
| `default_low`       | `azora_pro_weekly_599`    | `azora_pro_yearly_3999`   |
| `default_mid`       | `azora_pro_weekly_799`    | `azora_pro_yearly_5999`   |
| `default_high`      | `azora_pro_weekly_999`    | `azora_pro_yearly_7999`   |

### 8.4 Set the current offering

1. RevenueCat → **Offerings** → find `default_mid` → click the three dots →
   **Set as Current**

This is what every non-experiment user sees.

---

## Phase 9 — RevenueCat API key + webhook secret

**Time:** 10 min.

### 9.1 Grab the iOS SDK key

1. RevenueCat → project settings (top-right) → **API Keys**
2. Copy the **Apple App Store** public key — starts with `appl_`
3. This is safe to embed in the app (public key)

### 9.2 Create the webhook secret

```bash
openssl rand -hex 32
```

Copy this output. You'll need it in two places:
- Supabase (for the Edge Function env var)
- RevenueCat (for the webhook Authorization header)

### 9.3 Configure the webhook in RevenueCat

**Do this AFTER Phase 10 — you need the Edge Function URL first.** But save
the secret now. Keep it somewhere safe temporarily.

---

## Phase 10 — Deploy the Supabase webhook

**Time:** 10 min.

### 10.1 Set the webhook secret

```bash
cd /Users/k3vinwvng/Documents/Azora/Azora
supabase secrets set REVENUECAT_WEBHOOK_SECRET=<paste the hex string from 9.2>
```

### 10.2 Deploy the function

```bash
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

`--no-verify-jwt` is required because RevenueCat is not a Supabase-auth
client. The Authorization header check inside the function itself is what
protects it.

### 10.3 Note the function URL

After deploy, the URL is:

```
https://<your-project-ref>.functions.supabase.co/revenuecat-webhook
```

Your project ref is visible in the Supabase dashboard URL.

### 10.4 Configure the webhook in RevenueCat

1. RevenueCat → **Integrations** → **Webhooks**
2. URL: paste the function URL from 10.3
3. Authorization header: `Bearer <the hex string from 9.2>`
4. Save
5. Click **Send Test Event** — you should see it succeed

### 10.5 Verify it worked

In Supabase SQL editor:

```sql
select event_id, event_type, environment, received_at
from public.revenuecat_events
order by received_at desc
limit 5;
```

You should see a row with `event_type = 'TEST'`. If you don't:

- Check Supabase function logs:
  `supabase functions logs revenuecat-webhook --tail`
- Most common issue: `Authorization` header mismatch → 401. Re-check the
  secret in both places.

---

## Phase 11 — Install RevenueCat SDK in the app

**Time:** 30 min.

### 11.1 Install the package

```bash
cd /Users/k3vinwvng/Documents/Azora/Azora
npx expo install react-native-purchases react-native-purchases-ui
```

`react-native-purchases-ui` is needed if you want to use RevenueCat's
remote-rendered paywall (which is required to run paywall UI experiments
without app-store review).

### 11.2 Add the Expo plugin

Edit `app.json` → `expo.plugins`:

```json
"plugins": [
  ...,
  "react-native-purchases"
]
```

### 11.3 Rebuild the dev client

This requires a native build. If you've been running in Expo Go, you need
to switch to a dev build anyway:

```bash
npx expo prebuild --clean
npx expo run:ios
```

First build takes 5–15 min. After that, most changes don't require rebuilds.

### 11.4 Add environment variables

Add to `.env` (or however you manage env — Expo supports `EXPO_PUBLIC_*`):

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
```

Paste the key from Phase 9.1.

### 11.5 Minimal SDK init (in app code later)

When you build the paywall flow later, init looks like:

```ts
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
await Purchases.configure({
  apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
  appUserID: supabaseUserId,  // from your auth session
});
```

**Call this AFTER Supabase auth completes** so `appUserID` matches your
Supabase `user_id`. Webhook attribution depends on this alignment.

---

## Phase 12 — End-to-end sandbox test

**Time:** 30 min. This is the "does it actually work" milestone.

### 12.1 Sign into the sandbox account on your device

- iOS Settings → **App Store** → Sandbox Account → Sign In
- Use the tester email + password from Phase 5

### 12.2 Build the minimal paywall

You don't need the real paywall UI yet — just enough to trigger a purchase.
In your dev build, somewhere reachable:

```ts
import Purchases from 'react-native-purchases';

async function testPurchase() {
  const offerings = await Purchases.getOfferings();
  const annual = offerings.current?.annual;
  if (!annual) throw new Error('no annual package');
  const { customerInfo } = await Purchases.purchasePackage(annual);
  console.log('entitlements', customerInfo.entitlements.active);
}
```

### 12.3 Trigger the purchase

- Apple shows a sandbox purchase sheet (yellow banner: "[Environment:
  Sandbox]")
- Confirm. For trial products you'll see "$0.00 for 7 days, then $59.99/year"
- The sandbox processes in a few seconds

### 12.4 Verify everywhere

Four places to check — all must line up:

1. **Console log** from your app: `entitlements` should include `pro` as active
2. **RevenueCat dashboard** → Customers → search your `appUserID` → should
   show `pro` entitlement active, trialing
3. **Supabase `revenuecat_events`** table: should have new rows with
   `event_type = 'INITIAL_PURCHASE'`
4. **Supabase `subscriptions`** table:
   - `status` = `trialing` (for annual with trial) or `active`
   - `product_id` = `azora_pro_yearly_5999`
   - `initial_offering_id` = `default_mid`
   - `current_period_ends_at` = 7 days from now

5. **`user_entitlement_v`** returns `is_pro = true` for your user

If any of these don't match, that's where to debug first.

### 12.5 Sandbox renewal behavior

Sandbox subscriptions auto-renew on **accelerated timers**:

- Weekly → renews every 3 min
- Annual → renews every hour
- Max renewals: 6, then auto-cancel

This lets you test `RENEWAL` and `EXPIRATION` webhook events quickly.

---

## Phase 13 — Setting up the pricing experiment

**Don't do this until V1 has shipped and you have ≥2 weeks of baseline
traffic on `default_mid`.** See
[paywall-pricing-experiments-playbook.md](paywall-pricing-experiments-playbook.md)
for the reasoning.

When ready:

### 13.1 Create the experiment in RevenueCat

1. RevenueCat → **Experiments** → **New Experiment**
2. Name: `pricing_tier_v1`
3. **Type:** Offering experiment (not Paywall experiment — that's for UI
   variants)
4. **Control offering:** `default_mid`
5. **Treatment offerings:** `default_low`, `default_high`
6. **Traffic split:** 34 / 33 / 33
7. **Audience:** All new users (default)
8. **Minimum duration:** 4 weeks
9. Start

### 13.2 Verify experiment attribution flows through

1. On a new sandbox tester, purchase → the `presented_offering_id` in the
   webhook event should be whatever arm RevenueCat assigned
2. Check `subscriptions.initial_offering_id` and `experiment_id` /
   `experiment_variant` populated for that new user
3. If null: likely a payload-field-name mismatch. Check `revenuecat_events.payload`
   for the actual structure and update `extractInitialAttribution()` in the
   webhook if needed

### 13.3 Let it run

- Minimum 4 weeks
- Minimum 1,500 paywall views per arm
- Do **not** stop on an early "winner"

### 13.4 Read the result

Per the playbook:

- **Primary:** revenue per paywall view (RC dashboard shows this)
- **Secondary:** day-30 retention (run your own SQL query against `subscriptions`
  × `daily_activity`, segmented by `initial_offering_id`)
- Pick the offering with the best *revenue × retention*, not the one with
  the best *conversion rate*

### 13.5 Apply the winner

1. RevenueCat → set the winning offering as the current offering
2. Stop the experiment
3. Keep the other offerings in place for future tests

---

## Phase 14 — Pre-production checklist

Before pushing to TestFlight / App Store:

- [ ] Bundle id is `com.azora.breath` in both `app.json` and the generated native projects
- [ ] Paid Apps Agreement shows Active
- [ ] All 6 products are in "Ready to Submit" or already approved
- [ ] Sandbox test purchase succeeds and webhook writes all four expected
      places (section 12.4)
- [ ] Webhook authorization secret is not committed to git
- [ ] RevenueCat API key is loaded from `EXPO_PUBLIC_*` env, not hardcoded
- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_KEY` is different between dev and prod if
      you use separate RevenueCat projects (not required, but some teams do)
- [ ] Your paywall UI shows current pricing dynamically from
      `Purchases.getOfferings()` — never hardcode "$7.99" in a string
- [ ] `Purchases.configure({ appUserID: supabaseUserId })` is called after
      auth, never before

---

## Common failures and fixes

**"Cannot connect to iTunes Store" in sandbox:**
- Paid Apps Agreement not Active (Phase 3)
- You're signed into a real Apple ID in the App Store instead of the sandbox
  tester (reset in iOS Settings → App Store → Sandbox Account)

**RevenueCat shows no products:**
- Products in "Missing Metadata" state in App Store Connect
- API key uploaded in RevenueCat doesn't have IAP scope (regenerate in Phase 6)

**Webhook returns 401:**
- Authorization header mismatch. Regenerate secret, re-set in both places

**`initial_offering_id` is null on a successful purchase:**
- `Purchases.configure()` was called without `appUserID` — the webhook's
  `app_user_id` isn't a Supabase UUID, so the attribution write is skipped
- RevenueCat payload shape changed — inspect `revenuecat_events.payload` and
  update `extractInitialAttribution()` field names

**Purchase succeeds but app shows user as not Pro:**
- SDK not initialized yet when you check — await `Purchases.configure()`
  before any `getCustomerInfo()` call
- You're reading from `subscriptions` before the webhook has written it —
  read from `Purchases.getCustomerInfo()` for real-time state, use
  `user_entitlement_v` as the eventually-consistent server truth
