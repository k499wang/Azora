import { useEffect, useMemo } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useTodayLocalDate } from './useTodayLocalDate';
import { useAuthStore } from '../stores/authStore';
import { usePaywallSeenStore } from '../stores/paywallSeenStore';
import { useNotificationPreferencesQuery } from '../queries/notifications/useNotificationPreferencesQuery';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { useProgramEnrollmentQuery } from '../queries/program/useProgramEnrollmentQuery';
import { useSavedOnboardingProfileQuery } from '../queries/profile/useSavedOnboardingProfileQuery';
import { useTrialRecapQuery } from '../queries/notifications/useTrialRecapQuery';
import { ONBOARDING_INTENT_LOOKUP_OPTIONS } from '../components/onboarding/data/intentOptions';
import { buildIntentTitleLookup, resolvePlanIntent } from '../lib/planProgress';
import {
  cancelStoredNotifications,
  reconcileScheduledNotifications,
} from '../services/notifications/notificationScheduler';
import { dailyReminderDefinitionsFor } from '../services/notifications/notificationCatalog';

const INTENT_TITLES = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);

export function useNotificationBootstrap() {
  // Refill the rolling window even when the app stays open across midnight.
  const todayLocalDate = useTodayLocalDate();
  const authStatus = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const paywallSeenAt = usePaywallSeenStore((state) => state.lastSeenAt);
  const preferencesQuery = useNotificationPreferencesQuery(userId);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(userId);
  const entitlementQuery = useUserEntitlementQuery(userId);
  const enrollmentQuery = useProgramEnrollmentQuery(userId);
  const savedProfileQuery = useSavedOnboardingProfileQuery(
    userId,
    authStatus === 'signed_in',
  );

  const trialEndsAt = entitlementQuery.data?.trialEndsAt ?? null;
  const willRenew = entitlementQuery.data?.willRenew ?? null;
  const reminderTrialEndsAt =
    preferencesQuery.data?.trialEndingReminder.enabled === true && willRenew !== false ? trialEndsAt : null;
  const trialRecapQuery = useTrialRecapQuery(userId, reminderTrialEndsAt);
  const trialRecap = trialRecapQuery.data ?? null;
  const isTrialRecapLoading = trialRecapQuery.isLoading;
  const refetchTrialRecap = trialRecapQuery.refetch;

  const enrollment = enrollmentQuery.data ?? null;
  // A loaded empty entitlement is a user who never paid; a pending or failed
  // lookup stays unknown so nudges are never booked for someone already Pro.
  const isPro = entitlementQuery.isSuccess ? entitlementQuery.data?.isPro === true : null;

  // Metadata only personalizes copy; the main reminder can use generic wording
  // while enrollment or profile is unavailable.
  const planIntent = resolvePlanIntent(savedProfileQuery.data?.onboardingGoal, INTENT_TITLES);
  const dailyReminderDefinitions = useMemo(
    () => dailyReminderDefinitionsFor(planIntent, enrollment?.planId),
    [planIntent, enrollment?.planId],
  );

  useEffect(() => {
    if (authStatus !== 'signed_out') return;

    cancelStoredNotifications().catch((error) => {
      console.warn('[notifications] cancel on sign-out failed', error);
    });
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== 'signed_in' || userId == null) return;
    if (preferencesQuery.data == null) return;
    if (dailyPlanScheduleQuery.data == null) return;
    if (isTrialRecapLoading) return;

    let isDisposed = false;

    const reconcile = async () => {
      if (
        isDisposed ||
        preferencesQuery.data == null ||
        dailyPlanScheduleQuery.data == null
      ) return;

      try {
        await reconcileScheduledNotifications({
          preferences: preferencesQuery.data,
          dailyPlanSchedule: dailyPlanScheduleQuery.data,
          trialEndsAt,
          willRenew,
          trialRecap,
          trialGoal: planIntent,
          isPro,
          paywallSeenAt,
          dailyReminderDefinitions,
        });
      } catch (error) {
        console.warn('[notifications] reconcile failed', error);
      }
    };

    void reconcile();

    let current: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      const cameToForeground = current !== 'active' && next === 'active';
      current = next;

      if (cameToForeground) {
        void reconcile();
      }
      // A session just ended or another device may have added to the counts. New
      // counts rerun this effect, which reschedules with the new body.
      if (reminderTrialEndsAt != null && (cameToForeground || next === 'background')) {
        void refetchTrialRecap();
      }
    });

    return () => {
      isDisposed = true;
      subscription.remove();
    };
  }, [
    authStatus,
    dailyPlanScheduleQuery.data,
    dailyReminderDefinitions,
    isPro,
    isTrialRecapLoading,
    paywallSeenAt,
    planIntent,
    preferencesQuery.data,
    refetchTrialRecap,
    reminderTrialEndsAt,
    todayLocalDate,
    trialEndsAt,
    trialRecap,
    willRenew,
    userId,
  ]);
}
