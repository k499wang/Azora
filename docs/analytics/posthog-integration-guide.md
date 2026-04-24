# PostHog Integration Guide

This guide explains how to add PostHog product analytics to this app in a way that matches the current codebase structure and keeps the integration easy to extend later.

The goals are:

- understand which features people use most
- see where users drop off in the main flows
- keep analytics code out of presentational UI
- keep event names stable and boring
- avoid collecting more health data than necessary

This guide is written for the current repo layout, not a future refactor.

## Why PostHog For This App

For this codebase, PostHog is the simplest good fit because:

- it works well in Expo / React Native projects
- it gives product analytics first, which is what this app needs now
- it can later add feature flags and session replay without replacing the analytics layer
- it fits well behind a small service boundary

That means we can start small:

- screen views
- feature usage
- funnel events

and expand later without rewriting the app.

## What We Are Trying To Learn

Before adding analytics, decide what questions the data should answer.

For this app, the first useful questions are:

- which screens are visited most
- how many users open the heart-rate flow
- how many users actually start a measurement
- how many complete it successfully
- where users drop in the heart-rate flow
- which breathing techniques people start most
- which breathing techniques people actually finish
- how many users turn on live heart-rate during exercises

If an event does not help answer one of those questions, do not add it in v1.

## Principles For This Repo

Follow these boundaries:

- `src/services/analytics/`
  - PostHog SDK setup
  - one app-facing analytics API
  - no screen logic

- `src/hooks/`
  - screen tracking hook
  - opt-in / consent hook later if needed

- `src/screens/` and feature hooks
  - call analytics at flow boundaries
  - do not initialize SDKs here

- `src/components/`
  - avoid direct PostHog imports
  - UI components should usually stay analytics-free unless the component is clearly container-like

This matches the repo's existing rule:

- UI stays in components
- orchestration stays in hooks
- external side effects stay behind a narrow boundary

## Recommended File Structure

Add analytics in this shape:

```text
src/
  services/
    analytics/
      client.ts
      events.ts
      properties.ts
      track.ts
      index.ts
  hooks/
    useScreenTracking.ts
```

Recommended responsibilities:

- `client.ts`
  - initialize PostHog
  - hold singleton client access
  - expose `identify`, `reset`, and low-level `capture`

- `events.ts`
  - all event names as constants
  - no inline string event names throughout the app

- `properties.ts`
  - typed event property shapes
  - small reusable property helpers if needed

- `track.ts`
  - app-facing wrappers like `trackEvent()` and `trackScreenView()`
  - no UI imports

- `index.ts`
  - clean exports

- `useScreenTracking.ts`
  - navigation-integrated screen tracking

This gives a small, explicit boundary and makes a later vendor swap possible.

## Step 1: Create A PostHog Account

1. Go to `https://posthog.com/`
2. Create an account
3. Create a new project for this mobile app
4. In the project settings, find:
   - `Project API Key`
   - `Host`

You will need both.

Usually:

- cloud host is something like `https://us.i.posthog.com` or your region-specific host
- the API key is the project key, not a personal secret

Still, do not hardcode either in UI files.

## Step 2: Decide How Config Enters The App

This app currently uses `app.json`.

The cleanest long-term setup is:

- move app config to `app.config.ts`
- read PostHog values from environment variables
- expose them through Expo `extra`

Recommended env vars:

- `EXPO_PUBLIC_POSTHOG_KEY`
- `EXPO_PUBLIC_POSTHOG_HOST`

If you want the simplest path first, you can use Expo public env vars directly.

Recommended shape:

```text
EXPO_PUBLIC_POSTHOG_KEY=...
EXPO_PUBLIC_POSTHOG_HOST=...
```

Then the analytics service reads them in one place only.

Do not read env vars all over screens and hooks.

## Step 3: Install PostHog

Follow the current PostHog React Native / Expo docs when you do the actual install.

The implementation goal in this repo is:

- one SDK install
- one app bootstrap
- one service boundary

Not:

- direct `posthog.capture(...)` calls all over the codebase

## Step 4: Initialize Once At App Bootstrap

The app bootstrap is currently in:

- `App.tsx`

That file should stay thin.

Recommended bootstrap responsibilities:

- initialize analytics once
- mount `NavigationContainer`
- attach screen tracking hooks

