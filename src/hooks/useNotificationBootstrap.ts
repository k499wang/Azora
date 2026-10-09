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
import { programDayActivityCount } from '../features/program/domain/programEnrollment';
import {
  SLOTS_WITHOUT_A_PROGRAM,
  programSlotsInUse,
} from '../features/program/domain/programSchedule';
import {
  cancelStoredNotifications,
  reconcileScheduledNotifications,
} from '../services/notifications/notificationScheduler';
import { dailyReminderDefinitionsFor } from '../services/notifications/notificationCatalog';

const INTENT_TITLES = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);

export function useNotificationBootstrap() {
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

  const todayLocalDate = useTodayLocalDate();

  /**
   * Which hours the user's day actually fills today.
   *
   * Today's day, carried by `todayLocalDate` so the count turns over with the
   * calendar rather than the instant a day is finished. Re-read on every
   * reconcile, which already runs on sign-in and on every foreground: that is
   * what lets a reminder start booking itself the day the plan grows into it,
   * without anything having to predict when that day will arrive — the plan
   * advances on completion, so nobody can.
   *
   * Memoised so the reconcile effect depends on the value, not a fresh array on
   * every render — which would re-run the whole diff far more than any of the
   * state behind it actually changed.
   */
  const enrollment = enrollmentQuery.data ?? null;
  const slotsInUse = useMemo(
    () =>
      enrollment == null
        ? SLOTS_WITHOUT_A_PROGRAM
        : programSlotsInUse(programDayActivityCount(enrollment, todayLocalDate)),
    [enrollment, todayLocalDate],
  );

  // Until the profile loads (or if it fails) the goal resolves to 'other', which
  // books the generic copy; the reconcile diff rewrites the bodies once it lands.
  const onboardingGoal = savedProfileQuery.data?.onboardingGoal;
  const dailyReminderDefinitions = useMemo(
    () => dailyReminderDefinitionsFor(resolvePlanIntent(onboardingGoal, INTENT_TITLES)),
    [onboardingGoal],
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
          slotsInUse,
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
    slotsInUse,
    userId,
  ]);
}
