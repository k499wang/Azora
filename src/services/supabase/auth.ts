import {
  requireSupabaseClient,
  type SupabaseAuthChangeEvent,
  type SupabaseClientLike,
  type SupabaseSession,
} from './client';
import {
  getSessionDebugSnapshot,
  logIdentitySyncDebug,
} from '../debug/identitySyncLogger.js';
import { validateCurrentSession as validateSessionWithClient } from './sessionValidatorCore';

export interface SignedInUser {
  id: string;
  email?: string | null;
}

export async function getCurrentSession(): Promise<SupabaseSession | null> {
  const client = requireSupabaseClient();
  logIdentitySyncDebug('supabase.get_current_session_started');
  const { data, error } = await client.auth.getSession();

  if (error != null) {
    throw error;
  }

  logIdentitySyncDebug('supabase.get_current_session_completed', {
    ...getSessionDebugSnapshot(data.session),
  });
  return data.session;
}

export async function getCurrentUser(): Promise<SignedInUser | null> {
  const session = await getCurrentSession();
  if (session == null) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? null,
  };
}

export async function validateCurrentSession(
  client?: Pick<SupabaseClientLike, 'auth'>,
): Promise<boolean> {
  return validateSessionWithClient(client ?? requireSupabaseClient());
}

export async function signOut(): Promise<void> {
  const client = requireSupabaseClient();
  logIdentitySyncDebug('supabase.sign_out_started');
  const { error } = await client.auth.signOut();

  if (error != null) {
    throw error;
  }

  logIdentitySyncDebug('supabase.sign_out_completed');
}

export function subscribeToAuthChanges(
  listener: (
    event: SupabaseAuthChangeEvent,
    session: SupabaseSession | null,
  ) => void,
): () => void {
  const client = requireSupabaseClient();
  logIdentitySyncDebug('supabase.auth_change_subscription_registered');
  const { data } = client.auth.onAuthStateChange(listener);
  return () => data.subscription.unsubscribe();
}
