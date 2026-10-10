# Plan: "Do a to-do" step, Reset-free day 1, light days

Decided 2026-10-10. Build spec for the change; each step is a small, separately
verifiable change. Run `npm run check` after every step.

## Decisions (settled)

- **"Do a to-do" is a required plan step on every plan day**, rendered last in
  My Plan, directly above the room piece. Not draggable.
  - States: `add` (no to-dos due today → go to Routine), `open` (due, none ticked
    → go to Routine), `claimable` (≥1 ticked today → amber `CHUNKY_TONE_AMBER`
    `ChunkyButton` "Claim +10"), `claimed` (done).
  - The **claim is the completion** and is persisted server-side, so un-ticking a
    to-do afterwards does not undo the step.
  - Claim pays **10 coins** (`EARN_RATES.todoStep`); the tick keeps paying its own.
  - Gates the server's next-day advance **and** the room piece (new DayUnit).
- **Rollout: per-enrollment opt-in.** `program_enrollments.todo_step_from_day`.
  New enrollments insert `1`; a new build adopts an existing active enrollment once
  via `adopt_plan_todo_step()` (sets it to `program_day`). The server requires the
  claim only when `todo_step_from_day is not null and program_day >= todo_step_from_day`.
  Old builds never get stuck.
- **Done rows show a green check** instead of the play triangle (`DailyTaskRow`).
- **Day 1 of every plan has no Reset** (check-in + lesson + to-do). Days 2–5 have at
  most one Reset each: day 3 becomes `attention.54321.2` alone (quiet: day 5 `G`
  alone). Day 6 onward unchanged except light days. The Reset is not the activation
  "aha" — do not re-argue this.
- **Light days**: no Reset; check-in + lesson + to-do. Never in days 1–10, never on
  a tool day, never the last day; lesson must not mention a Reset / 5-4-3-2-1 /
  Muscle Release / breathing. Table below.
- **Ships as a new program revision** (`easyStartRevision`). Users mid-plan keep
  their frozen snapshot (no Reset-free day 1, no light days) but get the to-do step
  from their current day via the opt-in.
- **`FREE_PLAN_DAYS` stays 2.**
- **Lesson copy is reworded to be true on every day it lands** (no per-day logic).
  Named Resets not in that day's plan are pointed to Explore search.
- **Side fixes, each its own step**: restore the attention counter bump in
  `advance_program_day`; revoke `advance_program_day_if_ready(uuid,date)` from
  `authenticated`; verify-then-fix `parseStoredOrder` rejecting `mood:today` /
  `lesson:today`.
- **Do not push the migration to Supabase.** Write the file only.

## Status

- Steps 1–3 done (uncommitted), `npm run check` green. Fallback rule kept for
  stored days whose activities this build cannot draw; zero stored activities now
  means "no Reset". Reminder floor lives in `programReminderSlots`.

## Steps

### 1. Zero-Reset tolerance (no behaviour change yet)
- `programEnrollmentService.ts:89-98` `sanitizeResolvedDays`: accept days with
  `activities.length === 0`.
- `useExerciseDayUnits.ts:72-98`: fall back to the legacy guided + hand-picked pair
  only when `program.day == null`, not when the day has zero activities.
- `useTodayProgramDay.ts:170-172`: `allCompleted` must not be false by definition on
  a zero-activity day. Expose the resolved activity count.
- `useNotificationBootstrap.ts:58`: `programSlotsInUse(Math.max(1, programDayActivityCount(...)))`.
  `notificationCatalog.ts:35-48` session reminder neutral copy: title "Your plan for
  today is ready", body "A few small steps. Start with whichever fits.". Settings
  label "Plan reminder", subtitle "A reminder at the time you chose for your first
  step of the day.".
- `programCatalogue.ts` `ProgramBlock` gains `rest?: true`; `expandProgramBlocks`
  (:125-134) allows empty `slots` only when `rest` is set.
- Tests: sanitizer accepts empty days; no fallback rows on a zero-Reset plan day;
  notification floor; `expandProgramBlocks` refuses an empty non-rest block.

