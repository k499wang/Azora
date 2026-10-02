import { daysBetweenLocalDates } from '../../plan/domain/azoraScore';

/**
 * Guided attention Resets, as data.
 *
 * One screen plays every script, so a new Reset of this kind is an entry here
 * rather than a new screen. A step either waits for a tap, for prompts that
 * take as long as they take (naming five things you can see), or runs on its
 * own clock, for prompts that need a steady rhythm (squeeze, then let go).
 *
 * A script can come in several wordings with the same rhythm, so a Reset done
 * daily does not read the same every day.
 */

export type AttentionScriptId = '54321' | 'muscle-release';

export interface AttentionTapStep {
  kind: 'tap';
  /** A short name for what this step is about, shown above the prompt. */
  label?: string;
  prompt: string;
  nudge: string;
  /** Things to tap off one by one, for a step that asks the user to name some. */
  count?: number;
  /** A typical pace, for the script's length; the user sets the real one. */
  estimatedSeconds: number;
}

export type AttentionPhase = 'squeeze' | 'release';

export interface AttentionTimedStep {
  kind: 'timed';
  phase: AttentionPhase;
  label?: string;
  prompt: string;
  nudge: string;
  seconds: number;
}

export type AttentionStep = AttentionTapStep | AttentionTimedStep;

export interface AttentionScript {
  id: AttentionScriptId;
  title: string;
  /** The length the plan quotes for it. */
  minutes: number;
  steps: readonly AttentionStep[];
}

interface TapExtras {
  label?: string;
  count?: number;
}

function tap(
  prompt: string,
  nudge: string,
  estimatedSeconds: number,
  { label, count }: TapExtras = {},
): AttentionTapStep {
  return { kind: 'tap', label, prompt, nudge, count, estimatedSeconds };
}

function timed(
  phase: AttentionPhase,
  prompt: string,
  nudge: string,
  seconds: number,
  label?: string,
): AttentionTimedStep {
  return { kind: 'timed', phase, label, prompt, nudge, seconds };
}

const GROUNDING: AttentionScript = {
  id: '54321',
  title: '5-4-3-2-1',
  minutes: 2,
  steps: [
    tap('Let’s come back to the room.', 'Look around slowly. Tap Next when you’re ready.', 10),
    tap('Name 5 things you can see.', 'Small things count. A shadow, a corner, a crack in the paint.', 25, { label: 'See', count: 5 }),
    tap('Name 4 things you can hear.', 'Near or far. Even a quiet hum counts.', 25, { label: 'Hear', count: 4 }),
    tap('Name 3 things you can touch.', 'Your feet on the floor. The fabric on your arm.', 20, { label: 'Touch', count: 3 }),
    tap('Name 2 things you can smell.', 'If nothing comes, name two smells you like.', 15, { label: 'Smell', count: 2 }),
    tap('Name 1 thing you can taste.', 'Or take a sip of water and notice it.', 10, { label: 'Taste', count: 1 }),
    tap('You’re here.', 'Your attention came back to where you are. That’s the whole Reset.', 10),
  ],
};

interface MuscleWording {
  squeeze: string;
  letGo: string;
}

type MuscleWordingSet = 0 | 1 | 2;
const MUSCLE_WORDING_SETS: readonly MuscleWordingSet[] = [0, 1, 2];

interface MuscleGroup {
  label: string;
  squeezeNudge: string;
  letGoNudge: string;
  wordings: Readonly<Record<MuscleWordingSet, MuscleWording>>;
}

