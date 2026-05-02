import { posthog } from '../../config/posthog';
import { AnalyticsEvent } from './events';

type ScreenRoute = {
  name: string;
  params?: {
    context?: string;
    techniqueId?: string;
    holdSeconds?: number;
    sessionId?: string;
  } | undefined;
};

export function trackAppOpened() {
  posthog.capture(AnalyticsEvent.AppOpened);
}

export function trackScreenView(route: ScreenRoute) {
  const props: NonNullable<Parameters<typeof posthog.capture>[1]> = {
    app_screen_name: route.name,
  };

  if (route.name === 'HeartRate') {
    props.context = route.params?.context ?? null;
  }

  if (route.name === 'ExerciseSession') {
    props.technique_id = route.params?.techniqueId ?? null;
  }

  if (route.name === 'DailyResult') {
    props.hold_seconds = route.params?.holdSeconds ?? null;
  }

  if (route.name === 'HeartRateSessionDetail') {
    props.session_id = route.params?.sessionId ?? null;
  }

  posthog.capture(AnalyticsEvent.ScreenView, props);
}

export function trackProfileAction(
  action: string,
  properties?: Record<string, string | number | boolean | null>,
) {
  posthog.capture(AnalyticsEvent.ProfileAction, {
    action,
    ...properties,
  });
}
