# Lessons in the plan

A lesson is one screen of reading attached to a day of the plan. It is not a
course, it has no audio, and there is no library to browse. It belongs to the
day it is placed on, the same way an exercise does.

This document is the content map: what the lessons are, which day of which plan
each one lands on, and what a lesson has to look like to be one. It is written
to be shipped in a single pass across all five plans.

---

## The format

| | |
|---|---|
| Length | 100–150 words. One screen and a half, roughly forty seconds. |
| Shape | One claim, one reason it is true, one thing to do today. |
| Blocks | Four to six, from a union of four kinds. Never one block of prose. See below. |
| Title | The claim itself, never the topic. "Your wake time is the anchor" — not "Sleep timing". |
| Source | Every lesson carries an internal `source` line. Not shown to the user; it exists so a claim can be checked later. |
| Completion | Counts toward the day, like the check-in. An optional lesson is an unread lesson. |
| Absent | No quiz, no audio, no lesson streak, no browsable library. |

The one thing a lesson may never do is overclaim. `design.md`'s "numbers never
flatter" applies to sentences as much as to figures, and general wellness
writing is where confident-sounding folklore gets in. If a claim needs a hedge,
either write the hedge or cut the lesson.

Banned words apply as everywhere else: never "breathwork", never "exercise" in
user-facing copy. See `feedback_banned_words_breathwork`.

---

## How a lesson is laid out

A lesson is **tapped through, one block a page**, not scrolled as an article.
150 words set as a page of text is a page somebody has to decide to read — and
on a daily cadence, before the thing they came to do, that is the decision that
goes first on a busy day. One idea on screen at a time, at a size you can read
standing up, is forty seconds that never feels like reading.

It also means the instruction cannot be skipped past. It is the last page,
which is the one thing every lesson is for.

```ts
type LessonBlock =
  | { kind: 'text'; text: string }
  | { kind: 'fact'; value: string; caption: string }
  | { kind: 'list'; items: readonly { term: string; text: string }[] }
  | { kind: 'do'; text: string };
```

A lesson is a title plus **four to six blocks**, and the last one is always a
`do`. So a lesson is five to seven pages: the title alone, then a page each.
The union is deliberately tiny — four kinds is enough for the shapes these
lessons actually take, and small enough that no lesson can be authored into
something the screen cannot make look considered.

**The deck is shared with the check-in.** `useSlideDeck` owns the movement and
`SlideDeck` lays the pages out and gates them; what the pages are and when they
turn belongs to each screen. The check-in turns its own when an answer settles;
a lesson turns when the page is tapped.

### The blocks

**Title.** The claim, at the size the check-in asks its questions — the biggest
thing on the screen by a wide margin, on its own, with nothing above it but the
close button. It is the lesson; everything under it is why.

**`text`.** One idea, two or three sentences, **40 words maximum**. Never two
`text` blocks in a row without something between them past the first pair. Body
size, generous line height — a lesson is read, not scanned, and the line height
is what makes 150 words feel like a page rather than a screenful.

Two or three words per paragraph are **bolded**: the ones that carry the point.
Read only the bold and you have the lesson. That is the skim path, and it is
what makes a lesson survive being opened by somebody who is not really going to
read it.

**`fact`.** The one number, alone in a card, the way the rings and stats cards
already work. `value` is large — "6 hours" — and `caption` is the one line that
says what it is. At most one per lesson. A lesson with no honest number does
not get a made-up one.

**`list`.** Two to four `term` + `text` rows, for the lessons whose content is
genuinely a set: passive / aggressive / straight; body / thought / feeling /
action. The term in the accent, the line under it in body. This is what stops
the four-cue lesson from being a 60-word run-on sentence.

**`do`.** The last block, always, in a tinted card under a small "Try this
today" label. It is the only block with an imperative in it, and it is what the
user is left looking at. If a lesson's `do` is vague, the lesson is vague.

### What makes it not boring

- **One screen and a half, no more.** If it scrolls twice it was two lessons.
- **The title earns the open.** "Half of it is still there six hours later"
  rather than "About caffeine".
- **A number to look at.** The `fact` card is the one place the eye lands
  before reading, which is what buys the first paragraph its chance.
- **The bold path.** Fifteen bolded words across the lesson that read as a
  sentence on their own.
- **It ends on something to do**, not on a summary of what was just said.
- **Varied shape.** Most carry a `fact`, some carry a `list`, and some are
  prose and an instruction with no card at all. Checked per sequence rather
  than per lesson: every plan meets at least four distinct block shapes, at
  least two `list` lessons, and — the one that matters on a daily cadence —
  **never more than three days running with the same block shape**. Two
  identical layouts on consecutive days read as one screen shown twice.

### Worked example — `sleep.caffeine`

