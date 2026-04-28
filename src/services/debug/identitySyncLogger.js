function isDevLoggingEnabled() {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

function isoTimestamp() {
  return new Date().toISOString();
}

export function getSessionDebugSnapshot(session) {
  if (session == null) {
    return {
      supabase_user_id: null,
      supabase_email: null,
      supabase_provider: null,
      supabase_has_session: false,
    };
  }

  return {
    supabase_user_id: session.user.id,
    supabase_email: session.user.email ?? null,
    supabase_provider: session.user.app_metadata?.provider ?? null,
    supabase_has_session: true,
  };
}

export function logIdentitySyncDebug(event, payload = {}) {
  if (!isDevLoggingEnabled()) {
    return;
  }

  console.log(`[identity-sync] ${event}`, {
    timestamp: isoTimestamp(),
    ...payload,
  });
}

export function warnIdentitySyncDebug(event, payload = {}) {
  if (!isDevLoggingEnabled()) {
    return;
  }

  console.warn(`[identity-sync] ${event}`, {
    timestamp: isoTimestamp(),
    ...payload,
  });
}
