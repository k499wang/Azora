import type { AttentionDelivery, ProgramActivityDefinition } from './programActivity';

/**
 * Guided attention Resets a plan day can name.
 *
 * Kept beside the catalogue rather than inside it so the catalogue's breathing
 * list and plan blocks can be re-authored without touching these.
 */
export const ATTENTION_ACTIVITIES: readonly ProgramActivityDefinition[] = [
  {
    id: 'attention.54321.2',
    revision: 1,
    title: '5-4-3-2-1',
    estimatedSeconds: 2 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: [],
    delivery: { modality: 'attention', scriptId: '54321', minutes: 2 },
  },
  {
    id: 'attention.muscle-release.2',
    revision: 1,
    title: 'Muscle Release',
    estimatedSeconds: 2 * 60,
    intensity: 'restorative',
    completionUnit: 'session',
    fallbackActivityIds: [],
    delivery: { modality: 'attention', scriptId: 'muscle-release', minutes: 2 },
  },
];

/** For a surface that names an attention Reset by id; an unknown id fails at load, not on tap. */
export function requireAttentionDelivery(activityId: string): AttentionDelivery {
  const delivery = ATTENTION_ACTIVITIES.find((activity) => activity.id === activityId)?.delivery;
  if (delivery?.modality !== 'attention') {
    throw new Error(`Unknown attention activity: ${activityId}`);
  }
  return delivery;
}
