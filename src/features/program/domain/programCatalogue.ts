/**
 * The authored plans, as data.
 *
 * Reviewable without a database and testable without a device, which is the
 * point: a plan is product content, and content that can only be read by
 * running the app does not get read. `programCatalogue.test.mjs` checks every
 * published revision for the things a reader cannot check by eye — that the
 * days are contiguous, that the phases cover them exactly once, and that every
 * day names an activity that exists.
 *
 * `(planId, revision)` is permanent once published. A correction to a plan a
 * user is already enrolled on publishes a *new* revision; the old one stays
 * readable forever, because their enrollment names it and their history means
 * what it meant on the day they did it.
 */

import {
  buildActivityRegistry,
  type ProgramActivityDefinition,
  type ProgramActivityRegistry,
} from './programActivity';

export type ProgramPlanId = 'night' | 'morning' | 'pressure' | 'focus' | 'quiet';

/**
 * What every plan is called.
 *
 * One name, not five. A user is not on "Azora's Focus Reset" as opposed to
 * somebody else's — they are on the Azora Protocol, shaped around what they came
 * for. Five descriptive titles read as a catalogue of products to choose
 * between, which is a browsing frame; one named practice is a thing you are
 * doing, which is the frame `positioning.md` reserves this term for.
 *
 * The plan id still decides everything real — the days, the exercises, the
 * length. What differs between two people's Protocol is its content and its
 * `outcome` line, never its name.
 */
export const PROGRAM_NAME = 'The Azora Protocol';

export interface ProgramPhase {
  name: string;
  /** Both 1-based and inclusive. */
  startDay: number;
  endDay: number;
  /** What this stretch is for, in the user's terms. */
  intent: string;
}

export interface ProgramDayDefinition {
  /** 1-based, contiguous from 1 to the plan's length. */
  day: number;
  /**
   * Everything the day asks for, **in time order** — first is earliest.
   *
   * A day is a list rather than a single activity because the plan progresses by
   * *adding* work, not by lengthening one piece of it. Week one is one short
   * exercise; by the last week it is three. That is the whole escalation curve,
   * and it lives here rather than in a duration field.
   *
   * Order is time, not prominence. Each position takes the matching slot from
   * the user's schedule, so an evening pattern authored first would be handed
   * their morning hour. Author the day the way it is lived.
   */
  activityIds: readonly string[];
  /**
   * Why the day looks like this — the line the section shows.
   *
   * It states what changed or why it held, and it never claims an effect we did
   * not measure.
   */
  why: string;
}

/**
 * A stretch of consecutive days with one reason and one shape.
 *
 * A block holds a rotation per position rather than a fixed list, so its days
 * share a *purpose* without being the same day over and over. Day one of a
 * block takes the first of each rotation, day two the second, and it wraps.
 *
 * Two things a plan has to do at once, and this is what lets it do both:
 *
 * - **Grow.** The number of positions is what escalates, from one exercise a
 *   day in week one to three by the last. That is the block's shape and it does
 *   not change inside a block.
 * - **Vary.** What sits in a position changes daily. A plan that prescribes the
 *   same two things for a fortnight is a reminder with a countdown attached;
 *   the point of an authored plan is that tomorrow is not today.
 *
 * A rotation of one is a position that genuinely should not move — the last day
 * of a plan, say, which is authored as one exact day.
 *
 * Days are expanded from blocks at module load, so everything downstream — the
 * resolver, the snapshot, the RPC — still sees a plain list of numbered days
 * and never learns that blocks or rotations exist.
 */
export interface ProgramBlock {
  /**
   * One rotation per position in the day, the positions in **time order**.
   *
   * `slots[0]` is the earliest hour and cycles through its own list as the
   * block's days run. Every rotation is walked by the same day index, so the
   * whole day moves together rather than each position drifting on its own
   * cycle — which is what keeps an authored pairing ("this lead, that close")
   * from being scrambled into a combination nobody chose.
   */
  slots: readonly (readonly string[])[];
  /** How many consecutive days this block runs. */
  days: number;
  /** Why this stretch is here. Shown on each of its days. */
  why: string;
}

export function expandProgramBlocks(
  blocks: readonly ProgramBlock[],
): readonly ProgramDayDefinition[] {
  const days: ProgramDayDefinition[] = [];
  for (const block of blocks) {
    const label = block.slots.map((slot) => slot[0] ?? '?').join(' + ');
    if (block.days < 1) {
      throw new Error(`Program block ${label} runs for no days`);
    }
    if (block.slots.length === 0) {
      throw new Error('A program block must ask for at least one activity');
    }
    if (block.slots.some((slot) => slot.length === 0)) {
      throw new Error(`Program block ${label} has a position with nothing in it`);
    }
    for (let index = 0; index < block.days; index += 1) {
      days.push({
        day: days.length + 1,
        activityIds: block.slots.map(
          (rotation) => rotation[index % rotation.length],
        ),
        why: block.why,
      });
    }
  }
  return days;
}

export interface ProgramPresetRevision {
  planId: ProgramPlanId;
  revision: number;
  name: string;
  /** The outcome the plan is for, said plainly. */
  outcome: string;
  phases: readonly ProgramPhase[];
  /** As authored. */
  blocks: readonly ProgramBlock[];
  /** As run, expanded from `blocks`. */
  days: readonly ProgramDayDefinition[];
}

