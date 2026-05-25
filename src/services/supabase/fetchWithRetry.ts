type Fetch = typeof fetch;

const MAX_RETRIES_READS = 2;
const MAX_RETRIES_UPSERT = 2;
const MAX_RETRIES_IDEMPOTENT_RPC = 2;
const BASE_DELAY_MS = 600;

function isNetworkFailure(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    typeof error.message === 'string' &&
    error.message.includes('Network request failed')
  );
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method != null) {
    return init.method.toUpperCase();
  }

  if (
    typeof Request !== 'undefined' &&
    input instanceof Request
  ) {
    return input.method.toUpperCase();
  }

  return 'GET';
}

function getRequestHeaders(
  input: RequestInfo | URL,
  init?: RequestInit,
): HeadersInit | undefined {
  if (init?.headers != null) {
    return init.headers;
  }

  if (
    typeof Request !== 'undefined' &&
    input instanceof Request
  ) {
    return input.headers;
  }

  return undefined;
}

function getHeaderValue(
  headers: HeadersInit | undefined,
  key: string
): string | undefined {
  if (!headers) return undefined;

  if (headers instanceof Headers) {
    return headers.get(key) ?? undefined;
  }

  if (Array.isArray(headers)) {
    const found = headers.find(
      ([k]) => k.toLowerCase() === key.toLowerCase()
    );
    return found?.[1];
  }

  const normalizedKey = Object.keys(headers).find(
    (k) => k.toLowerCase() === key.toLowerCase()
  );
  return normalizedKey
    ? (headers as Record<string, string>)[normalizedKey]
    : undefined;
}

function isUpsertRequest(input: RequestInfo | URL, init?: RequestInit): boolean {
  const prefer = getHeaderValue(getRequestHeaders(input, init), 'Prefer') ?? '';
  return (
    prefer.includes('resolution=merge-duplicates') ||
    prefer.includes('resolution=ignore-duplicates')
  );
}

function getEndpointPathname(input: RequestInfo | URL): string | null {
  try {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : typeof Request !== 'undefined' && input instanceof Request
            ? input.url
            : input.toString();
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

function isIdempotentRpcRequest(input: RequestInfo | URL, init?: RequestInit): boolean {
  const method = getRequestMethod(input, init);
  if (method !== 'POST') return false;

  return getEndpointPathname(input)?.endsWith('/rpc/complete_heart_rate_session') === true;
}

function getMaxRetries(input: RequestInfo | URL, init?: RequestInit): number {
  const method = getRequestMethod(input, init);

  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return MAX_RETRIES_READS;
  }

  if (isUpsertRequest(input, init)) {
    return MAX_RETRIES_UPSERT;
  }

  if (isIdempotentRpcRequest(input, init)) {
    return MAX_RETRIES_IDEMPOTENT_RPC;
  }

  return 0;
}

function getSafeEndpoint(input: RequestInfo | URL): string {
  const pathname = getEndpointPathname(input);
  if (pathname == null) return '<unknown>';

  // Limit length to avoid logging massive URLs
  return pathname.length > 120 ? pathname.slice(0, 120) + '...' : pathname;
}

function getRequestType(
  input: RequestInfo | URL,
  init?: RequestInit,
): 'read' | 'upsert' | 'idempotent_rpc' | 'other' {
  const method = getRequestMethod(input, init);

  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return 'read';
  }

  if (isUpsertRequest(input, init)) {
    return 'upsert';
  }

  if (isIdempotentRpcRequest(input, init)) {
    return 'idempotent_rpc';
  }

  return 'other';
}

/**
 * Custom fetch wrapper for Supabase that retries transient React Native
 * iOS network failures without risking duplicate inserts/updates.
 *
 * - Retries safe methods (GET/HEAD/OPTIONS) up to 2 times.
 * - Retries upserts (detected by Prefer: resolution=merge-duplicates)
 *   up to 2 times.
 * - Retries explicitly idempotent RPCs up to 2 times.
 * - Never retries regular inserts, updates, deletes, or storage uploads.
 */
export const fetchWithRetry: Fetch = async (input, init) => {
  const maxRetries = getMaxRetries(input, init);
  const endpoint = getSafeEndpoint(input);
  const method = getRequestMethod(input, init);
  const requestType = getRequestType(input, init);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(input, init);

      if (attempt > 0) {
        console.log(
          `[supabase:retry] succeeded after retry`,
          {
            method,
            endpoint,
            requestType,
            attempt,
            totalAttempts: attempt + 1,
          }
        );
      }

      return response;
    } catch (error) {
      const canRetry = isNetworkFailure(error) && attempt < maxRetries;

      if (!canRetry) {
        console.warn(
          `[supabase:retry] final failure`,
          {
            method,
            endpoint,
            requestType,
            attemptsMade: attempt + 1,
            maxRetries,
            willRetry: false,
            error: error instanceof Error ? error.message : String(error),
          }
        );
        throw error;
      }

      const delay = BASE_DELAY_MS * (attempt + 1);

      console.warn(
        `[supabase:retry] transient failure, retrying`,
        {
          method,
          endpoint,
          requestType,
          attempt: attempt + 1,
          maxRetries,
          nextDelayMs: delay,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('fetchWithRetry exhausted all retries unexpectedly');
};
