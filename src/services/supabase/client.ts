import type { Database } from './database.types';
import { isSupabaseConfigured } from './config';

export type SupabaseAuthChangeEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

export interface SupabaseUser {
  id: string;
  email?: string | null;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  user: SupabaseUser;
}

export interface SupabaseAuthSubscription {
  unsubscribe: () => void;
}

export interface SupabaseAuthClientLike {
  getSession: () => Promise<{
    data: { session: SupabaseSession | null };
    error: Error | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  onAuthStateChange: (
    listener: (
      event: SupabaseAuthChangeEvent,
      session: SupabaseSession | null,
    ) => void,
  ) => {
    data: {
      subscription: SupabaseAuthSubscription;
    };
  };
}

export interface SupabaseClientLike<TDatabase = Database> {
  auth: SupabaseAuthClientLike;
  // Add typed `from(...)` and `rpc(...)` here once `@supabase/supabase-js`
  // is installed and this placeholder is replaced with the real client type.
  __database?: TDatabase;
}

let supabaseClient: SupabaseClientLike<Database> | null = null;

export function setSupabaseClient(
  client: SupabaseClientLike<Database>,
): void {
  supabaseClient = client;
}

export function getSupabaseClient(): SupabaseClientLike<Database> | null {
  return supabaseClient;
}

export function requireSupabaseClient(): SupabaseClientLike<Database> {
  if (supabaseClient != null) {
    return supabaseClient;
  }

  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add `supabaseUrl` and `supabaseAnonKey` to Expo extra config before wiring services.',
    );
  }

  throw new Error(
    'Supabase client has not been installed yet. Add `@supabase/supabase-js`, create the client, and call `setSupabaseClient(...)` during app bootstrap.',
  );
}
