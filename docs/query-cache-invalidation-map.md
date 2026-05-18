# Query Cache Invalidation Map

Single source of truth for **which React Query caches each mutation must invalidate**. Keep this in sync whenever you add a mutation, add a query, or change what a query reads.

## Why this exists

The most common bug pattern with TanStack Query (and the one AI tools repeatedly miss) is: a mutation writes to the DB correctly, but the screens that display the affected data keep showing stale cached values because the mutation forgot to invalidate every query that reads any of the fields it touched.

**The fix is mechanical**: enumerate every query that reads a field the mutation writes, and invalidate them all in `onSuccess`. This file makes that enumeration explicit so it can be verified.

---

## Query → backing data

| Query key fn | File | Reads from | Notes |
|---|---|---|---|
| `getProfileSummaryQueryKey` | `src/queries/profile/useProfileSummaryQuery.ts` | `profiles` (display_name, avatar_url, timezone), `breath_hold_sessions`, `daily_activity` (activity_date, qualifies_for_streak), `user_streaks_v` | Aggregate. Touched by anything that changes profile fields, breath holds, or daily activity rows (which HR captures and breath holds both write). |
| `getProfileQueryKey` | `src/queries/profile/useProfileQuery.ts` | `profiles` | Raw profile row. |
| `getOnboardingStatusQueryKey` | `src/queries/profile/useOnboardingStatusQuery.ts` | `profiles.onboarding_completed_at` | |
| `getUserDefaultTechniqueQueryKey` | `src/queries/profile/useUserDefaultTechniqueQuery.ts` | `profiles.default_technique_id` | |
| `getHomeStatsQueryKey` | `src/queries/tracking/useHomeStatsQuery.ts` | `daily_activity` for `localDate` | Per-day key — invalidate with the date that was written. |
| `getDailyFeatureUsageQueryKey` | `src/queries/subscriptions/useDailyFeatureUsageQuery.ts` | `daily_activity` for `localDate` | Per-day key. |
| `getHeartRateSessionDetailQueryKey` | `src/queries/tracking/useHeartRateSessionDetailQuery.ts` | `heart_rate_sessions[id]` | Per-session key. |
| `getUserEntitlementQueryKey` | `src/queries/subscriptions/useUserEntitlementQuery.ts` | Entitlement service (RevenueCat + Supabase) | |
| `getNotificationPreferencesQueryKey` | `src/queries/notifications/useNotificationPreferencesQuery.ts` | Notification preferences | |

---

## Mutation → required invalidations

When adding a mutation, find every field it writes, then look up every query above that reads those fields. Add an invalidation for each. **Per-day keys must be invalidated with the same `localDate` that was written.**

| Mutation | Writes to | Must invalidate |
|---|---|---|
| `useCompleteOnboardingMutation` | `profiles` (display_name, onboarding_*, age, gender, daily_minutes, default_technique_id, stress_level, sleep_quality, agreement_responses, experience_level) | `OnboardingStatus`, `UserDefaultTechnique`, `ProfileSummary` |
| `useUpdateProfileDisplayNameMutation` | `profiles.display_name` | `ProfileSummary` (uses `setQueryData` — equivalent) |
| `useUploadProfileAvatarMutation` | `profiles.avatar_url` | `ProfileSummary` (uses `setQueryData`) |
| `useCompleteBreathHoldMutation` | `breath_hold_sessions`, `daily_activity` for `localDate` | `HomeStats(localDate)`, `DailyFeatureUsage(userId, localDate)`, `ProfileSummary` |
| `useCompleteBreathingSessionMutation` | `breathing_sessions`, `daily_activity` for `localDate` | `HomeStats(localDate)`, `DailyFeatureUsage(userId, localDate)`, `ProfileSummary` |
| `useCompleteHeartRateSessionMutation` | `heart_rate_sessions`, `daily_activity` for `usageDate` | `HomeStats(usageDate)`, `DailyFeatureUsage(userId, usageDate)`, `ProfileSummary` |
| `useUpdateNotificationPreferencesMutation` | notification preferences | `NotificationPreferences` |

---

## Rules of thumb

1. **`ProfileSummary` is the big one.** It aggregates `profiles`, `breath_hold_sessions`, `daily_activity`, and `user_streaks_v`. Almost any user-data write invalidates it.
2. **`setQueryData` counts as invalidation** *only* if you update every field a consumer reads. If you mutate one field and leave others stale, prefer `invalidateQueries`.
3. **Per-day keys** (`HomeStats`, `DailyFeatureUsage`) include `localDate` — invalidate the exact date you wrote to, not "today" (timezone math has bitten us; use the same formatter the mutation already uses).
4. **Don't invalidate a query you didn't change.** Over-invalidation causes re-fetch storms and flicker. The map is the source of truth: if a row isn't in this file, don't invalidate it speculatively.
5. **If you add a query**, add a row to "Query → backing data" *and* update every mutation in "Mutation → required invalidations" that writes any of those fields. Both directions must stay in sync.

---

## How to keep this file accurate

- When you add or change a mutation, update the row in the second table in the same PR. Treat the doc as part of the diff.
- When a screen has a "stale data" bug, the first place to look is this file — find the mutation that just ran, confirm every query reading the affected fields is listed under it, then check the implementation matches.
- Reference this file from `CLAUDE.md` so Claude reads it before writing any new mutation or query.

---

## Audit log

| Date | Finding | Fix |
|---|---|---|
| 2026-05-17 | `useCompleteOnboardingMutation` didn't invalidate `ProfileSummary` → display name saved to DB but HomeScreen/ProfileScreen kept showing email-derived fallback. | Added `ProfileSummary` invalidation. |
| 2026-05-17 | `useCompleteHeartRateSessionMutation` didn't invalidate `ProfileSummary` → streak/activeDays/completedDays didn't reflect HR captures until next cold load. | Added `ProfileSummary` invalidation. |
