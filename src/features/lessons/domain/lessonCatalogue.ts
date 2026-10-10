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
import { ATTENTION_LESSONS } from './lessons/attentionLessons';
import { PRE_SHORT_RESET_LESSON_SEQUENCES } from './historicalLessonSequences';
import { PRESSURE_ATTENTION_LESSONS, TEACHING_PRESSURE_MUSCLE_LESSONS } from './lessons/pressureAttentionLessons';
import { PRACTICAL_LESSONS } from './lessons/practicalLessons';
import { PRE_TEACHING_LESSON_SEQUENCES, PRE_TEACHING_PRESSURE_SEQUENCES } from './preTeachingLessonSequences';
import { PRE_GOAL_FIRST_LESSON_SEQUENCES } from './preGoalFirstLessonSequences';
import { PRE_ALL_GOAL_FIRST_LESSON_SEQUENCES, PRE_ALL_GOAL_FIRST_PRESSURE_SEQUENCES } from './preAllGoalFirstLessonSequences';
import { STRESS_LESSONS } from './lessons/stressLessons';
import { WORRY_LESSONS } from './lessons/worryLessons';
import { PRESSURE_LESSON_SEQUENCES } from './pressureLessonSequences';
import type { PressureLessonTrack } from './pressureLessonTrack';

export { PRESSURE_LESSON_SEQUENCES } from './pressureLessonSequences';

export type { LessonBlock, LessonListItem, LessonProse } from './lessonBlock';

/** Bumped when a lesson's text changes in a way that changes what it said. */
export const LESSON_REVISION = 9;

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
  ...ATTENTION_LESSONS,
  ...PRESSURE_ATTENTION_LESSONS,
  ...TEACHING_PRESSURE_MUSCLE_LESSONS,
  ...PRACTICAL_LESSONS,
  ...STRESS_LESSONS,
  ...WORRY_LESSONS,
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
  'attention.senses',
  'attention.muscles',
  'attention.return', 'attention.week', 'plan.week', 'plan.after', 'quiet.yesterday',
  'attention.musclesmorning', 'attention.musclesfocus', 'attention.musclesquiet',
  'attention.muscleshome', 'attention.musclesphone', 'attention.musclesrecovery',
  'attention.musclesselftrust', 'attention.musclesstress',
  'attention.musclesoverthinking', 'attention.musclesanger',
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
 * within itself; the nine plans reuse shared lessons across their daily steps.
 * General plan lessons stay limited to setup, practical teaching, returning after
 * a missed day, and finishing. Other days teach the goal the user chose.
 *
 * Each list is its plan's length exactly, which is checked rather than trusted.
 *
 * These follow the **latest** revision of each plan. Somebody enrolled on an
 * older one reads the lessons their snapshot names, through
 * `programDayLesson`, never these. Every current plan introduces guided tools
 * beside its matching lesson and adds another regular Reset on day 8.
 * Older lesson IDs stay available for existing enrollment snapshots.
 */
