import Constants from 'expo-constants';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { requireSupabaseClient, type SupabaseSession } from './client';
import { logIdentitySyncDebug } from '../debug/identitySyncLogger.js';

type GoogleExtra = {
  googleWebClientId?: string;
  googleIosClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as GoogleExtra;

let configured = false;

function configureOnce() {
  if (configured) return;
  if (extra.googleWebClientId == null) {
    throw new Error('googleWebClientId missing from app config extra');
  }
  GoogleSignin.configure({
    webClientId: extra.googleWebClientId,
    iosClientId: extra.googleIosClientId,
    scopes: ['profile', 'email'],
  });
  configured = true;
}

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google sign-in cancelled');
    this.name = 'GoogleSignInCancelledError';
  }
}

export async function signInWithGoogle(): Promise<SupabaseSession> {
  configureOnce();
  logIdentitySyncDebug('supabase.google_sign_in_started');

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  let idToken: string | null | undefined;
  try {
    const result = await GoogleSignin.signIn();
    idToken = result.data?.idToken ?? (result as unknown as { idToken?: string }).idToken;
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new GoogleSignInCancelledError();
    }
    throw err;
  }

  if (idToken == null) {
    throw new Error('Google sign-in did not return an idToken');
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error != null) {
    throw error;
  }
  if (data.session == null) {
    throw new Error('Supabase did not return a session for the Google idToken');
  }

  logIdentitySyncDebug('supabase.google_sign_in_completed', {
    supabase_user_id: data.session.user.id,
    supabase_email: data.session.user.email ?? null,
    supabase_provider: data.session.user.app_metadata?.provider ?? 'google',
  });
  return data.session;
}

export async function signOutGoogle(): Promise<void> {
  if (!configured) return;
  logIdentitySyncDebug('supabase.google_sign_out_started');
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore — supabase signOut still proceeds
  }
  logIdentitySyncDebug('supabase.google_sign_out_completed');
}
