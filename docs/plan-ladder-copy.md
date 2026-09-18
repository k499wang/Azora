# Plan ladder copy

Every line the plan screen says, for all five plans. Generated from
`src/lib/onboardingPreset.ts` and `src/features/program/domain/programCatalogue.ts`;
this file is a readable dump of them for copy review. Regenerate rather than
hand-edit, because editing here does not change the app.

## One name, five plans

Every plan is **The Azora Protocol**. The five ids below are what the plan
*contains*, never what it is called: a user choosing between five titles is
browsing, and the whole frame of the app is that they are doing one practice.
What differs between two people's Protocol is its days and its outcome line.

## What the ladder is

Not a description of a fixed routine. A plan moves in two directions at once,
and the ladder is how both are said out loud:

- **It grows.** Every plan starts on a single short reset. A second joins in
  week 2, and a third arrives in the middle. The number of resets is the
  escalation, and it only ever goes up.
- **It varies.** What fills each of those slots changes daily. A block of the
  plan holds a *rotation* per slot rather than one exercise, walked one step a
  day, so a stretch of days shares a purpose without being the same day over and
  over. A test holds the floor: **every day asks for something yesterday did
  not**, across block boundaries included.

The three steps are what those stretches feel like, grounded in the mechanism,
and what the user gets for getting through them.

| step | what it describes | what it promises |
| --- | --- | --- |
| **Settling in** | the day the plan runs today, in its own numbers | the earliest thing they will feel |
| **When it starts to stick** | what this stretch is, and the mechanism under it | *"By here you should be noticing…"* |
| **By the end of it** | what N weeks of it produces | *"Expect…"*, the concrete outcomes |

Every step pays out twice: a benefit in the person, and a room for Azo.

### The benefits named, per plan

| plan | what they are told to expect |
| --- | --- |
| night | falls asleep faster, wakes rested more often, lower resting heart rate |
| morning | coffee later or not at all, shallower afternoon dip, steadier all-day energy |
| pressure | longer fuse, quicker recovery, lower resting heart rate, less carried over |
| focus | longer stretches of focus, less afternoon lost, better recall, steadier deadlines |
| quiet | deeper sitting, no guilt about the time, calmer baseline, more patience |

### The room maths is real

A room is seven slots (`lib/room/roomProgress.ts`), one filled per finished day, and
a missed day pauses the sequence rather than leaving a hole. So a week of the plan
is a room, and the ladder counts them off the plan's own length: night and morning
run 4 weeks, focus and quiet 6, pressure 8.

## Voice rules, enforced by tests

- **No em dashes.** Anywhere in what the screen says.
- **Long, coherent sentences.** Clauses joined with *and*, *so*, *which*, *rather
  than*. Not clipped fragments cut to the same length.
- **Say the mechanism.** Cortisol, sleep onset, alertness, attention and recall.
- **Name the benefit.** Step two opens *"By here you should…"*, step three opens
  *"Expect…"*. A payoff line that only describes the app is not doing its job.
- **Say the plan's own numbers, and only this stretch's.** The first step quotes
  day one's length, read from the catalogue. It used to quote the session length
  the user picked in the assessment, which the plan has not used since it started
  authoring its own days, and then briefly quoted the weeks the plan grows in,
  which is a stretch the reader is not in.
- Contractions where they read naturally. Second person throughout.

Tests hold all of this: a sentence of 20+ words must exist, longest minus shortest
must be at least 10 words, nothing over 36 words, no em dashes, the later steps
must open with the benefit framing, and no rung may name a week past its own.

## Typography

Four treatments in a card, down from nine. One accent (blue), one body size.

| slot | treatment |
| --- | --- |
| step name | `body.large` semibold, blue |
| meta, weeks and dates on one line | `caption1` semibold, secondary |
| what the weeks are like | body 16, regular, secondary |
| what you get | body 16, semibold, blue |

## What the screen shows, top to bottom

1. Title, "Your personalized plan"
2. Subtitle, Your **The Azora Protocol**, built around <goals>. *(name in blue)*
3. Radar chart, legend, growth-area note
4. **Goal banner**, axis, `current → target`, `by <date>`, proof line
5. **The ladder**, three cards
6. Horizon, "Your N-week plan to improve <axis>" and "X minutes a day"
7. Azo aside, the notepad, "Miss a day and the plan waits."

