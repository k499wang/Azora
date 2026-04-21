# Phase 1: Auth Foundation

## Goal

Ship authenticated onboarding and block all tracking until the user is signed in.

## Requirements

- Use Supabase Auth.
- Support Sign in with Apple.
- Support Sign in with Google.
- Require login before the user can:
  - start a daily breath-hold test
  - start a breathing session
  - measure heart rate
  - view tracked analytics
  - save profile or preferences

Unauthenticated users can still see:

- welcome/onboarding screens
- safety disclaimer
- login screen
- terms/privacy links
- paywall preview if needed

## App Flow

- On launch, check for a Supabase session.
- If no session exists, route to onboarding/auth.
- After login, create `profiles` and `user_preferences` rows if they do not exist.
- Use the Supabase `user_id` as the internal account id.
- Use the same Supabase `user_id` as the RevenueCat app user id.
- Require online connectivity and show a blocking retry state if offline.

## Files Likely To Change

- `App.tsx`
- auth screens/components
- Supabase client setup
- secure session persistence setup

## Exit Criteria

- The app restores a signed-in session on launch.
- Logged-out users cannot reach tracking screens.
- Apple and Google login both work on iOS.
- Profile creation is automatic after login.
