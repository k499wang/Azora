# Codebase Patterns

This file captures the patterns that already exist in this repository.

It is not an aspirational rewrite plan. It is a guide for extending the current app without inventing new structure unnecessarily.

## Purpose

Use this file when adding new screens, services, hooks, analytics, or backend-backed features.

The goals are:

- keep future code consistent with what is already working
- make ownership boundaries obvious
- reduce one-off architecture decisions
- distinguish stable patterns from scaffolds that are not wired yet

## Layer Map

These are the current layers in the repo and what each one is responsible for.

- `App.tsx`
  - app bootstrap only
  - mounts providers
  - registers top-level side effects like analytics and auth identity sync
  - does not contain route registration or feature logic

- `src/app/navigation/`
  - owns navigation types and navigator setup
  - central source of truth for route names and params

- `src/screens/`
  - screen-level composition
  - wires hooks, navigation, and major page sections
  - should stay lighter than feature hooks and domain logic

- `src/components/`
  - presentational UI and feature UI pieces
  - some container-like flow components exist here when they are primarily UI workflows

- `src/hooks/`
  - orchestration logic
  - combines state, timers, permissions, streaming, and workflow transitions

- `src/lib/`
  - pure or mostly framework-light logic
  - algorithms, calculators, stateful domain engines, and testable utilities

- `src/services/`
  - all external side effects
  - Supabase, auth providers, analytics, subscriptions, persistence boundaries

- `src/queries/`
  - React Query wrappers around backend-backed services
  - query keys, enabled flags, invalidation behavior

- `src/stores/`
  - small app-global client state only
  - currently used for auth session bootstrap and session state

- `src/data/`
  - static product configuration
  - used where data is app-owned rather than backend-owned

- `src/theme/`
  - design tokens and reusable visual primitives

- `docs/`
  - architecture notes, runbooks, and backend plans
  - used to explain complex flows that span multiple layers

## Core Structural Patterns

### 1. Thin Bootstrap Pattern

`App.tsx` is intentionally thin.

What belongs here:

- provider setup
- font loading
- splash screen lifecycle
- top-level analytics bootstrap
- top-level auth identity sync
- screen tracking registration

What does not belong here:

- route declarations
- feature logic
- business rules
- app-flow decisions beyond bootstrapping

Examples:

- `App.tsx`
- `src/app/providers/AppProviders.tsx`

### 2. Root Gate Pattern

The app tree is chosen by a small derived gate, not by imperative navigation after sign-in.

Current flow:

- auth store determines signed in vs signed out
- onboarding query determines whether onboarding is complete
- `useAppGate()` reduces that into:
  - `booting`
  - `signed_out`
  - `needs_onboarding`
  - `ready`
- `RootNavigator` renders the correct tree from that state

Why this pattern matters:

- auth, onboarding, and app access stay centralized
- individual screens do not need to know global app-entry rules
- sign-in does not manually navigate to home or onboarding

Examples:

- `src/hooks/useAppGate.ts`
- `src/app/navigation/RootNavigator.tsx`
- `docs/auth-onboarding-navigation-architecture.md`

### 3. Typed Navigation Pattern

Navigation types live centrally and screens consume explicit prop aliases.

Current pattern:

- route param lists live in `src/app/navigation/types.ts`
- screen prop aliases are exported from the same file
- registered screens use typed screen props
- child components use typed `useNavigation(...)` only when they are not registered screens

Do:

- add every new route to the central param list first
- export a screen prop type alias for real routes
- use typed `navigation.navigate(...)`

Avoid:

- local route type definitions inside screens
- `useNavigation<any>()`
- ad hoc navigation prop shapes

Examples:

- `src/app/navigation/types.ts`
- `src/app/navigation/MainTabs.tsx`
- `src/screens/HeartRateScreen.tsx`

### 4. Screen-As-Composition Pattern

Most screens are composition shells, not business-logic containers.

Common screen behavior:

