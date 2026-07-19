# AGENTS.md

This file defines how AI coding agents should work in this repository.

The goal is simple:
- keep the codebase easy to extend
- keep abstractions small and justified
- keep patterns consistent across the app
- avoid cleverness that makes future changes slower

This project is a React Native + Expo mobile app with TypeScript, custom heart-rate logic, and planned Android support.

## Core Rules

1. Inspect before editing. Do not invent architecture that conflicts with the current repo.
2. Prefer small, boring, composable changes over sweeping rewrites.
3. Keep UI, domain logic, and side effects separate.
4. Every abstraction must remove duplication, reduce coupling, or clarify intent. If it does none of those, do not add it.
5. Do not introduce new patterns when an existing good pattern already works.
6. Optimize for future maintainers reading the code quickly.

## Default Architecture

Use these boundaries consistently:

- `screens/`
  - screen-level composition only
  - wire navigation, feature sections, and page layout
  - do not place heavy business logic here

- `components/`
  - presentational and feature UI
  - prefer small components with explicit props
  - avoid data fetching or navigation logic unless the component is clearly container-like

- `hooks/`
  - orchestration and reusable React behavior
  - combine state, lifecycle, timers, permissions, and feature flows
  - hooks may call services and domain logic, but should not become dumping grounds

- `lib/`
  - pure domain logic and framework-light utilities
  - heart-rate processing, calculations, transforms, validation helpers
  - this is the first place to put code that should be easy to test

- `theme/`
  - design tokens and reusable visual primitives only
  - no feature-specific styling constants here

- `data/`
  - static app content and seed-like config
  - if data becomes user-owned or server-driven later, move it behind a service boundary

- `services/` if added
  - all external side effects
  - Supabase, subscriptions, analytics, storage, remote config, native adapters

## Preferred Direction

As the app grows, move toward feature-first organization without forcing a big-bang refactor.

Target shape:

```text
src/
  app/
  features/
    home/
    exercise/
    heart-rate/
    profile/
  shared/
    ui/
    theme/
    lib/
    types/
  services/
```

When touching existing code, prefer moving it gradually toward this shape only when the change is already justified. Do not churn unrelated files just to satisfy folder purity.

Until that migration is real, prefer the current repo layout over speculative rearranging. Put new code in the most local, obvious existing home first, and only promote or move code when reuse or ownership boundaries are clear.

## Abstraction Rules

Good abstractions in this repo:
- pure calculators
- typed mappers and adapters
- reusable hooks for repeated app behavior
- small UI primitives with stable props
- service wrappers around external APIs

Bad abstractions in this repo:
- generic helpers with vague names like `utils.ts`
- wrapper components that only rename props
- hooks that hide simple local state for no reason
- base classes or inheritance-heavy patterns
- “manager” objects unless they own real state transitions or domain rules

Before adding an abstraction, ask:
- Is this used in at least two places, or clearly about to be?
- Does this create a clearer boundary?
- Will this make testing easier?
- Is the name specific enough that a new developer understands it immediately?

If the answer is mostly no, keep the code inline and simple.

## React Native Patterns

- Prefer function components and typed props.
- Keep components small. Split when a file mixes layout, business logic, and side effects.
- Prefer explicit props over hidden context.
- Derive state instead of duplicating it.
- Avoid premature memoization. Only add memoization for measured rerender or identity problems.
- Keep effects narrow and purposeful. If an effect manages a workflow, consider a custom hook.
- Avoid `any`. Especially avoid `useNavigation<any>()`.
- Use typed route params and central navigation types.

## Navigation Rules

- Navigation types live in `src/app/navigation/types.ts`.
- Navigators live in `src/app/navigation/`.
- `App.tsx` should stay a thin bootstrap file and should not own route registration logic.
- All new route names and params must be added to the central param lists before wiring screens.
- Every screen must use an explicit screen prop type from `src/app/navigation/types.ts` or the `src/app/navigation` barrel export.
- Prefer typed screen props for screens and typed `useNavigation(...)` only for nested child components that are not registered screens.

When adding a new screen:

1. Add the route and params to `MainTabParamList` or `RootStackParamList`.
2. Add a screen prop alias if the screen is a real route.
3. Register the screen in `MainTabs.tsx` or `RootNavigator.tsx`.
4. Type the screen function with the matching prop alias.
5. Update any child components that navigate to it using the correct typed navigation prop.

Preferred patterns:
- Registered screen:
  - `function DailyResultScreen({ navigation, route }: DailyResultScreenProps) {}`
