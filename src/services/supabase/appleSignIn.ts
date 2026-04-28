import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { requireSupabaseClient, type SupabaseSession } from './client';
import { logIdentitySyncDebug } from '../debug/identitySyncLogger.js';

export class AppleSignInCancelledError extends Error {
  constructor() {
    super('Apple sign-in cancelled');
    this.name = 'AppleSignInCancelledError';
  }
}

export class AppleSignInUnsupportedError extends Error {
  constructor() {
    super('Apple sign-in is only available on iOS 13+');
    this.name = 'AppleSignInUnsupportedError';
  }
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<SupabaseSession> {
  if (Platform.OS !== 'ios') {
    throw new AppleSignInUnsupportedError();
  }
  logIdentitySyncDebug('supabase.apple_sign_in_started');

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (err) {
    if (
      err != null &&
      typeof err === 'object' &&
      (err as { code?: string }).code === 'ERR_REQUEST_CANCELED'
    ) {
      throw new AppleSignInCancelledError();
    }
    throw err;
  }

  const idToken = credential.identityToken;
  if (idToken == null) {
    throw new Error('Apple sign-in did not return an identityToken');
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.auth.signInWithIdToken({
    provider: 'apple',
    token: idToken,
  });

  if (error != null) {
    throw error;
  }
  if (data.session == null) {
    throw new Error('Supabase did not return a session for the Apple identityToken');
  }

  logIdentitySyncDebug('supabase.apple_sign_in_completed', {
    supabase_user_id: data.session.user.id,
    supabase_email: data.session.user.email ?? null,
    supabase_provider: data.session.user.app_metadata?.provider ?? 'apple',
  });
  return data.session;
}
