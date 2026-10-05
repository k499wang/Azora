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
import { ATTENTION_ACTIVITIES } from './attentionActivities';
import { SHORT_RESET_PLAN_PURPOSE, type ShortResetPlanId } from './programResetPurpose';

export type ProgramPlanId =
  | 'night'
  | 'morning'
  | 'pressure'
  | 'focus'
  | 'quiet'
  | 'home'
  | 'phone'
  | 'recovery'
  | 'selfTrust';

/**
 * What every plan is called.
 *
 * One name, not five. A user is not on "Azora's Focus Reset" as opposed to
 * somebody else's — they are on the Life Reset Plan, shaped around what they came
 * for. Five descriptive titles read as a catalogue of products to choose
 * between, which is a browsing frame; one named practice is a thing you are
 * doing, which is the frame `positioning.md` reserves this term for.
 *
 * The plan id still decides everything real — the days, the exercises, the
 * length. What differs between two people's Protocol is its content and its
 * `outcome` line, never its name.
 */
export const PROGRAM_NAME = 'Life Reset Plan';

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
    id: 'breathing.relaxing.1',
    revision: 1,
    title: 'Relaxing Breath',
    estimatedSeconds: 1 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: [],
    delivery: { modality: 'breathing', techniqueId: 'relaxing', minutes: 1 },
  },
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
    id: 'breathing.extended-exhale.1',
    revision: 1,
    title: 'Extended Exhale',
    estimatedSeconds: 1 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.1'],
    delivery: { modality: 'breathing', techniqueId: 'extended-exhale', minutes: 1 },
  },
  {
    id: 'breathing.extended-exhale.2',
    revision: 1,
    title: 'Extended Exhale',
    estimatedSeconds: 2 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'extended-exhale', minutes: 2 },
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
    id: 'breathing.478.2',
    revision: 1,
    title: '4-7-8 Breathing',
    estimatedSeconds: 2 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: '478', minutes: 2 },
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
    id: 'breathing.night-settle.1',
    revision: 1,
    title: 'Night Settle',
    estimatedSeconds: 1 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.1'],
    delivery: { modality: 'breathing', techniqueId: 'night-settle', minutes: 1 },
  },
  {
    id: 'breathing.night-settle.2',
    revision: 1,
    title: 'Night Settle',
    estimatedSeconds: 2 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'night-settle', minutes: 2 },
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
    id: 'breathing.sleep-descent.1',
    revision: 1,
    title: 'Sleep Descent',
    estimatedSeconds: 1 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.1'],
    delivery: { modality: 'breathing', techniqueId: 'sleep-descent', minutes: 1 },
  },
  {
    id: 'breathing.sleep-descent.2',
    revision: 1,
    title: 'Sleep Descent',
    estimatedSeconds: 2 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.478.2', 'breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'sleep-descent', minutes: 2 },
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
    id: 'breathing.resonance.1',
    revision: 1,
    title: 'Resonance',
    estimatedSeconds: 1 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.1'],
    delivery: { modality: 'breathing', techniqueId: 'resonance', minutes: 1 },
  },
  {
    id: 'breathing.resonance.2',
    revision: 1,
    title: 'Resonance',
    estimatedSeconds: 2 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'resonance', minutes: 2 },
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
    id: 'breathing.coherent-6.1',
    revision: 1,
    title: 'Coherent 6',
    estimatedSeconds: 1 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.resonance.1'],
    delivery: { modality: 'breathing', techniqueId: 'coherent-6', minutes: 1 },
  },
  {
    id: 'breathing.coherent-6.2',
    revision: 1,
    title: 'Coherent 6',
    estimatedSeconds: 2 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.resonance.2'],
    delivery: { modality: 'breathing', techniqueId: 'coherent-6', minutes: 2 },
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
    id: 'breathing.belly.1',
    revision: 1,
    title: 'Belly Breathing',
    estimatedSeconds: 1 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.1'],
    delivery: { modality: 'breathing', techniqueId: 'belly', minutes: 1 },
  },
  {
    id: 'breathing.belly.2',
    revision: 1,
    title: 'Belly Breathing',
    estimatedSeconds: 2 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'belly', minutes: 2 },
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
    id: 'breathing.morning-charge.1',
    revision: 1,
    title: 'Morning Charge',
    estimatedSeconds: 1 * 60,
    intensity: 'moderate',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.belly.1'],
    delivery: { modality: 'breathing', techniqueId: 'morning-charge', minutes: 1 },
  },
  {
    id: 'breathing.morning-charge.2',
    revision: 1,
    title: 'Morning Charge',
    estimatedSeconds: 2 * 60,
    intensity: 'moderate',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.belly.2'],
    delivery: { modality: 'breathing', techniqueId: 'morning-charge', minutes: 2 },
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
    id: 'breathing.box.1',
    revision: 1,
    title: 'Box Breathing',
    estimatedSeconds: 1 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.belly.1'],
    delivery: { modality: 'breathing', techniqueId: 'box', minutes: 1 },
  },
  {
    id: 'breathing.box.2',
    revision: 1,
    title: 'Box Breathing',
    estimatedSeconds: 2 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.belly.2'],
    delivery: { modality: 'breathing', techniqueId: 'box', minutes: 2 },
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
    id: 'breathing.deep-box.2',
    revision: 1,
    title: 'Deep Box',
    estimatedSeconds: 2 * 60,
    intensity: 'moderate',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.box.2'],
    delivery: { modality: 'breathing', techniqueId: 'deep-box', minutes: 2 },
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
    id: 'breathing.triangle.1',
    revision: 1,
    title: 'Triangle Breathing',
    estimatedSeconds: 1 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.box.1'],
    delivery: { modality: 'breathing', techniqueId: 'triangle', minutes: 1 },
  },
  {
    id: 'breathing.triangle.2',
    revision: 1,
    title: 'Triangle Breathing',
    estimatedSeconds: 2 * 60,
    intensity: 'light',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.box.2'],
    delivery: { modality: 'breathing', techniqueId: 'triangle', minutes: 2 },
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
    id: 'breathing.sitali.1',
    revision: 1,
    title: 'Cooling Breath',
    estimatedSeconds: 1 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.1'],
    delivery: { modality: 'breathing', techniqueId: 'sitali', minutes: 1 },
  },
  {
    id: 'breathing.sitali.2',
    revision: 1,
    title: 'Cooling Breath',
    estimatedSeconds: 2 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: ['breathing.relaxing.2'],
    delivery: { modality: 'breathing', techniqueId: 'sitali', minutes: 2 },
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
  buildActivityRegistry([...ACTIVITIES, ...ATTENTION_ACTIVITIES]);

/**
 * The published plans.
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
 * These paths are deliberately new plans, not renamed onboarding answers. The
 * breathing patterns are established ones from the closest existing territory;
 * the plan-specific teaching sequence is what makes a Home or Phone Reset
 * about the moment the user is in.
 */
const HOME_BLOCKS = FOCUS_BLOCKS.slice(0, 8);
const HOME_PHASES: readonly ProgramPhase[] = [
  { name: 'Making it smaller', startDay: 1, endDay: 14, intent: 'One reset before facing what feels like too much.' },
  { name: 'Finding a way in', startDay: 15, endDay: 21, intent: 'A second reset makes returning less of a fight.' },
  { name: 'Keeping it gentle', startDay: 22, endDay: 28, intent: 'Three familiar resets, without turning the day into a test.' },
];

const PHONE_BLOCKS = NIGHT_BLOCKS;
const PHONE_PHASES = NIGHT_PHASES;

const RECOVERY_BLOCKS = QUIET_BLOCKS.slice(0, 8);
const RECOVERY_PHASES = HOME_PHASES;

const SELF_TRUST_BLOCKS = QUIET_BLOCKS;
const SELF_TRUST_PHASES = QUIET_PHASES;

/**
 * Revision 2 of the five original plans: a home session first, then the plan.
 *
 * Days 1 to 10 repeat one short session at the same hour instead of rotating.
 * Habits are built from the same action in the same context (Lally et al.
 * 2010), so the session itself is the thing meant to become automatic, and the
 * only step up is a longer breath out, never a longer plan. That opening is the
 * one deliberate exception to a block varying daily; the variety tests skip it.
 *
 * Every breathing session is one or two minutes. Days 1 to 3 are all one
 * minute, so the first wins are as easy as they get. From day 4 the lengths
 * alternate: a day of several Resets pairs a one-minute with a two-minute, and
 * days of one take turns. 4-7-8 and Deep Box stay at two minutes, because one
 * minute fits fewer than four of their breaths.
 *
 * Night, pressure and quiet add a tool after the home session on the day its
 * lesson teaches it, once, and grow on day 8 by keeping one there daily. The
 * one-off tool days are why their first week may ask for less than the day
 * before.
 *
 * From day 11 each plan keeps revision 1's blocks and slot counts, with every
 * breathing session one or two minutes. The plan grows by asking for more,
 * not longer. The tools a plan taught come back in its second position, so
 * they do not stop on day 11. Phases are unchanged, so they are shared with
 * revision 1.
 *
 * See `docs/plans/reset-types-and-lesson-pairing.md`.
 */
const NIGHT_BLOCKS_V2: readonly ProgramBlock[] = [
  {
    days: 2,
    slots: [['breathing.relaxing.1']],
    why: 'One short reset a day, the same one at the same hour. Repeating it there is what helps it start to feel automatic.',
  },
  {
    days: 1,
    slots: [['breathing.relaxing.1'], ['attention.54321.2']],
    why: 'After the home session, 5-4-3-2-1 once, so it is ready the next time you wake in the night.',
  },
  {
    days: 3,
    slots: [['breathing.relaxing.2', 'breathing.relaxing.1', 'breathing.relaxing.2']],
    why: 'Back to the one reset. 5-4-3-2-1 is yours now for any night you wake.',
  },
  {
    days: 1,
    slots: [['breathing.extended-exhale.1']],
    why: 'Still one a day, now with a longer breath out. The step up is the exhale, not more minutes.',
  },
  {
    days: 3,
    slots: [
      ['breathing.extended-exhale.1'],
      ['attention.muscle-release.2', 'attention.muscle-release.2', 'attention.54321.2'],
    ],
    why: 'The plan grows. A second reset now follows the home session every day: Muscle Release for two nights, then 5-4-3-2-1.',
  },
  {
    days: 4,
    slots: [
      ['breathing.resonance.1', 'breathing.relaxing.1', 'breathing.belly.1', 'breathing.relaxing.1'],
      ['breathing.478.2', 'attention.muscle-release.2', 'breathing.extended-exhale.2', 'breathing.478.2'],
    ],
    why: 'The second turns into a counted pattern to end on most nights, so your attention has somewhere to sit.',
  },
  {
    days: 3,
    slots: [
      ['breathing.extended-exhale.1', 'breathing.relaxing.1', 'breathing.resonance.1'],
      ['breathing.night-settle.2', 'attention.muscle-release.2', 'breathing.478.2'],
    ],
    why: 'The one that closes the day is built for the hour before sleep rather than adapted to it.',
  },
  {
    days: 4,
    slots: [
      ['breathing.relaxing.2', 'breathing.belly.2', 'breathing.resonance.2', 'breathing.relaxing.1'],
      ['breathing.resonance.1', 'breathing.extended-exhale.1', 'attention.muscle-release.2', 'breathing.extended-exhale.2'],
      ['breathing.night-settle.2', 'breathing.478.2', 'breathing.sleep-descent.1', 'breathing.night-settle.1'],
    ],
    why: 'A third joins. The day is a routine now rather than a reminder.',
  },
  {
    days: 3,
    slots: [
      ['breathing.relaxing.2', 'breathing.resonance.1', 'breathing.belly.2'],
      ['breathing.coherent-6.1', 'attention.muscle-release.2', 'breathing.resonance.1'],
      ['breathing.sleep-descent.2', 'breathing.night-settle.2', 'breathing.478.2'],
    ],
    why: 'A slower pace in the middle, and the day ends on whichever of them settles you fastest.',
  },
  {
    days: 3,
    slots: [
      ['breathing.extended-exhale.1', 'breathing.relaxing.2', 'breathing.belly.1'],
      ['breathing.coherent-6.2', 'breathing.resonance.1', 'attention.muscle-release.2'],
      ['breathing.night-settle.1', 'breathing.sleep-descent.2', 'breathing.478.2'],
    ],
    why: 'Lighter at the front, slow and even in the middle. The same three hours, a different three every day.',
  },
  {
    days: 1,
    slots: [
      ['breathing.relaxing.2'],
      ['breathing.coherent-6.1'],
      ['breathing.sleep-descent.2'],
    ],
    why: 'The last guided night, at the full shape you have been building.',
  },
];

const MORNING_BLOCKS_V2: readonly ProgramBlock[] = [
  {
    days: 10,
    slots: [
      [
        'breathing.morning-charge.1',
        'breathing.morning-charge.1',
        'breathing.morning-charge.1',
        'breathing.morning-charge.2',
        'breathing.morning-charge.1',
        'breathing.morning-charge.2',
        'breathing.morning-charge.1',
        'breathing.morning-charge.2',
        'breathing.morning-charge.1',
        'breathing.morning-charge.2',
      ],
    ],
    why: 'The same short charge every morning at the same hour, so the hour matters more than the reset does.',
  },
  {
    days: 4,
    slots: [
      ['breathing.morning-charge.1', 'breathing.triangle.2', 'breathing.morning-charge.1', 'breathing.box.2'],
      ['breathing.belly.2', 'breathing.resonance.1', 'breathing.relaxing.2', 'breathing.triangle.1'],
    ],
    why: 'A second joins to settle what the charge stirs up. Energy that only goes up has nowhere to land.',
  },
  {
    days: 3,
    slots: [
      ['breathing.morning-charge.1', 'breathing.box.2', 'breathing.morning-charge.1'],
      ['breathing.box.2', 'breathing.resonance.1', 'breathing.triangle.2'],
    ],
    why: 'The charge leads most mornings, in the slot it has held since day one.',
  },
  {
    days: 4,
    slots: [
      ['breathing.box.2', 'breathing.morning-charge.1', 'breathing.triangle.2', 'breathing.morning-charge.1'],
      ['breathing.resonance.1', 'breathing.box.2', 'breathing.coherent-6.1', 'breathing.box.2'],
      ['breathing.belly.2', 'breathing.relaxing.1', 'breathing.belly.2', 'breathing.resonance.1'],
    ],
    why: 'Three now. The morning has room it did not have in week one.',
  },
  {
    days: 3,
    slots: [
      ['breathing.box.2', 'breathing.morning-charge.1', 'breathing.triangle.2'],
      ['breathing.triangle.1', 'breathing.coherent-6.2', 'breathing.resonance.1'],
      ['breathing.belly.2', 'breathing.resonance.1', 'breathing.relaxing.2'],
    ],
    why: 'A different second every day, to prove the morning does not rest on one pattern.',
  },
  {
    days: 3,
    slots: [
      ['breathing.box.1', 'breathing.morning-charge.2', 'breathing.triangle.1'],
      ['breathing.coherent-6.2', 'breathing.triangle.1', 'breathing.box.2'],
      ['breathing.belly.1', 'breathing.relaxing.2', 'breathing.resonance.1'],
    ],
    why: 'Last full week. Nothing new is being added from here.',
  },
  {
    days: 1,
    slots: [
      ['breathing.morning-charge.2'],
      ['breathing.coherent-6.1'],
      ['breathing.belly.2'],
    ],
    why: 'The last guided morning, ending on the steady one.',
  },
];

const PRESSURE_BLOCKS_V2: readonly ProgramBlock[] = [
  {
    days: 2,
    slots: [['breathing.relaxing.1']],
    why: 'One minute, the same reset at the same hour every day, because a plan you can do on a bad day survives one.',
  },
  {
    days: 1,
    slots: [['breathing.relaxing.1'], ['attention.54321.2']],
    why: 'After the home session, 5-4-3-2-1 once, a pause to reach for the next time it starts to build.',
  },
  {
    days: 2,
    slots: [['breathing.relaxing.2', 'breathing.relaxing.1']],
    why: 'Back to the one reset. The pause is there whenever you need it, not only when the plan asks.',
  },
  {
    days: 1,
    slots: [['breathing.relaxing.1'], ['attention.muscle-release.2']],
    why: 'Muscle Release once today, to find where you hold it before it reaches your voice.',
  },
  {
    days: 1,
    slots: [['breathing.extended-exhale.1']],
    why: 'A breath out longer than the breath in. This is the lever, and the step up is the exhale, not more minutes.',
  },
  {
    days: 3,
    slots: [
      ['breathing.extended-exhale.1'],
      ['attention.muscle-release.2', 'attention.54321.2', 'attention.54321.2'],
    ],
    why: 'The plan grows. A second reset now follows the home session every day, the two you have already tried.',
  },
  {
    days: 4,
    slots: [
      ['breathing.resonance.1', 'breathing.extended-exhale.1', 'breathing.relaxing.1', 'breathing.coherent-6.2'],
      ['breathing.belly.2', 'attention.muscle-release.2', 'breathing.resonance.2', 'breathing.relaxing.1'],
    ],
    why: 'Still two a day, so there are two chances a day to catch it early.',
  },
  {
    days: 5,
    slots: [
      ['breathing.extended-exhale.1', 'breathing.coherent-6.1', 'breathing.resonance.1', 'breathing.extended-exhale.2', 'breathing.relaxing.1'],
      ['breathing.belly.2', 'attention.muscle-release.2', 'breathing.sitali.2', 'breathing.belly.1', 'attention.muscle-release.2'],
    ],
    why: 'A lower, slower second, so the breath stops sitting in your chest.',
  },
  {
    days: 5,
    slots: [
      ['breathing.resonance.2', 'breathing.coherent-6.1', 'breathing.extended-exhale.1', 'breathing.resonance.1', 'breathing.coherent-6.2'],
      ['breathing.extended-exhale.1', 'breathing.relaxing.2', 'attention.muscle-release.2', 'breathing.sitali.2', 'breathing.relaxing.1'],
    ],
    why: 'Six a minute leading, which is the pace the research keeps landing on.',
  },
  {
    days: 5,
    slots: [
      ['breathing.extended-exhale.1', 'breathing.resonance.2', 'breathing.coherent-6.1', 'breathing.relaxing.1', 'breathing.resonance.1'],
      ['attention.muscle-release.2', 'breathing.belly.1', 'breathing.sitali.2', 'attention.muscle-release.2', 'breathing.extended-exhale.2'],
    ],
    why: 'Week five adds nothing new. Holding the same two hours steady is the work now.',
  },
  {
    days: 5,
    slots: [
      ['breathing.coherent-6.2', 'breathing.resonance.1', 'breathing.extended-exhale.2', 'breathing.coherent-6.1', 'breathing.resonance.2'],
      ['breathing.relaxing.1', 'breathing.extended-exhale.2', 'attention.muscle-release.2', 'breathing.belly.2', 'breathing.relaxing.1'],
      ['breathing.sitali.2', 'breathing.belly.1', 'breathing.relaxing.1', 'breathing.sitali.1', 'breathing.belly.2'],
    ],
    why: 'A third joins, cooling on some days, for the ones that run hot rather than fast.',
  },
  {
    days: 6,
    slots: [
      ['breathing.coherent-6.1', 'breathing.resonance.2', 'breathing.coherent-6.1', 'breathing.extended-exhale.2', 'breathing.coherent-6.1', 'breathing.resonance.2'],
      ['breathing.resonance.2', 'attention.muscle-release.2', 'breathing.relaxing.2', 'breathing.belly.1', 'attention.muscle-release.2', 'breathing.relaxing.1'],
      ['breathing.relaxing.1', 'breathing.belly.1', 'breathing.sitali.1', 'breathing.relaxing.2', 'breathing.belly.2', 'breathing.sitali.2'],
    ],
    why: 'The coherent pace leads. This is the one to keep after the plan ends.',
  },
  {
    days: 5,
    slots: [
      ['breathing.coherent-6.1', 'breathing.extended-exhale.2', 'breathing.coherent-6.1', 'breathing.resonance.2', 'breathing.extended-exhale.1'],
      ['breathing.extended-exhale.2', 'attention.muscle-release.2', 'breathing.relaxing.2', 'breathing.extended-exhale.1', 'attention.muscle-release.2'],
      ['breathing.relaxing.1', 'breathing.relaxing.1', 'breathing.sitali.1', 'breathing.belly.2', 'breathing.relaxing.2'],
    ],
    why: 'The lever, a breath out longer than the breath in, moves to the middle of the day.',
  },
  {
    days: 5,
    slots: [
      ['breathing.resonance.2', 'breathing.coherent-6.1', 'breathing.extended-exhale.2', 'breathing.coherent-6.1', 'breathing.resonance.2'],
      ['breathing.extended-exhale.1', 'breathing.relaxing.2', 'attention.muscle-release.2', 'breathing.belly.2', 'breathing.relaxing.1'],
      ['breathing.relaxing.2', 'breathing.belly.1', 'breathing.sitali.1', 'breathing.relaxing.1', 'breathing.sitali.2'],
    ],
    why: 'Every breathing reset still one or two minutes, which is the length you can keep once the plan ends.',
  },
  {
    days: 3,
    slots: [
      ['breathing.coherent-6.1', 'breathing.resonance.2', 'breathing.coherent-6.1'],
      ['breathing.extended-exhale.2', 'attention.muscle-release.2', 'breathing.resonance.2'],
      ['breathing.relaxing.1', 'breathing.belly.1', 'breathing.sitali.1'],
    ],
    why: 'The flat stretch. Nothing new, on purpose.',
  },
  {
    days: 3,
    slots: [
      ['breathing.resonance.2', 'breathing.coherent-6.1', 'breathing.extended-exhale.2'],
      ['breathing.relaxing.1', 'attention.muscle-release.2', 'breathing.resonance.1'],
      ['breathing.belly.2', 'breathing.sitali.2', 'breathing.belly.2'],
    ],
    why: 'Ending on the three you would choose tired.',
  },
];

const FOCUS_BLOCKS_V2: readonly ProgramBlock[] = [
  {
    days: 10,
    slots: [
      [
        'breathing.box.1',
        'breathing.box.1',
        'breathing.box.1',
        'breathing.box.2',
        'breathing.box.1',
        'breathing.box.2',
        'breathing.box.1',
        'breathing.box.2',
        'breathing.box.1',
        'breathing.box.2',
      ],
    ],
    why: 'One reset before work, the same one at the same hour every day, so sitting down to it stops needing a decision.',
  },
  {
    days: 1,
    slots: [['breathing.deep-box.2'], ['breathing.box.1']],
    why: 'Two now: one to start the day, one to restart it.',
  },
  {
    days: 3,
    slots: [
      ['breathing.triangle.2', 'breathing.deep-box.2', 'breathing.box.2'],
      ['breathing.belly.1', 'breathing.resonance.1', 'breathing.coherent-6.1'],
    ],
    why: 'Different counts now, where holding attention starts to cost something.',
  },
  {
    days: 4,
    slots: [
      ['breathing.deep-box.2', 'breathing.box.2', 'breathing.deep-box.2', 'breathing.triangle.2'],
      ['breathing.box.1', 'breathing.triangle.1', 'breathing.resonance.1', 'breathing.box.1'],
    ],
    why: 'Longer holds lead. The discomfort is the training, and it passes.',
  },
  {
    days: 3,
    slots: [
      ['breathing.box.1', 'breathing.deep-box.2', 'breathing.triangle.1'],
      ['breathing.resonance.2', 'breathing.triangle.1', 'breathing.belly.2'],
    ],
    why: 'Back to the plainer counts, now the deep one has moved the ceiling.',
  },
  {
    days: 4,
    slots: [
      ['breathing.deep-box.2', 'breathing.box.1', 'breathing.triangle.2', 'breathing.deep-box.2'],
      ['breathing.box.1', 'breathing.triangle.2', 'breathing.box.1', 'breathing.resonance.1'],
      ['breathing.resonance.2', 'breathing.belly.1', 'breathing.coherent-6.2', 'breathing.relaxing.2'],
    ],
    why: 'A third joins, and this is where focus starts holding past the session.',
  },
  {
    days: 3,
    slots: [
      ['breathing.box.2', 'breathing.triangle.1', 'breathing.box.2'],
      ['breathing.triangle.1', 'breathing.box.2', 'breathing.resonance.1'],
      ['breathing.coherent-6.2', 'breathing.belly.1', 'breathing.relaxing.2'],
    ],
    why: 'Lighter across all three, mid-plan, so the habit is not resting on effort.',
  },
  {
    days: 4,
    slots: [
      ['breathing.deep-box.2', 'breathing.box.1', 'breathing.deep-box.2', 'breathing.triangle.2'],
      ['breathing.box.1', 'breathing.deep-box.2', 'breathing.triangle.1', 'breathing.box.1'],
      ['breathing.coherent-6.2', 'breathing.resonance.1', 'breathing.belly.2', 'breathing.coherent-6.2'],
    ],
    why: 'The longest holds the plan asks for, on most days this week.',
  },
  {
    days: 3,
    slots: [
      ['breathing.box.1', 'breathing.resonance.2', 'breathing.triangle.1'],
      ['breathing.resonance.2', 'breathing.triangle.1', 'breathing.coherent-6.2'],
      ['breathing.belly.1', 'breathing.relaxing.2', 'breathing.resonance.1'],
    ],
    why: 'Down again deliberately: knowing which to pick tired is the skill.',
  },
  {
    days: 4,
    slots: [
      ['breathing.deep-box.2', 'breathing.box.1', 'breathing.triangle.2', 'breathing.deep-box.2'],
      ['breathing.box.1', 'breathing.triangle.2', 'breathing.box.1', 'breathing.resonance.1'],
      ['breathing.coherent-6.2', 'breathing.belly.1', 'breathing.resonance.2', 'breathing.relaxing.2'],
    ],
    why: 'Second to last. Nothing is being added from here.',
  },
  {
    days: 3,
    slots: [
      ['breathing.box.2', 'breathing.deep-box.2', 'breathing.triangle.2'],
      ['breathing.coherent-6.1', 'breathing.box.1', 'breathing.resonance.1'],
      ['breathing.triangle.2', 'breathing.belly.2', 'breathing.coherent-6.2'],
    ],
    why: 'The last week runs on the three that actually work.',
  },
];

const QUIET_BLOCKS_V2: readonly ProgramBlock[] = [
  {
    days: 3,
    slots: [['breathing.belly.1']],
    why: 'One sitting a day, the same one at the same hour. The first days are only about sitting down at all.',
  },
  {
    days: 1,
    slots: [['breathing.resonance.2']],
    why: 'Still one a day, now at a slower, even pace, once sitting down has stopped needing a decision.',
  },
  {
    days: 1,
    slots: [['breathing.resonance.1'], ['attention.54321.2']],
    why: 'After the sitting, 5-4-3-2-1 once: noticing what is around you without having to quiet anything.',
  },
  {
    days: 2,
    slots: [['breathing.resonance.2', 'breathing.resonance.1']],
    why: 'Back to the one sitting. Noticing is there for any moment that gets loud.',
  },
  {
    days: 3,
    slots: [['breathing.resonance.1'], ['attention.54321.2']],
    why: 'The plan grows. 5-4-3-2-1 now follows the sitting every day.',
  },
  {
    days: 1,
    slots: [['breathing.relaxing.1'], ['breathing.resonance.2']],
    why: 'A second sitting. Twice a day is what makes it ordinary.',
  },
  {
    days: 3,
    slots: [
      ['breathing.resonance.2', 'breathing.coherent-6.1', 'breathing.relaxing.2'],
      ['breathing.belly.1', 'attention.54321.2', 'breathing.resonance.1'],
    ],
    why: 'The slow paces lead. The sitting gets steadier before it gets deeper.',
  },
  {
    days: 4,
    slots: [
      ['breathing.coherent-6.1', 'breathing.resonance.2', 'breathing.coherent-6.1', 'breathing.relaxing.2'],
      ['breathing.relaxing.2', 'breathing.belly.1', 'attention.54321.2', 'breathing.resonance.1'],
    ],
    why: 'The coherent pace, steady enough to stop counting and just be there.',
  },
  {
    days: 3,
    slots: [
      ['breathing.resonance.1', 'breathing.coherent-6.2', 'breathing.resonance.1'],
      ['breathing.sitali.2', 'breathing.relaxing.1', 'attention.54321.2'],
    ],
    why: 'A cooling second on some days, for variety that is not escalation.',
  },
  {
    days: 4,
    slots: [
      ['breathing.coherent-6.2', 'breathing.resonance.1', 'breathing.coherent-6.2', 'breathing.relaxing.1'],
      ['breathing.resonance.1', 'attention.54321.2', 'breathing.belly.1', 'breathing.resonance.2'],
      ['breathing.belly.2', 'breathing.sitali.2', 'breathing.relaxing.2', 'breathing.belly.1'],
    ],
    why: 'A third joins, and the day opens at the slow, even pace.',
  },
  {
    days: 3,
    slots: [
      ['breathing.coherent-6.2', 'breathing.resonance.1', 'breathing.relaxing.2'],
      ['breathing.belly.1', 'attention.54321.2', 'breathing.coherent-6.1'],
      ['breathing.sitali.2', 'breathing.belly.2', 'breathing.sitali.2'],
    ],
    why: 'The flat stretch, where it stops feeling like progress and is.',
  },
  {
    days: 4,
    slots: [
      ['breathing.coherent-6.1', 'breathing.resonance.2', 'breathing.coherent-6.1', 'breathing.belly.2'],
      ['breathing.resonance.2', 'breathing.coherent-6.1', 'attention.54321.2', 'breathing.resonance.1'],
      ['breathing.belly.1', 'breathing.sitali.2', 'breathing.belly.2', 'breathing.relaxing.2'],
    ],
    why: 'The fullest days the plan asks for, three each, all of them slow.',
  },
  {
    days: 3,
    slots: [
      ['breathing.coherent-6.1', 'breathing.relaxing.2', 'breathing.resonance.1'],
      ['breathing.belly.2', 'attention.54321.2', 'breathing.relaxing.2'],
      ['breathing.relaxing.1', 'breathing.sitali.1', 'breathing.belly.1'],
    ],
    why: 'Gentler again: a practice you can take tired is a practice you keep.',
  },
  {
    days: 4,
    slots: [
      ['breathing.coherent-6.2', 'breathing.resonance.1', 'breathing.coherent-6.2', 'breathing.resonance.1'],
      ['breathing.resonance.1', 'breathing.coherent-6.2', 'attention.54321.2', 'breathing.coherent-6.2'],
      ['breathing.sitali.2', 'breathing.belly.1', 'breathing.sitali.1', 'breathing.relaxing.1'],
    ],
    why: 'The slowest paces lead every day, while the guidance is still here to hold them.',
  },
  {
    days: 3,
    slots: [
      ['breathing.coherent-6.2', 'breathing.resonance.1', 'breathing.coherent-6.2'],
      ['breathing.resonance.1', 'attention.54321.2', 'breathing.sitali.1'],
      ['breathing.belly.2', 'breathing.belly.2', 'breathing.belly.2'],
    ],
    why: 'The last block is the one you would choose for yourself.',
  },
];

/**
 * New editions share the same gradual introduction to the two non-breathing
 * resets. Later blocks retain their authored breathing techniques and number
 * of daily sessions; a tool replaces a session rather than adding more work.
 * Published blocks above remain unchanged for existing enrollments.
 */
function blocksWithShortResets(
  planId: ShortResetPlanId,
  blocks: readonly ProgramBlock[],
  homeTechnique: string,
): readonly ProgramBlock[] {
  const purpose = SHORT_RESET_PLAN_PURPOSE[planId];
  const quietOpening = planId === 'quiet';
  const grounding = 'attention.54321.2';
  const muscleRelease = 'attention.muscle-release.2';
  const opening: ProgramBlock[] = Array.from({ length: 10 }, (_, index) => {
    const day = index + 1;
    const technique = quietOpening && day >= 4 ? 'resonance' : homeTechnique;
    const minutes = day <= 3 || day % 2 === 1 ? 1 : 2;
    let tool: string | null = null;
    if (day === (quietOpening ? 5 : 3) || day === 9 || (quietOpening && day === 10)) {
      tool = grounding;
    } else if (day === 6 || day === 8 || day === 10) {
      tool = muscleRelease;
    }
    const slots = [[`breathing.${technique}.${minutes}`]];
    if (tool) slots.push([tool]);
    const instruction = tool === grounding
      ? 'Then try 5-4-3-2-1: notice things you can see, hear, touch, smell and taste. The Reset guides each step.'
      : tool === muscleRelease
        ? 'Then try Muscle Release: gently tighten one group of muscles, let go, and notice the difference. The Reset guides each step.'
        : 'Follow the breathing guide. You do not need to change how you feel or get it perfect.';
    return {
      days: 1,
      slots,
      why: `Day ${day}: start with ${minutes} minute${minutes === 1 ? '' : 's'} of breathing. ${instruction} ${purpose}`,
    };
  });

  let firstDay = 1;
  const later: ProgramBlock[] = [];
  for (const block of blocks) {
    const start = firstDay;
    firstDay += block.days;
    if (firstDay <= 11) continue;
    const offset = Math.max(0, 11 - start);
    const days = block.days - offset;
    const slots = block.slots.map((rotation, position) =>
      Array.from({ length: days }, (_, index) => {
        const day = start + offset + index;
        if (position === 1 && (day - 11) % 3 === 0) {
          return (day - 11) % 6 === 0 ? muscleRelease : grounding;
        }
        const activityId = rotation[(offset + index) % rotation.length];
        if (!activityId.startsWith('breathing.')) return activityId;
        const technique = activityId.replace(/^breathing\./, '').replace(/\.\d+$/, '');
        const minutes = ['deep-box', '478'].includes(technique) ? 2 : (day + position) % 2 === 0 ? 2 : 1;
        return `breathing.${technique}.${minutes}`;
      }),
    );
    later.push({
      days,
      slots,
      why: `Days ${Math.max(11, start)} to ${firstDay - 1}: do ${slots.length} short resets, at the times you chose. Breathing takes 1 or 2 minutes. On some days, the second Reset is 5-4-3-2-1 or Muscle Release. ${purpose}`,
    });
  }
  return [...opening, ...later];
}

const MORNING_BLOCKS_V3 = blocksWithShortResets('morning', MORNING_BLOCKS_V2, 'morning-charge');
const FOCUS_BLOCKS_V3 = blocksWithShortResets('focus', FOCUS_BLOCKS_V2, 'relaxing');
const QUIET_BLOCKS_V3 = blocksWithShortResets('quiet', QUIET_BLOCKS_V2, 'relaxing');
const HOME_BLOCKS_V2 = blocksWithShortResets('home', HOME_BLOCKS, 'relaxing');
const PHONE_BLOCKS_V2 = blocksWithShortResets('phone', PHONE_BLOCKS, 'relaxing');
const RECOVERY_BLOCKS_V2 = blocksWithShortResets('recovery', RECOVERY_BLOCKS, 'relaxing');
// Quiet's varied short rotations avoid turning old duration-only differences
// into identical days when Self-trust sessions are capped at two minutes.
const SELF_TRUST_BLOCKS_V2 = blocksWithShortResets('selfTrust', QUIET_BLOCKS_V2, 'relaxing');

const PRESSURE_BLOCKS_V3: readonly ProgramBlock[] = PRESSURE_BLOCKS_V2.map((block, index) => {
  const firstDay = 1 + PRESSURE_BLOCKS_V2.slice(0, index).reduce((total, previous) => total + previous.days, 0);
  return {
    ...block,
    why: `Days ${firstDay} to ${firstDay + block.days - 1}: follow the ${block.slots.length} short Reset${block.slots.length === 1 ? '' : 's'} shown in today’s plan. Each breathing session takes one or two minutes. Follow the on-screen instructions for any attention Reset.`,
  };
});

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
  {
    planId: 'home',
    revision: 1,
    name: PROGRAM_NAME,
    outcome: 'Make space feel less overwhelming, one calm reset at a time.',
    phases: HOME_PHASES,
    blocks: HOME_BLOCKS,
    days: expandProgramBlocks(HOME_BLOCKS),
  },
  {
    planId: 'phone',
    revision: 1,
    name: PROGRAM_NAME,
    outcome: 'Step out of the phone loop and back into your day.',
    phases: PHONE_PHASES,
    blocks: PHONE_BLOCKS,
    days: expandProgramBlocks(PHONE_BLOCKS),
  },
  {
    planId: 'recovery',
    revision: 1,
    name: PROGRAM_NAME,
    outcome: 'Find a gentler way back on low-capacity days.',
    phases: RECOVERY_PHASES,
    blocks: RECOVERY_BLOCKS,
    days: expandProgramBlocks(RECOVERY_BLOCKS),
  },
  {
    planId: 'selfTrust',
    revision: 1,
    name: PROGRAM_NAME,
    outcome: 'Build self-trust through small, steady moments of care.',
    phases: SELF_TRUST_PHASES,
    blocks: SELF_TRUST_BLOCKS,
    days: expandProgramBlocks(SELF_TRUST_BLOCKS),
  },
  {
    planId: 'night',
    revision: 2,
    name: PROGRAM_NAME,
    outcome: 'Fall asleep faster, and wake less.',
    phases: NIGHT_PHASES,
    blocks: NIGHT_BLOCKS_V2,
    days: expandProgramBlocks(NIGHT_BLOCKS_V2),
  },
  {
    planId: 'morning',
    revision: 2,
    name: PROGRAM_NAME,
    outcome: 'Start the day awake, without forcing it.',
    phases: MORNING_PHASES,
    blocks: MORNING_BLOCKS_V2,
    days: expandProgramBlocks(MORNING_BLOCKS_V2),
  },
  {
    planId: 'pressure',
    revision: 2,
    name: PROGRAM_NAME,
    outcome: 'A longer fuse, and a quicker recovery once the day turns.',
    phases: PRESSURE_PHASES,
    blocks: PRESSURE_BLOCKS_V2,
    days: expandProgramBlocks(PRESSURE_BLOCKS_V2),
  },
  {
    planId: 'pressure',
    revision: 3,
    name: PROGRAM_NAME,
    outcome: 'Build a pause for stressful moments, repeated worries, and strong feelings.',
    phases: PRESSURE_PHASES,
    blocks: PRESSURE_BLOCKS_V3,
    days: expandProgramBlocks(PRESSURE_BLOCKS_V3),
  },
  {
    planId: 'focus',
    revision: 2,
    name: PROGRAM_NAME,
    outcome: 'Sit down to work without waiting to feel ready.',
    phases: FOCUS_PHASES,
    blocks: FOCUS_BLOCKS_V2,
    days: expandProgramBlocks(FOCUS_BLOCKS_V2),
  },
  {
    planId: 'quiet',
    revision: 2,
    name: PROGRAM_NAME,
    outcome: 'Somewhere quiet you can reach at will.',
    phases: QUIET_PHASES,
    blocks: QUIET_BLOCKS_V2,
    days: expandProgramBlocks(QUIET_BLOCKS_V2),
  },
  {
    planId: 'morning',
    revision: 3,
    name: PROGRAM_NAME,
    outcome: 'Start the day awake, without forcing it.',
    phases: MORNING_PHASES,
    blocks: MORNING_BLOCKS_V3,
    days: expandProgramBlocks(MORNING_BLOCKS_V3),
  },
  {
    planId: 'focus',
    revision: 3,
    name: PROGRAM_NAME,
    outcome: 'Sit down to work without waiting to feel ready.',
    phases: FOCUS_PHASES,
    blocks: FOCUS_BLOCKS_V3,
    days: expandProgramBlocks(FOCUS_BLOCKS_V3),
  },
  {
    planId: 'quiet',
    revision: 3,
    name: PROGRAM_NAME,
    outcome: 'Somewhere quiet you can reach at will.',
    phases: QUIET_PHASES,
    blocks: QUIET_BLOCKS_V3,
    days: expandProgramBlocks(QUIET_BLOCKS_V3),
  },
  {
    planId: 'home',
    revision: 2,
    name: PROGRAM_NAME,
    outcome: 'Make space feel less overwhelming, one calm reset at a time.',
    phases: HOME_PHASES,
    blocks: HOME_BLOCKS_V2,
    days: expandProgramBlocks(HOME_BLOCKS_V2),
  },
  {
    planId: 'phone',
    revision: 2,
    name: PROGRAM_NAME,
    outcome: 'Step out of the phone loop and back into your day.',
    phases: PHONE_PHASES,
    blocks: PHONE_BLOCKS_V2,
    days: expandProgramBlocks(PHONE_BLOCKS_V2),
  },
  {
    planId: 'recovery',
    revision: 2,
    name: PROGRAM_NAME,
    outcome: 'Find a gentler way back on low-capacity days.',
    phases: RECOVERY_PHASES,
    blocks: RECOVERY_BLOCKS_V2,
    days: expandProgramBlocks(RECOVERY_BLOCKS_V2),
  },
  {
    planId: 'selfTrust',
    revision: 2,
    name: PROGRAM_NAME,
    outcome: 'Build self-trust through small, steady moments of care.',
    phases: SELF_TRUST_PHASES,
    blocks: SELF_TRUST_BLOCKS_V2,
    days: expandProgramBlocks(SELF_TRUST_BLOCKS_V2),
  },
];

