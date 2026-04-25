import { onUserSignedIn, onUserSignedOut } from '../analytics/identity';
import {
  clearRevenueCatIdentity,
  syncRevenueCatIdentity,
} from '../subscriptions/revenueCatClient';
import {
  getSupabaseClient,
  type SupabaseAuthChangeEvent,
  type SupabaseSession,
} from './client';

function shouldHandleAuthEvent(
  event: SupabaseAuthChangeEvent,
  session: SupabaseSession | null,
): boolean {
  if (event === 'SIGNED_OUT') {
    return true;
  }

  if (session == null) {
    return event === 'INITIAL_SESSION';
  }

  return (
    event === 'INITIAL_SESSION' ||
    event === 'SIGNED_IN' ||
    event === 'USER_UPDATED'
  );
}

function getSessionIdentityKey(session: SupabaseSession | null): string {
  if (session == null) {
    return 'signed_out';
  }

  return session.user.id;
}

export function registerAuthIdentitySync(): () => void {
  const client = getSupabaseClient();
  if (client == null) {
    return () => {};
  }

  let disposed = false;
  let lastIdentityKey: string | null = null;

  const syncSessionIdentity = async (
    event: SupabaseAuthChangeEvent,
    session: SupabaseSession | null,
  ): Promise<void> => {
    if (!shouldHandleAuthEvent(event, session)) {
      return;
    }

    const nextIdentityKey = getSessionIdentityKey(session);
    const shouldForceSync = event === 'USER_UPDATED';
    if (!shouldForceSync && lastIdentityKey === nextIdentityKey) {
      return;
    }

    lastIdentityKey = nextIdentityKey;

    if (session == null) {
      onUserSignedOut();
      await clearRevenueCatIdentity();
      return;
    }

    onUserSignedIn({
      id: session.user.id,
      email: session.user.email ?? null,
      authProvider: session.user.app_metadata?.provider ?? null,
    });

    await syncRevenueCatIdentity({
      id: session.user.id,
      email: session.user.email ?? null,
    });
  };

  const runSync = (
    event: SupabaseAuthChangeEvent,
    session: SupabaseSession | null,
  ): void => {
    void syncSessionIdentity(event, session).catch((error: unknown) => {
      if (!disposed) {
        console.warn('Failed to sync auth identities', error);
      }
    });
  };

  const { data } = client.auth.onAuthStateChange((event, session) => {
    runSync(event, session);
  });

  void client.auth
    .getSession()
    .then(({ data: sessionData, error }) => {
      if (error != null) {
        throw error;
      }

      runSync('INITIAL_SESSION', sessionData.session);
    })
    .catch((error: unknown) => {
      if (!disposed) {
        console.warn('Failed to read initial Supabase session', error);
      }
    });

  return () => {
    disposed = true;
    data.subscription.unsubscribe();
  };
}