- Child component inside a tab screen:
  - `const navigation = useNavigation<MainTabNavigationProp<'Home'>>();`

Avoid:
- manual `navigation?: { ... }` prop shapes
- local route-param type definitions inside screens when the route already exists centrally
- `useNavigation<any>()`

## State Rules

- Keep state as local as possible.
- Only introduce global state when multiple distant screens truly share live state.
- Server data, subscriptions, auth, and persistence should live behind service boundaries.
- Domain logic must not depend on React components.
- Prefer pure functions for transforms and calculations.

## Styling Rules

- Reuse `theme` tokens for colors, spacing, typography, and card treatments.
- Do not scatter magic numbers through screens unless they are truly local layout values.
- Prefer a small set of reusable visual patterns over one-off styling inventions.
- Keep styling readable. If a style block gets too large, split the component.

## Platform Rules

- iOS-first is fine, but new code must avoid hard-coding iOS assumptions when possible.
- Any native capability should have a JS/TS boundary that can be swapped or adapted for Android later.
- Keep platform-specific behavior isolated in adapters or `*.ios.*` / `*.android.*` files when needed.
- Do not spread camera, permission, or native implementation details across many components.

## Testing Rules

Prioritize tests for:
- pure domain logic
- timers and state machines
- data transforms
- feature flows with non-trivial behavior

Do not chase shallow snapshot coverage.

When changing logic:
- add or update tests near the affected domain code when practical
- run the existing test suite
- mention any coverage gaps in the final summary

## Change Workflow For Agents

When asked to make changes:

1. Inspect the relevant files first.
2. Explain the intended approach briefly.
3. Make the smallest change that improves the code.
4. Preserve working behavior unless the user requested behavior changes.
5. Update docs when the architecture or workflow changes materially.
6. Run tests or the closest available verification step.

## Session Workflow Preferences

Use these as default collaboration preferences when the active coding agent supports them:

- Prefer planning before large edits. For complex changes, enter plan mode first and lay out the approach before writing code.
- Break large requests into steps. When possible, do the first meaningful step, verify it, then continue.
- Use high-effort reasoning for ambiguous or high-risk tasks.
- End important sessions with a short `Summary of learnings` paragraph so future sessions can recover context quickly.
- If the tool supports isolated branches or rewindable turns, prefer branching for risky explorations and rewinding instead of stacking messy follow-up fixes.
- Let the agent fix its own mistakes after verification failures so it can preserve an accurate working model of the repo.
- Prefer direct file references when giving instructions. If a path is known, point to it explicitly instead of making the agent search.
- For repetitive workflows, prefer turning the instructions into a reusable skill or repo-local guide instead of restating them each session.
- Keep context narrow and relevant. Load only the files and details needed for the current task.
- For especially sensitive areas like auth, billing, subscriptions, and analytics identity, rely on repo-local guidance files before making changes.

## Repo-Specific Guidance

- Keep heart-rate signal processing logic in domain-oriented files, not inside screens.
- Keep camera/native plugin access behind a narrow boundary.
- Keep static breathing techniques simple until there is a real need for user-authored or backend-driven techniques.
- Guided breathing, daily breath hold, and their shared session primitives live under `src/features/exercise/`; follow `docs/architecture/exercise-sessions.md` before changing their behavior or ownership boundaries.
- Backend work should preserve the documented Supabase data model and Android portability goals in `docs/backend-plan/`.
- In the current layout, feature-specific UI can stay under `src/components/<feature>/`, shared primitives belong in `src/components/common/`, and pure heart-rate logic belongs in `src/lib/heartRate/`.

## What Agents Should Avoid

- large refactors without a clear payoff
- mixing styling, navigation, timers, and business logic in one file
- introducing a new dependency without strong justification
- replacing explicit code with generic frameworks or meta-abstractions
- touching unrelated files for style-only cleanup
- silently changing product behavior while “refactoring”

## Definition Of Done

A change is done when:
- the code follows existing repo patterns or improves them clearly
- abstractions are justified and named well
- types remain strong
- behavior is verified
- the next developer can understand the change quickly

Manage your context like it's water on the desert. There's an exponential correlation between the quality of Claude's responses and exclusivity of the data you feed into the context. Most immediate example: verbose and noisy tasks should be handled by subagents.

Split the work across two different sessions: Designer and coder. Designer should handle the architecture and have the bigger picture, coder should work on the single files and handle all the context-bloating tasks.
