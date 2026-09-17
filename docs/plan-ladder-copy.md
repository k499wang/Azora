# Plan ladder copy

Every line the plan screen says, for all five plans. Source of truth is
`src/lib/onboardingPreset.ts`; this file is a readable dump of it for copy review.
Regenerate rather than hand-edit, because editing here does not change the app.

## What the ladder is

Not a mechanical progression. The app does not change the plan week to week, and
none of this copy claims it does. The three steps are what the weeks actually feel
like, grounded in the mechanism, and what the user gets for getting through them.

| step | what it describes | what it promises |
| --- | --- | --- |
| **Settling in** | low doses, it takes reminding | the earliest thing they will feel |
| **When it starts to stick** | the mechanism, and why a fixed hour matters | *"By here you should be noticing…"* |
| **By the end of it** | what N weeks of practice produces | *"Expect…"*, the concrete outcomes |

Every step pays out twice: a benefit in the person, and a room for Azo.

### The benefits named, per plan

| plan | what they are told to expect |
| --- | --- |
| Night | falls asleep faster, wakes rested more often, lower resting heart rate |
| Morning | coffee later or not at all, shallower afternoon dip, steadier all-day energy |
| Pressure | longer fuse, quicker recovery, lower resting heart rate, less carried over |
| Focus | longer stretches of focus, less afternoon lost, better recall, steadier deadlines |
| Quiet | deeper sitting, no guilt about the time, calmer baseline, more patience |

### The room maths is real

A room is seven slots (`lib/room/roomProgress.ts`), one filled per finished day, and
a missed day pauses the sequence rather than leaving a hole. So a week of the plan
is a room, and the ladder counts them off the preset's own length:

| plan | weeks | rooms |
| --- | --- | --- |
| Azora’s Night Reset | 4 | 4 |
| Azora’s Morning Reset | 4 | 4 |
| Azora’s Pressure Reset | 8 | 8 |
| Azora’s Focus Reset | 6 | 6 |
| Azora’s Quiet Reset | 6 | 6 |

Nothing here needs building. It is the loop the app already runs, said out loud on
the screen where someone is deciding to start.

## Voice rules, enforced by tests

- **No em dashes.** Anywhere in what the screen says.
- **Long, coherent sentences.** Clauses joined with *and*, *so*, *which*, *rather
  than*. Not clipped fragments cut to the same length.
- **Say the mechanism.** Cortisol, sleep onset, alertness, attention and recall.
- **Name the benefit.** Step two opens *"By here you should…"*, step three opens
  *"Expect…"*. A payoff line that only describes the app is not doing its job.
- Contractions where they read naturally. Second person throughout.

Tests hold all of this: a sentence of 20+ words must exist, longest minus shortest
must be at least 10 words, nothing over 36 words, no em dashes, and the later steps
must open with the benefit framing.

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
2. Subtitle, We recommend the **<plan name>** plan for you, built around <goals>. *(plan name in blue)*
3. Radar chart, legend, growth-area note
4. **Goal banner**, axis, `current → target`, `by <date>`, proof line
5. **The ladder**, three cards
6. Horizon, "Your N-week plan to improve <axis>" and "N minutes a day"
7. Azo aside, the daily plan list, "Miss a day and the plan waits."

Reset counts, minutes and dates below are samples. At runtime they come from the
plan the user just built. Dates assume a 17 Sep start.

---

## Azora’s Night Reset

*4 weeks, split 2 / 1 / 1. 4 rooms. Sample goal: sleep.*

**Goal banner** — Sleep quality `42 → 78` **by 14 Oct**  
**Proof** — Paced breathing before bed helps people fall asleep up to 37% faster.

### Settling in

*Weeks 1–2 · 17 Sep – 30 Sep*

Everything in your plan comes from research on paced breathing, and the doses start low on purpose. You start with three short resets that come to about 8 minutes across the day, at the times you chose a moment ago.

**Most people are dropping off faster by the end of the second week, and every day you complete puts another piece into Azo's room.**

### When it starts to stick

*Week 3 · 1 Oct – 7 Oct*

Slow breathing at a fixed hour is what teaches the body to expect sleep, and by around the third week most people stop weighing up whether to do it at all.

**By here the nights should be noticeably steadier, with fewer wakings and mornings that feel less like a fight, and Azo has three rooms filled from the days you have finished.**

### By the end of it

*Week 4 · 8 Oct – 14 Oct*

Four weeks of consistent practice is roughly where a paced wind-down stops being something you have added to the evening and starts being the thing that ends it.

**Expect to fall asleep faster than you did when you started, to wake rested more often than not, and a resting heart rate a little lower than the one you measured today. Azo finishes with four rooms.**

---

## Azora’s Morning Reset

*4 weeks, split 2 / 1 / 1. 4 rooms. Sample goal: energy.*

**Goal banner** — Energy `38 → 74` **by 14 Oct**  
**Proof** — A few minutes of faster paced breathing raises alertness with no crash after it.

