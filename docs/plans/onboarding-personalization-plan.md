# Onboarding Personalization — Concrete Changes

Goal: make the flow feel like it is *reading* the user, not collecting from them.
Everything here is derived from answers already in `OnboardingFlow` state. No
fabricated numbers — per `design.md`, numbers never flatter.

## Scope amendment — personalization must change the plan

This document owns the question-to-plan and plan-reveal contract. The product
behavior and preset catalogue live in `program-catalogue-plan.md`; persistence,
versioning, and migration live in `program-catalogue-schema.md`.

Echoes, analysis animations, and a personalized-looking reveal are presentation
polish. They are not sufficient evidence that a plan is personalized. The new
baseline is that every collected answer must do at least one of four things:

- select or rank an eligible authored preset;
- fill a declared personalization slot such as cue, duration, target, or
  accessible alternative;
- establish a safety or capability constraint; or
- define the baseline or outcome measure used at review.

The first enrollment has one primary goal. That goal narrows the eligible
presets; shared and goal-specific answers then compile the selected immutable
preset revision into a resolved enrollment snapshot. The snapshot preserves
what was prescribed even after the catalogue publishes a newer revision.

Minimum personalization inputs are the desired outcome, current baseline,
target, dominant barrier, context or cue, realistic time budget, prior
experience, and relevant safety/capability answers. Irrelevant demographic or
wellness questions are skipped.

Every compiled prescription shown at reveal must state what to do, when to do
it, why it fits, its easier fallback, and when it will be reviewed. The rationale
distinguishes `You told us`, `Azora inferred`, and `Evidence suggests`. User
changes are saved as overrides rather than mutating the authored preset or the
original resolved prescription.

---

## 0. The core primitive: echo verbatim

**What it means:** when a later screen refers to an earlier answer, it uses the
user's own chosen words, not a category name and not a paraphrase.

Today `SleepInsightScreen.tsx:46` says:

> **58%** of people struggle with **quality sleep**.

The user has just told us `sleepQuality` (1–10), `sleepDuration`
(`'5to6'`), and `wakeEase` (`'snooze'`). Echoing verbatim means:

> You said **5 to 6 hours**, and that you **hit snooze more than once**.

The option `title` strings in `data/routineOptions.ts` are already written in
the user's voice — that is what gets quoted, unchanged, bolded. Not "short
sleep duration", not "you seem to struggle with mornings". The literal string.

### Taste rules — these are what keep it from becoming a gimmick

1. **Use the answer as a premise, don't announce it.** "Since evenings are the
   hard part, your reset sits at 9pm" — not "You said evenings are hard." The
   second is a receipt. The first is someone who was listening.
2. **Distance, not proximity.** Echoing the answer from the previous screen is
   filler. Echoing one from twelve steps back is memory. Spend echoes at long
   range.
3. **Three times in the whole flow. Total.** Not per block. Frequency is what
   turns this into a parlour trick.
4. **Trim to the fragment that reads naturally.** "5 to 6 hours" sits inline.
   "I hit snooze more than once" does not — it becomes "hitting snooze more
   than once".
5. **Never quote the heavy answers back.** `mentalHealth` and `doctorReferral`
   are acted on silently and never repeated at the user. Quoting
   someone's anxiety back to them in a card reads as surveillance, not care.
6. **Never echo an untouched default.** A slider left at 5 is not an answer.
   `hasAnsweredBrainFog` is the existing precedent — extend the same gate to
   every slider and make `echoPhrase` return `null` for ungated values.
7. **One bolded fragment per screen, maximum.**

### Implementation

New file `src/lib/onboardingEcho.ts` — pure, testable:

```ts
export function optionTitle<T extends string>(
  options: readonly OnboardingOption<T>[],
  id: T | null,
): string | null;

/** Trims an option title to a fragment that reads inside a sentence:
 *  "I hit snooze more than once" -> "hitting snooze more than once".
 *  Returns null for unanswered or defaulted values. */
export function echoPhrase(title: string | null): string | null;
```