const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  {
    label: 'Hands',
    squeezeNudge: 'Squeeze gently. Hold it…',
    letGoNudge: 'Feel the difference.',
    wordings: {
      0: {
        squeeze: 'Squeeze your fists like you’re juicing a lemon.',
        letGo: 'Drop the lemon. Let your fingers go floppy.',
      },
      1: {
        squeeze: 'Wring out a wet towel with both hands.',
        letGo: 'Drop the towel. Let your fingers go loose.',
      },
      2: {
        squeeze: 'Crush a stress ball in each hand.',
        letGo: 'Let it roll away. Open your hands.',
      },
    },
  },
  {
    label: 'Shoulders',
    squeezeNudge: 'Not too hard. Hold it…',
    letGoNudge: 'Feel them settle.',
    wordings: {
      0: {
        squeeze: 'Shrug up to your ears, like a turtle hiding in its shell.',
        letGo: 'Let them drop. Notice how far they fall.',
      },
      1: {
        squeeze: 'Lift your shoulders like you’re trying to touch your ears.',
        letGo: 'Let them fall, like putting down heavy bags.',
      },
      2: {
        squeeze: 'Hunch up like you’re standing in the cold.',
        letGo: 'Now step into the warm. Let them drop.',
      },
    },
  },
  {
    label: 'Face',
    squeezeNudge: 'Gently. Hold it…',
    letGoNudge: 'Notice the softness.',
    wordings: {
      0: {
        squeeze: 'Scrunch your whole face like you just bit a lemon.',
        letGo: 'Let it melt. Let your jaw hang loose.',
      },
      1: {
        squeeze: 'Squeeze your eyes shut like the sun is too bright.',
        letGo: 'Let your face go smooth.',
      },
      2: {
        squeeze: 'Make the grumpiest face you can.',
        letGo: 'Let it go soft and blank.',
      },
    },
  },
  {
    label: 'Legs',
    squeezeNudge: 'Firm, not hard. Hold it…',
    letGoNudge: 'Feel them sink.',
    wordings: {
      0: {
        squeeze: 'Press your feet into the floor and tighten your legs.',
        letGo: 'Let your legs go heavy, like wet sand.',
      },
      1: {
        squeeze: 'Push your heels down like you’re braking hard.',
        letGo: 'Ease off the brake. Let your legs go loose.',
      },
      2: {
        squeeze: 'Stretch your legs long and point your toes, like a cat stretching.',
        letGo: 'Let them flop.',
      },
    },
  },
  {
    label: 'Whole body',
    squeezeNudge: 'Gently. Hold it all…',
    letGoNudge: 'Just notice.',
    wordings: {
      0: {
        squeeze: 'Now squeeze everything at once.',
        letGo: 'Let it all go. Feel how heavy and warm you are.',
      },
      1: {
        squeeze: 'Curl up tight like a hedgehog.',
        letGo: 'Uncurl and flop like a rag doll.',
      },
      2: {
        squeeze: 'Stretch everything, like you just woke up.',
        letGo: 'Let it all sink.',
      },
    },
  },
];

const SQUEEZE_SECONDS = 5;
const LET_GO_SECONDS = 10;

function muscleRelease(set: MuscleWordingSet): AttentionScript {
  return {
    id: 'muscle-release',
    title: 'Muscle Release',
    minutes: 2,
    steps: [
      tap(
        'Get comfy, sitting or lying down.',
        'Go easy on anything sore. Squeeze gently, and skip any part that hurts.',
        12,
      ),
      ...MUSCLE_GROUPS.flatMap((group): AttentionStep[] => [
        timed('squeeze', group.wordings[set].squeeze, group.squeezeNudge, SQUEEZE_SECONDS, group.label),
        timed('release', group.wordings[set].letGo, group.letGoNudge, LET_GO_SECONDS, group.label),
      ]),
      timed('release', 'Stay here a moment.', 'Breathe out slowly.', 15),
      tap('That’s the Reset.', 'Your body just learned the way back to loose.', 8),
    ],
  };
}

/** Every wording of each script; they share one rhythm and differ only in words. */
export const ATTENTION_SCRIPTS: Readonly<Record<AttentionScriptId, readonly AttentionScript[]>> = {
  '54321': [GROUNDING],
  'muscle-release': MUSCLE_WORDING_SETS.map(muscleRelease),
};

const WORDING_EPOCH = '1970-01-01';

/** The wording a session started on `localDate` plays: the next one each day. */
export function attentionScriptForDate(id: AttentionScriptId, localDate: string): AttentionScript {
  const wordings = ATTENTION_SCRIPTS[id];
  const day = daysBetweenLocalDates(WORDING_EPOCH, localDate);
  if (!Number.isFinite(day)) return wordings[0];
  return wordings[((day % wordings.length) + wordings.length) % wordings.length];
}

/** Every wording shares one title. */
export function attentionScriptTitle(id: AttentionScriptId): string {
  return ATTENTION_SCRIPTS[id][0].title;
}

export function isAttentionScriptId(value: unknown): value is AttentionScriptId {
  return typeof value === 'string' && Object.keys(ATTENTION_SCRIPTS).includes(value);
}

export function attentionStepSeconds(step: AttentionStep): number {
  return step.kind === 'timed' ? step.seconds : step.estimatedSeconds;
}

export function attentionScriptSeconds(script: AttentionScript): number {
  return script.steps.reduce((total, step) => total + attentionStepSeconds(step), 0);
}
