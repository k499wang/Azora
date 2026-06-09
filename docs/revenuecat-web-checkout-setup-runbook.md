# RevenueCat Web Checkout Setup Runbook

Step-by-step setup for selling Azora Pro from the web funnel while keeping
RevenueCat as the subscription source of truth and Supabase as the app-facing
entitlement mirror.

This guide assumes:

- Mobile already uses Supabase Auth for identity.
- Mobile already uses RevenueCat for subscriptions.
- Supabase `user.id` is the RevenueCat App User ID.
- The Pro entitlement is exactly `Azora  Pro` with two spaces.
- Web checkout should use a separate RevenueCat webhook endpoint.

## Target Flow

```text
Web visitor
-> Supabase sign-in / sign-up
-> server creates profile + checkout intent
-> RevenueCat Web Purchase Link
-> Stripe processes payment behind RevenueCat Web Billing
-> RevenueCat grants Azora  Pro
-> RevenueCat calls Supabase web checkout webhook
-> Supabase subscriptions row updates
-> mobile app sees Pro for the same Supabase user
```

Stripe is part of this flow, but the web app should not build raw Stripe
Checkout for v1. RevenueCat should own products, entitlement grants, subscription
lifecycle events, and hosted checkout.

## Current Repo Pieces

Backend migration:

- `supabase/migrations/20260608000100_web_funnel_commerce_contract.sql`

New web webhook:

- `supabase/functions/revenuecat-web-checkout-webhook/index.ts`

Original mobile webhook:

- `supabase/functions/revenuecat-webhook/index.ts`

The original mobile webhook should remain configured for existing mobile
purchase events. Configure web checkout events to use the new web webhook.

## Phase 0: Required Accounts And Access

Before setup, make sure you have owner/admin access to:

- Stripe account
- RevenueCat project
- Supabase project
- web funnel repo/deployment provider
- staging web domain
- production web domain

Recommended domains:

```text
staging.tryazora.app
tryazora.app
```

## Phase 1: Stripe Setup

RevenueCat Web Billing uses a payment processor. For this app, use Stripe.

In Stripe:

1. Create or open the Stripe account for Azora.
2. Complete the business profile.
3. Add bank/payout details.
4. Complete tax and identity verification.
5. Confirm test mode is available.
6. Enable the payment methods you want to support.

Recommended v1 payment methods:

```text
Card
Apple Pay, if available
Google Pay, if available
```

Do not create the Azora subscription product directly in Stripe for v1 unless
RevenueCat explicitly asks you to as part of the Web Billing connection flow.
The source of truth for the product/entitlement contract should be RevenueCat.

## Phase 2: Configure Stripe Payment Methods

Start in Stripe test mode / sandbox. Do not configure live payments first.

Important: because v1 uses RevenueCat Web Billing, you may not be able to edit
the RevenueCat-owned payment method configuration directly in Stripe. If Stripe
says RevenueCat has not enabled dashboard management, that is not a blocker.
Leave that config alone and verify payment methods through the RevenueCat
hosted checkout.

Recommended v1 payment methods:

```text
Credit/debit cards
Apple Pay, if available
Google Pay, if available
```

Avoid these for v1:

```text
ACH / US bank account
SEPA debit
Boleto
Konbini
OXXO
Bank transfers
Cash App Afterpay / Klarna
Any delayed/asynchronous payment method
```

Reason: v1 should unlock Pro immediately after RevenueCat confirms purchase.
Delayed payment methods can take days to settle, which makes entitlement timing,
support, and refund handling more complicated.

### 2.1 Open Stripe Test Mode

1. Open the Stripe Dashboard.
2. Toggle into test mode / sandbox.
3. Confirm the dashboard URL or mode indicator shows test mode.

Use test mode for the first end-to-end setup:

```text
Stripe test mode
RevenueCat sandbox Web Purchase Link
staging Supabase project
staging web app
```

Do not use live mode until the sandbox purchase updates Supabase and mobile sees
Pro.

### 2.2 Enable Cards

In Stripe, first check whether the payment method configuration is editable.

If the RevenueCat-owned configuration is editable:

1. Open https://dashboard.stripe.com/test/settings/payment_methods.
2. Confirm you are in test mode. The URL should include `/test/`, or the
   dashboard should show the test mode indicator.
3. Find the default payment method configuration.
4. Find `Cards`.
5. Confirm `Cards` is on/enabled.

