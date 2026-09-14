# Program Catalogue — Data Changes, In Plain Language

Written for review. Nothing here is built. Every section says what exists now,
what would change, and what to check. If a section looks wrong, it probably is —
that is what this document is for.

## The short version

Right now the app gives each user a personalized seven-session rotation that
loops forever. We want to give them a named plan that lasts weeks and changes as it
goes. Four decisions shape the lowest-risk first release:

1. **Start saving onboarding answers we currently throw away.** We ask about
   sleep, waking up, and procrastination, use the answers once, and never write
   them down. The new plan needs them.
2. **Remember which plan someone is on and what day they are up to.** Right now
   we only remember a start date and seven sessions, which is not enough to
   describe "day 23 of the sleep plan."
3. **Keep todos and the three-slot reward rule unchanged.** Plan-authored habits
   and variable day sizes are not required for the first reliable release.
4. **Rename two mind map axes later.** V2 stores an axis, so migrate V2 plans
   before removing legacy axis names.

The only one of these a user would actually notice is number 2, and only in one
way: today, skipping a day means you never see that day's session. Afterwards,
the plan waits for you and you get it the next day.

Everything else below is the detail behind those four decisions.

## Correction to the earlier plan

Todos already have goal rows, per-date completion rows, toggle mutations, and a
room-reward latch. The primary plan now reflects that existing behavior; there
is no competing todo-completion design to implement.

One real inconsistency did turn up. The todo migration's comment says
"Completing one does not affect streaks, feature usage, or room rewards." That
is no longer true: `countDayCompletion` (`src/lib/room/dayCompletion.ts:47`)
counts todos toward `liveCompleted`, which is what earns the decoration. The
comment is stale, not the code.

## The rule this all hangs off

A day is finished when the user earns that day's room decoration. That is
already how the app works — `useDayCompletion` returns `allCompleted`, the room
claims on it, and it covers the three dailies plus every todo on today's list.
Nothing below changes that rule. Everything below feeds it.

---

## What the data looks like today

Four things matter. In plain terms:

**1. `profiles`** — one row per user. Holds the onboarding answers that are kept:
their goal, age, gender, daily minutes, default technique, display name, stress
level, sleep quality, and the agreement responses. That is the whole list.

**2. `user_preferences.daily_plan_exercises`** — one blob of JSON per user
holding the seven-day rotation: a version number, a pool name, the growth-area
axis, a start date, and exactly seven technique ids. Today's technique is
worked out as `days since start date, modulo 7`.

**3. `self_care_goals` + `self_care_goal_completions`** — the todo list. A goal
row per todo (title, icon, optional time, recurrence, sort order, archived
date, featured date), and one completion row per goal per local date. This is
already a proper record: per-day, per-todo, with foreign keys and RLS.

**4. Daily activity** — where the breath hold's completed flag lives, and where
streaks read from.

## What a day currently asks for

Three dailies, all inferred rather than recorded:

- Guided Reset — done if a session with the recommended technique id was logged today
- Hand-picked reset — done if a session with today's plan technique id was logged today
- The Azora Protocol — done if the breath-hold flag is set on today's activity

Plus every todo on today's list. `countDayCompletion` adds them up:
`done = dailies done + todos done`, `total = 3 + todos total`. When everything
is done, the day latches complete and the decoration is earned.

---

## Change 1 — Save the onboarding answers we already collect

**The problem, plainly:** onboarding asks about sleep duration, how hard waking
is, how the user feels about their routine, what they procrastinate on, and why.
Those answers are used to pick a starting technique and then **thrown away**.
They are never written to the database. `getSavedOnboardingProfile`
(`src/services/profile/onboardingStatusService.ts:157`) selects nine columns and
none of them are these.

**Why it matters:** the two new mind map axes, Space and Rhythm, are scored
entirely from those answers. Without the columns, the new mind map cannot be
computed for anyone, including brand-new users, because the values are gone the
moment onboarding closes.

**What changes:** new columns on `profiles`, one per answer set needed by the
new Space and Rhythm scores. Text for the
single-choice ones, arrays for the multi-select ones. All nullable — every
existing user gets null, and null has to be a valid state forever, because no
existing user will ever have these answers.

