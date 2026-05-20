import NetInfo from '@react-native-community/netinfo';
import { AppState, Platform } from 'react-native';
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

  return {
    userId: userId ?? null,
    elapsedMs,
    requestType,
    retryAttempt,
    platform: Platform.OS,
    appState: AppState.currentState,
    supabaseHost: getSupabaseHost(),
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