Cards are usually enabled by default. If Stripe asks for extra account setup,
complete the required Stripe onboarding steps.

If Stripe shows this message:

```text
RevenueCat has not enabled you to manage payment methods from the dashboard.
```

then do not try to enable Cards from Stripe. For RevenueCat Web Billing, cards
are expected to be available in hosted checkout by default. Verify cards by
opening the RevenueCat sandbox Web Purchase Link and checking that card fields
appear.

If Stripe shows a page with tabs or sections, use this path:

```text
Stripe Dashboard
-> Settings
-> Payments
-> Payment methods
-> Default configuration
-> Cards
```

Do not enable bank debit, bank transfer, voucher, or delayed payment methods
for v1.

### 2.3 Wallets: Apple Pay And Google Pay

For RevenueCat Web Purchase Links, checkout happens on RevenueCat's hosted
domain:

```text
pay.rev.cat
```

RevenueCat says it manages the payment methods shown in Web Billing checkout,
and `pay.rev.cat` is automatically registered with Stripe for Apple Pay and
Google Pay. That means you usually do not need to manually register
`tryazora.app` in Stripe for Web Purchase Links.

Still check Stripe settings:

1. Open https://dashboard.stripe.com/test/settings/payment_methods.
2. Stay in test mode.
3. Find the `Wallets` section.
4. Open or expand `Apple Pay`.
5. Confirm it is on/enabled, or complete the setup step Stripe shows.
6. Open or expand `Google Pay`.
7. Turn it on if Stripe shows a toggle.

If Stripe shows a page with tabs or sections, use this path:

```text
Stripe Dashboard
-> Settings
-> Payments
-> Payment methods
-> Default configuration
-> Wallets
-> Apple Pay
-> Google Pay
```

If Stripe or RevenueCat shows a pending permission request for the RevenueCat
Stripe app, approve it. RevenueCat needs permission to register payment method
domains for hosted checkout.

If Stripe says RevenueCat has not enabled dashboard management, skip the Stripe
wallet toggles. For RevenueCat-hosted checkout on `pay.rev.cat`, RevenueCat
manages wallet availability. Verify wallets by loading the sandbox purchase link
on a supported device/browser after card checkout works.

If Apple Pay or Google Pay already says enabled but does not appear in checkout,
do not block launch on that. Test card checkout first. Wallet visibility also
depends on browser, device, country, currency, and whether the tester has a card
saved in Apple Wallet or Google Pay.

### 2.4 If Google Pay Does Not Appear In Chrome

Do not block the first sandbox launch on Google Pay visibility. Card checkout is
the required v1 acceptance path.

If Google Pay does not appear in Chrome, check:

1. You are using Chrome, not an embedded browser or in-app browser.
2. You are signed into a Google account in Chrome.
3. The Google account has a card saved in Google Pay / Google Wallet.
4. The browser/device/country/currency combination supports Google Pay.
5. You are using RevenueCat's hosted checkout domain:

```text
pay.rev.cat
```

6. The RevenueCat Stripe app has no pending permission update in Stripe.
7. Card checkout appears and works.

For RevenueCat Web Purchase Links, RevenueCat manages wallet availability on the
hosted checkout. If Stripe says RevenueCat has not enabled dashboard management,
you cannot force Google Pay on from Stripe for that RevenueCat-owned config.

Recommended test order:

```text
1. Test card checkout first.
2. Confirm RevenueCat webhook updates Supabase.
3. Confirm mobile sees Pro.
4. Then test Google Pay on a supported Chrome/Android setup.
```

If Google Pay still does not appear but card checkout works, continue with the
sandbox integration. Treat wallet visibility as a follow-up payment-method QA
task.

### 2.5 If Stripe Says RevenueCat Does Not Allow Dashboard Management

You may see a Stripe message like:

```text
RevenueCat has not enabled you to manage payment methods from the dashboard.
```

That means this Stripe payment method configuration is owned by the RevenueCat
integration. Do not keep trying to edit it in Stripe.

For RevenueCat Web Billing, this is expected enough that the practical v1 path
is:

1. Leave the RevenueCat-owned Stripe payment method configuration as-is.
2. Go back to RevenueCat.
3. Confirm the Web Billing / Stripe connection is active.
4. Create the RevenueCat web product and Web Purchase Link.
5. Test the sandbox Web Purchase Link with a card.