const DAYS_PER_WEEK = 7;

/** Every activity the catalogue's days are built from. */
const ACTIVITIES: readonly ProgramActivityDefinition[] = [
  {
    id: 'breathing.relaxing.2',
    revision: 1,
    title: 'Relaxing Breath',
    estimatedSeconds: 2 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: [],
    delivery: { modality: 'breathing', techniqueId: 'relaxing', minutes: 2 },
  },
  {
    id: 'breathing.relaxing.4',
    revision: 1,
    title: 'Relaxing Breath',
    estimatedSeconds: 4 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'relaxing', minutes: 4 },
  },
  {
    id: 'breathing.extended-exhale.3',
    revision: 1,
    title: 'Extended Exhale',
    estimatedSeconds: 3 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'extended-exhale', minutes: 3 },
  },
  {
    id: 'breathing.extended-exhale.5',
    revision: 1,
    title: 'Extended Exhale',
    estimatedSeconds: 5 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.extended-exhale.3'],
    delivery: { modality: 'breathing', techniqueId: 'extended-exhale', minutes: 5 },
  },
  {
    id: 'breathing.478.3',
    revision: 1,
    title: '4-7-8 Breathing',
    estimatedSeconds: 3 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: '478', minutes: 3 },
  },
  {
    id: 'breathing.night-settle.4',
    revision: 1,
    title: 'Night Settle',
    estimatedSeconds: 4 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'night-settle', minutes: 4 },
  },
  {
    id: 'breathing.sleep-descent.5',
    revision: 1,
    title: 'Sleep Descent',
    estimatedSeconds: 5 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.478.3', 'breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'sleep-descent', minutes: 5 },
  },
  {
    id: 'breathing.resonance.3',
    revision: 1,
    title: 'Resonance',
    estimatedSeconds: 3 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'resonance', minutes: 3 },
  },
  {
    id: 'breathing.resonance.5',
    revision: 1,
    title: 'Resonance',
    estimatedSeconds: 5 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.resonance.3'],
    delivery: { modality: 'breathing', techniqueId: 'resonance', minutes: 5 },
  },
  {
    id: 'breathing.coherent-6.5',
    revision: 1,
    title: 'Coherent 6',
    estimatedSeconds: 5 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.resonance.3'],
    delivery: { modality: 'breathing', techniqueId: 'coherent-6', minutes: 5 },
  },
  {
    id: 'breathing.coherent-6.8',
    revision: 1,
    title: 'Coherent 6',
    estimatedSeconds: 8 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.coherent-6.5'],
    delivery: { modality: 'breathing', techniqueId: 'coherent-6', minutes: 8 },
  },
  {
    id: 'breathing.belly.3',
    revision: 1,
    title: 'Belly Breathing',
    estimatedSeconds: 3 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'belly', minutes: 3 },
  },
  {
    id: 'breathing.morning-charge.3',
    revision: 1,
    title: 'Morning Charge',
    estimatedSeconds: 3 * 60,
    intensity: 'moderate',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.belly.3'],
    delivery: { modality: 'breathing', techniqueId: 'morning-charge', minutes: 3 },
  },
  {
    id: 'breathing.morning-charge.5',
    revision: 1,
    title: 'Morning Charge',
    estimatedSeconds: 5 * 60,
    intensity: 'moderate',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.morning-charge.3'],
    delivery: { modality: 'breathing', techniqueId: 'morning-charge', minutes: 5 },
  },
  {
    id: 'breathing.box.3',
    revision: 1,
    title: 'Box Breathing',
    estimatedSeconds: 3 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.belly.3'],
    delivery: { modality: 'breathing', techniqueId: 'box', minutes: 3 },
  },
  {
    id: 'breathing.box.5',
    revision: 1,
    title: 'Box Breathing',
    estimatedSeconds: 5 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.box.3'],
    delivery: { modality: 'breathing', techniqueId: 'box', minutes: 5 },
  },
  {
    id: 'breathing.deep-box.5',
    revision: 1,
    title: 'Deep Box',
    estimatedSeconds: 5 * 60,
    intensity: 'moderate',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.box.3'],
    delivery: { modality: 'breathing', techniqueId: 'deep-box', minutes: 5 },
  },
  {
    id: 'breathing.triangle.4',
    revision: 1,
    title: 'Triangle Breathing',
    estimatedSeconds: 4 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.box.3'],
    delivery: { modality: 'breathing', techniqueId: 'triangle', minutes: 4 },
  },
  {
    id: 'breathing.sitali.3',
    revision: 1,
    title: 'Cooling Breath',
    estimatedSeconds: 3 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'sitali', minutes: 3 },
  },
];

export const PROGRAM_ACTIVITIES: ProgramActivityRegistry =
  buildActivityRegistry(ACTIVITIES);

