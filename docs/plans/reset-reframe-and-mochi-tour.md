# Reset Reframe + Mochi Tour — Plan

Consolidates a round of tester feedback into decided direction and open work.
Decisions here are settled unless explicitly revisited.

---

## Decided

### 1. Full reframe: breathing → reset
The product's visible promise is **a reset**, not breathing. Breathing becomes
implementation detail, not pitch.

- **The noun is "Reset."** "Today's reset", "start your reset", "3 resets this week".
- **Banned words in user-facing copy: "breathwork", "exercise".**
  Swept 2026-08-25 across 21 files — zero "breathwork" left in `src/`, and every
  user-facing "exercise" string now reads "reset". Internal names deliberately
  untouched: analytics event values, the `daily_plan_exercises` DB column,
  `FeatureKey.DailyExercise`, `mode: 'exercise'` flags, `src/features/exercise/`
  folder names, and dev-facing error strings. Old "exercise" search aliases kept
  in `exerciseSearch.ts` (users still type them) with "reset" aliases added.
- **"Azora Protocol" is the name of the daily breath hold**, decided 2026-08-25 —
  not an umbrella term. Trademarks stick to concrete rituals, not abstractions
  ("the Wim Hof Method", "Whoop Strain"): the daily breath hold is the one
  proprietary, once-a-day, said-out-loud thing in the app, so it hosts the mark.
  The name is "The Azora Protocol", article included, in titles and sentences
  alike. The article drops only where a possessive or quantifier makes it
  ungrammatical ("your progress on The Azora Protocol"). The search filter chip
  stays the bare "Protocol".

  Replaced five inconsistent names: "Daily Breathhold", "Daily Breath Hold",
  "Azora's Breathhold Exercise", "Start Breath Hold", "breath-hold check-in".
  Old search aliases kept, "azora protocol"/"protocol" added.

  **Open:** the umbrella concept and the top intensity tier both used to be called
  "Azora Protocol" and now need different words — or the umbrella gets dropped.

  **Kept as mechanism language** (instruction and scoring explanations, not
  branding): "hold" wording in `AzoraScoreInfoDialog`, `TodayInsights`,
  `BPMChart`, `bpmInsight`, `DiagnosisScreen`, `paywallPlanHighlights`, and the
  "Stop/End breath hold" controls during the act itself.

**Consequence:** the Yaduveer direction is dropped. That plan (AI daily check-in,
a ten-technique pranayama library with English names, Yaduveer as on-screen coach via
video demos and voiceovers) committed to breathing technique as the *visible* content,
which contradicts a full reframe. `docs/yaduveer-changes.md` deleted 2026-08-25 with
none of its five phases started. Recoverable from git commit `0893ff7` if revisited.

The one piece already shipped independently is the `bhastrika` technique
(`techniqueCatalog.ts:29`, "Bellows Breath") — that stays; it predates the plan and
is wired into the daily plan pool and its tests.

### 2. Selection model — Duolingo's three questions
Duolingo asks what / why / how much, in that order, before any content. Copy the
structure and the naming mechanism.

| Duolingo | Azora |
|---|---|
| Which language | **What you're resetting** — stress / sleep / focus / energy |
| Why are you learning | **Why now** — personalizes nudge copy, does not branch |
| Daily goal: Casual 5 / Regular 10 / Serious 15 / Intense 20 min | **Intensity tier** |

The mechanism to steal: tiers are **named after the user, not the workload**.
"Casual" vs "Intense" is a self-image question wearing a schedule question's clothes.
Anchoring at the lowest option makes higher tiers read as ambitious rather than
demanding, so people pick up rather than down. A neutral minutes list does not do this.

Proposed tiers: Light 3 min → Steady 6 min → Deep 10 min → **Full Protocol 15 min**.
Putting "Protocol" on the top tier trademarks the word and makes it aspirational.

Also from Duolingo: mascot welcomes *before* the first question, and the answer is
reflected back on the very next screen.