RevenueCat says Web Billing manages the payment methods shown to customers.
Credit cards are enabled by default. For RevenueCat-hosted checkout domains
like `pay.rev.cat`, RevenueCat automatically registers the domain for Apple Pay
and Google Pay.

If you see this message, your next action is not "enable methods in Stripe".
Your next action is:

```text
RevenueCat
-> Web Billing config
-> confirm Stripe is connected
-> create web product
-> create Web Purchase Link
-> test card checkout
```

Only come back to Stripe if:

- RevenueCat says the Stripe connection is incomplete.
- Stripe shows a pending RevenueCat app permission update.
- card checkout fails inside the RevenueCat-hosted checkout.
- you later use the Web SDK on your own domain and need payment method domains.

### 2.6 When To Add Payment Method Domains Manually

Do not add domains manually just because you have a web app.

Manual Stripe payment method domains are usually needed only if you initiate
purchases on your own domain with the RevenueCat Web SDK or a custom Stripe UI.

For this v1 plan:

```text
Use Web Purchase Links on pay.rev.cat
Do not use Web SDK yet
Do not build raw Stripe Checkout
```

If you later use the Web SDK on your own domain, add these domains in Stripe:

```text
staging.tryazora.app
tryazora.app
```

Stripe path:

```text
Settings -> Payments -> Payment method domains
```

Add the full domain including subdomain, then confirm Stripe marks it enabled.

### 2.7 How To Test Payment Methods

First test a basic card purchase. Do not start by debugging Apple Pay or Google
Pay.

Use the first sandbox milestone:

```text
test card purchase
-> RevenueCat INITIAL_PURCHASE
-> Supabase revenuecat_events row
-> Supabase subscriptions row
-> mobile sees Pro
```

After card checkout works, test wallets:

- Apple Pay requires Safari on iOS/macOS with a card in Apple Wallet.
- Google Pay requires a supported browser/device with a Google Pay card.
- Wallets may not appear for every currency, location, browser, or account
  state even when enabled.

If wallets do not appear, keep card checkout as the v1 acceptance path and debug
wallet visibility separately.

## Phase 3: Connect Stripe To RevenueCat Web Billing

In RevenueCat:

1. Open the Azora project.
2. Go to the Web Billing / Web setup area.
3. Add or open the Web Billing configuration.
4. Connect Stripe as the payment provider.
5. Follow RevenueCat's Stripe authorization flow.
6. Confirm the Web Billing configuration is active in sandbox/test mode.

Use one RevenueCat project for the unified entitlement model unless you
intentionally want a separate web-only entitlement system. For this app, do not
create a separate RevenueCat project just for web checkout.

## Phase 4: Configure Stripe Tax For RevenueCat Web Billing

RevenueCat Web Billing can use Stripe Tax to calculate and collect sales tax or
VAT in checkout.

Tax is a legal/accounting obligation. Use Stripe/RevenueCat tooling to collect
and report taxes, but ask a qualified tax accountant if you are unsure where you
must register or which product tax code applies.

### 4.1 Start In Test Mode

Do tax setup in test mode first.

Use this stack:

```text
Stripe test mode tax settings
RevenueCat sandbox Web Billing
RevenueCat sandbox Web Purchase Link
staging Supabase
staging web app
```

Do not add live tax registrations just to test. RevenueCat warns that live-mode
tax registrations may start applying to live Web Billing purchases.

### 4.2 Enable Stripe Tax In Stripe

In Stripe test mode:

1. Open the Stripe Dashboard.
2. Go to Tax.
3. Start Stripe Tax setup.
4. Confirm your business/head office address.
5. Choose the preset product tax code if Stripe asks.
6. Add a test-mode tax registration for the location you want to test.

Example test location:

```text
United States -> a state where Stripe test tax rates are active
```

Stripe test registrations are separate from live registrations. You will need
live registrations later only for jurisdictions where you are actually required
to collect tax.

### 4.3 Enable Automatic Tax In RevenueCat

In RevenueCat:

1. Open the Azora project.
2. Go to the Web Billing configuration connected to Stripe.
3. Open the Billing tab.
4. Enable:

```text
Automatically detect and charge tax rates from Stripe Tax
```

5. Save changes.

### 4.4 Choose The Product Tax Code

RevenueCat requires a product tax code for Web Billing products when automatic
tax is enabled.

For an app subscription like Azora Pro, use RevenueCat's documented default
unless your accountant tells you otherwise:

```text
General - Electronically Supplied Services
txcd_10000000
```

Use that for:

```text
web_annual_discount
```

Important: RevenueCat Web Billing uses the product tax code configured in the
RevenueCat dashboard. You do not need to create or assign a Stripe product tax
code to a separate Stripe product for this v1 Web Billing setup.

### 4.5 Tax Behavior

RevenueCat Web Billing uses predefined tax behavior:

- US and Canada: tax-exclusive pricing, where tax is added on top of the listed
  price.
- Most other regions: tax-inclusive pricing, where the listed price includes
  tax.

Plan your displayed web copy accordingly. If checkout adds tax in the US/Canada,
the final amount can be higher than the headline price.

### 4.6 Test Tax Collection

Use the sandbox Web Purchase Link.

In checkout:

1. Enter a billing address in a test-mode tax-registered location.
2. Confirm checkout shows a tax line or tax breakdown.
3. Complete the sandbox purchase.
4. Confirm RevenueCat sends the purchase webhook.
5. Confirm Supabase updates `subscriptions`.

SQL checks:

```sql
select event_id, event_type, payload
from revenuecat_events
where user_id = '<supabase_user_id>'
order by received_at desc
limit 5;
```

Inspect `payload` for RevenueCat tax/price fields. Use Stripe dashboard for tax
reporting; RevenueCat says tax reports live in Stripe, not RevenueCat.

### 4.7 Production Tax Warning

Before production:

1. Ask an accountant where Azora must register to collect sales tax/VAT.
2. Add live tax registrations only for those jurisdictions.
3. Confirm Stripe Tax is enabled in live mode.
4. Confirm RevenueCat production Web Billing has automatic tax enabled.
5. Confirm the production product tax code is still:

```text
General - Electronically Supplied Services
txcd_10000000
```

or the tax code your accountant selected.

Do not turn on random live tax registrations for testing.

## Phase 5: Confirm The Entitlement

In RevenueCat, confirm the entitlement already exists:

```text
Azora  Pro
```

There are two spaces between `Azora` and `Pro`.

This exact identifier matters because mobile checks this RevenueCat entitlement
directly after purchases and restores.

Do not create a new entitlement named:

```text
Azora Pro
```

That one-space version is a different entitlement and will not satisfy the
mobile RevenueCat check.

## Phase 6: Create The First Web Product

Create one launch offer first.

Recommended v1 product:

```text
offer_id: web_annual_discount
display_name: Azora Pro Annual
billing_type: annual subscription
grants_entitlement: Azora  Pro
checkout_type: RevenueCat Web Purchase Link
```

In RevenueCat:

1. Go to Product Catalog.
2. Create a new web product under the Web Billing configuration.
3. Use a stable internal identifier:

```text
web_annual_discount
```

4. Set the display name:

```text
Azora Pro Annual
```

5. Set the product type:

```text
Subscription
```

6. Set the duration:

```text
Annual
```

7. Set the sandbox/test price.
8. Save the product.

Do not create monthly, lifetime, founder, and annual offers at the same time
unless you are ready to test all of them. One offer is easier to verify.

## Phase 7: Attach Product To Entitlement

Attach the web product to:

```text
Azora  Pro
```

The required contract is:

```text
Buying web_annual_discount grants Azora  Pro.
```

Do not continue until the RevenueCat dashboard clearly shows that the web
product grants that exact entitlement.

## Phase 8: Create Offering And Package

RevenueCat uses offerings/packages to decide what checkout presents.

Recommended v1:

```text
Offering identifier: web_annual_discount
Package: annual
Product: web_annual_discount
Entitlement: Azora  Pro
```

Mental model:

```text
Product = what is sold
Entitlement = what access it grants
Offering/package = how RevenueCat presents/selects the product
Web Purchase Link = hosted checkout URL for the package/offering
```

## Phase 9: Create The Web Purchase Link

In RevenueCat:

1. Go to Web Purchase Links.
2. Create a new Web Purchase Link.
3. Select the Web Billing configuration.
4. Select the `web_annual_discount` offering/package.
5. Configure hosted checkout copy and branding.
6. Configure success redirect.

Sandbox success redirect:

```text
https://staging.tryazora.app/checkout/success
```

Production success redirect:

```text
https://tryazora.app/checkout/success
```

Copy the sandbox Web Purchase Link first.

Example base link:

```text
https://pay.rev.cat/sandbox_token_here
```

