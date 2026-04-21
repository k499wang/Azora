# Phase 6: Gamification

## Goal

Add safe gamification after the core tracking loop is solid.

## Important Constraint

Do not add gamification schema in the launch migration set. Empty tables rot and lock the design too early.

## What Ships In This Phase

- achievement catalog
- user achievement unlocks
- XP events
- streak milestones
- weekly consistency UI
- optional materialized streak state if needed
- Pro-only gamification like streak freezes and premium badges

## Free Gamification Ideas

- daily breath-hold streak
- weekly consistency ring
- personal best hold time
- first hold badge
- first 3-day streak badge
- first 7-day streak badge
- return-after-miss badge
- daily completion state on the calendar

## Pro Gamification Ideas

- streak freezes
- XP levels
- premium badges
- monthly journeys
- custom goals
- advanced consistency score
- recovery-focused achievements
- unlockable breathing themes
- personalized missions

## Safety Rules

Reward:

- consistency
- controlled practice
- personal improvement

Do not reward:

- extreme breath-hold duration
- pushing past discomfort
- unsafe competition
- public max-hold leaderboards

## Candidate Tables For This Phase

- `achievements`
- `user_achievements`
- `xp_events`
- `streak_freezes`
- optional materialized `user_streaks`

## Exit Criteria

- Gamification reinforces retention without encouraging risky behavior.
- Achievement and XP logic is attached to completed sessions only.
