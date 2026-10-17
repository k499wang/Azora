# Lessons, practical actions, and course reviews

The course remains the saved enrollment. Learning support does not generate or
rewrite its lessons, advance its days, or change access and reward rules.

## User-facing locations

- **Lesson:** existing learning introduction and interactive teaching, then a
  recap before completion/reward. The recap can add its action as a one-off
  My To-dos item. The next lesson asks about the nearest earlier scheduled
  lesson, including when there are days without lessons in between.
- **My To-dos task detail:** “Show me how” and “Make it smaller” reveal guidance.
  Known authored titles have specific instructions; custom titles receive
  planning help. Suggestions do not edit or complete the original task.
- **Profile:** reported attempts and up to three recent strategies for the
  current enrollment, separate from completed activities and measured outcomes.

## State and persistence

`useLearningProgress` is instantiated once at each owning screen. Presentational
children receive records and semantic callbacks. The query key is
`['learning-practice', userId, enrollmentId]`.

`services/learning/learningPracticeStorage.ts` stores self-reports in AsyncStorage,
scoped by encoded account and enrollment IDs. These are device-local records;
they do not sync across devices. Writes are serialized per key and retain one
latest response per program day, bounded to 84 days. Corrupt entries are
ignored. Switching accounts or courses selects a different key. Nothing is
inferred about reported practice from reading a lesson or ticking a task.

A record identifies the exact saved lesson and day. Responses distinguish tried,
adapted, not yet, too hard, and unclear. Only an explicit tried/adapted response
may have a helpfulness rating. Profile ignores mismatched saved lesson IDs.
Feedback offers a smaller first attempt or the lesson's worked explanation;
it does not prescribe an automatically changed course sequence.

Saving a self-report publishes the canonical local record list into its exact
query cache. A failed write exposes retry and must not be presented as saved.
Lesson lab previews do not save practice, create tasks, or grant rewards.
In development, Settings → Lesson Lab → “Preview next-lesson check-in” opens
the selected course's second lesson directly at its follow-up to the first.
Response controls work in memory and explicitly say nothing is saved.
The same lab also offers “Preview filled skills in Profile.” It renders the
real Profile summary with four in-memory reports for the selected course,
showing helpful, adapted, and tried states plus the three-row limit. It never
writes the sample enrollment or practice records.

## Tasks and completion

The recap's task handoff uses `useCreateSelfCareGoalsMutation`, the existing
serialized bulk-import path that reuses matching active tasks. The task title
is the lesson's authored step, with recurrence `once` and no scheduled time.
The ordinary 120-character task title limit applies. No second task system or
task completion record is introduced. Cross-device simultaneous task imports
retain the existing service's behavior; this change adds no server uniqueness
constraint.

Reading, reporting an attempt, finding a strategy helpful, and completing a
to-do are separate actions. Only existing completion mutations pay coins,
count towards plan progress, and trigger rewards. Practice-report and task-help
controls never call those completion mutations.

## Validation and remaining device checks

Domain/storage tests cover response validity, bounded repeated writes,
account/course isolation, saved lesson identity, goal tracks,
and malformed data. Existing lesson, navigation, sheet, and cache tests remain
part of verification. Device checks should cover short screens and large text,
adding/retrying a task, completing and revisiting lessons,
switching courses/accounts, and 5–10 complete return cycles in a release build.
Automated checks do not substitute for that visual and native navigation pass.
