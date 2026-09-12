# Store Review Prompt Strategy

How Azora decides when to show the native App Store rating sheet, and why each
rule exists. Read this before changing anything under `src/services/reviews/`.

## Why this exists

Meta ads are the main growth channel, which changes what the store rating
measures. Broad paid traffic installs on impulse, meets a hard paywall, and the
people motivated enough to write an *unprompted* review are mostly the annoyed
ones. Prompted reviews skew positive; unprompted ones skew negative. So the
rating is largely a function of **how many satisfied users we prompt**, not of
product quality.

That matters commercially: a lower store rating lowers product-page conversion,
which raises effective CPI on the same Meta spend. Rating is an acquisition
input, not a vanity metric.

iOS allows **at most three prompts per user per 365 days**, and Apple silently
swallows anything beyond that. Prompts are a scarce budget. Every rule below
exists to spend that budget on someone who is having a good day with the app.

---

## Where prompts fire

| Trigger | Fires from | Gate |
|---|---|---|
| `onboarding_baseline` | `OnboardingFlow.tsx` — `diagnosis` step, on continue | A baseline heart-rate reading was captured (`baseline != null`) |
| `guided_breathing` | `SessionCompleteScreen.tsx:164` | Full policy, after the daily sheet is dismissed |
| `breath_hold` | `ShareableResultScreen.tsx:136` | Full policy, after the daily sheet is dismissed |
| `heart_rate` | `HeartRateScreen.tsx:19` | Full policy, on capture complete |

The onboarding trigger calls `requestStoreReview` directly and **bypasses the
session policy** — it is the one deliberate exception, because a first-time user
cannot satisfy a rule about repeat days. Every other trigger goes through
`maybeRequestSessionReview`, which applies the full policy.

### Why `diagnosis`, and not the end of onboarding

The prompt used to fire on the `notifications` step, on both the submit and the
skip path. Three problems:

1. **Dialog fatigue.** `attPriming` fires Apple's ATT dialog, `notifications`
   fires the permission dialog, and the review sheet came third. By the third
   dialog the user is tapping to clear the screen. On the rating sheet that
   means no rating at all — not five stars.
2. **It asked users who had just declined.** The skip path fired the sheet on
   someone who had refused notifications one second earlier.
3. **It burned the budget on a non-user.** Spending a prompt before any value
   was delivered also locks the next ask behind 30 days and 10 sessions.

`diagnosis` is the only place in ~45 onboarding steps where the app has *done*
something for the user rather than asked them something: it shows their own
resting BPM from the baseline reading. It also sits several steps before the
paywall, so no price has been seen yet.

Users who skip the baseline reading get **no** onboarding prompt. They keep the
full session-based budget for later.

---

## The rules

All in `src/services/reviews/reviewPromptPolicy.ts`, which is pure and fully
unit-tested. `shouldRequestReview(state, nowMs)` returns false if **any** rule
fails.

| Rule | Constant | Value | Why |
|---|---|---|---|
| Annual budget | `MAX_PROMPTS` | 3 | Apple's hard limit; asking more only wastes calls |
| Enough sessions | `MIN_SESSIONS_BEFORE_FIRST_PROMPT` | 3 | Do not ask a first-timer |
| Enough **days** | `MIN_CONSECUTIVE_SESSION_DAYS` | 2 | A count alone cannot tell a habit from one curious afternoon |
| Paywall cooldown | `PAYWALL_COOLDOWN_MS` | 10 min | A rating asked minutes after a declined price is a rating about the price |
| Gap between prompts | `MIN_DAYS_BETWEEN_PROMPTS` | 30 | Spread three prompts across a year |
| Sessions between prompts | `MIN_SESSIONS_BETWEEN_PROMPTS` | 10 | A second ask needs new engagement, not just elapsed time |

### The settle delay

`PROMPT_DELAY_MS` is 1800 ms, applied inside `requestStoreReview` immediately
before the native call, so **every** trigger gets it. It covers two things: the
navigation transition finishing (~300 ms), and the user actually reading the
number on screen before the sheet covers it. Do not tune it in the same release
as any other review change, or the result cannot be attributed.

### Rules deliberately not implemented

- **"Session completed, not abandoned."** Already guaranteed. All three session
  triggers only run on a completed session.
- **"Prefer subscribers."** With a hard paywall, nearly everyone who reaches a
  session is already a trialer or payer, so an entitlement check would filter
  out almost nobody while adding a network call to a path that currently touches
  no server.

---

## How consecutive days are counted

`recordCompletedSession(state, localDate)` compares the stored `lastSessionDate`
against today's local date:

- **same day** — session count increments, day run unchanged (minimum 1)
- **exactly one day later** — day run increments
- **anything else** (a gap, or a clock moved backwards) — day run resets to 1

Dates are `YYYY-MM-DD` strings compared as UTC midnights, so DST never shifts
the gap by an hour. State persists to `AsyncStorage` under
`reviews:prompt_state` via `reviewPromptState.ts`, whose every read-modify-write
goes through one queue.

### Paywall dismissals

Recorded in `usePaywall.ts` inside `trackDismissed`. All four dismissal surfaces
(`ProPaywallScreen`, onboarding's `continueWithoutPro`, `ExitOfferSheet`,
`ExitOfferScreen`) funnel through that one function, and no purchase or restore
path calls it — so a successful buyer is never put into cooldown.

---

## Migration note

Existing installs have stored state with no `consecutiveSessionDays` and no
`lastSessionDate`. `normalizeReviewPromptState` fills them with `0` / `null`,
so those users need **2 consecutive days** before any prompt can fire again.
This is a one-time pause, not a permanent block. Covered by the test *"state
written before consecutive days existed does not block forever"*.

---

## Measuring it

Apple reports nothing about what the user did with the sheet, so use a proxy.

1. **PostHog** — `trackReviewPromptRequested` emits `trigger`, `promptCount`,
   `completedSessions`. Chart prompts fired per day, split by `trigger`.
   The trigger value was renamed `onboarding` → `onboarding_baseline` with this
   change precisely so the before/after split is legible on one chart.
2. **App Store Connect** — new ratings per day and average star.
3. **The real KPI** — `new ratings ÷ prompts fired`. Raw volume tracks Meta
   spend, so it will mislead you.

Allow 14 days minimum. Ratings arrive with a lag and daily counts are noisy at
low volume.

### Known risk

Gating the onboarding prompt on a completed baseline reading cuts prompt volume
by the baseline skip rate. Check `baseline_completed: false` in PostHog before
concluding the change failed — a lower prompt count is expected and intended.

---

## Testing

- `reviewPromptPolicy.test.mjs` — the rules, day counting, clock-backwards
  safety, corrupt state, and the legacy-state migration
- `reviewPromptPlacement.test.mjs` — source assertions that the prompt stays on
  `diagnosis`, never returns to `attPriming` or `notifications`, keeps the
  settle delay, and that paywall dismissals stay recorded

Run `npm run check`.
