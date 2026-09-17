# Plan ladder copy

Every line the plan screen says, for all five plans. Source of truth is
`src/lib/onboardingPreset.ts`; this file is a readable dump of it for copy review.
Regenerate rather than hand-edit — editing here does not change the app.

## The three steps

The same three everywhere, named in plain words, and each one visibly does
something the last one did not:

| step | what changes | session |
| --- | --- | --- |
| **Build the habit** | the time gets fixed | what they chose |
| **Go longer** | the dose goes up | +3 minutes |
| **Make it yours** | the guidance comes off | same length, unguided |

A reader can get the whole arc off the three session lines alone:
`5 minutes at 9:30 PM` → `8 minutes at 9:30 PM` → `8 minutes, no voice`.

## Voice

Modelled on how these plans are actually written. Noom: *"It's a lot."* / *"How?"* /
*"Tracking your food intake."* Runna: *"Off-season doesn't mean stopping - it's about
keeping your fitness ticking over."*

- Short sentences. Fragments are fine. One idea each.
- Contractions always — *you'll*, *it's*, *doesn't*, *can't*.
- Second person, present tense.
- Plain words. No em-dash clauses stacked on each other.

Two tests hold the line: no sentence over 17 words, and every plan's lines must
contain contractions.

## What the screen shows, top to bottom

1. Title — "Your personalized plan"
2. Subtitle — We recommend the **<plan name>** plan for you, built around <goals>. *(plan name in blue)*
3. Radar chart, legend, growth-area note
4. **Goal banner** — axis, `current → target`, `by <date>`, proof line
5. **The ladder** — three cards (below)
6. Horizon — "Your N-week plan to improve <axis>" / "N minutes a day"
7. Azo aside, the daily plan list, "Miss a day and the plan waits."

### A ladder card

| slot | style |
| --- | --- |
| step name | blue, semibold |
| date range | grey caption, under the name |
| projected score + week label | orange, right-aligned |
| **detail** — the session, and what is new about it | secondary |
| **reach** — what you can do by the end | blue, semibold |
| **feel** — what the number means in the body | secondary |
| milestone | orange dot, above a hairline |

Minutes, times, scores and dates below are sample values — at runtime they come
from the user's own answers. Dates assume a 17 Sep start. Projected scores are
interpolated between the radar's current and target values on a front-loaded
curve (`CLIMB_CURVE`), and the last rung always lands exactly on the target.

---

## Azora’s Night Reset

*4 weeks, split 2 / 1 / 1. Sample goal: sleep.*

**Goal banner** — Sleep quality `42 → 78` **by 14 Oct**  
**Proof** — Paced breathing before bed: people fall asleep up to 37% faster.

### Build the habit · Weeks 1–2 · 17 Sep – 30 Sep · → 65

**detail** 5 minutes at 9:30 PM, every night. Same time, so there's nothing to decide.

**reach** Bed becomes the cue. You'll start slowing down before the count does.

**feel** This is where it moves fastest. Most people feel it in week one.

● **Day 7, 23 Sep** — we measure you again. Same test as today, so the numbers line up. Your first real comparison.

### Go longer · Week 3 · 1 Oct – 7 Oct · → 72

**detail** 8 minutes at 9:30 PM. Longer exhales now, and a short hold.

**reach** You'll ride a long exhale without counting it.

**feel** Slower stretch. Smaller gains week to week. These are the ones that stick.

### Make it yours · Week 4 · 8 Oct – 14 Oct · → 78

**detail** 8 minutes, no voice and no timer. You run it in the dark.

**reach** You'll put yourself down without the app in your hand.

**feel** You're not chasing it any more. It's just how your nights go.

● **Day 28, 14 Oct** — your last guided night. After this, you run it.

---

## Azora’s Morning Reset

*4 weeks, split 2 / 1 / 1. Sample goal: energy.*

**Goal banner** — Energy `38 → 74` **by 14 Oct**  
**Proof** — A few minutes of faster breathing lifts alertness. No crash after it.

### Build the habit · Weeks 1–2 · 17 Sep – 30 Sep · → 61

**detail** 4 minutes at 7:00 AM, before anything else. Same order every morning.

**reach** It'll happen before you've decided to do it.

**feel** The lift shows up early. Biggest jump you'll see on the whole chart.

● **Day 7, 23 Sep** — we measure you again. Same test as today, so the numbers line up. Your first real comparison.

### Go longer · Week 3 · 1 Oct – 7 Oct · → 68

**detail** 7 minutes at 7:00 AM. Faster pace, and a round of charged breathing.

**reach** You'll lift your own state in the time a kettle takes.

**feel** Progress flattens here. You're still gaining. It just stops announcing itself.

### Make it yours · Week 4 · 8 Oct – 14 Oct · → 74

**detail** 7 minutes, no voice. You set the pace yourself.

