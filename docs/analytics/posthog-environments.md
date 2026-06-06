# PostHog Environments

Azora uses separate PostHog projects for development-like builds and production builds. The app chooses the project at build time through Expo config.

## Build Profiles

| Build profile | Intended use | PostHog project | `analytics_env` |
| --- | --- | --- | --- |
| `development` | local development client / internal dev testing | Development | `development` |
| `preview` | internal QA builds | Development | `preview` |
| `production` | App Store builds and production TestFlight builds | Production | `production` |

Build commands:

```bash
eas build --profile development --platform ios
eas build --profile preview --platform ios
eas build --profile production --platform ios
```

## How It Works

`eas.json` sets `POSTHOG_PROJECT_TOKEN`, `POSTHOG_HOST`, and `ANALYTICS_ENV` per build profile.

`app.config.js` exposes those values through `expo.extra`:

- `posthogProjectToken`
- `posthogHost`
- `analyticsEnv`

`src/config/posthog.ts` initializes the PostHog React Native client from the configured token and host.

`src/services/analytics/identity.ts` registers `analytics_env` as a PostHog super property, so every event can be filtered by build environment.

## TestFlight

TestFlight does not automatically mean a separate analytics environment. If the build was created with:

```bash
eas build --profile production --platform ios
```

then TestFlight events go to the production PostHog project with `analytics_env = production`.

If beta analytics should stay out of production dashboards, add a separate EAS profile such as `testflight` and point it at the development or staging PostHog project with `ANALYTICS_ENV = testflight`.

## Rules

- Keep event names identical across environments.
- Use separate project tokens, not event name prefixes like `dev_paywall_viewed`.
- Filter dashboards by `analytics_env` when development, preview, and production events might be compared.
- Keep RevenueCat and Supabase environment choices explicit; changing PostHog does not automatically change subscription or backend data destinations.