/**
 * The five plans.
 *
 * Authored to the shape `program-catalogue-plan.md` settles on: the sequence is
 * fixed, the first stretch moves fastest, the middle is where it stops feeling
 * like progress, and the last is where the guidance drops away rather than where
 * something new arrives.
 *
 * No plan schedules Wim Hof or Bellows Breath. Both are high-ventilation, and a
 * plan that *prescribes* one is a different claim from a library that offers it
 * — it needs the explicit acknowledgement the app does not have yet. Until it
 * does, they stay out of the catalogue rather than in it behind a warning.
 */
const NIGHT_BLOCKS: readonly ProgramBlock[] = [
  {
    days: 3,
    slots: [['breathing.relaxing.2', 'breathing.belly.3', 'breathing.extended-exhale.3']],
    why: 'One reset a day, and a different one each day. The first week is for finding which of them lands on you.',
  },
  {
    days: 4,
    slots: [['breathing.478.3', 'breathing.relaxing.4', 'breathing.resonance.3', 'breathing.extended-exhale.3']],
    why: 'Still one a day, now the ones that actually slow the heart down.',
  },
  {
    days: 3,
    slots: [
      ['breathing.relaxing.2', 'breathing.belly.3', 'breathing.resonance.3'],
      ['breathing.extended-exhale.3', 'breathing.478.3', 'breathing.night-settle.4'],
    ],
    why: 'A second joins. Two short ones beat one long one at this stage.',
  },
  {
    days: 4,
    slots: [
      ['breathing.resonance.3', 'breathing.relaxing.2', 'breathing.belly.3', 'breathing.relaxing.4'],
      ['breathing.478.3', 'breathing.night-settle.4', 'breathing.extended-exhale.5', 'breathing.478.3'],
    ],
    why: 'A counted pattern to end on most nights, so your attention has somewhere to sit.',
  },
  {
    days: 3,
    slots: [
      ['breathing.extended-exhale.3', 'breathing.relaxing.4', 'breathing.resonance.3'],
      ['breathing.night-settle.4', 'breathing.sleep-descent.5', 'breathing.478.3'],
    ],
    why: 'The one that closes the day is built for the hour before sleep rather than adapted to it.',
  },
  {
    days: 4,
    slots: [
      ['breathing.relaxing.2', 'breathing.belly.3', 'breathing.resonance.3', 'breathing.relaxing.4'],
      ['breathing.resonance.3', 'breathing.extended-exhale.3', 'breathing.coherent-6.5', 'breathing.extended-exhale.5'],
      ['breathing.night-settle.4', 'breathing.478.3', 'breathing.sleep-descent.5', 'breathing.night-settle.4'],
    ],
    why: 'A third joins. The day is a routine now rather than a reminder.',
  },
  {
    days: 3,
    slots: [
      ['breathing.relaxing.2', 'breathing.resonance.3', 'breathing.belly.3'],
      ['breathing.coherent-6.5', 'breathing.extended-exhale.5', 'breathing.resonance.5'],
      ['breathing.sleep-descent.5', 'breathing.night-settle.4', 'breathing.478.3'],
    ],
    why: 'Longer in the middle, and the day ends on whichever of them settles you fastest.',
  },
  {
    days: 3,
    slots: [
      ['breathing.extended-exhale.3', 'breathing.relaxing.2', 'breathing.belly.3'],
      ['breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.coherent-6.8'],
      ['breathing.night-settle.4', 'breathing.sleep-descent.5', 'breathing.478.3'],
    ],
    why: 'Lighter at the front, longer in the middle. The same three hours, a different three every day.',
  },
  {
    days: 1,
    slots: [
      ['breathing.relaxing.2'],
      ['breathing.coherent-6.5'],
      ['breathing.sleep-descent.5'],
    ],
    why: 'The last guided night, at the full shape you have been building.',
  },
];

const NIGHT_PHASES: readonly ProgramPhase[] = [
  {
    name: 'Settling in',
    startDay: 1,
    endDay: 14,
    intent: 'One a day, then a second once the hour has held.',
  },
  {
    name: 'When it starts to stick',
    startDay: 15,
    endDay: 21,
    intent: 'A third joins, and the day becomes a routine rather than a reminder.',
  },
  {
    name: 'By the end of it',
    startDay: 22,
    endDay: 28,
    intent: 'Nothing new is added. The full shape, then the guidance drops away.',
  },
];

