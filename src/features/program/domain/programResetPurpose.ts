import type { ProgramPlanId } from './programCatalogue';

export type ShortResetPlanId = Exclude<ProgramPlanId, 'night' | 'pressure'>;

/** The reason these plans pair breathing with guided attention practices. */
export const SHORT_RESET_PLAN_PURPOSE: Record<ShortResetPlanId, string> = {
  morning: 'Use these short practices before one small morning step, such as getting dressed.',
  focus: 'Take a short pause before starting one work or study task.',
  home: 'Take a short pause before one small household task, such as putting away one dish.',
  phone: 'Pause before acting on the urge to scroll, then choose what to do next.',
  recovery: 'Try a gentle practice from a comfortable position without pushing through low energy.',
  selfTrust: 'Practise following through on one small action without needing a perfect result.',
  quiet: 'Use a quiet moment to notice your surroundings and how your body feels.',
};
