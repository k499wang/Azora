import type { AgreementValue } from '../components/onboarding/screens/AgreementScreen';
import type { ExperienceLevel } from '../components/onboarding/screens/ExperienceScreen';

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

const EXPERIENCE_BREATH_SCORE: Record<ExperienceLevel, number> = {
  regular: 78,
  little: 50,
  never: 32,
};

const EXPERIENCE_RESILIENCE_BONUS: Record<ExperienceLevel, number> = {
  regular: 12,
  little: 5,
  never: 0,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
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
  experienceLevel: ExperienceLevel | null;
}

export function computeMindMap({
  stressLevel,
  sleepQuality,
  racingLevel,
  agreementResponses,
  experienceLevel,
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
  const experienceBreath =
    experienceLevel != null ? EXPERIENCE_BREATH_SCORE[experienceLevel] : 38;
  const experienceResilience =
    experienceLevel != null ? EXPERIENCE_RESILIENCE_BONUS[experienceLevel] : 0;

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
      experienceResilience,
  );
  const breathEase = clamp(
    experienceBreath + (1 - racing) * 12 + (1 - exhausted) * 6,
  );

  const scores: MindMapScore[] = [
    { axis: 'calm', label: AXIS_LABEL.calm, value: Math.round(calm) },
    { axis: 'recovery', label: AXIS_LABEL.recovery, value: Math.round(recovery) },
    { axis: 'focus', label: AXIS_LABEL.focus, value: Math.round(focus) },
    { axis: 'resilience', label: AXIS_LABEL.resilience, value: Math.round(resilience) },
    { axis: 'breathEase', label: AXIS_LABEL.breathEase, value: Math.round(breathEase) },
  ];

  const sorted = [...scores].sort((a, b) => b.value - a.value);
  return {
    scores,
    superpower: sorted[0],
    growthArea: sorted[sorted.length - 1],
  };
}
