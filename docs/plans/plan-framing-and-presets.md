# Plan Framing, Named Presets, and the Mental Model

## Status

Proposed. Written 2026-09-16 after research into Runna, Couch-to-5K, Nike Run
Club, Noom, WeightWatchers, Cal AI, Headspace, Fabulous, Duolingo and 75 Hard,
plus the behaviour-change literature on goal gradient, implementation
intentions, treatment credibility and personalization.

This document answers a question the existing plans leave open: **what the user
thinks the plan is**. `program-catalogue-plan.md` owns the preset catalogue and
its storage; `onboarding-personalization-plan.md` owns the question-to-plan
contract. Neither settles the naming, the causal story, or the shape of the
reveal — and open question #2 in the catalogue doc says the six plan names are
placeholders. This is that decision, plus the framing layer around it.

Target is the activation north star: 5+ sessions in 7 days among trial starters.

---

## 1. What is actually missing today

The reveal is `RecommendedExerciseScreen.tsx:120` — `"Your custom plan!"`, a
radar, and three rows: `Guided Reset`, `Azora's reset`, `The Azora Protocol`.

Against the component set that recurs in every plan reveal worth copying:

| Component | Azora today |
| --- | --- |
| A **name** the user can say out loud | ✓ — as of this change |
| A **derived number**, visibly computed from their answers | ✗ |
| A **horizon** — fixed length, end date, and what happens after | ✗ — flat and infinite |
| A **ladder** — week by week, with one nameable hardest moment | ✗ |
| A **rule of progression** in one sentence | ✗ |
| A small **session vocabulary** recombined | ~ — three fixed slots, one rotating technique |
| A **daily unit of compliance** | ✓ — three dailies |
| **Endowed head start** | ✗ — starts at zero |
| **Attribution** — each parameter traced to an answer | ~ — one line, `reasonEcho` |
| **Slack** — a named buffer so a miss sits inside the plan | ~ — `programDay` waits, but silently and only in the unbuilt design |
| **Editability** | ✓ — times are tappable, todo rows droppable |
| **One next action** | ✓ — "Start my plan" |

Five of twelve are missing outright. The four present ones are the four that
cost the least to build, which is the usual shape of this failure.

Three specific problems worth naming separately:

**The highest-signal answers are discarded before the plan.** `intentDepth1–3`
ask when it hits, what they have already tried, and what it has cost. All three
are collected (`OnboardingFlow.tsx:408`) and exactly one of them — the cost
answer — is used once, in `analyzeIntent` (`OnboardingFlow.tsx:2073`). The
`tried_*` answer is never read. That is the single most valuable string in the
funnel and it is dropped on the floor. See §6.

**There is a fabricated number in front of the paywall.** `projectScores`
(`src/lib/paywallPersonalization.ts:4`) adds a flat +35/+28/+20/+10 to every
axis and renders it as "With your plan" with no timeframe, no date, and no
mechanism. `design.md` principle 4 is marked absolute and this is on the wrong
side of it. §7 replaces it.

**Nothing says how long anything takes.** `onboardingPlan.ts:9` sets the horizon
at seven days because the trial is seven days. That is right about the trial and
wrong about the plan: a seven-day horizon cannot produce a ladder, and a plan
with no ladder is a list.

---

## 2. The mental model — Azora's calorie deficit

The thing that makes "eat 500 fewer calories a day" retentive is not that it is
true. It is that it is a **one-sentence causal chain with the user's own daily
action in the middle of it**: deficit → pounds → date. Three components always
travel together — a derived personal number, a dated projection, and a trivially
repeatable daily unit.

Azora's chain, and it is already in the product:

> **Stress teaches your body to stay switched on. A reset switches it off on
> purpose. Do that every day for long enough and off becomes the default.**

That sentence is the spine `onboarding-screen-map.md` §A already asks for. It is
mechanistically defensible, it names the daily action, and it makes no numeric
promise about a body — which is what keeps it on the right side of principle 4.

