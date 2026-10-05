import type { IconName } from '../../../components/common/icons/paths';
import type { MuscleIllustrationName } from '../../../components/common/icons/muscleIllustrations';
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

export type AttentionIcon = IconName | MuscleIllustrationName;

export interface AttentionTapStep {
  kind: 'tap';
  /** A short name for what this step is about, read out in place of its icon. */
  label?: string;
  icon?: AttentionIcon;
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
  icon?: AttentionIcon;
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
  icon?: AttentionIcon;
  count?: number;
}

function tap(
  prompt: string,
  nudge: string,
  estimatedSeconds: number,
  { label, icon, count }: TapExtras = {},
): AttentionTapStep {
  return { kind: 'tap', label, icon, prompt, nudge, count, estimatedSeconds };
}

function timed(
  phase: AttentionPhase,
  prompt: string,
  nudge: string,
  seconds: number,
  label?: string,
  icon?: AttentionIcon,
): AttentionTimedStep {
  return { kind: 'timed', phase, label, icon, prompt, nudge, seconds };
}

const GROUNDING: AttentionScript = {
  id: '54321',
  title: '5-4-3-2-1',
  minutes: 2,
  steps: [
    tap('Sit comfortably and look around.', 'We’ll notice what you see, hear, touch, smell, and taste. Name things silently or aloud. Tap Next to start.', 10),
    tap('Name 5 things you can see.', 'Small things count. A shadow, a corner, a crack in the paint.', 25, { label: 'See', icon: 'sense-eye', count: 5 }),
    tap('Name 4 things you can hear.', 'Near or far. Even a quiet hum counts.', 25, { label: 'Hear', icon: 'sense-ear', count: 4 }),
    tap('Name 3 things you can touch.', 'Notice your feet on the floor, your clothes, or the chair under you.', 20, { label: 'Touch', icon: 'body-hand', count: 3 }),
    tap('Name 2 things you can smell.', 'If nothing comes, name two smells you like.', 15, { label: 'Smell', icon: 'sense-nose', count: 2 }),
    tap('Name 1 thing you can taste.', 'Notice a taste in your mouth. If there is none, think of a taste you know.', 10, { label: 'Taste', icon: 'sense-mouth', count: 1 }),
    tap('You’ve finished 5-4-3-2-1.', 'You practised noticing what is around you. You do not need to feel different to finish.', 10),
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
  icon: MuscleIllustrationName;
  squeezeNudge: string;
  letGoNudge: string;
  wordings: Readonly<Record<MuscleWordingSet, MuscleWording>>;
}

const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  {
    label: 'Hands',
    icon: 'muscle-release-feather',
    squeezeNudge: 'Squeeze gently. Hold it…',
    letGoNudge: 'Feel the difference.',
    wordings: {
      0: {
        squeeze: 'Close both hands into gentle fists.',
        letGo: 'Open your hands. Let your fingers rest.',
      },
      1: {
        squeeze: 'Gently curl your fingers into your palms.',
        letGo: 'Uncurl your fingers. Leave your hands loose.',
      },
      2: {
        squeeze: 'Make a loose fist with each hand and gently tighten it.',
        letGo: 'Stop squeezing. Open both hands.',
      },
    },
  },
  {
    label: 'Shoulders',
    icon: 'muscle-shoulders',
    squeezeNudge: 'Not too hard. Hold it…',
    letGoNudge: 'Feel them settle.',
    wordings: {
      0: {
        squeeze: 'Gently lift your shoulders toward your ears.',
        letGo: 'Let them drop. Notice how far they fall.',
      },
      1: {
        squeeze: 'Lift your shoulders like you’re trying to touch your ears.',
        letGo: 'Lower your shoulders. Stop holding them up.',
      },
      2: {
        squeeze: 'Raise both shoulders a little and hold them there.',
        letGo: 'Let both shoulders drop back down.',
      },
    },
  },
  {
    label: 'Face',
    icon: 'muscle-face',
    squeezeNudge: 'Gently. Hold it…',
    letGoNudge: 'Notice the softness.',
    wordings: {
      0: {
        squeeze: 'Gently scrunch your face. Keep your teeth apart.',
        letGo: 'Relax your face. Let your jaw rest.',
      },
      1: {
        squeeze: 'Gently scrunch your nose and press your lips together.',
        letGo: 'Let your face go smooth.',
      },
      2: {
        squeeze: 'Gently draw your eyebrows together.',
        letGo: 'Relax your eyebrows and your face.',
      },
    },
  },
  {
    label: 'Legs',
    icon: 'muscle-legs',
    squeezeNudge: 'Firm, not hard. Hold it…',
    letGoNudge: 'Feel them sink.',
    wordings: {
      0: {
        squeeze: 'Press your feet into the floor and tighten your legs.',
        letGo: 'Stop pressing. Let your legs rest.',
      },
      1: {
        squeeze: 'Gently press your heels down and tighten your legs.',
        letGo: 'Stop pressing your heels. Relax your legs.',
      },
      2: {
        squeeze: 'Gently tighten your leg muscles without moving your legs.',
        letGo: 'Stop tightening. Let your legs rest.',
      },
    },
  },
  {
    label: 'Whole body',
    icon: 'muscle-relax-lotus',
    squeezeNudge: 'Gently. Hold it all…',
    letGoNudge: 'Just notice.',
    wordings: {
      0: {
        squeeze: 'Gently tighten your hands, shoulders, and legs together.',
        letGo: 'Stop tightening. Let your hands, shoulders, and legs rest.',
      },
      1: {
        squeeze: 'Gently squeeze your hands and lift your shoulders. Tighten your legs too.',
        letGo: 'Open your hands, lower your shoulders, and relax your legs.',
      },
      2: {
        squeeze: 'Gently tighten the body parts you just practised.',
        letGo: 'Release them all. Let your body rest.',
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
        'Sit comfortably and set your phone down where you can see it.',
        'Each step moves on by itself. Tighten each body part for 5 seconds, then relax it for 10. Skip anything sore or painful.',
        14,
      ),
      ...MUSCLE_GROUPS.flatMap((group): AttentionStep[] => [
        timed('squeeze', group.wordings[set].squeeze, group.squeezeNudge, SQUEEZE_SECONDS, group.label, group.icon),
        timed('release', group.wordings[set].letGo, group.letGoNudge, LET_GO_SECONDS, group.label, group.icon),
      ]),
      tap('You’ve finished Muscle Release.', 'Notice how your body feels now. It is okay if you do not feel a change.', 8),
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
