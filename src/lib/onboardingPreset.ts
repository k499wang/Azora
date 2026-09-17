import type { OnboardingIntent } from '../features/exercise/guidedBreathing/techniqueSelection';

/**
 * The plan the user is handed, and what it is called.
 *
 * Every name states a territory rather than a result. "Azora’s Sleep Reset"
 * only fits someone who asked for sleep; "Azora’s Night Reset" fits the person who asked
 * for sleep, the one who wakes at 3am and the one who cannot put the phone down,
 * which matters because the goal question is multi-select and the plan has to
 * hold everything they picked. Naming the territory is also what keeps the name
 * clear of `design.md` principle 4 — a territory promises nothing.
 *
 * Every name ends in Reset, so the plan points at the daily unit it is made of,
 * and the set reads as a catalogue rather than as six unrelated products.
 */
export type PresetId =
  | 'night'
  | 'morning'
  | 'pressure'
  | 'focus'
  | 'quiet';

export interface OnboardingPreset {
  id: PresetId;
  name: string;
  /**
   * How long the plan runs. The length is the behaviour-change arc, not a
   * content budget — a plan with no end cannot be finished, and a user who
   * cannot finish has nothing to be on day 4 of.
   */
  weeks: number;
  /**
   * How the weeks split across Settle, Deepen and Carry. Authored per plan
   * rather than derived, because an eight-week plan wants three weeks of
   * settling and a four-week plan wants two, and no ratio produces both.
   */
  phaseWeeks: readonly [number, number, number];
}

const PRESETS: Record<PresetId, OnboardingPreset> = {
  night: { id: 'night', name: 'Azora’s Night Reset', weeks: 4, phaseWeeks: [2, 1, 1] },
  morning: { id: 'morning', name: 'Azora’s Morning Reset', weeks: 4, phaseWeeks: [2, 1, 1] },
  pressure: { id: 'pressure', name: 'Azora’s Pressure Reset', weeks: 8, phaseWeeks: [3, 3, 2] },
  focus: { id: 'focus', name: 'Azora’s Focus Reset', weeks: 6, phaseWeeks: [2, 2, 2] },
  quiet: { id: 'quiet', name: 'Azora’s Quiet Reset', weeks: 6, phaseWeeks: [2, 2, 2] },
};

/**
 * Which plan a goal asks for. Goals share a preset wherever they share a
 * territory: someone here for their heart, someone here for steadier days and
 * someone here to stop spiralling all want the same eight weeks, and authoring
 * three near-identical plans to give each its own title would be a naming
 * exercise rather than a product one.
 */
const PRESET_FOR_INTENT: Record<OnboardingIntent, PresetId> = {
  sleep: 'night',
  energy: 'morning',
  stress_relief: 'pressure',
  calm_fast: 'pressure',
  emotional_balance: 'pressure',
  self_acceptance: 'pressure',
  heart_health: 'pressure',
  focus: 'focus',
  daily_habit: 'focus',
  spiritual: 'quiet',
  self_care: 'quiet',
  yoga: 'quiet',
  // Says nothing about direction, so it gets the broadest territory.
  other: 'pressure',
};

/**
 * The goal as it sits inside "built around ___". Authored next to nothing else,
 * because the goal's own `goalPhrase` is a verb ("sleep better") and this slot
 * needs a noun. `other` has no fragment: there is nothing specific to name.
 */
const GOAL_SUBJECT: Record<OnboardingIntent, string | null> = {
  sleep: 'sleep',
  energy: 'energy',
  stress_relief: 'stress',
  calm_fast: 'the spikes',
  emotional_balance: 'steadier days',
  self_acceptance: 'being kinder to yourself',
  heart_health: 'your heart',
  focus: 'focus',
  daily_habit: 'a routine that sticks',
  spiritual: 'quiet',
  self_care: 'looking after yourself',
  yoga: 'time on the mat',
  other: null,
};

/** At most two goals are named; a list of five reads as a receipt, not a plan. */
const MAX_NAMED_GOALS = 2;

export function onboardingPresetFor(intent: OnboardingIntent): OnboardingPreset {
  return PRESETS[PRESET_FOR_INTENT[intent]];
}

export function planNameFor(intent: OnboardingIntent): string {
  return onboardingPresetFor(intent).name;
}

/**
 * `built around sleep and focus` — the line that connects the plan's territory
 * back to what they actually picked.
 *
 * The one they ranked first leads. Nothing beyond two is named: the preset was
 * chosen to cover the whole neighbourhood, so the line's job is to show the
 * connection, not to enumerate the answers back at them.
 */
