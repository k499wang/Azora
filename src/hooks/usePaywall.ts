import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PurchasesPackage } from 'react-native-purchases';
import { posthog } from '../config/posthog';
import { AnalyticsEvent } from '../services/analytics/events';
import { logRevenueCatDebugSnapshot } from '../services/debug/revenueCatDebugSnapshot';
import { syncAppsFlyerIdentityForUser } from '../services/attribution/appsFlyerIdentitySync';
import { logAppsFlyerEvent } from '../services/attribution/appsFlyerClient';
import {
  buildPaywallEventProperties,
  getPaywallOffering,
  purchasePaywallPackage,
  restorePaywallPurchases,
  type PaywallOffering,
  type PaywallPackageId,
  type PaywallPlacementValue,
  type PaywallResult,
} from '../services/paywall';
import { ensureRevenueCatIdentityForCurrentUser } from '../services/subscriptions/revenueCatIdentitySync';
import type { FeatureKeyValue } from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import { useRevenueCatIdentityStore } from '../stores/revenueCatIdentityStore';
import { getUserEntitlementQueryKey } from '../queries/subscriptions/useUserEntitlementQuery';

interface UsePaywallOptions {
  placement: PaywallPlacementValue;
  feature?: FeatureKeyValue;
  sourceScreen?: string;
  sourceAction?: string;
  enabled?: boolean;
}