### 2. Done-row check icon
- `TodaysDailiesSection.tsx:~338`: completed row renders
  `<Icon bold name="check" size={20} color={colors.success[700]} />` (same as
  `RoomPieceRow` :409) instead of the play triangle.

### 3. Lesson copy + `LESSON_REVISION` 8→9 (`lessonCatalogue.ts:45`)
Exact strings (keep 1–3 bold runs, 15–45-word pages; never "breathwork"):

- `angerLessons.ts:29` (`anger.recovery`): "During that pause, breathe out gently, then read the message again and decide what you want your reply to do. If you want prompts to follow, search the Explore tab for **5-4-3-2-1**, a short guided Reset. It walks you through things you can see, hear, touch, smell, and taste. Then go back to the conversation."
- `angerLessons.ts:108` (`anger.cues`): "If muscle tension is a sign you often miss, explore it in a quiet moment with **Muscle Release**, a short guided Reset you can find by searching the Explore tab. It asks you to gently tighten and then relax different muscles, so you feel the difference between holding tension and letting it go."
- `quietLessons.ts:75` (`quiet.notice`): "If the feeling makes it hard to decide what to do, notice something around you first. **5-4-3-2-1 guides you through this**: five things you see, four sounds you hear, three things you touch, two smells, and one taste. Search the Explore tab for it whenever you want it, then choose your next step."
- `quietLessons.ts:229` (`quiet.eyes`): "Keeping your eyes open also lets you follow **5-4-3-2-1**, a short guided Reset you can find by searching the Explore tab. You notice five things you see, four sounds you hear, three things you touch, two smells, and one taste. Seeing your surroundings is part of the practice."
- `lifeResetLessons.ts:200` (`focus.pull`): "To try this, take a few slow breaths. Ask: would checking help with something I need right now? If you want something to notice during the pause, search the Explore tab for **5-4-3-2-1**, a short guided Reset. It leads you through five things you see, four sounds you hear, three things you touch, two smells, and one taste."
- `sleepLessons.ts:181` (`sleep.threeam`): "To reduce the urge to count the hours, **turn the clock away** and remind yourself, “I am awake right now, and I can rest.” If you want something to focus on, use 5-4-3-2-1, a short guided Reset you can find by searching the Explore tab. Its prompts ask you to **notice your surroundings one sense at a time**: five sights, four sounds, three things you touch, two smells, and one taste. Stay comfortable, and skip or adapt a sense that is unavailable."
- `sleepLessons.ts:188` (do): "Tonight, **turn your clock away from the bed**. If you wake up, name five things you can see or hear, and remind yourself that one waking does not ruin tomorrow."
- `sleepLessons.ts:122` (`sleep.wind`): "You can begin by **turning down bright lights and choosing a quiet activity**, such as washing up or reading a few pages. If a task is on your mind, write its next step for tomorrow. Muscle Release is another option: a short guided Reset you can find by searching the Explore tab. Its prompts show you how to **gently tighten a muscle and then let it rest**. Follow them comfortably, keep breathing normally, and skip any movement that hurts."
- `stressLessons.ts:22` (`stress.signs`, day 1): "Once you see what is happening, consider what would make the next few minutes more manageable. You could put the messages aside, write down a task, or ask for help. If you want a guided pause, **a Reset gives you short prompts to follow**. Resets are short practices on your plan, and you can search for one on the Explore tab any time. Afterward, you return to deciding what the waiting tasks need."
- `worryLessons.ts:22` (`worry.loop`, day 1): "If you would like something simple to follow before moving on, open a Reset. Resets are short guided practices on your plan, and you can search for one on the Explore tab any time. **Follow the prompts, then return to your next activity**. If a worry interrupts, continue from where you are rather than restarting."