Do not put feature event definitions in `App.tsx`.

Recommended flow:

```text
App.tsx
  -> initialize analytics client once
  -> NavigationContainer
  -> RootNavigator
```

## Step 5: Track Screens Centrally

This app already has a clean navigation setup:

- `src/app/navigation/types.ts`
- `src/app/navigation/MainTabs.tsx`
- `src/app/navigation/RootNavigator.tsx`

That means screen tracking should be centralized at the navigation layer instead of hand-written in every screen.

Recommended tracked screens:

- `Home`
- `HeartRate`
- `ExerciseSession`
- `DailyExercise`
- `DailyResult`
- `Profile`

Use one event name for all screen views:

- `screen_view`

Recommended properties:

- `screen_name`
- `route_name`
- `source` if needed later

Example:

```ts
trackScreenView({
  screen_name: 'HeartRate',
  route_name: 'HeartRate',
});
```

## Step 6: Define Events Before Writing Code

Do not invent event names ad hoc during implementation.

Create them once in `src/services/analytics/events.ts`.

Recommended v1 event list:

### Navigation

- `screen_view`

### Heart-rate measurement flow

- `heart_rate_flow_opened`
- `heart_rate_setup_advanced`
- `heart_rate_permission_prompted`
- `heart_rate_permission_result`
- `heart_rate_camera_check_started`
- `heart_rate_measure_started`
- `heart_rate_measure_completed`
- `heart_rate_measure_failed`
- `heart_rate_measure_cancelled`
- `heart_rate_result_retry_tapped`
- `heart_rate_result_done_tapped`

### Exercise flow

- `exercise_technique_selected`
- `exercise_session_started`
- `exercise_session_paused`
- `exercise_session_resumed`
- `exercise_session_completed`
- `exercise_session_abandoned`
- `exercise_live_hr_toggled`

### Daily hold flow

- `daily_hold_started`
- `daily_hold_released`
- `daily_result_viewed`

That is enough for a useful first dashboard.

It is already plenty. Do not go wider in v1.

## Step 7: Recommended Properties For Each Event

Keep properties small, typed, and useful.

### Global properties to allow

- `screen_name`
- `context`
- `duration_ms`
- `success`
- `error_code`
- `permission`
- `granted`

### Heart-rate flow properties

- `context`
  - from `HeartRateScreen` route params if present
- `capture_state`
- `finger_placement`
- `hrv_available`
- `failure_reason`

### Exercise flow properties

- `technique_id`
- `technique_name`
- `category`
- `rounds_total`
- `elapsed_seconds`
- `live_hr_enabled`

### Daily hold properties

- `hold_seconds`

## Step 8: What Not To Send

This app touches heart-rate and HRV data, so be conservative.

Do not send in v1:

- raw BPM time series
- raw `RMSSD`
- raw `SDNN`
- raw `pNN50`
- full beat interval arrays
- raw camera signal quality values
- anything that could be treated like detailed health telemetry unless you truly need it

Better alternatives:

- `hrv_available: true | false`
- `measurement_completed: true | false`
- `measurement_quality: 'poor' | 'fair' | 'good' | 'excellent'`
- `result_error_code`

This still gives useful product analytics without overcollecting.

## Step 9: Where To Instrument In This Repo

### Screen views

Central navigation tracking:

- `App.tsx`
- new `useScreenTracking.ts`

### Heart-rate flow

The best orchestration points are:

- `src/screens/HeartRateScreen.tsx`
  - flow opened
  - flow cancelled from screen level if needed

- `src/components/heartRate/HeartRateCaptureFlow.tsx`
  - setup progression
  - retry tapped
  - done tapped

- `src/hooks/useHeartRateCapture.ts`
  - permission prompt result
  - camera check entered
  - measurement started
  - measurement completed
  - measurement failed

That is the right place because it already owns the capture state machine.

### Exercise flow

Instrument here:

- `src/components/home/BreathingLibrary.tsx`
  - `exercise_technique_selected`

- `src/screens/ExerciseSessionPage.tsx`
  - `exercise_session_started`
  - `exercise_session_paused`
  - `exercise_session_resumed`
  - `exercise_session_completed`
  - `exercise_session_abandoned`
  - `exercise_live_hr_toggled`

### Daily hold flow

Instrument here:

