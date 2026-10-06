export interface OnboardingMilestone {
  at: number;
  label: string;
}

export const ONBOARDING_MILESTONES: readonly OnboardingMilestone[] = [
  { at: 0.25, label: 'Nice start' },
  { at: 0.5, label: 'Halfway there' },
  { at: 0.75, label: 'Almost done' },
];

export interface ProgressStep {
  /** the bar moved forward, so it gets a landing beat */
  lands: boolean;
  milestone: OnboardingMilestone | null;
}

export interface ProgressLedger {
  advance(to: number): ProgressStep;
}

/**
 * Remembers where the bar last landed and which milestones have been
 * celebrated, so a milestone plays once per flow, only going forward, and
 * never on the screen the bar first appears on.
 */
export function createProgressLedger(start: number): ProgressLedger {
  let last = start;
  let isFirstStep = true;
  const celebrated = new Set<number>();

  return {
    advance(to) {
      const from = last;
      const skipsMilestone = isFirstStep;
      last = to;
      isFirstStep = false;

      if (to <= from) return { lands: false, milestone: null };
      if (skipsMilestone) return { lands: true, milestone: null };

      const crossed = ONBOARDING_MILESTONES.filter(
        ({ at }) => from < at && at <= to && !celebrated.has(at),
      );
      const milestone = crossed[crossed.length - 1] ?? null;
      if (milestone) celebrated.add(milestone.at);
      return { lands: true, milestone };
    },
  };
}
