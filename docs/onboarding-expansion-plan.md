# Onboarding Expansion Plan

Direction agreed 2026-07-25: **longer onboarding, more data**. Target ~45 steps
(from 30 today). Explicitly *not* doing per-ad-angle branching — one flow, made
angle-agnostic by voice and structure rather than by variants.

Current sequence lives in `STEP_ORDER` (`src/components/onboarding/OnboardingFlow.tsx:111`).

---

## Principles

**1. Alternate 2–3 questions → 1 payoff.**
A payoff is a reflection, a stat about them, a chart, or a computation. Six
questions in a row reads as a form; three questions plus "here's what that means
about you" reads as an assessment. The flow does this well early
(`intent → intentReflection → intentProjection`) and then stops:
`stress, mindRacing, sleep, heartWorry, agreement, experience` is six
consecutive questions before `assessmentReflection`.

**2. Every answer must visibly come back.**
If we ask bedtime, the plan states the bedtime. If we ask about caffeine,
something later mentions caffeine. Unreturned answers make the flow feel like
data farming instead of an assessment. Today `heartWorry`, `stress`, and
`mindRacing` each collect a 1–10 score that nothing downstream ever says out
loud — fix that before adding more sliders.

**3. Cheap taps first, effort later.**
Tapping cards early; typing, breath holds, and camera reads once they're
invested. Never the reverse.

**4. Length is earned by investment beats, not by screen count.**
Perceived investment comes from effortful actions (typing a name, holding a
breath, dragging a slider), not from the number of screens passed.

---

## Voice

The ads are concrete, plainspoken, moment-based. The onboarding is soft
app-marketing voice. Those don't sound like the same product, and the gap widens
with every new ad angle.

**The rule: ads name a moment, onboarding names a category.** Rewrite question
copy to name moments — same options, same data.

- `StressScreen` — not "How stressed have you felt lately?" but
  "When did you last feel your heart pick up over something small?"
- `SleepScreen` — not "How rested do you feel most mornings?" but
  "How often does your mind speed up right when you lie down?"
- `IntentQuestionScreen` bodies — "Use breathing to settle your nervous system"
  is a feature list. "Settle a spike in under a minute" is the ad.

This is the one change that makes every *future* angle land without touching
code.

### The ad/app asymmetry worth exploiting

Meta forbids second-person health diagnosis, so the ads have to ask
("how long can you last?") where they'd rather assert. Inside the app, after the
user has self-selected, that constraint is gone. The ad asks the question; the
onboarding is allowed to state the answer back. That's the payoff the ad
structurally cannot deliver — use it.

---

## Structural change

**Move one measurement beat to ~step 8–10.** Today `lungCapacity` is step 16 and
`baseline` is step 22 of 30 — someone who just held their breath in the ad
answers ~15 questions before the app lets them do it again. Holding a breath or
reading a pulse is the highest-investment action in the funnel, and early
investment is what buys the next thirty screens.

Keep the second measurement where it is, as a "now let's test properly" beat
before the plan. Two measurement moments split the long middle into halves that
each feel short.

Positioning spine: **measure, then fix — same app, same minute**. It's true for
sleep, stress, rage, and heart health equally, so it's the one hook that carries
every angle. The opening should make that action clear before asking the user to
invest in a longer assessment.

---

## Screens to add

Ordered by value. Roughly 12–14 additions → ~45 steps.

### Tier 1 — build first

**Trigger moments** (multi-select)
"When does it usually hit?" — first thing in the morning · in traffic · before
meetings · around 5:30pm · after an argument · lying down at night · 3am.
The single highest-value missing screen: it turns the entire ad-angle backlog
into one data field, feeds reminder scheduling and content selection, and every
angle's buyer sees their own moment listed.

**Body signature** (multi-select)
Racing heart · tight chest · clenched jaw · shallow breath · can't get a full
breath in. Supports the "it's a body problem, not a character flaw" argument and
feeds technique recommendation honestly.

**Analysis screen**
The itemized computation beat, immediately before the plan reveal —
"Analyzing your breath rate… Comparing against 12,400 people your age…
Building your 4-week plan…". Standard in every high-converting long funnel and
completely absent today. This is where the length gets justified retroactively.

