import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useNotificationPreferencesQuery } from '../queries/notifications/useNotificationPreferencesQuery';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import {
  cancelStoredNotifications,
  reconcileScheduledNotifications,
} from '../services/notifications/notificationScheduler';

export function useNotificationBootstrap() {
  const authStatus = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const preferencesQuery = useNotificationPreferencesQuery(userId);
  const entitlementQuery = useUserEntitlementQuery(userId);

  useEffect(() => {
    if (authStatus !== 'signed_out') return;

    cancelStoredNotifications().catch((error) => {
      console.warn('[notifications] cancel on sign-out failed', error);
    });
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== 'signed_in' || userId == null) return;
    if (preferencesQuery.data == null) return;

    let isDisposed = false;

    const reconcile = async () => {
      if (isDisposed || preferencesQuery.data == null) return;

      try {
        await reconcileScheduledNotifications({
          preferences: preferencesQuery.data,
          trialEndsAt: entitlementQuery.data?.trialEndsAt ?? null,
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
    entitlementQuery.data?.trialEndsAt,
    preferencesQuery.data,
    userId,
  ]);
}
