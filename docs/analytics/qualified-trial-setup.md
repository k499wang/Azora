# Qualified trial → AppsFlyer

Two additional, non-revenue events qualify native-store trials with no
cancellation, expiration, or billing issue detected when the worker checks:

| Event | Minimum trial age |
| --- | --- |
| `qualified_trial` | 10 minutes (existing event) |
| `qualified_trial_v2` | 2 hours |

V2 is additive: an eligible trial can send each event once. Ordinary trial,
conversion, and renewal events continue through RevenueCat → AppsFlyer.

This is a best-effort qualification signal. RevenueCat says cancellation
webhooks usually arrive within two hours; a live API check can also lag store
state. The event does not prove that the subscriber will convert, or that they
did not cancel during the qualification window. A cancellation detected before a
delayed worker runs also suppresses the event, even if the subscriber canceled
after the corresponding qualification threshold. See [RevenueCat delivery delays](https://www.revenuecat.com/docs/integrations/webhooks#delivery-delays).

## Backend flow

1. The existing mobile webhook inserts the original RevenueCat event into
   `revenuecat_events`.
2. A database trigger queues new production `INITIAL_PURCHASE` events with
   `period_type = TRIAL` from `APP_STORE` or `PLAY_STORE`. Each original
   subscription transaction can be queued once per event version, RevenueCat app,
   and store. V1 is due ten minutes after purchase; V2 is due two hours after
   purchase. A version is queued only if the trial expires after its due time.
   An enqueue error logs a database warning and preserves the source event, so
   optional marketing work does not stop the existing billing webhook.
3. A job invokes `send-qualified-trials` every minute. Due events are claimed
   in small batches. Known cancellation, expiration, and billing issue events
   suppress delivery, including when they arrived before the trial-start event.
4. The worker reads the exact product's current subscription from RevenueCat.
   It requires an unexpired production trial with no cancellation, refund, or
   billing issue, and the subscriber's AppsFlyer ID.
5. The worker checks the event log again before dispatch and sends
   `qualified_trial` or `qualified_trial_v2` through AppsFlyer's mobile S2S API.
   Its event time is the corresponding qualification point, and its parameters
   identify the product, source event, and `qualification_minutes` (10 or 120).
   It has no `af_revenue` value.

Only trial events received after installing each version's migration are queued
for that version. Existing V1 jobs stay V1; upgrading does not backfill V2 for
older trials. There is no web-checkout or sandbox forwarding. Normal delivery
is around minutes ten to eleven for V1 and minutes 120 to 121 for V2, depending
on the cron tick, webhook latency, and queue backlog. Each worker invocation
claims at most five events; monitor backlog before increasing acquisition volume.

The queue and its RPCs are accessible only to backend service credentials.
Processing leases prevent overlapping workers from sending the same event.
Only stores with configured AppsFlyer credentials are claimed; Android work
waits without consuming retries until its app ID is configured. Up to five jobs
run concurrently, with eight-second HTTP deadlines, within the two-minute lease.
Work that fails before dispatch can retry, with a bounded attempt count.
Ambiguous AppsFlyer delivery is held for manual reconciliation instead of
automatically resent; the mobile API has no assumed durable idempotency key.

## Activate in the Supabase dashboard

The repository change prepares this flow; it does not deploy it or change any
advertising dashboard settings. No mobile app release is required.
The mobile app can also be released before this SQL or worker is deployed:
it never queries the qualification queue. The extra qualification events remain
inactive until backend setup is complete.

The entire deployment can be completed in the browser. No Supabase CLI, CLI
login, or access token is required. Supabase documents this workflow in its
[dashboard quickstart](https://supabase.com/docs/guides/functions/quickstart-dashboard).

The private `artifacts/qualified-trial-dashboard/backend-secrets.env` file has already been prepared in this
workspace with the existing AppsFlyer values and a generated cron secret.
It lives under Metro's excluded `artifacts/` directory. Do not place backend
secret files named `.env.*` in the app root: Expo's development environment
loader includes them as modules, and custom names can fail JavaScript parsing.
Open it locally and fill in `REVENUECAT_SECRET_API_KEY` using a **secret** API key
from the same RevenueCat project as the mobile app. Do not use the public
`EXPO_PUBLIC_REVENUECAT_IOS_KEY`. Keep the file private and Git-ignored.

1. In the intended project's Supabase SQL editor, install these migrations in order:
   `supabase/migrations/20261015000100_add_qualified_trial_events.sql`, then
   `supabase/migrations/20261021000100_add_qualified_trial_v2.sql`. Run each once;
   skip the original migration if V1 is already installed. Install the V2
   migration **before** deploying the updated worker. The old worker can safely
   remain running during migration: its original claim RPC returns only V1
   jobs. The updated worker uses the version-aware RPC to claim both.
2. Configure the Edge Function secrets below in the intended Supabase project.
   Open **Edge Functions → Secrets** and add the values from
   `artifacts/qualified-trial-dashboard/backend-secrets.env`. The dashboard supports pasting multiple secret
   assignments together. Save the four required values below; leave the optional
   Android value unset until ready. See [secret management](https://supabase.com/docs/guides/functions/secrets).

   | Secret | Value |
   | --- | --- |
   | `QUALIFIED_TRIAL_CRON_SECRET` | Random secret of at least 32 characters |
   | `REVENUECAT_SECRET_API_KEY` | RevenueCat secret API key with access to subscriber data and attributes |
   | `APPSFLYER_DEV_KEY` | AppsFlyer developer key for the mobile S2S endpoint; use the dev key, not an API3 S2S token |
   | `APPSFLYER_IOS_APP_ID` | AppsFlyer iOS app ID, including the `id` prefix |
   | `APPSFLYER_ANDROID_APP_ID` | Optional; Android app ID when Android forwarding is ready |

   Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the
   function. RevenueCat must already have `$appsflyerId` for the subscriber;
   the app's existing identity sync sets it. The secret RevenueCat API key is
   needed because the API only returns subscriber attributes to secret-key
   requests. See the [customer model](https://www.revenuecat.com/docs/api-v1/customer-info-model).
3. For an existing installation, open **`send-qualified-trials`** in the Edge
   Functions editor. For a new installation, use **Edge Functions → Deploy a new
   function → Via Editor**, named **`send-qualified-trials`**. Replace `index.ts` with
   the entire contents of `supabase/send-qualified-trials.txt`, then
   deploy. This is a generated, single-file copy of the same tested worker; it
   needs no local companion files. Deploy this function without changing
   `revenuecat-webhook` or `revenuecat-web-checkout-webhook`.

   In this function's settings/details, turn off **Verify JWT** (the legacy JWT
   verification toggle) and save. The cron job uses the worker's own
   `QUALIFIED_TRIAL_CRON_SECRET` bearer authentication. Leave verification
   settings for existing functions unchanged.
4. In Supabase Vault, create exactly one secret under each name:
   `qualified_trial_project_url` = `https://<project-ref>.supabase.co`, and
   `qualified_trial_cron_secret` = the same value as
   `QUALIFIED_TRIAL_CRON_SECRET`. Use the Vault dashboard so the secret is not
   embedded in the job definition.
5. Run `scripts/sql/schedule-qualified-trials.sql` in that project's SQL editor.
   It installs/uses `pg_cron` and `pg_net` and schedules a POST every minute.
   Re-running updates the named job. This follows Supabase's
   [scheduled Edge Function pattern](https://supabase.com/docs/guides/functions/schedule-functions).
   For the first invocation, expect HTTP 200 from the worker. HTTP 401 means the
   Vault cron secret and Edge Function secret differ; HTTP 503 means the worker
   configuration is incomplete. Inspect `net._http_response` for the response,
   not just cron's successful scheduling of the HTTP request.
6. Confirm a real eligible trial reaches `sent` in the queue, then verify the
   `qualified_trial` and `qualified_trial_v2` events in AppsFlyer at their
   respective qualification times. A successful S2S HTTP response only
   confirms acceptance for processing; verify attribution and reporting too.
   AppsFlyer requires an iOS app ID with the `id` prefix, even though an
   incorrect prefix can receive HTTP 200. See the
   [S2S API reference](https://dev.appsflyer.com/hc/reference/post_s2s_inappevent).

For future source changes, maintainers regenerate the paste-ready artifact with
`node scripts/build-qualified-trial-dashboard.mjs`. The canonical implementation
remains in `supabase/functions/send-qualified-trials/`; the Git-visible
`supabase/send-qualified-trials.txt` and ignored dashboard artifact are generated
copies and must not be edited as separate implementations. Existing V1 installations reuse
the same function, secrets, Vault entries, and cron schedule; only the new
migration and regenerated worker deployment are required.

## Advertising mapping

Keep `af_start_trial` in AppsFlyer for raw reporting. To expose the additional
signals to Meta, map `qualified_trial` and/or `qualified_trial_v2` separately
using the **CUSTOM** partner event option. Meta receives each under its original
name. AppsFlyer documents custom event
mapping in its [Meta mapping guide](https://support.appsflyer.com/hc/en-us/articles/4410480904081-Meta-ads-in-app-event-mapping).
Confirm the event is available for optimization in the destination account;
delivery does not guarantee optimization eligibility.

If you instead want Meta's standard `StartTrial` to contain only qualified
trials, replace its existing `af_start_trial → StartTrial` mapping with
`qualified_trial_v2 → StartTrial` for two-hour qualification (or
`qualified_trial → StartTrial` for ten-minute qualification). Map only one of
`af_start_trial`, `qualified_trial`, and `qualified_trial_v2` to `StartTrial`:
one subscriber can produce all three events. Check any separate RevenueCat →
Meta forwarding too before choosing that setup. These dashboard changes are a separate rollout
decision and are not made by this code.

## Verification and operation

Check the queue's status counts by `event_name`, due pending work, failed rows,
and stale processing/dispatching rows. Check `cron.job_run_details`, `net._http_response`,
and Edge Function logs if invocations stop or return non-2xx.
After setup, run `scripts/sql/check-qualified-trials.sql` in the SQL editor for
read-only migration, trigger, queue, Vault-name, cron, and HTTP status checks.
It never claims work or prints credentials.

If enqueueing fails, the database emits a `Qualified trial enqueue failed`
warning and billing continues. That event remains in the RevenueCat audit log
but its marketing queue entry is not automatically recreated. Diagnose and
recover the queue entry directly; do not replay an old billing webhook solely
to repair marketing delivery, because the existing subscription mirror also
processes replayed events.

Pause future sends with:

```sql
select cron.unschedule('send-qualified-trials');
```

Stopping the schedule preserves queued work and does not change subscriptions.
Before resuming after an outage, review pending work: qualification happens at
dispatch, and trials that expired or canceled during the outage are suppressed.
For `uncertain` or stale `dispatching` rows, reconcile with AppsFlyer before
manually retrying. A crash after AppsFlyer accepted an event may leave the local
row unresolved; resending without reconciliation can double-count.

Before activating the job, verify these cases with local fixtures and mocked
HTTP responses; the worker intentionally excludes sandbox purchases:

- Trial younger than ten minutes: no send.
- Eligible trial at ten minutes: one `qualified_trial`, no V2 yet, no revenue.
- Eligible trial at two hours: one `qualified_trial_v2` with 120 qualification
  minutes and no revenue.
- Cancellation between ten minutes and two hours: V1 stays sent; V2 is suppressed.
- Old worker after the migration: claims only V1, even when V2 is overdue.
- Cancellation before or after start-webhook arrival: no send.
- Subscription still grants access but auto-renew is canceled: no send.
- Trial expired, refunded, or in billing trouble: no send.
- Duplicate webhook and overlapping invocations: one delivery attempt.
- Missing attribution ID or unavailable RevenueCat: bounded retries, no blind send.
- Web-store, sandbox, and paid purchase: no event.
- AppsFlyer timeout after dispatch: manual review, no automatic duplicate.

Run the worker's mocked HTTP tests with
`npm test -- supabase/functions/send-qualified-trials/qualifiedTrial.test.mjs`.
Run `scripts/sql/verify-qualified-trial-queue.sql` against a disposable database
with both migrations installed and an empty queue. It checks actual queue/RPC
transitions inside a transaction and rolls its fixtures back. To run it locally
with PGlite, use `node scripts/verify-qualified-trials.mjs`. If PGlite is installed
outside the repository, pass its module entry point as the first argument:
`node scripts/verify-qualified-trials.mjs /path/to/@electric-sql/pglite/dist/index.js`.
The runner also verifies existing V1 jobs survive the upgrade without a V2
backfill. Full deployment validation still needs the hosted cron, Vault secrets, RevenueCat credentials,
and confirmation in AppsFlyer's reporting.

The existing `scripts/seed-start-trial.sh` and daily wrapper post ordinary
`af_start_trial` events directly to AppsFlyer. They do not insert RevenueCat
events or prove trial qualification, and are unchanged by this implementation.
Do not use them as the verification step for the new worker.