The notepad carries only what the plan asks for now: day one's rows, at their
time of day. The hours the plan grows into are still written from the same
answers, silently, because asking again in week five would be asking about a
routine they have since changed. Each row names day one's exercise — the
rotation moves it tomorrow — and the note under the page says so: "Each day
brings a different reset."

**No rung, row or line names a week it is not in.** The ladder briefly told week
one which week a second reset joined and which week a third did. That is a
promise about a day the user has not reached: it puts a fortnight of work in
front of somebody who has not done day one, and it turns the stretch they are
actually in into a warm-up for a later one. A test holds it: no rung may name a
week past its own `endWeek`.

Dates below assume a 17 Sep start.

---

## night

*4 weeks, 4 rooms. Sample goal: sleep.*  
**Outcome** Fall asleep faster, and wake less.  
**Proof** Paced breathing before bed helps people fall asleep up to 37% faster.  
**Finishes** 14 Oct

**Day one** 1 reset, 2 min. **Biggest day** 3, 9 min. **Grows** to 2 on day 8 (week 2), to 3 on day 18 (week 3). *(Internal. No screen says this.)*

### The notepad onboarding hands over

| slot | exercise | when in the day |
| --- | --- | --- |
| session | Stress Relief, 2 min | the hour they chose |

### The first two weeks, day by day

| day | what the plan asks for |
| --- | --- |
| 1 | Stress Relief 2m |
| 2 | Grounding Exercise 3m |
| 3 | Tension Release 3m |
| 4 | Sleep Reset 3m |
| 5 | Stress Relief 4m |
| 6 | Balance Reset 3m |
| 7 | Tension Release 3m |
| 8 | Stress Relief 2m · Tension Release 3m |
| 9 | Grounding Exercise 3m · Sleep Reset 3m |
| 10 | Balance Reset 3m · Evening Reset 4m |
| 11 | Balance Reset 3m · Sleep Reset 3m |
| 12 | Stress Relief 2m · Evening Reset 4m |
| 13 | Grounding Exercise 3m · Tension Release 5m |
| 14 | Stress Relief 4m · Sleep Reset 3m |

### The last three days

| day | what the plan asks for |
| --- | --- |
| 26 | Stress Relief 2m · Balance Reset 5m · Sleep Preparation 5m |
| 27 | Grounding Exercise 3m · Steady Rhythm 8m · Sleep Reset 3m |
| 28 | Stress Relief 2m · Steady Rhythm 5m · Sleep Preparation 5m |

### Settling in

*Weeks 1–2 · 17 Sep – 30 Sep*

Everything in your plan comes from research on paced breathing, and the doses are kept low on purpose. Your day is one short reset of about 2 minutes, at the time you chose a moment ago, and a different one each day.

**Most people are dropping off faster by the end of the second week, and every day you complete puts another piece into Azo's room.**

### When it starts to stick

*Week 3 · 1 Oct – 7 Oct*

The one that closes the day is built for the hour before sleep rather than adapted to it. Slow breathing at a fixed hour is what teaches the body to expect sleep, and by now most people stop weighing up whether to do it at all.

**By here the nights should be noticeably steadier, with fewer wakings and mornings that feel less like a fight, and Azo has three rooms filled from the days you have finished.**

### By the end of it

*Week 4 · 8 Oct – 14 Oct*

Four weeks of consistent practice is roughly where a paced wind-down stops being something you have added to the evening and starts being the thing that ends it.

**Expect to fall asleep faster than you did when you started, to wake rested more often than not, and a resting heart rate a little lower than the one you measured today. Azo finishes with four rooms.**


---

## morning

*4 weeks, 4 rooms. Sample goal: energy.*  
**Outcome** Start the day awake, without forcing it.  
**Proof** A few minutes of faster paced breathing raises alertness with no crash after it.  
**Finishes** 14 Oct

**Day one** 1 reset, 3 min. **Biggest day** 3, 13 min. **Grows** to 2 on day 8 (week 2), to 3 on day 18 (week 3). *(Internal. No screen says this.)*

