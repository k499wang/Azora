const APPSFLYER_ID_PATTERN = /\$?apps[_\s-]*flyer[_\s-]*id/i;
const IMMUTABLE_ATTRIBUTE_PATTERN =
  /(?:cannot|can't)\s+be\s+(?:modified|changed|updated)|immutable|already\s+(?:set|exists)/i;

export function isRevenueCatAppsFlyerIdImmutableError(error: unknown): boolean {
  const text = getErrorText(error);
  return APPSFLYER_ID_PATTERN.test(text) && IMMUTABLE_ATTRIBUTE_PATTERN.test(text);
}

function getErrorText(error: unknown, seen = new WeakSet<object>()): string {
  if (error == null) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);
  if (typeof error !== 'object') return '';

  if (seen.has(error)) return '';
  seen.add(error);

  if (error instanceof Error) {
    return [error.name, error.message, getErrorText(error.cause, seen)].filter(Boolean).join(' ');
  }

  return Object.values(error as Record<string, unknown>)
    .map((value) => getErrorText(value, seen))
    .filter(Boolean)
    .join(' ');
}
