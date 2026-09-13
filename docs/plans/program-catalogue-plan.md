# The Plan Catalogue

## Status

Proposed direction, not yet implemented. Decisions below are settled unless
marked **Open**. Written after research into Duolingo's Path, Ahead's journeys,
and Runna's training plans.

## The problem

Azora's horizon is exactly seven days, and says so out loud:

> Seven days is the whole horizon because the trial is seven days: anything that
> lands later is invisible to someone deciding whether to keep the app.
> — `src/lib/onboardingPlan.ts:9`

That reasoning is correct about the trial and wrong about the product. It buys a
good first week at the cost of ever being able to say "this is where you'll be in
two months." Nothing today progresses week over week. Day 40 looks like day 4
with a different technique in the slot, and a user who stays cannot name a single
thing the app is building toward.

Azora is prescriptive but not authoritative. It tells you what to do today. It
never tells you why today is different from last Tuesday.

## What the research says

Five mechanics carry across Duolingo, Ahead, and Runna:

1. **Fixed macro-structure, adaptive micro-content.** Duolingo's path order is
   non-negotiable; only item difficulty adapts in real time. Rigidity at the
   level of sequence, flexibility at the level of content.
2. **Named phases are free authority.** Runna shows Base/Build/Peak/Taper. Saying
   the structure out loud is what makes a generated plan read as expertise.
3. **Forgiveness with guardrails.** Runna caps reschedule at ±1 week and offers a
   defined 3–14 day reduced-intensity window. Unlimited shifting turns a plan
   into a random list.
4. **Diagnosis before content.** Ahead names your profile before showing a single
   activity, so everything after reads as prescribed. Azora already does this.
5. **Habits accumulate into a named artifact.** Ahead's journeys add life hacks
   and habits to a "Toolkit" the user can return to, so escalating habits read
   as a collection being built rather than a to-do list growing.

And the traps:

- Duolingo's tree→path migration drew sustained backlash for removing choice.
  Rigidity has a vocal cost even when it improves outcomes.
- Streaks decouple from motivation — users quit *while* maintaining streaks.
- A sharp diagnostic followed by generic content reads as templated. The
  assessment raises the bar the daily content then has to clear.

Runna's authority ultimately rests on race day: a dated external event that makes
twelve weeks cohere. Azora has no race day, and manufacturing one out of a
breath-hold number would violate `design.md`'s rule that Azora rewards
participation and never physiology. So the program's arc has to come from
somewhere else. See "Eight weeks, three phases" below.

## Decisions

### Six named plans, of four different lengths

The catalogue is authored, not derived. Six plans, each with a home technique
category and borrowed neighbours:

| Plan | Weeks | Phases | When | Home category |
| --- | --- | --- | --- | --- |
| The Sleep Reset | 4 | 2 | Evenings | sleep |
| Morning Engine | 4 | 2 | Mornings | energy |
| Calm Down Faster | 6 | 3 | Any time | calm |
| Steady Head | 6 | 3 | Daytime | focus |
| Rattle Less | 8 | 3 | Twice daily | balance |
| The Full Reset | 12 | 4 | Twice daily | all five |

Week-by-week technique assignments live in the catalogue document; every
technique named there exists in `techniques.ts` today.

**Length is the difficulty dial**, the way race distance is in Runna. The
lengths are not arbitrary and not round numbers — they are what the content
supply allows. There are fifteen techniques, distributed four calm, three
sleep, three focus, three energy, two balance. No plan can live inside one
category, and only a plan drawing on all five can spend nine weeks introducing
something new without repeating. That is why exactly one plan is twelve weeks.

A twelve-week Sleep plan is a content commission — roughly four new sleep
techniques — not a scheduling change.

### Recommended, with the catalogue one tap away

`resolveGrowthAreaAxis` already sorts users into calm, recovery, focus and
resilience from the assessment. That maps onto five of the six plans; **The
Full Reset is the one it must never recommend**, because it is the graduate
plan and it opens at two sessions a day.

Onboarding names the recommendation, gives the reason it was chosen, and
pre-selects it. Browsing is the quieter second button. This is Runna's shape:
the user chooses the goal, the app builds the plan.

### One plan at a time

Switching restarts the new plan at week 1 and does not preserve the old plan's
position, and the confirmation sheet says so plainly before it happens.
Per-plan saved progress is the obvious later upgrade, but it multiplies state
on every surface that reads program day, so it is out of scope for version one.

### Progression is participation only

What escalates: session count, session length, technique breadth, and the number
of life habits in the to-do list. What never escalates: any breath-hold target,
heart-rate target, HRV target, or Azora Score target. The program must never
prescribe a physiological outcome. This is not a style preference — it is
`design.md` principle 3, and a program that sets breath-hold targets is exactly
the failure mode it names.

### Prescriptive, adaptive — indexed by program day, not by date

