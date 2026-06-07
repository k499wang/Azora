import { posthog } from '../../config/posthog';
import { AnalyticsEvent } from './events';
import type { PaywallPlacementValue } from '../paywall';
import type {
  FeatureAccessResult,
  FeatureKeyValue,
} from '../subscriptions/featureAccess';

type ScreenRoute = {
  name: string;
  params?: Readonly<Record<string, unknown>> | undefined;
};

function getStringParam(route: ScreenRoute, key: string): string | null {
  const value = route.params?.[key];
  return typeof value === 'string' ? value : null;
}

function getNumberParam(route: ScreenRoute, key: string): number | null {
  const value = route.params?.[key];
  return typeof value === 'number' ? value : null;
}

export function trackAppOpened() {
  posthog.capture(AnalyticsEvent.AppOpened);
}

export function trackScreenView(route: ScreenRoute) {
  const props: NonNullable<Parameters<typeof posthog.capture>[1]> = {
    app_screen_name: route.name,
  };

  if (route.name === 'HeartRate') {
    props.context = getStringParam(route, 'context');
  }

  if (route.name === 'ExerciseSession') {
    props.technique_id = getStringParam(route, 'techniqueId');
  }

  if (route.name === 'DailyResult') {
    props.hold_seconds = getNumberParam(route, 'holdSeconds');
  }

  if (route.name === 'HeartRateSessionDetail') {
    props.session_id = getStringParam(route, 'sessionId');
  }

  posthog.capture(AnalyticsEvent.ScreenView, props);
}

interface NotificationEventProps {
  notification_kind: string;
  variant_index: number | null;
  destination: string | null;
}

export function trackNotificationScheduled(
  props: NotificationEventProps & { fire_at: string; stable_id: string },
) {
  posthog.capture(AnalyticsEvent.NotificationScheduled, { ...props });
}

export function trackNotificationTapped(props: NotificationEventProps) {
  posthog.capture(AnalyticsEvent.NotificationTapped, { ...props });
}

export function trackNotificationPermissionResult(props: {
  status: string;
  source: 'onboarding' | 'settings' | 'paywall';
}) {
  posthog.capture(AnalyticsEvent.NotificationPermissionResult, props);
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

export function trackFeatureGateHit(props: {
  feature: FeatureKeyValue;
  placement: PaywallPlacementValue;
  sourceScreen: string;
  sourceAction?: string | null;
  access: FeatureAccessResult;
}) {
  posthog.capture(AnalyticsEvent.FeatureGateHit, {
    feature: props.feature,
    placement: props.placement,
    source_screen: props.sourceScreen,
    source_action: props.sourceAction ?? null,
    reason: props.access.reason,
    used: props.access.used,
    limit: props.access.limit,
    is_pro: props.access.isPro,
  });
}
