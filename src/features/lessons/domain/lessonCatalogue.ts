/**
 * The lessons, and which day of which plan each one lands on.
 *
 * A lesson is one screen of reading attached to a day of the plan. It is not a
 * course, it has no audio, and there is no library to browse — it belongs to
 * its day the way an exercise does, and it is gone tomorrow.
 *
 * Content and placement live together here, immutable and revisioned the way
 * `programCatalogue.ts` is, because what somebody read on day 8 has to still be
 * answerable next year. Everything about how it looks lives in the screen.
 *
 * See `docs/plans/lesson-catalogue-plan.md` for the format rules and the
 * reasoning behind the placement.
 */

import type { ProgramPlanId } from '../../program/domain/programCatalogue';
import type { LessonBlock, LessonDefinition } from './lessonBlock';
import { PLAN_LESSONS } from './lessons/planLessons';
import { SLEEP_LESSONS } from './lessons/sleepLessons';
import { BODY_LESSONS } from './lessons/bodyLessons';
import { ANGER_LESSONS } from './lessons/angerLessons';
import { FOCUS_LESSONS } from './lessons/focusLessons';
import { QUIET_LESSONS } from './lessons/quietLessons';

export type { LessonBlock, LessonListItem, LessonProse } from './lessonBlock';

/** Bumped when a lesson's text changes in a way that changes what it said. */
export const LESSON_REVISION = 1;

/**
 * Every lesson, by family.
 *
 * Six files rather than one, because this is the part that keeps growing and a
 * single list of seventy-one is a file nobody can find anything in. The order
 * here is only the order they are declared; where each one lands is decided by
 * the sequences below.
 */
const LESSON_LIST = [
  ...PLAN_LESSONS,
  ...SLEEP_LESSONS,
  ...BODY_LESSONS,
  ...ANGER_LESSONS,
  ...FOCUS_LESSONS,
  ...QUIET_LESSONS,
] as const;

/**
 * Derived from the content, never written out beside it.
 *
 * Seventy-one ids in a hand-maintained union is seventy-one chances for one to
 * drift from the lesson it names. This way a typo in a sequence is a type
 * error, and adding a lesson is one entry in one file.
 */
export type LessonId = (typeof LESSON_LIST)[number]['id'];

export interface Lesson extends LessonDefinition {
  id: LessonId;
  blocks: readonly LessonBlock[];
}

const LESSONS: ReadonlyMap<string, Lesson> = new Map(
  LESSON_LIST.map((lesson) => [lesson.id, lesson as Lesson]),
);

export function allLessons(): readonly Lesson[] {
  return LESSON_LIST as readonly Lesson[];
}

export function lessonById(id: LessonId): Lesson {
  const lesson = LESSONS.get(id);
  if (lesson == null) throw new Error(`Unknown lesson: ${id}`);
  return lesson;
}

/**
 * Which lesson lands on which day, per plan. **One a day, position is the day.**
 *
 * A list rather than a list of `{ day, lessonId }` pairs: with one lesson every
 * day the day *is* the position, and a pair would let the two disagree — a gap,
 * a duplicate day, a day past the end of the plan. Here none of those can be
 * written down in the first place.
 *
 * Lessons are **shared between plans on purpose**. `sleep.debt` is the same
 * lesson whether somebody came for their sleep or for their temper, and writing
 * it twice is how two versions of it end up disagreeing. No plan repeats one
 * within itself; across the five, 71 lessons fill 196 days.
 *
 * Each list is its plan's length exactly, which is checked rather than trusted.
 */
