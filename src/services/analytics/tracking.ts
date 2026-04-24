import { posthog } from '../../config/posthog';
import { AnalyticsEvent } from './events';

type ScreenRoute = {
  name: string;
  params?: {
    context?: string;
    techniqueId?: string;
    holdSeconds?: number;
  } | undefined;
};

export function trackAppOpened() {
  posthog.capture(AnalyticsEvent.AppOpened);
}

export function trackScreenView(route: ScreenRoute) {
  const props: NonNullable<Parameters<typeof posthog.capture>[1]> = {
    screen_name: route.name,
    route_name: route.name,
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

  posthog.capture(AnalyticsEvent.ScreenView, props);
}
