import { requireSupabaseClient } from '../supabase';
import { supabaseConfig } from '../supabase/config';

export async function deleteAccount(): Promise<void> {
  const startedAt = Date.now();
  console.log('[account-delete] started');

  const supabase = requireSupabaseClient();

  try {
    console.log('[account-delete] reading current session');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError != null) throw sessionError;

    const jwt = sessionData.session?.access_token;
    console.log('[account-delete] current session read', {
      hasSession: sessionData.session != null,
      hasAccessToken: jwt != null,
      userId: sessionData.session?.user.id ?? null,
    });
    if (jwt == null) throw new Error('No active session — sign in before deleting your account.');

    if (supabaseConfig.url == null) {
      throw new Error('Supabase is not configured.');
    }

    console.log('[account-delete] edge function request started');
    const responseStartedAt = Date.now();
    const res = await fetch(`${supabaseConfig.url}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('[account-delete] edge function response received', {
      status: res.status,
      ok: res.ok,
      elapsedMs: Date.now() - responseStartedAt,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(body || `Delete account failed (${res.status})`);
    }

    console.log('[account-delete] succeeded', {
      elapsedMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.warn('[account-delete] failed', {
      elapsedMs: Date.now() - startedAt,
      errorMessage: getErrorMessage(error),
    });
    throw error;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error);
}
