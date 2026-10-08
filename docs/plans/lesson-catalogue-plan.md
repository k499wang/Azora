# Lessons in the plan

A lesson is a short sequence attached to a day of the plan. It has no audio and
there is no library to browse in the regular app. It belongs to the day it is
placed on, the same way a reset does.

This document is the content map: what the lessons are, which day of which plan
each one lands on, and what a lesson has to look like to be one. It is written
to be shipped in a single pass across every published plan.

---

## The format

| | |
|---|---|
| Length | No fixed lesson word cap. Explain the idea, example, plan rule, and next step fully without padding. |
| Shape | Plain idea, why it happens, an everyday example, exact steps, a useful question, and one small closing action. |
| Blocks | Five to eight, from a union of seven kinds. Never one block of prose. See below. |
| Title | The claim itself, never the topic. "Your wake time is the anchor" — not "Sleep timing". |
| Source | Every lesson carries an internal `source` line. Not shown to the user; it exists so a claim can be checked later. |
| Completion | Counts toward the day, like the check-in. An optional lesson is an unread lesson. |
| Interaction | Applied choices, tap-to-reveal examples, and step ordering give immediate, ungraded feedback. The closing action invites a quick response; the next lesson checks whether the preceding action was tried or adapted. |
| Absent | No graded quiz, audio, or lesson streak. |

The one thing a lesson may never do is overclaim. `design.md`'s "numbers never
flatter" applies to sentences as much as to figures, and general wellness
writing is where confident-sounding folklore gets in. If a claim needs a hedge,
either write the hedge or cut the lesson.

Write for someone opening a lesson with no background knowledge. Name the thing
before explaining it: a cue is a reminder to start, a Reset is a short guided
practice with instructions on screen, and a program day is the current set of assigned resets,
lesson, and check-in. Use short sentences, concrete nouns, and one step at a
time. Explain what to do first, when to do it, and what to try if it does not
fit. Do not use clinical terms or metaphors unless the next sentence explains
them in ordinary words. Keep the tone respectful.

Build a connected explanation from a familiar situation to why it matters,
then to something the reader can try. Short sentences should still carry the
same thought forward. Avoid opening each paragraph with a slogan or a bold
command followed by an unrelated example. Introduce a new Reset by explaining
how it helps with the situation just described, then name it and explain what
the reader will do. Place bold emphasis within the explanation rather than
using it as a separate sentence stem.

New goal lessons use short sentences and ordinary words. Explain the action
before asking the reader to try it. Give a familiar example, then one small
step they can take today. Do not use em dashes, en dashes, unexplained terms,
or metaphors in their copy. Practical suggestions should not claim a health
benefit that their source does not support.

Banned words apply as everywhere else: never "breathwork", never "exercise" in
user-facing copy. See `feedback_banned_words_breathwork`.

---

## How a lesson is laid out

A lesson is a **Stories-style feed**: one short line joins the bottom on each
Continue, rather than an article scrolled in one go. Several hundred words set as a
page of text is a page somebody has to decide to read — and on a daily cadence,
before the thing they came to do, that is the decision that goes first on a busy
day. One idea at a time keeps the reading brief; questions (multiple choice,
arrange, reveal) hold Continue until answered, and their feedback joins the feed.

It also means the closing thought cannot be skipped past. It is the last line,
where the reader can consider or use what the lesson taught.

```ts
type LessonBlock =
  | { kind: 'text'; text: string }
  | { kind: 'fact'; value: string; caption: string }
  | { kind: 'list'; items: readonly { term: string; text: string }[] }
  | { kind: 'choice'; prompt: string; options: readonly { label: string; feedback: string }[] }
  | { kind: 'reveal'; prompt: string; items: readonly { label: string; detail: string }[] }
  | { kind: 'sequence'; prompt: string; steps: readonly string[]; feedback: string }
  | { kind: 'do'; text: string };
```

A lesson is a title plus **five to eight authored blocks**, and the last one is
always a `do`. Long prose blocks are split at sentence boundaries into slides
of at most 45 words. Interactive blocks, lists, and the closing action stay together. The
title is its own slide, and the progress bar counts the slides the reader sees.
The seven kinds cover the reading, examples, and practice these lessons use.

