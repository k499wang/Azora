# Localization: German first, additional languages next

Status: proposed architecture and rollout. The app currently has no localization runtime or translated catalogs. This document does not indicate that German support has shipped.

## Architecture

Use `expo-localization` for device locale preferences, `i18next` for translation, fallback and plural rules, and `react-i18next` for reactive React bindings. Install versions compatible with the existing Expo SDK 54; do not upgrade Expo as part of localization.

Keep one initialized translation instance. Bundle catalogs locally so the app works offline and does not call an AI or translation service at runtime. Initialize the selected language before showing app copy. Load a persisted explicit language preference when present; otherwise choose the first supported language in the device's ordered preferences, falling back to English. Observe foreground changes to system preferences while in system mode. Persist only explicit overrides, with a separate `system` option.

Proposed files:

```text
src/localization/
  i18n.ts                 # Instance, resources, configuration
  types.ts                # i18next resource type augmentation
  language.ts             # Pure supported-language resolution rules
  locales/
    en/
      common.json
      settings.json
      onboarding.json
      exercises.json
      lessons.json
      routines.json
      notifications.json
      paywall.json
    de/
      ...                 # Same namespaces and keys
src/services/preferences/languagePreference.ts
docs/localization/translation-guide.md
scripts/check-localization.mjs
```

Create namespaces as real features migrate, rather than empty files. If the lesson catalog becomes unwieldy, split by existing course ownership instead of creating a single giant lesson file.

Use English as the source catalog, semantic keys such as `settings:restorePurchases`, and typed translation calls. Translate complete sentences; interpolate values (`{{name}}`, `{{count}}`) instead of assembling fragments. Use i18next plural forms, not English suffix rules. Keep rich text limited to supported named components or existing lesson emphasis syntax; never interpret arbitrary translated HTML.

Registered screens and components use `useTranslation`. Services resolve text when an operation executes; avoid translating module-level constants once at import time. Pure domain rules should accept localized text or locale explicitly where necessary, keeping React and mutable translation state outside domain calculations.

Do not automatically translate strings inside the shared `Text` component. That cannot reliably distinguish user input, identifiers, dynamic sentences and app copy, and misses alerts, placeholders, native labels and accessibility text.

## Language and region

Initially support `en` and `de`, with German covering Germany, Austria and Switzerland unless regional wording genuinely needs to differ. Language, country, currency and timezone are separate concepts. Never infer billing country or change stored calendar days from the chosen language.

Format visible dates and numbers using `Intl` and the selected locale. Respect explicit language choices in visible formatting. Keep canonical timestamps, local date payloads, database enums and identifiers stable. Prices and billing periods must come from store offering data, retaining store-provided currency formatting.

Offer Settings → Language with `System`, `English` and `Deutsch`. Language changes must update already-mounted screens without resetting navigation, sessions or user data. During migration, German should remain a development preview until the release checklist is complete; English fallback prevents crashes but is not proof of translation completeness.

## Repository-specific boundaries

| Area | Work required |
| --- | --- |
| App startup | Coordinate initialization with the existing startup readiness in `App.tsx`; keep provider wiring in `src/app/providers/AppProviders.tsx`. Include the welcome intro in the localization boundary. |
| Navigation | Translate labels in `src/app/navigation/MainTabs.tsx`; keep route names and central route types unchanged. |
| Screen copy | Extract visible text, button labels, placeholders, accessibility labels, alerts, loading states, empty states and error messages. Keep developer-only labels out of release completeness checks. |
| Lessons | Localize content under `src/features/lessons/domain/lessons/` through stable lesson/block identity. Preserve lesson IDs, block types, ordering, answer IDs and correct-answer references. Verify interactions as well as prose. Review German pagination and emphasis. |
| Exercises | Follow `docs/architecture/exercise-sessions.md`. Translate names, descriptions and phase cues without changing timing, signals or technique IDs. |
| Routines | `src/data/routineLibrary.ts` contains templates that become persisted goals. Resolve translated titles at creation time. Never translate or overwrite an existing user's task or edited title when language changes. |
| Historical intent labels | `src/lib/planProgress.ts` recognizes stored English labels. Preserve historical aliases; prefer stable IDs for new writes. |
| Notifications | Resolve copy in `src/services/notifications/notificationCatalog.ts` at scheduling time. On a language change, replace app-owned pending reminders through the existing scheduler, preserving enabled states, times, identifiers and billing reminder dates. Include the selected locale in any schedule comparison that currently only checks times. |
| Native dialogs | Localize permission strings in native resource configuration, not just JS catalogs. Audit `app.config.js` and the generated/native projects. Native prompts follow OS app-language behavior, which can differ from a JS-only override. A native build is required to validate this. |
| Generated content | `supabase/functions/photo-cleanup-plan/index.ts` generates user-visible text. Pass and validate an allowed output language, defaulting to English for older clients. Preserve schema property names and safety behavior. Existing saved text remains user data. |
| Assets | `assets/audio/voices/theo_*.mp3` and `assets/house-cleaning-checklist.pdf` need localized alternatives or a clearly presented English-content choice. Audit text baked into images and video. |
| External surfaces | Review RevenueCat offering copy, store listings, screenshots, auth emails, support and legal pages separately; catalog translation does not translate these services. |

