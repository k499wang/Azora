# SKAN + AppsFlyer Testing Guide

How to test that SKAdNetwork (SKAN) measurement works for Azora, and how to keep
sandbox/test data out of production reporting.

Related: [`attribution.md`](./attribution.md), [`attribution-setup.md`](./attribution-setup.md).

---

## Architecture (who sends what)

SKAN measurement and revenue attribution come from **two separate paths** — do not
duplicate them.

| Signal | Source | Path |
| --- | --- | --- |
| Install | AppsFlyer SDK | on-device, automatic |
| `af_complete_registration` | App code (`onboarding.ts`) | AppsFlyer SDK, on-device |
| Trial / purchase / renewal revenue | **RevenueCat** | **server-to-server (S2S)** to AppsFlyer |
| SKAN conversion value | AppsFlyer (computed from the above) | written on-device by the SDK on next app open |

**Critical rule:** RevenueCat is the *sole* sender of revenue events. Do **not** fire
`af_purchase` via the AppsFlyer SDK — RevenueCat's docs warn this double-counts revenue.

SKAN conversion values are computed by AppsFlyer (including from S2S events) and written
on-device by the SDK the next time the app is opened, before the measurement window
expires. There is no server-only SKAN write — the app must reopen in-window.

---

## Sandbox vs. production separation

Two layers, designed to stack:

### Layer 1 — RevenueCat sandbox developer key
RevenueCat has separate **Sandbox developer key** fields for AppsFlyer (iOS/Android).

- **Empty** → sandbox / TestFlight purchases are NOT forwarded → production stays clean.
- **Filled** → sandbox purchases ARE forwarded → required to test the pipe.

### Layer 2 — separate AppsFlyer debug app (recommended)
Register a debug build with a **different bundle id** (e.g. `com.azora.breath.debug`)
as its own app in AppsFlyer, with its own conversion-value mapping.

- Point RevenueCat's **sandbox** key at the debug AppsFlyer app.
- Point RevenueCat's **production** key at the real AppsFlyer app.

Test data then lives in a fully separate dashboard instance and never touches production
SKAN. The SDK already flags debug builds via `isDebug: __DEV__` in `appsFlyerClient.ts`.

> Interim option if you don't want a debug app yet: leave the RevenueCat sandbox keys
> empty (no test revenue reaches production) and validate only the on-device conversion
> value logic via AppsFlyer test mode.

---

## Prerequisites

- [ ] SKAN postback copies configured in `app.config.js` `ios.infoPlist`:
      `NSAdvertisingAttributionReportEndpoint=https://appsflyer-skadnetwork.com/`.
- [ ] `SKAdNetworkItems` present in `app.config.js` `ios.infoPlist` (done; sync the full
      list from AppsFlyer -> SKAdNetwork -> Download SKAdNetwork IDs).
- [ ] Native build shipped via `eas build` (SKAN does NOT work in Expo Go or OTA).
- [ ] RevenueCat → AppsFlyer integration configured with production dev key + S2S token.
- [ ] (For sandbox tests) RevenueCat sandbox dev key set, ideally pointing at a debug app.
- [ ] `$appsflyerId` set on the RevenueCat customer (done in `revenueCatClient.ts`).
- [ ] SKAN Conversion Studio: Subscription template active (SKAN 4 → S2S is always on).
- [ ] A physical iOS device (SKAN does not function in the simulator).

---

## Test plan

### 1. Verify install + registration reach AppsFlyer
1. Fresh-install the build on a physical device.
2. Complete onboarding (fires `af_complete_registration`).
3. In AppsFlyer, confirm the install and the registration event appear for the device.
   - In `__DEV__`, watch the console for `[appsflyer-diag] install conversion OK` — proof
     the device reached AppsFlyer's servers (see `appsFlyerClient.ts`).

### 2. Verify revenue events flow via RevenueCat S2S (sandbox)
1. With a sandbox key configured, complete a **sandbox** trial start / purchase.
2. RevenueCat → **Customer View** for the test user → open the purchase event in Customer
   History → confirm the **AppsFlyer integration event** delivered successfully.
3. Confirm the matching event appears in AppsFlyer attributed to the same install.
   - If missing: the AppsFlyer ID linkage or sandbox key is wrong (see Troubleshooting).

### 3. Validate the SKAN conversion value
1. Use AppsFlyer's **SKAN test / conversion-value debugger**.
2. On-device: install → complete the funnel (trial/purchase) → **reopen the app** so the
   SDK can write the conversion value before the window expires.
3. Confirm the computed conversion value matches what the Subscription template should
   produce for that funnel step / revenue tier.

### 4. End-to-end with a live campaign
1. Launch one small iOS app-install campaign on the connected Meta ad account.
2. Drive a real install + funnel completion.
3. Wait for postbacks (see Timing) and confirm data lands in the SKAN overview dashboard.

---

## Expected results & timing

- **Postback delay:** ~24–48h+ after the measurement window closes. Empty dashboards on
  day 0–1 are normal.
- **SKAN 4 windows:** ~0–2 days, 3–7 days, 8–35 days. Trial→paid signals trickle in over
  weeks, not instantly.
- **Privacy threshold (crowd anonymity):** low-volume campaigns get null/coarse values
  only. This is why the key milestone is mapped to a coarse `high` value — coarse survives
  lower volume than the fine 0–63 value.
- **Trial limitation:** a yearly trial's paid charge fires ~7 days later, often with the
  app closed → the on-device value may never get written in-window. AppsFlyer covers this
  with SKAN modeled data, not a client event. Treat trial-start as the strong in-window
  signal and paid conversion as modeled.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| SKAN overview empty right after activation | No installs yet / postback delay. Normal. |
| Revenue event not in AppsFlyer | Sandbox key missing, or `$appsflyerId` not set on RC customer. |
| Conversion value never set | App not reopened within the measurement window. |
| Raw CV numbers, no meaning | CV decode / Subscription template not active. |
| Test revenue polluting production | Sandbox key points at production app; use a debug app. |
| Double-counted revenue | `af_purchase` also fired via SDK — remove it; RC is the sole sender. |
| Meta cost data "never synced" | Meta reporting API token lacks `ads_read` / account access. |

---

## Do-not-do list

- ❌ Do not fire `af_purchase` / revenue events via the AppsFlyer SDK (RevenueCat owns it).
- ❌ Do not enable RevenueCat's own SKAdNetwork conversion-value posting — AppsFlyer owns
  the conversion value as the MMP; two writers clobber each other (last-writer-wins).
- ❌ Do not test SKAN in the simulator or Expo Go.
- ❌ Do not point the RevenueCat sandbox key at the production AppsFlyer app.