export function planGoalsLine(
  primary: OnboardingIntent | null,
  selected: readonly OnboardingIntent[],
): string | null {
  const ordered = [
    ...(primary == null ? [] : [primary]),
    ...selected.filter((intent) => intent !== primary),
  ];

  const subjects: string[] = [];
  for (const intent of ordered) {
    const subject = GOAL_SUBJECT[intent];
    if (subject == null || subjects.includes(subject)) continue;
    subjects.push(subject);
    if (subjects.length === MAX_NAMED_GOALS) break;
  }

  if (subjects.length === 0) return null;
  return `built around ${subjects.join(' and ')}`;
}

/**
 * The three phases every plan runs, named the same way in all of them.
 *
 * Saying the structure out loud is what makes a generated plan read as
 * expertise rather than as a list — it is the whole reason Runna shows
 * Base/Build/Peak instead of just showing the week. The names are shared across
 * the catalogue so that a phase means one thing wherever a user meets it.
 *
 * Every plan ends in Carry, including the four-week ones. Carry is where the
 * guidance drops away, and that day is the only nameable moment in the whole
 * plan; a plan without one is a gradient, and nobody remembers a gradient.
 */
const PHASE_NAMES = [
  'Build the habit',
  'Go longer',
  'Make it yours',
] as const;

/**
 * What the user brings to the ladder, so every rung is written in their numbers
 * and on their calendar rather than in general ones.
 *
 * A plan that says "Week 3" is a structure; a plan that says "by 8 October, 71"
 * is something to hold yourself to. The projection is the point of the screen,
 * the way the goal-weight chart is the point of BetterMe's.
 */
export interface PlanLadderContext {
  /** The daily reset length the plan starts them at, in minutes. */
  startMinutes: number;
  /** When the primary reset sits, already formatted — `9:30 PM`. */
  startTime: string | null;
  /** Day one of the plan — today, for everyone who finishes onboarding. */
  startDate: Date;
  /** Where they score today, on the axis the plan is built to lift. */
  startScore: number;
  /** Where the plan is projected to put them by its last day. */
  targetScore: number;
}

/**
 * What a phase is, and what you can do by the end of it.
 *
 * `detail` is what changes in the practice; `reach` is what changes in the
 * person, which is the half a user can picture themselves standing on. Both are
 * authored per plan rather than shared, because "the same reset, every day"
 * means a night for the Night plan and a session of work for the Focus one, and
 * one sentence cannot be true of both without being true of neither.
 *
 * Two rules the whole table is written to, both taken from how coaching plans
 * that people actually finish are written:
 *
 * - **Every rung hands off to the next one.** Runna's base phase is not "easy
 *   running", it is what makes you "ready to cope with the demands" of the
 *   block after it. A rung that does not say what it sets up is a list item.
 * - **A curve, not a line.** The first stretch moves fastest, the middle feels
 *   slower than it is, and the last is where other people notice before you do.
 *   Saying that up front is what stops week three reading as a failure — it is
 *   the single most-repeated finding in how these plans are written.
 */
interface PlanPhaseCopy {
  detail: (context: PlanLadderContext) => string;
  reach: string;
  /** What the projection means in the body, by the date this rung ends. */
  feel: string;
}

/** `5 minutes at 9:30 PM`, or just the length when no hour is known. */
function lengthPhrase(minutes: number, startTime: string | null): string {
  const length = `${minutes} minute${minutes === 1 ? '' : 's'}`;
  return startTime == null ? length : `${length} at ${startTime}`;
}

function startPhrase({ startMinutes, startTime }: PlanLadderContext): string {
  return lengthPhrase(startMinutes, startTime);
}

/**
 * How much longer the session runs once the habit is in.
 *
 * One step, stated on the rung, so the ladder shows a dose going up rather than
 * three descriptions of the same session. Three minutes because it is the
 * smallest step a user can feel and the largest one they will not resent.
 */
const GROWTH_MINUTES = 3;

function grownPhrase({ startMinutes, startTime }: PlanLadderContext): string {
  return lengthPhrase(startMinutes + GROWTH_MINUTES, startTime);
}

/** The same grown session, with the guidance taken off it. */
function unguidedLength({ startMinutes }: PlanLadderContext): string {
  return `${startMinutes + GROWTH_MINUTES} minutes`;
}

