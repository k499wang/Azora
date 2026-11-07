import { logIdentitySyncDebug } from '../debug/identitySyncLogger.js';
import type { SupabaseClientLike } from './client';

/** `unknown` means the server gave no verdict, so nothing is known against the session. */
export type SessionValidity = 'valid' | 'invalid' | 'unknown';

function isSessionRejection(error: unknown): boolean {
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429;
}

export async function validateCurrentSession(
  client: Pick<SupabaseClientLike, 'auth'>,
): Promise<SessionValidity> {
  logIdentitySyncDebug('supabase.validate_session_started');
  let error: unknown;
  try {
    ({ error } = await client.auth.getUser());
  } catch (thrown) {
    error = thrown;
  }

  if (error != null) {
    logIdentitySyncDebug('supabase.validate_session_failed', {
      error_message: error instanceof Error ? error.message : String(error),
    });
    return isSessionRejection(error) ? 'invalid' : 'unknown';
  }

  logIdentitySyncDebug('supabase.validate_session_completed');
  return 'valid';
}
