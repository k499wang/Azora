# Query Cache Invalidation Map

Single source of truth for **which React Query caches each mutation must invalidate**. Keep this in sync whenever you add a mutation, add a query, or change what a query reads.

## Why this exists

The most common bug pattern with TanStack Query (and the one AI tools repeatedly miss) is: a mutation writes to the DB correctly, but the screens that display the affected data keep showing stale cached values because the mutation forgot to invalidate every query that reads any of the fields it touched.

**The fix is mechanical**: enumerate every query that reads a field the mutation writes, and invalidate them all in `onSuccess`. This file makes that enumeration explicit so it can be verified.

---

## Query → backing data

| Query key fn | File | Reads from | Notes |
|---|---|---|---|
| `getProfileSummaryQueryKey` | `src/queries/profile/useProfileSummaryQuery.ts` | `profiles` (display_name, avatar_url, timezone), `breath_hold_sessions`, `breathing_sessions` and `breath_hold_sessions` via the `profile_lifetime_totals()` RPC, `daily_activity` (activity_date, qualifies_for_streak), `user_streaks_v` | Aggregate. Touched by anything that changes profile fields, breath holds, or daily activity rows (which HR captures and breath holds both write). |
| `getProfileQueryKey` | `src/queries/profile/useProfileQuery.ts` | `profiles` | Raw profile row. |
| `getOnboardingStatusQueryKey` | `src/queries/profile/useOnboardingStatusQuery.ts` | `profiles.onboarding_completed_at` | |
| `getUserDefaultTechniqueQueryKey` | `src/queries/profile/useUserDefaultTechniqueQuery.ts` | `profiles.default_technique_id` | |
| `getHomeStatsQueryKey` / `getHomeStatsQueryKeyPrefix` | `src/queries/tracking/useHomeStatsQuery.ts` | `daily_activity`, `breath_hold_sessions`, `heart_rate_sessions`, `heart_rate_ibi_samples`, `user_streaks_v` | Mixed selected-date plus global Home aggregate. Active queries are keyed by selected `localDate`, but completion mutations invalidate the user prefix because Home also shows streaks, recent heart-rate data, stress history, 28-day activity, and today's IBI data. |
| `getDailyFeatureUsageQueryKey` | `src/queries/subscriptions/useDailyFeatureUsageQuery.ts` | `daily_activity` for `localDate` | Per-day key. |
| `getHeartRateStatsQueryKey` | `src/queries/tracking/useHeartRateStatsQuery.ts` | `heart_rate_sessions`, `heart_rate_samples`, `heart_rate_ibi_samples` | Heart-tab aggregate and chart data. |
| `getHeartRateSessionDetailQueryKey` | `src/queries/tracking/useHeartRateSessionDetailQuery.ts` | `heart_rate_sessions[id]` | Per-session key. |
| `getUserEntitlementQueryKey` | `src/queries/subscriptions/useUserEntitlementQuery.ts` | Entitlement service (RevenueCat + Supabase) | |
| `getNotificationPreferencesQueryKey` | `src/queries/notifications/useNotificationPreferencesQuery.ts` | Notification preferences | |
| `getDailyPlanScheduleQueryKey` | `src/queries/dailyPlan/useDailyPlanScheduleQuery.ts` | `user_preferences.daily_plan_schedule` | Device-local display times; independent of notifications. |
| `getDailyPlanExercisesQueryKey` | `src/queries/dailyPlan/useDailyPlanExercisesQuery.ts` | `user_preferences.daily_plan_exercises` | Caches `DailyPlanExercisesReadResult` (`available`, `missing`, `invalid_v1`, `invalid_v2`, or `unsupported`); successful mutations seed `available` before exact invalidation. |
| `getCompletedBreathingTechniqueIdsQueryKey` | `src/queries/tracking/useCompletedBreathingTechniqueIdsQuery.ts` | Completed `breathing_sessions.technique_id` values for one user and local date | Drives independent completion state for the two guided cards in Today’s Dailies. |
| `getCurrentRoomQueryKey` | `src/queries/room/useCurrentRoomQuery.ts` | `rooms` (highest floor) plus its `room_decorations` rows, and the user's `max(earned_local_date)` across every floor | The room drawn on Home and filled on the Decorate screen. `room` is `null` until the user places their first object, which lazily opens floor 1. `lastEarnedLocalDate` is user-scoped, not room-scoped — it is what stops a rollover from granting a second object the same day. |
| `getRoomsQueryKey` | `src/queries/room/useRoomsQuery.ts` | every `rooms` row for the user plus all their `room_decorations` | The hotel. Any write that adds a decoration or a floor changes it. |
| `getDayHistoryQueryKey` / `getDayHistoryQueryKeyPrefix` | `src/queries/history/useDayHistoryQuery.ts` | `breath_hold_sessions`, `heart_rate_sessions`, `breathing_sessions`, `room_decorations` — all for one local date | One day of the History screen. Per-day key, but completion mutations invalidate the user prefix: a session finished just after midnight writes a different date than the one on screen. |
| `getDailyActivityRangeQueryKey` / `getDailyActivityRangeQueryKeyPrefix` | `src/queries/tracking/useDailyActivityRangeQuery.ts` | `daily_activity` (last *n* days) | Feeds the completed-day dots on the History date strip. Keyed by day count, so mutations invalidate the user prefix. |
| `getTechniqueFeedbackQueryKey` | `src/queries/tracking/useTechniqueFeedbackQuery.ts` | `technique_feedback` for the user | "Did this feel helpful?" answers, one per session (`session_key`). Read by the results screen so an answer given for this session survives a re-render; intended to feed technique recommendation. |