const PHASE_COPY: Record<PresetId, readonly [PlanPhaseCopy, PlanPhaseCopy, PlanPhaseCopy]> = {
  night: [
    {
      detail: (context) =>
        `${startPhrase(context)}, every night. Same time, so there's nothing to decide.`,
      reach: "Bed becomes the cue. You'll start slowing down before the count does.",
      feel: 'This is where it moves fastest. Most people feel it in week one.',
    },
    {
      detail: (context) =>
        `${grownPhrase(context)}. Longer exhales now, and a short hold.`,
      reach: "You'll ride a long exhale without counting it.",
      feel: 'Slower stretch. Smaller gains week to week. These are the ones that stick.',
    },
    {
      detail: (context) =>
        `${unguidedLength(context)}, no voice and no timer. You run it in the dark.`,
      reach: "You'll put yourself down without the app in your hand.",
      feel: "You're not chasing it any more. It's just how your nights go.",
    },
  ],
  morning: [
    {
      detail: (context) =>
        `${startPhrase(context)}, before anything else. Same order every morning.`,
      reach: "It'll happen before you've decided to do it.",
      feel: "The lift shows up early. Biggest jump you'll see on the whole chart.",
    },
    {
      detail: (context) =>
        `${grownPhrase(context)}. Faster pace, and a round of charged breathing.`,
      reach: "You'll lift your own state in the time a kettle takes.",
      feel: "Progress flattens here. You're still gaining. It just stops announcing itself.",
    },
    {
      detail: (context) =>
        `${unguidedLength(context)}, no voice. You set the pace yourself.`,
      reach: "You'll do it anywhere. Hotel room, car, station platform.",
      feel: "You're not borrowing energy from the reset any more. Mornings are just better.",
    },
  ],
  pressure: [
    {
      detail: (context) =>
        `${startPhrase(context)}, every day. Good day or bad, same hour.`,
      reach: "You'll keep the hour on days you'd have skipped.",
      feel: "The first drop is the fastest you'll get. Most people feel it inside a week.",
    },
    {
      detail: (context) =>
        `${grownPhrase(context)}. Plus short resets during the pressure, not after it.`,
      reach: "You'll take the edge off a spike while it's still climbing.",
      feel:
        "This is the stretch that feels unfair. You're changing faster than it feels. Most people quit here.",
    },
    {
      detail: (context) =>
        `${unguidedLength(context)}, no voice and no screen. It goes wherever you go.`,
      reach: "You'll run it in a full room and nobody will notice.",
      feel: 'Other people clock it before you do. It shows in how you handle the day.',
    },
  ],
  focus: [
    {
      detail: (context) =>
        `${startPhrase(context)}, before the work that matters most.`,
      reach: "You'll have a way to start that doesn't wait for you to feel ready.",
      feel: 'The first change lands early. Starting gets easier within days, not weeks.',
    },
    {
      detail: (context) =>
        `${grownPhrase(context)}. Plus a 90-second reset whenever your focus goes.`,
      reach: "You'll pull your focus back without leaving the desk.",
      feel: "The curve flattens. What's building is stamina, and stamina builds quietly.",
    },
    {
      detail: (context) =>
        `${unguidedLength(context)}, no script. You reset in the gaps yourself.`,
      reach: "You'll steady yourself inside a minute you used to lose.",
      feel: "Focus isn't something you summon now. It's where you land by default.",
    },
  ],
  quiet: [
    {
      detail: (context) =>
        `${startPhrase(context)}, same time each day. Short enough to keep.`,
      reach: 'The minutes become yours by habit, not by argument.',
      feel: 'The first weeks move quickest. Showing up is the change, and it starts now.',
    },
    {
      detail: (context) => `${grownPhrase(context)}. Slower breath, longer sitting.`,
      reach: "You'll sit with a slow breath without checking the timer.",
      feel: 'Slower stretch. It deepens well before it feels any deeper.',
    },
    {
      detail: (context) =>
        `${unguidedLength(context)}, nothing leading it. Just you and the breath.`,
      reach: "You'll find the quiet with nothing to press play on.",
      feel: "You don't schedule the quiet any more. It's just there.",
    },
  ],
};

/**
 * The published effect the plan rests on, said once under the goal.
 *
 * Deliberately a claim about slow breathing rather than about Azora's users: it
 * is the half that is defensible on the day the screen ships, and every line
 * here is one the goal screens already make, so the two screens agree rather
 * than quoting two different bodies of evidence at the same person.
 */
const PLAN_PROOF: Record<PresetId, string> = {
  night: 'Paced breathing before bed: people fall asleep up to 37% faster.',
  morning: 'A few minutes of faster breathing lifts alertness. No crash after it.',
  pressure: 'Five minutes a day of slow breathing cuts cortisol by up to 25%.',
  focus: 'A 90-second reset sharpens attention. Lower anxiety sharpens recall.',
  quiet: 'Slow breathing deepens meditative focus. Same practice, measured.',
};

/** The evidence line for the plan this goal resolves to. */
export function planProofLine(intent: OnboardingIntent): string {
  return PLAN_PROOF[onboardingPresetFor(intent).id];
}