Do not blindly replace `en-US`: completion mutations and `src/lib/heartRate/sessionPayload.ts` use it with `formatToParts` to construct canonical date payloads. Change display formatting only.

## Implementation sequence

1. Add the runtime, pure locale resolution, persisted preference, startup readiness and type definitions. Add a small English/German namespace pair and prove live switching in Settings and tab labels.
2. Add catalog validation and the translation guide before expanding extraction. Record coverage by feature so a passing key check cannot disguise hard-coded English that was never extracted.
3. Migrate one complete feature at a time: onboarding/auth, Home and routine flows, exercises/results, lessons, profile/history, paywalls and account management. Include every state in each feature, not just its first screen. Preserve English behavior and test after each batch.
4. Localize notifications, native prompts, generated content and assets with their separate verification steps.
5. Review German on devices and enable public German selection and native supported-language declarations only when release coverage is complete.

## Workflow for Claude Code and Codex

Keep translation instructions in the repository so both tools follow the same rules. Once the runtime and conventions exist, add a short localization section to `AGENTS.md` pointing to the translation guide.

The guide should include:

- German voice: friendly informal `du`, calm, concise, supportive, without stronger health claims than English. Use natural German spelling and retain Azora as the brand name. Record agreed translations of recurring domain terms in a glossary.
- Context for ambiguous keys: screen, intent, where the string appears, variables, rich-text syntax, and real layout constraints. Avoid arbitrary character limits for unconstrained text.
- Immutable elements: translation keys, interpolation names, lesson IDs, schema keys, routes, analytics events, entitlement/product IDs and user-authored content.
- One locale and feature per translation batch. The AI reads the English namespace and glossary, edits the target namespace, and runs validation. It should not rewrite behavior to make wording fit.
- English source changes must update translations in the same change or explicitly mark the affected locale incomplete. Keep a source-content fingerprint or review manifest so changed English wording cannot leave an apparently complete but stale translation.
- Use a separate review pass for meaning, tone, terminology and layout; obtain fluent German review before release, especially for consent, health explanations and purchase terms.

Example future task:

> Read docs/localization/translation-guide.md and the glossary. Translate the onboarding namespace from English into German. Preserve all keys, interpolation variables, markup and stable IDs. Use informal du and the existing glossary. Report ambiguity instead of inventing product behavior. Run catalog validation and typecheck, and list screens needing visual review.

## Verification and release criteria

Catalog validation must check missing/extra keys, empty values, interpolation parity and allowed rich-text markers. Account for language-specific plural categories rather than requiring identical plural suffixes for every future language. Flag duplicate JSON keys, which normal JSON parsing silently drops. Source-review tracking must identify stale translations after English changes.

Test language negotiation (including `de-AT`, `de-CH`, ordered device preferences and unsupported languages), persistence, cold start, system mode, rapid switching, storage failure and English fallback. Test representative plural counts and date/number formatting. Add focused regression tests for notifications and any localized content mapping; run the existing suite and typecheck.

Visually review onboarding, tabs, long buttons, errors, paywalls, lesson interactions and keyboard forms on small iPhones, iPads and Android, including large text where supported. Verify umlauts, ß, line wrapping, truncation and screen-reader labels. Confirm no language switch mutates stored answers, user goals, purchase identity or history. When lifecycle ownership changes, follow the repository's repeated release-build cycle checks.

Completion means the audited production surface is translated, assets and external dependencies are accounted for, and native builds are verified. Matching catalog keys alone does not establish whole-app German support.

## References

- [Expo localization guide](https://docs.expo.dev/guides/localization/)
- [Expo localization SDK](https://docs.expo.dev/versions/v54.0.0/sdk/localization/)
- [i18next TypeScript integration](https://www.i18next.com/overview/typescript)
- [i18next plurals](https://www.i18next.com/translation-function/plurals)
