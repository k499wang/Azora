# Phase 3: Streaks

## Goal

Ship a reliable streak system based on the daily breath-hold test, while keeping the model extensible for future multi-action streaks.

## Launch Rule

A user earns one streak day when they complete at least one daily breath-hold test for their local date.

Do not count:

- partial starts
- abandoned sessions
- heart-rate captures alone
- breathing sessions alone

## Core Tables

- `daily_activity`
- `user_streaks_v`

`daily_activity` is the source of truth. `user_streaks_v` is derived from it.

## Why This Model

The launch streak rule is simple:

```text
qualifies_for_streak = daily_breath_hold_completed
```

But the schema allows future rule changes like:

- breath hold + breathing session
- any 2 of 3 daily actions
- user-configured streak goals

## Atomic Writes

Completed breath-hold writes must:

1. create the session row
2. insert derived BPM samples
3. upsert `daily_activity`
4. mark `daily_breath_hold_completed = true`
5. mark `qualifies_for_streak = true`

This happens inside one RPC.

## Edge Cases

Handle:

- timezone changes
- near-midnight sessions
- multiple devices
- deleted breath-hold sessions

Writes stamp `daily_activity.activity_date` using the session's local
timezone at write-time. `user_streaks_v` reads `profiles.timezone` only to
compute "today" for the current-streak calculation — it does not re-derive
historical local dates from session rows.

## Existing Migration Files

- [20260420000300_create_streak_view.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260420000300_create_streak_view.sql)
- [20260420000400_create_session_completion_rpcs.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260420000400_create_session_completion_rpcs.sql)
- [20260422000100_add_breath_hold_hrv_metrics.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260422000100_add_breath_hold_hrv_metrics.sql) — re-defines `complete_breath_hold` to also persist derived HRV metrics inside the same atomic write.
- [20260423000100_harden_tracking_schema.sql](/Users/k3vinwvng/Documents/Azora/Azora/supabase/migrations/20260423000100_harden_tracking_schema.sql) — adds `breathing_technique_catalog` validation and forces `security_invoker` on user-scoped views (including `user_streaks_v`).

## App Work In This Phase

- Replace hardcoded streak UI with backend streak data.
- Update the calendar/home surfaces to reflect actual completion state.
- Read streak values from `user_streaks_v`.

## Exit Criteria

- Streak increments only after a completed daily breath hold.
- Streak values survive app restarts and multiple devices.
- No separate mutable `user_streaks` table is required in v1.
