export class PhotoCleanupAccessError extends Error {
  constructor() {
    super('Photo cleanup is available with Azora Pro.');
    this.name = 'PhotoCleanupAccessError';
  }
}

export function isAccessDeniedFunctionError(error: unknown): boolean {
  if (!(error instanceof Error) || error.name !== 'FunctionsHttpError') return false;
  const { context } = error as Error & { context?: unknown };
  return typeof context === 'object' && context != null && 'status' in context && context.status === 403;
}
