import type { SupabaseAuthChangeEvent, SupabaseClientLike, SupabaseSession } from './client';
import {
  getSessionDebugSnapshot,
  logIdentitySyncDebug,
  warnIdentitySyncDebug,
} from '../debug/identitySyncLogger.js';

export interface AuthIdentitySyncDependencies {
  clearRevenueCatIdentity: () => Promise<void>;
  ensureProfile: (userId: string) => Promise<void>;
  getSupabaseClient: () => SupabaseClientLike | null;
  getRevenueCatAvailability?: () =>
    | { status: 'ready' }
    | { status: 'unavailable'; reason: string };
  getPostHogDistinctId?: () => string | null;
  getRevenueCatAppUserId?: () => string | null;
  isRevenueCatReady?: () => boolean;
  onRevenueCatSyncFailed?: (error: unknown, userId: string) => void;
  onRevenueCatSyncStarted?: (userId: string) => void;
  onRevenueCatSyncSucceeded?: (userId: string) => void;
  onRevenueCatSyncUnavailable?: (reason: string) => void;
  onRevenueCatSignedOut?: () => void;
  onUserSignedIn: (user: {
    id: string;
    authProvider?: string | null;
  }) => void;
  onUserSignedOut: () => void;
  syncRevenueCatIdentity: (user: {
    id: string;
    email?: string | null;
  }) => Promise<void>;
  warn: (message: string, error: unknown) => void;
}

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