### The notepad onboarding hands over

| slot | exercise | when in the day |
| --- | --- | --- |
| session | Grounding Exercise, 3 min | the hour they chose |

### The first two weeks, day by day

| day | what the plan asks for |
| --- | --- |
| 1 | Grounding Exercise 3m |
| 2 | Morning Reset 3m |
| 3 | Focus Reset 3m |
| 4 | Morning Reset 5m |
| 5 | Concentration Reset 4m |
| 6 | Morning Reset 3m |
| 7 | Focus Reset 3m |
| 8 | Morning Reset 3m · Focus Reset 3m |
| 9 | Morning Reset 5m · Concentration Reset 4m |
| 10 | Focus Reset 3m · Balance Reset 3m |
| 11 | Morning Reset 3m · Grounding Exercise 3m |
| 12 | Morning Reset 5m · Balance Reset 3m |
| 13 | Focus Reset 3m · Stress Relief 4m |
| 14 | Morning Reset 3m · Concentration Reset 4m |

### The last three days

| day | what the plan asks for |
| --- | --- |
| 26 | Focus Reset 5m · Steady Rhythm 5m · Stress Relief 4m |
| 27 | Morning Reset 3m · Concentration Reset 4m · Balance Reset 3m |
| 28 | Morning Reset 5m · Steady Rhythm 5m · Grounding Exercise 3m |

### Settling in

*Weeks 1–2 · 17 Sep – 30 Sep*

Everything in your plan comes from research on paced breathing, and the doses are kept low on purpose. Your day is one short reset of about 3 minutes, at the time you chose a moment ago, and a different one each day.

**The lift lands early, usually inside the first week, and every day you complete puts another piece into Azo's room.**

### When it starts to stick

*Week 3 · 1 Oct – 7 Oct*

The settling one lands after the charge rather than before it. Faster paced breathing raises alertness and circulation within a few minutes, and once that lands at the same hour each day your body starts doing some of the waking up for you.

**By here you should notice you are reaching for coffee later than you used to, and that the afternoon dip is shallower than it was, and Azo has three rooms filled.**

### By the end of it

*Week 4 · 8 Oct – 14 Oct*

By four weeks the reset is less a thing you do in the morning than the way your morning opens, which is the point at which it stops needing willpower.

**Expect steadier energy across the whole day rather than a spike and a crash, and a way of starting that does not depend on how well you slept. Azo finishes with four rooms.**


---

## pressure

*8 weeks, 8 rooms. Sample goal: stress_relief.*  
**Outcome** A longer fuse, and a quicker recovery once the day turns.  
**Proof** Five minutes a day of slow breathing cuts cortisol by up to 25%.  
**Finishes** 11 Nov

**Day one** 1 reset, 2 min. **Biggest day** 3, 11 min. **Grows** to 2 on day 10 (week 2), to 3 on day 30 (week 5). *(Internal. No screen says this.)*

### The notepad onboarding hands over

| slot | exercise | when in the day |
| --- | --- | --- |
| session | Stress Relief, 2 min | the hour they chose |

### The first two weeks, day by day

| day | what the plan asks for |
| --- | --- |
| 1 | Stress Relief 2m |
| 2 | Grounding Exercise 3m |
| 3 | Tension Release 3m |
| 4 | Balance Reset 3m |
| 5 | Stress Relief 4m |
| 6 | Tension Release 3m |
| 7 | Balance Reset 3m |
| 8 | Tension Release 5m |
| 9 | Grounding Exercise 3m |
| 10 | Tension Release 3m · Stress Relief 2m |
| 11 | Balance Reset 3m · Grounding Exercise 3m |
| 12 | Tension Release 5m · Cooling Exercise 3m |
| 13 | Stress Relief 4m · Balance Reset 3m |
| 14 | Steady Rhythm 5m · Stress Relief 4m |

### The last three days

| day | what the plan asks for |
| --- | --- |
| 54 | Steady Rhythm 5m · Stress Relief 4m · Grounding Exercise 3m |
| 55 | Balance Reset 5m · Tension Release 3m · Cooling Exercise 3m |
| 56 | Steady Rhythm 8m · Balance Reset 3m · Grounding Exercise 3m |

