# Reset types and lesson pairing

Plan, 2026-10-01. Guided attention is built; writing and timed-action Resets
below remain proposals.

## Current short-reset plans

All latest plans prescribe breathing sessions of **one or two minutes**.
Night publishes revision 7; Morning, Pressure, Focus and Quiet publish revision
9; Home, Phone, Recovery and Self-trust publish revision 8. Pressure has
goal-specific lesson tracks (see [pressure lesson tracks](pressure-lesson-tracks.md)).
Earlier revisions remain available for stored enrollment history.

The latest editions (2026-10-10, see
[plan to-do step and light days](plan-todo-step-and-light-days.md)) are the
editions with more light days. Earlier easy-start and varied-workload schedules
remain published unchanged.

- **Day 1 has no Reset.** The day is a check-in, the lesson and one to-do. The
  first Reset arrives on day 2.
- **Days 2 to 5 hold at most one Reset.** The grounding day (day 3; Quiet day 5)
  is 5-4-3-2-1 on its own instead of breathing followed by 5-4-3-2-1.
- **Light days.** More later days have no Reset: check-in, lesson and to-do
  only. After the tool introductions, a light day can replace a tool practice
  day, but never the last day. Its lesson mentions no Reset, tool or breathing (checked by
  `lessonCatalogue.test.mjs`).
- **Single-Reset days.** Days not marked light or paired have one Reset. When an
  earlier pair included an attention tool, keep that tool on its own, except
  Quiet day 13 and Self-trust day 14 retain breathing to match `breath.exhale`.
  Paired days retain the first two activities from the preceding edition.
  No latest day asks for three Resets.

Counts include the Reset-free first day.

| Plan | No Reset | One Reset | Two Resets | Light days (including day 1) |
|---|---|---|---|---|
| Night (28) | 10 | 13 | 5 | 1, 10, 11, 14, 16, 18, 19, 21, 24, 26 |
| Morning (28) | 10 | 12 | 6 | 1, 9, 10, 13, 15, 16, 18, 19, 22, 25 |
| Focus (42) | 14 | 20 | 8 | 1, 9, 10, 13, 16, 18, 19, 24, 25, 28, 31, 32, 37, 40 |
| Home (28) | 10 | 12 | 6 | 1, 9, 10, 12, 15, 18, 19, 21, 24, 27 |
| Phone (28) | 10 | 12 | 6 | 1, 9, 12, 14, 15, 18, 19, 21, 22, 25 |
| Recovery (28) | 10 | 12 | 6 | 1, 9, 10, 13, 14, 16, 19, 21, 24, 27 |
| Self-trust (42) | 13 | 21 | 8 | 1, 13, 15, 16, 20, 21, 25, 26, 30, 34, 37, 39, 40 |
| Quiet (42) | 13 | 21 | 8 | 1, 15, 16, 18, 20, 24, 26, 27, 30, 33, 34, 37, 40 |
| Pressure (56), all three tracks | 18 | 28 | 10 | 1, 11, 15, 16, 18, 20, 21, 24, 26, 27, 36, 38, 41, 43, 44, 50, 52, 53 |

Lesson sequences, plan lengths, phase names and phase boundaries are unchanged.
New phase descriptions explain variation rather than increasing daily counts.
About 79–82% of each plan has zero or one Reset; occasional pairs continue into
the final week. About 31–36% have no Reset. Up to two light days can appear
together, but never three. Additional light days replace only single-Reset days
after day 8; introductions and pairs are unchanged. The 66 historical editions
keep their original content, including the previously published varied schedules.

**North Star note.** Days 1 to 7 now hold about 7 Resets, down from 9 (Night: 6,
down from 8). A trial starter who finishes every day of the first week does at
most 7 Resets in it, so "5+ Resets in 7 days" leaves less slack than before:
missing two plan days in week one now drops a user below the bar. Read the
metric with that in mind, or count plan days completed alongside it.

The seven short-reset plans introduce both attention Resets:

- **Day 3:** 5-4-3-2-1 on its own. Quiet keeps its introduction on day 5.
- **Day 6:** Muscle Release after the breathing session.
- **Day 8:** practise a pair. Breathing comes first, followed by a familiar
  attention Reset. Later days vary instead of making pairs the daily shape.
