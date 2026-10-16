# Qualified trial → AppsFlyer

`qualified_trial` is an additional, non-revenue event for a native-store trial
that has lasted at least ten minutes and has no cancellation, expiration, or
billing issue detected when the worker checks it. Ordinary trial, conversion,
and renewal events continue through RevenueCat → AppsFlyer.

This is a best-effort qualification signal. RevenueCat says cancellation
webhooks usually arrive within two hours; a live API check can also lag store
state. The event does not prove that the subscriber will convert, or that they
did not cancel during the first ten minutes. A cancellation detected before a
delayed worker runs also suppresses the event, even if the subscriber canceled
after minute ten. See [RevenueCat delivery delays](https://www.revenuecat.com/docs/integrations/webhooks#delivery-delays).

## Backend flow

1. The existing mobile webhook inserts the original RevenueCat event into
   `revenuecat_events`.
2. A database trigger queues new production `INITIAL_PURCHASE` events with
   `period_type = TRIAL` from `APP_STORE` or `PLAY_STORE`. Each original
   subscription transaction can be queued once per RevenueCat app and store.
   An enqueue error logs a database warning and preserves the source event, so
   optional marketing work does not stop the existing billing webhook.
3. A job invokes `send-qualified-trials` every minute. Due events are claimed
   in small batches. Known cancellation, expiration, and billing issue events
   suppress delivery, including when they arrived before the trial-start event.
4. The worker reads the exact product's current subscription from RevenueCat.
   It requires an unexpired production trial with no cancellation, refund, or
   billing issue, and the subscriber's AppsFlyer ID.
5. The worker checks the event log again before dispatch and sends
   `qualified_trial` through AppsFlyer's mobile S2S API. Its event time is the
   ten-minute qualification point, and its parameters identify the product and
   source event. It has no `af_revenue` value.

Only trial events received after installing the migration are queued. There is
no historical backfill, web-checkout forwarding, or sandbox forwarding.
Normal delivery is around minute ten to eleven, depending on the cron tick,
webhook latency, and queue backlog. Each worker invocation claims at most five
events; monitor backlog before increasing acquisition volume.

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
it never queries the qualification queue. Only the extra `qualified_trial`
events remain inactive until backend setup is complete.

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

1. In the intended project's Supabase SQL editor, run only
   `supabase/migrations/20261015000100_add_qualified_trial_events.sql`, once.
   This change does not require deploying other migrations.
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
3. Open **Edge Functions → Deploy a new function → Via Editor**. Name the new
   function **`send-qualified-trials`**. Replace the template's `index.ts` with
   the entire contents of `artifacts/qualified-trial-dashboard/index.ts`, then
   deploy. This is a generated, single-file copy of the same tested worker; it
   needs no local companion files. Create this new function without changing
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
   `qualified_trial` event in AppsFlyer. A successful S2S HTTP response only
   confirms acceptance for processing; verify attribution and reporting too.
   AppsFlyer requires an iOS app ID with the `id` prefix, even though an
   incorrect prefix can receive HTTP 200. See the
   [S2S API reference](https://dev.appsflyer.com/hc/reference/post_s2s_inappevent).

For future source changes, maintainers regenerate the paste-ready artifact with
`node scripts/build-qualified-trial-dashboard.mjs`. The canonical implementation
remains in `supabase/functions/send-qualified-trials/`; the ignored artifact
must not be edited as a second implementation.

## Advertising mapping

Keep `af_start_trial` in AppsFlyer for raw reporting. To expose the additional
signal to Meta, map `qualified_trial` using the **CUSTOM** partner event option.
Meta receives it under its original name, `qualified_trial`. AppsFlyer documents custom event
mapping in its [Meta mapping guide](https://support.appsflyer.com/hc/en-us/articles/4410480904081-Meta-ads-in-app-event-mapping).
Confirm the event is available for optimization in the destination account;
delivery does not guarantee optimization eligibility.

If you instead want Meta's standard `StartTrial` to contain only qualified
trials, replace its existing `af_start_trial → StartTrial` mapping with
`qualified_trial → StartTrial`. Do not map both to `StartTrial`: one subscriber
could produce two conversions. Check any separate RevenueCat → Meta forwarding
too before choosing that setup. These dashboard changes are a separate rollout
decision and are not made by this code.

## Verification and operation

Check the queue's status counts, due pending work, failed rows, and stale
processing/dispatching rows. Check `cron.job_run_details`, `net._http_response`,
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
- Eligible trial older than ten minutes: one `qualified_trial`, no revenue.
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
with the migration installed and an empty queue. It checks actual queue/RPC
transitions inside a transaction and rolls its fixtures back. Full deployment
validation still needs the hosted cron, Vault secrets, RevenueCat credentials,
and confirmation in AppsFlyer's reporting.

The existing `scripts/seed-start-trial.sh` and daily wrapper post ordinary
`af_start_trial` events directly to AppsFlyer. They do not insert RevenueCat
events or prove trial qualification, and are unchanged by this implementation.
Do not use them as the verification step for the new worker.
