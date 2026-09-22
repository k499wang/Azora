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
 * Three rules the copy is written to, all of them the voice the app already uses
 * on the onboarding plan screen:
 *
 * - **Mechanism over encouragement.** Each line names what changes in the body
 *   and why, not how the reader is supposed to feel about it.
 * - **Claims are attributed.** Where a line states an effect, it says what
 *   found it (trials, studies, the research) rather than promising an outcome
 *   this app has not measured.
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
    'One short reset a day, at the hour you chose. Paced breathing before bed shortens the time it takes to fall asleep, and the fixed hour is what lets the body start expecting it.',
    'A second reset joins, and both stay short. A longer exhale slows heart rate and raises HRV, the shift the body makes on its way into sleep.',
    'A third reset joins, and the day ends on one built for the hour before bed. Wind-down at the same time each night is what trains the body to drop off on cue.',
    'Three resets a day, with nothing new left to learn. Across weeks, paced breathing before bed tracks with falling asleep faster and waking less often.',
  ],

  // Territory: alertness at the start of the day.
  morning: [
    'One short reset a morning, at the hour you chose. Faster paced breathing raises alertness within minutes, with no crash after it.',
    'A second reset joins, and the morning one stays short. The point is to wake the system up rather than settle it.',
    'A third reset joins, and the charge runs longer. An even count after it steadies what the faster pace stirs up.',
    'Three resets a day, and the first is how the day opens rather than a warm-up. Starting without caffeine is the habit being trained.',
  ],

  // Territory: the stress response, and how fast it comes back down.
  pressure: [
    'One reset a day, two to four minutes each. A longer exhale is the part of slow breathing that brings heart rate down fastest.',
    'A second reset joins, both led by a longer exhale. Around five minutes a day of slow breathing is where trials report cortisol falling.',
    'The second reset gets lower and slower. Slower breathing raises vagal tone, which acts as the brake on the stress response.',
    'Both resets settle near six breaths a minute. Resonance breathing at that pace is the one most studied for lowering stress.',
    'A third reset joins, cooling on some days. A third short session is for the days that run hot rather than fast.',
    'Three resets a day, led by the coherent pace. Six breaths a minute is the pattern to keep after the plan ends.',
    'Three resets, around five minutes each. The lever moves to the middle of the day, where the stress tends to build.',
    'Three resets, and one runs to eight minutes. Eight minutes once a day is the longer dose the recovery research favours.',
  ],

  // Territory: attention that holds past the session.
  focus: [
    'One reset before work, under five minutes. A short paced reset sharpens attention for the session that follows.',
    'A second reset joins, one to start the day and one to restart it. Counting through a fixed pattern holds attention by giving it somewhere to sit.',
    'Both resets get longer. Longer holds are where attention starts to cost something, and that cost is the training.',
    'A third reset joins. Lower anxiety is what improves recall, so a reset before work does more than settle the nerves.',
    'Three resets, back to plainer counts. A fixed hour and fewer decisions are what make starting automatic.',
    'The last week runs on the three that work. The reset becomes the thing that starts the session rather than a warm-up for it.',
  ],

  // Territory: stillness that does not depend on the session.
  quiet: [
    'One sitting a day, unhurried. The first week is only about sitting down at all.',
    'A second sitting joins. Twice a day is what turns a choice into a routine.',
    'The leading sitting gets longer. Slowing the breath is the oldest and best studied way into meditative focus.',
    'A third sitting joins, and the first runs to eight minutes. Slower breathing at a fixed hour is what deepens the state rather than the length.',
    'Three sittings, in plainer patterns. Fewer decisions is what keeps it happening on the days it is hard to justify.',
    'The last block is the one you would choose for yourself. The sitting becomes part of how the day is shaped rather than time carved out of it.',
  ],

  home: [
    'One short reset before you face your space. The first week is about making the next moment small enough to approach.',
    'A second reset joins, so coming back does not have to depend on a burst of energy.',
    'Three familiar resets make room for a pause before the all-or-nothing feeling takes over.',
    'The last week stays gentle. The useful reset is the one you can reach for when the room feels like too much.',
  ],

  phone: [
    'One short reset a day creates a pause before the next automatic reach for your phone.',
    'A second reset joins, giving your attention somewhere else to land when the loop starts again.',
    'A third reset brings a quieter close to the day, especially when scrolling has followed you into bed.',
    'The full shape stays familiar. What changes is noticing the pull early enough to choose a different next minute.',
  ],

  recovery: [
    'One gentle reset a day is enough on a low-capacity day. The plan starts by lowering the bar, not raising it.',
    'A second reset joins, giving you more than one place to pause when the day feels heavy.',
    'Three familiar resets make care easier to reach without asking you to become a different person first.',
    'The last week keeps the shape small and steady. The point is to know what helps when you have very little to give.',
  ],

  selfTrust: [
    'One quiet reset a day makes room to notice what you need before deciding what to do next.',
    'A second reset joins, so keeping a small promise to yourself becomes more ordinary.',
    'The leading reset gets longer. Attention is what lets you hear your own answer beneath the noise.',
    'A third reset joins, giving the day more than one chance to come back to your own side.',
    'Three resets, with familiar patterns. Consistency here means returning, not getting every day right.',
    'The last week is the version you can choose for yourself. Self-trust grows from the small promises you keep.',
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