- pull in safe area insets
- arrange major sections
- wire navigation callbacks
- call feature hooks or stores
- pass data and handlers into components

Examples:

- `src/screens/HomeScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/HeartRateScreen.tsx`

Heavier screens do exist:

- `src/features/exercise/guidedBreathing/GuidedBreathingSessionScreen.tsx`
- `src/features/exercise/dailyBreathHold/DailyBreathHoldScreen.tsx`

These contain more workflow logic today. When extending them, prefer extracting reusable orchestration into hooks or lib functions rather than adding more inline state machines.

### 5. Flow Component Pattern

Some multi-step UI flows live as dedicated components under `components/` rather than `screens/`.

Use this when the flow is mostly a reusable UI workflow and not a navigation boundary.

Examples:

- `src/components/onboarding/OnboardingFlow.tsx`
- `src/components/heartRate/HeartRateCaptureFlow.tsx`

Current shape:

- small prop surface
- parent screen or navigator decides when the flow is shown
- flow component handles internal step transitions

### 6. Slot-Based Layout Component Pattern

Reusable feature scaffolds use explicit slots instead of hidden children magic.

Examples:

- `src/features/exercise/shared/components/ExerciseScaffold.tsx`
- `src/components/common/AppTopBar.tsx`

Why this works well here:

- layout stays reusable
- screens remain explicit about what they render
- variants are easy without deep abstraction

Prefer props like:

- `titleSlot`
- `rightSlot`
- `centerSlot`
- `bottomSlot`

over generic wrapper components that only rename children.

## State Ownership Patterns

### 7. Zustand For Small App-Wide Client State

Zustand is used for event-driven client state that many places need immediately.

Current use:

- auth bootstrap state
- current session
- current user
- auth actions

Keep Zustand for:

- session state
- global UI or device state only if multiple distant screens need it live

Do not use Zustand for:

- backend cached data
- profile records
- streaks
- entitlements
- session history

Example:

- `src/stores/authStore.ts`

### 8. React Query For Backend State

Backend-backed state belongs in React Query wrappers under `src/queries/`.

Current pattern:

- query key helper function
- `enabled` guard when user id is required
- service call in `queryFn`
- mutation invalidates the matching query key

Examples:

- `src/queries/profile/useOnboardingStatusQuery.ts`
- `src/queries/profile/useCompleteOnboardingMutation.ts`

Use this same shape for future:

- profile
- entitlement
- streaks
- daily activity
- tracking summaries

### 9. Hooks As Orchestrators

Hooks own workflows that combine:

- local state
- refs
- timers
- permissions
- service calls
- domain engines

Examples:

- `src/hooks/useAppGate.ts`
- `src/hooks/useLivePulse.ts`
- `src/hooks/useHeartRateCapture.ts`
- `src/hooks/useMeasurementTimer.ts`

Recurring hook shape in this repo:

- state with `useState`
- mutable engine/timer state in refs
- narrow callbacks with `useCallback`
- cleanup in `useEffect`
- expose a focused return object, not a generic state bag

## Domain Logic Patterns

### 10. Pure Domain Utilities In `lib/`

Pure calculation and transformation logic belongs in `src/lib/`.

Examples:

- `src/lib/heartRate/signalProcessing.ts`
- `src/lib/heartRate/captureResult.ts`
- `src/lib/heartRate/sessionPayload.ts`
- `src/lib/hrv.ts`
- `src/lib/lungAge.ts`

These files typically:

- avoid React imports
- avoid direct navigation or storage
- accept plain inputs and return plain outputs
- are the first place tests should be added

### 11. Stateful Domain Engine Pattern

Not all domain logic is pure. Some domain logic is stateful but still belongs outside React.

Example:

- `src/lib/heartRate/heartRateManager.ts`

This is the current pattern for stateful streaming engines:

