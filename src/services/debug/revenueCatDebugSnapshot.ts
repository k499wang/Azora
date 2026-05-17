import type {
  CustomerInfo,
  PurchasesEntitlementInfo,
  PurchasesSubscriptionInfo,
} from 'react-native-purchases';
import { useAuthStore } from '../../stores/authStore';
import { useRevenueCatIdentityStore } from '../../stores/revenueCatIdentityStore';
import {
  getCurrentRevenueCatAppUserId,
  getRevenueCatAvailability,
  isRevenueCatReady,
} from '../subscriptions/revenueCatClient';

export function getRevenueCatDebugSnapshot() {
  const auth = useAuthStore.getState();
  const revenueCatIdentity = useRevenueCatIdentityStore.getState();
  const availability = getRevenueCatAvailability();

  return {
    auth_status: auth.status,
    supabase_user_id: auth.user?.id ?? null,
    revenuecat_status: revenueCatIdentity.status,
    revenuecat_store_app_user_id: revenueCatIdentity.appUserId,
    revenuecat_current_app_user_id: getCurrentRevenueCatAppUserId(),
    revenuecat_ready: isRevenueCatReady(),
    revenuecat_availability: availability.status,
    revenuecat_unavailable_reason:
      availability.status === 'unavailable' ? availability.reason : null,
    revenuecat_last_error: revenueCatIdentity.lastErrorMessage,
    revenuecat_last_synced_at: revenueCatIdentity.lastSyncedAt,
  };
}

export function logRevenueCatPaywallOfferingSnapshot(
  label: string,
  payload: Record<string, unknown>,
): void {
  if (!(typeof __DEV__ !== 'undefined' && __DEV__)) {
    return;
  }

  console.log(`[revenuecat-debug] ${label}`, {
    timestamp: new Date().toISOString(),
    ...getRevenueCatDebugSnapshot(),
    ...payload,
  });
}

export function logRevenueCatCustomerInfoSnapshot(
  label: string,
  customerInfo: CustomerInfo,
  payload: Record<string, unknown> = {},
): void {
  if (!(typeof __DEV__ !== 'undefined' && __DEV__)) {
    return;
  }

  console.log(`[revenuecat-debug] ${label}`, {
    timestamp: new Date().toISOString(),
    ...getRevenueCatDebugSnapshot(),
    ...payload,
    revenuecat_customer_original_app_user_id: customerInfo.originalAppUserId,
    revenuecat_customer_request_date: customerInfo.requestDate,
    revenuecat_customer_first_seen: customerInfo.firstSeen,
    revenuecat_management_url: customerInfo.managementURL,
    revenuecat_active_subscriptions: customerInfo.activeSubscriptions,
    revenuecat_all_purchased_product_identifiers:
      customerInfo.allPurchasedProductIdentifiers,
    revenuecat_latest_expiration_date: customerInfo.latestExpirationDate,
    revenuecat_all_entitlement_ids: Object.keys(customerInfo.entitlements.all),
    revenuecat_active_entitlement_ids: Object.keys(customerInfo.entitlements.active),
    revenuecat_entitlements: toEntitlementDebugMap(customerInfo.entitlements.all),
    revenuecat_subscriptions_by_product_identifier: toSubscriptionDebugMap(
      customerInfo.subscriptionsByProductIdentifier,
    ),
  });
}

export function logRevenueCatDebugSnapshot(label: string): void {
  if (!(typeof __DEV__ !== 'undefined' && __DEV__)) {
    return;
  }

  console.log(`[revenuecat-debug] ${label}`, getRevenueCatDebugSnapshot());
}

function toEntitlementDebugMap(entitlements: {
  [key: string]: PurchasesEntitlementInfo;
}) {
  return Object.fromEntries(
    Object.entries(entitlements).map(([id, entitlement]) => [
      id,
      {
        identifier: entitlement.identifier,
        is_active: entitlement.isActive,
        product_identifier: entitlement.productIdentifier,
        period_type: entitlement.periodType,
        store: entitlement.store,
        is_sandbox: entitlement.isSandbox,
        will_renew: entitlement.willRenew,
        expiration_date: entitlement.expirationDate,
      },
    ]),
  );
}

function toSubscriptionDebugMap(subscriptions: {
  [key: string]: PurchasesSubscriptionInfo;
}) {
  return Object.fromEntries(
    Object.entries(subscriptions).map(([productIdentifier, subscription]) => [
      productIdentifier,
      {
        product_identifier: subscription.productIdentifier,
        is_active: subscription.isActive,
        store: subscription.store,
        is_sandbox: subscription.isSandbox,
        period_type: subscription.periodType,
        will_renew: subscription.willRenew,
        purchase_date: subscription.purchaseDate,
        expires_date: subscription.expiresDate,
      },
    ]),
  );
}