export const LESSON_SEQUENCES: Record<ProgramPlanId, readonly LessonId[]> = {
  night: [
    'plan.grows',
    'plan.hour',
    'sleep.anchor',
    'sleep.light',
    'sleep.bed',
    'sleep.caffeine',
    'plan.expect',
    'sleep.wind',
    'plan.missed',
    'sleep.threeam',
    'sleep.worry',
    'plan.streak',
    'body.evening',
    'sleep.alcohol',
    'plan.week',
    'quiet.rested',
    'sleep.hours',
    'sleep.weekend',
    'plan.low',
    'plan.stacking',
    'sleep.nap',
    'sleep.debt',
    'body.inertia',
    'quiet.kind',
    'plan.two',
    'plan.bad',
    'plan.consistency',
    'plan.after',
  ],
  morning: [
    'plan.grows',
    'body.inertia',
    'sleep.anchor',
    'plan.hour',
    'sleep.light',
    'plan.expect',
    'body.movement',
    'plan.missed',
    'sleep.caffeine',
    'body.dip',
    'plan.week',
    'body.strength',
    'body.walk',
    'plan.low',
    'sleep.weekend',
    'plan.stacking',
    'body.sitting',
    'body.thirst',
    'sleep.hours',
    'plan.streak',
    'body.appetite',
    'plan.two',
    'body.evening',
    'quiet.moving',
    'focus.ready',
    'plan.bad',
    'plan.consistency',
    'plan.after',
  ],
  pressure: [
    'plan.grows',
    'anger.recovery',
    'plan.hour',
    'anger.meter',
    'plan.expect',
    'anger.cues',
    'sleep.debt',
    'plan.week',
    'anger.boring',
    'quiet.gap',
    'body.movement',
    'anger.belief',
    'plan.low',
    'anger.bucket',
    'anger.expectation',
    'sleep.anchor',
    'anger.timeout',
    'quiet.notice',
    'body.dip',
    'sleep.caffeine',
    'anger.control',
    'anger.send',
    'plan.two',
    'plan.stacking',
    'body.walk',
    'anger.rumination',
    'plan.missed',
    'quiet.wander',
    'sleep.wind',
    'anger.assert',
    'anger.driving',
    'body.sitting',
    'quiet.thoughts',
    'anger.repair',
    'quiet.boredom',
    'plan.streak',
    'focus.ready',
    'plan.bad',
    'sleep.bed',
    'body.thirst',
    'quiet.two',
    'quiet.kind',
    'sleep.alcohol',
    'focus.switch',
    'focus.phone',
    'body.inertia',
    'sleep.hours',
    'body.strength',
    'sleep.threeam',
    'focus.blocks',
    'body.appetite',
    'quiet.rested',
    'sleep.worry',
    'sleep.light',
    'plan.consistency',
    'plan.after',
  ],
  focus: [
    'plan.grows',
    'focus.ready',
    'plan.hour',
    'focus.switch',
    'plan.expect',
    'focus.phone',
    'focus.three',
    'plan.week',
    'focus.hard',
    'body.dip',
    'sleep.caffeine',
    'plan.stacking',
    'plan.low',
    'focus.inbox',
    'anger.cues',
    'body.movement',
    'focus.blocks',
    'focus.badges',
    'body.walk',
    'sleep.anchor',
    'focus.words',
    'plan.two',
    'body.sitting',
    'plan.missed',
    'anger.rumination',
    'body.inertia',
    'focus.place',
    'plan.bad',
    'body.thirst',
    'focus.stop',
    'sleep.hours',
    'quiet.rested',
    'body.appetite',
    'plan.streak',
    'sleep.light',
    'focus.done',
    'sleep.debt',
    'anger.boring',
    'quiet.gap',
    'quiet.kind',
    'plan.consistency',
    'plan.after',
  ],
  quiet: [
    'plan.grows',
    'quiet.two',
    'quiet.beginner',
    'quiet.gap',
    'plan.expect',
    'plan.hour',
    'anger.meter',
    'quiet.notice',
    'plan.week',
    'quiet.bodyfirst',
    'body.movement',
    'anger.cues',
    'quiet.wander',
    'quiet.eyes',
    'plan.low',
    'plan.stacking',
    'body.dip',
    'quiet.thoughts',
    'quiet.boredom',
    'anger.control',
    'anger.rumination',
    'quiet.moving',
    'plan.two',
    'plan.missed',
    'sleep.anchor',
    'anger.belief',
    'body.thirst',
    'focus.phone',
    'anger.bucket',
    'quiet.rested',
    'plan.bad',
    'plan.streak',
    'sleep.caffeine',
    'anger.boring',
    'body.sitting',
    'focus.badges',
    'body.inertia',
    'quiet.kind',
    'sleep.hours',
    'anger.expectation',
    'plan.consistency',
    'plan.after',
  ],
};

/**
 * The families a lesson can belong to, which is the first half of its id.
 *
 * Not a field on the lesson: the id already says it, the files are grouped by
 * it, and a second copy is a second thing to keep true.
 */
export type LessonSubject =
  | 'plan'
  | 'sleep'
  | 'body'
  | 'anger'
  | 'focus'
  | 'quiet';

export function lessonSubject(id: LessonId): LessonSubject {
  return id.slice(0, id.indexOf('.')) as LessonSubject;
}

/**
 * What the row on Home calls today's lesson.
 *
 * Not the lesson's own title, and not a bare "Lesson" either. The title is the
 * claim and belongs to the first page of the lesson; "Lesson" is a category,
 * and a row that only names its category gives nobody a reason to open it.
 * This says what kind of thing is inside, which is the one piece of
 * information that decides whether it is worth forty seconds today.
 */
const SUBJECT_ROW_TITLE: Record<LessonSubject, string> = {
  plan: 'Learn how your plan works',
  sleep: 'Learn a quick sleeping tip',
  body: 'Learn a quick energy tip',
  anger: 'Learn a quick stress tip',
  focus: 'Learn a quick focus tip',
  quiet: 'Learn a quick calming tip',
};

export function lessonRowTitle(id: LessonId): string {
  return SUBJECT_ROW_TITLE[lessonSubject(id)];
}

/**
 * The lesson this day of this plan asks for.
 *
 * Null only off the end of the plan — every day inside one has a lesson. A day
 * number is 1-based, matching `ProgramDayDefinition.day`, so the index is one
 * behind it.
 */
export function lessonForDay(
  planId: ProgramPlanId,
  programDay: number,
): Lesson | null {
  const lessonId = LESSON_SEQUENCES[planId][programDay - 1];
  return lessonId == null ? null : lessonById(lessonId);
}
