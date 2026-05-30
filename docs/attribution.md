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

- `initAppsFlyer()` runs at app launch (`App.tsx`). The `onDeepLink` listener is
  registered **before** `initSdk` — required, or the first deep link is lost.
- iOS init passes `timeToWaitForATTUserAuthorization: 60`, so the SDK holds its
  install postback up to 60s waiting for the ATT result.
- The ATT prompt fires when leaving the onboarding **notifications** step
  (`OnboardingFlow.tsx`), after value is demonstrated — not on cold launch.
- **Caveat:** if a new user takes longer than 60s to reach that step, the
  install postback may send before ATT resolves. If opt-in attribution quality
  matters more than prompt placement, move `requestAttPermissionOnce()` earlier.

## Events

Revenue (trial / subscribe / renewal) is **not** sent from the app — it flows
**RevenueCat → AppsFlyer** server-to-server. Sending it here too would
double-count. The app logs only funnel milestones RC does not send:

| App event | Fired from | Meta mapping |
|-----------|-----------|--------------|
| `af_complete_registration` | `trackOnboardingCompleted` | `CompleteRegistration` |

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
