# Supabase

This folder contains the launch database migrations for the Azora backend plan.

## Technique Storage Decision

Keep built-in breathing techniques in
`src/features/exercise/guidedBreathing/techniques.ts` for v1.

Why:

- The current catalog is small and bundled with the app.
- Local data is faster and works without a remote content-management flow.
- It avoids building admin tooling before user-authored or remotely configured techniques exist.
- Premium access can be enforced in the app for UI and in RPCs for writes.

Move techniques to Supabase later when the app needs:

- User-authored custom breathing patterns.
- Remote content updates without an app release.
- A larger technique library.
- Server-side technique metadata, categories, recommendations, or experiments.

The v1 schema stores `breathing_sessions.technique_id` as text and validates it
server-side against `breathing_technique_catalog`, a narrow backend reference
table for the active launch ids.

## Migration Scope

Included in v1 migrations:

- `profiles`
- `user_preferences`
- `breath_hold_sessions`
- `breathing_sessions`
- `heart_rate_sessions`
- `heart_rate_samples`
- `heart_rate_ibi_samples`
- `daily_activity`
- `wallet_entries` (additive coin ledger; older app versions ignore it)
- room inventory ownership and immutable legacy reward history
- `subscriptions`
- `revenuecat_events`
- `web_funnel_sessions`
- `web_funnel_attribution`
- `web_funnel_answers`
- `web_checkout_intents`
- RLS policies
- `user_streaks_v`
- Session completion RPCs

Web funnel commerce tables live here because the mobile/backend repo owns the
shared Supabase contract for subscription identity and entitlement state. The
separate web funnel repo should create sessions, attribution, answers, and
checkout intents through server-side code using the agreed contract; it should
not maintain a competing migration history for these shared tables.

Web checkout RevenueCat events should use the separate
`revenuecat-web-checkout-webhook` function with
`REVENUECAT_WEB_CHECKOUT_WEBHOOK_SECRET`. The existing `revenuecat-webhook`
function remains the mobile purchase mirror and is intentionally unchanged by
the web funnel contract.

Use `user_today_breath_hold_v` to read the latest authenticated breath-hold
session for the user's current local day.

Breath holds no longer derive HRV. The app release that ships this change stops
sending HRV / IBI keys to the `complete_breath_hold` RPC; the existing RPC
already stores NULL for any omitted column, so no migration is needed for new
clients to behave correctly — pre-removal clients keep their full UI during
the bake (their writes still populate the HRV columns, harmlessly).

When pre-removal clients are effectively gone, apply
`20260527000100_breath_hold_remove_hrv.sql` — a single contract migration that
rewrites `complete_breath_hold` to ignore HRV / IBI, drops
`user_today_breath_hold_ibi_samples_v`, drops the HRV columns
(`rmssd`, `sdnn`, `pnn50`, `hr_drop`, `beat_count`, `stress`) from
`breath_hold_sessions`, recreates `user_today_breath_hold_v` without them, and
deletes historical breath-hold IBI rows. The step is irreversible — see the
file's header for the precondition. HRV now comes solely from standalone
heart-rate sessions.

Standalone heart-rate sessions can also store `rmssd`, `sdnn`, `pnn50`,
`hr_drop`, and `beat_count` on `heart_rate_sessions`. Use
`user_today_heart_rate_v` and `user_today_heart_rate_ibi_samples_v` to read the
latest authenticated standalone heart-rate summary and graph data for today.

Tracking views that depend on the authenticated user should be created with
`security_invoker = true` so they respect caller permissions and RLS context.

Graph-point tables are protected against duplicate offsets per parent session,
and the completion RPCs upsert those rows on retry.

Deferred intentionally:

- `breathing_techniques`
- `achievements`
- `user_achievements`
- `xp_events`
- `streak_freezes`
- social/friend tables

## Plan to-do step

`20261011000100_plan_todo_step.sql` adds the claimed routine to-do step.
`todo_step_from_day` is nullable; older apps omit it and keep their frozen
plan snapshots. The new app enables `PLAN_TODO_STEP_ENABLED` and adopts both
new and existing active enrollments through `adopt_plan_todo_step_compatible()`.
That RPC is added only by `20261011000600`, after the compatibility fixes;
install migrations 001–006 in order before releasing the app. Until then the
card remains absent on unadopted plans. No migration is deployed by this change.

`20261011000600_preserve_legacy_plan_advancement.sql` keeps the shipped server
advancement rule: complete the Resets, the scheduled lesson and that date's
check-in. It applies to adopted enrollments too, so an older app on another
device never needs a card or routine goal it does not show. The new UI requires
the explicit to-do claim for its room reward and pays 10 coins for that claim;
it does not add a new server advancement requirement. Migration 004's tick
trigger still rechecks readiness without making the tick a required step.

`claim_plan_todo_step({ localDate })` records `activity_id = 'todo:claim'` on the
day on screen. It refuses `not_required` and `no_todo_ticked`, is idempotent,
and pays through `grant_coins_for_daily_plan_completion` (reason
`daily_plan_todo_claim`). Un-ticking afterwards does not undo it. Migration 005
allows the latest completed enrollment to claim its final day, even when the
user returns later; active plans still take priority. The UI opens the reward
only after a recorded claim and uses the returned coin amount.

`RESET_FREE_PLANS_ENABLED` in `programCatalogue.ts` remains false. Builds before
the empty-day fix reject an entire snapshot containing any zero-Reset day, so
new enrollments and onboarding keep selecting the prior revisions. Newer
revisions remain available by exact revision for already stored snapshots.
Enable those editions only after explicitly ending mixed-version support.

Side fixes: `20261011000200` restores the attention counter, and
`20261011000300` restricts the internal advancement helper to definer functions
and triggers. Existing public client RPCs remain callable by authenticated users.

Verify the real plan tables, migrations, triggers and RPCs in an isolated
PostgreSQL WASM database, without changing this app's dependencies or any remote
database:

```sh
npm install --prefix /tmp/azora-plan-review --no-package-lock --no-save @electric-sql/pglite
node scripts/verify-plan-todo-compatibility.mjs /tmp/azora-plan-review/node_modules/@electric-sql/pglite/dist/index.js
```

The check covers old inserts and completion calls, mixed builds without routine
goals, legacy and exact lessons, final-day/delayed claims, un-ticks, retries,
coin idempotence, attention counts, and client function permissions. Unrelated
platform tables are fixtures; this is not a complete Supabase integration or a
native app smoke test.

After deploying pending migrations, run `scripts/sql/verify-plan-todo-rollout.sql`
in Supabase SQL Editor. It is read-only: all first-result booleans should be
true, and the second result reports existing empty-day snapshots that older
builds cannot read. A nonzero count needs review before claiming compatibility
for those accounts; holding new revisions does not repair historical snapshots.

## Photo cleanup plan

`photo-cleanup-plan` is an authenticated Edge Function. It receives a single
in-memory room photo and returns a small, structured cleaning plan from Gemini
3.5 Flash-Lite; the image and plan are not persisted by this first release.
Configure the function with `GEMINI_API_KEY` before deploying it. The mobile
client never contains that key. Apply `20260921000200_add_photo_cleanup_rate_limit.sql`
before deployment: the function atomically allows at most 30 plans per user per
hour and 100 per day, before a room photo is sent to the AI provider.
