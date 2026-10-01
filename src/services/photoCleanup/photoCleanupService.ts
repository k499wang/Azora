import { requireSupabaseClient } from '../supabase';
import {
  parseCleanupPlan,
  type CleanupPlan,
} from '../../features/photoCleanup/domain/cleanupPlan';
import { isAccessDeniedFunctionError, PhotoCleanupAccessError } from './photoCleanupAccessError';

export async function createPhotoCleanupPlan(input: {
  imageBase64: string;
}): Promise<CleanupPlan> {
  const { data, error } = await requireSupabaseClient().functions.invoke(
    'photo-cleanup-plan',
    { body: input },
  );
  if (isAccessDeniedFunctionError(error)) throw new PhotoCleanupAccessError();
  if (error != null) throw error;
  const plan = parseCleanupPlan(data?.plan);
  if (plan == null) throw new Error('Azora could not make a safe cleaning plan from that photo.');
  return plan;
}