Then `src/components/onboarding/EchoLine.tsx` renders a sentence with a single
emphasised fragment, using the existing `headlineEmphasis` treatment. It takes
the full sentence, not a "You said" template — rule 1 means the grammar varies
per screen and the component must not impose one.

### The three echo sites

| Screen | Echoes | Distance |
|---|---|---|
| `greeting` | the primary intent's `goalPhrase` | ~4 steps |
| `planIntro` | `dailyTime` + `wakeTime`, as the shape of the plan | ~8 steps |
| `recommendedExercise` | the `procrastinationReason` pick | ~14 steps |

Everywhere else stays as it is.

---

## 1. Three short analyzes + the existing long one

Keep `PlanLoadingScreen` as the finale. Add a smaller sibling used three times.

New: `src/components/onboarding/screens/QuickAnalyzeScreen.tsx`

```ts
interface QuickAnalyzeScreenProps {
  /** 2–3 lines, each one derived from an answer the user just gave. */
  steps: readonly string[];
  /** The line shown when the bar lands. Quotes the user. */
  conclusion: string;
  durationMs: number;
  onDone: () => void;
}
```

Same visual language as `PlanLoadingScreen` (percent, track, `card.base` list,
checkmark spring, medium impact per leg) at reduced scale — no percent counter,
no card, just the track plus a status line and the conclusion. Extract the leg
runner from `PlanLoadingScreen` into
`src/hooks/useSteppedProgress.ts` (`active` in, per-leg callback out, effect
owns the timer — the `useHeartRatePlacementFlow` shape) and have both screens
use it. Delete the inlined copy in `PlanLoadingScreen`.

### Placement (new steps in `types.ts` + `STEP_ORDER`)

| Step | After | Duration | Steps shown | Conclusion (echoes) |
|---|---|---|---|---|
| `analyzeIntent` | `intentPriority` | ~2.2s | "Reading what you came for…", "Matching a starting point…" | quotes primary intent `goalPhrase` |
| `analyzeSleep` | `wakeEase` | ~2.8s | "Looking at your nights…", "Comparing sleep to how you wake…", "Checking for a pattern…" | quotes `sleepDuration`, then states what the plan does about it |
| `analyzeLoad` | `mentalHealth` | ~2.5s | "Weighing what you're carrying…", "Finding where the pressure sits…" | quotes stress level + top load |

`analyzeSleep` lands directly on `SleepInsightScreen`, which should lose its
unsourced "58% of people" line in favour of the echo — see §7.

### Duration is derived, not constant

`durationMs = BASE + PER_INPUT * answeredCount` for that block. Same trick as
the existing `legSpeeds` jitter, one level up: the sleep block has more inputs
than the intent block, so it visibly takes longer. Constant durations are the
tell.

Put this in `onboardingEcho.ts`'s neighbour `src/lib/onboardingAnalyze.ts`:

```ts
export function analyzeDurationMs(answeredCount: number): number;
```

---

## 2. Questions inside the long loading screen

`PlanLoadingScreen` gains interrupts.

```ts
interface PlanLoadingInterrupt {
  /** Fraction of the whole run at which the bar pauses. */
  at: number;
  question: string;
  options: readonly { id: string; label: string }[];
}
```

- Two interrupts, at `0.38` and `0.72`.
- On reaching an interrupt the bar **stops mid-leg** (do not land it on a
  checkmark — pausing between beats is what reads as "it hit something"), the
  status line swaps to the question, and two `ChunkyButton` options fade in.
- Answering fires a success haptic, and the **step list visibly changes**: one
  new item is inserted into `PERSONALIZING_STEPS` below the current row with a
  spring, labelled from the answer. This is the whole point — the user sees
  their tap alter the work in progress.
- Resume with a fresh leg duration.

Questions must be genuinely plan-affecting, not filler:

1. at `0.38` — "Do the hard moments hit more in the morning or the evening?"
   → feeds `planTimeOverrides` for the first action. Inserted item: "Evening
   anchor" / "Morning anchor".