Current sandbox links:

```text
Annual sandbox: https://pay.rev.cat/sandbox/onqkikrjlwnxfpsb
Weekly sandbox: https://pay.rev.cat/sandbox/plvwmjvsuochpfot
```

Use these staging env vars:

```env
REVENUECAT_WEB_PURCHASE_LINK_ANNUAL_SANDBOX=https://pay.rev.cat/sandbox/onqkikrjlwnxfpsb
REVENUECAT_WEB_PURCHASE_LINK_WEEKLY_SANDBOX=https://pay.rev.cat/sandbox/plvwmjvsuochpfot
```

Production links are separate values. Do not guess production by deleting
`/sandbox/` unless RevenueCat explicitly shows that as the production URL.
Find production links from the same purchase-link details page in RevenueCat
after production Web Billing and Stripe live mode are fully configured.

Production env vars should eventually be:

```env
REVENUECAT_WEB_PURCHASE_LINK_ANNUAL_PROD=
REVENUECAT_WEB_PURCHASE_LINK_WEEKLY_PROD=
```

The web server must append the Supabase user ID:

```text
https://pay.rev.cat/sandbox_token_here/<supabase_user_id>?email=<url_encoded_email>
```

Do not send users to:

```text
https://pay.rev.cat/sandbox_token_here
```

For Azora:

```text
RevenueCat App User ID = Supabase auth user.id
```

## Phase 10: Validate The Web Purchase Links

Before implementing or debugging the web repo checkout route, verify the
RevenueCat Web Purchase Links themselves.

Current sandbox base links:

```text
Annual sandbox: https://pay.rev.cat/sandbox/onqkikrjlwnxfpsb
Weekly sandbox: https://pay.rev.cat/sandbox/plvwmjvsuochpfot
```

These base links are not the final URLs your app should send users to. The web
app must append the Supabase user ID.

### 10.1 Basic Link Smoke Test

Open each base link in a browser:

```text
https://pay.rev.cat/sandbox/onqkikrjlwnxfpsb
https://pay.rev.cat/sandbox/plvwmjvsuochpfot
```

Expected:

```text
RevenueCat checkout page loads
No 404
No product/offering missing error
No Stripe/Web Billing configuration error
Correct product/price appears
```

Do not complete purchase from the base link. This is only a smoke test that the
purchase link exists.

### 10.2 Identified Link Test

Pick a real Supabase test user:

```sql
select id, email
from auth.users
where email = 'your-test-email@example.com';
```

Build an identified test URL manually:

```text
https://pay.rev.cat/sandbox/onqkikrjlwnxfpsb/<supabase_user_id>?email=<url_encoded_email>
```

Weekly:

```text
https://pay.rev.cat/sandbox/plvwmjvsuochpfot/<supabase_user_id>?email=<url_encoded_email>
```

Expected:

```text
RevenueCat checkout page loads
Checkout is associated with that Supabase user ID
Email appears or is prefilled if RevenueCat supports it in the current checkout
```

You can complete a purchase from this manual identified URL, but if you do it
before `/checkout/start` exists, there will be no `web_checkout_intents` row to
reconcile. The subscription can still mirror through the webhook if the
`profiles` row exists.

### 10.3 Profile Precondition

Before completing any identified purchase, confirm:

```sql
select *
from profiles
where user_id = '<supabase_user_id>';
```

Expected:

```text
one profile row exists
```

If this row is missing, create/sign in through the app flow or insert it through
the trusted server path. The webhook intentionally ignores subscription-writing
events when the RevenueCat App User ID does not resolve to a known profile.

### 10.4 Manual Purchase Link Test Without Web Repo

This test validates RevenueCat, Stripe, webhook, and Supabase subscription
mirroring before the web repo checkout route exists.

1. Confirm `profiles.user_id` exists.
2. Open the manual identified annual or weekly URL.
3. Complete sandbox checkout.
4. Check RevenueCat customer page for the Supabase user ID.
5. Confirm the entitlement:

```text
Azora  Pro
```

6. Check Supabase:

```sql
select event_id, event_type, user_id, environment, received_at
from revenuecat_events
where user_id = '<supabase_user_id>'
order by received_at desc
limit 10;

select *
from subscriptions
where user_id = '<supabase_user_id>';
```

Expected:

```text
revenuecat_events has INITIAL_PURCHASE
subscriptions row exists
subscriptions.status = active or trialing
subscriptions.revenuecat_app_user_id = Supabase user.id
```

