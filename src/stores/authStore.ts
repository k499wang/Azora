import { create } from 'zustand';
import {
  getCurrentSession,
  signOut as signOutSession,
  subscribeToAuthChanges,
} from '../services/supabase';
import type { SupabaseSession, SupabaseUser } from '../services/supabase';

export type AuthStatus = 'booting' | 'signed_out' | 'signed_in';

interface AuthState {
  status: AuthStatus;
  session: SupabaseSession | null;
  user: SupabaseUser | null;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

let authSubscriptionUnsubscribe: (() => void) | null = null;
let authInitialized = false;

function applySession(session: SupabaseSession | null) {
  useAuthStore.setState({
    status: session == null ? 'signed_out' : 'signed_in',
    session,
    user: session?.user ?? null,
  });
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'booting',
  session: null,
  user: null,
  initialize: async () => {
    if (authInitialized) {
      return;
    }

    authInitialized = true;
    set({ status: 'booting' });

    const session = await getCurrentSession();
    applySession(session);

    authSubscriptionUnsubscribe?.();
    authSubscriptionUnsubscribe = subscribeToAuthChanges((_event, nextSession) => {
      applySession(nextSession);
    });
  },
  signOut: async () => {
    await signOutSession();
  },
}));
