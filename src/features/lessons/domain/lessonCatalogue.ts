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
import { lessonIdOfActivity } from './lessonActivity';
import { BREATH_LESSONS } from './lessons/breathLessons';
import { PLAN_LESSONS } from './lessons/planLessons';
import { SLEEP_LESSONS } from './lessons/sleepLessons';
import { BODY_LESSONS } from './lessons/bodyLessons';
import { ANGER_LESSONS } from './lessons/angerLessons';
import { FOCUS_LESSONS } from './lessons/focusLessons';
import { QUIET_LESSONS } from './lessons/quietLessons';
import { LIFE_RESET_LESSONS } from './lessons/lifeResetLessons';
import { RECOVERY_LESSONS } from './lessons/recoveryLessons';

export type { LessonBlock, LessonListItem, LessonProse } from './lessonBlock';

/** Bumped when a lesson's text changes in a way that changes what it said. */
export const LESSON_REVISION = 5;

/**
 * Every lesson, by family.
 *
 * Grouped by topic because this is the part that keeps growing. The order
 * here is only the order they are declared; where each one lands is decided by
 * the sequences below.
 */
const LESSON_LIST = [
  ...BREATH_LESSONS,
  ...PLAN_LESSONS,
  ...SLEEP_LESSONS,
  ...BODY_LESSONS,
  ...ANGER_LESSONS,
  ...FOCUS_LESSONS,
  ...QUIET_LESSONS,
  ...LIFE_RESET_LESSONS,
  ...RECOVERY_LESSONS,
] as const;

/**
 * Derived from the content, never written out beside it.
 *
 * A hand-maintained union gives each id a chance to
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
 * Lessons no sequence places any more, still shipped on purpose.
 *
 * An enrollment snapshot names the exact lesson for each of its days, and the
 * server will not finish a day without that read. A lesson taken out of every
 * sequence is still named by the snapshots taken before it was, so deleting it
 * would strand everybody part-way through the revision that still has it.
 */
export const RETIRED_LESSON_IDS: readonly LessonId[] = [
  'plan.expect',
  'plan.hour',
  'plan.stacking',
  'plan.low',
  'plan.two',
  'plan.streak',
  'plan.bad',
  'plan.consistency',
];

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
 * within itself; across the nine, 142 active lessons fill 322 days.
 * General plan lessons stay limited to setup, early review, returning after
 * a missed day, and finishing. Other days teach the goal the user chose.
 *
 * Each list is its plan's length exactly, which is checked rather than trusted.
 *
 * These follow the **latest** revision of each plan. Somebody enrolled on an
 * older one reads the lessons their snapshot names, through
 * `programDayLesson`, never these. For night, morning, pressure, focus and
 * quiet, days 1 to 10 are pinned to the home-session opening of revision 2 and
 * `plan.grows` lands on the day the plan starts asking for two every day: day 8
 * for night, pressure and quiet, day 11 for morning and focus.
 */