The program advances on a `programDay` counter, not on the calendar. Miss a day
and the counter simply does not advance; you resume at the same place. There is
no "behind", no red dates, no backlog of missed sessions to feel bad about.

Runna needs dated calendars because a race is dated. Azora has no fixed endpoint,
so date-indexing would buy only guilt. Guardrails:

- `programDay` advances at most once per local calendar day, so three sessions in
  one evening does not skip a week.
- After three consecutive missed days, a realignment prompt offers *continue where
  you left off* or *drop back a week*. This is Runna's Plan Realignment, minus
  the dates.
- An explicit pause window (3–14 days) that holds the program without ending it.
- No skipping ahead. The sequence is the authority; that is the whole point.

### Sessions and habits both

Each phase boundary offers one new habit into the self-care to-do list, drawn
from the same answer-matching vocabulary as `buildStarterPlan`
(`src/lib/onboardingStarterPlan.ts`). Offered, accepted, and removable — the
to-do list stays the user's. Roughly: one habit at Settle, two more across Build,
one more at Carry.

### Surface

- **New Plan tab.** The full eight-week map, phases named, current week expanded,
  later weeks visible but closed. Seeing week 8 on day 1 is the authority claim,
  and it is a paywall asset for the seven weeks past the trial.
- **Home is unchanged in shape.** Today's dailies card gets the program's
  identity — "Build · Week 4 · Day 2" — and its slots are filled by the program
  rather than by the rolling seven-day plan. Home keeps owning "what now?".
- **Open:** which tab slot the Plan tab takes.

## What this breaks

Four couplings have to be handled, not discovered during implementation:

1. **`DAILIES_PER_DAY` is a constant.** `useDailiesCompletion` and the room's
   earn rule (`src/lib/room/dayCompletion`) both assume exactly three dailies per
   day. The Build phase has four and the Carry phase has three of a different
   shape. The daily count becomes a function of the program day, and every
   surface that counts dailies must read it from one place — which is what
   `useDailiesCompletion` already exists to guarantee.
2. **The stored plan blob.** `DailyPlanExercisesV2` holds a fixed seven-element
   `techniqueIds` tuple. V3 stores `{ planId, programDay, startedOn }` and
   derives the day's techniques from the plan definition rather than storing
   them. It must not assume a fixed week count or phase count — length and
   phase boundaries are read from the plan. Phased migration, the way the HRV
   removal was done — V2 reads keep working until every account is rebuilt.
3. **Safety gating does not exist yet.** A library that *offers* Wim Hof is a
   different claim from a plan that *schedules* it. Morning Engine week 3 and
   The Full Reset week 9 both need an explicit acknowledgement before they
   open. Nothing in the app does this today.
4. **`onboardingPlan.ts` builds the end-of-onboarding plan around the seven-day
   horizon.** The final onboarding screen has to present the eight-week program
   instead. That screen is also the strongest paywall surface in the app, so the
   copy work there is not incidental.

## Open questions

1. **How does "sleep better" get confirmed — or does it need to be?** The
   graduation is an outcome state, nothing in the app measures it, and the
   post-session mood check-in was built and removed. No researched product
   solves this for us. Runna's answer is race day, which we do not have.
   Ahead's weekly review is a summary of ongoing emotional check-ins, so it
   needs exactly the daily check-in data that was deliberately removed.
   Duolingo simply never makes an outcome claim — the unit is finished, and
   that is all it says.

   The cheapest resolution is to follow Duolingo: let Carry claim only what
   participation already proves. "You ran your own reset, unguided, for two
   weeks" is observable from data we hold and needs no new surface. A
   phase-boundary re-assessment — three or four onboarding questions at weeks
   2, 5 and 8 — remains possible, but it is a new surface with no precedent
   behind it, so it should be a deliberate choice rather than an assumed one.
2. **Plan names.** The six in the catalogue are placeholders.
3. **Tab slot** for the Plan tab.
4. **What happens at week 9?** Options: the program restarts at a higher starting
   dose; the app recommends the next axis (Duolingo's "finished course becomes
   maintenance loop"); or a permanent Carry state with no further structure.
   Deciding this later is fine — it is seven weeks past anyone's first payment —
   but not deciding it means week 8 is a cliff.

## Sequencing

1. Program domain: the eight-week structure, phases, and per-day slot derivation,
   as pure logic over the existing axis orderings. Testable with no UI.
2. `DailyPlanExercisesV3` and the phased migration.
3. Variable daily count through `useDailiesCompletion`, and the room earn rule
   reading from it.
4. Home's dailies card gains program identity.
5. The Plan tab and the eight-week map.
6. Onboarding's final screen presents the program.
7. Habit escalation at phase boundaries.
8. Phase-boundary re-assessment, once question 1 is answered.

Steps 1–4 are invisible to the user and are where the risk is. Step 5 is where
the authority actually lands.
