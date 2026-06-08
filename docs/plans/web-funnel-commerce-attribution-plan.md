# Azora Web Funnel Commerce And Attribution Plan

This is a handoff plan for the separate `tryazora.app` Next.js repository. It assumes the mobile app remains the entitlement consumer and that the current mobile entitlement identifier is exactly `Azora  Pro` with two spaces.

## Goal

Build a long-term web funnel platform, not a single landing page.

The web repo should support many paid funnels, many offer pages, web-only products, clean Meta attribution, Appsflyer web-to-app handoff, RevenueCat entitlements, and Supabase identity without creating a second subscription source of truth.

## Current Mobile Contracts

The mobile app currently has these important contracts:

- Supabase Auth owns user identity.
- The Supabase `user.id` is used as the RevenueCat App User ID.
- Appsflyer Customer User ID is also set to the same Supabase `user.id`.
- RevenueCat owns subscription state.
- Supabase mirrors subscription state in `subscriptions` and exposes `user_entitlement_v`.
- RevenueCat revenue events should flow server-to-server into Appsflyer; the app should not send `af_purchase`, `af_subscribe`, or `af_start_trial` directly.
- Pro entitlement is checked in mobile code as `Azora  Pro`.
- The existing RevenueCat webhook only writes entitlement rows when `event.app_user_id` is a valid Supabase UUID and a matching `profiles.user_id` exists.

This web project must preserve those contracts.

## Recommended Product Flow

Use a progressive funnel:

1. Visitor lands from Meta on a funnel-specific route.
2. Web app captures attribution parameters and stores them in a first-party session.
3. Visitor completes quiz/result/value steps without being blocked by auth.
4. Web app asks for email / Google / Apple near the offer or checkout step.
5. Supabase user is created or restored.
6. Web app ensures a `profiles` row exists for that Supabase user.
7. Web app sends user to RevenueCat web checkout with the Supabase `user.id` as the App User ID.
8. RevenueCat grants the `Azora  Pro` entitlement.
9. RevenueCat webhook updates Supabase.
10. Success page routes the buyer to install/open the app through Appsflyer OneLink.
11. Mobile app signs the user in, refreshes RevenueCat/Supabase entitlement, and skips the paywall.

Do not make users sign in on the first page unless the funnel is explicitly account-first. The better default is value-first, auth-before-checkout.

## Billing Recommendation

Use RevenueCat Web Billing / Web Purchase Links as the first billing path.

Reasons:

- The mobile app already uses RevenueCat as the subscription source of truth.
- RevenueCat web purchases can grant the same mobile entitlements.
- RevenueCat Web Purchase Links support identified purchases by appending the App User ID.
- RevenueCat can propagate UTM metadata to webhooks and Stripe customer metadata.
- Stripe is still used as the payment gateway, but the app avoids building a second subscription system around raw Stripe.

Avoid raw Stripe as the first implementation unless the business needs complex carts, order bumps, physical products, coaching packages, or non-RevenueCat-managed products immediately. Raw Stripe can be added later behind a separate `commerce` service boundary.

## Identified Checkout As Primary Path

Primary checkout should require Supabase auth before purchase.

Implementation rule:

- Never start the identified RevenueCat checkout until the server has a verified Supabase user.
- Use that Supabase `user.id` as the RevenueCat App User ID.
- Ensure `profiles.user_id` exists before checkout. The existing mobile webhook ignores subscription-writing events if the profile is missing.

RevenueCat Web Purchase Link shape:

```text
https://pay.rev.cat/<production_token>/<url_encoded_supabase_user_id>?email=<url_encoded_email>&utm_source=...&utm_campaign=...
```

Use the sandbox RevenueCat URL only in non-production environments.

Anonymous RevenueCat Redemption Links are useful later for no-auth checkout, but they add mobile deep-link and support complexity. Treat anonymous checkout as a v2 experiment, not the first implementation.

## Web-Only Offers

The web funnel should support web-only offers through RevenueCat offerings/products.

Start with a small number:

- `web_annual_discount`
- `web_lifetime`
- `web_founder_offer`

