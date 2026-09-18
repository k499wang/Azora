import type { LessonId } from './lessonCatalogue';

/**
 * How a lesson read is written down among the day's other completions.
 *
 * A read is stored in `program_action_completions` beside the day's exercises,
 * because that table already means "this enrollment did this thing on this day
 * of its plan" and a lesson is placed by program day in the first place.
 *
 * The prefix is what keeps a lesson id from ever colliding with an activity id
 * out of the catalogue in a column the two of them share — they are the same
 * primary key, so a collision would credit an exercise nobody did. It is also
 * how the day tells them apart on the way back out, which is why both ends live
 * here rather than being spelled out at each of them.
 *
 * Pure, and kept out of the service, so it can be tested without a client.
 */
const LESSON_ACTIVITY_PREFIX = 'lesson:';

export function lessonActivityId(lessonId: LessonId): string {
  return `${LESSON_ACTIVITY_PREFIX}${lessonId}`;
}

export function isLessonActivityId(activityId: string): boolean {
  return activityId.startsWith(LESSON_ACTIVITY_PREFIX);
}
