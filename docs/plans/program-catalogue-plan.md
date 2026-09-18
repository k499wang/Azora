# The Plan Catalogue

## Status

Proposed direction, not yet implemented. Decisions below are settled unless
marked **Open**. Written after research into Duolingo's Path, Ahead's journeys,
and Runna's training plans.

This document owns product behavior and rollout intent. The canonical storage,
versioning, and compatibility contract lives in `program-catalogue-schema.md`;
the onboarding-to-compiler contract lives in
`onboarding-personalization-plan.md`.

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

### Plans first; personalization compiles them

The eight plans below are authored presets. Personalization chooses and resolves
a preset; it does not generate a novel program from loose rules. Every
published preset has an immutable revision containing its duration, phases,
day sequence, allowed substitutions, safety fallbacks, and authored rationale.
Changing any of those publishes a new revision so an enrolled user's accepted
plan never changes underneath them.

Starting a plan collects a small, goal-specific profile. Sleep Reset asks about
sleep timing and the kind of sleep problem; Steady Head asks about the task,
main interruption, and preferred block; One Clear Surface asks about the
surface, zone, and practical constraints. The universal assessment can
recommend a plan family, but it must not pretend that the same answers fully
personalize every outcome.

Enrollment compiles the preset revision, profile, safety eligibility, and user
choices into a resolved snapshot. That snapshot freezes activity revisions,
variants, durations, schedule, fallbacks, accepted habit offers, and the reason
each choice was made. Runtime screens read it instead of re-running current
recommendation rules against old answers. Full types and rollout behavior live
in `program-catalogue-schema.md`.

### Initial authored presets

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

**Length expresses the behavior-change progression**, the way race distance
does in Runna. It is not constrained by the number of breathing techniques.
Purposeful repetition, lighter fallbacks, yoga, stretching, movement,
reflection, and life actions may all occupy authored days without changing the
program model. The phase outcome determines the length; content supply does not.

### Two life plans ship in release one through user-owned habit offers

The cleaning and discipline plans do not require a second todo system.
Onboarding already hands a user a list of todos it wrote: `OnboardingFlow.tsx:848`
calls `createSelfCareGoals.mutateAsync(starterPlanDraftList())`, and the rows
come back as ordinary user-owned `self_care_goals`. A life plan can seed its
habits through the same user-owned system at plan start. Acceptance creates an
ordinary `self_care_goals` row with `source_enrollment_id` and a stable
`source_action_id`; a unique source key makes creation idempotent. Every
accepted habit counts toward the decoration because todos already do.

| Plan | Weeks | Phases | Seeds | Home category |
| --- | --- | --- | --- | --- |
| One Clear Surface | 6 | 3 | 1 habit, re-scoped each phase | calm |
| The Hard Thing First | 4 | 2 | 1 habit, fixed | focus |

**One Clear Surface** borrows its shape from two places. The week is a zone,
which is FlyLady's rotation — kitchen, then the surface you drop things on, then
the floor, and so on — so the plan moves through the home instead of asking for
"cleaning" in the abstract. The day is an order, which is the Dana White five
things: trash, dishes, laundry, things that have a home, things that do not.
An order is exactly what a program day is, so the fit needs no adaptation.

Escalation is scope, never effort. Phase 1 is one surface. Phase 2 is one
surface plus a five-minute reset of the same zone. Phase 3 is the zone. The
timer is never the thing that grows, because a longer timer is the first thing
someone drops.

**The Hard Thing First** is about starting, not about tidying. One named task,
chosen by the user at plan start, done before anything else in the day. Phase 1
asks only that it is named the night before; phase 2 asks that it is started.
Starting counts — finishing is not the unit, because the plan is treating
avoidance, not productivity.

**What the breathing does in a life plan.** These are not todo plans with
breathing bolted on. The hand-picked session sits immediately before the habit
and is chosen to make starting easier — calm techniques for One Clear Surface,
focus techniques for The Hard Thing First. That is the actual product claim:
the reset is the thing that gets you moving, and the habit is the proof it
worked.

**Hard rules, from the research and from `design.md`.**

- Nothing decays. Tody's dirt-accumulation curve is the single most
  motivating mechanic in the category and the single most punishing; a user who
  opens the app after two weeks must not find a worse room than they left.
  This is the same rule as `programDay` not advancing on the calendar.
- No damage, ever. Habitica's HP loss for missed dailies is the named
  anti-pattern. Mochi reacts to presence, never absence.
- The word never appears. These plans are designed for the way an
  executive-function problem actually behaves — smallest possible unit, order
  supplied, no accumulation — and they say none of that on screen.
- Seeded habits are the user's from the moment they exist. Editable,
  reorderable, archivable. The plan never silently re-adds one the user removed.