All should grant `Azora  Pro` initially unless the product truly unlocks a different class of access.

Only add additional entitlements when there is a real product boundary, for example:

- coaching
- courses
- paid challenges
- premium reports
- paid consultation

Do not create extra entitlements just to label a funnel variant.

## Codebase Architecture For Many Funnels

Keep the landing page code, but move toward a funnel platform.

Recommended Next.js shape:

```text
src/
  app/
    (marketing)/
      page.tsx
    f/
      [slug]/
        page.tsx
    checkout/
      start/
        route.ts
    checkout/
      success/
        page.tsx
    auth/
      callback/
        route.ts
  features/
    funnels/
      components/
      data/
      lib/
      types.ts
    attribution/
      client/
      server/
      types.ts
    billing/
      revenuecat/
      types.ts
    activation/
      components/
      lib/
  shared/
    supabase/
    ui/
    config/
    lib/
```

Folder responsibilities:

- `app/`: route composition only.
- `features/funnels/data/`: typed funnel configs.
- `features/funnels/components/`: quiz, result, offer, testimonial, and step UI.
- `features/funnels/lib/`: step progression, validation, scoring, answer mapping.
- `features/attribution/`: UTM, Meta, Appsflyer, click IDs, event IDs, CAPI payloads.
- `features/billing/`: RevenueCat URL creation, checkout start validation, product mapping.
- `features/activation/`: success page, install/open app CTA, QR code, redemption or OneLink handoff.
- `shared/supabase/`: browser/server Supabase clients using `@supabase/ssr`.

## Funnel Config Model

Each funnel should be data-driven but not overly generic.

Example:

```ts
export type FunnelConfig = {
  slug: string;
  name: string;
  status: 'draft' | 'active' | 'archived';
  audience: 'meta_cold' | 'retargeting' | 'organic' | 'creator';
  defaultOfferId: string;
  steps: FunnelStep[];
  resultMapping: FunnelResultMapping;
  attributionDefaults: {
    utmSource: string;
    campaignFamily: string;
  };
};
```

Use configs for:

- step ordering
- result copy
- offer selection
- analytics naming
- experiment metadata

Do not put large React trees or business logic inside configs. If a step becomes complex, build a specific component and reference it by a typed `step.kind`.

## Minimal Funnel Types

Use a small set of step types first:

```ts
type FunnelStep =
  | { kind: 'single_choice'; id: string; question: string; options: FunnelOption[] }
  | { kind: 'multi_choice'; id: string; question: string; options: FunnelOption[] }
  | { kind: 'number_input'; id: string; label: string; min?: number; max?: number }
  | { kind: 'interstitial'; id: string; variant: string }
  | { kind: 'result'; id: string; resultType: string }
  | { kind: 'offer'; id: string; offerId: string };
```

Keep this boring. Add new step kinds only when the UI or data behavior is truly different.

## Persistence Model

Use Supabase for durable funnel and attribution state.

Recommended tables:

```sql
web_funnel_sessions
- id uuid primary key
- anonymous_id text not null
- user_id uuid null references profiles(user_id)
- funnel_slug text not null
- landing_path text not null
- initial_url text not null
- referrer text null
- user_agent text null
- ip_country text null
- status text not null default 'started'
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

web_funnel_attribution
- session_id uuid primary key references web_funnel_sessions(id)
- utm_source text null
- utm_medium text null
- utm_campaign text null
- utm_term text null
- utm_content text null
- fbclid text null
- fbp text null
- fbc text null
- appsflyer_pid text null
- appsflyer_c text null
- appsflyer_deep_link_value text null
- landing_event_id text null
- lead_event_id text null
- checkout_event_id text null
- purchase_event_id text null
- raw_params jsonb not null default '{}'
- created_at timestamptz not null default now()

web_funnel_answers
- id uuid primary key
- session_id uuid not null references web_funnel_sessions(id)
- step_id text not null
- answer jsonb not null
- created_at timestamptz not null default now()

web_checkout_intents
- id uuid primary key
- session_id uuid not null references web_funnel_sessions(id)
- user_id uuid not null references profiles(user_id)
- offer_id text not null
- revenuecat_app_user_id text not null
- revenuecat_purchase_url text not null
- environment text not null
- status text not null default 'created'
- created_at timestamptz not null default now()
```