const MORNING_BLOCKS: readonly ProgramBlock[] = [
  {
    days: 3,
    slots: [['breathing.belly.3', 'breathing.morning-charge.3', 'breathing.box.3']],
    why: 'One reset a day, a different one each morning, so the hour matters more than the exercise does.',
  },
  {
    days: 4,
    slots: [['breathing.morning-charge.5', 'breathing.triangle.4', 'breathing.morning-charge.3', 'breathing.box.3']],
    why: 'Still one a day, and the charge is in it more often than not now, enough to feel without bracing for it.',
  },
  {
    days: 3,
    slots: [
      ['breathing.morning-charge.3', 'breathing.morning-charge.5', 'breathing.box.3'],
      ['breathing.box.3', 'breathing.triangle.4', 'breathing.resonance.3'],
    ],
    why: 'An even count after the charge, to steady what it stirs up.',
  },
  {
    days: 4,
    slots: [
      ['breathing.morning-charge.3', 'breathing.morning-charge.5', 'breathing.box.3', 'breathing.morning-charge.3'],
      ['breathing.belly.3', 'breathing.resonance.3', 'breathing.relaxing.4', 'breathing.triangle.4'],
    ],
    why: 'Charge then settle. Energy that only goes up has nowhere to land.',
  },
  {
    days: 3,
    slots: [
      ['breathing.morning-charge.5', 'breathing.box.5', 'breathing.morning-charge.3'],
      ['breathing.box.3', 'breathing.resonance.3', 'breathing.triangle.4'],
    ],
    why: 'Five minutes on the charge, in the slot it has held since day one.',
  },
  {
    days: 4,
    slots: [
      ['breathing.morning-charge.5', 'breathing.morning-charge.3', 'breathing.box.5', 'breathing.morning-charge.5'],
      ['breathing.box.5', 'breathing.triangle.4', 'breathing.resonance.3', 'breathing.box.3'],
      ['breathing.belly.3', 'breathing.relaxing.4', 'breathing.belly.3', 'breathing.resonance.5'],
    ],
    why: 'Three now. The morning has room it did not have in week one.',
  },
  {
    days: 3,
    slots: [
      ['breathing.morning-charge.5', 'breathing.morning-charge.3', 'breathing.box.5'],
      ['breathing.triangle.4', 'breathing.box.5', 'breathing.resonance.3'],
      ['breathing.resonance.3', 'breathing.belly.3', 'breathing.relaxing.4'],
    ],
    why: 'A different second every day, to prove the morning does not rest on one pattern.',
  },
  {
    days: 3,
    slots: [
      ['breathing.morning-charge.5', 'breathing.box.5', 'breathing.morning-charge.3'],
      ['breathing.box.5', 'breathing.coherent-6.5', 'breathing.triangle.4'],
      ['breathing.belly.3', 'breathing.relaxing.4', 'breathing.resonance.3'],
    ],
    why: 'Last full week. Nothing new is being added from here.',
  },
  {
    days: 1,
    slots: [
      ['breathing.morning-charge.5'],
      ['breathing.coherent-6.5'],
      ['breathing.belly.3'],
    ],
    why: 'The last guided morning, ending on the steady one.',
  },
];

const MORNING_PHASES: readonly ProgramPhase[] = [
  {
    name: 'Settling in',
    startDay: 1,
    endDay: 14,
    intent: 'One a day, then a second once the hour has held.',
  },
  {
    name: 'When it starts to stick',
    startDay: 15,
    endDay: 21,
    intent: 'A third joins, and the day becomes a routine rather than a reminder.',
  },
  {
    name: 'By the end of it',
    startDay: 22,
    endDay: 28,
    intent: 'Nothing new is added. The full shape, then the guidance drops away.',
  },
];

