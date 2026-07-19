import type {
  BreathingPhase,
  BreathingPhaseDurations,
} from './breathingSessionTiming';

const CYCLIC_PHASE_ORDER: readonly BreathingPhase[] = [
  'inhale',
  'holdIn',
  'exhale',
  'holdOut',
];

export interface BreathingPlanStep {
  readonly round: number;
  readonly phase: BreathingPhase;
  readonly durationSeconds: number;
}

interface RunBreathingSessionPlanOptions {
  plan: readonly BreathingPlanStep[];
  isActive: () => boolean;
  runPhase: (
    phase: BreathingPhase,
    durationSeconds: number,
    onComplete: () => void,
  ) => void;
  onRoundChange: (round: number) => void;
  onComplete: () => void;
}

export function buildCyclicBreathingPlan(
  pattern: BreathingPhaseDurations,
  totalRounds: number,
): BreathingPlanStep[] {
  const plan: BreathingPlanStep[] = [];

  for (let round = 1; round <= totalRounds; round += 1) {
    for (const phase of CYCLIC_PHASE_ORDER) {
      plan.push({
        round,
        phase,
        durationSeconds: pattern[phase],
      });
    }
  }

  return plan;
}

export function runBreathingSessionPlan({
  plan,
  isActive,
  runPhase,
  onRoundChange,
  onComplete,
}: RunBreathingSessionPlanOptions): void {
  let nextStepIndex = 0;
  let activeRound: number | null = null;
  let completionDelivered = false;

  const runNextStep = () => {
    if (!isActive()) return;

    const step = plan[nextStepIndex];
    if (step == null) {
      if (completionDelivered) return;
      completionDelivered = true;
      onComplete();
      return;
    }

    nextStepIndex += 1;
    if (step.round !== activeRound) {
      activeRound = step.round;
      onRoundChange(step.round);
    }

    runPhase(step.phase, step.durationSeconds, runNextStep);
  };

  runNextStep();
}