- **After day 10:** breathing and attention Resets return as single practices
  and occasional pairs, with regular light days between them.

Lessons name the Reset, explain the exact steps, and tell the reader how to
start the assigned session from Home. Tool introductions use plan-specific
lesson IDs and examples: a morning step, one work task, a household task,
a choice about scrolling, a comfortable low-energy practice, following through
without perfection, or quiet noticing. They share the same tool instructions
and the purpose sentences in `programResetPurpose.ts`; Morning does not
describe Muscle Release as an energy boost. Day 8 explains that already-tried
tools now appear regularly, rather than claiming they are new that day.
Lessons after tool introductions teach returning attention to the breathing
guide and using comfortable effort, rather than reviewing previous practice. Muscle
instructions use gentle movements, normal breathing, and an option to skip
anything painful. Grounding follows the actual player order: five things to
see, four to hear, three to touch, two to smell, and one to taste.

New enrollments use the latest published plan and lesson sequence. Existing
enrollments keep their stored activities and lesson IDs; updating the catalogue
does not rewrite a running plan. Older snapshots without stored lesson IDs
use the lesson schedule retained for their original preset revision. No
enrollment migration or backend contract change is needed. The sections below describe the earlier
design and future Reset types, not the exact current schedule. For that,
inspect `src/features/program/domain/programCatalogue.ts` and
`src/features/lessons/domain/lessonCatalogue.ts`.

Two changes to the first ten days of every plan:

1. **Resets that are not breathing.** Grounding, muscle release, writing,
   walking, focus blocks. Breathing stays the daily core, using only the
   techniques that already exist; no new breathing techniques. The new types
   are tools added around it.
2. **Lessons paired with Resets.** The lesson teaches a tool, the same day asks
   them to use it, and the next day's lesson opens by asking whether they did.

Breathing remains the machinery, not the pitch (see the Reset reframe). A plan
made of different kinds of Reset is what "a reset" means once it is more than
one technique.

---

## The pairing rule

Every tool day has three beats:

| beat | where | example (night, day 3–4) |
|---|---|---|
| **Teach** | the day's lesson | "Waking at 3am is normal. The replay is what keeps you up." |
| **Do** | a Reset on the same day | 5-4-3-2-1, practised once now, kept for tonight |
| **Ask** | the next day's lesson opens with it | "Did you wake last night? Did 5-4-3-2-1 help?" |

The lesson format already ends on one small action and checks it the next day
(`lesson-catalogue-plan.md`, "Interaction"). Pairing makes that action a real
Reset in the plan rather than a suggestion in prose.

Days without a new tool repeat the **home session**: the same breathing Reset
at the same hour every day. Habits form from the same action in the same
context (Lally et al. 2010), so the home session is the thing that becomes
automatic, and the tools are the novelty.

---

## The Reset types

Grouped by the screen that plays them. Four screens cover every type; each
type is a script, which is data, not a new screen.

### A. Guided attention (new modality: `attention`)

Step-by-step prompts on a timer, optional audio. Not in `ProgramModality` yet.

| Reset | What the user does | Length | Evidence | Plans | Paired lessons |
|---|---|---|---|---|---|
| **5-4-3-2-1** | Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste | 2–3 min | None. Widely used clinically, no controlled trial found | night, pressure, quiet, phone, selfTrust | `sleep.threeam`, `anger.recovery`, `quiet.notice`, `quiet.eyes`, `focus.pull` |
| **Muscle Release** | Squeeze one body part for 5 s, let go for 10 s, five parts | 2 min | Good. AASM 2021 insomnia guideline recommends relaxation therapy | night, pressure, recovery | `sleep.bed`, `sleep.wind`, `anger.cues`, `body.evening` |
| **Body Scan** | Attention moves slowly from feet to head | 3–10 min | Mixed. Balban 2023 found breathing beat mindfulness for mood | quiet, recovery | `quiet.bodyfirst`, `quiet.boredom`, `quiet.wander`, `quiet.beginner` |
| **Word Drift** | Picture unrelated objects one after another until sleep (cognitive shuffle) | in bed | Weak. A few small studies | night | `quiet.thoughts`, `anger.rumination` |

### B. Writing prompt (existing modality: `reflection`, `answer: 'text'`)

