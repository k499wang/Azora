import type { AgreementValue } from '../components/onboarding/screens/AgreementScreen';

export type MindMapAxis = 'calm' | 'recovery' | 'focus' | 'resilience' | 'breathEase';

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
  resilience: 'Resilience',
  breathEase: 'Breathing',
};

const BASE_BREATH_SCORE = 50;
const BASE_RESILIENCE_BONUS = 5;
const GROWTH_AREA_TIE_PRIORITY: readonly MindMapAxis[] = [
  'breathEase',
  'resilience',
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

interface ScoreInputs {
  stressLevel: number;
  sleepQuality: number;
  racingLevel?: number;
  agreementResponses: Record<string, AgreementValue | null>;
}

export function computeMindMap({
  stressLevel,
  sleepQuality,
  racingLevel,
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

  const calm = clamp(
    (1 - stress01) * 78 + (1 - reactive) * 15 + (1 - racing) * 7,
  );
  const recovery = clamp(
    sleep01 * 75 + (1 - exhausted) * 20 + (1 - stress01) * 5,
  );
  const focus = clamp(
    (1 - racing) * 55 + (1 - exhausted) * 25 + (1 - stress01) * 20,
  );
  const resilience = clamp(
    (1 - reactive) * 45 +
      sleep01 * 25 +
      (1 - stress01) * 18 +
      BASE_RESILIENCE_BONUS,
  );
  const breathEase = clamp(
    BASE_BREATH_SCORE + (1 - racing) * 12 + (1 - exhausted) * 6,
  );

  const scores: MindMapScore[] = [
    { axis: 'calm', label: AXIS_LABEL.calm, value: finalMindMapScore(calm) },
    { axis: 'recovery', label: AXIS_LABEL.recovery, value: finalMindMapScore(recovery) },
    { axis: 'focus', label: AXIS_LABEL.focus, value: finalMindMapScore(focus) },
    {
      axis: 'resilience',
      label: AXIS_LABEL.resilience,
      value: finalMindMapScore(resilience),
    },
    {
      axis: 'breathEase',
      label: AXIS_LABEL.breathEase,
      value: finalMindMapScore(breathEase),
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