**The deck is shared with the check-in.** `useSlideDeck` owns the movement and
`SlideDeck` lays the pages out and gates them; what the pages are and when they
turn belongs to each screen. The check-in turns its own when an answer settles;
a lesson turns when the page is tapped.

### The blocks

**Title.** The claim, at the size the check-in asks its questions — the biggest
thing on the screen by a wide margin, on its own, with nothing above it but the
close button. It is the lesson; everything under it is why.

**`text`.** One idea explained in connected sentences, **120 authored words
maximum**. The player divides a longer block at a sentence boundary so each
visible slide has at most 45 words. Consecutive slides should do different jobs,
such as explaining why something happens and then showing it in a real situation.

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

**`choice`.** A brief situation and two or three responses, each with immediate
explanatory feedback. It practises a distinction the lesson just taught. There
is no score or stored answer; the reader can compare responses before continuing.
Keep the prompt, options, and selected feedback concise enough to read together.

**`reveal`.** Tap two or three parts of one example to uncover what each part
means. All cards must be opened before continuing.

**`sequence`.** Tap three practical steps in the order they would happen. A
mistake gives a gentle prompt to try again; completing the sequence reveals
the explanation and enables Continue.

**`do`.** The last block, always, in a tinted card under a small "For today"
label. It can offer a reflection, a user-chosen next step, or a concrete action
when the lesson has enough context to make one useful. It is what the reader is
left looking at. It should not assume what task the reader needs to do today.
The reader can acknowledge or adapt the action without being graded or blocked.
After a real lesson is recorded, its authored action is kept locally for the
next program day in the same enrollment. The next lesson asks whether the reader
tried or adapted it. Lesson Lab previews neither read nor write this follow-up.

### What makes it not boring

- **One idea per page.** A page can scroll for accessibility, but it should not need two screens of prose.
- **The title earns the open.** "Half of it is still there six hours later"
  rather than "About caffeine".
- **A number to look at.** The `fact` card is the one place the eye lands
  before reading, which is what buys the first paragraph its chance.
- **The bold path.** Fifteen bolded words across the lesson that read as a
  sentence on their own.
- **It ends with a usable thought**, not a summary of what was just said.
- **Varied shape.** Most carry a `fact`, some carry a `list`, and some are
  prose and an instruction with no card at all. Checked per sequence rather
  than per lesson: every plan meets at least four distinct block shapes, at
  least two `list` lessons, and — the one that matters on a daily cadence —
  **never more than three days running with the same block shape**. Two
  identical layouts on consecutive days read as one screen shown twice.

The authored lessons in `src/features/lessons/domain/lessons/` are the examples
of record. Review them in the development Lesson lab, which opens the same
page-by-page player used for today's lesson.

## Placement

**One lesson a day, every day of the plan.** The position in the list is the
day, so 322 days across the nine published plans.

| Plan | Days | General plan lessons | Goal and practice lessons |
|---|---|---|---|
| `night` | 28 | 4 | 24 |
| `morning` | 28 | 4 | 24 |
| `pressure` | 56 | 4 | 52 |
| `focus` | 42 | 4 | 38 |
| `quiet` | 42 | 4 | 38 |
| `home` | 28 | 2 | 26 |
| `phone` | 28 | 2 | 26 |
| `recovery` | 28 | 2 | 26 |
| `selfTrust` | 42 | 2 | 40 |

Every plan closes on `plan.after`. Night, morning, pressure, focus and quiet
(revision 2) open on the home session instead: day 1 is `breath.exhale`
(`breath.wake` for morning). Early tool lessons keep their session pairings
(see `reset-types-and-lesson-pairing.md`). `plan.grows` lands on day 8 for
night, pressure and quiet, and day 11 for morning and focus, when the daily
set grows. Home, phone, recovery and selfTrust still open
on `plan.grows`. The rest of each sequence is ordered for variety and for the
arc of the outcome.

The sequences follow each plan's latest revision. An enrollment reads the
lesson its snapshot names for the day (`programDayLesson`), so re-pinning a
sequence never changes the lesson an enrolled user's day requires.

