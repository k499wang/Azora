import { useEffect, useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import { posthog } from '../config/posthog';
import { AnalyticsEvent } from '../services/analytics/events';
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
import { syncRevenueCatIdentity } from '../services/subscriptions/revenueCatClient';
import { useAuthStore } from '../stores/authStore';

interface UsePaywallOptions {
  placement: PaywallPlacementValue;
  sourceScreen?: string;
  enabled?: boolean;
}

export function usePaywall({
  placement,
  sourceScreen,
  enabled = true,
}: UsePaywallOptions) {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;
  const [offering, setOffering] = useState<PaywallOffering | null>(null);
  const [revenueCatPackages, setRevenueCatPackages] = useState<
    Record<PaywallPackageId, PurchasesPackage | null>
  >({ weekly: null, annual: null });
  const [selectedPackageId, setSelectedPackageId] =
    useState<PaywallPackageId>('annual');
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!enabled) {
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    if (userId == null) {
      setOffering(null);
      setRevenueCatPackages({ weekly: null, annual: null });
      setErrorMessage('Sign in to view subscription options.');
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    setErrorMessage(null);

    syncRevenueCatIdentity({ id: userId, email: userEmail })
      .then(() => getPaywallOffering(placement))
      .then((result) => {
        if (!isActive) return;
        setOffering(result.offering);
        setRevenueCatPackages(result.revenueCatPackages);

        if (result.offering == null) {
          setErrorMessage('Subscription options are unavailable right now.');
          return;
        }

        posthog.capture(
          AnalyticsEvent.PaywallViewed,
          buildPaywallEventProperties({
            placement,
            sourceScreen,
            offeringIdentifier: result.offering.offeringIdentifier,
            packages: result.offering.packages,
          }),
        );
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Subscription options are unavailable right now.',
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [enabled, placement, sourceScreen, userEmail, userId]);

  const purchaseSelectedPackage = async (): Promise<PaywallResult> => {
    const selectedPackage = revenueCatPackages[selectedPackageId];
    setIsPurchasing(true);
    setErrorMessage(null);

    posthog.capture(AnalyticsEvent.PaywallPurchaseStarted, {
      ...buildPaywallEventProperties({
        placement,
        sourceScreen,
        offeringIdentifier: offering?.offeringIdentifier ?? null,
        packages: offering?.packages,
      }),
      package_type: selectedPackageId,
    });

    const result = await purchasePaywallPackage(selectedPackage);
    setIsPurchasing(false);

    if (result.status === 'purchased') {
      if (!result.isPro) {
        setErrorMessage('Purchase completed, but Pro access was not activated yet. Please try restoring purchases.');
      }

      posthog.capture(AnalyticsEvent.PaywallPurchaseCompleted, {
        ...buildPaywallEventProperties({
          placement,
          sourceScreen,
          offeringIdentifier: offering?.offeringIdentifier ?? null,
          packages: offering?.packages,
        }),
        package_type: selectedPackageId,
        is_pro: result.isPro,
      });
      return result;
    }

    if (result.status === 'cancelled') {
      posthog.capture(AnalyticsEvent.PaywallPurchaseCancelled, {
        ...buildPaywallEventProperties({
          placement,
          sourceScreen,
          offeringIdentifier: offering?.offeringIdentifier ?? null,
          packages: offering?.packages,
        }),
        package_type: selectedPackageId,
        cancel_reason: 'store_cancelled',
      });
      return result;
    }

    if (result.status === 'failed') {
      setErrorMessage(result.message);
      posthog.capture(AnalyticsEvent.PaywallFailed, {
        ...buildPaywallEventProperties({
          placement,
          sourceScreen,
          offeringIdentifier: offering?.offeringIdentifier ?? null,
          packages: offering?.packages,
        }),
        error_code: result.errorCode,
        error_message: result.message,
      });
      return result;
    }

    if (result.status === 'not_presented') {
      setErrorMessage(getNotPresentedMessage(result.reason));
    }

    return result;
  };

  const restorePurchases = async (): Promise<PaywallResult> => {
    setIsRestoring(true);
    setErrorMessage(null);

    posthog.capture(
      AnalyticsEvent.PaywallRestoreStarted,
      buildPaywallEventProperties({
        placement,
        sourceScreen,
        offeringIdentifier: offering?.offeringIdentifier ?? null,
        packages: offering?.packages,
      }),
    );

    const result = await restorePaywallPurchases();
    setIsRestoring(false);

    if (result.status === 'restored') {
      posthog.capture(AnalyticsEvent.PaywallRestoreCompleted, {
        ...buildPaywallEventProperties({
          placement,
          sourceScreen,
          offeringIdentifier: offering?.offeringIdentifier ?? null,
          packages: offering?.packages,
        }),
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
        ...buildPaywallEventProperties({
          placement,
          sourceScreen,
          offeringIdentifier: offering?.offeringIdentifier ?? null,
          packages: offering?.packages,
        }),
        error_code: result.errorCode,
        error_message: result.message,
      });
    }

    if (result.status === 'not_presented') {
      setErrorMessage(getNotPresentedMessage(result.reason));
    }

    return result;
  };

  const trackDismissed = () => {
    posthog.capture(
      AnalyticsEvent.PaywallDismissed,
      buildPaywallEventProperties({
        placement,
        sourceScreen,
        offeringIdentifier: offering?.offeringIdentifier ?? null,
        packages: offering?.packages,
      }),
    );
  };

  return {
    offering,
    selectedPackageId,
    isLoading,
    isPurchasing,
    isRestoring,
    errorMessage,
    setSelectedPackageId,
    purchaseSelectedPackage,
    restorePurchases,
    trackDismissed,
  };
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