At a phase boundary the plan offers the re-scoped habit. It never swaps or
rewrites the user's row. This is the only meaning of “plan-authored habit” in
version one: authored offer, user-owned todo.

### Activities are modality-neutral

Programs prescribe stable activity references, not React screens or breathing
database records. Supported kinds begin with breathing, breath hold, yoga,
stretching, mobility, workout, reflection, and life action. Each modality owns
its delivery details and completion adapter behind the shared prescription
boundary. Adding a modality must not change published preset revisions or old
enrollment snapshots.

### Recommended, with the catalogue one tap away

`resolveGrowthAreaAxis` can provide the initial recommendation for a legacy
user. New users are recommended from their chosen outcome and its goal-specific
profile. **The Full Reset must never be recommended as a first plan**, because
it is the graduate plan and opens at two sessions a day.

Onboarding names the recommendation, gives the reason it was chosen, and
pre-selects it. Browsing is the quieter second button. This is Runna's shape:
the user chooses the goal, the app builds the plan.

### One resolved enrollment at a time

Switching creates a newly resolved enrollment at week 1 and does not preserve
the old plan's position, and the confirmation sheet says so plainly before it
happens. It does not mutate the abandoned snapshot or completion history.
Per-plan saved progress is the obvious later upgrade, but it multiplies state
on every surface that reads program day, so it is out of scope for version one.

### Long-term progression is participation only

The full catalogue may eventually escalate session count, session length,
technique breadth, and offered life habits. Version one changes technique and
duration while keeping the existing three-slot day and user-owned todo list.
What never escalates: any breath-hold target,
heart-rate target, HRV target, or Azora Score target. The program must never
prescribe a physiological outcome. This is not a style preference — it is
`design.md` principle 3, and a program that sets breath-hold targets is exactly
the failure mode it names.

Gamification follows the same rule. Nothing decays, no missed action damages
Mochi or the room, and there is no missed-day debt. Existing streaks,
decorations, and history remain intact. Rewards acknowledge participation,
never absence or physiology.

### Prescriptive, adaptive — indexed by program day, not by date

The program advances on a `programDay` counter, not on the calendar. Miss a day
and the counter simply does not advance; you resume at the same place. There is
no "behind", no red dates, no backlog of missed sessions to feel bad about.

Runna needs dated calendars because a race is dated. Azora has no fixed endpoint,
so date-indexing would buy only guilt. Guardrails:

- `programDay` advances at most once per local calendar day, so three sessions in
  one evening does not skip a week.
- Realignment and explicit pause controls are later enhancements. Version one
  simply waits on the current program day, regardless of the gap.
- No skipping ahead. The sequence is the authority; that is the whole point.

### Three session slots stay fixed; life-plan habits use the existing todo path

The first catalogue release replaces the Hand-picked slot's rolling-plan
technique with the current program day's technique. Guided Reset remains the
assessment recommendation and the Protocol remains the breath-hold activity.
It keeps the existing three daily slots and user-owned self-care list. This
removes the highest-risk coupling from the initial release: no variable reward
denominator and no second goal lifecycle. The two life plans may offer their
single habit through the existing todo creation path. After acceptance it is an
ordinary editable/removable `self_care_goal`; the plan never silently re-adds a
rejected, removed, or archived habit.

### Activities can extend beyond breathing

A program schedules a modality-neutral activity, not necessarily a
`BreathingTechnique`. Breathing, yoga, mobility, stretching, meditation,
reflection, and life actions share stable identity, duration, intensity,
completion semantics, constraints, and fallbacks; each modality owns a typed
delivery payload. Movement sequences record steps, side, duration or
repetitions, transitions, body region, position, equipment, and accessible
modifications.

Reusable activity content stays separate from its program prescription. A yoga
flow can appear at different times or durations without being copied, and a
chair or joint-safe variant can be resolved without changing the preset's
purpose. New modalities extend this boundary rather than adding fields to
breathing patterns.

Users may move an activity in time, select an authored equivalent, or reduce
duration or intensity. They may not bypass contraindications, exceed authored
maximums, or substitute arbitrary content while retaining the plan's claim. If
there is no safe authored fallback, enrollment stops and explains why; it never
silently removes the activity.

### Surface

- **New Plan tab.** The selected plan's full map, phases named, current week
  expanded, and later weeks visible but closed. Seeing the endpoint on day 1 is
  the authority claim and makes the weeks beyond a trial visible.
- **Home is unchanged in shape.** Today's dailies card gets the program's
  identity — "Build · Week 4 · Day 2" — and its Hand-picked slot comes from the
  program rather than the rolling seven-day plan. Home keeps owning "what now?".
