# PostHog Analytics

## Why PostHog

Product analytics + feature flags + session replay in one SDK, works cleanly in Expo RN, lets us start with events and add A/B testing later without switching vendors.

## Where the code lives

- `src/config/posthog.ts` — client setup, reads key from `Constants.expoConfig.extra.posthogProjectToken`.
- `src/services/analytics/events.ts` — every event name as a typed enum. **Single source of truth.**
- `src/services/analytics/identity.ts` — `bootstrapAnalytics()`, `onUserSignedIn()`, `onUserSignedOut()`.
- `src/services/analytics/tracking.ts` — screen view + app-opened helpers (called from `App.tsx`).
- `src/services/analytics/errorTracking.ts` — `captureException(error, context)` wrapper.

## Adding a new event

1. Add the name to `AnalyticsEvent` in `events.ts`.
2. `usePostHog()` in the component, then `posthog.capture(AnalyticsEvent.MyEvent, { ...props })`.
3. Never inline event name strings. Never pass `undefined` in properties — use `null`.

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

## Super properties

`bootstrapAnalytics()` registers `app_version`, `platform`, `os_version` on every event automatically. Don't repeat them in `capture()` calls.

## Health data

Don't send raw IBI samples, full HRV series, or anything that could re-identify a user. Aggregates only (`bpm_avg`, `rmssd`, `session_duration_s`).
