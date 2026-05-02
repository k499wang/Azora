# Home and Profile Data Guide

This is a simple map of what the Home and Profile pages fetch from Supabase and where that data is shown.

## RPC Functions

The Home and Profile pages currently do not fetch data with `supabase.rpc(...)`.

They read rows from tables and views with `supabase.from(...).select(...)`.

Existing session-completion RPCs are write paths used when saving completed activity:

- `complete_breath_hold`
- `complete_breathing_session`
- `complete_heart_rate_session`
- `ensure_profile_exists`

The current read pages depend on the rows/views created by those writes.

## Home Page

Main files:

- `src/screens/HomeScreen.tsx`
- `src/queries/tracking/useHomeStatsQuery.ts`
- `src/services/tracking/homeStatsService.ts`

Query hook:

- `useHomeStatsQuery(userId)`
- Query key: `['home-stats', userId]`
- Stale time: 5 minutes

Service:

- `getHomeStats(userId)`

Supabase reads:

| Service helper | Supabase source | Data fetched |
| --- | --- | --- |
| `getStreakSummary` | `user_streaks_v` | `current_streak`, `longest_streak`, `last_qualified_date` |
| `getTodayBreathHoldSummary` | `user_today_breath_hold_v` | latest breath-hold session for today: hold time, BPM, HRV, HR drop |
| `getTodayHeartRateSummary` | `user_today_heart_rate_v` | latest standalone heart-rate session for today: BPM, HRV, HR drop |
| `getDailyActivityRange` | `daily_activity` | last 28 daily activity rows |
| `getTodayBreathHoldIbiSeries` | `user_today_breath_hold_ibi_samples_v` | IBI graph points for today's breath-hold session |

Home component usage:

| Component | Data used |
| --- | --- |
| `AppTopBar` | `streak.currentStreak` |
| `WeekCalendar` | `completedDaysAgo`, derived from `daily_activity.qualifies_for_streak` |
| `DailyPlanCard` | today's breath-hold duration and current streak |
| `SessionStatsPager` | average BPM, hold seconds, health score, IBI graph points |
| `HeartHealthSection` | `rmssd`, `sdnn`, derived stress score, `hrDrop` |
| `EmptyStateCard` | latest heart-rate summary or empty/error message |
| `BreathingLibrary` | local app data, not fetched from Supabase |

Notes:

- Home uses today's breath-hold data first for HRV/BPM when available.
- If there is no breath-hold summary, it falls back to today's standalone heart-rate summary for HRV/BPM.
- The health score is derived in the screen as `100 - stress`.
- `getHomeStats` uses `Promise.allSettled`, so one failed read can show a partial error while still displaying the other loaded data.

## Profile Page

Main files:

- `src/screens/ProfileScreen.tsx`
- `src/queries/profile/useProfileSummaryQuery.ts`
- `src/services/profile/profileSummaryService.ts`

Query hook:

- `useProfileSummaryQuery(userId)`
- Query key: `['profile-summary', userId]`
- Stale time: 10 minutes
- Garbage collection time: 30 minutes

Service:

- `getProfileSummary(userId)`

Supabase reads:

| Supabase source | Data fetched |
| --- | --- |
| `profiles` | `display_name`, `avatar_url`, `timezone` |
| `breath_hold_sessions` | longest hold session by `hold_seconds` |
| `breath_hold_sessions` | total breath-hold session count |
| `daily_activity` | total active-day count |
| `user_streaks_v` | `longest_streak` |
| `daily_activity` | current month's completed days |
| `breath_hold_sessions` | latest 30 breath-hold rows for the trend chart |

Profile component usage:

| Component | Data used |
| --- | --- |
| `ProfileIdentityCard` | display name, avatar URL, fallback initials |
| `ProfileStatsGrid` | longest hold, longest streak, breath-hold count, active days, sparkline trend |
| `ProfileCompletionCalendarCard` | current month's completed day numbers |
| `ProfileBreathHoldTrendCard` | averaged breath-hold trend points |
| `ProfileAccountCard` | auth email from `authStore`, haptics preference from local preference hook |

Profile photo upload:

- File: `src/services/profile/profileAvatarService.ts`
- Uploads the resized image to Supabase Storage bucket `avatars`.
- Updates `profiles.avatar_url` with the public avatar URL.
- The mutation updates the `profile-summary` query cache so the new photo appears immediately.

Notes:

- If `profiles.display_name` is missing, the screen falls back to the user's email prefix.
- The trend chart groups recent breath-hold sessions by local date and averages hold seconds per day.
- Like Home, Profile treats each read independently and returns partial error flags when one fetch fails.