export function registerAuthIdentitySync(
  dependencies: AuthIdentitySyncDependencies,
): () => void {
  const client = dependencies.getSupabaseClient();
  if (client == null) {
    logIdentitySyncDebug('supabase.identity_sync_skipped', {
      reason: 'missing_supabase_client',
    });
    return () => {};
  }

  let disposed = false;
  let lastIdentityKey: string | null = null;

  const syncSessionIdentity = async (
    event: SupabaseAuthChangeEvent,
    session: SupabaseSession | null,
  ): Promise<void> => {
    logIdentitySyncDebug('supabase.auth_event_received', {
      supabase_auth_event: event,
      ...getSessionDebugSnapshot(session),
      last_identity_key: lastIdentityKey,
      posthog_distinct_id: dependencies.getPostHogDistinctId?.() ?? null,
      revenuecat_current_app_user_id: dependencies.getRevenueCatAppUserId?.() ?? null,
      revenuecat_ready: dependencies.isRevenueCatReady?.() ?? null,
    });

    if (!shouldHandleAuthEvent(event, session)) {
      logIdentitySyncDebug('supabase.auth_event_ignored', {
        supabase_auth_event: event,
        ...getSessionDebugSnapshot(session),
      });
      return;
    }

    const nextIdentityKey = getSessionIdentityKey(session);
    const shouldForceSync = event === 'USER_UPDATED';
    if (!shouldForceSync && lastIdentityKey === nextIdentityKey) {
      logIdentitySyncDebug('supabase.identity_sync_deduped', {
        supabase_auth_event: event,
        next_identity_key: nextIdentityKey,
        last_identity_key: lastIdentityKey,
      });
      return;
    }

    lastIdentityKey = nextIdentityKey;
    logIdentitySyncDebug('supabase.identity_sync_started', {
      supabase_auth_event: event,
      next_identity_key: nextIdentityKey,
      should_force_sync: shouldForceSync,
      ...getSessionDebugSnapshot(session),
      posthog_distinct_id: dependencies.getPostHogDistinctId?.() ?? null,
      revenuecat_current_app_user_id: dependencies.getRevenueCatAppUserId?.() ?? null,
      revenuecat_ready: dependencies.isRevenueCatReady?.() ?? null,
    });

    if (session == null) {
      logIdentitySyncDebug('supabase.identity_sync_sign_out_started', {
        posthog_distinct_id: dependencies.getPostHogDistinctId?.() ?? null,
        revenuecat_current_app_user_id: dependencies.getRevenueCatAppUserId?.() ?? null,
      });
      dependencies.onUserSignedOut();
      await dependencies.clearRevenueCatIdentity();
      dependencies.onRevenueCatSignedOut?.();
      logIdentitySyncDebug('supabase.identity_sync_sign_out_completed', {
        posthog_distinct_id: dependencies.getPostHogDistinctId?.() ?? null,
        revenuecat_current_app_user_id: dependencies.getRevenueCatAppUserId?.() ?? null,
        revenuecat_ready: dependencies.isRevenueCatReady?.() ?? null,
      });
      return;
    }

    logIdentitySyncDebug('supabase.profile_ensure_started', {
      supabase_user_id: session.user.id,
    });
    await dependencies.ensureProfile(session.user.id);
    logIdentitySyncDebug('supabase.profile_ensure_completed', {
      supabase_user_id: session.user.id,
    });

    logIdentitySyncDebug('supabase.posthog_sync_started', {
      supabase_user_id: session.user.id,
      posthog_distinct_id_before: dependencies.getPostHogDistinctId?.() ?? null,
    });
    dependencies.onUserSignedIn({
      id: session.user.id,
      authProvider: session.user.app_metadata?.provider ?? null,
    });
    logIdentitySyncDebug('supabase.posthog_sync_completed', {
      supabase_user_id: session.user.id,
      posthog_distinct_id_after: dependencies.getPostHogDistinctId?.() ?? null,
    });

    logIdentitySyncDebug('supabase.revenuecat_sync_started', {
      supabase_user_id: session.user.id,
      revenuecat_current_app_user_id_before: dependencies.getRevenueCatAppUserId?.() ?? null,
      revenuecat_ready: dependencies.isRevenueCatReady?.() ?? null,
    });

    const revenueCatAvailability = dependencies.getRevenueCatAvailability?.();
    if (revenueCatAvailability?.status === 'unavailable') {
      dependencies.onRevenueCatSyncUnavailable?.(revenueCatAvailability.reason);
      logIdentitySyncDebug('supabase.revenuecat_sync_unavailable', {
        supabase_user_id: session.user.id,
        revenuecat_unavailable_reason: revenueCatAvailability.reason,
      });
    } else {
      dependencies.onRevenueCatSyncStarted?.(session.user.id);
      try {
        await dependencies.syncRevenueCatIdentity({
          id: session.user.id,
          email: session.user.email ?? null,
        });
        dependencies.onRevenueCatSyncSucceeded?.(session.user.id);
      } catch (error) {
        dependencies.onRevenueCatSyncFailed?.(error, session.user.id);
        throw error;
      }
    }
    logIdentitySyncDebug('supabase.identity_sync_completed', {
      supabase_auth_event: event,
      ...getSessionDebugSnapshot(session),
      posthog_distinct_id: dependencies.getPostHogDistinctId?.() ?? null,
      revenuecat_current_app_user_id: dependencies.getRevenueCatAppUserId?.() ?? null,
      revenuecat_ready: dependencies.isRevenueCatReady?.() ?? null,
    });
  };

  const runSync = (
    event: SupabaseAuthChangeEvent,
    session: SupabaseSession | null,
  ): void => {
    void syncSessionIdentity(event, session).catch((error: unknown) => {
      if (!disposed) {
        warnIdentitySyncDebug('supabase.identity_sync_failed', {
          supabase_auth_event: event,
          ...getSessionDebugSnapshot(session),
          error_message: error instanceof Error ? error.message : String(error),
          posthog_distinct_id: dependencies.getPostHogDistinctId?.() ?? null,
          revenuecat_current_app_user_id: dependencies.getRevenueCatAppUserId?.() ?? null,
          revenuecat_ready: dependencies.isRevenueCatReady?.() ?? null,
        });
        dependencies.warn('Failed to sync auth identities', error);
      }
    });
  };

  const { data } = client.auth.onAuthStateChange((event, session) => {
    logIdentitySyncDebug('supabase.auth_listener_fired', {
      supabase_auth_event: event,
      ...getSessionDebugSnapshot(session),
    });
    runSync(event, session);
  });

  void client.auth
    .getSession()
    .then(({ data: sessionData, error }) => {
      if (error != null) {
        throw error;
      }

      logIdentitySyncDebug('supabase.initial_session_loaded', {
        ...getSessionDebugSnapshot(sessionData.session),
      });
      runSync('INITIAL_SESSION', sessionData.session);
    })
    .catch((error: unknown) => {
      if (!disposed) {
        warnIdentitySyncDebug('supabase.initial_session_failed', {
          error_message: error instanceof Error ? error.message : String(error),
        });
        dependencies.warn('Failed to read initial Supabase session', error);
      }
    });

  return () => {
    disposed = true;
    logIdentitySyncDebug('supabase.identity_sync_unsubscribed');
    data.subscription.unsubscribe();
  };
}