The three numbers that carry it:

| Role | Azora's version | Where it comes from |
| --- | --- | --- |
| **Derived number** | **Your daily dose: N minutes** | `dailyTime` clamped by intent — the arithmetic already exists in `sessionMinutes` and `fullDailyMinutes` |
| **Horizon** | **N weeks. You finish on DATE.** | the chosen preset's length, plus today |
| **Daily unit** | **Three things. Same three, every day.** | the existing three slots |

Say all three on one screen and the user can repeat the plan back to a friend.
That is the test. Today they cannot.

**Why the horizon is a date and not a score.** Noom can say "you hit your goal
on March 14" because weight is the outcome and weight is measured. Azora must
not say "your Calm reaches 72 on October 14" — that is a prediction about a
person, and principle 4 forbids it. But "you finish The Sleep Reset on October
14" is a fact about a *schedule*, not a claim about a *body*. It is fully
honest, it is dated, and it does the same retention work. Take the date; leave
the prediction.

**Design the cliff now.** Noom's goal date is both its strongest mechanic and
its churn cliff, which is why Maintenance Mode exists. Catalogue open question
#4 is the same question and it is currently unanswered. It has to be answered
before the first four-week plan can end. Recommendation in §4.

---

## 3. Named presets

### The naming convention — settled

**Every plan names a territory, not a result.** "The Sleep Reset" fits only the
person who asked for sleep; "The Night Reset" fits the one who asked for sleep,
the one who wakes at 3am and the one who cannot put the phone down. The goal
question is multi-select, so a name built from one goal is wrong for most of the
people who see it. A territory also promises nothing, which keeps the name clear
of principle 4.

**Every name ends in Reset**, so the plan points at the daily unit it is made of
and the set reads as a catalogue rather than as five unrelated products.

The reveal then carries the name and a line tying it back to what they picked:

```
        The Pressure Reset
  built around stress and your heart
     8 weeks · finishes Nov 11
          10 minutes a day
```

At most two goals are named on that line, the ranked one first. The preset was
chosen to cover the whole neighbourhood, so the line's job is to show the
connection — not to read five answers back at them.

Implemented in `src/lib/onboardingPreset.ts`.

### The catalogue

| Plan | Weeks | Goals routed to it |
| --- | --- | --- |
| **The Night Reset** | 4 | `sleep` |
| **The Morning Reset** | 4 | `energy` |
| **The Pressure Reset** | 8 | `stress_relief` · `calm_fast` · `emotional_balance` · `self_acceptance` · `heart_health` · `other` |
| **The Focus Reset** | 6 | `focus` · `daily_habit` |
| **The Quiet Reset** | 6 | `spiritual` · `self_care` · `yoga` |

Five, not the catalogue's six. `Calm Down Faster` folded into The Pressure Reset
— the same territory at a different timescale, and a whole preset for spike
management was always thin. `Rattle Less` retires: it was carrying five
unrelated goals and Pressure carries them honestly. `The Full Reset` stays
unreachable from onboarding — it is the graduate plan and opens at two sessions
a day, so it is never anyone's first. The two life plans (`One Clear Surface`,
`The Hard Thing First`) remain unrouted pending the procrastination tie-break.

Superseded from the catalogue doc:Two changes from the catalogue doc:Two changes from the catalogue doc: `Quiet Hour` is new, because `spiritual`,
`yoga` and `self_care` currently have no home and would otherwise fall to
`other`; and `heart_health` is routed to `Rattle Less` rather than getting a
plan of its own, because a heart-named plan invites a heart-numbered target and
that is the one thing the catalogue rules out.

`other` and a skipped intent resolve to `Rattle Less`, which is the broadest.

**Selection rule.** The primary intent narrows to a family; the
procrastination answers break the tie between the two life plans and their
breathing siblings; `growthArea` is the fallback for legacy users with no
intent stored. The plan is pre-selected and named with its reason — browsing is
the quieter second button. This is Runna's shape and the catalogue doc already
settles it.

