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
| Length | 140–260 words on the longest visible path, typically two to three minutes including a choice. |
| Shape | Plain idea, why it happens, an everyday example, exact steps, a useful question, and one small closing action. |
| Blocks | Five to eight, from a union of five kinds. Never one block of prose. See below. |
| Title | The claim itself, never the topic. "Your wake time is the anchor" — not "Sleep timing". |
| Source | Every lesson carries an internal `source` line. Not shown to the user; it exists so a claim can be checked later. |
| Completion | Counts toward the day, like the check-in. An optional lesson is an unread lesson. |
| Interaction | Applied choices give immediate, ungraded feedback. The closing action invites a quick response; the next lesson checks whether the preceding action was tried or adapted. |
| Absent | No graded quiz, audio, or lesson streak. |

The one thing a lesson may never do is overclaim. `design.md`'s "numbers never
flatter" applies to sentences as much as to figures, and general wellness
writing is where confident-sounding folklore gets in. If a claim needs a hedge,
either write the hedge or cut the lesson.

Write for someone opening a lesson with no background knowledge. Name the thing
before explaining it: a cue is a reminder to start, a reset is a short guided
breathing session, and a program day is the current set of assigned resets,
lesson, and check-in. Use short sentences, concrete nouns, and one step at a
time. Explain what to do first, when to do it, and what to try if it does not
fit. Do not use clinical terms or metaphors unless the next sentence explains
them in ordinary words. Keep the tone respectful.

Banned words apply as everywhere else: never "breathwork", never "exercise" in
user-facing copy. See `feedback_banned_words_breathwork`.

---

## How a lesson is laid out

A lesson is **tapped through, one block a page**, not scrolled as an article.
260 words set as a page of text is a page somebody has to decide to read — and
on a daily cadence, before the thing they came to do, that is the decision that
goes first on a busy day. One idea on screen at a time keeps the reading brief;
a choice earns its extra time by helping the reader practise that idea.

It also means the closing thought cannot be skipped past. It is the last page,
where the reader can consider or use what the lesson taught.

```ts
type LessonBlock =
  | { kind: 'text'; text: string }
  | { kind: 'fact'; value: string; caption: string }
  | { kind: 'list'; items: readonly { term: string; text: string }[] }
  | { kind: 'choice'; prompt: string; options: readonly { label: string; feedback: string }[] }
  | { kind: 'do'; text: string };
```

A lesson is a title plus **five to eight blocks**, and the last one is always a
`do`. So a lesson is six to nine pages: the title alone, then a page each.
The union is deliberately tiny — five kinds is enough for the shapes these
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

**`text`.** One idea, two or three sentences, **45 words maximum**. Consecutive
pages of text should do different jobs, such as explaining a mechanism and then
showing it in a real situation. Body size and generous line height keep a
longer lesson readable one thought at a time.

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
Keep the longest visible path within the lesson word limit.

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

| Plan | Days |
|---|---|
| `night` | 28 |
| `morning` | 28 |
| `pressure` | 56 |
| `focus` | 42 |
| `quiet` | 42 |
| `home` | 28 |
| `phone` | 28 |
| `recovery` | 28 |
| `selfTrust` | 42 |

Every plan opens on `plan.grows` and closes on `plan.after`. Nothing else is
pinned to a day — the sequences are ordered for variety and for the arc of the
outcome, not against the plan's growth days.

The cost of daily, stated once: the day's reward now waits on the lesson every
day rather than on ten days of the plan. That is the argument for keeping each
useful enough to earn two or three minutes, and it is why `plan.bad` and
`plan.consistency` exist.

---

## The library

**119 lessons, 322 days.** Every lesson is used across the plan catalogue, and no
plan repeats one within itself. Reuse is the point: the sleep-debt lesson is
the same lesson whether you came for sleep or for a shorter temper, and writing
it twice is how two versions of it end up disagreeing.

They live in seven files under `domain/lessons/`: `plan` (12), `sleep` (12),
`body` (9), `anger` (14), `focus` (12), `quiet` (12), and `lifeReset` (48).

`LessonId` is **derived from the content**, not written out beside it, so a typo
in a sequence is a type error and adding a lesson is one entry in one file.

`allLessons()` is the list of record for lesson titles, claims, and sources. The
source files hold the complete copy so this document cannot drift from it.

---

## The nine sequences

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
`domain/lessons/*.ts` (all 119 lessons, seven files) and
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