| Column | Holds | Example |
|---|---|---|
| `sleep_duration` | one choice | `6to7` |
| `wake_ease` | one choice | `snooze` |
| `routine_happiness` | one choice | `shaky` |
| `procrastination_areas` | many choices | `{chores, admin}` |
| `procrastination_reasons` | many choices | `{overwhelmed, start}` |

**What to check in review:**
- Are these the right five? Is anything else required by the two scores?
- Should the allowed values be constrained in the database, or left to the app?
  Constraining means a migration every time an option is added.
- `mental_health` remains ephemeral because these scores do not require it.
- Does the onboarding completion path actually write all five in one go, and what
  happens if that write fails after the rest of onboarding succeeded?

**Risk if wrong:** low. Additive columns, nullable, ignored by older clients.

---

## Change 2 — The plan blob learns what program it is

**Today the blob says:** version, pool, axis, start date, seven technique ids.
It cannot express "you are on the 12-week sleep plan, day 23."

**What changes:** a version 3 shape containing `{ version, catalogueVersion,
planId, programDay, startedOn, lastAdvancedOn }`. `programDay` is one-based:
day 1 is the first day shown. The seven ids go away because content is derived
from `planId`, `catalogueVersion`, and `programDay`.

Completing the program's Hand-picked session advances the program. Personal
todos, Guided Reset, and the Protocol keep their existing reward behavior but
do not block program progress. The client calls a Supabase RPC
with the expected program day and completed local date. The RPC locks the
preference row and updates `programDay` and `lastAdvancedOn` together only when
the expected day still matches and that local date has not advanced it already.
It returns the canonical blob. Retries and two devices therefore cannot advance
twice or overwrite newer progress. Opening the app and extra sessions do not
advance anything. On failure, the current day remains visible and the client
retries; it never guesses the next day locally.

**The one behaviour change users will notice:** today the day is calculated from
the calendar (`days since start, modulo 7`), so skipping Tuesday means you never
see Tuesday's session. Under a program day, skipping Tuesday means Tuesday's
session is what you get on Wednesday. The plan waits for you.

**How existing users move over:** add a dedicated legacy V2 decoder that keeps
accepting the old axis union and maps every legacy axis to a `planId`. Do not
make an old axis invalid as the migration mechanism: the current invalid path
discards both the axis and start date. Future versions remain `unsupported` and
are never overwritten by older clients.

Existing users get the recommended plan for the axis already stored on their
blob, starting at program day 1 with `startedOn` set to the migration's local
date. The old rotation date is not the start of the new program. There is
nothing else to preserve, because **there
is no progress to preserve** — nothing has ever recorded which day of a program
anyone is on, since there are no programs. A user ninety days in has replayed
the same seven techniques thirteen times.

**What to check in review:**
- Is day 1 right for existing users, or should long-tenured users skip ahead?
  (The argument for day 1: week 7 of a plan you never did shows you a map that
  is mostly greyed out behind you, which reads as "you missed it.")
- Confirm the reader-only release is the minimum supported version before
  enabling V3 writes, or explicitly accept that older clients use their fallback.
- Keep the legacy V2 decoder permanently so dormant users remain migratable.
- Verify advancement is idempotent across retries and two devices.

**Risk if wrong: this is the highest-risk change in the set.** It is the one
piece of per-user state the whole feature runs on.

---

## Deferred — Plan-authored todos

**What exists:** every todo today is user-created, with free text the user typed.

**Version one:** programs do not create todos. Existing self-care behavior and
the room denominator remain unchanged.

**Later contract:** the plan may offer a habit once. Accepting creates an
ordinary user-owned `self_care_goals` row with `source = 'program'`, a stable
`source_action_id`, and a persisted title snapshot for current UI, offline use,
history, and older clients. The user may edit, reorder, untick, or archive it,
and the program never silently restores it. A unique user/source/action key
prevents duplicate inserts. The existing completions table remains unchanged.

**What to check in review:**
- Should plan todos be rows in `self_care_goals` at all, or their own table?
  Same table means the whole existing UI, ordering, and completion path works
  untouched. Separate table means a cleaner boundary and a lot of duplicated
  plumbing. **Recommendation: same table.**