export const LESSON_SEQUENCES: Record<ProgramPlanId, readonly LessonId[]> = {
  night: [
    'sleep.room',
    'breath.exhale',
    'sleep.threeam',
    'plan.missed',
    'sleep.bed',
    'sleep.worry',
    'plan.clear',
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
    'plan.carry',
  ],
  morning: [
    'body.inertia',
    'breath.wake',
    'attention.sensesmorning',
    'attention.anchor',
    'sleep.anchor',
    'attention.musclesmorningready',
    'attention.effort',
    'attention.grows',
    'body.dip',
    'body.firststeps',
    'sleep.light',
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
    'plan.carry',
  ],
  pressure: PRESSURE_LESSON_SEQUENCES.stress,
  focus: [
    'focus.nextstep',
    'breath.exhale',
    'attention.sensesfocus',
    'attention.anchor',
    'focus.phone',
    'attention.musclesfocusready',
    'attention.effort',
    'attention.grows',
    'body.dip',
    'focus.hard',
    'focus.ready',
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
    'plan.carry',
  ],
  quiet: [
    'quiet.onesound',
    'quiet.two',
    'quiet.bodyfirst',
    'plan.missed',
    'attention.sensesquiet',
    'attention.musclesquietready',
    'attention.effort',
    'attention.grows',
    'quiet.gap',
    'quiet.beginner',
    'quiet.notice',
    'anger.cues',
    'breath.exhale',
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
    'plan.carry',
  ],
  home: [
    'focus.visible',
    'focus.home',
    'attention.senseshome',
    'attention.anchor',
    'focus.sort',
    'attention.muscleshomeready',
    'attention.effort',
    'attention.grows',
    'focus.landing',
    'focus.blocks',
    'focus.edge',
    'focus.livedin',
    'breath.exhale',
    'focus.bin',
    'focus.homelaundry',
    'focus.timer',
    'focus.doorway',
    'focus.category',
    'focus.homedishes',
    'focus.eyes',
    'quiet.kind',
    'focus.homeshared',
    'focus.inbox',
    'body.appetite',
    'focus.return',
    'focus.ready',
    'focus.done',
    'plan.carry',
  ],
  phone: [
    'focus.default',
    'focus.loop',
    'attention.sensesphone',
    'attention.anchor',
    'breath.exhale',
    'attention.musclesphoneready',
    'attention.effort',
    'attention.grows',
    'focus.save',
    'focus.wait',
    'focus.company',
    'focus.capture',
    'focus.pull',
    'focus.phonepurpose',
    'focus.charger',
    'focus.hands',
    'focus.ending',
    'focus.unlock',
    'focus.phonemessages',
    'sleep.anchor',
    'quiet.thoughts',
    'focus.phonebed',
    'focus.offline',
    'sleep.threeam',
    'quiet.kind',
    'focus.phone',
    'focus.badges',
    'plan.carry',
  ],
  recovery: [
    'body.signal',
    'body.capacity',
    'attention.sensesrecovery',
    'attention.anchor',
    'breath.exhale',
    'attention.musclesrecoveryready',
    'attention.effort',
    'attention.grows',
    'body.decision',
    'sleep.anchor',
    'body.finish',
    'body.returnpath',
    'body.comfort',
    'body.restchoice',
    'body.floor',
    'body.sight',
    'body.shareload',
    'body.gentle',
    'body.hour',
    'body.corner',
    'body.sitting',
    'quiet.bodyfirst',
    'sleep.light',
    'anger.bucket',
    'quiet.wander',
    'body.enough',
    'body.energycost',
    'plan.carry',
  ],
  selfTrust: [
    'quiet.smalldecision',
    'quiet.trust',
    'attention.sensesselftrust',
    'attention.anchor',
    'quiet.cue',
    'attention.musclesselftrustready',
    'attention.effort',
    'attention.grows',
    'quiet.prepare',
    'quiet.plain',
    'quiet.yes',
    'quiet.no',
    'quiet.repair',
    'breath.exhale',
    'quiet.voice',
    'quiet.when',
    'quiet.askadvice',
    'quiet.story',
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
    'plan.carry',
  ],
};

/**
 * The families a lesson can belong to, which is the first half of its id.
 *
 * Not a field on the lesson: the id already says it, the files are grouped by
 * it, and a second copy is a second thing to keep true.
 */
export type LessonSubject =
  | 'stress'
  | 'worry'
  | 'attention'
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
  attention: 'Learn how to use your Reset',
  stress: 'Learn a small step for stressful days',
  worry: 'Learn a small step for repeated worries',
  plan: 'Learn how your plan works',
  sleep: 'Learn a quick sleeping tip',
  body: 'Learn a quick energy tip',
  anger: 'Learn a quick stress tip',
  focus: 'Learn a quick focus tip',
  quiet: 'Learn a quick calming tip',
};

// Name the practical action so the opening step visibly matches the goal.
const PRACTICAL_ROW_TITLE: Partial<Record<LessonId, string>> = {
  'sleep.room': 'Make your room comfortable for sleep',
  'body.inertia': 'Find some light as you wake up',
  'focus.nextstep': 'Choose one clear next action',
  'quiet.onesound': 'Listen to one nearby sound',
  'stress.signs': 'Notice stress and choose what you need',
  'worry.loop': 'Check one repeated worry',
  'anger.meter': 'Notice anger before you react',
  'focus.visible': 'Clear one small spot',
  'focus.default': 'Move one distracting app',
  'body.signal': 'Meet one small need',
  'quiet.smalldecision': 'Make one small choice for yourself',
};

export function lessonRowTitle(id: LessonId): string {
  return PRACTICAL_ROW_TITLE[id] ?? SUBJECT_ROW_TITLE[lessonSubject(id)];
}