- `src/screens/DailyExercisePage.tsx`
  - `daily_hold_started`
  - `daily_hold_released`

- `src/screens/ShareableResultScreen.tsx`
  - `daily_result_viewed`

## Step 10: Event Definitions To Start With

Use typed wrappers, not arbitrary objects.

Example shape:

```ts
export const AnalyticsEvent = {
  ScreenView: 'screen_view',
  HeartRateFlowOpened: 'heart_rate_flow_opened',
  HeartRateMeasureStarted: 'heart_rate_measure_started',
  HeartRateMeasureCompleted: 'heart_rate_measure_completed',
  HeartRateMeasureFailed: 'heart_rate_measure_failed',
  ExerciseTechniqueSelected: 'exercise_technique_selected',
  ExerciseSessionStarted: 'exercise_session_started',
  ExerciseSessionCompleted: 'exercise_session_completed',
} as const;
```

Then pair them with typed properties:

```ts
export interface HeartRateMeasureCompletedProps {
  context?: string;
  hrv_available: boolean;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
}
```

This keeps the analytics layer readable and searchable.

## Step 11: Suggested v1 Funnels

Once events are coming in, build these dashboards first.

### Funnel 1: Heart-rate measurement

```text
heart_rate_flow_opened
  -> heart_rate_measure_started
  -> heart_rate_measure_completed
```

This tells you whether users are just peeking at the feature or actually finishing it.

### Funnel 2: Exercise engagement

```text
exercise_technique_selected
  -> exercise_session_started
  -> exercise_session_completed
```

This tells you whether the technique library is actually leading to completed sessions.

### Funnel 3: Daily hold flow

```text
daily_hold_started
  -> daily_hold_released
  -> daily_result_viewed
```

## Step 12: Good Naming Rules

Use event names that are:

- lowercase
- snake_case
- feature-first
- stable over time

Good:

- `heart_rate_measure_started`
- `exercise_session_completed`

Bad:

- `button_clicked`
- `measure_done`
- `heartRateFinish2`

The rule is:

- event name = business action
- properties = context about that action

## Step 13: Privacy And Consent

Before shipping analytics broadly, decide:

- whether analytics is on by default
- whether users can opt out
- whether health-adjacent properties are sent at all

Recommended first pass:

- no raw HRV values
- no raw BPM values
- no signal arrays
- add an app setting later to disable analytics

If you later add auth, you can associate users after explicit identity exists.

Do not force identity in v1.

Anonymous usage analytics is enough to start.

## Step 14: Future-Proofing

This setup should scale to:

- feature flags
- session replay
- experiment assignment
- user identification after auth
- server-side event enrichment later

That is why the analytics service boundary matters.

If every screen imports PostHog directly, future changes become annoying.

If everything goes through `src/services/analytics/`, future changes stay local.

## Recommended Implementation Order

Build in this order:

1. Create PostHog account and project
2. Add env/config handling
3. Install SDK
4. Add `src/services/analytics/`
5. Initialize analytics in `App.tsx`
6. Add centralized screen tracking
7. Add heart-rate flow events
8. Add exercise flow events
9. Add daily hold events
10. Verify events in PostHog live event stream
11. Build first dashboards

This keeps risk low and avoids trying to instrument everything at once.

## Recommended v1 Scope

If you want the highest-value version without overbuilding it, ship only:

- `screen_view`
- `heart_rate_flow_opened`
- `heart_rate_measure_started`
- `heart_rate_measure_completed`
- `heart_rate_measure_failed`
- `exercise_technique_selected`
- `exercise_session_started`
- `exercise_session_completed`
- `daily_hold_started`
- `daily_result_viewed`

That is enough to answer the main product questions.

## What I Would Do In This Repo

If implementing this in code, I would:

1. add `src/services/analytics/`
2. initialize PostHog once in `App.tsx`
3. add navigation screen tracking
4. instrument `useHeartRateCapture.ts`
5. instrument `ExerciseSessionPage.tsx`
6. instrument `DailyExercisePage.tsx`
7. keep UI components mostly analytics-free

That follows the repo's current architecture and keeps the integration simple.

## Final Rule

The simplest reliable analytics architecture for this app is:

- one SDK
- one service boundary
- one screen tracking hook
- a small, typed list of events
- no raw health telemetry in v1

That is the right starting point.
