# Phase 2: Data Persistence

## Goal

Persist launch tracking data in Supabase and replace hardcoded analytics with real backend reads.

## Scope

Ship the launch schema:

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
- `breathing_technique_catalog` (narrow server-side id validator, not a full CMS/techniques table)

Derived HRV summary columns on `breath_hold_sessions` and `heart_rate_sessions`
(`rmssd`, `sdnn`, `pnn50`, `hr_drop`, `beat_count`) are also in scope.

Today-scoped convenience views (all `security_invoker = true`):

- `user_today_breath_hold_v`
- `user_today_breath_hold_ibi_samples_v`
- `user_today_heart_rate_v`
- `user_today_heart_rate_ibi_samples_v`

Do not ship in this phase:

- a full `breathing_techniques` CMS table (distinct from the narrow `breathing_technique_catalog` reference table above)
- achievements / XP / streak-freeze tables
- social tables

## Technique Storage

Keep built-in techniques in `src/data/techniques.ts` for v1, but validate
session writes against a narrow backend reference table.

Why:

- small catalog
- no admin flow needed
- no remote content system needed yet

`breathing_sessions.technique_id` stays as text and should be validated
server-side against `breathing_technique_catalog`, which holds the launch ids.

## Schema Summary

Profiles and preferences:

- `profiles`
- `user_preferences`

Tracking:

- `breath_hold_sessions`
- `breathing_sessions`
- `heart_rate_sessions`

Derived HR detail:

- `heart_rate_samples`
- `heart_rate_ibi_samples`
- derived HRV summary fields on `breath_hold_sessions`

Daily aggregation:

- `daily_activity`

Billing:

- `subscriptions`
- `revenuecat_events`

## Heart-Rate Sample Definition

`heart_rate_samples` stores derived BPM points, not raw camera frames.

Each row represents one point in a session time series:

- `offset_ms`
- `bpm`
- `signal_quality`
- exactly one parent session id

Rules:

- store derived BPM points only
- do not store raw RGB / ROI / frame-level PPG signal data
- target roughly 1 derived BPM row per second while tracking is active

## IBI Sample Definition

`heart_rate_ibi_samples` stores derived inter-beat intervals, not raw camera
frames and not raw optical samples.

Each row represents one beat interval in a session time series:

- `offset_ms`
- `ibi_ms`
- `signal_quality`
- exactly one parent session id

Rules:

- store derived interval timings only
- do not store raw RGB / ROI / frame-level PPG signal data
- use these rows for HRV graphs and recomputation of RMSSD / SDNN / pNN50

## Breath-Hold HRV Summary

For the launch breath-hold and standalone heart-rate flows, store derived HRV
summary metrics directly on the session row:

- `rmssd`
- `sdnn`
- `pnn50`
- `hr_drop`
- `beat_count`

These are derived metrics, not raw signal data, so they fit the launch storage
rule. They make home-screen reads simpler and avoid reconstructing HRV from
stored BPM points later.

Use `user_today_breath_hold_v` to read the authenticated user's latest
breath-hold session for their current local day.

Use `user_today_breath_hold_ibi_samples_v` to read the latest authenticated
breath-hold IBI series for today's HRV graph.

Use `user_today_heart_rate_v` to read the authenticated user's latest
standalone heart-rate session for their current local day.

Use `user_today_heart_rate_ibi_samples_v` to read that session's IBI graph
data.

## Security Model

- Enable RLS on user-owned tables.
- Client reads should be scoped to `auth.uid()`.
- Tracking writes should go through security-definer RPCs so sessions, derived samples, and `daily_activity` update atomically.
- Subscription and RevenueCat event writes should stay server-side.
- User-scoped convenience views should run with `security_invoker = true` so
  they respect the caller's permissions and RLS context.

## Duplicate Protection

Graph-point tables should reject duplicate offsets per parent session:

- `heart_rate_samples`: unique per `(session_id, offset_ms)`
- `heart_rate_ibi_samples`: unique per `(session_id, offset_ms)`

RPCs should upsert those points on retry rather than inserting duplicates.

## Existing Migration Files

- [20260420000100_create_launch_schema.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260420000100_create_launch_schema.sql)
- [20260420000200_enable_rls.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260420000200_enable_rls.sql)
- [20260420000400_create_session_completion_rpcs.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260420000400_create_session_completion_rpcs.sql)
- [20260422000100_add_breath_hold_hrv_metrics.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260422000100_add_breath_hold_hrv_metrics.sql)
- [20260422000200_add_ibi_samples.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260422000200_add_ibi_samples.sql)
- [20260422000300_add_hrv_metrics_to_heart_rate_sessions.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260422000300_add_hrv_metrics_to_heart_rate_sessions.sql)
- [20260423000100_harden_tracking_schema.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260423000100_harden_tracking_schema.sql)

## App Work In This Phase

- Add Supabase reads/writes to replace hardcoded data.
- Add loading and empty states.
- Add shared client-side caching/query invalidation.
- Save breath-hold sessions, breathing sessions, and standalone HR sessions through RPCs.

## Exit Criteria

- Launch schema migrations exist and are applied.
- Tracking writes persist correctly.
- Static home/profile analytics are replaced with real backend data.
- Raw camera frame data is not stored.
