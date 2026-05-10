import { requireSupabaseClient } from '../supabase';
import { supabaseConfig } from '../supabase/config';

export async function deleteAccount(): Promise<void> {
  const supabase = requireSupabaseClient();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError != null) throw sessionError;

  const jwt = sessionData.session?.access_token;
  if (jwt == null) throw new Error('No active session — sign in before deleting your account.');

  if (supabaseConfig.url == null) {
    throw new Error('Supabase is not configured.');
  }

  const res = await fetch(`${supabaseConfig.url}/functions/v1/delete-account`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Delete account failed (${res.status})`);
  }
}
