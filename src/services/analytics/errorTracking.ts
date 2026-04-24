import { posthog } from '../../config/posthog';

type ErrorContext = {
  flow: string;
  action: string;
  screen_name?: string;
  context?: string | null;
  error_type?: string;
  [key: string]: string | number | boolean | null | undefined;
};

export function captureException(error: unknown, context: ErrorContext) {
  const exception =
    error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : 'Unknown error');

  const properties: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined) properties[key] = value;
  }

  posthog.captureException(exception, properties);
}
