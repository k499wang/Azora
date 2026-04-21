# Backend Plan Overview

## Product Decisions

- Login is required before tracking anything.
- Supabase stores accounts, profiles, breath-hold data, breathing sessions, standalone heart-rate sessions, derived heart-rate samples, streak data, preferences, and subscription state.
- Cloud sync is included for all signed-in users.
- Streaks start as daily breath-hold only, but the data model stays extensible for future multi-action streak logic.
- iOS ships first. Android comes later.
- RevenueCat manages subscriptions.
- Pricing:
  - Weekly: $7.99/week
  - Annual: $59.99/year
- Both weekly and annual ship at launch.
- Only the annual plan includes a free trial.
- Tracking requires network connectivity. Offline tracking is not planned.
- V1 must ship with a complete paywall, not a placeholder.
- Built-in breathing techniques stay in `src/data/techniques.ts` for v1.
- Heart-rate samples are stored as individual rows of derived BPM points, not raw camera/PPG frames.
- Social features are deferred.
- Gamification tables are deferred until the gamification phase.

## Goals

1. Add authenticated user accounts.
2. Persist meaningful user tracking data in Supabase.
3. Calculate streaks reliably.
4. Store detailed derived heart-rate data.
5. Add RevenueCat subscriptions and a full V1 paywall.
6. Define free vs paid boundaries cleanly.
7. Add safe gamification later.
8. Keep the system flexible for Android and future social features.

## Shared Principles

- Session completion writes must be atomic through Postgres RPCs.
- Streak state is derived from `daily_activity`.
- Raw camera signal data is never stored in Supabase.
- Pro-only surfaces can upsell, but cloud sync remains free.
- Avoid medical-style claims around lung age and health score.

## Launch Scope

Free:

- Login
- Cloud sync
- Daily breath-hold tracking
- Basic streak
- Basic history
- Basic breathing exercises
- Basic heart-rate result

Pro:

- Weekly and annual subscriptions
- Full paywall implementation
- Full history
- Advanced analytics
- Premium techniques
- Custom breathing patterns

Deferred:

- Android
- Social
- Public leaderboards
- Complex coaching
- Gamification tables and logic
- User-authored technique library in DB

## Document Map

- [Phase 1: Auth Foundation](phase-1-auth-foundation.md)
- [Phase 2: Data Persistence](phase-2-data-persistence.md)
- [Phase 3: Streaks](phase-3-streaks.md)
- [Phase 4: RevenueCat and Paywall](phase-4-revenuecat-paywall.md)
- [Phase 5: Freemium Gates](phase-5-freemium-gates.md)
- [Phase 6: Gamification](phase-6-gamification.md)
- [Phase 7: Android](phase-7-android.md)
- [Phase 8: Social](phase-8-social.md)

## Open Decisions

- Length of the annual free trial.
- Whether custom breathing patterns are Pro from day one.
- Whether Wim Hof is free with safety guidance or Pro with stronger onboarding.
- Whether lung age should ship immediately or wait for a stronger scoring model.
- Whether Pro should lean first into analytics, more content, or personalized coaching.
- Whether future social features should be friends-only, groups, or public profiles.