/**
 * The lesson this day of this plan asks for.
 *
 * Null only off the end of the plan — every day inside one has a lesson. A day
 * number is 1-based, matching `ProgramDayDefinition.day`, so the index is one
 * behind it.
 */
const LAST_PRE_SHORT_RESET_REVISION: Partial<Record<ProgramPlanId, number>> = {
  pressure: 2, morning: 2, focus: 2, quiet: 2, home: 1, phone: 1, recovery: 1, selfTrust: 1,
};

const LAST_GENERIC_OPENING_REVISION: Partial<Record<ProgramPlanId, number>> = {
  night: 3, morning: 5, pressure: 5, focus: 5, quiet: 5,
};

const LAST_REVIEW_LESSON_REVISION: Record<ProgramPlanId, number> = {
  night: 2, morning: 3, pressure: 3, focus: 3, quiet: 3,
  home: 2, phone: 2, recovery: 2, selfTrust: 2,
};

/** Published teaching editions omit the player's retrospective follow-up card. */
export function usesPracticalLessonSequence(planId: ProgramPlanId, presetRevision: number): boolean {
  return presetRevision > LAST_REVIEW_LESSON_REVISION[planId];
}

const FIRST_GENTLE_WEEK_REVISION: Record<ProgramPlanId, number> = {
  night: 8, morning: 10, pressure: 10, focus: 10, quiet: 10,
  home: 9, phone: 9, recovery: 9, selfTrust: 9,
};

// Move breathing lessons onto later practice days; keep every lesson once.
// Earlier editions and snapshots without lesson IDs still use their old order.
const GENTLE_WEEK_LESSON_SWAPS: Record<ProgramPlanId, readonly (readonly [number, number])[]> = {
  night: [[4, 13], [7, 15]],
  morning: [[4, 23], [7, 21]],
  pressure: [[4, 23], [7, 51]],
  focus: [[4, 12], [7, 21]],
  quiet: [[4, 25], [7, 28]],
  home: [[4, 16], [7, 22]],
  phone: [[4, 11], [5, 23], [7, 17]],
  recovery: [[4, 12], [5, 17], [7, 22]],
  selfTrust: [[4, 11], [7, 17]],
};

export function lessonForDay(
  planId: ProgramPlanId,
  programDay: number,
  presetRevision?: number,
  pressureLessonTrack: PressureLessonTrack = 'stress',
): Lesson | null {
  const historical = presetRevision != null && presetRevision <= (LAST_PRE_SHORT_RESET_REVISION[planId] ?? 0)
    ? PRE_SHORT_RESET_LESSON_SEQUENCES[planId]
    : undefined;
  const current = planId === 'pressure'
    ? PRESSURE_LESSON_SEQUENCES[pressureLessonTrack]
    : LESSON_SEQUENCES[planId];
  const previous = presetRevision != null && !usesPracticalLessonSequence(planId, presetRevision)
    ? planId === 'pressure'
      ? PRE_TEACHING_PRESSURE_SEQUENCES[pressureLessonTrack]
      : PRE_TEACHING_LESSON_SEQUENCES[planId]
    : undefined;
  const teaching = presetRevision === 3 ? PRE_GOAL_FIRST_LESSON_SEQUENCES[planId] : undefined;
  const genericOpening = presetRevision != null && presetRevision <= (LAST_GENERIC_OPENING_REVISION[planId] ?? 0)
    ? planId === 'pressure'
      ? PRE_ALL_GOAL_FIRST_PRESSURE_SEQUENCES[pressureLessonTrack]
      : PRE_ALL_GOAL_FIRST_LESSON_SEQUENCES[planId]
    : undefined;
  let lessonDay = programDay;
  if (presetRevision == null || presetRevision >= FIRST_GENTLE_WEEK_REVISION[planId]) {
    const swap = GENTLE_WEEK_LESSON_SWAPS[planId].find((pair) => pair.includes(programDay));
    if (swap) lessonDay = swap[0] === programDay ? swap[1] : swap[0];
    // Anger's day-five lesson includes a breathing prompt; the other tracks
    // already have a practical lesson suitable for a day without a Reset.
    if (planId === 'pressure' && pressureLessonTrack === 'anger') {
      if (programDay === 5) lessonDay = 45;
      if (programDay === 45) lessonDay = 5;
    }
  }
  const lessonId = (historical ?? previous ?? teaching ?? genericOpening ?? current)[lessonDay - 1];
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