Because `/checkout/start` was bypassed, this is allowed to remain empty or
unmatched:

```sql
select *
from web_checkout_intents
where user_id = '<supabase_user_id>'
order by created_at desc
limit 5;
```

### 10.5 Full Web Repo Link Test

After `/checkout/start` exists, do not use manual URLs anymore. Click the web
app checkout button.

Expected annual redirect:

```text
https://pay.rev.cat/sandbox/onqkikrjlwnxfpsb/<supabase_user_id>?email=<email>
```

Expected weekly redirect:

```text
https://pay.rev.cat/sandbox/plvwmjvsuochpfot/<supabase_user_id>?email=<email>
```

Before completing purchase, check:

```sql
select offer_id, status, revenuecat_app_user_id, environment, revenuecat_purchase_url
from web_checkout_intents
where user_id = '<supabase_user_id>'
order by created_at desc
limit 5;
```

Expected:

```text
offer_id = web_annual_discount or web_weekly_discount
status = redirected
revenuecat_app_user_id = Supabase user.id
environment = SANDBOX
```

After completing purchase:

```sql
select offer_id, status, revenuecat_event_id, purchased_at
from web_checkout_intents
where user_id = '<supabase_user_id>'
order by updated_at desc
limit 5;
```

Expected:

```text
status = purchased
revenuecat_event_id is not null
purchased_at is not null
```

### 10.6 If The Link Fails

If the base link fails:

- check RevenueCat Web Billing config
- check Stripe connection
- check product exists
- check offering/package exists
- check Web Purchase Link points to the correct offering/package

If the identified link loads but mobile does not unlock:

- check the URL includes the Supabase user ID
- check `profiles.user_id` exists
- check RevenueCat customer App User ID equals Supabase user ID
- check the product grants `Azora  Pro`
- check the web webhook logs
- check `subscriptions`

If the purchase works but `web_checkout_intents` does not update:

- confirm the purchase went through `/checkout/start`, not a manual URL
- confirm RevenueCat webhook points to `revenuecat-web-checkout-webhook`
- confirm intent `environment = SANDBOX`
- confirm intent status was `created` or `redirected` when webhook arrived

## Phase 11: Configure The Separate Web Webhook

Generate a new secret:

```bash
openssl rand -base64 32
```

Set it in Supabase:

```bash
supabase secrets set REVENUECAT_WEB_CHECKOUT_WEBHOOK_SECRET="paste_generated_secret_here"
```

Deploy the function:

```bash
supabase functions deploy revenuecat-web-checkout-webhook
```

In RevenueCat, create a new webhook configuration for web checkout events.

Webhook URL:

```text
https://<supabase-project-ref>.supabase.co/functions/v1/revenuecat-web-checkout-webhook
```

Authorization header:

```text
Authorization: Bearer <REVENUECAT_WEB_CHECKOUT_WEBHOOK_SECRET>
```

Keep the original mobile webhook configured separately:

```text
https://<supabase-project-ref>.supabase.co/functions/v1/revenuecat-webhook
```

Do not replace the mobile webhook unless you intentionally want mobile events
to use the web reconciliation path.

## Phase 12: Apply The Supabase Migration

Apply the migration in staging first:

```bash
supabase db push
```

Or apply this SQL file manually:

```text
supabase/migrations/20260608000100_web_funnel_commerce_contract.sql
```

Before applying to production, inspect staging.

Check existing row counts before and after:

```sql
select count(*) from profiles;
select count(*) from subscriptions;
select count(*) from revenuecat_events;
```

Confirm new tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'web_funnel_sessions',
    'web_funnel_attribution',
    'web_funnel_answers',
    'web_checkout_intents'
  )
order by table_name;
```

Confirm new nullable subscription columns exist:

```sql
select column_name, is_nullable, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'subscriptions'
  and column_name like 'last_revenuecat%'
