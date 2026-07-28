# Onboarding Attribution Survey — Plan

Goal: learn which channel actually acquired each user — especially the organic
ones AppsFlyer structurally cannot see (podcasts, creators, word of mouth) —
without touching auth, registration, onboarding completion, or paywall gating.

Decisions taken 2026-07-28: **one question only** ("how did you first hear about
Azora?"); typed columns on `profiles` + one `jsonb` for future survey expansion;
incremental write at answer time via a **separate** service function; screen
placed right after `greeting`; **single-select, no free-text follow-up**.

Explicitly cut: the country/region question. PostHog geoip already reports
country on every event (last 90 days: CA 448 users, US 257, GB 59, IN 42, DE 33,
AU 20), so a self-reported one would have cost a step and added almost nothing.

---

## What exists today (verified, do not break)

| Concern | Where | Invariant |
|---|---|---|
| Auth → onboarding → paywall gate | `src/hooks/useAppGate.ts`, `src/hooks/appGateCore.ts` | Untouched. |
| "Has the user completed onboarding?" | `profiles.onboarding_completed_at`, written only by `markOnboardingCompleted` | Untouched. |
| "Can the user resume at the paywall?" | `hasRecoverableOnboardingProfile` (`src/services/profile/onboardingProfileRecovery.ts:6`) — true iff `onboarding_goal` is non-empty | **The new writer must never write `onboarding_goal`.** |
| Registration-complete → Meta | `trackOnboardingRegistrationCompleted()` at `OnboardingFlow.tsx:532` | Untouched; stays on the seal step. |
| Bulk answer write | `saveOnboardingProfile` (`onboardingStatusService.ts:106`), one upsert at the seal, explicitly nulls every field it knows | **Do not add the new fields here** — it would null them on the seal for anyone who answered earlier. |
| RLS | `profiles_insert_own` / `profiles_update_own` (`20260420000200_enable_rls.sql`) | New columns inherit it; no policy work needed. |

The user is always signed in during onboarding, so `userId` is available on
every screen and the incremental write needs no anonymous path.

---

## 1. Migration

`supabase/migrations/20260728000100_add_onboarding_attribution.sql`

```sql
alter table public.profiles
  add column if not exists acquisition_source text,
  add column if not exists acquisition_source_detail text,
  add column if not exists survey_responses jsonb;

alter table public.profiles
  add constraint profiles_acquisition_source_check
    check (acquisition_source is null or acquisition_source in (
      'instagram','tiktok','youtube','facebook','reddit','podcast',
      'app_store_search','google_search','friend_or_family','other','skipped'
    )) not valid;
alter table public.profiles validate constraint profiles_acquisition_source_check;
```

Same `not valid` → `validate` pattern as `20260503000100`, plus `comment on
column` for each, matching repo convention.

Notes:
- `'skipped'` is a real stored value so "asked and declined" is distinguishable
  from "never asked" (`null`, i.e. every pre-existing user). No extra timestamp
  column needed.
- `acquisition_source_detail` ships nullable and **unwritten**. The chosen
  design is single-select only; the column exists so adding the "which
  creator/podcast?" follow-up later — the thing that actually identifies a
  compounding content partnership — is a code change, not a migration.
- `survey_responses jsonb` is the home for the ~12 questions in
  `docs/onboarding-expansion-plan.md` that don't deserve their own column.
  Unused by this change beyond being created.

## 2. Service layer

New file `src/services/profile/onboardingSurveyService.ts` (not added to
`onboardingStatusService.ts`, which is the seal-time all-or-nothing writer):

```ts
export type AcquisitionSource = 'instagram' | ... | 'skipped';

export interface OnboardingSurveyAnswers {
  acquisitionSource?: AcquisitionSource;
}

export async function saveOnboardingSurveyAnswers(
  userId: string,
  answers: OnboardingSurveyAnswers,
): Promise<void>;
```

Implementation: `profiles.upsert({ user_id, ...only the supplied keys },
{ onConflict: 'user_id' })`. PostgREST's upsert only updates supplied columns,
so this cannot clobber `onboarding_goal`, `onboarding_completed_at`, or any
assessment field. Keys absent from `answers` are omitted, not set to `null`.

Read path: extend `getSavedOnboardingProfile`'s select list and
`SavedOnboardingProfile` so a resuming user sees their previous answers
pre-selected. `hasRecoverableOnboardingProfile` is **not** changed — a user who
answered only the survey and quit still restarts at step 1, which is correct.

## 3. Query layer

`src/queries/profile/useSaveOnboardingSurveyMutation.ts` — mirrors
`useSaveOnboardingProfileMutation` but narrower: on success, merge the answers
into the cached `getSavedOnboardingProfileQueryKey(userId)` entry (no
`setQueryData` for profile/summary/technique — none of them read these fields).

Failure policy: **fire-and-forget with a logged warning, never blocking**. The
survey is telemetry, not a prerequisite; a Supabase hiccup must not strand a
user mid-onboarding. PostHog still receives the answer regardless.

`docs/query-cache-invalidation-map.md` gets the new mutation row in the same
change (CLAUDE.md requirement).

## 4. Screens

One new step `'acquisitionSource'` in `src/components/onboarding/types.ts`,
inserted into `STEP_ORDER` (`OnboardingFlow.tsx:111`) directly after
`'greeting'`.

`AcquisitionSourceScreen.tsx` follows `GenderScreen.tsx` exactly: `OnboardingScreenLayout` +
`OnboardingPrimaryButton`, option cards with `Haptics.selectionAsync()` gated on
`isHapticsEnabled()`, `onSkip` wired, theme tokens only.

Option data in `src/components/onboarding/data/acquisitionOptions.ts`
(alongside `genderOptions.ts`).

**Channel — "How did you first hear about Azora?"** (single-select, 10 options,
each with an `IconName` and accent, ordered by expected volume):
Instagram · TikTok · YouTube · Facebook · Reddit · A podcast · Searched the App
Store · Google search · A friend or family member · Somewhere else.

Ten cards will scroll on smaller devices — confirm `OnboardingScreenLayout`'s
content area scrolls before finalizing the count; trim to 8 if not.

The selection handler calls the mutation immediately (no Continue press
required to persist) and also fires the analytics below.

## 5. Analytics

- New `AnalyticsEvent.OnboardingAttributionAnswered` in
  `src/services/analytics/events.ts`, captured from
  `src/services/analytics/onboarding.ts` with `acquisition_source` plus the
  standard `stepProperties`.
- **The payoff:** `$set` of `acquisition_source` as a person property, so every
  existing funnel — onboarding drop-off, trial start, and the
  5-sessions-in-7-days activation north star — can be broken down by channel
  with no new instrumentation.
  Placed beside the capture call, per the events convention in `docs/attribution.md`.
- **No new AppsFlyer event.** `af_complete_registration` stays the only app-side
  AppsFlyer event; adding one here would muddy the Meta mapping.

## 6. Non-goals

- No change to `hasRecoverableOnboardingProfile`, `computeAppGate`, the paywall,
  ATT timing, or `af_complete_registration`.
- No self-reported channel in `saveOnboardingProfile`.
- No free-text input (deferred by decision; column reserved).
- No backfill for existing users — `null` means "never asked" and that's the
  honest value.

## 7. Verification

- `npx tsc --noEmit` and `npm test`.
- Manual: fresh account → answer the question → kill the app before the seal →
  confirm the row has `acquisition_source`, `onboarding_goal` is still null, and
  the next launch restarts onboarding at step 1 (unchanged behavior).
- Manual: complete onboarding through the paywall → confirm the seal's
  `saveOnboardingProfile` upsert did **not** null `acquisition_source`.
- PostHog: confirm the event lands and the person property is set.
