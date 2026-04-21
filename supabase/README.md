# Supabase

This folder contains the launch database migrations for the Azora backend plan.

## Technique Storage Decision

Keep built-in breathing techniques in `src/data/techniques.ts` for v1.

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

The v1 schema stores `breathing_sessions.technique_id` as text and validates it server-side against the launch technique ids.

## Migration Scope

Included in v1 migrations:

- `profiles`
- `user_preferences`
- `breath_hold_sessions`
- `breathing_sessions`
- `heart_rate_sessions`
- `heart_rate_samples`
- `daily_activity`
- `subscriptions`
- `revenuecat_events`
- RLS policies
- `user_streaks_v`
- Session completion RPCs

Deferred intentionally:

- `breathing_techniques`
- `achievements`
- `user_achievements`
- `xp_events`
- `streak_freezes`
- social/friend tables
