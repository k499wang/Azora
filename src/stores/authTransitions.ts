import type { SessionValidity } from '../services/supabase/sessionValidatorCore';

export const AUTH_VALIDATION_TIMEOUT_MS = 5000;

interface BootSessionDependencies {
  validate: () => Promise<SessionValidity>;
  signOut: () => Promise<void>;
  warn: (message: string, error?: unknown) => void;
  timeoutMs?: number;
}

/**
 * Only the server rejecting a session ends it. Being offline or slow says
 * nothing about the account, and signing out needs the same network that failed.
 */
export async function resolveBootSession<Session>(
  session: Session | null,
  { validate, signOut, warn, timeoutMs = AUTH_VALIDATION_TIMEOUT_MS }: BootSessionDependencies,
): Promise<Session | null> {
  if (session == null) return null;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const validity = await Promise.race([
    validate().catch((): SessionValidity => 'unknown'),
    new Promise<SessionValidity>((resolve) => {
      timer = setTimeout(() => resolve('unknown'), timeoutMs);
    }),
  ]);
  clearTimeout(timer);

  if (validity !== 'invalid') return session;

  warn('[auth] Session rejected, signing out');
  try {
    await signOut();
  } catch (error) {
    warn('[auth] Sign-out after a rejected session failed', error);
  }
  return null;
}

interface AccountDeletionDependencies {
  signOutGoogle: () => Promise<void>;
  signOutLocal: () => Promise<void>;
  applySignedOut: () => void;
  warn: (message: string, error?: unknown) => void;
}

/** The auth client's own sign-out is what tells PostHog and RevenueCat the user left. */
export async function finishAccountDeletion({
  signOutGoogle,
  signOutLocal,
  applySignedOut,
  warn,
}: AccountDeletionDependencies): Promise<void> {
  await signOutGoogle();
  try {
    await signOutLocal();
  } catch (error) {
    warn('[account-delete] clearing the local session failed', error);
  }
  applySignedOut();
}