**reach** You'll do it anywhere. Hotel room, car, station platform.

**feel** You're not borrowing energy from the reset any more. Mornings are just better.

● **Day 28, 14 Oct** — your last guided morning. After this, you run it.

---

## Azora’s Pressure Reset

*8 weeks, split 3 / 3 / 2. Sample goal: stress_relief.*

**Goal banner** — Calm `35 → 76` **by 11 Nov**  
**Proof** — Five minutes a day of slow breathing cuts cortisol by up to 25%.

### Build the habit · Weeks 1–3 · 17 Sep – 7 Oct · → 57

**detail** 5 minutes at 6:00 PM, every day. Good day or bad, same hour.

**reach** You'll keep the hour on days you'd have skipped.

**feel** The first drop is the fastest you'll get. Most people feel it inside a week.

● **Day 7, 23 Sep** — we measure you again. Same test as today, so the numbers line up. Your first real comparison.

### Go longer · Weeks 4–6 · 8 Oct – 28 Oct · → 69

**detail** 8 minutes at 6:00 PM. Plus short resets during the pressure, not after it.

**reach** You'll take the edge off a spike while it's still climbing.

**feel** This is the stretch that feels unfair. You're changing faster than it feels. Most people quit here.

### Make it yours · Weeks 7–8 · 29 Oct – 11 Nov · → 76

**detail** 8 minutes, no voice and no screen. It goes wherever you go.

**reach** You'll run it in a full room and nobody will notice.

**feel** Other people clock it before you do. It shows in how you handle the day.

● **Day 56, 11 Nov** — your last guided day. After this, you run it.

---

## Azora’s Focus Reset

*6 weeks, split 2 / 2 / 2. Sample goal: focus.*

**Goal banner** — Focus `44 → 79` **by 28 Oct**  
**Proof** — A 90-second reset sharpens attention. Lower anxiety sharpens recall.

### Build the habit · Weeks 1–2 · 17 Sep – 30 Sep · → 62

**detail** 6 minutes at 8:00 AM, before the work that matters most.

**reach** You'll have a way to start that doesn't wait for you to feel ready.

**feel** The first change lands early. Starting gets easier within days, not weeks.

● **Day 7, 23 Sep** — we measure you again. Same test as today, so the numbers line up. Your first real comparison.

### Go longer · Weeks 3–4 · 1 Oct – 14 Oct · → 71

**detail** 9 minutes at 8:00 AM. Plus a 90-second reset whenever your focus goes.

**reach** You'll pull your focus back without leaving the desk.

**feel** The curve flattens. What's building is stamina, and stamina builds quietly.

### Make it yours · Weeks 5–6 · 15 Oct – 28 Oct · → 79

**detail** 9 minutes, no script. You reset in the gaps yourself.

**reach** You'll steady yourself inside a minute you used to lose.

**feel** Focus isn't something you summon now. It's where you land by default.

● **Day 42, 28 Oct** — your last guided session. After this, you run it.

---

## Azora’s Quiet Reset

*6 weeks, split 2 / 2 / 2. Sample goal: self_care.*

**Goal banner** — Stillness `47 → 80` **by 28 Oct**  
**Proof** — Slow breathing deepens meditative focus. Same practice, measured.

### Build the habit · Weeks 1–2 · 17 Sep – 30 Sep · → 64

**detail** 3 minutes at 12:30 PM, same time each day. Short enough to keep.

**reach** The minutes become yours by habit, not by argument.

**feel** The first weeks move quickest. Showing up is the change, and it starts now.

● **Day 7, 23 Sep** — we measure you again. Same test as today, so the numbers line up. Your first real comparison.

### Go longer · Weeks 3–4 · 1 Oct – 14 Oct · → 73

**detail** 6 minutes at 12:30 PM. Slower breath, longer sitting.

**reach** You'll sit with a slow breath without checking the timer.

**feel** Slower stretch. It deepens well before it feels any deeper.

### Make it yours · Weeks 5–6 · 15 Oct – 28 Oct · → 80

**detail** 6 minutes, nothing leading it. Just you and the breath.

**reach** You'll find the quiet with nothing to press play on.

**feel** You don't schedule the quiet any more. It's just there.

● **Day 42, 28 Oct** — your last guided sitting. After this, you run it.

---

## Open notes

- The `+3 minutes` step is one constant (`GROWTH_MINUTES`). It is the only number
  on the ladder the user did not choose.
- Step 3 says the guidance comes off, while the daily plan lower down the same
  screen shows a guided reset. Reads fine as "later", but worth checking on device.
- Pressure's step 2 `feel` names quitting to someone who has not started. Strongest
  line in the set, and the riskiest.
- The Day 7 note is identical across all five plans, on purpose — same instrument
  wherever you meet it.
- The ladder is onboarding copy only. Nothing in the app runs steps yet, so the
  progression it describes is a promise the product still has to keep.