order by column_name;
```

Confirm RLS is enabled on the new tables:

```sql
select relname, relrowsecurity
from pg_class
where relname in (
  'web_funnel_sessions',
  'web_funnel_attribution',
  'web_funnel_answers',
  'web_checkout_intents'
);
```

Existing data safety notes:

- The migration adds only nullable columns to existing `subscriptions`.
- It creates new empty web funnel tables.
- It does not backfill existing rows.
- It does not add non-null constraints to existing populated tables.
- It does not alter existing mobile RLS policies.

## Phase 13: Web Repo Environment Variables

In the web repo, add server-only env vars:

```env
REVENUECAT_WEB_PURCHASE_LINK_ANNUAL_SANDBOX=https://pay.rev.cat/sandbox_token_here
REVENUECAT_WEB_PURCHASE_LINK_ANNUAL_PROD=https://pay.rev.cat/production_token_here
```

Do not use `NEXT_PUBLIC_` for these checkout base URLs.

Also make sure the web repo has the Supabase server env vars it needs:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service-role key must only be used in server-side code.

## Phase 14: Implement `/checkout/start`

In the web repo, create a server route:

```text
app/checkout/start/route.ts
```

This route must:

1. Read the Supabase session from server cookies.
2. If no user exists, redirect to login.
3. Ensure `profiles.user_id` exists.
4. Create or attach a `web_funnel_sessions` row.
5. Create a `web_checkout_intents` row.
6. Build the RevenueCat Web Purchase Link with Supabase `user.id`.
7. Redirect to RevenueCat.

The checkout URL must be built server-side, not in a client component.

Example route shape:

```ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL('/login?next=/checkout/start', req.url));
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { user_id: user.id },
      { onConflict: 'user_id', ignoreDuplicates: true },
    );

  if (profileError) {
    throw profileError;
  }

  const { data: funnelSession, error: sessionError } = await supabase
    .from('web_funnel_sessions')
    .insert({
      anonymous_id: crypto.randomUUID(),
      user_id: user.id,
      funnel_slug: 'web_annual_discount',
      landing_path: '/checkout/start',
      initial_url: req.url,
      status: 'checkout_started',
    })
    .select('id')
    .single();

  if (sessionError) {
    throw sessionError;
  }

  const purchaseUrl = buildRevenueCatPurchaseUrl({
    baseUrl: process.env.REVENUECAT_WEB_PURCHASE_LINK_ANNUAL_SANDBOX!,
    appUserId: user.id,
    email: user.email,
  });

  const { error: intentError } = await supabase
    .from('web_checkout_intents')
    .insert({
      session_id: funnelSession.id,
      user_id: user.id,
      offer_id: 'web_annual_discount',
      revenuecat_app_user_id: user.id,
      revenuecat_product_id: null,
      revenuecat_purchase_url: purchaseUrl,
      environment: 'SANDBOX',
      status: 'redirected',
    });

  if (intentError) {
    throw intentError;
  }

  return NextResponse.redirect(purchaseUrl);
}

function buildRevenueCatPurchaseUrl(input: {
  baseUrl: string;
  appUserId: string;
  email?: string | null;
}) {
  const url = new URL(
    `${input.baseUrl.replace(/\/$/, '')}/${encodeURIComponent(input.appUserId)}`,
  );

  if (input.email) {
    url.searchParams.set('email', input.email);
  }

  return url.toString();
}
```

Replace `createServerSupabaseClient()` with the web repo's actual Supabase SSR
helper.

For production, choose the checkout base URL based on environment:

```ts
const baseUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.REVENUECAT_WEB_PURCHASE_LINK_ANNUAL_PROD
    : process.env.REVENUECAT_WEB_PURCHASE_LINK_ANNUAL_SANDBOX;
```

## Phase 15: Implement `/checkout/success`

Create:

```text
app/checkout/success/page.tsx
```

The success page should:

1. Read the Supabase user.
2. Poll `web_checkout_intents` for the latest row.
3. Check whether `status = purchased`.
4. Also check `subscriptions` or `user_entitlement_v`.
5. Show an install/open app CTA after confirmation.

Do not show another paywall on the success page.

If the webhook is delayed, show a pending state:

```text
Finalizing your purchase...
```

Then poll again for a short window.

## Phase 16: Sandbox Test

Use one known Supabase test user.

Find the user:

```sql
select id, email
from auth.users
where email = 'your-test-email@example.com';
```

Before checkout, verify profile:

```sql
select *
from profiles
where user_id = '<supabase_user_id>';
```

Click the web checkout button.

Before completing payment, verify checkout intent:

```sql
select *
from web_checkout_intents
where user_id = '<supabase_user_id>'
order by created_at desc
limit 5;
```

Expected:

```text
status = redirected
environment = SANDBOX
revenuecat_app_user_id = Supabase user.id
offer_id = web_annual_discount
```

Complete the RevenueCat sandbox checkout.

After purchase, check events:

```sql
select event_id, event_type, user_id, environment, received_at
from revenuecat_events
where user_id = '<supabase_user_id>'
order by received_at desc
limit 10;
```

Expected:

```text
event_type = INITIAL_PURCHASE
environment = SANDBOX
```

Check subscription mirror:

```sql
select *
from subscriptions
where user_id = '<supabase_user_id>';
```

Expected:

```text
status = active or trialing
revenuecat_app_user_id = Supabase user.id
entitlement = Azora  Pro
```

Check web intent reconciliation:

```sql
select *
from web_checkout_intents
where user_id = '<supabase_user_id>'
order by updated_at desc
limit 5;
```

Expected:

```text
status = purchased
revenuecat_event_id is not null
purchased_at is not null
```

Check app-facing entitlement behavior:

```sql
select
  user_id,
  status,
  current_period_ends_at,
  (
    status in ('active', 'trialing')
    and (current_period_ends_at is null or current_period_ends_at > now())
  ) as would_be_pro
