import type { ProgramPlanId } from '../../program/domain/programCatalogue';

export interface AzoAssistCopy {
  starters: readonly string[];
  chatHeading: string;
  chatPlaceholder: string;
  /**
   * Azo's opening turn when planning. Each keeps the "What’s on your mind
   * today?" lead: the server reads an answer to that question as a plan request
   * and returns to-dos for what was named.
   */
  planOpener: string;
  brainDumpHeading: string;
}

const DEFAULT_COPY: AzoAssistCopy = {
  starters: [
    'Help me plan my day',
    'I keep putting something off',
    'I don’t know where to start',
    'I can’t switch off tonight',
  ],
  chatHeading: 'Dump it all here. I’ll turn it into a plan.',
  chatPlaceholder: 'What’s today’s plan?',
  planOpener: 'What’s on your mind today? Let it all out—messy is fine. I’ll turn it into manageable to-dos you can add to your list.',
  brainDumpHeading: 'Brain dump it all. I’ll turn it into a routine you can actually finish.',
};

const HOME_COPY: AzoAssistCopy = {
  starters: [
    'Help me tidy one room',
    'I keep putting off the dishes',
    'I don’t know where to start cleaning',
    'My place is too messy to relax',
  ],
  chatHeading: 'Tell me what’s piling up. I’ll turn it into a cleaning plan.',
  chatPlaceholder: 'What needs tidying today?',
  planOpener: 'What’s on your mind today? Tell me everything that’s piling up at home—messy is fine. I’ll turn it into small cleaning to-dos you can add to your list.',
  brainDumpHeading: 'Brain dump every mess on your mind. I’ll turn it into a cleaning routine you can actually finish.',
};

/** The tidy-home plan gets cleaning-shaped prompts; every other plan keeps the general ones. */
export function azoAssistCopyFor(planId: ProgramPlanId | null | undefined): AzoAssistCopy {
  return planId === 'home' ? HOME_COPY : DEFAULT_COPY;
}