- What happens to a plan's todos when the user switches plans or finishes?
  Archiving them keeps the history; deleting them loses it.
- Can the user edit or reorder an accepted plan todo? **Yes; it is user-owned.**
- If a plan issues three todos and the user has five of their own, the day now
  asks for eleven things. Is that too many? This interacts with Change 4.

**Risk if wrong:** medium, but recoverable — these are rows, not per-user state.

---

## Deferred — Variable daily count

**Today:** `DAILIES_PER_DAY = 3`, a constant in `src/lib/dailies.ts`.
`countDayCompletion` uses it as the denominator, and `DailiesCompletion` names
its three slots explicitly — `guidedCompleted`, `handPickedCompleted`,
`breathHoldCompleted`.

**Version one:** keep exactly three exercise dailies. Phases can change
techniques and duration without changing the reward contract.

If a later product requirement genuinely needs variable counts, exercise slots
and self-care goals remain disjoint inputs so a plan habit cannot be counted
twice. That change ships and is tested separately.

**What to check in review:**
- This is the change most likely to break the decoration silently. If the
  denominator is ever wrong, the day either never completes or completes early,
  and the room is the only place it shows.
- Does the existing latch still behave if the denominator changes *during* a day
  — for example at midnight on a phase boundary, or when the user switches plans
  mid-day? Recommendation: whatever the day asked for when it started is what it
  asks for until it ends.

**Risk if wrong:** medium-high. Nothing is lost, but the reward loop breaks.

---

## Change 5 — Renaming the mind map axes

**What most people assume:** renaming `resilience` to `rhythm` and `breathEase`
to `space` needs a data migration.

The mind map is recomputed, but `growthAreaAxis` is stored on the V2 plan blob.
Legacy values must remain readable until the dedicated V2-to-V3 mapping has
preserved them. Only then can the old names be removed.

**The part that is real work:** a rename is not a remap. Today `resilience`
points at an ordering of energizing techniques (Wim Hof, Bellows, morning
charge), and `breathEase` points at resonance and coherent breathing. Neither
has anything to do with routine consistency or with tidying. **Each new axis
needs its own technique ordering written from scratch**, not inherited from the
axis whose name it took.

Existing users have no answers for Space or Rhythm. Keep the three computable
axes and render Space/Rhythm as not assessed rather than inventing a zero. Their
initial program recommendation comes from the explicit legacy-axis mapping.

**Display rule:** an uncomputable Space or Rhythm axis renders as “not assessed,”
not zero and not a fabricated default. Asking those questions again can be a
later product surface.

**Risk if wrong:** medium. Doing this out of order loses useful migration data.

---

## What is NOT changing

Worth stating so review does not go looking for it:

- Streaks, history, and daily activity. Nothing here touches them.
- The room, its decorations, or the claim flow. Only the *input* to the earn
  rule changes, never the rule.
- `self_care_goal_completions`. A plan todo completes like any other todo.
- The paywall, entitlements, or RevenueCat. Free-tier gating is a separate
  document and a separate decision.
- The latch. Unticking a todo still cannot take a decoration back.

## Order to build in

1. Catalogue domain and three-slot derivation as pure, tested logic.
2. Add the advancement RPC and a reader that supports V1/V2/V3; keep writing V2.
3. After that reader is the minimum supported version, enable atomic V3 writes
   and migrate V2 through an explicit legacy-axis mapping. Keep that decoder
   permanently for dormant accounts.
4. Add the Plan/Home surfaces without changing todo or room behavior.
5. Save the five scoring inputs, then change axes after V2 migration is safe.
6. Consider plan habits or variable daily counts only as separate later work.

## Review checklist

- [ ] Are the five new profile columns exactly what Space/Rhythm require?
- [ ] Is program-day indexing definitely wanted, given it changes what a skipped
      day means for every existing user?
- [ ] Is day 1 the right starting point for existing users?
- [ ] Does the atomic RPC reject stale expected days and duplicate local dates?
- [ ] Does every legacy axis map deterministically to a plan?
- [ ] What does an uncomputable axis render as for an existing user?
- [ ] Is the stale comment in the todo migration worth correcting in the same
      change?
