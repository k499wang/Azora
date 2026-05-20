import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import {
  createClient,
  processLock,
  type AuthChangeEvent,
  type Session,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js';
import type { Database } from './database.types';
import { isSupabaseConfigured, supabaseConfig } from './config';
import { fetchWithRetry } from './fetchWithRetry';

export type SupabaseAuthChangeEvent = AuthChangeEvent;
export type SupabaseSession = Session;
export type SupabaseUser = User;
export type SupabaseClientLike<TDatabase = Database> = SupabaseClient<TDatabase>;

let supabaseClient: SupabaseClientLike<Database> | null = null;
let autoRefreshSubscription: { remove: () => void } | null = null;

function createSupabaseClient(): SupabaseClientLike<Database> {
  if (!isSupabaseConfigured || supabaseConfig.url == null || supabaseConfig.publishableKey == null) {
    throw new Error(
      'Supabase is not configured. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to your Expo env before starting the app.',
    );
  }

  return createClient<Database>(
    supabaseConfig.url,
    supabaseConfig.publishableKey,
    {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
      global: {
        fetch: fetchWithRetry,
      },
    },
  );
}

function handleAppStateChange(state: AppStateStatus): void {
  if (supabaseClient == null || Platform.OS === 'web') {
    return;
  }

  if (state === 'active') {
    void supabaseClient.auth.startAutoRefresh();
    return;
  }

  void supabaseClient.auth.stopAutoRefresh();
}

function registerAutoRefreshLifecycle(): void {
  if (Platform.OS === 'web' || autoRefreshSubscription != null || supabaseClient == null) {
    return;
  }

  handleAppStateChange(AppState.currentState);
  autoRefreshSubscription = AppState.addEventListener('change', handleAppStateChange);
}

export function setSupabaseClient(
  client: SupabaseClientLike<Database>,
): void {
  supabaseClient = client;
  registerAutoRefreshLifecycle();
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
      'Supabase is not configured. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to your Expo env before starting the app.',
    );
  }

  const client = createSupabaseClient();
  setSupabaseClient(client);
  return client;
}

if (isSupabaseConfigured) {
  setSupabaseClient(createSupabaseClient());
}