If the existing Supabase project is shared with mobile, add these migrations carefully in the backend/mobile repo or in the repo that currently owns Supabase migrations. Do not create competing schemas from two repos without an ownership decision.

## Attribution Architecture

Attribution needs to serve three separate systems:

1. Meta web optimization.
2. Appsflyer web-to-app attribution.
3. RevenueCat/Supabase revenue analytics.

Do not collapse these into one helper.

This is the standard web-to-app measurement pattern used by MMP-led funnels:

- web landing page captures original campaign/click context
- every install/open CTA uses the MMP smart link, not a raw app store URL
- MMP smart link preserves parameters into direct/deferred deep links
- browser events are used for fast web-funnel feedback
- server events are used for reliable conversion and purchase optimization
- subscription lifecycle events come from the subscription system, not from client-side app code

For Azora, that means:

- Meta Pixel + Meta Conversions API for web funnel events and web purchase optimization.
- Appsflyer OneLink Smart Script V2 for web-to-app install/open attribution.
- RevenueCat webhooks/integrations for subscription lifecycle and revenue truth.
- Supabase as the internal join layer for web funnel session, user ID, offer ID, attribution, and entitlement state.

Recommended modules:

```text
features/attribution/
  client/
    captureLandingAttribution.ts
    metaPixel.ts
    appsFlyerSmartScript.ts
  server/
    metaConversionsApi.ts
    attributionSessionStore.ts
    normalizeAttributionParams.ts
  eventNames.ts
  types.ts
```

## Best-Data Attribution Principles

Optimize for three kinds of truth:

1. **Ad platform optimization truth:** Meta needs timely, deduplicated `Lead`, `InitiateCheckout`, and `Purchase` events with strong matching data.
2. **Mobile install attribution truth:** Appsflyer needs the outgoing OneLink click and the mobile SDK install/open to connect web visitors to app installs.
3. **Revenue truth:** RevenueCat/Supabase need purchase and renewal events keyed by the Supabase user ID / RevenueCat App User ID.

Rules:

- Capture attribution on the first page view and persist it server-side.
- Keep the first-touch values immutable.
- Track last-touch values separately if needed.
- Use one canonical `web_funnel_session_id` across the whole web funnel.
- Generate a stable `event_id` for each Meta-standard event and store it before firing the event.
- Use the same `event_id` for browser Pixel and server CAPI when both send the same Meta event.
- Persist `_fbp`, `_fbc`, `fbclid`, UTM params, referrer, landing URL, user agent, and IP-derived country.
- After auth, join the session to Supabase `user.id`.
- Hash email and internal user ID before sending them to Meta CAPI.
- Do not send raw PII to ad platforms.
- Do not send mobile subscription purchase events from the app if RevenueCat already sends them.

Minimum persisted attribution object:

```ts
type WebAttributionContext = {
  sessionId: string;
  anonymousId: string;
  userId: string | null;
  firstTouch: TouchAttribution;
  lastTouch: TouchAttribution;
  meta: {
    fbclid: string | null;
    fbp: string | null;
    fbc: string | null;
    eventIds: {
      pageView?: string;
      viewContent?: string;
      lead?: string;
      initiateCheckout?: string;
      purchase?: string;
    };
  };
  appInstall: {
    oneLinkUrl: string | null;
    deepLinkValue: string | null;
  };
};
```

Do not depend on URL query params still being present at checkout. OAuth, email magic links, hosted checkout, Safari, ad blockers, and redirects can strip or fragment query state.

## Meta Attribution Plan

Use both Meta Pixel and Meta Conversions API.

Browser Pixel is useful for page/funnel events. Server CAPI is needed for reliable checkout and purchase signals.

Track these events:

