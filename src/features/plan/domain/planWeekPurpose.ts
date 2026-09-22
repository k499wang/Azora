/**
 * What a week of a plan is for, in the plan's own terms.
 *
 * Authored per plan and per week rather than derived from the week's shape. The
 * shape said what the week was doing ("a second reset joins"); this says what
 * the week is doing it for, and it is the difference the plan exists to make.
 * The cost of authoring is drift, so two things guard it: the table's length is
 * checked against the catalogue's week count for every plan, and each week is
 * checked to read as its own plan rather than as every plan at once.
 *
 * Three rules the copy is written to:
 *
 * - **Outcome over mechanism.** Each line makes the felt result clear and
 *   speaks to the reader directly.
 * - **Assertive, not absolute.** The voice is forceful without promising a
 *   medical outcome the app has not measured.
 * - **One idea, two sentences at most.** A week descends to a glance, and a
 *   third sentence is a paragraph.
 *
 * A plan is a territory, not a single answer, so the copy is written for the
 * plan: somebody who named several goals still reads lines that are true of the
 * plan they are on.
 */

import type { ProgramPlanId } from '../../program/domain/programCatalogue';

/** One line per week, in order. Index 0 is week 1. */
const WEEK_COPY: Record<ProgramPlanId, readonly string[]> = {
  // Territory: sleep, and the hour before it.
  night: [
    'You should feel the day stop clinging to you when your head hits the pillow.',
    'You should feel your body soften faster instead of lying there wired and waiting for sleep.',
    'You should feel sleep pull you under, not have to chase it.',
    'You should feel properly rested, with nights that restore you instead of draining you.',
  ],

  // Territory: alertness at the start of the day.
  morning: [
    'You should feel awake on purpose, not dragged into the day by caffeine and panic.',
    'You should feel switched on before the noise of the day gets a say.',
    'You should feel charged and steady, not briefly hyped and then flat.',
    'You should feel ready to move when the day starts, without needing a crutch first.',
  ],

  // Territory: the stress response, and how fast it comes back down.
  pressure: [
    'You should feel the pressure drop before it gets to run your day.',
    'You should feel harder to rattle and faster to recover when something hits.',
    'You should feel the panic lose its grip instead of letting it set the pace.',
    'You should feel calm with teeth: present, clear, and hard to knock off course.',
    'You should feel cool-headed on the days that usually send you over the edge.',
    'You should feel in command of your nervous system, not trapped inside its alarm.',
    'You should feel the midday pileup break before it becomes your whole day.',
    'You should feel recovered enough to finish strong instead of crawling to the end.',
  ],

  // Territory: attention that holds past the session.
  focus: [
    'You should feel locked in when it is time to work, not scattered before you begin.',
    'You should feel able to pull your attention back the moment it slips.',
    'You should feel your focus hold when the work gets demanding instead of bailing early.',
    'You should feel clear enough to think, remember, and perform without the noise taking over.',
    'You should feel momentum start before motivation has a chance to argue.',
    'You should feel like someone who starts, stays with it, and gets the work done.',
  ],

  // Territory: stillness that does not depend on the session.
  quiet: [
    'You should feel like you can sit with yourself without needing to escape.',
    'You should feel quiet become familiar, not something you only find by accident.',
    'You should feel your mind settle instead of yanking you from thought to thought.',
    'You should feel a deeper stillness that stays with you after you stand up.',
    'You should feel able to return to yourself even when the day is loud.',
    'You should feel grounded enough that the day no longer gets to own every inch of you.',
  ],

  home: [
    'You should feel the room become less overwhelming and the next move become obvious.',
    'You should feel less frozen when you look at everything waiting for you.',
    'You should feel capable of starting before the mess gets louder in your head.',
    'You should feel at home in your space instead of defeated by it.',
  ],

  phone: [
    'You should feel the pull of your phone without letting it run the next minute.',
    'You should feel your attention come back to you when the loop starts again.',
    'You should feel the night get quieter instead of disappearing into another scroll.',
    'You should feel in charge of where your attention goes.',
  ],

  recovery: [
    'You should feel allowed to slow down without feeling like you are failing.',
    'You should feel held by a routine when the day is too heavy to carry alone.',
    'You should feel care become possible even when you have almost nothing left.',
    'You should feel steadier in low moments, not abandoned by them.',
  ],

  selfTrust: [
    'You should feel what you need before the noise tells you otherwise.',
    'You should feel the promise you made to yourself become one you actually keep.',
    'You should feel your own answer get louder than everyone else’s.',
    'You should feel yourself come back to your own side when the day pulls you away.',
    'You should feel dependable to yourself, even when the day is imperfect.',
    'You should feel certain that you can trust yourself with the next decision.',
  ],
};

export function planWeekPurpose(
  planId: ProgramPlanId,
  week: number,
): string | null {
  return WEEK_COPY[planId]?.[week - 1] ?? null;
}

/** Every authored week of a plan, for the tests that audit the whole table. */
export function planWeekPurposeLines(
  planId: ProgramPlanId,
): readonly string[] {
  return WEEK_COPY[planId] ?? [];
}