---

## 4. Phases, the ladder, and the nameable climax

Runna's authority rests on base → build → peak → taper. Saying the structure
out loud is what makes a generated plan read as expertise, and it costs nothing
because the structure already exists — it is just unnamed.

Azora's three phases, in plain language, same names across every plan:

| Phase | What changes | What the user is told |
| --- | --- | --- |
| **Settle** | one reset, same technique, same time, every day | "Two weeks of the same thing at the same time. We are building the cue, not the skill." |
| **Deepen** | longer session, second technique enters, hold extends | "Now it gets longer. Your body already knows the shape." |
| **Carry** | guidance drops away — you run the reset yourself | "No voice, no timer. You already know how." |

**Every plan runs all three, including the four-week ones.** An earlier draft
had four-week plans stop at Deepen; that throws away the only nameable moment in
the plan, and a plan without one is a gradient. Week splits are authored per
plan — Night and Morning are 2/1/1, Focus and Quiet 2/2/2, Pressure 3/3/2 — so
the eight-week plan gets three weeks of settling and the four-week plan gets
two. The Full Reset adds a fourth, **Hold**, which is maintenance.

Shipped in `src/lib/onboardingPreset.ts` (`planPhases`, `planClimaxDay`) and
rendered above the notepad on the reveal.

**The climax has a name and a day.** Couch-to-5K's entire psychological
architecture hangs off W5D3 — the first twenty unbroken minutes. Every guide
names it; runners remember it years later. A plan with a nameable hardest moment
is more memorable than a plan with a smooth gradient.

Azora's is **the first unguided reset** — day 1 of Carry. It should be named on
the reveal screen, on day 1, weeks before it happens:

> Day 29 is the one to watch: you run the whole thing yourself, no voice.

That single line does more for week-one retention than any amount of copy about
week one, because it is the thing the user is now curious about.

It also answers catalogue open question #1 without measuring anything. Azora
cannot verify "sleeps better"; it can verify "ran their own reset, unguided,
for two weeks", which is observable from data already held. Duolingo's answer —
claim only what participation proves — and it is the correct one here.

**The rule of progression, stated in one sentence.** Runna says it out loud:
increases week by week, with a fixed ceiling on any single week, scaled to
current fitness. Azora's:

> Each phase adds about a minute a day, and never more than that in a week.
> Your starting length came from the time you said you had.

