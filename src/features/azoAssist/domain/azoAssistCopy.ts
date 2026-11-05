import type { ProgramPlanId } from '../../program/domain/programCatalogue';

export interface AzoAssistCopy {
  /** One list per sliding row. */
  starters: readonly (readonly string[])[];
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
    ['Help me plan my day', 'I keep putting something off', 'What should I do first?', 'Plan my morning'],
    ['I don’t know where to start', 'My to-do list feels endless', 'Break a big task down for me', 'Give me one small win'],
    ['I can’t switch off tonight', 'Help me get back on track', 'I’m overwhelmed today', 'I have 10 minutes, what now?'],
  ],
  chatHeading: 'Dump it all here. I’ll turn it into a plan.',
  chatPlaceholder: 'What’s today’s plan?',
  planOpener: 'What’s on your mind today? Let it all out. Messy is fine. I’ll turn it into manageable to-dos you can add to your list.',
  brainDumpHeading: 'Brain dump it all. I’ll turn it into a routine you can actually finish.',
};

const HOME_COPY: AzoAssistCopy = {
  starters: [
    ['How do I start when everything’s a mess?', 'My kitchen is a disaster', 'Laundry is taking over', 'Plan a 10-minute tidy'],
    ['Any tips for staying motivated to clean?', 'The bathroom needs a deep clean', 'Clutter is everywhere', 'Dishes keep piling up'],
    ['How do I keep my place tidy day to day?', 'What’s the fastest way to clean before guests?', 'I have 15 minutes, what first?', 'My bedroom floor has vanished'],
  ],
  chatHeading: 'Tell me what’s piling up. I’ll turn it into a cleaning plan.',
  chatPlaceholder: 'What needs tidying today?',
  planOpener: 'What’s on your mind today? Tell me everything that’s piling up at home. Messy is fine. I’ll turn it into small cleaning to-dos you can add to your list.',
  brainDumpHeading: 'Brain dump every mess on your mind. I’ll turn it into a cleaning routine you can actually finish.',
};

/** The tidy-home plan gets cleaning-shaped prompts; every other plan keeps the general ones. */
export function azoAssistCopyFor(planId: ProgramPlanId | null | undefined): AzoAssistCopy {
  return planId === 'home' ? HOME_COPY : DEFAULT_COPY;
}
