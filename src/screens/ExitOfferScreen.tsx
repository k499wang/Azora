import { useCallback, useEffect, useRef } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { PaywallPlacement } from '../services/paywall';
import { ExitOfferContent } from '../components/paywall/ExitOfferContent';
import type { ExitOfferScreenProps } from '../app/navigation';

export function ExitOfferScreen({ navigation }: ExitOfferScreenProps) {
  const paywall = usePaywall({
    placement: PaywallPlacement.ExitDiscount,
    sourceScreen: 'exit_offer',
    sourceAction: 'onboarding_exit',
  });
  const anchorPaywall = usePaywall({
    placement: PaywallPlacement.ProfileUpgrade,
    sourceScreen: 'exit_offer_anchor',
  });

  const allowDismissRef = useRef(false);

  const isWaitingForAnchorPricing =
    paywall.offering != null &&
    anchorPaywall.offering == null &&
    anchorPaywall.isLoading;
  const isBusy =
    isWaitingForAnchorPricing ||
    paywall.isLoading ||
    paywall.isPurchasing ||
    paywall.isRestoring;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isBusy });
    return () => {
      navigation.setOptions({ gestureEnabled: true });
    };
  }, [isBusy, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowDismissRef.current) return;

      if (isBusy) {
        event.preventDefault();
        return;
      }

      paywall.trackDismissed();
    });

    return unsubscribe;
  }, [isBusy, navigation, paywall]);

  const purchase = useCallback(async () => {
    const result = await paywall.purchaseSelectedPackage();
    if (result.status === 'purchased' && result.isPro) {
      allowDismissRef.current = true;
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const restore = useCallback(async () => {
    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      allowDismissRef.current = true;
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const decline = useCallback(() => {
    if (isBusy) return;
    paywall.trackDismissed();
    allowDismissRef.current = true;
    navigation.goBack();
  }, [isBusy, navigation, paywall]);

  return (
    <ExitOfferContent
      paywall={paywall}
      anchorPaywall={anchorPaywall}
      onPurchase={() => {
        void purchase();
      }}
      onRestore={() => {
        void restore();
      }}
      onDecline={decline}
    />
  );
}