**What happens after the last week** (catalogue open question #4): the plan
enters **Hold** — the Carry-phase day, repeating, with no further escalation,
and the catalogue one tap away. Not a restart at higher dose, which punishes
finishing; not a dead end, which is Noom's cliff. Hold is Maintenance Mode, and
it should be authored once and shared by every plan.

---

## 5. The reveal screen

`RecommendedExerciseScreen` becomes the plan reveal. Read top to bottom:

```
           Your Personalized Sleep Plan
                  The Sleep Reset            <- shipped
              4 weeks · you finish Oct 14    <- still to build

  Because you said you are here to sleep better, and that
  you have already tried melatonin.

  ─────────────────────────────────────────────
  YOUR DOSE          7 minutes a day
  YOUR DAY           three things, the same three
  ─────────────────────────────────────────────

  Weeks 1–2  SETTLE     same reset, 9:30pm, every night
  Weeks 3–4  DEEPEN     longer, and the hold comes in
             ↑ Day 22 is the one to watch — you run it yourself

  ─────────────────────────────────────────────
  TODAY · DAY 1 · 1 of 3 already done

  ○  Relaxing Breath              9:30 PM  ✎
     because you said nights are where it goes wrong
  ○  Azora's reset                 1:00 PM  ✎
  ●  The Azora Protocol            7:00 AM  ✓ done in onboarding

  ○  Be in bed by the same time as last night
  ○  Put my phone down thirty minutes before bed
     because you said you sleep 5 to 6 hours

  ─────────────────────────────────────────────
  Miss a day and the plan waits. It does not move without you.

           [ Start my first reset ]
```

Component by component, and where each already exists:

1. **Name + horizon + date.** The two names ship in
   `src/lib/onboardingPreset.ts`; the horizon and date still need `startedOn`.
2. **One attribution sentence under the title.** `intentGoalPhrase` +
   `echoOption` on the `tried_*` answer. Both exist; the second is unread today.
3. **The dose block.** `plan.fullDailyMinutes` already computes this
   (`onboardingPlan.ts:266`) and nothing renders it.
4. **The phase ladder.** New. Static per preset — it is authored content, not
   computed.
5. **The climax line.** New. One authored string per preset plus a day number.
6. **Endowed head start.** See §7.
7. **Per-row attribution.** `because?: string` on `PlanAction`, exactly as
   `onboarding-personalization-plan.md` §6 specifies. Populate at the point each
   action is chosen in `buildOnboardingPlan`, and on `StarterPlanItem` at the
   point each candidate matches in `buildStarterPlan` — both functions already
   *know* the reason, they just discard it.
8. **The slack rule, stated.** New, one line. See §7.
9. **One CTA.** The teardowns all say it should start the first session rather
   than land on a dashboard. **Do not build that here without asking** — a
   guided first Reset inside onboarding was built twice on 2026-09-16 and
   reverted in full, and the reason was never recorded. Keep the existing
   destination; the CTA label is the only safe part of this to change.

**What comes off the screen.** The radar and its "With your plan" projection.
The ladder replaces it, and §7 explains why the projection has to go regardless.
The radar keeps its job one screen earlier on `diagnosis`, where it is honest.

---

## 6. Attribution map

The rule from `onboardingEcho.ts` holds throughout: an echo is a premise, never
an announcement; the fragment is authored next to the option; nothing is echoed
that the user did not choose; never echo the heavy answers.

Every parameter the plan exposes must trace to an answer:

| Plan parameter | Source answer | Reads as |
| --- | --- | --- |
| which preset | `primaryIntent` (+ procrastination areas for the life plans) | "Because you are here to sleep better" |
| why *this* plan and not what failed before | `tried_*` — **currently unread** | "You have already tried melatonin. This one is a cue, not a chemical." |
| daily dose | `dailyTime` | "Seven minutes, because that is what you said you had" |
| session time | `wakeTime` / `sleepTime` / intent daypart | "9:30pm, half an hour before you said you sleep" |
| primary technique | intent → `INTENT_TECHNIQUE` | "for the part where your mind speeds up as you lie down" |
| why the plan is short | `procrastinationReason` | "Kept short, since {reason}" — the one that already ships |
| todo rows | routine answers, per `buildStarterPlan`'s `matches` | "because you said you sleep 5 to 6 hours" |
| the plan's name in the user's mouth | the cost answer, `intentDepth3` | quoted once on `diagnosis`, per the screen map |

**The `tried_*` answer is the highest-value unused string in the funnel**, and
the evidence is unusually direct: in internet-delivered CBT trials, baseline
*treatment credibility and outcome expectancy* predicted completion, adherence
and dropout, at roughly 5–8% symptom reduction per point. Telling a user why
this differs from the thing that already failed them is not flourish — it is the
lever with the best-supported effect on whether they finish.

**Budget.** `onboarding-personalization-plan.md` §0 rule 3 caps echoes at three
in the whole flow, because frequency is what turns this into a parlour trick.
The reveal screen is the exception and should be argued for explicitly: it is
not an echo, it is a **bill of materials**. Runna reviewers credit the intake
quiz length for the feeling of ownership, and the mechanism is that the output
visibly contains the input. Attribution on the reveal reads as receipts on
purpose. Elsewhere in the flow, three total still holds.

**Caveat worth holding on to.** The evidence on personalization is weaker than
it feels. One SMART trial found tailoring to *perceived need* did not
significantly reduce disengagement; another RCT found users could not detect the
difference between an adapted and a control condition at all. The reliable win
is **visible** personalization — their number, their words, quoted back — not
backend adaptivity. This argues for spending effort on §5 and §6 before
spending it on a cleverer resolver.

---

## 7. Slack, endowment, and the number that has to go

**Endowed head start.** Nunes & Drèze ran a car wash loyalty card two ways: an
eight-stamp blank card, and a ten-stamp card with two stamps already given. Same
eight purchases required. Redemption was 34% against 19%, and faster.

It must be endowed with something real. Crediting the onboarding heart reading
as that day's Protocol would be false — the Protocol is the daily breath-hold
(`DailyBreathHoldPresentation.tsx:59`), and the reading is a camera pulse check.
Ticking one as the other is exactly the kind of flattering arithmetic principle
4 exists to stop.

The honest version endows the **plan counter**, not the daily counter: day 1 is
today rather than tomorrow, and the reading the user just did appears on today's
page as its own completed line — real, theirs, and effortful.

> Day 1 of 28 · started today
> ● Heart reading — done just now

**Slack, named.** WeightWatchers ships a weekly buffer of 14–35 points on top of
the daily budget; Runna builds deload weeks in; NRC ships seven named
miss-recovery scenarios. All three make the miss part of the plan rather than a
failure of it. Azora's slack already exists as a decision — `programDay` does
not advance on the calendar — but an invisible mechanic does no motivational
work. State it on the reveal, in one line, in the plan's own voice:

> Miss a day and the plan waits. It does not move without you.

This is also principle 3 restated: the plan is glad you came and never hurt that
you left. 75 Hard's restart-from-day-one rule is the anti-pattern, and its
dropout profile — motivation dying in weeks 2–3 — is what the rule buys.

**`projectScores` has to go.** It invents a +10 to +35 bump per axis with no
timeframe, no mechanism and no measurement, and renders it as a second polygon
labelled "With your plan" directly in front of the paywall. Principle 4 is
marked absolute and outranks the growth argument by its own terms.

Three options, in order of preference:

1. **Replace it with the ladder** (§5). The ladder is a real, authored,
   checkable claim about a schedule and it does the same "here is where this
   goes" work.
2. Keep the target polygon as an unnumbered *aim* — no pill, no axis values,
   labelled "where this plan is pointed". Weaker, but defensible.
3. Keep it and accept a documented exception. Not recommended; the subscription
   rests on the readings being believed, and one fabricated chart is enough to
   put the honest ones in doubt.

---

## 8. Conflicts to resolve before building

1. **Naming collision.** `The Azora Protocol` is the daily breath-hold action.
   The program layer must not reuse "Protocol", and the reveal shows both at
   once, so the distinction has to survive being adjacent on one screen.
2. **Principle 4 vs. the dated projection.** Resolved above by dating the
   *schedule* and never the *body*. Any future copy that attaches a date to a
   score reopens this.
3. **The seven-day horizon is load-bearing for the trial.** A four-week plan
   whose first visible payoff is in week 3 is worse for trial conversion than
   what ships today. Mitigation: the ladder must show week 1 as concrete and
   complete, phases named, and the climax day visible — the *shape* of four
   weeks sells during a seven-day trial precisely because the user can see past
   the trial. Runna's twelve-week plan sells on a two-week trial for this
   reason.
4. ~~**`DAILIES_PER_DAY` stays at three.**~~ *Resolved differently: the constant is gone, and the day's length comes from the plan's own day.*
   The endowed head start credits an existing slot; it does not add one.
5. **The reveal is the strongest paywall surface in the app.** Any change here
   is a monetization change and should be measured as one.

---

## 9. Sequencing

The catalogue needs preset revisions, a V3 plan blob, an advancement RPC and
safety gating before a single named plan can exist. That is steps 1–4 of the
catalogue doc's own sequencing and it is not a small amount of work.

**Most of the framing does not wait for any of it.** The following ship against
today's state, with no schema change and no enrollment model — a fixed-length
framing over the existing three-slot day:

| Slice | Contents | Needs |
| --- | --- | --- |
| **0a** | `because` on `PlanAction` and `StarterPlanItem`; render under each row | pure `src/lib` change + one prop |
| **0b** | Read the `tried_*` answer; one attribution sentence under the reveal title | `echoOption` on an existing question, plus `echo` fragments authored on those options |
| **0c** | Show the dose block — `fullDailyMinutes` is already computed and never rendered | one component |
| **0d** | Endowed head start: "Day 1 of 28 · started today", with the reading shown as its own done line | reveal copy only |
| **0e** | State the slack rule in one line | copy |
| **0f** | Retire `projectScores`; radar keeps its honest job on `diagnosis` | delete + one prop removal |
| **1** | ~~Name the plan~~ *(done — `onboardingPreset.ts`)*; date the horizon, still authored copy keyed off `primaryIntent`, no enrollment model behind it | `startedOn` |
| **2** | The phase ladder as static authored content per preset | authored strings |
| **3** | Real enrollment — catalogue steps 1–4 | the whole schema |

Slices 0a–0f are a day or two each, touch mostly `src/lib`, and together convert
"a plausible plan" into "an evidenced plan". Slice 1 is where the user can say
the plan's name out loud, and it is worth noting that **slice 1 does not require
slice 3** — a named, dated, four-week framing over the existing rotation is a
real product improvement and a real test of whether the naming moves activation,
before committing to the enrollment machinery.

If only one thing gets built: **0a + 0b**. Attribution is the cheapest large win
and it is the one with the best-evidenced link to completion.

---

## Appendix — evidence, graded

**Well supported**

- *Goal gradient / endowed progress.* Nunes & Drèze (2006): 34% vs 19%
  redemption, blank 8-stamp card vs 10-stamp card with 2 given. Kivetz,
  Urminsky & Zheng (2006) replicate the acceleration effect.
- *Treatment credibility and outcome expectancy predict adherence.* Internet-CBT
  RCTs; ≈5–8% symptom reduction per credibility point, and it predicts dropout.
  This is the evidential basis for §6.
- *Implementation intentions.* Gollwitzer & Sheeran (2006), d = 0.65 across ~94
  studies — **but** d ≈ 0.14–0.31 for physical activity specifically. "If it is
  9:30pm, then I do my reset" helps; do not plan against the headline number.
- *Linear over branching structure.* Duolingo's 2022 tree→path migration raised
  beginner completion; share of DAU with a 7+ day streak roughly tripled to over
  half of DAU. It also drew sustained backlash for removing choice — rigidity
  has a vocal cost even when it works.

**Directionally true, weakly sourced**

- Finite challenges completing at 60–75% vs 10–15% for open-ended courses. The
  direction matches everything else; the figure is a vendor blog and should not
  be quoted internally as though it were measured.
- 75 Hard's motivation collapse in weeks 2–3. Consistent across community
  reporting, not studied.

**Folk wisdom — do not build on these**

- "Streaks increase commitment 60%." Marketing copy, no study behind it.
- "A longer quiz causes retention." A longer quiz raises *conversion* through
  perceived effort and sunk cost. Those are different outcomes and conflating
  them will produce the wrong experiment.

**Useful context, not re-verified here**

- Fresh-start effect (Dai, Milkman & Riis 2014) — relevant to when a plan starts.
- Illusion of explanatory depth (Rozenblit & Keil 2002) — the flipside is the
  useful one: users *overestimate* how well they understand a mechanism, so a
  shallow-but-coherent story is enough and over-explaining is wasted. §2's one
  sentence is the right length. This is also the honest answer to the premise
  that a 28-day abs challenge works because it makes sense — it works because it
  is *legible*, not because it is *correct*, and legibility is cheap.