- encapsulate internal mutable state in a class or small factory
- expose domain-specific methods like `processFrame()` or `reset()`
- keep UI and React lifecycle outside the engine
- let hooks own the engine instance

Use this pattern only when there is real stateful domain behavior, not for generic service-manager objects.

### 12. Native Boundary Pattern

Native camera/plugin behavior is hidden behind a narrow JS boundary.

Current path:

- native frame processors in `native/ios/` and iOS project files
- JS bridge in `src/lib/heartRate/heartRatePlugin.ts`
- hooks consume the bridge and domain engine

Why this matters:

- native details stay isolated
- Android support later has a cleaner seam
- UI code does not know about plugin internals

## Service Patterns

### 13. Services Wrap External Systems

`src/services/` is the boundary to external systems.

Current service groups:

- `services/supabase/`
- `services/analytics/`
- `services/profile/`
- `services/subscriptions/`
- `services/tracking/`
- `services/streaks/`

Service rules visible in the repo:

- services call SDKs, APIs, or storage
- screens should not talk directly to Supabase if a service boundary exists
- types are defined close to the service when they describe backend responses

### 14. Supabase Client Access Pattern

Supabase access goes through a shared client boundary.

Current pattern:

- `requireSupabaseClient()` for code that cannot proceed without Supabase
- `getSupabaseClient()` for optional bootstrapping paths
- auth helpers in `services/supabase/auth.ts`
- auth identity sync in `services/supabase/authIdentitySync*.ts`

Examples:

- `src/services/supabase/client.ts`
- `src/services/supabase/auth.ts`
- `src/services/supabase/authIdentitySyncCore.ts`

### 15. Service Core + Platform Wrapper Pattern

For complex third-party integrations, the repo is already moving toward a testable core plus thin SDK wrapper.

Example:

- `src/services/subscriptions/revenueCatClientCore.ts`
- `src/services/subscriptions/revenueCatClient.ts`

Why this pattern is good:

- core logic can be tested without the native SDK
- identity rules stay explicit
- platform-specific SDK details remain thin

Prefer this pattern for future integrations that have:

- identity state
- sequencing
- retries
- side-effect ordering

### 16. Scaffolded Service Pattern

Some services are intentionally scaffolded with the correct interface but not yet wired.

Examples:

- `src/services/profile/profileService.ts`
- `src/services/subscriptions/entitlementService.ts`
- `src/services/streaks/streakService.ts`
- `src/services/tracking/breathHoldService.ts`

Current scaffold style:

- define the input/output types now
- call `requireSupabaseClient()` so the dependency boundary is explicit
- throw a descriptive error describing the intended database object or RPC

This is acceptable for planned backend areas, but new production behavior should not stop at the scaffold stage.

### 17. Small Barrel Export Pattern

Some folders expose a small barrel when it improves discoverability without hiding ownership.

Examples:

- `src/app/navigation/index.ts`
- `src/services/supabase/index.ts`
- `src/services/tracking/index.ts`
- `src/theme/index.ts`

Current rule of thumb visible in the repo:

- use barrels for stable folder entry points
- keep them shallow
- do not use barrels to hide a confusing module structure

### 18. Explicit Error Boundary Pattern

The repo prefers explicit errors over silent fallback when a boundary is required.

Examples:

- `requireSupabaseClient()` throws when config is missing
- scaffolded services throw descriptive "not wired yet" errors
- analytics capture uses `captureException(...)` with contextual properties

Prefer:

- clear failure messages that describe the missing contract
- narrow `try/catch` around interaction boundaries
- structured error context for analytics

over swallowing errors or returning ambiguous defaults.

## Analytics Patterns

### 19. Centralized Event Name Pattern

Event names are centralized in one constants file.

Example:

- `src/services/analytics/events.ts`

Rules already present:

- snake_case event names
- stable names, not UI copy
- shared naming across features

### 20. Analytics Helper Pattern

Some analytics calls are wrapped in helpers when they represent common or cross-cutting events.

Examples:

- `trackAppOpened()`
- `trackScreenView(...)`
- `trackProfileAction(...)`

Example file:

- `src/services/analytics/tracking.ts`

Current mixed state:

- some events already use helpers
- many feature events are still captured inline with `usePostHog()`

Preferred direction:

- keep major shared events in helpers
- inline capture is still acceptable for very local feature-specific actions

### 21. Event Family Pattern

Menu-like surfaces use one event plus an `action` property instead of a different event name for every tap.

Current example:

- `profile_action`
  - `action: "notifications_opened"`
  - `action: "sign_out_confirmed"`
  - etc.

This keeps schema size under control and makes querying easier.

### 22. Identity Sync Pattern

Supabase auth is the source of truth for identity across systems.

Current synced systems:

- Supabase auth
- PostHog
- RevenueCat identity

Current flow:

- read auth session
- dedupe repeated identity events
- ensure profile row exists
- identify PostHog
- sync RevenueCat user
- on sign-out, reset PostHog and clear app-side RevenueCat identity

Examples:

- `src/services/supabase/authIdentitySyncCore.ts`
- `src/services/analytics/identity.ts`
- `src/services/subscriptions/revenueCatClientCore.ts`

## UI And Styling Patterns

### 23. Theme Token Pattern

Colors, spacing, typography, padding, margin, and card treatments are centralized.

Examples:

- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/typography.ts`
- `src/theme/card.ts`

Current usage pattern:

- screens and components import tokens directly
- layout spacing usually comes from `spacing`, `padding`, and `margin`
- text styles are composed from `typography`

Prefer:

- `padding.screen.horizontal`
- `spacing.md`
- `typography.title.title3`

over repeating magic numbers.

### 24. StyleSheet-At-Bottom Pattern

Almost every component and screen uses `StyleSheet.create(...)` at the bottom of the file.

Why this is the repo norm:

- readable scanning
- easier token reuse
- consistent React Native style organization

### 25. Small Common Primitive Pattern

Shared UI primitives are kept small and explicit.

Examples:

- `src/components/common/AppTopBar.tsx`
- `src/components/common/SectionHeader.tsx`
- `src/components/common/Pill.tsx`
- `src/components/common/icons/Icon.tsx`

Avoid turning these into over-configurable design-system meta-components unless repeated pressure justifies it.

### 26. Static Content Near The Feature Pattern

Small product-owned content lives close to the feature or under `src/data/`.

Examples:

- breathing techniques in `src/features/exercise/guidedBreathing/techniques.ts`
- screen-local arrays and display constants inside screen files

Use `src/data/` when:

- the content is reused across multiple screens
- it is configuration-like

Keep it local when:

- it is only for one screen
- moving it out would make the code harder to read

## Testing Patterns

### 27. Node Test Pattern For Domain And Core Services

Current tests use Node's built-in test runner for non-UI logic.

Examples:

- `src/lib/heartRate/measurementTimer.test.mjs`
- `src/lib/heartRate/heartRateManager.test.mjs`
- `src/lib/heartRate/signalProcessing.test.mjs`
- `src/services/supabase/authIdentitySync.test.mjs`
- `src/services/subscriptions/revenueCatClientCore.test.mjs`

Recurring pattern:

- test pure or framework-light logic
- inject fake clocks or fake dependencies where needed
- keep platform SDKs out of the tests when possible

### 28. Dependency Injection For Testability

Several testable modules accept dependencies instead of reaching directly into globals.

Examples:

- `createMeasurementTimer(...)`
- `createRevenueCatClient(...)`
- `registerAuthIdentitySync(dependencies)`

This is a strong pattern worth reusing for:

- side-effect sequencing
- timers
- analytics wrappers
- subscription state machines

## Documentation Patterns

### 29. Architecture Note Pattern

Complex cross-cutting behavior gets a focused markdown document.

Examples:

- `docs/auth-onboarding-navigation-architecture.md`
- `docs/heartrate/architecture.md`
- `docs/analytics/current-posthog-events.md`
- `docs/architecture/*`
- `docs/heartrate/*`
- `docs/revenuecat-supabase-paywall-guide.md`

Use this when a feature spans:

- app flow
- backend model
- analytics
- native bridges
- multiple services

## Naming Patterns

Current naming conventions in the repo:

- components and screens: PascalCase
- hooks: `useX`
- service helpers: verb-first, e.g. `getCurrentSession`, `completeOnboarding`, `ensureUserProfile`
- query key helpers: `getXQueryKey`
- analytics events: snake_case
- analytics properties: snake_case
- theme tokens: semantic names, not hex or one-off meaning

## Patterns To Preserve

These are the highest-value patterns in the current codebase:

- one thin bootstrap file
- central typed navigation
- root-gated auth/onboarding flow
- hooks for orchestration
- `lib/` for domain logic
- services for external boundaries
- React Query for backend state
- centralized analytics event names
- theme tokens instead of scattered magic values
- core logic extracted from SDK wrappers when integration complexity grows

## Patterns To Avoid

Avoid introducing these unless there is a very strong reason:

- direct SDK calls from many screens when a service boundary already exists
- route param types defined ad hoc in screens
- backend data copied into Zustand
- broad `utils.ts` helpers with mixed responsibilities
- generic manager objects without real domain state
- screen files that mix layout, timers, analytics, permissions, and algorithm code without extraction
- local one-off event naming that bypasses `AnalyticsEvent`
- hard-coded spacing or colors when theme tokens already fit

## Stable Patterns Vs Evolving Areas

These areas are stable enough to copy:

- app bootstrap
- navigation typing
- auth gate
- analytics identity sync
- heart-rate hook + lib split
- React Query onboarding pattern

These areas are still evolving:

- subscriptions and entitlement reads
- profile and tracking services beyond onboarding bootstrap
- some analytics helpers versus inline capture balance
- heavier workflow screens that still own more logic than ideal

When working in an evolving area, prefer extending the existing direction instead of locking in a new competing pattern.

## Recommended Decision Checklist

Before adding new code, ask:

1. Is this screen only composing sections, or am I hiding feature logic in it?
2. Should this logic live in a hook, a service, or `lib/` instead?
3. Is the data local client state, backend state, or pure domain logic?
4. Does a current file already show the pattern I should copy?
5. Am I adding a real abstraction, or just moving code around?
6. If this talks to an SDK or backend, should it go behind `services/`?
7. If this is backend-backed UI state, should it be a React Query hook?
8. If this is analytics, does it need a new event, or does it belong in an event family?

## Good Templates To Copy

When adding similar functionality, start from one of these:

- copyable starters:
  - `docs/templates/README.md`
  - `docs/templates/`

- app-level gate or bootstrap:
  - `App.tsx`
  - `src/hooks/useAppGate.ts`

- new route or screen:
  - `src/app/navigation/types.ts`
  - `src/screens/HomeScreen.tsx`

- new backend-backed query:
  - `src/queries/profile/useOnboardingStatusQuery.ts`
  - `src/queries/profile/useCompleteOnboardingMutation.ts`

- new side-effect service:
  - `src/services/profile/onboardingStatusService.ts`
  - `src/services/profile/profileBootstrapService.ts`

- new testable integration core:
  - `src/services/subscriptions/revenueCatClientCore.ts`

- new domain logic module:
  - `src/lib/heartRate/measurementTimer.ts`
  - `src/lib/heartRate/signalProcessing.ts`

## Summary

The codebase already has a real structure:

- thin bootstrap
- typed navigation
- root-level auth gating
- hooks for workflows
- `lib/` for domain logic
- services for side effects
- React Query for backend state
- theme tokens for styling
- docs for cross-cutting architecture

Future consistency should come from copying and tightening these patterns, not from layering a second architecture on top of them.
