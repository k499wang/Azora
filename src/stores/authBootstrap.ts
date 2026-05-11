import type { SupabaseSession } from '../services/supabase';

export const AUTH_INITIAL_SESSION_TIMEOUT_MS = 8000;

export async function loadInitialSession(
  getSession: () => Promise<SupabaseSession | null>,
  timeoutMs: number = AUTH_INITIAL_SESSION_TIMEOUT_MS,
): Promise<SupabaseSession | null> {
  const timeout = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    return await Promise.race([getSession(), timeout]);
  } catch (error) {
    console.warn('[auth] getCurrentSession failed', error);
    return null;
  }
}