`planLessons.ts` (`plan.grows`):
- `:18`: "The plan in this app gives you **a few small steps each day**. Most days include a Reset, which is **a short session with instructions on the screen**, usually lasting a minute or two. Every day you also read a lesson like this one, tap how you feel in a quick check-in, and tick off one to-do."
- `:26`: "**The plan starts small and grows.** Later, it includes two Resets, and sometimes three, giving you chances to repeat the practices you have learned. You can spread them out: one after breakfast, one after work. **Each Reset is saved the moment you finish it**, even if the rest of your day gets busy."
- `:30` reveal detail: "A lesson, a check-in, one ticked to-do and the Resets the day lists. Finish them all and the next day of your plan opens."
- `:34`: "Alongside these guided practices, your routine gives you **small habits to try through the day**. Tick one off on the Routine tab, then claim it on your plan: one ticked to-do a day moves your plan forward, and the rest are yours to skip. And **every habit you finish keeps your streak going**, your count of days in a row."
- `:37` prompt: "You finish today’s plan steps and claim one to-do, but skip your evening habit. What happens to your plan?" Option 1 feedback: "Right. One claimed to-do is all the plan asks of your routine. Your evening habit waits on the Routine tab, ready for another try tomorrow." Option 2 feedback: "The plan asks for one to-do a day, not all of them. Once the day’s steps and one claimed to-do are done, the next plan day opens, even with a habit skipped."
- `:43` do: "Look at **today’s steps on Home**, then open **the Routine tab** and pick one to-do. Start with whichever fits right now. One small step done today is a real start."
- Update the rule descriptions in `source` at `:46`, `:214`, `:276` to say the advance requires the to-do claim.

`lifeResetLessons.ts`:
- `:49` (`focus.return`): "Your plan is the list of steps Azora has chosen for each day. **A plan day includes a few small steps**: a lesson like this one, a check-in about your mood, one to-do, and on most days a guided Reset."
- `:209` (`body.capacity`): "Your plan works with this. Your plan is the list of small daily steps this app gives you. **Each day has a few small things to do**: a lesson like this one, a quick check-in about your mood, one to-do, and on most days a short Reset."
- `:221` (`body.enough`): "Your plan in the app works the same way. Each day has a few small steps: a lesson like this one, a quick mood check-in, one to-do, and on most days a Reset. **You can rest with some steps still open.** They wait for you, right where you left off."
- `:489`, `:497` (`body.floor`, `quiet.no`): "Your plan in Azora is the list of small daily steps this app gives you. **Each day has a few small things to do**: a lesson like this one, a quick check-in about your mood, one to-do, and on most days a short Reset. A Reset is a short guided practice, a minute or two long, that helps you calm down or wake up."
- `:392`, `:432` unchanged.

Tests: pin revisions at `lessonCatalogue.test.mjs:481-482, 640-649, 657-663`
instead of reading latest where needed; add: on every latest plan and track, a
zero-Reset day's lesson prose does not match
`/today’s (first |breathing )?Reset|today’s plan includes a Reset|5-4-3-2-1|Muscle Release/`
(this test lands with step 9 once light days exist).

### 4. Migration `supabase/migrations/20261011000100_plan_todo_step.sql`
Base `advance_program_day_if_ready` on `20260922000100` (latest definition).
- `alter table program_enrollments add column todo_step_from_day int check (todo_step_from_day >= 1)`;
  add to `program_enrollment_json`.
- `adopt_plan_todo_step()` security definer, grant `authenticated` only: sets the
  active enrollment's `todo_step_from_day = program_day` where null; returns
  enrollment JSON.
- `advance_program_day_if_ready`: if the step is required for the current day and
  no `program_action_completions` row with `activity_id = 'todo:claim'` exists for
  `(enrollment_id, program_day)`, add 1 to `v_remaining`.
- Claim stored in `program_action_completions` (`activity_id = 'todo:claim'`,
  `activity_revision 1`, `on conflict do nothing`).
- `claim_plan_todo_step(p_claim jsonb {localDate})` definer; revoke public/anon,
  grant authenticated. Mirror `record_lesson_read`: date shape/range check, lock
  active enrollment `for update`, shown-day rule (`last_advanced_on = date and
  program_day > 1` → `program_day - 1`), refuse `not_required`, refuse
  `no_todo_ticked` unless a `self_care_goal_completions` row exists for that user
  and `local_date`. Return `{outcome:'recorded', coinsAwarded: inserted ? 10 : 0,
  enrollmentId, programDay, activityId}`.
- `advance_plan_after_lesson_completion` trigger fires for `lesson:%` or `todo:claim`.
- `grant_coins_for_daily_plan_completion`: 10 coins for `todo:claim`, reason
  `daily_plan_todo_claim`.