| Reset | What the user does | Length | Evidence | Plans | Paired lessons |
|---|---|---|---|---|---|
| **Brain Dump** | Write tomorrow's to-do list before bed | 5 min | One small study: fell asleep ~9 min faster (Scullin et al. 2018, n=57) | night, focus, pressure | `sleep.worry`, `focus.three` |
| **Thought Check** | Write the thought, the evidence for and against, a fairer version | 3–5 min | Strong as part of CBT, weaker alone | pressure, selfTrust | `anger.belief`, `quiet.story`, `quiet.thoughts` |
| **Kind Voice** | Write what you'd say to a friend in the same spot | 3 min | Moderate. Self-compassion meta-analysis (Ferrari et al. 2019) | quiet, selfTrust, recovery | `quiet.kind`, `quiet.voice`, `quiet.repair`, `plan.bad` |
| **Pressure Check** | Rate pressure 0–10 before and after the home session | 30 s | Self-report, honest by construction (principle 4) | pressure, quiet | `anger.meter` |

### C. Timed action (existing modalities: `movement`, `lifeAction`)

Start in the app, put the phone down, come back and confirm. Self-reported; no
step counting.

| Reset | What the user does | Length | Evidence | Plans | Paired lessons |
|---|---|---|---|---|---|
| **Daylight Walk** | Walk outside within an hour of waking | 5–10 min | Good. Morning light and walking both well studied | morning, recovery | `sleep.light`, `body.inertia`, `body.walk` |
| **Movement Break** | Stand, stretch, walk around | 2–5 min | Good. Breaking up sitting improves glucose (Dunstan et al. 2012) | morning, focus, pressure | `body.movement`, `body.sitting`, `body.dip` |
| **Focus Block** | One task, timer on, starts at 10 min and grows | 10–30 min | None for timeboxing specifically | focus, home | `focus.ready`, `focus.blocks`, `focus.switch`, `focus.stop`, `focus.done` |
| **Phone Away** | Phone in another room for the next block | with a block | Contested. Ward et al. 2017 found an effect, later replications did not | focus, phone | `focus.phone`, `focus.badges`, `focus.loop` |
| **Five-Minute Tidy** | Tidy only what you can see | 5 min | None | home | `focus.home`, `focus.visible`, `focus.return` |

### Not now

Wake-time anchor, caffeine cut-off, screen curfew. These are commitments, not
Resets: there is nothing to do in the moment, only a tick later. Leave them in
lessons until the four screens above are proven.

---

## Two new lessons

Day 1 of every plan explains the home session, so the user feels in a
minute what they just read.

| id | title | plans |
|---|---|---|
| `breath.exhale` | A long breath out slows you down | night, pressure, focus, quiet, home, phone, recovery, selfTrust |
| `breath.wake` | A quick breath in wakes you up | morning |

---

## The first ten days, per plan

Every day includes the home session. The **Reset** column is what is added.
Day 7 is the room-complete recap. Day 8 is where the plan grows, and it grows
by adding a different kind of Reset, not a second breathing session.

### night

| day | lesson | added Reset |
|---|---|---|
| 1 | `breath.exhale` *(new)* | |
| 2 | `plan.low` *(absorbs `plan.expect`)* | |
| 3 | `sleep.threeam` | 5-4-3-2-1, once now, kept for tonight |
| 4 | `plan.missed`, opens "Did you wake last night?" | |
| 5 | `sleep.bed` | home session done in bed |
| 6 | `sleep.worry` | Brain Dump |
| 7 | `plan.week` | recap |
| 8 | `plan.grows` | Muscle Release joins, daily from here |
| 9 | `sleep.wind` | Muscle Release |
| 10 | `sleep.caffeine` *(retitled: "Your afternoon coffee is still working at bedtime")* | their pick: 5-4-3-2-1 or Brain Dump |

### pressure

| day | lesson | added Reset |
|---|---|---|
| 1 | `breath.exhale` | |
| 2 | `plan.low` | |
| 3 | `anger.recovery` | 5-4-3-2-1 as the pause |
| 4 | `plan.missed`, opens "Did you use the pause?" | |
| 5 | `anger.meter` | Pressure Check around the home session |
| 6 | `anger.cues` | Muscle Release |
| 7 | `plan.week` | recap |
| 8 | `plan.grows` | Muscle Release joins |
| 9 | `anger.belief` | Thought Check |
| 10 | `body.movement` | Movement Break |

