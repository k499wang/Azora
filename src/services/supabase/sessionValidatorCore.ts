import { logIdentitySyncDebug } from '../debug/identitySyncLogger.js';
import type { SupabaseClientLike } from './client';

export async function validateCurrentSession(
  client: Pick<SupabaseClientLike, 'auth'>,
): Promise<boolean> {
  logIdentitySyncDebug('supabase.validate_session_started');
  const { error } = await client.auth.getUser();

  if (error != null) {
    logIdentitySyncDebug('supabase.validate_session_failed', {
      error_message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }

  logIdentitySyncDebug('supabase.validate_session_completed');
  return true;
}