- `PageView`
- `ViewContent` when a funnel starts
- `Lead` when email/auth is captured
- `InitiateCheckout` when checkout URL is generated
- `Purchase` after RevenueCat confirms purchase through webhook or a trusted success reconciliation

Deduplication rule:

- Generate one stable `event_id` per conversion event.
- Send the same `event_id` with the browser Pixel event and server CAPI event when both are fired.
- Persist `_fbp` and `_fbc` equivalents in `web_funnel_attribution`.
- Build `_fbc` from `fbclid` when present.
- Never let client and server independently generate IDs for the same event.

For Meta CAPI, include as much match data as policy and consent allow:

- hashed email after auth
- hashed Supabase user ID as `external_id`
- client IP
- user agent
- `fbp`
- `fbc`
- event source URL
- event time
- event ID
- value and currency for purchase
- product/offer identifier in custom data
- funnel slug in custom data

Do not rely only on client-side Pixel for purchase optimization.

Recommended Meta event ownership:

```text
PageView
- browser Pixel: yes
- server CAPI: optional
- event_id: optional but useful for diagnostics

ViewContent
- browser Pixel: yes
- server CAPI: yes
- event_id: required if both fire

Lead
- browser Pixel: yes, after email/auth step
- server CAPI: yes, from the auth/lead server action
- event_id: required

InitiateCheckout
- browser Pixel: yes, immediately before redirect if possible
- server CAPI: yes, from checkout-start route
- event_id: required

Purchase
- browser Pixel: only on trusted success page with stored purchase event id
- server CAPI: yes, from RevenueCat webhook reconciliation
- event_id: required
```

For hosted checkout, the most reliable `Purchase` source is server-side confirmation. If the browser success page also fires `Purchase`, it must use the already-stored `purchase_event_id` from `web_checkout_intents`; otherwise Meta may double count.

Meta dashboard QA metrics to monitor:

- Event Match Quality for `Lead`, `InitiateCheckout`, and `Purchase`
- event deduplication rate
- browser/server event coverage
- diagnostics warnings for missing `fbp`, `fbc`, email, external ID, IP, or user agent
- purchase value/currency match against RevenueCat

If Meta Pixel or CAPI is blocked by consent, still store internal attribution and send only events permitted by the user/region consent state.

## RevenueCat Metadata Plan

When sending the user to RevenueCat web checkout, preserve:

- UTM params
- funnel slug
- offer ID
- funnel session ID
- Meta event IDs
- Appsflyer parameters
- landing page variant
- result segment

RevenueCat Web Billing automatically collects UTM parameters for Web Purchase Links. If using the Web SDK later, send additional custom metadata in the purchase call.

Minimum metadata/params to carry:

```text
utm_source
utm_medium
utm_campaign
utm_term
utm_content
funnel_slug
offer_id
web_funnel_session_id
meta_purchase_event_id
result_segment
```

Important RevenueCat metadata constraint:

- Web Purchase Links automatically collect UTM parameters.
- The RevenueCat Web SDK supports arbitrary custom metadata on `purchase()`.
- If Web Purchase Links cannot carry all non-UTM metadata in the way needed, store the metadata in Supabase keyed by `web_checkout_intents.id`, and include that ID in the success redirect and internal analytics.

Best-data choice:

- Use Web Purchase Links for the fastest reliable v1.
- Prefer the RevenueCat Web SDK if you need maximum metadata fidelity, embedded checkout control, or custom funnel-to-purchase metadata without relying on URL passthrough.

RevenueCat webhook reconciliation should:

- read `app_user_id`
- verify it is a Supabase user ID
- read RevenueCat event type, product, entitlement, store, period, price, currency, transaction ID
- match to the latest open `web_checkout_intents` for that user where possible
- mark checkout intent as purchased
- send Meta `Purchase` CAPI with the stored `purchase_event_id`
- avoid duplicate purchase events by idempotency keying on RevenueCat event ID / transaction ID

## Appsflyer Web-To-App Plan

Use Appsflyer OneLink Smart Script V2 on the web funnel.

Purpose:

- preserve web campaign parameters when sending users from web to app store
- support install attribution
- support deferred deep linking after install
- route paid users to activation after app open

Every install/open CTA on mobile web should use a generated OneLink URL, not a raw App Store URL.

Recommended outgoing OneLink params:

```text
pid=<mapped media source, e.g. meta>
c=<utm_campaign or campaign_id>
af_channel=<utm_medium or placement>
af_adset=<utm_adset or adset_id/name>
af_ad=<utm_ad or ad_id/name>
deep_link_value=web_purchase_success
af_sub1=<funnel_slug>
af_sub2=<offer_id>
af_sub3=<web_funnel_session_id>
af_sub4=<result_segment>
af_sub5=<checkout_intent_id>
```

For Meta traffic, keep a stable mapping table from incoming parameters to Appsflyer outgoing params:

```text
utm_source       -> pid
utm_campaign     -> c
utm_medium       -> af_channel
utm_content      -> af_adset or af_ad, depending on campaign naming
fbclid           -> custom param and internal storage, not a replacement for pid/c
funnel_slug      -> af_sub1
offer_id         -> af_sub2
session_id       -> af_sub3
result_segment   -> af_sub4
checkout_intent  -> af_sub5
```

Import Smart Script on every funnel/success page, not only the page with the final CTA, so incoming URL parameters are preserved across multi-page funnels.

Use local storage only as a secondary handoff source. The server-side `web_funnel_attribution` row should remain the canonical record.

OneLink CTA rules:

- mobile iOS: generated OneLink behind "Open / Download Azora"
- mobile Android later: same generated OneLink, Android routing configured in Appsflyer
- desktop: QR code generated from the same OneLink
- email/SMS later: send the same OneLink pattern with user/session params when allowed

Do not send raw App Store links from web ads or web success pages. Raw App Store links lose the MMP web-to-app click.

If the user is already on desktop after purchase, show:

- App Store QR code generated from the OneLink URL
- "Send link to phone" option later
- clear instruction to use the same email/Apple/Google account in the app

Appsflyer QA:

- Smart Script result is non-null for Meta landing URLs.
- Generated OneLink contains `pid`, `c`, `deep_link_value`, and `af_sub1-5`.
- QR code resolves to the generated OneLink, not a static App Store URL.
- First app open receives direct/deferred deep link data in the mobile SDK.
- Appsflyer raw data contains CUID after mobile sign-in.
- RevenueCat customer has `$appsflyerId` before the first mobile-origin purchase.

Note: web purchases before app install may not have a mobile Appsflyer ID yet. That is why Meta Pixel/CAPI and internal Supabase attribution are critical for web purchase ROAS, while Appsflyer is critical for the later install/open and mobile LTV join.

## Success And Activation

Success page responsibilities:

- confirm purchase completion in user-facing language
- show install/open app CTA using Appsflyer OneLink
- show QR code on desktop
- show account email used for purchase
- provide "I already have the app" CTA
- poll or verify entitlement from Supabase/RevenueCat if practical

Do not show another paywall after purchase.

Mobile should eventually support a dedicated activation route:

```text
azora://activation?source=web_purchase&session_id=...
```

or the Appsflyer deep-link equivalent:

```text
deep_link_value=web_purchase_success
```

The app should:

- refresh RevenueCat identity
- refresh Supabase entitlement
- skip paywall
- use saved web funnel answers to personalize onboarding/home

## Mobile Changes Needed Later

These changes likely belong in the mobile repo, not the web repo:

1. Add custom URL scheme / universal link support.
2. Wire Appsflyer `setAppsFlyerDeepLinkHandler` to React Navigation.
3. Add activation routing for `web_purchase_success`.
4. Ensure RevenueCat Redemption Links are supported only if anonymous checkout is enabled.
5. Ensure the app does not show boot paywall to web-paid users while entitlement sync is pending.
6. Consider centralizing `Azora  Pro` into a shared constant.

Do not start anonymous RevenueCat web purchases until the mobile app can redeem RevenueCat Redemption Links reliably.

## Authentication Plan