**Comparison screen**
"Your resting rate vs. the average for your age." Needs only data already
collected. The moment the assessment becomes about *them*, and the strongest
available lead-in to the paywall.

### Tier 2

**What have you already tried?** — meditation app · therapy · supplements ·
watch/tracker · nothing yet. Strong competitive data; sets up the
measure-then-fix contrast without naming a competitor in-app.

**Sleep and wake times** — two screens. Sets reminder timing and wind-down
scheduling. Required by the sleep angle family regardless.

**Practice time anchor** — "When will you actually do this?" morning · commute ·
lunch · evening · in bed. `consistency` and `dailyTime` exist but not *when*,
and *when* is what determines whether the habit sticks.

**Smoking history / exercise frequency / height** — makes the lung-age and
Azora Score numbers defensible instead of decorative. The ex-smoker question is
the entirety of ad angle #6.

### Tier 3

**Goal date / 30-day projection (second pass)** — `intentProjection` runs early
on no data. A second projection *after* measurement, using their real number and
a target date, is far stronger.

**Testimonial interstitials** — two or three, spaced through the long middle to
keep energy up.

**Email capture** — near the end; recovers the abandons that added length will
inevitably create.

## North Star

**% of new trial starters who complete 5+ breathing sessions within their first
7 days.** Measured weekly, by install cohort.

**No valid baseline yet.** The hard paywall landed the week of **2026-07-05**
(non-payer sessions go 34 → 14 → 10 → 5 → 0 and stay at 0 from that week on).
Every cohort old enough to measure a 30-day outcome predates it, so the numbers
below describe a free-access product that no longer exists. The provisional
figure — 64%, 16/25 purchasers — comes from people who paid when they didn't
have to, a much higher-intent group than today's payers. **Re-baseline from
2026-08-09**, when the first post-paywall cohort turns 30 days old.

One simplification from the change: post-paywall, `onboarding_completed` fires
essentially only for payers, so "completers" and "trial starters" are now the
same denominator.

Why this one:

- It cannot be gamed by a harder paywall or by more ad spend. Low-quality
  installs push it *down*, which is the correct signal.
- Revenue, installs, trial starts and onboarding completion rate are all vanity
  metrics here — each can rise while the product gets worse.
- 5 sessions in the first week is the point where week-4 survival stops being
  zero. Below it, one session and no sessions have identical outcomes.

**Caveat on the threshold.** The 5-session cut was derived across payers and
non-payers combined, and under a hard paywall that split is mostly an *access*
difference, not a behavioural one. Within payers alone, 64% already clear it
while only 12% reach week 4 — so it does not yet discriminate where it matters.
Re-derive the threshold on payers only once the cohort reaches n≈150.

Supporting metrics (not North Stars):

| Metric | Value | Era |
|---|---|---|
| Onboarding start → paywall reached | 82% | current |
| Paywall → purchase | ~35% | current |
| Engaged in week 1 (all completers) | 36.7% | pre-paywall |
| Engaged in week 4 (all completers) | 4.6% | pre-paywall |
| Engaged in week 4 (payers) | 12.0% | pre-paywall |
| Median time to first completed session | not instrumented | — |

Only the first two survive the paywall change. The rest are historical.

---

## Measurement

At ~45 steps the leak can't be eyeballed — but as of 2026-07-26 the per-step
funnel is not where the loss is. Last 21 days, `onboarding_step_viewed` by index:
105 at `intent` → 86 at `paywall`, roughly one user lost per screen. There is
headroom for the additions above.

In the pre-paywall era the loss was entirely post-onboarding: 63% of completers
never performed a single breathing action and week-4 engagement was 4.6% — an
activation failure, not a retention failure. Whether that still holds under the
hard paywall is unknown until 2026-08-09; the population changed, so the number
must be re-measured rather than assumed.

Two known blind spots: no Android cohort yet, so the OS retention split is
unavailable; and monthly vs. yearly cohorts have not been split, so annual
subscribers currently look retained whether or not they open the app.

`onboarding_completed` is unreliable as an activation event — the 2026-07-19
cohort shows 47 started / 5 completed / 36 paywall-reached, so it fires on a
path most users don't take. Fix its firing condition before trusting it
anywhere.