const PRESSURE_BLOCKS: readonly ProgramBlock[] = [
  {
    days: 4,
    slots: [['breathing.relaxing.2', 'breathing.belly.3', 'breathing.extended-exhale.3', 'breathing.resonance.3']],
    why: 'Two or three minutes, because a plan you can do on a bad day survives one.',
  },
  {
    days: 5,
    slots: [['breathing.relaxing.4', 'breathing.extended-exhale.3', 'breathing.resonance.3', 'breathing.extended-exhale.5', 'breathing.belly.3']],
    why: 'The exhale longer than the inhale, most days. This is the lever, and it works fastest.',
  },
  {
    days: 5,
    slots: [
      ['breathing.extended-exhale.3', 'breathing.resonance.3', 'breathing.extended-exhale.5', 'breathing.relaxing.4', 'breathing.coherent-6.5'],
      ['breathing.relaxing.2', 'breathing.belly.3', 'breathing.sitali.3', 'breathing.resonance.3', 'breathing.relaxing.4'],
    ],
    why: 'A second, short. Two chances a day to catch it early.',
  },
  {
    days: 5,
    slots: [
      ['breathing.extended-exhale.3', 'breathing.coherent-6.5', 'breathing.resonance.3', 'breathing.extended-exhale.5', 'breathing.relaxing.4'],
      ['breathing.belly.3', 'breathing.relaxing.2', 'breathing.sitali.3', 'breathing.belly.3', 'breathing.resonance.3'],
    ],
    why: 'A lower, slower second, so the breath stops sitting in your chest.',
  },
  {
    days: 5,
    slots: [
      ['breathing.resonance.3', 'breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.extended-exhale.3', 'breathing.coherent-6.8'],
      ['breathing.extended-exhale.3', 'breathing.relaxing.4', 'breathing.belly.3', 'breathing.sitali.3', 'breathing.relaxing.2'],
    ],
    why: 'Six a minute leading, which is the pace the research keeps landing on.',
  },
  {
    days: 5,
    slots: [
      ['breathing.resonance.5', 'breathing.coherent-6.5', 'breathing.extended-exhale.5', 'breathing.resonance.3', 'breathing.coherent-6.8'],
      ['breathing.relaxing.4', 'breathing.belly.3', 'breathing.sitali.3', 'breathing.relaxing.2', 'breathing.extended-exhale.3'],
    ],
    why: 'Both longer. Week five is length, not new work.',
  },
  {
    days: 5,
    slots: [
      ['breathing.resonance.5', 'breathing.coherent-6.5', 'breathing.extended-exhale.5', 'breathing.resonance.3', 'breathing.coherent-6.8'],
      ['breathing.extended-exhale.3', 'breathing.relaxing.4', 'breathing.resonance.3', 'breathing.belly.3', 'breathing.relaxing.2'],
      ['breathing.sitali.3', 'breathing.belly.3', 'breathing.relaxing.2', 'breathing.sitali.3', 'breathing.belly.3'],
    ],
    why: 'A third joins, cooling on some days, for the ones that run hot rather than fast.',
  },
  {
    days: 6,
    slots: [
      ['breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.coherent-6.8', 'breathing.extended-exhale.5', 'breathing.resonance.3', 'breathing.coherent-6.5'],
      ['breathing.resonance.3', 'breathing.extended-exhale.3', 'breathing.relaxing.4', 'breathing.belly.3', 'breathing.extended-exhale.5', 'breathing.relaxing.2'],
      ['breathing.relaxing.2', 'breathing.belly.3', 'breathing.sitali.3', 'breathing.relaxing.4', 'breathing.belly.3', 'breathing.sitali.3'],
    ],
    why: 'The coherent pace leads. This is the one to keep after the plan ends.',
  },
  {
    days: 5,
    slots: [
      ['breathing.coherent-6.5', 'breathing.extended-exhale.5', 'breathing.coherent-6.8', 'breathing.resonance.5', 'breathing.extended-exhale.3'],
      ['breathing.extended-exhale.5', 'breathing.resonance.3', 'breathing.relaxing.4', 'breathing.extended-exhale.3', 'breathing.resonance.5'],
      ['breathing.belly.3', 'breathing.relaxing.2', 'breathing.sitali.3', 'breathing.belly.3', 'breathing.relaxing.4'],
    ],
    why: 'The lever at five minutes, in the middle of the day.',
  },
  {
    days: 5,
    slots: [
      ['breathing.coherent-6.8', 'breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.coherent-6.8', 'breathing.extended-exhale.5'],
      ['breathing.resonance.3', 'breathing.extended-exhale.3', 'breathing.relaxing.4', 'breathing.resonance.5', 'breathing.belly.3'],
      ['breathing.relaxing.2', 'breathing.belly.3', 'breathing.sitali.3', 'breathing.relaxing.4', 'breathing.sitali.3'],
    ],
    why: 'Eight minutes once a day, to know that you can.',
  },
  {
    days: 3,
    slots: [
      ['breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.coherent-6.8'],
      ['breathing.extended-exhale.5', 'breathing.extended-exhale.3', 'breathing.resonance.3'],
      ['breathing.sitali.3', 'breathing.belly.3', 'breathing.relaxing.4'],
    ],
    why: 'The flat stretch. Nothing new, on purpose.',
  },
  {
    days: 3,
    slots: [
      ['breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.coherent-6.8'],
      ['breathing.relaxing.4', 'breathing.extended-exhale.3', 'breathing.resonance.3'],
      ['breathing.belly.3', 'breathing.sitali.3', 'breathing.belly.3'],
    ],
    why: 'Ending on the three you would choose tired.',
  },
];

const PRESSURE_PHASES: readonly ProgramPhase[] = [
  {
    name: 'Settling in',
    startDay: 1,
    endDay: 21,
    intent: 'One a day, then a second once the hour has held.',
  },
  {
    name: 'When it starts to stick',
    startDay: 22,
    endDay: 42,
    intent: 'A third joins, and the day becomes a routine rather than a reminder.',
  },
  {
    name: 'By the end of it',
    startDay: 43,
    endDay: 56,
    intent: 'Nothing new is added. The full shape, then the guidance drops away.',
  },
];

