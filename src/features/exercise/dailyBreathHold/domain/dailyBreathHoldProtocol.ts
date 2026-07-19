import type { DailyBreathHoldPhase } from './breathHoldPhases';

export interface DailyBreathHoldProtocol {
  readonly prepCycles: number;
  readonly prepInhaleSeconds: number;
  readonly prepExhaleSeconds: number;
  readonly finalInhaleSeconds: number;
  readonly releaseGuardMs: number;
}

export type DailyBreathHoldPreparationPhase =
  | 'preInhale'
  | 'preExhale'
  | 'inhale';

export interface DailyBreathHoldPreparationStep {
  readonly phase: DailyBreathHoldPreparationPhase;
  readonly cycle: number;
  readonly durationSeconds: number;
}

export const DAILY_BREATH_HOLD_PROTOCOL = {
  prepCycles: 3,
  prepInhaleSeconds: 3,
  prepExhaleSeconds: 6,
  finalInhaleSeconds: 4,
  releaseGuardMs: 1_000,
} as const satisfies DailyBreathHoldProtocol;

export function buildDailyBreathHoldPreparationPlan(
  protocol: DailyBreathHoldProtocol,
): DailyBreathHoldPreparationStep[] {
  const plan: DailyBreathHoldPreparationStep[] = [];

  for (let cycle = 1; cycle <= protocol.prepCycles; cycle += 1) {
    plan.push(
      {
        phase: 'preInhale',
        cycle,
        durationSeconds: protocol.prepInhaleSeconds,
      },
      {
        phase: 'preExhale',
        cycle,
        durationSeconds: protocol.prepExhaleSeconds,
      },
    );
  }

  plan.push({
    phase: 'inhale',
    cycle: protocol.prepCycles,
    durationSeconds: protocol.finalInhaleSeconds,
  });

  return plan;
}

interface IsBreathHoldReleaseAllowedInput {
  phase: DailyBreathHoldPhase;
  paused: boolean;
  activeHoldElapsedMs: number;
  releaseGuardMs: number;
}

export function isBreathHoldReleaseAllowed({
  phase,
  paused,
  activeHoldElapsedMs,
  releaseGuardMs,
}: IsBreathHoldReleaseAllowedInput): boolean {
  return (
    phase === 'hold' &&
    !paused &&
    activeHoldElapsedMs >= releaseGuardMs
  );
}
