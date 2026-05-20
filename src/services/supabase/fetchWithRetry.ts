type Fetch = typeof fetch;

const MAX_RETRIES_READS = 2;
const MAX_RETRIES_UPSERT = 2;
const BASE_DELAY_MS = 600;

function isNetworkFailure(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    typeof error.message === 'string' &&
    error.message.includes('Network request failed')
  );
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

function isUpsertRequest(init?: RequestInit): boolean {
  const prefer = getHeaderValue(init?.headers, 'Prefer') ?? '';
  return (
    prefer.includes('resolution=merge-duplicates') ||
    prefer.includes('resolution=ignore-duplicates')
  );
}

function getMaxRetries(init?: RequestInit): number {
  const method = (init?.method ?? 'GET').toUpperCase();

  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return MAX_RETRIES_READS;
  }

  if (isUpsertRequest(init)) {
    return MAX_RETRIES_UPSERT;
  }

  return 0;
}

function getSafeEndpoint(input: RequestInfo | URL): string {
  try {
    const url = typeof input === 'string' ? input : input.toString();
    const pathname = new URL(url).pathname;
    // Limit length to avoid logging massive URLs
    return pathname.length > 120 ? pathname.slice(0, 120) + '...' : pathname;
  } catch {
    return '<unknown>';
  }
}

function getRequestType(init?: RequestInit): 'read' | 'upsert' | 'other' {
  const method = (init?.method ?? 'GET').toUpperCase();

  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return 'read';
  }

  if (isUpsertRequest(init)) {
    return 'upsert';
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
 * - Never retries regular inserts, updates, deletes, or storage uploads.
 */
export const fetchWithRetry: Fetch = async (input, init) => {
  const maxRetries = getMaxRetries(init);
  const endpoint = getSafeEndpoint(input);
  const method = (init?.method ?? 'GET').toUpperCase();
  const requestType = getRequestType(init);

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
