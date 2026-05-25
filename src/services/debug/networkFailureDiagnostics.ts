import NetInfo from '@react-native-community/netinfo';
import { AppState, Platform } from 'react-native';
import { getSupabaseClient } from '../supabase/client';
import { supabaseConfig } from '../supabase/config';

interface NetworkFailureDiagnosticsInput {
  userId?: string | null;
  elapsedMs: number;
  requestType: string;
  retryAttempt?: number;
  error: unknown;
}

export async function buildNetworkFailureDiagnostics({
  userId,
  elapsedMs,
  requestType,
  retryAttempt = 0,
  error,
}: NetworkFailureDiagnosticsInput) {
  const networkState = await NetInfo.fetch();
  const auth = await getAuthDiagnostics(userId);

  return {
    userId: userId ?? null,
    elapsedMs,
    requestType,
    retryAttempt,
    platform: Platform.OS,
    appState: AppState.currentState,
    supabaseHost: getSupabaseHost(),
    supabaseConfigured: {
      hasUrl: supabaseConfig.url != null,
      hasPublishableKey: supabaseConfig.publishableKey != null,
    },
    auth,
    network: {
      type: networkState.type,
      isConnected: networkState.isConnected,
      isInternetReachable: networkState.isInternetReachable,
      isWifiEnabled: networkState.isWifiEnabled,
      details: networkState.details,
    },
    error: getErrorDiagnostics(error),
  };
}

export async function logNetworkFailureDiagnostics(
  label: string,
  input: NetworkFailureDiagnosticsInput,
): Promise<void> {
  const diagnostics = await buildNetworkFailureDiagnostics(input);
  console.warn(label, safeStringify(diagnostics));
}

async function getAuthDiagnostics(expectedUserId?: string | null) {
  const supabase = getSupabaseClient();

  if (supabase == null) {
    return {
      hasClient: false,
      hasSession: false,
      hasUser: false,
      userIdMatchesInput: expectedUserId == null ? null : false,
      sessionExpiresAt: null,
      sessionExpiresInSeconds: null,
      authErrorMessage: null,
    };
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    const session = data.session;
    const expiresAtMs =
      typeof session?.expires_at === 'number'
        ? session.expires_at * 1000
        : null;
    const sessionExpiresInSeconds =
      expiresAtMs == null
        ? null
        : Math.round((expiresAtMs - Date.now()) / 1000);

    return {
      hasClient: true,
      hasSession: session != null,
      hasUser: session?.user != null,
      userIdMatchesInput:
        expectedUserId == null || session?.user?.id == null
          ? null
          : session.user.id === expectedUserId,
      sessionExpiresAt:
        expiresAtMs == null ? null : new Date(expiresAtMs).toISOString(),
      sessionExpiresInSeconds,
      authErrorMessage: error?.message ?? null,
    };
  } catch (error) {
    return {
      hasClient: true,
      hasSession: null,
      hasUser: null,
      userIdMatchesInput: null,
      sessionExpiresAt: null,
      sessionExpiresInSeconds: null,
      authErrorMessage: getErrorMessage(error),
    };
  }
}

function getSupabaseHost(): string | null {
  if (supabaseConfig.url == null) {
    return null;
  }

  try {
    return new URL(supabaseConfig.url).host;
  } catch {
    return 'invalid-supabase-url';
  }
}

function getErrorDiagnostics(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stackPreview: getStackPreview(error.stack),
      cause: getErrorCause(error),
      raw: getSerializableErrorFields(error),
    };
  }

  return {
    name: null,
    message: getErrorMessage(error),
    stackPreview: null,
    cause: null,
    raw: getSerializableValue(error),
  };
}

function getStackPreview(stack: string | undefined): string[] {
  if (stack == null) {
    return [];
  }

  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function getErrorCause(error: Error): unknown {
  if (!('cause' in error)) {
    return null;
  }

  return getSerializableValue(error.cause);
}

function getSerializableErrorFields(error: Error): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  for (const key of Object.getOwnPropertyNames(error)) {
    if (key === 'stack') {
      continue;
    }

    fields[key] = getSerializableValue(
      (error as unknown as Record<string, unknown>)[key],
    );
  }

  return fields;
}

function getSerializableValue(value: unknown): unknown {
  if (value == null) {
    return value;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

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

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