export function usePaywall({
  placement,
  feature,
  sourceScreen,
  sourceAction,
  enabled = true,
}: UsePaywallOptions) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const revenueCatStatus = useRevenueCatIdentityStore((state) => state.status);
  const revenueCatAppUserId = useRevenueCatIdentityStore((state) => state.appUserId);
  const revenueCatLastError = useRevenueCatIdentityStore((state) => state.lastErrorMessage);
  const revenueCatUnavailableReason = useRevenueCatIdentityStore(
    (state) => state.lastUnavailableReason,
  );
  const [offering, setOffering] = useState<PaywallOffering | null>(null);
  const [revenueCatPackages, setRevenueCatPackages] = useState<
    Record<PaywallPackageId, PurchasesPackage | null>
  >({ weekly: null, annual: null });
  const [selectedPackageId, setSelectedPackageId] =
    useState<PaywallPackageId>('annual');
  const [paywallViewId, setPaywallViewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const buildCurrentPaywallEventProperties = (options?: {
    paywallViewId?: string | null;
    offering?: PaywallOffering | null;
  }) =>
    buildPaywallEventProperties({
      placement,
      feature,
      sourceScreen,
      sourceAction,
      paywallViewId: options?.paywallViewId ?? paywallViewId,
      offeringIdentifier:
        options?.offering?.offeringIdentifier ??
        offering?.offeringIdentifier ??
        null,
      experimentId:
        options?.offering?.experimentId ??
        offering?.experimentId ??
        null,
      experimentVariant:
        options?.offering?.experimentVariant ??
        offering?.experimentVariant ??
        null,
      packages: options?.offering?.packages ?? offering?.packages,
    });

  useEffect(() => {
    let isActive = true;

    if (!enabled) {
      setIsLoading(false);
      setPaywallViewId(null);
      return () => {
        isActive = false;
      };
    }

    logRevenueCatDebugSnapshot('paywall_load_started');

    if (userId == null) {
      setOffering(null);
      setRevenueCatPackages({ weekly: null, annual: null });
      setPaywallViewId(null);
      setErrorMessage('Sign in to view subscription options.');
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    setErrorMessage(null);
    setPaywallViewId(null);

    if (revenueCatStatus === 'idle' || revenueCatStatus === 'signed_out') {
      void ensureRevenueCatIdentityForCurrentUser();
      return () => {
        isActive = false;
      };
    }

    if (revenueCatStatus === 'syncing') {
      return () => {
        isActive = false;
      };
    }

    if (revenueCatStatus === 'unavailable') {
      setIsLoading(false);
      setErrorMessage(getRevenueCatUnavailableMessage(revenueCatUnavailableReason));
      return () => {
        isActive = false;
      };
    }

    if (revenueCatStatus === 'failed') {
      setIsLoading(false);
      setErrorMessage(getRevenueCatFailedMessage(revenueCatLastError));
      return () => {
        isActive = false;
      };
    }

    if (revenueCatAppUserId !== userId) {
      void ensureRevenueCatIdentityForCurrentUser();
      return () => {
        isActive = false;
      };
    }

    getPaywallOffering(placement)
      .then((result) => {
        if (!isActive) return;
        setOffering(result.offering);
        setRevenueCatPackages(result.revenueCatPackages);

        if (result.offering == null) {
          setErrorMessage('Subscription options are unavailable right now.');
          posthog.capture(AnalyticsEvent.PaywallFailed, {
            ...buildPaywallEventProperties({
              placement,
              feature,
              sourceScreen,
              sourceAction,
            }),
            stage: 'load_offering',
            error_code: 'missing_offering',
            error_message: 'Subscription options are unavailable right now.',
          });
          return;
        }

        const nextPaywallViewId = createPaywallViewId();
        setPaywallViewId(nextPaywallViewId);

        posthog.capture(
          AnalyticsEvent.PaywallViewed,
          buildPaywallEventProperties({
            placement,
            feature,
            sourceScreen,
            sourceAction,
            paywallViewId: nextPaywallViewId,
            offeringIdentifier: result.offering.offeringIdentifier,
            experimentId: result.offering.experimentId,
            experimentVariant: result.offering.experimentVariant,
            packages: result.offering.packages,
          }),
        );
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const message =
          error instanceof Error
            ? error.message
            : 'Subscription options are unavailable right now.';
        setErrorMessage(message);
        posthog.capture(AnalyticsEvent.PaywallFailed, {
          ...buildPaywallEventProperties({
            placement,
            feature,
            sourceScreen,
            sourceAction,
          }),
          stage: 'load_offering',
          error_code: 'load_offering_failed',
          error_message: message,
        });
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    enabled,
    placement,
    revenueCatAppUserId,
    revenueCatLastError,
    revenueCatStatus,
    revenueCatUnavailableReason,
    sourceAction,
    sourceScreen,
    feature,
    userId,
  ]);

  const selectPackage = (packageId: PaywallPackageId) => {
    if (packageId === selectedPackageId) {
      return;
    }

    setSelectedPackageId(packageId);
    posthog.capture(AnalyticsEvent.PaywallPackageSelected, {
      ...buildCurrentPaywallEventProperties(),
      selected_package_id: packageId,
    });
  };

  const purchaseSelectedPackage = async (): Promise<PaywallResult> => {
    const selectedPackage = revenueCatPackages[selectedPackageId];
    const selectedPackageOption =
      offering?.packages.find((pkg) => pkg.id === selectedPackageId) ?? null;
    logRevenueCatDebugSnapshot('paywall_purchase_started');
    setIsPurchasing(true);
    setErrorMessage(null);

    posthog.capture(AnalyticsEvent.PaywallPurchaseStarted, {
      ...buildCurrentPaywallEventProperties(),
      package_type: selectedPackageId,
      selected_package_id: selectedPackageId,
    });

    if (userId != null) {
      await syncAppsFlyerIdentityForUser(userId, user?.email ?? null).catch(() => {});
    }

    const result = await purchasePaywallPackage(selectedPackage);
    setIsPurchasing(false);

    if (result.status === 'purchased') {
      void queryClient.invalidateQueries({
        queryKey: getUserEntitlementQueryKey(userId),
      });

      if (!result.isPro) {
        setErrorMessage('Purchase completed, but Pro access was not activated yet. Please try restoring purchases.');
      }

      posthog.capture(AnalyticsEvent.PaywallPurchaseCompleted, {
        ...buildCurrentPaywallEventProperties(),
        package_type: selectedPackageId,
        selected_package_id: selectedPackageId,
        is_pro: result.isPro,
      });
      if (selectedPackageOption?.trialLabel != null) {
        void logAppsFlyerEvent('azora_skan_start_trial', {
          package_type: selectedPackageId,
          selected_package_id: selectedPackageId,
          product_id: selectedPackageOption.productIdentifier,
          placement,
          feature: feature ?? null,
          source_screen: sourceScreen ?? null,
          source_action: sourceAction ?? null,
          offering_id: offering?.offeringIdentifier ?? null,
          experiment_id: offering?.experimentId ?? null,
          experiment_variant: offering?.experimentVariant ?? null,
        });
      }
      return result;
    }

    if (result.status === 'cancelled') {
      posthog.capture(AnalyticsEvent.PaywallPurchaseCancelled, {
        ...buildCurrentPaywallEventProperties(),
        package_type: selectedPackageId,
        selected_package_id: selectedPackageId,
        cancel_reason: 'store_cancelled',
      });
      return result;
    }

    if (result.status === 'failed') {
      setErrorMessage(result.message);
      posthog.capture(AnalyticsEvent.PaywallFailed, {
        ...buildCurrentPaywallEventProperties(),
        stage: 'purchase',
        error_code: result.errorCode,
        error_message: result.message,
      });
      return result;
    }

    if (result.status === 'not_presented') {
      const message = getNotPresentedMessage(result.reason);
      setErrorMessage(message);
      posthog.capture(AnalyticsEvent.PaywallFailed, {
        ...buildCurrentPaywallEventProperties(),
        stage: 'purchase',
        error_code: result.reason,
        error_message: message,
      });
    }

    return result;
  };

  const restorePurchases = async (): Promise<PaywallResult> => {
    setIsRestoring(true);
    logRevenueCatDebugSnapshot('paywall_restore_started');
    setErrorMessage(null);

    posthog.capture(
      AnalyticsEvent.PaywallRestoreStarted,
      buildCurrentPaywallEventProperties(),
    );

    const result = await restorePaywallPurchases();
    setIsRestoring(false);

    if (result.status === 'restored') {
      void queryClient.invalidateQueries({
        queryKey: getUserEntitlementQueryKey(userId),
      });

      posthog.capture(AnalyticsEvent.PaywallRestoreCompleted, {
        ...buildCurrentPaywallEventProperties(),
        is_pro: result.isPro,
      });

      if (!result.isPro) {
        setErrorMessage('No active Azora Pro subscription was found.');
      }
      return result;
    }

    if (result.status === 'failed') {
      setErrorMessage(result.message);
      posthog.capture(AnalyticsEvent.PaywallFailed, {
        ...buildCurrentPaywallEventProperties(),
        stage: 'restore',
        error_code: result.errorCode,
        error_message: result.message,
      });
    }

    if (result.status === 'not_presented') {
      const message = getNotPresentedMessage(result.reason);
      setErrorMessage(message);
      posthog.capture(AnalyticsEvent.PaywallFailed, {
        ...buildCurrentPaywallEventProperties(),
        stage: 'restore',
        error_code: result.reason,
        error_message: message,
      });
    }

    return result;
  };

  const trackDismissed = () => {
    posthog.capture(
      AnalyticsEvent.PaywallDismissed,
      buildCurrentPaywallEventProperties(),
    );
  };

  const trackEvent = (
    event: string,
    extra?: Record<string, string | number | boolean | null>,
  ) => {
    posthog.capture(event, {
      ...buildCurrentPaywallEventProperties(),
      ...extra,
    });
  };

  const retryRevenueCatSync = async () => {
    logRevenueCatDebugSnapshot('paywall_revenuecat_retry_started');
    setIsLoading(true);
    setErrorMessage(null);
    await ensureRevenueCatIdentityForCurrentUser();
  };

  return {
    offering,
    selectedPackageId,
    isLoading,
    isPurchasing,
    isRestoring,
    errorMessage,
    selectPackage,
    purchaseSelectedPackage,
    restorePurchases,
    trackDismissed,
    trackEvent,
    retryRevenueCatSync,
  };
}

function createPaywallViewId(): string {
  return `paywall_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function getNotPresentedMessage(
  reason: Extract<PaywallResult, { status: 'not_presented' }>['reason'],
): string {
  if (reason === 'signed_out') {
    return 'Sign in to view subscription options.';
  }

  if (reason === 'missing_package' || reason === 'missing_offering') {
    return 'Subscription options are unavailable right now.';
  }

  return 'RevenueCat is not ready yet. Please try again in a moment.';
}

function getRevenueCatUnavailableMessage(reason: string | null): string {
  if (reason === 'missing_api_key') {
    return 'Subscription options are unavailable because this build is missing a RevenueCat API key.';
  }

  if (reason === 'unsupported_platform') {
    return 'Subscription options are unavailable on this platform.';
  }

  return 'Subscription options are unavailable right now.';
}

function getRevenueCatFailedMessage(lastErrorMessage: string | null): string {
  if (lastErrorMessage == null || lastErrorMessage.length === 0) {
    return 'Could not connect to RevenueCat. Please try again.';
  }

  return `Could not connect to RevenueCat. Please try again. (${lastErrorMessage})`;
}