const FOCUS_BLOCKS: readonly ProgramBlock[] = [
  {
    days: 4,
    slots: [['breathing.box.3', 'breathing.triangle.4', 'breathing.box.5', 'breathing.belly.3']],
    why: 'One reset before work, a different shape each day, always the same slot.',
  },
  {
    days: 3,
    slots: [['breathing.triangle.4', 'breathing.box.3', 'breathing.resonance.3']],
    why: 'Three sides, four sides, six a minute. The same steadiness, different counts.',
  },
  {
    days: 4,
    slots: [
      ['breathing.box.3', 'breathing.triangle.4', 'breathing.box.5', 'breathing.deep-box.5'],
      ['breathing.triangle.4', 'breathing.resonance.3', 'breathing.belly.3', 'breathing.box.3'],
    ],
    why: 'Two now: one to start the day, one to restart it.',
  },
  {
    days: 3,
    slots: [
      ['breathing.triangle.4', 'breathing.box.5', 'breathing.deep-box.5'],
      ['breathing.belly.3', 'breathing.resonance.3', 'breathing.triangle.4'],
    ],
    why: 'Longer counts now, where holding attention starts to cost something.',
  },
  {
    days: 4,
    slots: [
      ['breathing.deep-box.5', 'breathing.box.5', 'breathing.deep-box.5', 'breathing.triangle.4'],
      ['breathing.box.3', 'breathing.triangle.4', 'breathing.resonance.3', 'breathing.box.5'],
    ],
    why: 'Longer holds lead. The discomfort is the training, and it passes.',
  },
  {
    days: 3,
    slots: [
      ['breathing.triangle.4', 'breathing.deep-box.5', 'breathing.box.5'],
      ['breathing.box.3', 'breathing.resonance.3', 'breathing.triangle.4'],
    ],
    why: 'Back to the plainer counts, now the deep one has moved the ceiling.',
  },
  {
    days: 4,
    slots: [
      ['breathing.deep-box.5', 'breathing.box.5', 'breathing.triangle.4', 'breathing.deep-box.5'],
      ['breathing.box.5', 'breathing.triangle.4', 'breathing.box.3', 'breathing.resonance.3'],
      ['breathing.resonance.3', 'breathing.belly.3', 'breathing.coherent-6.5', 'breathing.relaxing.4'],
    ],
    why: 'A third joins, and this is where focus starts holding past the session.',
  },
  {
    days: 3,
    slots: [
      ['breathing.box.5', 'breathing.triangle.4', 'breathing.box.3'],
      ['breathing.triangle.4', 'breathing.box.5', 'breathing.resonance.3'],
      ['breathing.belly.3', 'breathing.relaxing.4', 'breathing.coherent-6.5'],
    ],
    why: 'Lighter across all three, mid-plan, so the habit is not resting on effort.',
  },
  {
    days: 4,
    slots: [
      ['breathing.deep-box.5', 'breathing.box.5', 'breathing.deep-box.5', 'breathing.triangle.4'],
      ['breathing.box.5', 'breathing.deep-box.5', 'breathing.triangle.4', 'breathing.box.5'],
      ['breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.belly.3', 'breathing.coherent-6.5'],
    ],
    why: 'The heaviest days the plan asks for, twice this week.',
  },
  {
    days: 3,
    slots: [
      ['breathing.box.5', 'breathing.box.3', 'breathing.triangle.4'],
      ['breathing.resonance.3', 'breathing.triangle.4', 'breathing.box.5'],
      ['breathing.belly.3', 'breathing.relaxing.4', 'breathing.coherent-6.5'],
    ],
    why: 'Down again deliberately: knowing which to pick tired is the skill.',
  },
  {
    days: 4,
    slots: [
      ['breathing.deep-box.5', 'breathing.box.5', 'breathing.triangle.4', 'breathing.deep-box.5'],
      ['breathing.box.5', 'breathing.triangle.4', 'breathing.box.3', 'breathing.box.5'],
      ['breathing.coherent-6.5', 'breathing.belly.3', 'breathing.resonance.5', 'breathing.relaxing.4'],
    ],
    why: 'Second to last. Nothing is being added from here.',
  },
  {
    days: 3,
    slots: [
      ['breathing.box.5', 'breathing.deep-box.5', 'breathing.triangle.4'],
      ['breathing.coherent-6.5', 'breathing.box.5', 'breathing.resonance.3'],
      ['breathing.triangle.4', 'breathing.belly.3', 'breathing.coherent-6.5'],
    ],
    why: 'The last week runs on the three that actually work.',
  },
];

const FOCUS_PHASES: readonly ProgramPhase[] = [
  {
    name: 'Settling in',
    startDay: 1,
    endDay: 14,
    intent: 'One a day, then a second once the hour has held.',
  },
  {
    name: 'When it starts to stick',
    startDay: 15,
    endDay: 28,
    intent: 'A third joins, and the day becomes a routine rather than a reminder.',
  },
  {
    name: 'By the end of it',
    startDay: 29,
    endDay: 42,
    intent: 'Nothing new is added. The full shape, then the guidance drops away.',
  },
];