- **Open:** which tab slot the Plan tab takes.

## What this breaks

Four couplings have to be handled, not discovered during implementation:

1. ~~**`DAILIES_PER_DAY` stays constant for version one.**~~ *Resolved differently: the constant is gone. The day is as long as the plan says, and `countDayCompletion` takes a total rather than assuming one.* The catalogue supplies
   the Hand-picked technique; Guided Reset and the Protocol keep their current
   completion rules. Escalation changes that program technique and its duration,
   not the number of reward requirements. Variable day size is deferred until
   it has a concrete product need and can be tested as its own change.
2. **The stored plan blob.** `DailyPlanExercisesV2` holds a fixed seven-element
   `techniqueIds` tuple. V3 identifies the immutable preset and resolver
   revisions, stores a resolved enrollment snapshot, and tracks
   `programDay`/`lastAdvancedOn`. It must not assume fixed week or phase counts.
   V1/V2 decoders remain permanent, and legacy users opt in rather than being
   rewritten automatically.
3. **Safety gating does not exist yet.** A library that *offers* Wim Hof is a
   different claim from a plan that *schedules* it. Morning Engine week 3 and
   The Full Reset week 9 both need an explicit acknowledgement before they
   open. Nothing in the app does this today.
4. **`onboardingPlan.ts` builds the end-of-onboarding plan around the seven-day
   horizon.** The final onboarding screen has to present the selected multi-week program
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
4. **What happens after a plan's final week?** Options: the program restarts at a higher starting
   dose; the app recommends the next axis (Duolingo's "finished course becomes
   maintenance loop"); or a permanent Carry state with no further structure.
   Deciding this later is fine — it is seven weeks past anyone's first payment —
   but it must be decided before the first four-week plan can end.

5. **RESOLVED — defer the mindmap rename until after V3 migration.** The mind
   map itself is recomputed, but `growthAreaAxis` is persisted on V2 plan blobs.
   If an old name becomes invalid first, the current sanitizer discards the V2
   plan, including the axis and `startsOn`, before migration can map them.

   The real work is that **the new axes cannot be computed from anything the
   database holds.** `getSavedOnboardingProfile`
   (`onboardingStatusService.ts:157`) selects exactly `stress_level`,
   `sleep_quality` and `agreement_responses`. `sleepDuration`, `wakeEase`,
   `routineHappiness`, `procrastinationAreas` and `procrastinationReasons` are
   collected in onboarding and then discarded — there is no column for any of
   them, and no other table holds them. Space and Rhythm are scored entirely
   from answers that are thrown away.

   So the order is: support V3 migration while the legacy axis union remains
   permanently readable; add the columns and write them on onboarding
   completion; then add scoring; then rename. A rename is not a
   remap — `resilience` carries the wimhof/bhastrika/morning-charge ordering,
   which has nothing to do with routine consistency, and `breathEase` carries
   resonance/coherent-6, which has nothing to do with tidying. Each new axis
   needs its technique ordering written fresh, not inherited from the axis whose
   name it took.

   Existing users have no answers for the new axes and never will. Their V3 plan
   is selected through the explicit legacy-axis mapping. Space and Rhythm render
   as not assessed until the user supplies the missing inputs; a re-ask is a
   separate surface.
6. **RESOLVED — only one plan is active.** Switching marks the old enrollment
   abandoned and starts the new plan at Day 1. Completion history and the
   resolved snapshot remain readable; resuming the old position is deferred.
7. **RESOLVED — todos are not program slots in version one.** Existing todo
   completion and room-reward behavior stays unchanged.
8. **RESOLVED — keep three dailies per day in version one.** Variable counts are
   not required to prove that the catalogue works.
9. **DEFERRED — notifications.** Revisit after the plan ships.

## Todos remain separate from program sessions

The existing todo system already has stable goal rows, per-date completion
records, toggle mutations, and a room-reward latch. Version one does not change
that system. Todos continue to contribute through `todosDone`; program session
slots contribute through `dailiesDone`, so an item cannot be counted twice.

## Existing users on upgrade — opt in, never auto-migrate

The automatic migration described in the historical analysis below is
superseded. V1/V2 users remain on the working rotation in **legacy mode** until
they explicitly accept a named plan. The invitation may use their stored axis
to recommend one, but it shows the duration, Day 1 start, resolved activities,
safety substitutions, and any habit offer before confirmation.

On opt-in, the new resolved enrollment starts at program day 1 on that local
date. It does not reuse legacy `startsOn` or credit rotating sessions as program
progress. All sessions, daily activity, streaks, todos, todo completions, room
state, decorations, entitlements, and analytics history remain intact.

V1/V2 decoders and their axis union remain permanent. Unsupported or corrupt
V3, a missing immutable preset revision, failed safety resolution, or a failed
write falls back to the last valid enrollment or legacy mode. Older clients
leave newer blobs untouched.

### Historical migration analysis (retained for rationale)

The migration this needs has already been done once in this repo, which is the
main reason to be calm about it. `useDailyExercisePlan.ts:66` rebuilds any V1
plan into a V2 plan in place, reusing the stored `startsOn` so the upgrade does
not restart anyone's rotation, and persists the result once per payload via a
`persistenceKey` guard. `shouldRebuildDailyPlanAsV2`
(`dailyExercisePlan.ts:507`) is the whole rule: rebuild when the slot is empty,
corrupt, or on an older pool — and leave a *newer* version alone, so a client
that gets rolled back never overwrites a plan written by a newer build. V3 keeps
that shape exactly.

**There is no progress to lose.** `resolveDailyExerciseTechniqueId`
(`dailyExercisePlan.ts:547`) indexes by `elapsedDays % 7` off a calendar date.
A user ninety days in has been replaying the same seven techniques thirteen
times; nothing records which day of a program they are on, because there is no
program. So the migration is not "preserve their position" — there is no
position. It is "give them a starting point that does not feel like a demotion."

**The rule for existing users:** rebuild into the recommended plan for the axis
already stored on their V2 plan (`growthAreaAxis` is right there — no need to
   re-derive from onboarding answers), and start them at program day 1. V3
   `startedOn` is the migration's current local date because that is when the
   new program begins. Streaks, history and the room remain untouched — none of
   those read the plan blob.

**Why day 1 and not credit for time served:** the plan's authority comes from
the phases being real. Dropping a ninety-day user into week 7 of a program they
never did hands them the hardest content with none of the build-up, and the
first thing they see is a map that is mostly greyed out behind them, which
reads as "you missed it." Day 1 with a named plan and a visible path ahead is a
better screen than a late week of a plan they have no memory of. Frame it as new:
the plan is new, so their start is new.

**The one thing that genuinely changes behaviour:** program-day indexing means
a skipped day no longer advances the plan. Today, missing Tuesday means you
never see Tuesday's technique. After this, missing Tuesday means Tuesday's
session is what you get on Wednesday. Existing users who skip will notice their
dailies feel "stuck" relative to before. That is the intended behaviour and the
reason for the change, but it is the one migration effect worth naming in
release notes rather than shipping silently.

**Sequencing the write.** First ship a release that can read V3 but continues to
write V2. In the following release, enable V2-to-V3 migration and V3 writes.
The `unsupported` branch means an old client seeing a V3 blob leaves it alone
rather than clobbering it. Keep the legacy V2 decoder permanently so a dormant
account can migrate whenever it returns.

**Advancing safely.** The client never increments `programDay` with a direct
read-modify-write. A small Supabase RPC locks the user's preference row and
advances only when `lastAdvancedOn` differs from the completed local date and
the expected `programDay` still matches. The trigger is completion of the
Hand-picked program session, not whole-day completion, so personal todos never
block program progress. The RPC
updates `programDay` and `lastAdvancedOn` together and returns the canonical V3
blob. Retries and two devices are therefore idempotent. The mutation writes the
returned value into the query cache.

**Paid users mid-cycle.** Anyone already subscribed keeps everything. Do not
retroactively lock a paying or trialling account out of anything it could reach
yesterday. If a future free tier needs grandfathering, use an explicit
server-side access cohort or entitlement; account creation date is not a reliable
proxy for purchase rights.

## Sequencing

1. Author immutable preset/activity revisions and pure goal-profile resolvers;
   keep serving and writing V2.
2. Ship permanent V1/V2 readers, a V3 reader, and legacy fallback; still write
   V2 only.
3. Add enrollment storage and the atomic advancement RPC behind a flag. Test
   retries, two devices, missing revisions, and rollback.
4. Enable explicit legacy-user opt-in and new-user resolved enrollment. Every
   accepted plan starts Day 1; failure leaves the prior experience intact.
5. Add program identity to Home, then the Plan tab and map, without changing
   the three-slot reward denominator.
6. Add the two life-plan habit offers through the provenance-aware user-owned
   todo path.
7. Add yoga/stretching only through the modality-neutral activity and safety
   boundaries.
8. Separately save inputs needed by settled Space/Rhythm scoring. Rename axes
   only after permanent legacy decoding is safe.
9. Consider variable daily counts, automatic re-resolution, reassessment, and
   pause/realignment after the core is stable.

Steps 1–4 are the reliability boundary. Everything deferred can ship without
changing the preset-revision or resolved-enrollment contracts.
