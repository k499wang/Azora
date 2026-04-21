# Phase 2: Data Persistence

## Goal

Persist launch tracking data in Supabase and replace hardcoded analytics with real backend reads.

## Scope

Ship only the launch schema:

- `profiles`
- `user_preferences`
- `breath_hold_sessions`
- `breathing_sessions`
- `heart_rate_sessions`
- `heart_rate_samples`
- `daily_activity`
- `subscriptions`
- `revenuecat_events`

Do not ship in this phase:

- `breathing_techniques`
- achievements / XP / streak-freeze tables
- social tables

## Technique Storage

Keep built-in techniques in `src/data/techniques.ts` for v1.

Why:

- small catalog
- no admin flow needed
- no remote content system needed yet

`breathing_sessions.technique_id` stays as text and should be validated server-side against the launch ids.

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

## Security Model

- Enable RLS on user-owned tables.
- Client reads should be scoped to `auth.uid()`.
- Tracking writes should go through security-definer RPCs so sessions, derived samples, and `daily_activity` update atomically.
- Subscription and RevenueCat event writes should stay server-side.

## Existing Migration Files

- [create_launch_schema.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260420000100_create_launch_schema.sql)
- [enable_rls.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260420000200_enable_rls.sql)

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
