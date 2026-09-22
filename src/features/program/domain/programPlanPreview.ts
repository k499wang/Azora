import { exerciseTitleForTechniqueId } from '../../exercise/guidedBreathing/exerciseTitles';
import type { DailyPlanActionId } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import {
  PROGRAM_ACTIVITIES,
  latestProgramPreset,
  programPlanShape,
  type ProgramPlanId,
} from './programCatalogue';
import { programSlotAt } from './programSchedule';

export interface ProgramPlanPreviewRow {
  /** The hour of the user's day this one takes. */
  slot: DailyPlanActionId;
  /** What the row is called, in the words Home uses for the same exercise. */
  title: string;
  minutes: number;
}

/**
 * The plan as a page, before anybody is on it.
 *
 * Onboarding used to hand over a fixed pair of rows built from the session
 * length the user picked, and the plan they actually started then asked for one
 * exercise on day one. The page and the plan were two different plans, and the
 * page was the one being sold.
 *
 * So the rows come from the plan, and only the ones it asks for now. It briefly
 * also listed the hours the plan would grow into, marked with the week they
 * arrived, and that is a worse page: it puts a fortnight of work in front of
 * somebody who has not done day one, and it makes the first week read as a
 * warm-up for the real plan rather than as the plan. The other hours are still
 * written from the same answers, silently, because asking again in week five
 * would be asking about a routine they have since changed.
 */
export function programPlanPreviewRows(
  planId: ProgramPlanId,
): readonly ProgramPlanPreviewRow[] {
  const preset = latestProgramPreset(planId);
  if (preset == null) return [];

  const shape = programPlanShape(preset);
  const firstDay = preset.days[0];
  const rows: ProgramPlanPreviewRow[] = [];

  for (let position = 0; position < shape.firstDayCount; position += 1) {
    const slot = programSlotAt(position);
    const activityId = firstDay.activityIds[position];
    if (slot == null || activityId == null) continue;

    const activity = PROGRAM_ACTIVITIES.get(activityId);
    if (activity == null) continue;

    const defaultTitle =
      activity.delivery.modality === 'breathing'
        ? exerciseTitleForTechniqueId(activity.delivery.techniqueId)
        : activity.title;

    rows.push({
      slot,
      title: defaultTitle,
      minutes: Math.round(activity.estimatedSeconds / 60),
    });
  }

  return rows;
}