// New lesson editions retain the exact reset schedules of their predecessors.
const TEACHING_PRESET_REVISIONS = [
  ['night', 2], ['morning', 3], ['pressure', 3], ['focus', 3], ['quiet', 3],
  ['home', 2], ['phone', 2], ['recovery', 2], ['selfTrust', 2],
] as const;

const PUBLISHED_REVISIONS: readonly ProgramPresetRevision[] = [
  ...REVISIONS,
  ...TEACHING_PRESET_REVISIONS.map(([planId, revision]) => {
    const previous = REVISIONS.find((preset) => preset.planId === planId && preset.revision === revision)!;
    return { ...previous, revision: revision + 1 };
  }),
];

export function programPresetRevision(
  planId: ProgramPlanId,
  revision: number,
): ProgramPresetRevision | null {
  return (
    PUBLISHED_REVISIONS.find(
      (preset) => preset.planId === planId && preset.revision === revision,
    ) ?? null
  );
}

/** The revision a new enrollment gets: the highest published for that plan. */
export function latestProgramPreset(
  planId: ProgramPlanId,
): ProgramPresetRevision | null {
  return PUBLISHED_REVISIONS.filter((preset) => preset.planId === planId).reduce<
    ProgramPresetRevision | null
  >(
    (latest, preset) =>
      latest == null || preset.revision > latest.revision ? preset : latest,
    null,
  );
}

/** Every published revision, for the tests that audit the whole catalogue. */
export function allProgramPresets(): readonly ProgramPresetRevision[] {
  return PUBLISHED_REVISIONS;
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
