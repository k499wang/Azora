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

  posthog.capture('$exception', {
    $exception_list: [
      {
        type: exception.name,
        value: exception.message,
        stacktrace: {
          type: 'raw',
          frames: exception.stack ?? '',
        },
      },
    ],
    $exception_source: 'react-native',
    ...context,
  });
}
