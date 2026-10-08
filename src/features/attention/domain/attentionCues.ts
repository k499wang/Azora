import type { AttentionStep } from './attentionScripts';

export type AttentionCue = 'squeeze' | 'release' | 'sense5' | 'sense4' | 'sense3' | 'sense2' | 'sense1';

const SENSE_CUES: Readonly<Record<number, AttentionCue>> = {
  5: 'sense5',
  4: 'sense4',
  3: 'sense3',
  2: 'sense2',
  1: 'sense1',
};

/**
 * The sound a step starts with: squeeze or release for a timed step, and for
 * a counting step a note that falls as the count does. Steps that only explain
 * or close the Reset start silently.
 */
export function attentionCueFor(step: AttentionStep | null): AttentionCue | null {
  if (step == null) return null;
  if (step.kind === 'timed') return step.phase;
  return step.count == null ? null : SENSE_CUES[step.count] ?? null;
}