---

## Mutation → required invalidations

When adding a mutation, find every field it writes, then look up every query above that reads those fields. Add an invalidation for each. **Per-day keys must be invalidated with the same `localDate` that was written.**

| Mutation | Writes to | Must invalidate |
|---|---|---|
| `useSaveOnboardingProfileMutation` | `profiles` (display_name, onboarding_goal, age, gender, daily_minutes, default_technique_id, stress_level, sleep_quality, agreement_responses, experience_level) | `SavedOnboardingProfile`, `UserDefaultTechnique`, `ProfileQuery`, `ProfileSummary` (uses `setQueryData`, then invalidates server-backed profile queries) |
| `useCompleteOnboardingMutation` | `profiles.onboarding_completed_at` | `OnboardingStatus`, `UserDefaultTechnique`, `ProfileQuery`, `ProfileSummary` |
| `useUpdateProfileDisplayNameMutation` | `profiles.display_name` | `ProfileQuery`, `ProfileSummary` (uses `setQueryData`, then invalidates both) |
| `useUploadProfileAvatarMutation` | `profiles.avatar_url` | `ProfileQuery`, `ProfileSummary` (uses `setQueryData`, then invalidates both) |
| `useCompleteBreathHoldMutation` | `breath_hold_sessions`, `daily_activity` for `localDate` | `HomeStats` user prefix, `DayHistory` user prefix, `DailyActivityRange` user prefix, `DailyFeatureUsage(userId, localDate)`, `ProfileSummary` |
| `useCompleteBreathingSessionMutation` | `breathing_sessions`, `daily_activity` for `localDate` | `HomeStats` user prefix, `DayHistory` user prefix, `DailyActivityRange` user prefix, `DailyFeatureUsage(userId, localDate)`, `ProfileSummary`, exact `CompletedBreathingTechniqueIds(userId, localDate)` |
| `useCompleteHeartRateSessionMutation` | `heart_rate_sessions`, `heart_rate_samples`, `heart_rate_ibi_samples`, `daily_activity` for `usageDate` | `HomeStats` user prefix, `DayHistory` user prefix, `DailyActivityRange` user prefix, `HeartRateStats`, `DailyFeatureUsage(userId, usageDate)`, `ProfileSummary` |
| `useUpdateNotificationPreferencesMutation` | notification preferences | `NotificationPreferences` |
| `useUpdateDailyPlanScheduleMutation` | `user_preferences.daily_plan_schedule` | `DailyPlanSchedule` (uses `setQueryData`, then exact invalidation) |
| `useUpdateDailyPlanExercisesMutation` | `user_preferences.daily_plan_exercises` | `DailyPlanExercises` (uses `setQueryData`, then exact invalidation) |
| `useSaveOnboardingSurveyMutation` | `profiles.acquisition_source` | Nothing — no query reads this column; it exists for analysis only. |
| `usePlaceDecorationMutation` | `room_decorations` (including `earned_local_date`), and `rooms` on the first placement (opens floor 1) | `CurrentRoom` (canonical `setQueryData`; no refetch), exact `Rooms(userId)` and `DayHistory` user prefix invalidated in the background |
| `useCreateNextRoomMutation` | `rooms` (opens floor *n+1* with the chosen `shell` and `frame_hue`) | `CurrentRoom` (canonical `setQueryData`; no refetch), exact `Rooms(userId)` invalidated in the background |
| `useSaveTechniqueFeedbackMutation` | `technique_feedback` (upsert on `user_id,session_key`) | exact `TechniqueFeedback(userId)`. Add `UserDefaultTechnique` / `RecommendedTechnique` here once helpfulness feeds recommendation. |

---

## Rules of thumb

1. **`ProfileSummary` is the big one.** It aggregates `profiles`, `breath_hold_sessions`, `breathing_sessions`, `daily_activity`, and `user_streaks_v`. Almost any user-data write invalidates it.
2. **`setQueryData` counts as invalidation** *only* if you update every field a consumer reads. If you mutate one field and leave others stale, prefer `invalidateQueries`.
3. **Per-day keys** (`DailyFeatureUsage`) include `localDate` — invalidate the exact date you wrote to, not "today" (timezone math has bitten us; use the same formatter the mutation already uses).
4. **HomeStats is intentionally broader.** It is keyed by selected date, but it reads shared Home aggregates too. Use `getHomeStatsQueryKeyPrefix(userId)` for completion mutations unless the query is split into narrower caches.
5. **Don't invalidate a query you didn't change.** Over-invalidation causes re-fetch storms and flicker. The map is the source of truth: if a row isn't in this file, don't invalidate it speculatively.
6. **If you add a query**, add a row to "Query → backing data" *and* update every mutation in "Mutation → required invalidations" that writes any of those fields. Both directions must stay in sync.

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
| 2026-07-19 | Heart-rate mutation documentation omitted the `heart_rate_samples` write and `HeartRateStats` invalidation already present in code. | Updated both sides of the cache map. |
