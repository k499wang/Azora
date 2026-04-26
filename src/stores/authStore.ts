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
  devSkipAuth: () => void;
}

const DEV_MOCK_USER_ID = '00000000-0000-0000-0000-00000000dev0';

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

    if (
      session == null &&
      __DEV__ &&
      process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === 'true'
    ) {
      useAuthStore.getState().devSkipAuth();
    }

    authSubscriptionUnsubscribe?.();
    authSubscriptionUnsubscribe = subscribeToAuthChanges((_event, nextSession) => {
      applySession(nextSession);
    });
  },
  signOut: async () => {
    await signOutSession();
  },
  devSkipAuth: () => {
    if (!__DEV__) return;
    const mockUser = {
      id: DEV_MOCK_USER_ID,
      email: 'dev@azora.local',
      app_metadata: {},
      user_metadata: { dev: true },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as SupabaseUser;
    const mockSession = {
      access_token: 'dev-mock',
      refresh_token: 'dev-mock',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    } as unknown as SupabaseSession;
    set({ status: 'signed_in', session: mockSession, user: mockUser });
  },
}));
