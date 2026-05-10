import { create } from 'zustand';
import {
  getCurrentSession,
  signInWithApple as signInWithAppleSession,
  signInWithGoogle as signInWithGoogleSession,
  signOut as signOutSession,
  signOutGoogle,
  subscribeToAuthChanges,
} from '../services/supabase';
import type { SupabaseSession, SupabaseUser } from '../services/supabase';
import { deleteAccount as deleteAccountService } from '../services/profile/deleteAccountService';

export type AuthStatus = 'booting' | 'signed_out' | 'signed_in';

interface AuthState {
  status: AuthStatus;
  session: SupabaseSession | null;
  user: SupabaseUser | null;
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
  signInWithGoogle: async () => {
    const session = await signInWithGoogleSession();
    applySession(session);
  },
  signInWithApple: async () => {
    const session = await signInWithAppleSession();
    applySession(session);
  },
  signOut: async () => {
    await signOutGoogle();
    await signOutSession();
  },
  deleteAccount: async () => {
    await deleteAccountService();
    await signOutGoogle();
    applySession(null);
  },
}));