### Settling in

*Weeks 1–3 · 17 Sep – 7 Oct*

Everything in your plan comes from research on paced breathing, and the doses are kept low on purpose. Your day is one short reset of about 2 minutes, at the time you chose a moment ago, and a different one each day.

**Heart rate starts dropping inside the first minute of a reset, so you will feel something on day one, and every day you complete puts another piece into Azo's room.**

### When it starts to stick

*Weeks 4–6 · 8 Oct – 28 Oct*

One of them is a cooling reset, for the days that run hot rather than fast. Around five minutes a day of slow breathing is where the research shows lower cortisol, and it works best when the hour is fixed rather than saved for the days that go badly.

**By here you should be noticing real differences in your stress, a longer fuse on the difficult days and a quicker recovery once one has passed, and Azo has six rooms filled.**

### By the end of it

*Weeks 7–8 · 29 Oct – 11 Nov*

After eight weeks the reset is no longer something you remember to do. It is what you reach for when the day turns, which is the whole reason the hour was fixed in the first place.

**Expect a lower resting heart rate, less carried from one day into the next, and a way of bringing yourself down that works in a room full of people. Azo finishes with eight rooms.**


---

## focus

*6 weeks, 6 rooms. Sample goal: focus.*  
**Outcome** Sit down to work without waiting to feel ready.  
**Proof** A 90-second paced reset sharpens attention, and lower anxiety improves recall.  
**Finishes** 28 Oct

**Day one** 1 reset, 3 min. **Biggest day** 3, 13 min. **Grows** to 2 on day 8 (week 2), to 3 on day 22 (week 4). *(Internal. No screen says this.)*

### The notepad onboarding hands over

| slot | exercise | when in the day |
| --- | --- | --- |
| session | Focus Reset, 3 min | the hour they chose |

### The first two weeks, day by day

| day | what the plan asks for |
| --- | --- |
| 1 | Focus Reset 3m |
| 2 | Concentration Reset 4m |
| 3 | Focus Reset 5m |
| 4 | Grounding Exercise 3m |
| 5 | Concentration Reset 4m |
| 6 | Focus Reset 3m |
| 7 | Balance Reset 3m |
| 8 | Focus Reset 3m · Concentration Reset 4m |
| 9 | Concentration Reset 4m · Balance Reset 3m |
| 10 | Focus Reset 5m · Grounding Exercise 3m |
| 11 | Deep Focus 5m · Focus Reset 3m |
| 12 | Concentration Reset 4m · Grounding Exercise 3m |
| 13 | Focus Reset 5m · Balance Reset 3m |
| 14 | Deep Focus 5m · Concentration Reset 4m |

### The last three days

| day | what the plan asks for |
| --- | --- |
| 40 | Focus Reset 5m · Steady Rhythm 5m · Concentration Reset 4m |
| 41 | Deep Focus 5m · Focus Reset 5m · Grounding Exercise 3m |
| 42 | Concentration Reset 4m · Balance Reset 3m · Steady Rhythm 5m |

### Settling in

*Weeks 1–2 · 17 Sep – 30 Sep*

Everything in your plan comes from research on paced breathing, and the doses are kept low on purpose. Your day is one short reset of about 3 minutes, at the time you chose a moment ago, and a different one each day.

**Starting gets easier within days rather than weeks, and every day you complete puts another piece into Azo's room.**

### When it starts to stick

*Weeks 3–4 · 1 Oct – 14 Oct*

This is the stretch where focus starts holding past the session itself. A short paced reset measurably sharpens attention, and lowering anxiety is what improves recall, so running one before you start does more than settle your nerves.

**By here you should be holding focus for longer stretches, losing less of the afternoon, and finding that what you read actually stays put. Azo has four rooms filled.**

### By the end of it

*Weeks 5–6 · 15 Oct – 28 Oct*

Six weeks in, the reset is less a warm-up than the thing that gets you started at all, which matters more on the days you do not feel like starting.

**Expect to sit down to work without waiting to feel ready, to lose fewer hours to a wandering head, and to walk into exams or deadlines steadier. Azo finishes with six rooms.**


