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
  // Objective: fall asleep faster, and wake less.
  night: [
    'You should feel your evenings wind down on cue, so bedtime stops being when your mind speeds up.',
    'You should fall asleep faster, with your body already slowing by the time the lights go off.',
    'You should wake less in the night, and drift back off quickly when you do.',
    'You should fall asleep fast and sleep through as a normal night, not a lucky one.',
  ],

  // Objective: start the day awake, without forcing it.
  morning: [
    'You should get out of bed awake within minutes, not after an hour of snoozing and scrolling.',
    'You should feel clear in your first hour, before coffee has to do the heavy lifting.',
    'You should carry that morning energy through the afternoon instead of crashing by lunch.',
    'You should start every day awake by choice, with no alarm fight and no forcing it.',
  ],

  // Objective: a longer fuse, and a quicker recovery once the day turns.
  pressure: [
    'You should notice stress building early, while it is still easy to bring down.',
    'You should take longer to snap when something goes wrong, because your fuse is getting longer.',
    'You should come back down within minutes after a hard moment, not carry it for hours.',
    'You should stay clear-headed in the moments that used to make you react first and think later.',
    'You should get through your toughest days without the stress spilling into everything else.',
    'You should feel your body settle on command when the pressure spikes.',
    'You should feel a bad hour stay a bad hour, instead of turning into a bad day.',
    'You should feel a longer fuse and a faster recovery become how you handle pressure now.',
  ],

  // Objective: sit down to work without waiting to feel ready.
  focus: [
    'You should sit down and start work without waiting to feel ready first.',
    'You should catch your attention drifting sooner and bring it straight back to the task.',
    'You should stay with hard work longer before reaching for your phone or a new tab.',
    'You should think clearly through long stretches of work, without the fog setting in.',
    'You should start before motivation shows up, and find it arrives once you are moving.',
    'You should sit down, start, and finish as your default, not only on good days.',
  ],

  // Objective: somewhere quiet you can reach at will.
  quiet: [
    'You should find a few minutes of real quiet without needing to escape to get it.',
    'You should reach that quiet faster each time, instead of waiting for it to happen by accident.',
    'You should feel your thoughts slow down when you ask them to, rather than racing ahead.',
    'You should carry that stillness with you after you stand up, into the rest of your day.',
    'You should reach your quiet even when the day around you is loud.',
    'You should have a quiet place inside you that you can reach at will, whenever you need it.',
  ],

  // Objective: make space feel less overwhelming.
  home: [
    'You should look at the mess and know the one small thing to do first.',
    'You should start tidying without freezing at how much there is.',
    'You should keep your space in hand before the clutter gets loud in your head.',
    'You should walk into your home and feel calmer, not behind.',
  ],

  // Objective: step out of the phone loop and back into your day.
  phone: [
    'You should notice the urge to pick up your phone before your thumb is already scrolling.',
    'You should put the phone down in the middle of a loop and get back to what you were doing.',
    'You should end the night with your phone down, not another hour lost to the scroll.',
    'You should pick up your phone on purpose, and put it down just as easily.',
  ],

  // Objective: a gentler way back on low-capacity days.
  recovery: [
    'You should slow down on low days without feeling like you are failing.',
    'You should have a small routine to lean on when the day is too heavy.',
    'You should take care of yourself even on days you have almost nothing left.',
    'You should come back from low days faster, along a gentle way back you trust.',
  ],

  // Objective: self-trust through small, steady moments of care.
  selfTrust: [
    'You should notice what you need before other voices tell you otherwise.',
    'You should keep the small promises you make to yourself, one day at a time.',
    'You should hear your own answer louder than everyone else’s.',
    'You should come back to your own side when the day pulls you away.',
    'You should count on yourself, even when the day goes imperfectly.',
    'You should trust yourself with the next decision, because you have kept your word for weeks.',
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
