/**
 * The plans a finished user can pick from.
 *
 * Built from the published catalogue rather than listed by hand, so a plan
 * added to `REVISIONS` appears here and a plan withdrawn disappears. The only
 * thing authored locally is the one-word territory each plan covers: every
 * plan is called the Azora Protocol — that is the point of it — so the name
 * cannot be what tells them apart, and the outcome line is the sentence, not
 * the label.
 */

import {
  allProgramPresets,
  programPresetWeeks,
  type ProgramPlanId,
} from '../../program/domain/programCatalogue';

/**
 * What each plan is *about*, in one word.
 *
 * Deliberately the territory rather than the goal that led there: somebody who
 * came for their heart and somebody who came to stop spiralling share the
 * pressure plan, and naming it after either would tell the other they had
 * picked wrong.
 */
const TERRITORY: Record<ProgramPlanId, string> = {
  night: 'Sleep',
  morning: 'Mornings',
  pressure: 'Pressure',
  focus: 'Focus',
  quiet: 'Quiet',
};

export interface PlanChoice {
  planId: ProgramPlanId;
  /** `Sleep` — the one word that distinguishes it. */
  territory: string;
  /** The authored promise, straight from the catalogue. */
  outcome: string;
  weeks: number;
}

/** Every published plan, in catalogue order. */
export function planChoices(): readonly PlanChoice[] {
  return allProgramPresets().map((preset) => ({
    planId: preset.planId,
    territory: TERRITORY[preset.planId],
    outcome: preset.outcome,
    weeks: programPresetWeeks(preset),
  }));
}