### focus

| day | lesson | added Reset |
|---|---|---|
| 1 | `breath.exhale` | |
| 2 | `plan.low` | |
| 3 | `focus.ready` | Focus Block, 10 min |
| 4 | `plan.missed`, opens "Did the block start?" | |
| 5 | `focus.phone` | Focus Block + Phone Away |
| 6 | `focus.three` | Brain Dump, three items only |
| 7 | `plan.week` | recap |
| 8 | `plan.grows` | Focus Block joins, 20 min |
| 9 | `focus.switch` | home session used as the way back in after an interruption |
| 10 | `body.dip` | Movement Break |

### quiet

| day | lesson | added Reset |
|---|---|---|
| 1 | `breath.exhale` | |
| 2 | `quiet.two` | |
| 3 | `quiet.bodyfirst` | Body Scan, 3 min |
| 4 | `plan.missed`, opens "How did the scan feel?" | |
| 5 | `quiet.notice` | 5-4-3-2-1 |
| 6 | `quiet.wander` | Body Scan |
| 7 | `plan.week` | recap |
| 8 | `plan.grows` | 5-4-3-2-1 joins *(Body Scan once built)* |
| 9 | `quiet.gap` | |
| 10 | `quiet.beginner` | 5-4-3-2-1 *(`quiet.moving` and the Daylight Walk follow on day 11 once the timed-action screen exists)* |

### morning

| day | lesson | added Reset |
|---|---|---|
| 1 | `breath.wake` *(new)* | |
| 2 | `body.inertia` | |
| 3 | `sleep.light` | Daylight Walk |
| 4 | `plan.missed`, opens "Did you get outside?" | |
| 5 | `sleep.anchor` | |
| 6 | `body.movement` | Movement Break |
| 7 | `plan.week` | recap |
| 8 | `plan.grows` | Daylight Walk joins |
| 9 | `sleep.caffeine` | |
| 10 | `body.dip` | Movement Break, afternoon |

home, phone, recovery and selfTrust follow the same pattern from the paired
lessons column above, once the types they need exist.

---

## Catalogue changes, days 1–10

What changes in `programCatalogue.ts` (`NIGHT_BLOCKS`, `PRESSURE_BLOCKS`, …).
Breathing uses existing activities only.

**Three rules:**

1. **One short home session, not a daily rotation.** Days 1–10 repeat one
   breathing Reset, and **every breathing Reset is 1 or 2 minutes**. Days 1–3
   are 1 minute; from day 4 the length alternates. Where it steps up, the step
   is a longer breath out (Stress Relief 4-6 to Tension Release 4-8), never a
   longer plan. Growth in time comes from the tools.
2. **Tools are added on lesson days**, never instead of the home session.
3. **Day 8 grows by a tool, not by a second breathing slot.** Pressure moves
   its growth from day 10 to day 8 so every plan grows on the same day.

Tool days need one-day blocks, since a rotation position cannot be empty.

### night

Built in revision 2. Brain Dump on day 6 waits for the writing prompt screen.

| day | today | revision 2 |
|---|---|---|
| 1 | Stress Relief 2m | Stress Relief 2m |
| 2 | Grounding Reset 3m | Stress Relief 2m |
| 3 | Tension Release 3m | Stress Relief 2m · **5-4-3-2-1** 2m |
| 4 | Sleep Reset 3m | Stress Relief 2m |
| 5 | Stress Relief 4m | Stress Relief 2m |
| 6 | Balance Reset 3m | Stress Relief 2m |
| 7 | Tension Release 3m | Tension Release 3m *(longer breath out: the step up)* |
| 8 | Stress Relief 2m · Tension Release 3m | Tension Release 3m · **Muscle Release** 6m |
| 9 | Grounding Reset 3m · Sleep Reset 3m | Tension Release 3m · Muscle Release 6m |
| 10 | Balance Reset 3m · Evening Reset 4m | Tension Release 3m · 5-4-3-2-1 2m |

### pressure

Built in revision 2. Pressure Check (day 5) and Thought Check (day 9) wait for
the writing prompt screen, Movement Break (day 10) for the timed action
screen; 5-4-3-2-1 holds days 9 and 10 until then.

