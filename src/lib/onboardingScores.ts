import type { AgreementValue } from './onboardingAgreement';

export type MindMapAxis = 'calm' | 'recovery' | 'focus' | 'mood' | 'vitality';

export interface MindMapScore {
  axis: MindMapAxis;
  label: string;
  value: number;
}

export interface MindMapResult {
  scores: MindMapScore[];
  superpower: MindMapScore;
  growthArea: MindMapScore;
}

const AXIS_LABEL: Record<MindMapAxis, string> = {
  calm: 'Calm',
  recovery: 'Recovery',
  focus: 'Focus',
  mood: 'Mood',
  vitality: 'Vitality',
};

const BASE_VITALITY_SCORE = 50;
const BASE_MOOD_BONUS = 5;
const GROWTH_AREA_TIE_PRIORITY: readonly MindMapAxis[] = [
  'vitality',
  'mood',
  'focus',
  'recovery',
  'calm',
];
const MIN_FINAL_MIND_MAP_SCORE = 5;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function finalMindMapScore(value: number): number {
  return clamp(Math.round(value), MIN_FINAL_MIND_MAP_SCORE);
}

function agreementWeight(response: AgreementValue | null | undefined): number {
  if (response === 'agree') return 1;
  if (response === 'disagree') return 0;
  return 0.5;
}

/**
 * What a named strain costs the axis it bears on, in points off that axis.
 *
 * The assessment already asks these; leaving them out of the plan meant a user
 * could say "burnout" and "I'm too tired" and still be handed a plan built as
 * if they had said neither. A strain only ever touches the axis it is actually
 * about, and the total any one axis can lose is capped, so ticking six boxes
 * bottoms out one part of the picture rather than all of it.
 */
const STRAIN_PENALTY: Record<string, Partial<Record<MindMapAxis, number>>> = {
  anxiety: { calm: 10, mood: 4 },
  lowMood: { recovery: 8, mood: 4 },
  burnout: { recovery: 10, mood: 6 },
  panic: { calm: 10, mood: 6 },
  insomnia: { recovery: 12 },
  ptsd: { mood: 8, calm: 4 },
  adhd: { focus: 10 },
  ocd: { calm: 6, focus: 4 },
  overwhelmed: { mood: 8, calm: 4 },
  focus: { focus: 10 },
  tired: { recovery: 8 },
  failing: { mood: 6 },
  start: { focus: 6 },
  racingMind: { calm: 8, focus: 4 },
  worry: { calm: 8, mood: 4 },
  phone: { focus: 6, recovery: 4 },
  schedule: { recovery: 8 },
  body: { recovery: 6 },
};

/** No one answer may take an axis apart on its own. */
const MAX_STRAIN_PENALTY = 18;

function strainPenalties(
  strains: readonly string[],
): Partial<Record<MindMapAxis, number>> {
  const totals: Partial<Record<MindMapAxis, number>> = {};
  for (const strain of strains) {
    const penalty = STRAIN_PENALTY[strain];
    if (penalty == null) continue;
    for (const [axis, points] of Object.entries(penalty) as [
      MindMapAxis,
      number,
    ][]) {
      totals[axis] = Math.min(MAX_STRAIN_PENALTY, (totals[axis] ?? 0) + points);
    }
  }
  return totals;
}

interface ScoreInputs {
  stressLevel: number;
  sleepQuality: number;
  racingLevel?: number;
  /** 1–9, higher is foggier. Absent when the slider was never moved. */
  brainFogLevel?: number;
  /** Named strains: what they struggle with, what stops them, what keeps them up. */
  strains?: readonly string[];
  agreementResponses: Record<string, AgreementValue | null>;
}

export function computeMindMap({
  stressLevel,
  sleepQuality,
  racingLevel,
  brainFogLevel,
  strains = [],
  agreementResponses,
}: ScoreInputs): MindMapResult {
  const stress01 = clamp(stressLevel, 1, 10) / 10;
  const sleep01 = clamp(sleepQuality, 1, 10) / 10;
  const exhausted = agreementWeight(agreementResponses.exhausted);
  const racingAgreement = agreementWeight(agreementResponses.racing);
  const racing =
    racingLevel != null
      ? (racingAgreement + clamp(racingLevel, 1, 10) / 10) / 2
      : racingAgreement;
  const reactive = agreementWeight(agreementResponses.reactive);
  const fog01 = brainFogLevel == null ? 0 : (clamp(brainFogLevel, 1, 9) - 1) / 8;
  const penalty = strainPenalties(strains);

  const calm = clamp(
    (1 - stress01) * 78 +
      (1 - reactive) * 15 +
      (1 - racing) * 7 -
      (penalty.calm ?? 0),
  );
  const recovery = clamp(
    sleep01 * 75 +
      (1 - exhausted) * 20 +
      (1 - stress01) * 5 -
      (penalty.recovery ?? 0),
  );
  const focus = clamp(
    (1 - racing) * 55 +
      (1 - exhausted) * 25 +
      (1 - stress01) * 20 -
      fog01 * 22 -
      (penalty.focus ?? 0),
  );
  const mood = clamp(
    (1 - reactive) * 45 +
      sleep01 * 25 +
      (1 - stress01) * 18 +
      BASE_MOOD_BONUS -
      (penalty.mood ?? 0),
  );
  const vitality = clamp(
    BASE_VITALITY_SCORE + (1 - racing) * 12 + (1 - exhausted) * 6,
  );

  const scores: MindMapScore[] = [
    { axis: 'calm', label: AXIS_LABEL.calm, value: finalMindMapScore(calm) },
    { axis: 'recovery', label: AXIS_LABEL.recovery, value: finalMindMapScore(recovery) },
    { axis: 'focus', label: AXIS_LABEL.focus, value: finalMindMapScore(focus) },
    {
      axis: 'mood',
      label: AXIS_LABEL.mood,
      value: finalMindMapScore(mood),
    },
    {
      axis: 'vitality',
      label: AXIS_LABEL.vitality,
      value: finalMindMapScore(vitality),
    },
  ];

  const sorted = [...scores].sort((a, b) => b.value - a.value);
  const growthArea = [...scores].sort((a, b) => {
    const scoreDifference = a.value - b.value;
    if (scoreDifference !== 0) return scoreDifference;

    return (
      GROWTH_AREA_TIE_PRIORITY.indexOf(a.axis) -
      GROWTH_AREA_TIE_PRIORITY.indexOf(b.axis)
    );
  })[0];
  return {
    scores,
    superpower: sorted[0],
    growthArea,
  };
}