2. at `0.72` — "Would a reminder help, or get in the way?"
   → pre-seeds the `notifications` step's framing. Inserted item: "Your
   reminder".

Both answers get persisted through the existing survey path
(`onboardingSurveyService`) so the claim is true.

**Do not** block the bar on an unanswered interrupt indefinitely — after 8s of
no tap, auto-resume with no insertion and no analytics event.

---

## 3. Progressive radar instead of a reveal

`MindMapRadar` currently appears finished at `diagnosis`. Change it to fill in.

- Add `revealedAxes?: readonly MindMapAxis[]` to `MindMapRadar`; unrevealed
  axes render at the polygon origin with a dashed spoke.
- Each of the three quick analyzes ends by revealing the axes it fed:
  `analyzeIntent` → none (too early), `analyzeSleep` → `recovery`,
  `analyzeLoad` → `calm` + `resilience`. `planLoading` reveals `focus` and
  `breathEase`.
- Show the partial radar small on `HalfwayScreen` — it is currently a pure
  milestone screen, and a half-built profile is the best possible argument for
  finishing the flow.

`computeMindMap` needs no change; it is already real. That is what makes this
honest rather than theatre.

---

## 4. Make the branching visible

`STEP_ORDER` is already filtered conditionally (`OnboardingFlow.tsx:439`).
Surface it:

- When a conditional block is unlocked by an answer, show a one-line toast
  above the progress bar in `onboardingProgress.tsx`: "2 questions added —
  based on your last answer", fading after ~2s.
- Requires `goToStep` to report the step-count delta. Compute
  `visualStepCount` before and after the answer and diff it; only show when
  positive.

---

## 5. Stream the diagnosis

`DiagnosisScreen` fades its copy in. Switch the headline + body to the existing
`TypedText` component, ~28ms/char, cap the body at three lines. Generated text
should look generated. Skip-on-tap so it never blocks.

---

## 6. Cite the answer behind every plan row

`RecommendedExerciseScreen` / `PlanNotepad` rows get an optional `because?:
string` rendered small under the row title, quoting the source answer:

> Evening reset — *because you said evenings are the hard part*

`onboardingPlan.ts` already builds the actions from these inputs; it just
doesn't carry the provenance out. Add `because` to the plan action type and
populate it where each action is chosen. This is the cheapest large win in the
list: it converts a plausible plan into an evidenced one.

---

## 7. Cohort comparison — only if real

`SleepInsightScreen`'s "58% of people" is the kind of number that costs
credibility the moment a user doubts it. Two honest options:

- **Drop the stat** and replace it with what the plan actually does about
  their answer. Preferred.
- **Compute it** from the Supabase survey table — a nightly-refreshed view of
  answer distributions, read once at onboarding start and cached. "You
  answered like 18% of people here" is then defensible and, because it's
  *specific*, lands harder than a round borrowed number.

Do not keep an unsourced stat.

---

## Ordering

| Slice | Contents | Why |
|---|---|---|
| 1 | §2 loading interrupts | Self-contained in one file, highest wow per hour. |
| 2 | §1 quick analyzes + `useSteppedProgress` extraction | Touches `STEP_ORDER`; the extraction pays for itself here. |
| 3 | §0 echo primitive at the three sites | Small, but only lands once the analyzes give it somewhere to sit. |
| 4 | §6 plan provenance, §5 typed diagnosis | Polish on the back half. |
| 5 | §3 progressive radar, §4 visible branching | Most cross-cutting; do last. |
| 6 | §7 cohort numbers | Needs a data view; unblock separately. |

## Constraints

- Copy: no "breathwork" / "exercise"; no privacy denials; semibold only.
- Every button is `ChunkyButton`. Tokens from `theme/*`, no literals.
- Every analyze screen must do real work (persist survey, compute scores,
  prefetch images) alongside the wait. A pure `setTimeout` in front of a
  paywall is the shape App Review rejects.
- Analytics: one event per analyze screen with its derived duration and whether
  an interrupt was answered, so the additions can be measured against the
  activation north star.