**Tension to respect:** Duolingo collects minimal data up front;
`docs/onboarding-expansion-plan.md` goes to ~45 steps. Compatible only if the three
questions come first and the reset lands early — the long tail sits after felt value.

### 3. Exercise timestamps — keep as-is
Shown, unenforced, no change. Settled.

---

## Build first: Mochi coach-mark tour

**Trigger.** First Home render *after* the first completed reset — not during
onboarding. Value before explanation (`docs/onboardingtips.md` #1, #10). Persist
`tour_completed_v1`; never re-fire automatically.

**Stops.** Five, one sentence each. Full tour with tab switching (decided).

1. Home — today's reset card: what it is, that it changes daily
2. Home — Azora Score ring: what the number means
3. Home — hex room object: that finishing a reset unlocks it
4. Heart tab — reads your pulse through the camera
5. Profile tab — history and settings

**Mechanics.** Overlay, not a screen — no new route, `src/app/navigation/types.ts`
untouched. New folder `src/features/tour/`:

- `useTourTarget.ts` — targets register a ref under a string id; `measureInWindow`
  reports the rect
- `TourSpotlight.tsx` — full-screen scrim with a cutout at the measured rect
- `TourOverlay.tsx` — orchestrates steps, drives tab switches, anchors Mochi + bubble
  above or below the cutout depending on vertical space
- `tourSteps.ts` — the five stops as data (target id, copy, tab)

Reuse `MochiFace.tsx` and `MochiSpeechBubble.tsx` from `src/features/room/` rather
than building new mascot rendering. One primary button per stop; skip only as a small
text link (`onboardingtips.md` #4).

**Copy rules.** No "breathwork", no "exercise". Mochi describes what a thing *does*
and reacts to the user tapping through — never "you haven't done this yet"
(design principle: reacts to presence, never absence).

**Analytics.** `tour_step_viewed` / `tour_completed` / `tour_dismissed` on the
existing `AnalyticsEvent` enum.

**Known risk.** Stops 4–5 drive tab switches while the overlay is mounted.
Re-measuring targets after a tab transition is where this gets buggy — the target
rect must be re-measured post-transition, not cached from mount.

---

## Backlog (not yet specced)

- **Heart rate placement guidance.** Testers report HR is "incredibly strict".
  Needs explicit instruction — rest your hand on the camera / phone on your palm.
  `HeartRatePlacementIllustration.tsx` exists but isn't carrying the message.
- **HR reads as "off by default" — actually a paywall problem.** Code defaults to
  on (`GuidedBreathingSessionScreen.tsx:97`, `DailyBreathHoldScreen.tsx:85`), but
  `FeatureKey.BreathingHeartRateMonitoring` gates it and
  `AudioSettingsSheet.tsx:49` forces `false` for non-Pro. Free testers see it off.
  Decide whether HR stays Pro-gated.
- **Dark mode — deferred 2026-08-25, explicitly not now.** No `useColorScheme`
  anywhere; only `theme.id === 'light'` in `SessionGlassButton.tsx:47`. Multi-day
  job across `colors.ts` + every screen.
- **"50/50 reception" risk on the reframe.** Testable in ad copy before renaming
  anything in-app.

---

## The three dailies — settled names

| Daily | Name |
|---|---|
| Primary guided session | **Guided Reset** (renamed 2026-08-25) |
| Complementary pick | **Hand-picked reset** |
| Daily breath hold | **The Azora Protocol** |

## Still breathing-forward (needs a naming call)

- **"Support my yoga" intent** (`onboarding/data/intentOptions.ts`) — deliberately
  pranayama-framed throughout ("Pranayama is the breath half of yoga").
- **`restingHeartRate.ts`** typical/above bands still say "slow breathing" (the
  `below` band now says "a daily reset"). Users see exactly one band, so there is no
  visible inconsistency today.

## Dead code found (not deleted — separate call)

- `src/components/home/HeroActionCard.tsx` — no importers.
- `src/components/exercise/LungAgeInfoDialog.tsx` — no importers; Lung Age was
  replaced by the Azora Score.
