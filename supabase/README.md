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
