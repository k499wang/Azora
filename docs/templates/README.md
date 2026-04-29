# Templates

These templates are copyable starters for the patterns this repo already uses.

They are intentionally small. The goal is to help you start from the current architecture, not to generate a full feature automatically.

## Available Templates

- [screen-template.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/templates/screen-template.md:1)
  - for new registered screens or composition-heavy screens
- [onboarding-screen-template.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/templates/onboarding-screen-template.md:1)
  - for new post-login onboarding steps inside `src/components/onboarding/`
- [query-hook-template.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/templates/query-hook-template.md:1)
  - for new React Query hooks around backend-backed services
- [service-template.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/templates/service-template.md:1)
  - for new Supabase-backed service modules
- [testable-core-wrapper-template.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/templates/testable-core-wrapper-template.md:1)
  - for integrations that should have a testable core plus a thin SDK wrapper

## How To Use Them

1. Copy the closest template into the real target folder.
2. Rename placeholder types and functions before adding behavior.
3. Keep the final file smaller than the template if the real feature is simple.
4. Check [patterns.md](/Users/k3vinwvng/Documents/Azora/Azora/patterns.md:1) if you are unsure where logic belongs.

## Real File References

Each template was derived from current repo code:

- screen:
  - `src/screens/HomeScreen.tsx`
  - `src/screens/ProfileScreen.tsx`
  - `src/screens/HeartRateScreen.tsx`
- onboarding screen:
  - `src/components/onboarding/OnboardingFlow.tsx`
- query hook:
  - `src/queries/profile/useOnboardingStatusQuery.ts`
  - `src/queries/profile/useCompleteOnboardingMutation.ts`
- service:
  - `src/services/profile/onboardingStatusService.ts`
  - `src/services/profile/profileBootstrapService.ts`
- testable core wrapper:
  - `src/services/subscriptions/revenueCatClientCore.ts`
  - `src/services/subscriptions/revenueCatClient.ts`
  - `src/services/subscriptions/revenueCatClientCore.test.mjs`