export const LESSON_SEQUENCES: Record<ProgramPlanId, readonly LessonId[]> = {
  night: [
    'breath.exhale',
    'sleep.room',
    'sleep.threeam',
    'plan.missed',
    'sleep.bed',
    'sleep.worry',
    'plan.week',
    'plan.grows',
    'sleep.wind',
    'sleep.caffeine',
    'sleep.noise',
    'sleep.screen',
    'body.evening',
    'sleep.alcohol',
    'sleep.anchor',
    'quiet.rested',
    'sleep.hours',
    'sleep.weekend',
    'sleep.light',
    'sleep.meal',
    'sleep.nap',
    'sleep.debt',
    'body.inertia',
    'quiet.kind',
    'sleep.clock',
    'quiet.bodyfirst',
    'focus.offline',
    'plan.after',
  ],
  morning: [
    'breath.wake',
    'body.inertia',
    'sleep.light',
    'plan.missed',
    'sleep.anchor',
    'body.movement',
    'plan.week',
    'sleep.caffeine',
    'body.dip',
    'body.firststeps',
    'plan.grows',
    'body.strength',
    'body.walk',
    'body.morningfood',
    'sleep.weekend',
    'body.morningprep',
    'body.sitting',
    'body.thirst',
    'sleep.hours',
    'sleep.nap',
    'body.appetite',
    'focus.three',
    'body.evening',
    'quiet.moving',
    'focus.ready',
    'sleep.wind',
    'sleep.debt',
    'plan.after',
  ],
  pressure: [
    'breath.exhale',
    'quiet.namefeeling',
    'anger.recovery',
    'plan.missed',
    'anger.meter',
    'anger.cues',
    'plan.week',
    'plan.grows',
    'anger.belief',
    'body.movement',
    'quiet.gap',
    'anger.oneproblem',
    'sleep.debt',
    'anger.bucket',
    'anger.expectation',
    'sleep.anchor',
    'anger.timeout',
    'quiet.notice',
    'body.dip',
    'sleep.caffeine',
    'anger.control',
    'anger.send',
    'anger.askhelp',
    'quiet.onesound',
    'body.walk',
    'anger.rumination',
    'anger.boring',
    'quiet.wander',
    'sleep.wind',
    'anger.assert',
    'anger.driving',
    'body.sitting',
    'quiet.thoughts',
    'anger.repair',
    'quiet.boredom',
    'quiet.bodyfirst',
    'focus.ready',
    'anger.afterstress',
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
    'quiet.eyes',
    'plan.after',
  ],
  focus: [
    'breath.exhale',
    'focus.nextstep',
    'focus.ready',
    'plan.missed',
    'focus.phone',
    'focus.three',
    'plan.week',
    'focus.switch',
    'body.dip',
    'focus.hard',
    'plan.grows',
    'focus.parkthought',
    'focus.readback',
    'focus.inbox',
    'anger.cues',
    'body.movement',
    'focus.blocks',
    'focus.badges',
    'body.walk',
    'sleep.anchor',
    'focus.words',
    'quiet.notice',
    'body.sitting',
    'sleep.caffeine',
    'anger.rumination',
    'body.inertia',
    'focus.place',
    'anger.control',
    'body.thirst',
    'focus.stop',
    'sleep.hours',
    'quiet.rested',
    'body.appetite',
    'quiet.moving',
    'sleep.light',
    'focus.done',
    'sleep.debt',
    'anger.boring',
    'quiet.gap',
    'quiet.kind',
    'quiet.thoughts',
    'plan.after',
  ],
  quiet: [
    'breath.exhale',
    'quiet.two',
    'quiet.bodyfirst',
    'plan.missed',
    'quiet.notice',
    'quiet.wander',
    'plan.week',
    'plan.grows',
    'quiet.gap',
    'quiet.beginner',
    'quiet.moving',
    'anger.cues',
    'quiet.onesound',
    'quiet.eyes',
    'quiet.namefeeling',
    'quiet.waiting',
    'body.dip',
    'quiet.thoughts',
    'quiet.boredom',
    'anger.control',
    'anger.rumination',
    'anger.meter',
    'anger.recovery',
    'body.movement',
    'sleep.anchor',
    'anger.belief',
    'body.thirst',
    'focus.phone',
    'anger.bucket',
    'quiet.rested',
    'anger.timeout',
    'focus.parkthought',
    'sleep.caffeine',
    'anger.boring',
    'body.sitting',
    'focus.badges',
    'body.inertia',
    'quiet.kind',
    'sleep.hours',
    'anger.expectation',
    'sleep.wind',
    'plan.after',
  ],
  home: [
    'plan.grows',
    'focus.home',
    'focus.category',
    'focus.eyes',
    'focus.sort',
    'focus.visible',
    'focus.bin',
    'focus.timer',
    'focus.landing',
    'focus.blocks',
    'focus.edge',
    'focus.livedin',
    'body.dip',
    'focus.phone',
    'focus.homelaundry',
    'body.sitting',
    'focus.doorway',
    'anger.rumination',
    'focus.homedishes',
    'body.thirst',
    'quiet.kind',
    'focus.homeshared',
    'focus.inbox',
    'body.appetite',
    'focus.return',
    'focus.ready',
    'focus.done',
    'plan.after',
  ],
  phone: [
    'plan.grows',
    'focus.loop',
    'focus.ending',
    'focus.unlock',
    'focus.default',
    'focus.pull',
    'focus.hands',
    'anger.rumination',
    'focus.save',
    'focus.wait',
    'focus.company',
    'focus.capture',
    'sleep.wind',
    'focus.phonepurpose',
    'focus.charger',
    'sleep.caffeine',
    'focus.place',
    'sleep.worry',
    'focus.phonemessages',
    'sleep.anchor',
    'quiet.thoughts',
    'focus.phonebed',
    'focus.offline',
    'sleep.threeam',
    'quiet.kind',
    'focus.phone',
    'focus.badges',
    'plan.after',
  ],
  recovery: [
    'plan.grows',
    'body.capacity',
    'body.corner',
    'body.gentle',
    'body.signal',
    'body.comfort',
    'body.floor',
    'body.sight',
    'body.decision',
    'sleep.anchor',
    'body.finish',
    'body.returnpath',
    'body.movement',
    'body.restchoice',
    'body.dip',
    'sleep.hours',
    'quiet.moving',
    'body.walk',
    'body.hour',
    'body.shareload',
    'body.sitting',
    'quiet.bodyfirst',
    'sleep.light',
    'anger.bucket',
    'quiet.wander',
    'body.enough',
    'body.energycost',
    'plan.after',
  ],
  selfTrust: [
    'plan.grows',
    'quiet.trust',
    'quiet.when',
    'quiet.story',
    'quiet.cue',
    'anger.control',
    'quiet.yes',
    'quiet.voice',
    'quiet.yesterday',
    'quiet.plain',
    'anger.send',
    'quiet.no',
    'quiet.repair',
    'quiet.smalldecision',
    'quiet.wander',
    'anger.assert',
    'quiet.askadvice',
    'quiet.bodyfirst',
    'anger.cues',
    'focus.badges',
    'quiet.kind',
    'quiet.receipt',
    'quiet.changemind',
    'quiet.moving',
    'anger.rumination',
    'focus.words',
    'quiet.notice',
    'quiet.eyes',
    'anger.timeout',
    'body.movement',
    'quiet.boredom',
    'quiet.boundary',
    'quiet.gap',
    'focus.done',
    'sleep.anchor',
    'anger.bucket',
    'body.thirst',
    'quiet.rested',
    'sleep.caffeine',
    'body.inertia',
    'quiet.beginner',
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
  | 'breath'
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
 * information that decides whether it is worth a few minutes today.
 */
const SUBJECT_ROW_TITLE: Record<LessonSubject, string> = {
  breath: 'Learn how your reset works',
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

/**
 * The lesson a stored lesson activity id names.
 *
 * Null for an id that is not a lesson's or that this build does not carry: a
 * snapshot can outlive the build that wrote it, and a day with no lesson to
 * draw is better than a screen that throws.
 */
export function lessonForActivityId(activityId: string): Lesson | null {
  const lessonId = lessonIdOfActivity(activityId);
  return lessonId == null ? null : LESSONS.get(lessonId) ?? null;
}