const QUIET_BLOCKS: readonly ProgramBlock[] = [
  {
    days: 4,
    slots: [['breathing.belly.3', 'breathing.relaxing.4', 'breathing.resonance.3', 'breathing.sitali.3']],
    why: 'One sitting a day, unhurried, and a different one each day. The first week is only about sitting down at all.',
  },
  {
    days: 3,
    slots: [['breathing.relaxing.4', 'breathing.coherent-6.5', 'breathing.resonance.5']],
    why: 'A little longer, once sitting down has stopped needing a decision.',
  },
  {
    days: 4,
    slots: [
      ['breathing.resonance.3', 'breathing.belly.3', 'breathing.resonance.5', 'breathing.relaxing.4'],
      ['breathing.belly.3', 'breathing.relaxing.4', 'breathing.sitali.3', 'breathing.resonance.3'],
    ],
    why: 'A second sitting. Twice a day is what makes it ordinary.',
  },
  {
    days: 3,
    slots: [
      ['breathing.resonance.5', 'breathing.coherent-6.5', 'breathing.relaxing.4'],
      ['breathing.belly.3', 'breathing.sitali.3', 'breathing.resonance.3'],
    ],
    why: 'Five minutes leading. The sitting gets longer before it gets deeper.',
  },
  {
    days: 4,
    slots: [
      ['breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.coherent-6.8', 'breathing.relaxing.4'],
      ['breathing.relaxing.4', 'breathing.belly.3', 'breathing.sitali.3', 'breathing.resonance.3'],
    ],
    why: 'The coherent pace, steady enough to stop counting and just be there.',
  },
  {
    days: 3,
    slots: [
      ['breathing.coherent-6.5', 'breathing.coherent-6.8', 'breathing.resonance.5'],
      ['breathing.sitali.3', 'breathing.relaxing.4', 'breathing.belly.3'],
    ],
    why: 'A cooling second on some days, for variety that is not escalation.',
  },
  {
    days: 4,
    slots: [
      ['breathing.coherent-6.8', 'breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.coherent-6.8'],
      ['breathing.resonance.3', 'breathing.relaxing.4', 'breathing.belly.3', 'breathing.resonance.5'],
      ['breathing.belly.3', 'breathing.sitali.3', 'breathing.relaxing.2', 'breathing.belly.3'],
    ],
    why: 'A third joins, and the first of them is eight minutes long.',
  },
  {
    days: 3,
    slots: [
      ['breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.coherent-6.8'],
      ['breathing.resonance.5', 'breathing.relaxing.4', 'breathing.resonance.3'],
      ['breathing.belly.3', 'breathing.sitali.3', 'breathing.relaxing.2'],
    ],
    why: 'The flat stretch, where it stops feeling like progress and is.',
  },
  {
    days: 4,
    slots: [
      ['breathing.coherent-6.8', 'breathing.resonance.5', 'breathing.coherent-6.5', 'breathing.coherent-6.8'],
      ['breathing.resonance.5', 'breathing.coherent-6.5', 'breathing.relaxing.4', 'breathing.resonance.3'],
      ['breathing.sitali.3', 'breathing.belly.3', 'breathing.sitali.3', 'breathing.relaxing.4'],
    ],
    why: 'The longest shape the plan asks for.',
  },
  {
    days: 3,
    slots: [
      ['breathing.coherent-6.5', 'breathing.relaxing.4', 'breathing.resonance.5'],
      ['breathing.belly.3', 'breathing.resonance.3', 'breathing.relaxing.4'],
      ['breathing.relaxing.2', 'breathing.sitali.3', 'breathing.belly.3'],
    ],
    why: 'Short again: a practice you can take tired is a practice you keep.',
  },
  {
    days: 4,
    slots: [
      ['breathing.coherent-6.8', 'breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.coherent-6.8'],
      ['breathing.resonance.5', 'breathing.resonance.3', 'breathing.relaxing.4', 'breathing.resonance.5'],
      ['breathing.belly.3', 'breathing.sitali.3', 'breathing.belly.3', 'breathing.relaxing.2'],
    ],
    why: 'The long sit, while the guidance is still here to hold it.',
  },
  {
    days: 3,
    slots: [
      ['breathing.coherent-6.5', 'breathing.resonance.5', 'breathing.coherent-6.8'],
      ['breathing.resonance.3', 'breathing.relaxing.4', 'breathing.resonance.5'],
      ['breathing.belly.3', 'breathing.belly.3', 'breathing.belly.3'],
    ],
    why: 'The last block is the one you would choose for yourself.',
  },
];

const QUIET_PHASES: readonly ProgramPhase[] = [
  {
    name: 'Settling in',
    startDay: 1,
    endDay: 14,
    intent: 'One a day, then a second once the hour has held.',
  },
  {
    name: 'When it starts to stick',
    startDay: 15,
    endDay: 28,
    intent: 'A third joins, and the day becomes a routine rather than a reminder.',
  },
  {
    name: 'By the end of it',
    startDay: 29,
    endDay: 42,
    intent: 'Nothing new is added. The full shape, then the guidance drops away.',
  },
];

/**
 * The published revisions.
 *
 * Adding a plan is one entry here plus its blocks; nothing else in the engine,
 * the storage or the screens has to change.
 */
const REVISIONS: readonly ProgramPresetRevision[] = [
  {
    planId: 'night',
    revision: 1,
    name: PROGRAM_NAME,
    outcome: 'Fall asleep faster, and wake less.',
    phases: NIGHT_PHASES,
    blocks: NIGHT_BLOCKS,
    days: expandProgramBlocks(NIGHT_BLOCKS),
  },
  {
    planId: 'morning',
    revision: 1,
    name: PROGRAM_NAME,
    outcome: 'Start the day awake, without forcing it.',
    phases: MORNING_PHASES,
    blocks: MORNING_BLOCKS,
    days: expandProgramBlocks(MORNING_BLOCKS),
  },
  {
    planId: 'pressure',
    revision: 1,
    name: PROGRAM_NAME,
    outcome: 'A longer fuse, and a quicker recovery once the day turns.',
    phases: PRESSURE_PHASES,
    blocks: PRESSURE_BLOCKS,
    days: expandProgramBlocks(PRESSURE_BLOCKS),
  },
  {
    planId: 'focus',
    revision: 1,
    name: PROGRAM_NAME,
    outcome: 'Sit down to work without waiting to feel ready.',
    phases: FOCUS_PHASES,
    blocks: FOCUS_BLOCKS,
    days: expandProgramBlocks(FOCUS_BLOCKS),
  },
  {
    planId: 'quiet',
    revision: 1,
    name: PROGRAM_NAME,
    outcome: 'Somewhere quiet you can reach at will.',
    phases: QUIET_PHASES,
    blocks: QUIET_BLOCKS,
    days: expandProgramBlocks(QUIET_BLOCKS),
  },
];