| day | today | revision 2 |
|---|---|---|
| 1 | Stress Relief 2m | Stress Relief 2m |
| 2 | Grounding Reset 3m | Stress Relief 2m |
| 3 | Tension Release 3m | Stress Relief 2m · **5-4-3-2-1** 2m |
| 4 | Balance Reset 3m | Stress Relief 2m |
| 5 | Stress Relief 4m | Stress Relief 2m |
| 6 | Tension Release 3m | Stress Relief 2m · **Muscle Release** 6m |
| 7 | Balance Reset 3m | Tension Release 3m *(longer breath out: the step up)* |
| 8 | Tension Release 5m | Tension Release 3m · Muscle Release 6m |
| 9 | Grounding Reset 3m | Tension Release 3m · 5-4-3-2-1 2m |
| 10 | Tension Release 3m · Stress Relief 2m | Tension Release 3m · 5-4-3-2-1 2m |

### focus

| day | today | proposed |
|---|---|---|
| 1 | Focus Reset 3m | Focus Reset 3m |
| 2 | Concentration Reset 4m | Focus Reset 3m |
| 3 | Focus Reset 5m | Focus Reset 3m · **Focus Block** 10m |
| 4 | Grounding Reset 3m | Focus Reset 3m |
| 5 | Concentration Reset 4m | Focus Reset 3m · Focus Block 10m + **Phone Away** |
| 6 | Focus Reset 3m | Focus Reset 3m · **Brain Dump** (three items) 2m |
| 7 | Balance Reset 3m | Focus Reset 3m |
| 8 | Focus Reset 3m · Concentration Reset 4m | Focus Reset 3m · Focus Block 20m |
| 9 | Concentration Reset 4m · Balance Reset 3m | Focus Reset 3m · Focus Block 20m |
| 10 | Focus Reset 5m · Grounding Reset 3m | Focus Reset 3m · **Movement Break** 3m |

### quiet

Built in revision 2. Body Scan (days 3, 6, 8, 9) waits for build step 4 and
Daylight Walk (day 10) for the timed action screen; 5-4-3-2-1 holds days 8 to
10 until then. Days 8 to 10 read `plan.grows`, `quiet.gap`, `quiet.beginner`.

| day | today | revision 2 |
|---|---|---|
| 1 | Grounding Reset 3m | Grounding Reset 3m |
| 2 | Stress Relief 4m | Grounding Reset 3m |
| 3 | Balance Reset 3m | Grounding Reset 3m |
| 4 | Cooling Reset 3m | Balance Reset 3m |
| 5 | Stress Relief 4m | Balance Reset 3m · **5-4-3-2-1** 2m |
| 6 | Steady Rhythm 5m | Balance Reset 3m |
| 7 | Balance Reset 5m | Balance Reset 3m |
| 8 | Balance Reset 3m · Grounding Reset 3m | Balance Reset 3m · 5-4-3-2-1 2m |
| 9 | Grounding Reset 3m · Stress Relief 4m | Balance Reset 3m · 5-4-3-2-1 2m |
| 10 | Balance Reset 5m · Cooling Reset 3m | Balance Reset 3m · 5-4-3-2-1 2m |

### morning

| day | today | proposed |
|---|---|---|
| 1 | Grounding Reset 3m | Morning Reset 3m |
| 2 | Morning Reset 3m | Morning Reset 3m |
| 3 | Focus Reset 3m | Morning Reset 3m · **Daylight Walk** 5m |
| 4 | Morning Reset 5m | Morning Reset 3m |
| 5 | Concentration Reset 4m | Morning Reset 3m |
| 6 | Morning Reset 3m | Morning Reset 3m · **Movement Break** 3m (afternoon) |
| 7 | Focus Reset 3m | Morning Reset 3m |
| 8 | Morning Reset 3m · Focus Reset 3m | Morning Reset 3m · Daylight Walk 10m |
| 9 | Morning Reset 5m · Concentration Reset 4m | Morning Reset 3m · Daylight Walk 10m |
| 10 | Focus Reset 3m · Balance Reset 3m | Morning Reset 3m · Movement Break 3m (afternoon) |

### Day 11 onward

Unchanged except the second position: its breathing rotation becomes a
rotation of the tools that plan has taught, so a tool learned in week one does
not vanish on day 11. Third positions stay as authored.

