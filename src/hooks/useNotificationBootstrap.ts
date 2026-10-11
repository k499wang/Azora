import { useEffect, useMemo } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useTodayLocalDate } from './useTodayLocalDate';
import { useAuthStore } from '../stores/authStore';
import { useNotificationPreferencesQuery } from '../queries/notifications/useNotificationPreferencesQuery';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { useProgramEnrollmentQuery } from '../queries/program/useProgramEnrollmentQuery';
import { useSavedOnboardingProfileQuery } from '../queries/profile/useSavedOnboardingProfileQuery';
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
  const preferencesQuery = useNotificationPreferencesQuery(userId);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(userId);
  const entitlementQuery = useUserEntitlementQuery(userId);
  const enrollmentQuery = useProgramEnrollmentQuery(userId);
  const savedProfileQuery = useSavedOnboardingProfileQuery(
    userId,
    authStatus === 'signed_in',
  );

  const enrollment = enrollmentQuery.data ?? null;

  // Metadata only personalizes copy; the main reminder can use generic wording
  // while enrollment or profile is unavailable.
  const onboardingGoal = savedProfileQuery.data?.onboardingGoal;
  const dailyReminderDefinitions = useMemo(
    () => dailyReminderDefinitionsFor(resolvePlanIntent(onboardingGoal, INTENT_TITLES), enrollment?.planId),
    [onboardingGoal, enrollment?.planId],
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
          trialEndsAt: entitlementQuery.data?.trialEndsAt ?? null,
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
    });

    return () => {
      isDisposed = true;
      subscription.remove();
    };
  }, [
    authStatus,
    dailyPlanScheduleQuery.data,
    dailyReminderDefinitions,
    entitlementQuery.data?.trialEndsAt,
    preferencesQuery.data,
    todayLocalDate,
    userId,
  ]);
}