> # Half of it is still there six hours later
>
> Caffeine does not wear off, it **halves**. What you drink at three in the
> afternoon is still a **quarter of a cup** in your blood at bedtime.
>
> ```
> ┌──────────────────────────────┐
> │  6 hours                     │
> │  before half of it is gone   │
> └──────────────────────────────┘
> ```
>
> You will still **fall asleep** on it. That is the part that makes this hard
> to notice: it does not keep you up, it **flattens the deep part** of the
> night and leaves you tired enough tomorrow to want more of it.
>
> **Try this today**
> *Last coffee before noon, for the next seven days. Judge it at the end of
> the week, not tomorrow.*

108 words, four blocks, one number, one instruction. Read the bold on its own:
*halves — a quarter of a cup — fall asleep — flattens the deep part.* That is
the lesson, and it takes nine seconds.

## Placement

**One lesson a day, every day of the plan.** The position in the list is the
day, so 196 days across the five plans.

| Plan | Days |
|---|---|
| `night` | 28 |
| `morning` | 28 |
| `pressure` | 56 |
| `focus` | 42 |
| `quiet` | 42 |

Every plan opens on `plan.grows` and closes on `plan.after`. Nothing else is
pinned to a day — the sequences are ordered for variety and for the arc of the
outcome, not against the plan's growth days.

The cost of daily, stated once: the day's reward now waits on the lesson every
day rather than on ten days of the plan. That is the argument for keeping each
one under a minute, and it is why `plan.bad` and `plan.consistency` exist.

---

## The library

**71 lessons, 196 days.** Every lesson is used in one to five plans, and no
plan repeats one within itself. Reuse is the point: the sleep-debt lesson is
the same lesson whether you came for sleep or for a shorter temper, and writing
it twice is how two versions of it end up disagreeing.

They live in six files under `domain/lessons/`, one per family — `plan` (12),
`sleep` (12), `body` (9), `anger` (14), `focus` (12), `quiet` (12). One list of
seventy-one is a file nobody can find anything in.

`LessonId` is **derived from the content**, not written out beside it, so a typo
in a sequence is a type error and adding a lesson is one entry in one file.

The tables below are the original 26. The rest follow the same rules and are
read from the source; `allLessons()` is the list of record.

### Core — the plan itself (4)

| id | Title | The claim |
|---|---|---|
| `plan.grows` | It adds, it doesn't lengthen | The plan gets harder by giving you a second short thing, never by making the first one longer. Ten minutes twice beats twenty minutes once, and it is the only escalation that survives a bad week. |
| `plan.consistency` | Small and daily beats big and rare | The effect you are after comes from frequency, not from any single session. A five-minute day you actually do outranks the thirty-minute one you plan. |
| `plan.missed` | A missed day is data, not a verdict | Nothing resets. Look at what the day actually was — the hour was wrong, or the day was — and move the hour rather than trying harder. |
| `plan.after` | What to keep when this ends | By now one of these has become the one you reach for. That is the one to keep. The rest were how you found it. |

### Sleep (7)

| id | Title | The claim |
|---|---|---|
| `sleep.anchor` | Your wake time is the anchor | A fixed wake time does more for your sleep than a fixed bedtime, because you cannot decide to fall asleep but you can decide to get up. Pick one and hold it on weekends too. |
| `sleep.light` | Light is the lever | Morning light sets the clock that decides when you get sleepy sixteen hours later. Ten minutes outside before nine does more than any evening routine. |
| `sleep.caffeine` | Half of it is still there six hours later | Caffeine has a half-life of about six hours, so a 3pm coffee is a quarter cup at bedtime. Move it earlier for a week and judge it then. |
| `sleep.alcohol` | It trades the first half for the second | A drink shortens the time to fall asleep and fragments the back half of the night. It is why you woke at four. |
| `sleep.bed` | The bed is for sleep | If the bed is also where you scroll and worry, your body stops reading it as a sleep cue. Twenty minutes awake, get up, sit somewhere dim, come back when you are sleepy. |
| `sleep.threeam` | Waking is normal, the thinking is not | Everybody surfaces several times a night. The problem is never the waking, it is the checking of the clock and the arithmetic that follows. |
| `sleep.debt` | This is where your fuse went | A short night raises next-day reactivity measurably. The temper you are trying to manage is often a sleep problem wearing a different coat. |

### Body and energy (3)

| id | Title | The claim |
|---|---|---|
| `body.inertia` | The first twenty minutes are not the day | Sleep inertia lasts twenty to thirty minutes on a normal night. How you feel on waking is not evidence about how you slept, or about the day. |
| `body.movement` | The fastest mood lever there is | A short walk moves mood faster and more reliably than almost anything else we can point at. It does not need to be exercise to count. |
| `body.dip` | The afternoon dip is real | The early-afternoon slump is part of the clock, not a failure of will. Put the work that needs least of you in it, on purpose. |

### Stress and temper (5)