### Settling in

*Weeks 1–2 · 17 Sep – 30 Sep*

Everything in your plan comes from research on paced breathing, and the doses start low on purpose. You start with three short resets that come to about 7 minutes across the day, at the times you chose a moment ago.

**The lift lands early, usually inside the first week, and every day you complete puts another piece into Azo's room.**

### When it starts to stick

*Week 3 · 1 Oct – 7 Oct*

Faster paced breathing raises alertness and circulation within a few minutes, and once that lands at the same hour each day your body starts doing some of the waking up for you.

**By here you should notice you are reaching for coffee later than you used to, and that the afternoon dip is shallower than it was, and Azo has three rooms filled.**

### By the end of it

*Week 4 · 8 Oct – 14 Oct*

By four weeks the reset is less a thing you do in the morning than the way your morning opens, which is the point at which it stops needing willpower.

**Expect steadier energy across the whole day rather than a spike and a crash, and a way of starting that does not depend on how well you slept. Azo finishes with four rooms.**

---

## Azora’s Pressure Reset

*8 weeks, split 3 / 3 / 2. 8 rooms. Sample goal: stress_relief.*

**Goal banner** — Calm `35 → 76` **by 11 Nov**  
**Proof** — Five minutes a day of slow breathing cuts cortisol by up to 25%.

### Settling in

*Weeks 1–3 · 17 Sep – 7 Oct*

Everything in your plan comes from research on paced breathing, and the doses start low on purpose. You start with three short resets that come to about 8 minutes across the day, at the times you chose a moment ago.

**Heart rate starts dropping inside the first minute of a reset, so you will feel something on day one, and every day you complete puts another piece into Azo's room.**

### When it starts to stick

*Weeks 4–6 · 8 Oct – 28 Oct*

Around five minutes a day of slow breathing is where the research starts to show lower cortisol, and it works best when the hour is fixed rather than saved for the days that go badly.

**By here you should be noticing real differences in your stress, a longer fuse on the difficult days and a quicker recovery once one has passed, and Azo has six rooms filled.**

### By the end of it

*Weeks 7–8 · 29 Oct – 11 Nov*

After eight weeks the reset is no longer something you remember to do. It is what you reach for when the day turns, which is the whole reason the hour was fixed in the first place.

**Expect a lower resting heart rate, less carried from one day into the next, and a way of bringing yourself down that works in a room full of people. Azo finishes with eight rooms.**

---

## Azora’s Focus Reset

*6 weeks, split 2 / 2 / 2. 6 rooms. Sample goal: focus.*

**Goal banner** — Focus `44 → 79` **by 28 Oct**  
**Proof** — A 90-second paced reset sharpens attention, and lower anxiety improves recall.

### Settling in

*Weeks 1–2 · 17 Sep – 30 Sep*

Everything in your plan comes from research on paced breathing, and the doses start low on purpose. You start with three short resets that come to about 9 minutes across the day, at the times you chose a moment ago.

**Starting gets easier within days rather than weeks, and every day you complete puts another piece into Azo's room.**

### When it starts to stick

*Weeks 3–4 · 1 Oct – 14 Oct*

A short paced reset measurably sharpens attention, and lowering anxiety is what improves recall, so running one before you start does more than settle your nerves.

**By here you should be holding focus for longer stretches, losing less of the afternoon, and finding that what you read actually stays put. Azo has four rooms filled.**

### By the end of it

*Weeks 5–6 · 15 Oct – 28 Oct*

Six weeks in, the reset is less a warm-up than the thing that gets you started at all, which matters more on the days you do not feel like starting.

**Expect to sit down to work without waiting to feel ready, to lose fewer hours to a wandering head, and to walk into exams or deadlines steadier. Azo finishes with six rooms.**

---

## Azora’s Quiet Reset

*6 weeks, split 2 / 2 / 2. 6 rooms. Sample goal: self_care.*

**Goal banner** — Stillness `47 → 80` **by 28 Oct**  
**Proof** — Slow, paced breathing is the best studied route into meditative focus.

### Settling in

*Weeks 1–2 · 17 Sep – 30 Sep*

Everything in your plan comes from research on paced breathing, and the doses start low on purpose. You start with three short resets that come to about 5 minutes across the day, at the times you chose a moment ago.

**The first few will feel like time you have taken from something else, and every day you complete puts another piece into Azo's room.**

### When it starts to stick

*Weeks 3–4 · 1 Oct – 14 Oct*

Slowing the breath is the oldest and best studied way into meditative focus, and after a fortnight of it at the same hour you stop having to justify the time to yourself.

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
- Nothing on the ladder requires a progression engine. It describes the plan the
  app runs today: the same resets daily, and the room loop paying out.
- The dates are calendar dates, but the room loop waits on a missed day, so a real
  run drifts later than the ladder says.
- The proof figures (37%, 25%) are repeated from the goal-select value points, so
  the two screens cite the same evidence. If one moves, move both.