/**
 * The revision a new enrollment starts on.
 *
 * Every published plan is at revision 1 today. When one is corrected it gets a
 * new revision and this moves; enrollments already holding the old number keep
 * reading the plan they accepted.
 */
export const PROGRAM_PRESET_REVISION = 1;

export function programPresetRevision(
  planId: ProgramPlanId,
  revision: number,
): ProgramPresetRevision | null {
  return (
    REVISIONS.find(
      (preset) => preset.planId === planId && preset.revision === revision,
    ) ?? null
  );
}

/** The revision a new enrollment gets: the highest published for that plan. */
export function latestProgramPreset(
  planId: ProgramPlanId,
): ProgramPresetRevision | null {
  return REVISIONS.filter((preset) => preset.planId === planId).reduce<
    ProgramPresetRevision | null
  >(
    (latest, preset) =>
      latest == null || preset.revision > latest.revision ? preset : latest,
    null,
  );
}

/** Every published revision, for the tests that audit the whole catalogue. */
export function allProgramPresets(): readonly ProgramPresetRevision[] {
  return REVISIONS;
}

export function programPresetWeeks(preset: ProgramPresetRevision): number {
  return Math.ceil(preset.days.length / DAYS_PER_WEEK);
}

/** Which week a program day falls in, 1-based. */
export function programDayWeek(day: number): number {
  return Math.floor((day - 1) / DAYS_PER_WEEK) + 1;
}

export function programDayDefinition(
  preset: ProgramPresetRevision,
  day: number,
): ProgramDayDefinition | null {
  return preset.days.find((definition) => definition.day === day) ?? null;
}

/**
 * How many exercises a given day asks for.
 *
 * Variable by design, which is what makes the plan progress. Nothing may treat
 * this as a constant — see `programDayCount` callers rather than reaching for a
 * number.
 */
export function programDayCount(
  preset: ProgramPresetRevision,
  day: number,
): number {
  return programDayDefinition(preset, day)?.activityIds.length ?? 0;
}

export function programPhaseForDay(
  preset: ProgramPresetRevision,
  day: number,
): ProgramPhase | null {
  return (
    preset.phases.find(
      (phase) => day >= phase.startDay && day <= phase.endDay,
    ) ?? null
  );
}

/** The day a position in the day is first asked for. */
export interface ProgramGrowthPoint {
  /** 0-based position in the day, so 1 is the second exercise. */
  position: number;
  /** The first day of the plan that asks for this many. */
  day: number;
  week: number;
  /** What sits there on the day it arrives. */
  activityId: string;
}

/**
 * What the plan asks for on day one, what it grows into, and when it grows.
 *
 * Every screen that describes the plan before the user is on it — the ladder,
 * the notepad, the horizon line — used to state a shape of its own: two resets,
 * the session length the user picked, a fixed daily total. None of that has
 * been true since the plan started authoring its own days, so all three now read
 * the answer from here rather than each inventing one.
 */
export interface ProgramPlanShape {
  /** How many the first day asks for, and what they cost together. */
  firstDayCount: number;
  firstDayMinutes: number;
  /** The most the plan ever asks for in a day, and what that day costs. */
  fullDayCount: number;
  fullDayMinutes: number;
  /** Every position past the first day's, in the order they arrive. */
  growth: readonly ProgramGrowthPoint[];
}

function dayMinutes(activityIds: readonly string[]): number {
  return activityIds.reduce((total, id) => {
    const activity = PROGRAM_ACTIVITIES.get(id);
    return total + (activity == null ? 0 : Math.round(activity.estimatedSeconds / 60));
  }, 0);
}

export function programPlanShape(
  preset: ProgramPresetRevision,
): ProgramPlanShape {
  const firstDay = preset.days[0];
  const fullDay = preset.days.reduce((widest, day) =>
    day.activityIds.length > widest.activityIds.length ? day : widest,
  );

  const growth: ProgramGrowthPoint[] = [];
  for (
    let position = firstDay.activityIds.length;
    position < fullDay.activityIds.length;
    position += 1
  ) {
    const day = preset.days.find(
      (candidate) => candidate.activityIds.length > position,
    );
    if (day == null) continue;
    growth.push({
      position,
      day: day.day,
      week: programDayWeek(day.day),
      activityId: day.activityIds[position],
    });
  }

  return {
    firstDayCount: firstDay.activityIds.length,
    firstDayMinutes: dayMinutes(firstDay.activityIds),
    fullDayCount: fullDay.activityIds.length,
    fullDayMinutes: dayMinutes(fullDay.activityIds),
    growth,
  };
}

/**
 * What occupies a position in the day the first time the plan asks for it.
 *
 * The notepad shows a row per hour the plan will eventually use, and a row has
 * to name something. For a position the first day already fills, that is what
 * the user does tomorrow; for a later one it is what arrives when it arrives.
 */
export function programActivityAtPosition(
  preset: ProgramPresetRevision,
  position: number,
): string | null {
  const day = preset.days.find(
    (candidate) => candidate.activityIds.length > position,
  );
  return day?.activityIds[position] ?? null;
}