| id | Title | The claim |
|---|---|---|
| `anger.meter` | Catch it at four, not at nine | Put a number on it as it rises. At nine there is nothing to do but ride it out; at four there is still a choice, and the number is what makes the choice visible. |
| `anger.cues` | It announces itself four ways | Body, thought, feeling, action. Each has its own early signal — a jaw, a sentence you have thought before, a flatness, a door shut harder than needed. Learn which one is yours. |
| `anger.belief` | The event is not what made you angry | Between what happened and how you felt is what you concluded about it. That middle step is the only part you can argue with. |
| `anger.assert` | Passive, aggressive, or straight | Passive stores it, aggressive spends it, straight spends the least. Say the thing, name what you want, stop talking. |
| `anger.recovery` | The recovery matters more than the spike | Everybody spikes. What separates a short fuse from a long one is how fast it comes back down, and that part is trainable in a way the spike is not. |

### Attention (3)

| id | Title | The claim |
|---|---|---|
| `focus.ready` | Waiting to feel ready is the bug | Motivation follows starting, not the other way round. The two minutes of work are what produce the wanting to work. |
| `focus.switch` | The switch costs more than the minute | Coming back from an interruption costs far more than the interruption did. Protect the block, not the hour. |
| `focus.phone` | Where the phone is decides this | In another room beats face-down on the desk, and both beat willpower. The decision is made once, in advance, not forty times an hour. |

### Quiet and attention to self (4)

| id | Title | The claim |
|---|---|---|
| `quiet.gap` | There is a gap, and it can be widened | Between the thing and your response there is a moment. Most of this practice is about making that moment long enough to be used. |
| `quiet.notice` | Noticing is not suppressing | The aim is not to stop feeling it. It is to feel it and still be the one choosing. Pushing it down is what makes it come back louder. |
| `quiet.boredom` | Boredom is the entry fee | The first few minutes of quiet feel like nothing happening. That is not the practice failing, it is the part you have been skipping. |
| `quiet.rested` | Unstimulated is not the same as rested | Scrolling is not rest. It removes the demand without giving anything back, which is why an evening of it leaves you as tired as the day did. |

---

## The five sequences

Read them from `LESSON_SEQUENCES` in `lessonCatalogue.ts` — one array per plan,
position is the day. They are ordered on three rules, all held by test:

1. Day one is `plan.grows`; the last day is `plan.after`.
2. No plan reads the same lesson twice.
3. No more than three consecutive days share a block shape.

Rule three is why the order looks shuffled. The families are not evenly shaped
— nearly every sleep lesson is a paragraph, a number and a paragraph — so a
thematically tidy run of sleep days is a week of identical screens.

## Where the code goes

**Built:** `src/features/lessons/domain/lessonBlock.ts` (the block types),
`domain/lessons/*.ts` (all 71 lessons, six files by family) and
`domain/lessonCatalogue.ts` (the five sequences, the derived `LessonId`, and
`lessonForDay(planId, programDay)`), with `lessonCatalogue.test.mjs` holding the format
rules above (block count, word count, the bold path, one fact maximum, sources,
banned words, placement inside the plan, shared-not-duplicated).

**Also built:**

- `src/screens/LessonScreen.tsx` — one screen, top to bottom, closing to the
  plan. It takes no route parameters: which lesson today has is the same lookup
  the row on Home made to decide there was one.
- `src/features/lessons/LessonBlockView.tsx` — every block kind drawn in one
  place, including the `**bold**` skim path.
- `src/hooks/dayUnits/useLessonDayUnit.ts` — a `DayUnitSource` beside
  `useMoodDayUnit`. It fetches nothing: plan and day come from the enrollment
  Home already has, the lesson is a lookup, and whether it was read is in the
  day's completions. With one lesson a day it contributes a row to every day of
  every plan.
- `supabase/migrations/20260919000200_record_lesson_read.sql` — one definer
  function, no new table. `program_action_completions` already holds
  `(enrollment_id, program_day, activity_id)`. The function decides which
  program day the row lands on, applying the same "the day on screen is the day
  just finished" rule the client's `programDayForDate` does.
- `src/services/lessons/lessonReadService.ts`,
  `src/queries/lessons/useRecordLessonReadMutation.ts`, and the
  `lesson_opened` / `lesson_read` events.

**Still to do:** apply the migration, then `npm run supabase:types`.

## Open questions

- **Does a lesson block the room decoration?** It counts toward the day, so
  today it would. Forty seconds is a fair price; forty seconds at the wrong
  moment is not. Worth watching once there is data.
- **Placement within the day.** The check-in leads by default because it asks
  rather than demands. A lesson is neither — it probably belongs last.

## Sources

The stress and temper lessons follow the structure of SAMHSA's cognitive
behavioural anger management manual (the anger meter, the four cue types, the
A-B-C-D model, assertiveness). The sleep lessons follow standard CBT-I
components — stimulus control, sleep hygiene, cognitive restructuring around
night-time waking. Sleep restriction is deliberately **not** included: it is
the component that needs supervision, and a general-audience app should not be
prescribing time in bed.

- https://library.samhsa.gov/product/anger-management-substance-use-disorder-and-mental-health-clients-cognitive-behavioral-therapy-manual/pep19-02-01-001
- https://www.sleepfoundation.org/insomnia/treatment/cognitive-behavioral-therapy-insomnia
