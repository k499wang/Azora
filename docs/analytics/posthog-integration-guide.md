# PostHog Analytics

## Why PostHog

Product analytics + feature flags + session replay in one SDK, works cleanly in Expo RN, lets us start with events and add A/B testing later without switching vendors.

## Where the code lives

- `src/config/posthog.ts` — client setup, reads key from `Constants.expoConfig.extra.posthogProjectToken`.
- `src/services/analytics/events.ts` — every event name as a typed enum. **Single source of truth.** Also documents the property-naming convention.
- `src/services/analytics/identity.ts` — `bootstrapAnalytics()`, `onUserSignedIn()`, `onUserSignedOut()`.
- `src/services/analytics/appSession.ts` — `registerAppSessionTracking()` — wires `AppState` + AsyncStorage to fire `app_foregrounded` and `session_ended`.
- `src/services/analytics/tracking.ts` — `trackAppOpened`, `trackScreenView` (called from `App.tsx`).
- `src/services/analytics/errorTracking.ts` — `captureException(error, context)` wrapper.

## Adding a new event

1. Add the name to `AnalyticsEvent` in `events.ts`.
2. `usePostHog()` in the component, then `posthog.capture(AnalyticsEvent.MyEvent, { ...props })`.
3. Never inline event name strings. Never pass `undefined` in properties — use `null`.

## Property naming

- PostHog reserves keys prefixed with `$` (e.g. `$screen_name`, `$feature/*`). Don't collide with them.
- Use `app_*` prefix only when an app-defined key would otherwise shadow a PostHog reserved key (e.g. we use `app_screen_name` in screen-view events).
- Otherwise: plain `snake_case`.
- Always `null` for missing values, never `undefined`.

## Reporting errors

```ts
import { captureException } from '../services/analytics/errorTracking';

captureException(error, { flow: 'exercise_session', action: 'toggle_heart_rate' });
```

Wraps `posthog.captureException` — stack frames are formatted correctly by the SDK.

## Supabase auth wiring

Every user must have a Supabase account. Wire auth state changes once (e.g. in a root provider):

```ts
import { onUserSignedIn, onUserSignedOut } from './services/analytics/identity';

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    onUserSignedIn({
      id: session.user.id,
      email: session.user.email,
      authProvider: session.user.app_metadata?.provider,
    });
  }
  if (event === 'SIGNED_OUT') onUserSignedOut();
});
```

`onUserSignedIn` calls `posthog.identify(user.id, ...)` with `email` + `auth_provider` on `$set` and `signup_date` on `$set_once`. `onUserSignedOut` calls `posthog.reset()`.

No `alias()` — because every user signs in, there's no anonymous history worth stitching.

## Super properties

`bootstrapAnalytics()` registers `app_version`, `platform`, `os_version` on every event automatically. Don't repeat them in `capture()` calls.

## Session & retention tracking

`registerAppSessionTracking()` is called once from `App.tsx` and wires two events via `AppState`:

- **`app_foregrounded`** — fires on cold start and on every return from background. Carries:
  - `days_since_last_open` (number, or `null` on very first open)
  - `is_returning_d1` / `is_returning_d7` / `is_returning_d30` (booleans)

  One-click D1/D7/D30 retention in PostHog — no funnel needed. Booleans are there because PostHog dashboards filter booleans trivially; the raw number is kept for custom binning.

- **`session_ended`** — fires when the app goes to background. Carries:
  - `foreground_seconds` — duration of that foreground session.

  Pair with `app_foregrounded` to get average session length. `posthog.flush()` is called in the same handler so the event isn't lost if iOS suspends the process.

Note: a foreground session here means time between active and background transitions, **not** a PostHog session window or an exercise session.

## Health data

Don't send raw IBI samples, full HRV series, or anything that could re-identify a user. Aggregates only (`bpm_avg`, `rmssd`, `session_duration_s`).

## Event catalog (current)

Lifecycle
- `app_opened` — cold start only.
- `app_foregrounded` — cold start + resume from background.
- `session_ended` — background transition.
- `screen_view` — every navigation change (dedup'd on route name). Carries `app_screen_name` + route-specific context.

Daily plan / breath hold
- `daily_plan_started` — user taps the home daily card.
- `daily_breath_hold_started` / `daily_breath_hold_released` / `daily_results_viewed`.

Breathing exercise sessions
- `breathing_technique_selected` — user picks a technique from the library.
- `exercise_session_started` / `exercise_session_paused` / `exercise_session_completed`.
- `exercise_session_abandoned` — includes `abandoned_at_phase`, `abandoned_at_round`, `elapsed_seconds`, `target_seconds`, `completion_rate`. Tells you where drop-off happens, not just that it happened.

Recently logged (home)
- `recently_logged_viewed` — fired once per Home mount after `useHomeStatsQuery` finishes loading. Carries `item_count` and `has_error`.
- `recently_logged_session_opened` — user taps a recent heart-rate card. Carries `session_id`, `position` (0-indexed), and `item_count`.

Heart rate
- `heart_rate_monitoring_toggled` — in-session HR toggle.
- `heart_rate_capture_started` / `heart_rate_capture_completed` / `heart_rate_capture_failed`.
- `heart_rate_result_action` — unified action event on the result screen. Carries `action: 'retry' | 'done' | 'cancel'` and `previous_result: 'success' | 'failure'`. Replaces the old per-button events.
