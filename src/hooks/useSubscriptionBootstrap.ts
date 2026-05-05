import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { refreshRevenueCatCustomerInfoForCurrentUser } from '../services/subscriptions/revenueCatIdentitySync';
import { getUserEntitlementQueryKey } from '../queries/subscriptions/useUserEntitlementQuery';

export function useSubscriptionBootstrap() {
  const queryClient = useQueryClient();
  const authStatus = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id ?? null);

  useEffect(() => {
    if (authStatus !== 'signed_in' || userId == null) {
      return;
    }

    let isDisposed = false;

    const refreshSubscriptionState = async () => {
      await refreshRevenueCatCustomerInfoForCurrentUser();
      if (!isDisposed) {
        await queryClient.invalidateQueries({
          queryKey: getUserEntitlementQueryKey(userId),
        });
      }
    };

    void refreshSubscriptionState();

    let current: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      const cameToForeground = current !== 'active' && next === 'active';
      current = next;

      if (cameToForeground) {
        void refreshSubscriptionState();
      }
    });

    return () => {
      isDisposed = true;
      subscription.remove();
    };
  }, [authStatus, queryClient, userId]);
}
