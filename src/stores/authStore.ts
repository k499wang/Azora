import { create } from 'zustand';
import {
  getCurrentSession,
  signInWithApple as signInWithAppleSession,
  signInWithGoogle as signInWithGoogleSession,
  signOut as signOutSession,
  signOutGoogle,
  subscribeToAuthChanges,
  validateCurrentSession,
} from '../services/supabase';
import type { SupabaseSession, SupabaseUser } from '../services/supabase';
import { deleteAccount as deleteAccountService } from '../services/profile/deleteAccountService';
import { loadInitialSession } from './authBootstrap';

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

    const session = await loadInitialSession(getCurrentSession);

    if (session != null) {
      const isValid = await Promise.race([
        validateCurrentSession(),
        new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.warn('[auth] Session validation timed out');
            resolve(false);
          }, 5000);
        }),
      ]);

      if (!isValid) {
        console.warn('[auth] Session validation failed, signing out');
        await signOutSession();
        applySession(null);
      } else {
        applySession(session);
      }
    } else {
      applySession(session);
    }

    authSubscriptionUnsubscribe?.();
    try {
      authSubscriptionUnsubscribe = subscribeToAuthChanges((_event, nextSession) => {
        applySession(nextSession);
      });
    } catch (error) {
      console.warn('[auth] subscribeToAuthChanges failed', error);
    }
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
    const startedAt = Date.now();
    console.log('[account-delete] store action started');
    try {
      await deleteAccountService();
      console.log('[account-delete] edge deletion complete, signing out Google identity');
      await signOutGoogle();
      applySession(null);
      console.log('[account-delete] store action succeeded', {
        elapsedMs: Date.now() - startedAt,
      });
    } catch (error) {
      console.warn('[account-delete] store action failed', {
        elapsedMs: Date.now() - startedAt,
        errorMessage: getErrorMessage(error),
      });
      throw error;
    }
  },
}));

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
