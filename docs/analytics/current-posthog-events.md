# Current PostHog Events

This document lists the events currently emitted by the app's PostHog integration.

It is based on the actual `posthog.capture(...)` calls in the codebase.

## Global Events

- `app_opened`
- `screen_view`
- `$exception`

## Heart Rate Capture

- `heart_rate_capture_started`
- `heart_rate_capture_completed`
- `heart_rate_capture_failed`
- `heart_rate_capture_retried`

### Heart Rate Capture Properties

`heart_rate_capture_started`

- `context`

`heart_rate_capture_completed`

- `bpm`
- `confidence`
- `duration_ms`
- `sample_count`
- `rmssd_ms`
- `sdnn_ms`
- `hrv_availability_reason`
- `context`

`heart_rate_capture_failed`

- `error_type`
- `context`

`heart_rate_capture_retried`

- `previous_result`
- `error_type` when the previous result was a failure
- `context`

## Breathing Exercise Discovery

- `breathing_technique_selected`
- `daily_plan_started`

### Breathing Exercise Properties

`breathing_technique_selected`

- `technique_id`
- `technique_name`
- `technique_category`
- `pattern`

`daily_plan_started`

- `streak_days`

## Daily Breath Hold

- `daily_breath_hold_started`
- `daily_breath_hold_released`
- `daily_results_viewed`

### Daily Breath Hold Properties

`daily_breath_hold_released`

- `hold_seconds`
- `best_hold_seconds`

`daily_results_viewed`

- `hold_seconds`
- `best_hold_seconds`

## Exercise Session

- `exercise_session_started`
- `exercise_session_paused`
- `exercise_session_completed`
- `exercise_session_abandoned`
- `heart_rate_monitoring_toggled`

### Exercise Session Properties

`exercise_session_started`

- `technique_id`
- `technique_name`
- `technique_category`
- `total_rounds`
- `hr_monitoring_enabled`

`exercise_session_paused`

- `technique_id`
- `technique_name`
- `round`
- `total_rounds`
- `elapsed_seconds`

`exercise_session_completed`

- `technique_id`
- `technique_name`
- `technique_category`
- `total_rounds`
- `elapsed_seconds`
- `hr_monitoring_enabled`

`exercise_session_abandoned`

- `technique_id`
- `technique_name`
- `round`
- `total_rounds`
- `elapsed_seconds`

`heart_rate_monitoring_toggled`

- `enabled`
- `technique_id`
- `technique_name`

## Automatic PostHog Capture

The app also has provider-level automatic capture enabled for:

- touch events
- app lifecycle events

See:

- [App.tsx](/Users/k3vinwvng/Documents/Azora/Azora/App.tsx)

Screen autocapture is currently disabled, so screen views are only tracked through the manual `screen_view` event.

## Notes

- The app only sends these events when PostHog is configured with a project token and host.
- This list should be updated when new `posthog.capture(...)` calls are added.
- `$exception` is used for caught exceptions in critical flows like heart-rate setup and exercise heart-rate toggling.