---

## quiet

*6 weeks, 6 rooms. Sample goal: self_care.*  
**Outcome** Somewhere quiet you can reach at will.  
**Proof** Slow, paced breathing is the best studied route into meditative focus.  
**Finishes** 28 Oct

**Day one** 1 reset, 3 min. **Biggest day** 3, 14 min. **Grows** to 2 on day 8 (week 2), to 3 on day 22 (week 4). *(Internal. No screen says this.)*

### The notepad onboarding hands over

| slot | exercise | when in the day |
| --- | --- | --- |
| session | Grounding Exercise, 3 min | the hour they chose |

### The first two weeks, day by day

| day | what the plan asks for |
| --- | --- |
| 1 | Grounding Exercise 3m |
| 2 | Stress Relief 4m |
| 3 | Balance Reset 3m |
| 4 | Cooling Exercise 3m |
| 5 | Stress Relief 4m |
| 6 | Steady Rhythm 5m |
| 7 | Balance Reset 5m |
| 8 | Balance Reset 3m · Grounding Exercise 3m |
| 9 | Grounding Exercise 3m · Stress Relief 4m |
| 10 | Balance Reset 5m · Cooling Exercise 3m |
| 11 | Stress Relief 4m · Balance Reset 3m |
| 12 | Balance Reset 5m · Grounding Exercise 3m |
| 13 | Steady Rhythm 5m · Cooling Exercise 3m |
| 14 | Stress Relief 4m · Balance Reset 3m |

### The last three days

| day | what the plan asks for |
| --- | --- |
| 40 | Steady Rhythm 5m · Balance Reset 3m · Grounding Exercise 3m |
| 41 | Balance Reset 5m · Stress Relief 4m · Grounding Exercise 3m |
| 42 | Steady Rhythm 8m · Balance Reset 5m · Grounding Exercise 3m |

### Settling in

*Weeks 1–2 · 17 Sep – 30 Sep*

Everything in your plan comes from research on paced breathing, and the doses are kept low on purpose. Your day is one short reset of about 3 minutes, at the time you chose a moment ago, and a different one each day.

**The first few will feel like time you have taken from something else, and every day you complete puts another piece into Azo's room.**

### When it starts to stick

*Weeks 3–4 · 1 Oct – 14 Oct*

The longest sitting of the day runs to eight minutes here. Slowing the breath is the oldest and best studied way into meditative focus, and after a fortnight of it at the same hour you stop having to justify the time to yourself.

**By here the sitting should be going deeper and the guilt around taking it should be largely gone, and Azo has four rooms filled from the days you have finished.**

### By the end of it

*Weeks 5–6 · 15 Oct – 28 Oct*

Six weeks in, the sitting is not time you carve out of the day so much as a part of how the day is shaped.

**Expect a calmer baseline rather than a calm that only lasts the session, more patience with the people around you, and somewhere quiet you can reach at will. Azo finishes with six rooms.**



---

## Open notes

- The benefit lines are the strongest claims on the screen. They are hedged
  ("should be", "most people") rather than guaranteed, but they are still claims
  about outcomes, and they are what an activation test will be measured against.
- The dates are calendar dates, but the plan advances on days done, so a real run
  drifts later than the ladder says. The plan screen shows weeks only for exactly
  this reason.
- The proof figures (37%, 25%) are repeated from the goal-select value points, so
  the two screens cite the same evidence. If one moves, move both.
- A rotation is walked by the day's index inside its block, and every slot is
  walked by the *same* index. So a day is a pairing somebody authored rather than
  one the arithmetic produced: the lead and the closer move together.
- Two tests hold the variety: a day must ask for something yesterday did not, and
  an identical day may not return inside three days. Both run across block
  boundaries, which is where a restarting rotation would otherwise collide with
  the tail of the block before it.
- **Known gap.** The three hours are handed out in a fixed order: position one
  takes the session hour, position two midday, position three the wind-down. For
  the night plan the session hour is already the evening, so a two-exercise day
  puts its second reset at midday, earlier than its first. The catalogue authors
  days in time order, so the slot mapping should sort by the hour rather than by
  a fixed list.