Built for night, pressure and quiet: roughly one entry in three of every
day-11+ second-position rotation is Muscle Release (night, pressure) or
5-4-3-2-1 (quiet). The last day of night and quiet's day 11 are one-day blocks
and stay breathing.

**Breathing length.** Every breathing Reset in revision 2 is 1 or 2 minutes,
for the whole plan. Revision 1's later blocks use 3–8 minute breathing
activities (`relaxing.4`, `extended-exhale.5`, `night-settle.4`,
`sleep-descent.5`, `resonance.5`, `coherent-6.5`, `coherent-6.8`, `box.5`,
`deep-box.5`, `morning-charge.5`, `triangle.4`, and the `.3` lengths);
revision 2 swaps each for a `.1` or `.2` activity of the same technique. These
are new lengths of existing techniques, not new techniques.

- **Days 1–3:** every breathing Reset is 1 minute, so the first wins are as
  easy as they get.
- **From day 4:** the lengths alternate, authored in the block rotations, never
  computed. A day of two or more Resets pairs a 1-minute with a 2-minute; a lone
  breathing Reset beside a 2-minute tool is the 1-minute one; days of one
  breathing Reset take turns. Each plan lands at roughly half and half.
- **Slow patterns stay at 2 minutes.** A technique gets a 1-minute version only
  if one minute fits at least four full breaths (`getRoundsDurationOptions`).
  4-7-8 (19 s a breath, 3 in a minute) and Deep Box (24 s, 3 in a minute) do
  not, so they are 2 minutes everywhere.
- Attention Resets (5-4-3-2-1, Muscle Release) stay 2 minutes; they are
  scripted.

### Code changes this implies

1. `programActivity.ts`: add an `attention` modality (scripted steps on a
   timer) and a timed-action delivery for `movement` / `lifeAction`.
   `reflection` already exists.
2. `ACTIVITIES`: add the tool activities, e.g. `attention.54321.2`,
   `attention.muscle-release.2`, `reflection.brain-dump.3`.
3. First 10 days of each `*_BLOCKS` rewritten as above.
4. `programCatalogue.test.mjs`: "every day asks for something yesterday did
   not" and "an identical day never comes back inside three days" both fail on
   days 1–2. Scope them to day 11 onward, or to non-home positions.
5. `LESSON_SEQUENCES`: pin days 1–10 per the lesson tables above.
6. Completion: tool activities have no `breathing_sessions` row, so they need
   their own completion record. Any table change is a migration: write it, do
   not run it.
7. **Name clash:** belly breathing is already called "Grounding Reset". The new
   one ships as "5-4-3-2-1", never "Grounding".

---

## Build order

1. **Guided attention screen** with 5-4-3-2-1 and Muscle Release. Covers night,
   pressure and quiet, the tool days that matter most. **Built**: both
   activities ship in revision 2 of night, pressure and quiet, and `plan.grows`
   moved to day 8 for those three.
2. **Writing prompt screen**: Brain Dump, Thought Check, Kind Voice, Pressure
   Check. The `reflection` modality is already typed.
3. **Timed action screen**: Focus Block, Phone Away, Daylight Walk, Movement
   Break.
4. Body Scan, Word Drift, Five-Minute Tidy.

Ship step 1 with the night plan's day 1–10 pairing and A/B test it against the
current night plan on 5-in-7.

## Prerequisites

- **North Star wording.** "5+ breathing sessions in 7 days" undercounts a plan
  with grounding on day 3. Redefine as 5+ Resets before shipping step 1.
- **Variety test.** The catalogue test "every day asks for something yesterday
  did not" fails a repeated home session. Change it to apply to the added Reset
  and the lesson, not the home session.
- **Lesson pins.** Days 1–10 need fixed lessons per plan; `LESSON_SEQUENCES`
  is currently ordered for variety. The rest of each sequence is unchanged.
- **Copy.** User-facing names use "Reset", never "breathwork" or "exercise".

## Open questions

- Does a tool day count as done when only the home session is finished, or
  only when the added Reset is too? Proposed: the home session plus the lesson
  completes the day; the added Reset is part of the day but missing it does not
  hold back the room object on days 1–7.
- Audio for the guided attention scripts, or text only for v1?