- Update `supabase/README.md`, `src/services/supabase/database.types.ts`.

### 4b. Side-fix migrations (separate files)
- `20261011000200_restore_attention_counter.sql`: restore the
  `attention_session_count` bump (`20261002000200:155-167`) into the current
  `advance_program_day` (`20261003000200`/`0300`).
- `20261011000300_revoke_advance_if_ready.sql`: `revoke execute on function
  advance_program_day_if_ready(uuid, date) from authenticated` (and public/anon).
  Confirm no client caller first.

### 5. Client domain + service
- `coins.ts`: `todoStep: 10` ("mirrors the completion trigger").
- New `src/features/program/domain/programTodoStep.ts`: `PLAN_TODO_ACTIVITY_ID =
  'todo:claim'`, `programDayAsksForTodo(enrollment, day)`, pure
  `todoStepState({required, claimed, goals})`.
- `ProgramEnrollmentV3` (`programEnrollment.ts:66-80`): `todoStepFromDay: number | null`.
- `programEnrollmentService.ts`: column in `ENROLLMENT_COLUMNS` (:53) and
  `sanitizeEnrollmentRow`; `todo_step_from_day: 1` on insert (:238-247); call
  `adopt_plan_todo_step` once in `getCurrentProgramEnrollment` (:188) when active
  and null.
- `useTodayProgramDay.ts`: expose `todoStep: {required, claimed} | null`.
- New `src/services/program/planTodoStepService.ts` + `src/queries/program/useClaimPlanTodoStepMutation.ts`
  modelled on `useRecordLessonReadMutation`: optimistic union of `todo:claim` into
  the exact `ProgramDayCompletions` key; invalidate the `ProgramDayCompletions`
  user prefix and exact `ProgramEnrollment`; `optimisticCoinCredit(EARN_RATES.todoStep)`
  on Wallet, reverted on failure. Await pending to-do toggle mutations before the
  call, or retry `no_todo_ticked` once.
- `docs/query-cache-invalidation-map.md`: add the claim mutation and the adopt write.
- Tests: `programTodoStep.test.mjs` (incl. un-tick after claim), service round-trip.

### 6. Day units
- `dayUnit.ts:15` `DayUnitKind` gains `'todo'`.
- New `src/hooks/dayUnits/useTodoDayUnit.ts`: `{kind:'todo', id:'todo:claim',
  title:'Do a to-do', techniqueId:null, completed}`, present only when required.
- `useDailiesCompletion.ts` merge order `[exercises, mood, lesson, todo]`.
- Update docstrings saying to-dos never gate: `dayCompletion.ts:1-12`,
  `useDayCompletion.ts:24-28`, `useRoomClaim.ts:25`, `HomeScreen.tsx:369-371`.

### 7. Home row
- `TodaysDailiesSection.tsx`: `buildTodoStepDailyRow({state, onPress})`, own
  `CategoryStyle`, `coins: EARN_RATES.todoStep`. `DailyTaskRow` `claim` variant:
  amber `ChunkyButton` "Claim +10".
- `TodoListSection.tsx` journey mode: `trailingRow?: {id, row}`; id
  `'todoStep:today'` (must not start with `todo:`). `useJourneyReorder` gains
  `fixedTailId` (no drag start, drop index clamped above it, stripped before
  `commitVisibleOrder`). Not in untimed order or storage.
- `HomeScreen.tsx`: build the row next to untimed rows (:162-189), through
  `withProGate`.
- New `src/features/plan/useTodoStepAction.ts` (shared by Home and
  `useNextTodayStep`): `add`/`open` → `navigate('MainTabs', {screen:'Plan'})`;
  `claimable` → `dayCompleteUnitId` per `LessonScreen.tsx:201-217`, fire mutation,
  `navigate('ActivityReward', {kind:'todo', coins:10, dayCompleteUnitId})`.
- ActivityReward `'todo'` kind (`types.ts:71`, `activityResultCopy.ts`): subtitle
  "One thing off your list. That’s how better days add up."; share line "Today’s
  small win: getting one thing on my list done."