General guidance is limited to starting, finishing, and, in the five
breathing-led plans, reviewing the first week and returning after a missed
day. The other days teach something about the user's goal. Sleep and morning
plans previously used 11 of 28 days for general guidance; they now use four.

The 29 added lessons cover bedroom light and sound, phone use before bed,
evening meals, clock checking, morning preparation, getting started after
waking, easy morning food, handling one problem, asking for help, recovering
after stress, choosing the next task, setting aside unrelated thoughts,
checking what you read, listening, waiting, naming feelings, laundry, dishes,
shared chores, phone purpose, message timing, rest, sharing work, planning
around available energy, small decisions, changing your mind, and advice.
Existing relevant lessons fill the other replaced general-guidance days.

The day's reward still waits on the lesson, so every lesson needs to earn
the time it takes to read and practise.

---

## The library

**150 lessons, 322 days.** There are 142 active lessons and eight retired
lessons, and no plan repeats one within itself. `plan.expect`, `plan.hour`,
`plan.stacking`, `plan.low`, `plan.two`, `plan.streak`, `plan.bad`, and
`plan.consistency` are retired (`RETIRED_LESSON_IDS`) but still shipped because
existing enrollment snapshots name them. Reuse is the point: the sleep-debt lesson is
the same lesson whether you came for sleep or for a shorter temper, and writing
it twice is how two versions of it end up disagreeing.

They live in nine files under `domain/lessons/`: `breath` (2), `plan` (12),
`sleep` (17), `body` (12), `anger` (17), `focus` (21), `quiet` (18),
`lifeReset` (48), and `recovery` (3).

`LessonId` is **derived from the content**, not written out beside it, so a typo
in a sequence is a type error and adding a lesson is one entry in one file.

`allLessons()` is the list of record for lesson titles, claims, and sources. The
source files hold the complete copy so this document cannot drift from it.

---

## The nine sequences

Read them from `LESSON_SEQUENCES` in `lessonCatalogue.ts` — one array per plan,
position is the day. They are ordered on four rules, all held by test:

1. The last day is `plan.after`; the five home-session plans open on
   `breath.exhale` / `breath.wake` and reach `plan.grows` when the daily set
   grows (day 8 or 11); the others open on `plan.grows`.
2. No plan reads the same lesson twice.
3. No more than three consecutive days share a block shape.
4. The five breathing-led plans have at most four general plan lessons; the
   other four have at most two. Each plan includes its new goal lessons.

Rule three is why the order looks shuffled. The families are not evenly shaped
— nearly every sleep lesson is a paragraph, a number and a paragraph — so a
thematically tidy run of sleep days is a week of identical screens.

## Where the code goes

**Built:** `src/features/lessons/domain/lessonBlock.ts` (the block types),
`domain/lessons/*.ts` (all 150 lessons, nine files) and
`domain/lessonCatalogue.ts` (the nine sequences, the derived `LessonId`, and
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
  today it would. A deeper lesson is a larger daily commitment; watch
  completion and abandonment once there is data.
- **Placement within the day.** The check-in leads by default because it asks
  rather than demands. A lesson is neither — it probably belongs last.

## Sources

### Product references

Noom describes daily lessons with quizzes and simple tasks, with a user-chosen
five, ten, or fifteen minute commitment. Woebot recommends at least three to
five minutes for its CBT-informed conversations. Those examples support a short
daily learning loop with one chance to apply the idea. Azora's lessons use a
smaller two to three minute target because they sit alongside the rest of a
plan day.

- https://www.noom.com/blog/what-is-the-noom-diet/
- https://woebothealth.com/referral/

### Clinical references

The stress and temper lessons follow the structure of SAMHSA's cognitive
behavioural anger management manual (the anger meter, the four cue types, the
A-B-C-D model, assertiveness). The sleep lessons follow standard CBT-I
components — stimulus control, sleep hygiene, cognitive restructuring around
night-time waking. Sleep restriction is deliberately **not** included: it is
the component that needs supervision, and a general-audience app should not be
prescribing time in bed.

- https://library.samhsa.gov/product/anger-management-substance-use-disorder-and-mental-health-clients-cognitive-behavioral-therapy-manual/pep19-02-01-001
- https://www.nhlbi.nih.gov/health/insomnia/treatment