from subscriptions
where user_id = '<supabase_user_id>';
```

Expected:

```text
would_be_pro = true
```

Finally, sign into mobile with the same Supabase account and confirm Pro access.

## Troubleshooting

### Purchase Completes But Mobile Does Not See Pro

Check:

```sql
select *
from subscriptions
where user_id = '<supabase_user_id>';
```

If no row exists, check the web webhook logs.

Common causes:

- RevenueCat webhook URL points to the old mobile webhook.
- `REVENUECAT_WEB_CHECKOUT_WEBHOOK_SECRET` does not match the header.
- Checkout URL did not include Supabase `user.id`.
- `profiles.user_id` did not exist before purchase.

### `web_checkout_intents` Stays `redirected`

If `subscriptions` updated but the intent did not:

- Confirm the web webhook, not the mobile webhook, received the event.
- Confirm `revenuecat_app_user_id` equals Supabase `user.id`.
- Confirm intent `environment` matches RevenueCat event environment.
- Confirm the intent is still `created` or `redirected` when purchase event arrives.

### RevenueCat Customer Uses Wrong App User ID

The web checkout URL is wrong.

Correct:

```text
https://pay.rev.cat/<token>/<supabase_user_id>?email=<email>
```

Wrong:

```text
https://pay.rev.cat/<token>
```

### Entitlement Is Wrong

In RevenueCat, confirm the web product grants:

```text
Azora  Pro
```

Do not rely on display names.

### Sandbox Works But Production Does Not

Check:

- production Web Purchase Link env var
- production RevenueCat offering/package
- production product grants `Azora  Pro`
- production Stripe account is fully activated
- production webhook is configured with the correct secret
- production success redirect points to `https://tryazora.app/checkout/success`

## Production Launch Checklist

- [ ] Stripe account fully verified.
- [ ] RevenueCat Web Billing connected to Stripe.
- [ ] Web product `web_annual_discount` exists.
- [ ] Product grants `Azora  Pro`.
- [ ] Offering/package exists.
- [ ] Sandbox Web Purchase Link tested.
- [ ] Production Web Purchase Link copied into server env.
- [ ] Supabase migration applied in staging.
- [ ] Supabase migration applied in production.
- [ ] `revenuecat-web-checkout-webhook` deployed.
- [ ] `REVENUECAT_WEB_CHECKOUT_WEBHOOK_SECRET` set.
- [ ] RevenueCat web webhook points to the new web webhook.
- [ ] Original mobile webhook remains unchanged.
- [ ] `/checkout/start` creates `web_checkout_intents` before redirect.
- [ ] `/checkout/success` handles pending webhook state.
- [ ] Sandbox purchase updates `subscriptions`.
- [ ] Sandbox purchase marks `web_checkout_intents.status = purchased`.
- [ ] Mobile app sees Pro for the same Supabase user.

## References

- RevenueCat Web Billing overview: https://www.revenuecat.com/docs/web/web-billing/overview
- RevenueCat web product setup: https://www.revenuecat.com/docs/web/web-billing/product-setup
- RevenueCat Web Purchase Links: https://www.revenuecat.com/docs/web/web-billing/web-purchase-links
- RevenueCat webhooks: https://www.revenuecat.com/docs/integrations/webhooks
- Supabase Edge Function secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase Edge Function deploy: https://supabase.com/docs/guides/functions/deploy
