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
| `onboarding_plan` | `OnboardingFlow.tsx` — `diagnosis` step, on continue | `evaluateOnboardingPrompt`: budget left and never asked before |
| `guided_breathing` | `SessionCompleteScreen.tsx:159` | `evaluateReviewPrompt`, after the daily sheet is dismissed |
| `heart_rate` | `HeartRateScreen.tsx:19` | `evaluateReviewPrompt`, on capture complete |

Onboarding goes through `maybeRequestOnboardingReview`; the two session
triggers go through `maybeRequestSessionReview`. Both end in
`requestStoreReview`, which no screen calls directly.

### Why onboarding

Under a hard paywall, every paid install passes through onboarding, and nobody
reaches a Reset without starting a trial first. Onboarding is the one moment the
whole cohort is guaranteed to be in front of us. Cal AI asks at the same point —
after the plan is built, before the price.

### Why `diagnosis`, and not the end of onboarding

The prompt used to fire on the `notifications` step, on both the submit and the
skip path. Three problems:

1. **Dialog fatigue.** `attPriming` fires Apple's ATT dialog, `notifications`
   fires the permission dialog, and the review sheet came third. By the third
   dialog the user is tapping to clear the screen. On the rating sheet that
   means no rating at all — not five stars.
2. **It asked users who had just declined.** The skip path fired the sheet on
   someone who had refused notifications one second earlier.
3. **It asked after the paywall had been seen**, so the rating was about price.

`diagnosis` is the plan reveal: the one step where the app has *done* something
for the user rather than asked them something. It sits before the paywall, so
no price has been seen yet. The sheet requests on continue and, after the settle
delay, lands over the settled `recommendedExercise` screen.

`evaluateOnboardingPrompt` blocks with `already_prompted` once any prompt has
been shown, so stepping back to `diagnosis` and forward again never asks twice.

### Why the first Reset, on a later day

The first completed Reset is the first time the product itself — not the pitch —
has delivered something, so it is the first session ask. It must land on a
later day than the onboarding ask: two sheets in one sitting read as nagging,
and a second ask right after the first is mostly the same mood asked twice.
Onboarding prompts do not count toward `sessionPromptCount`, so the first Reset
still gets its own ask.

---

## The rules

All in `src/services/reviews/reviewPromptPolicy.ts`, which is pure and fully
unit-tested. `evaluateReviewPrompt(state, nowMs)` returns `null` when the prompt
may be shown, or the name of the **first** rule that blocked it, in this order:

| Rule | Constant | Value | Why |
|---|---|---|---|
| Annual budget | `MAX_PROMPTS` | 3 | Apple's hard limit; asking more only wastes calls |
| Enough sessions | `MIN_SESSIONS_BEFORE_FIRST_PROMPT` | 1 | The first completed Reset is the first ask |
| Paywall cooldown | `PAYWALL_COOLDOWN_MS` | 10 min | A rating asked minutes after a declined price is a rating about the price |
| First session ask: day after onboarding | `MIN_DAYS_AFTER_ONBOARDING_PROMPT` | 1 | Applies only while `sessionPromptCount` is 0 and onboarding asked |
| Gap between prompts | `MIN_DAYS_BETWEEN_PROMPTS` | 30 | Spread three prompts across a year |
| Sessions between prompts | `MIN_SESSIONS_BETWEEN_PROMPTS` | 10 | A second ask needs new engagement, not just elapsed time |

The last two apply only once a session ask has fired (`sessionPromptCount > 0`).
`recordPrompt(state, nowMs, kind)` always spends budget; only `kind: 'session'`
increments `sessionPromptCount`.

### Two guards that hold for every trigger

`requestStoreReview` checks both, so they cover onboarding too:

1. **Annual budget.** `hasPromptBudget(state)` is the single definition of the
   three-per-year rule, shared with both evaluators.
2. **Still foregrounded.** After the settle delay, the app must still be active.
   iOS discards a sheet requested from the background, and asking anyway would
   burn one of three annual prompts on nobody.

### The settle delay

`PROMPT_DELAY_MS` is 1800 ms, applied inside `requestStoreReview` immediately
before the native call, so **every** trigger gets it. It covers two things: the
navigation transition finishing (~300 ms), and the user actually reading the
screen before the sheet covers it. Do not tune it in the same release as any
other review change, or the result cannot be attributed.

### Rules deliberately not implemented

- **"Session completed, not abandoned."** Already guaranteed. Both session
  triggers only run on a completed session.
- **"Prefer subscribers."** With a hard paywall, nearly everyone who reaches a
  session is already a trialer or payer, so an entitlement check would filter
  out almost nobody while adding a network call to a path that currently touches
  no server.

State persists to `AsyncStorage` under `reviews:prompt_state` via
`reviewPromptState.ts`, whose every read-modify-write goes through one queue.

### Paywall dismissals

Recorded in `usePaywall.ts` inside `trackDismissed`. All four dismissal surfaces
(`ProPaywallScreen`, onboarding's `continueWithoutPro`, `ExitOfferSheet`,
`ExitOfferScreen`) funnel through that one function, and no purchase or restore
path calls it — so a successful buyer is never put into cooldown.

