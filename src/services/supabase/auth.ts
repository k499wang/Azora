import {
  requireSupabaseClient,
  type SupabaseAuthChangeEvent,
  type SupabaseSession,
} from './client';

export interface SignedInUser {
  id: string;
  email?: string | null;
}

export async function getCurrentSession(): Promise<SupabaseSession | null> {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error != null) {
    throw error;
  }

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

export async function signOut(): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.auth.signOut();

  if (error != null) {
    throw error;
  }
}

export function subscribeToAuthChanges(
  listener: (
    event: SupabaseAuthChangeEvent,
    session: SupabaseSession | null,
  ) => void,
): () => void {
  const client = requireSupabaseClient();
  const { data } = client.auth.onAuthStateChange(listener);
  return () => data.subscription.unsubscribe();
}