Use Supabase Auth in the Next.js repo with `@supabase/ssr`.

Supported methods:

- email magic link or OTP
- Google OAuth
- Apple OAuth

Preferred first version:

- email capture before checkout
- optional Google/Apple buttons
- after auth callback, resume the same funnel session and offer

Important:

- Store anonymous funnel session ID in a first-party cookie.
- On auth completion, attach that session to `user_id`.
- Do not lose attribution on OAuth redirects.
- Ensure profile row exists before checkout.

## Checkout Start Route

Create a server route or server action for checkout start.

Responsibilities:

1. Verify Supabase user from server-side session.
2. Load funnel session and attribution.
3. Validate `offer_id` is active.
4. Ensure `profiles` row exists.
5. Create `web_checkout_intents` row.
6. Build RevenueCat Web Purchase Link for the environment.
7. Append URL-encoded Supabase user ID and email.
8. Preserve UTM params where supported.
9. Fire/persist `InitiateCheckout` events.
10. Redirect to RevenueCat.

Do not build checkout URLs entirely on the client.

## Offer Registry

Use a typed registry for offers.

Example:

```ts
export type WebOffer = {
  id: string;
  name: string;
  revenueCatPurchaseLinkToken: {
    production: string;
    sandbox: string;
  };
  defaultPackageId?: string;
  grantsEntitlement: 'Azora  Pro';
  currency: 'USD';
  priceDisplay: string;
  active: boolean;
};
```

Keep display copy separate from billing identifiers so experiments can change copy without changing product identity.

## Environment Variables

Expected web repo env:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
META_DATASET_ID=
META_TEST_EVENT_CODE=

NEXT_PUBLIC_APPSFLYER_ONELINK_TEMPLATE=
NEXT_PUBLIC_APPSFLYER_SMART_SCRIPT_KEY=

REVENUECAT_WEB_PURCHASE_LINK_ANNUAL_PROD=
REVENUECAT_WEB_PURCHASE_LINK_ANNUAL_SANDBOX=
REVENUECAT_WEB_PURCHASE_LINK_LIFETIME_PROD=
REVENUECAT_WEB_PURCHASE_LINK_LIFETIME_SANDBOX=