---

## Migration note

Stored state written before `sessionPromptCount` existed cannot tell onboarding
asks from session asks. `normalizeReviewPromptState` defaults a missing
`sessionPromptCount` to `promptCount`, so an install that was already asked keeps
the 30-day / 10-session spacing instead of getting a fresh first-Reset ask.
Stale `consecutiveSessionDays` and `lastSessionDate` keys are dropped on read.

---

## Measuring it

Apple reports nothing about what the user did with the sheet, so use a proxy.

1. **PostHog — prompts fired.** `review_prompt_requested` carries `trigger`,
   `prompt_count`, `completed_sessions`. Chart it per day, split by `trigger`.
2. **PostHog — prompts held back.** `review_prompt_suppressed` carries the same
   fields plus `reason` (one of the `ReviewPromptBlock` values). Without it a blocked prompt is a silent nothing
   and you cannot tell a gate that is working from a gate that is too tight.
   It fires once per completed session that does not prompt, so its volume
   tracks session count.
3. **App Store Connect** — new ratings per day and average star.
4. **The real KPI** — `new ratings ÷ prompts fired`. Raw volume tracks Meta
   spend, so it will mislead you.

Allow 14 days minimum. Ratings arrive with a lag and daily counts are noisy at
low volume.

---

## Adjacent: the "I paid and lost it" review category

Unprompted 1-stars on subscription apps cluster on complaints that are not about
the product. One of them was reachable-by-nobody: Restore Purchases existed only
on the paywall, which a paying user never sees again, so a customer whose
purchase did not stick had no way to fix it.

`SettingsScreen.tsx` now carries a **Subscription** section with **Restore
purchases** — it calls `restorePaywallPurchases()`, invalidates the entitlement
query on success, and distinguishes a genuine failure from having nothing to
restore.

A manage-subscription deep link was built and removed by product decision. Do
not re-add it without asking.

---

## Testing

- `reviewPromptPolicy.test.mjs` — both evaluators, the day-after-onboarding
  rule, clock-backwards safety, corrupt state, and the legacy-state migration
- `reviewPromptPlacement.test.mjs` — source assertions that onboarding asks
  exactly once, from `diagnosis`, never from `attPriming` or `notifications`,
  that the settle delay stays, and that paywall dismissals stay recorded

- `reviewPromptState.test.mjs` — persistence: the storage key, surviving a
  relaunch, concurrent writes staying serialized, corrupt JSON, a failed write,
  and that a read never writes. It stubs `AsyncStorage` before importing the
  module, the same way `tourSeenPersistence.test.mjs` does.

Run `npm run check`.

### Where the sheet actually appears

`expo-store-review`'s `isAvailableAsync()` returns `!isRunningFromTestFlight()`,
and that check is `sandboxReceipt && no embedded.mobileprovision`. So:

| Build | Sheet appears? | Apple's 3/year cap? |
|---|---|---|
| `expo run:ios --device` / Xcode | **Yes** — it carries a provisioning profile | **No**, dev builds are not limited |
| Simulator | Yes | No |
| **TestFlight** | **No** — `isAvailableAsync()` is false, we return early | n/a |
| App Store | Yes | Yes |

TestFlight is the one place it never shows. A development build is the *easiest*
place to see it, not the hardest.

Our own `MAX_PROMPTS` budget still applies in development, so the fourth attempt
on one install is suppressed even though Apple would allow it. Clear it with
**Settings → Reset review prompt (dev)**, or reinstall.

### What automated tests cannot cover

These need a device:

1. **Onboarding** — sheet appears ~1.8s after Continue on diagnosis, over a
   settled recommended-exercise screen. Back and forward again: no second sheet.
2. **First Reset** — no sheet on the day of onboarding (`too_soon_after_onboarding`);
   sheet on the first Reset the next day.
3. **Background during the beat** — tap Continue, then immediately background
   the app. No sheet, and no `review_prompt_requested` event.
4. **Settings → Restore purchases** — on an account with and without a
   subscription, and with airplane mode on for the failure copy.
5. **Fourth attempt on one install** — suppressed with reason
   `budget_exhausted`, until the dev reset is used.

`review_prompt_requested` and `review_prompt_suppressed` in PostHog confirm what
the app decided, which is the part we control. Whether the sheet then renders is
Apple's call.

---

## Known, accepted

**A result screen that remounts counts a second session.** The two session
triggers fire from effects keyed on screen state, so navigating back onto a
result screen increments `completedSessions` again. This predates the current
rules and only makes prompts slightly *more* likely, never less. The fix is to
pass a session id down to `maybeRequestSessionReview` and ignore a repeat, which
costs a parameter at two call sites — worth doing only if the analytics show
it happening.

**A clock moved forward then back leaves a long lockout.** `lastPromptAt` in the
future makes `elapsedDays` negative, which blocks until the fake date arrives.
Deliberate: the alternative unlocks prompt farming, and Apple's own annual cap
is the real backstop.
