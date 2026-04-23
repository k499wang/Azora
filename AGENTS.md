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

## Repo-Specific Guidance

- Keep heart-rate signal processing logic in domain-oriented files, not inside screens.
- Keep camera/native plugin access behind a narrow boundary.
- Keep static breathing techniques simple until there is a real need for user-authored or backend-driven techniques.
- Backend work should preserve the documented Supabase data model and Android portability goals in `docs/backend-plan/`.

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
