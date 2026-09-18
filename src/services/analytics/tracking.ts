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

/**
 * The check-in, as four events rather than one.
 *
 * `opened` minus `completed` is the only number that answers whether four
 * questions is too many to ask daily, and `offered` minus `accepted` is the
 * only one that answers whether a suggestion after a bad day is help or a
 * funnel. Neither can be recovered later from a single completion event.
 *
 * The ratings themselves are sent as the band, never the raw answers. What
 * someone said about their own day belongs in their row, not in an analytics
 * property that every dashboard can slice.
 */
export function trackMoodCheckInOpened(props: { source: string }) {
  posthog.capture(AnalyticsEvent.MoodCheckInOpened, { source: props.source });
}

export function trackMoodCheckInCompleted(props: {
  band: string;
  questionCount: number;
  /** Already answered today, so this one replaced an earlier answer. */
  isRevision: boolean;
}) {
  posthog.capture(AnalyticsEvent.MoodCheckInCompleted, {
    band: props.band,
    question_count: props.questionCount,
    is_revision: props.isRevision,
  });
}

export function trackMoodSuggestionOffered(props: {
  /** The emotion they named, or the weakest scale when none asks for help. */
  answering: string;
  techniqueId: string;
}) {
  posthog.capture(AnalyticsEvent.MoodSuggestionOffered, {
    answering: props.answering,
    technique_id: props.techniqueId,
  });
}

export function trackMoodSuggestionAccepted(props: {
  answering: string;
  techniqueId: string;
}) {
  posthog.capture(AnalyticsEvent.MoodSuggestionAccepted, {
    answering: props.answering,
    technique_id: props.techniqueId,
  });
}

/**
 * Said no, which is the number that matters most on this page.
 *
 * Offered minus accepted would give the same figure, but only by assuming
 * everybody who did not start it pressed something. They might have closed the
 * app. A decline is a thing somebody did, and it is recorded as one.
 */
export function trackMoodSuggestionDeclined(props: {
  answering: string;
  techniqueId: string;
}) {
  posthog.capture(AnalyticsEvent.MoodSuggestionDeclined, {
    answering: props.answering,
    technique_id: props.techniqueId,
  });
}

export function trackReviewPromptRequested(props: {
  trigger: string;
  promptCount: number;
  completedSessions: number;
}) {
  posthog.capture(AnalyticsEvent.ReviewPromptRequested, {
    trigger: props.trigger,
    prompt_count: props.promptCount,
    completed_sessions: props.completedSessions,
  });
}

export function trackReviewPromptSuppressed(props: {
  trigger: string;
  reason: string;
  promptCount: number;
  completedSessions: number;
  consecutiveSessionDays: number;
}) {
  posthog.capture(AnalyticsEvent.ReviewPromptSuppressed, {
    trigger: props.trigger,
    reason: props.reason,
    prompt_count: props.promptCount,
    completed_sessions: props.completedSessions,
    consecutive_session_days: props.consecutiveSessionDays,
  });
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