### 8. Plan path + next step
- `useNextTodayStep.ts:66-82`: append `{id:'todoStep:today', done}` last.
- `planPath.ts`: `'todo'` row kind, label "To-do", `coins: EARN_RATES.todoStep`,
  when the day requires it; `PlanPath.tsx:609-620`; icon in `PathDayCard.tsx:38` `ROW_ICONS`.

### 9. New revisions + onboarding copy
- `programCatalogue.ts` after :2067: `EASY_START_AND_LIGHT_DAYS` + `easyStartRevision(previous)`
  splitting predecessor blocks at day 1, day 3 (quiet: 5) and each light day,
  explicit per-day rotations, unique block reasons. Append to `PUBLISHED_REVISIONS`.
  `LESSON_SEQUENCES` unchanged.
- Block reasons: Day 1 "Day 1: no Reset today. Check in, read today’s lesson and tick off one to-do. Your first Reset is tomorrow." · Light day "Day N: a lighter day with no Reset. Check in, read today’s lesson and tick off one to-do. Your Resets are back tomorrow." · Day 3 "Day 3: try 5-4-3-2-1: notice things you can see, hear, touch, smell and taste. The Reset guides each step. ${purpose}" · Night day 3 "Day 3: 5-4-3-2-1 on its own tonight, so it is ready the next time you wake in the night."
- Light days:

| Plan | Light day → lesson |
|---|---|
| Night (28) | 14 `sleep.alcohol` · 21 `sleep.nap` · 26 `quiet.bodyfirst` |
| Morning (28) | 13 `body.walk` · 19 `sleep.hours` · 25 `focus.ready` |
| Focus (42) | 13 `focus.readback` · 19 `body.walk` · 25 `anger.rumination` · 31 `sleep.hours` · 37 `sleep.debt` |
| Home (28) | 12 `focus.livedin` · 18 `focus.category` · 24 `body.appetite` |
| Phone (28) | 12 `focus.capture` · 18 `focus.unlock` · 25 `quiet.kind` |
| Recovery (28) | 13 `body.comfort` · 19 `body.hour` · 24 `anger.bucket` |
| Self-trust (42) | 16 `quiet.when` · 25 `anger.rumination` · 30 `body.movement` · 37 `body.thirst` |
| Quiet (42) | 16 `quiet.waiting` · 24 `body.movement` · 30 `quiet.rested` · 37 `body.inertia` |
| Pressure (56) stress / overthinking / anger | 11 · 18 · 26 · 38 · 44 · 50 (verified clean on all three tracks) |

- Onboarding: `programPlanPreview.ts:41-45` / `PlanDaysScreen.tsx:74-80` add a "Do a
  to-do" row; `planFirstDayLine` (`onboardingPreset.ts:376-388`): "Day 1 is a
  check-in, one short lesson and one to-do. Your first Reset is on day 2.";
  `OnboardingFlow.tsx:2846` unused `firstDayMinutes` prop — delete; `intentOptions.ts`
  "We’ll start with …" lines (:21, 59, 92, 125, 227, 289, 352, 417): "We’ll start
  with a check-in, a lesson and one to-do, then short guided Resets from day 2 and
  lessons about …".
- Leftover copy from step 3: `planLessons.ts` `plan.two` (~:202, :206) and
  `plan.bad` (~:252, :265-266) still say the next day opens after "the Resets, the
  lesson and the check-in" — add the one claimed to-do and drop any promise of a
  Reset every day. `notificationCatalog.ts:48` session `onboardingTitle` "First
  reset" → "Your plan" (day 1 has no Reset).
- Tests per `programCatalogue.test.mjs` notes: day 1 empty, days 2–5 ≤1 Reset,
  light days rules, revision equals predecessor elsewhere; lesson-copy guard.

### 10. Side fix: `parseStoredOrder`
Verify whether `todayJourneyOrder.ts:23-27` rejects stored orders containing
`mood:today` / `lesson:today` (resetting Home order every cold start). Fix only if
confirmed, with a test.

### 11. Docs
`docs/plans/reset-types-and-lesson-pairing.md` (light days, day 1, North Star note:
days 1–7 now hold ~7 Resets, down from 9), `docs/plans/lesson-catalogue-plan.md`.