NEXT_PUBLIC_APP_STORE_URL=
NEXT_PUBLIC_APP_DEEP_LINK_BASE=
```

Never expose service role keys or Meta CAPI tokens to client components.

## Analytics Event Names

Use stable internal event names:

```text
web_funnel_viewed
web_funnel_step_completed
web_funnel_result_viewed
web_email_captured
web_checkout_started
web_purchase_success_page_viewed
web_app_install_cta_clicked
web_app_open_cta_clicked
```

Map these to vendor events explicitly:

- Meta `ViewContent`: `web_funnel_viewed`
- Meta `Lead`: `web_email_captured`
- Meta `InitiateCheckout`: `web_checkout_started`
- Meta `Purchase`: confirmed RevenueCat purchase

Do not let vendor names leak everywhere in product code.

## Testing Checklist

Before launch:

- Funnel session persists through quiz, auth, checkout start, and success.
- UTM params survive OAuth redirects.
- `fbclid`, `_fbp`, and `_fbc` are stored when available.
- First-touch attribution stays immutable after later page views.
- Last-touch attribution updates only when a new meaningful campaign touch exists.
- Each Meta-standard event has one persisted `event_id`.
- Meta Pixel events appear in Test Events.
- Meta CAPI events appear in Test Events.
- Pixel and CAPI events deduplicate by matching `event_id`.
- Meta CAPI includes hashed email after auth.
- Meta CAPI includes hashed Supabase user ID as `external_id`.
- Meta CAPI includes `client_ip_address` and `client_user_agent`.
- Meta CAPI includes `fbp` and `fbc` when available.
- Meta Event Match Quality is reviewed for `Lead`, `InitiateCheckout`, and `Purchase`.
- `Purchase` value/currency matches RevenueCat for the same transaction.
- Checkout URL includes Supabase user ID.
- Supabase `profiles` row exists before checkout.
- `web_checkout_intents` row exists before RevenueCat redirect.
- `web_checkout_intents.purchase_event_id` is reused by browser success and server purchase events.
- RevenueCat sandbox purchase grants `Azora  Pro`.
- RevenueCat webhook writes `subscriptions`.
- RevenueCat webhook reconciliation is idempotent by RevenueCat event ID / transaction ID.
- Mobile app sees `user_entitlement_v.is_pro = true`.
- Smart Script is loaded on all funnel pages where attribution needs to persist.
- Smart Script test page confirms outgoing URL mapping for Meta URLs.
- Success page Appsflyer OneLink opens app or App Store.
- Generated OneLink includes `pid`, `c`, `deep_link_value`, and `af_sub1-5`.
- Desktop success page QR code resolves to OneLink.
- Mobile app receives direct/deferred deep-link payload for `web_purchase_success`.
- No client code fires `af_purchase`, `af_subscribe`, or `af_start_trial`.
- Sandbox RevenueCat URLs cannot be used in production.

## Implementation Phases

### Phase 1: Foundation

- Add Supabase SSR auth.
- Add attribution capture and session persistence.
- Add funnel config system.
- Convert existing landing page into the default marketing route.
- Add one real funnel at `/f/<slug>`.

### Phase 2: Checkout

- Configure RevenueCat Web Billing / Web Purchase Links.
- Add typed offer registry.
- Add server-side checkout start route.
- Ensure profile creation before checkout.
- Add success page.

### Phase 3: Attribution

- Add Meta Pixel.
- Add Meta CAPI route.
- Add event ID generation and persistence.
- Add Appsflyer OneLink Smart Script.
- Replace raw App Store links with generated OneLink URLs.

### Phase 4: Mobile Handoff

- Add or coordinate mobile deep-link support.
- Wire Appsflyer deep-link handler to activation.
- Use web funnel answers to skip or shorten onboarding.
- Add entitlement refresh on activation.

### Phase 5: Funnel Scaling

- Add more funnel configs.
- Add result segments.
- Add offer experiments.
- Add dashboard/report SQL for funnel economics.
- Add lifecycle emails/SMS only after consent and compliance review.

## Open Decisions

- Which repo owns Supabase migrations for web funnel tables?
- Whether the first checkout uses RevenueCat Web Purchase Links or the RevenueCat Web SDK.
- Whether web auth starts with email OTP only or includes Google/Apple in v1.
- Which web-only offer launches first.
- Whether lifetime access grants the same `Azora  Pro` entitlement or a separate entitlement.
- Whether mobile activation uses universal links, custom scheme, Appsflyer deep link only, or all three.

## References

- RevenueCat Web Billing overview: https://www.revenuecat.com/docs/web/web-billing/overview
- RevenueCat Web Purchase Links: https://www.revenuecat.com/docs/web/web-billing/web-purchase-links
- RevenueCat Redemption Links: https://www.revenuecat.com/docs/web/web-billing/redemption-links
- RevenueCat custom metadata: https://www.revenuecat.com/docs/web/web-billing/custom-metadata
- RevenueCat Web SDK: https://www.revenuecat.com/docs/web/web-billing/web-sdk
- RevenueCat events/integrations overview: https://www.revenuecat.com/docs/integrations/integrations
- Appsflyer OneLink Smart Script V2: https://dev.appsflyer.com/hc/docs/dl_smart_script_v2
- Appsflyer Smart Script setup: https://support.appsflyer.com/hc/en-us/articles/4413588932241-Set-up-Smart-Script-to-convert-web-visitors
- Appsflyer mobile S2S events: https://support.appsflyer.com/hc/en-us/articles/207034486-Server-to-server-events-API-for-mobile-S2S-mobile
- Branch web-to-app overview: https://help.branch.io/docs/web-to-app
- Adjust web-to-app overview: https://help.adjust.com/en/article/web-to-app
- Supabase Auth with Next.js: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Meta Conversions API: https://developers.facebook.com/docs/marketing-api/conversions-api/
- Meta Pixel conversion tracking: https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking/