/** What the last day of each plan is, said in that plan's own terms. */
const FINAL_DAY_NOTE: Record<PresetId, string> = {
  night: "your last guided night. After this, you run it.",
  morning: "your last guided morning. After this, you run it.",
  pressure: "your last guided day. After this, you run it.",
  focus: "your last guided session. After this, you run it.",
  quiet: "your last guided sitting. After this, you run it.",
};

/**
 * A dated moment on the ladder.
 *
 * Two of them, and both are real events rather than forecasts: the Protocol
 * re-measures on day 7, and the guidance stops on the last day. Neither says
 * what the number will be, because nobody has taken a breath yet.
 */
export interface PlanMilestone {
  label: string;
  /** The calendar day it falls on — `24 Sep`. */
  date: string;
  note: string;
}

const RETEST_DAY = 7;
const RETEST_NOTE =
  "we measure you again. Same test as today, so the numbers line up. Your first real comparison.";

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** `8 Oct`. Written by hand rather than through `Intl`, which Hermes trims. */
export function formatPlanDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function addDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * How much of the climb has happened by a given day.
 *
 * Front-loaded on purpose, because that is what actually happens and what every
 * plan of this shape shows: the first stretch moves fastest, then the curve
 * flattens. A straight line would promise week six to feel like week one, which
 * is the expectation that makes people quit in the middle.
 */
const CLIMB_CURVE = 0.62;

function climbFraction(day: number, totalDays: number): number {
  if (totalDays <= 0) return 1;
  return Math.pow(Math.min(1, Math.max(0, day / totalDays)), CLIMB_CURVE);
}

export interface PlanPhase {
  name: string;
  detail: string;
  /** What you can do by the end of this phase, and what it sets up. */
  reach: string;
  /** What the projected number means in the body by the time this rung ends. */
  feel: string;
  startWeek: number;
  endWeek: number;
  /** `18 Sep – 1 Oct`, the calendar this rung actually falls on. */
  dateRange: string;
  /** The day this rung ends, for the line that states the projection. */
  endsOn: string;
  /** Where the plan puts them by the end of this rung. */
  projectedScore: number;
  /** The dated moments that fall inside this phase, in order. */
  milestones: PlanMilestone[];
}

function weekOfDay(day: number): number {
  return Math.ceil(day / 7);
}

export function planPhases(
  intent: OnboardingIntent,
  context: PlanLadderContext,
): PlanPhase[] {
  const preset = onboardingPresetFor(intent);
  const copy = PHASE_COPY[preset.id];
  const totalDays = preset.weeks * 7;
  const climb = context.targetScore - context.startScore;

  const dated: { day: number; note: string }[] = [
    { day: RETEST_DAY, note: RETEST_NOTE },
    { day: totalDays, note: FINAL_DAY_NOTE[preset.id] },
  ];

  let week = 1;
  return PHASE_NAMES.map((name, index) => {
    const startWeek = week;
    week += preset.phaseWeeks[index];
    const endWeek = week - 1;

    const firstDay = (startWeek - 1) * 7;
    const lastDay = endWeek * 7;
    const endsOn = addDays(context.startDate, lastDay - 1);
    const isFinal = index === PHASE_NAMES.length - 1;

    return {
      name,
      detail: copy[index].detail(context),
      reach: copy[index].reach,
      feel: copy[index].feel,
      startWeek,
      endWeek,
      dateRange: `${formatPlanDate(addDays(context.startDate, firstDay))} \u2013 ${formatPlanDate(endsOn)}`,
      endsOn: formatPlanDate(endsOn),
      // The last rung lands exactly on the target: a plan whose own chart stops
      // short of the number it promised is the one thing this screen cannot do.
      projectedScore: isFinal
        ? Math.round(context.targetScore)
        : Math.round(
            context.startScore + climb * climbFraction(lastDay, totalDays),
          ),
      milestones: dated
        .filter(({ day }) => {
          const at = weekOfDay(day);
          return at >= startWeek && at <= endWeek;
        })
        .map(({ day, note }) => ({
          label: `Day ${day}`,
          date: formatPlanDate(addDays(context.startDate, day - 1)),
          note,
        })),
    };
  });
}

/** The day the plan finishes, for the line that states the whole promise. */
export function planGoalDate(
  intent: OnboardingIntent,
  startDate: Date,
): string {
  const { weeks } = onboardingPresetFor(intent);
  return formatPlanDate(addDays(startDate, weeks * 7 - 1));
}

/** `Weeks 1–2`, or `Week 4` when the phase is a single week. */
export function planPhaseWeeksLabel(phase: PlanPhase): string {
  return phase.startWeek === phase.endWeek
    ? `Week ${phase.startWeek}`
    : `Weeks ${phase.startWeek}\u2013${phase.endWeek}`;
}
