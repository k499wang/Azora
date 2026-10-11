import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useRevenueCatIdentityStore } from '../stores/revenueCatIdentityStore';
import type { CustomerInfo } from 'react-native-purchases';
import {
  getCurrentRevenueCatAppUserId,
  subscribeToRevenueCatCustomerInfo,
} from '../services/subscriptions/revenueCatClient';
import { refreshRevenueCatCustomerInfoForCurrentUser } from '../services/subscriptions/revenueCatIdentitySync';
import {
  getUserEntitlementQueryKey,
  publishRevenueCatEntitlement,
} from '../queries/subscriptions/entitlementCache';

export function useSubscriptionBootstrap() {
  const queryClient = useQueryClient();
  const authStatus = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id ?? null);

  useEffect(() => {
    if (authStatus !== 'signed_in' || userId == null) {
      return;
    }

    let isDisposed = false;
    const isCurrentUser = () =>
      !isDisposed &&
      useAuthStore.getState().user?.id === userId &&
      getCurrentRevenueCatAppUserId() === userId;

    const updateSubscriptionState = async (customerInfo: CustomerInfo | null) => {
      if (isDisposed || useAuthStore.getState().user?.id !== userId) return;
      if (customerInfo != null) {
        const published = await publishRevenueCatEntitlement(
          queryClient, userId, customerInfo, isCurrentUser,
        );
        if (published) return;
      }
      if (!isDisposed && useAuthStore.getState().user?.id === userId) {
        void queryClient.invalidateQueries({
          queryKey: getUserEntitlementQueryKey(userId),
          exact: true,
        });
      }
    };

    const unsubscribe = subscribeToRevenueCatCustomerInfo((customerInfo) => {
      const identity = useRevenueCatIdentityStore.getState();
      if (identity.status !== 'synced' || identity.appUserId !== userId || !isCurrentUser()) {
        return;
      }
      void updateSubscriptionState(customerInfo);
    });

    const refreshSubscriptionState = async () => {
      const customerInfo = await refreshRevenueCatCustomerInfoForCurrentUser();
      await updateSubscriptionState(customerInfo);
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
      unsubscribe();
      subscription.remove();
    };
  }, [authStatus, queryClient, userId]);
}
