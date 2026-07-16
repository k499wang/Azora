# Attribution (AppsFlyer) — how it works in the app

Implementation reference for the AppsFlyer integration. For the one-time
dashboard setup see `docs/attribution-setup.md`; for the original rationale and
sequencing see `docs/plans/appsflyer-integration-plan.md`.

## Identity model (the keystone)

One ID flows everywhere. The **RevenueCat app user ID** is the source of truth:

- AppsFlyer **Customer User ID (CUID)** is set to it.
- RevenueCat's **`$appsflyerId`** subscriber attribute is set to the AppsFlyer
  device ID, so RevenueCat's server-to-server revenue postbacks attribute to
  the same install.

Both happen in `src/services/attribution/appsFlyerIdentitySync.ts`, called from
the single existing RevenueCat identity path
(`src/services/subscriptions/revenueCatIdentitySync.ts`): on sign-in we sync,
on sign-out we clear the CUID. There is no parallel identity logic.

## Module map

| File | Responsibility |
|------|----------------|
| `src/services/attribution/appsFlyerConfig.ts` | Reads dev key + app ID from `expoConfig.extra`; platform gate. |
| `src/services/attribution/appsFlyerClient.ts` | Thin typed SDK wrapper: availability, init, CUID, events, deep-link handler. |
| `src/services/attribution/appsFlyerIdentitySync.ts` | CUID ↔ RevenueCat app user ID, `$appsflyerId` back to RC. |
| `src/services/attribution/attPrompt.ts` | iOS ATT dialog, shown once during onboarding. |

Config: `appsFlyerDevKey` / `appsFlyerAppId` in `app.config.js` `extra`
(from `EXPO_PUBLIC_APPSFLYER_*`, mirrored into all three `eas.json` profiles —
EAS cloud builds never see the gitignored `.env`).

## Init & ATT timing

- `initAppsFlyer()` runs at app launch (`App.tsx`). The `onDeepLink` and install
  conversion listeners are registered **before** `initSdk` — required, or the
  first deep link / conversion callback can be lost.
- iOS initializes AppsFlyer in `manualStart` mode. This configures the SDK early
  but does **not** send the launch/install payload until ATT is no longer
  `undetermined`, so Meta receives a valid Advertiser Tracking Enabled state.
- iOS init still passes `timeToWaitForATTUserAuthorization: 60` as a native SDK
  safety net. In the normal flow, JS starts the SDK only after ATT resolves.
- The ATT prompt fires when leaving the dedicated onboarding **attPriming** step
  (`OnboardingFlow.tsx`), after value is demonstrated — not on cold launch.
- Users already past onboarding go through `AttFallbackPresenter`, which mirrors
  the post-prompt init/start sequence before regular app events are sent.

## Events

Revenue (trial / subscribe / renewal) is **not** sent from the app — it flows
**RevenueCat → AppsFlyer** server-to-server. Sending it here too would
double-count. The app logs only funnel milestones RC does not send:

| App event | Fired from | Meta mapping |
|-----------|-----------|--------------|
| `af_complete_registration` | `trackOnboardingRegistrationCompleted` (profile save on the seal screen, before the paywall — independent of paywall mode) | `CompleteRegistration` |

Add new app events beside their PostHog `capture(...)` call so AppsFlyer and
PostHog stay in lockstep. Always use `logAppsFlyerEvent` (Promise form — the
callback form silently drops results on Android).

## Deep links (influencers / OneLink)

`setAppsFlyerDeepLinkHandler(handler)` registers a callback receiving
`{ deepLinkValue, isDeferred, mediaSource, campaign, raw }`. Not yet wired to
navigation — when launching creators, set a handler that routes on
`deepLinkValue`. One OneLink per creator; start with 2–3 to validate.

## When to revisit

- **TikTok:** dashboard toggle in AppsFlyer Partner Marketplace; no app change.
- **Meta SDK:** only if Advanced Matching beyond AppsFlyer's forwarding is
  needed — separate effort, currently out of scope.
- **Android:** config is in place; validate during the Android pass (no `appId`
  on Android — the client already only passes it on iOS).

## Meta AEM eligibility warnings

These warnings are not fixed by adding an `advertiser_tracking_enabled` field to
app events. AppsFlyer supplies that flag for its Meta postbacks.

- **Advertiser Tracking Enabled parameter volume out-of-range:** this means the
  Meta/AppsFlyer traffic has too many events from users without an IDFA (usually
  ATT denied or not resolved). In AppsFlyer, enable Advanced Data Sharing and
  disable IP masking for this app. In the Meta integration, map the required
  events with **Values and revenue** and **All media sources, including organic**.
- **Install ID not detected or insufficient coverage:** verify that the Meta
  integration's Facebook App ID exactly matches the Meta app, the Meta app is
  Live, and the campaign selects the app from Meta's app picker (not a pasted
  App Store URL). New installs are required after changing these settings.

Meta can take 2–3 days to recalculate eligibility. The app also waits on the
AppsFlyer SDK's started signal (bounded, `waitForAppsFlyerStart`) before the
AppsFlyer-to-RevenueCat install-ID handoff, because the native UID read can
race SDK startup.
