import { useCallback, useEffect, useRef } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { PaywallPlacement } from '../services/paywall';
import {
  ExitOfferContent,
  confirmExitOffer,
} from '../components/paywall/ExitOfferContent';
import {
  trackExitOfferAccepted,
  trackExitOfferDeclined,
  trackExitOfferShown,
  type ExitOfferDeclineMethod,
} from '../services/analytics/exitOffer';
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
  const shownRef = useRef(false);

  const declineWith = useCallback(
    (method: ExitOfferDeclineMethod) => {
      if (paywall.isEventMetadataReady) {
        trackExitOfferDeclined(paywall.trackEvent, 'post_onboarding', method);
      }
      paywall.trackDismissed();
    },
    [paywall],
  );

  // This screen only ever exists for the queued post-onboarding offer: it is
  // navigated to once by `ExitOfferPresenter` after Home paints.
  useEffect(() => {
    if (!paywall.isEventMetadataReady || shownRef.current) return;
    shownRef.current = true;
    trackExitOfferShown(paywall.trackEvent, 'post_onboarding');
  }, [paywall.isEventMetadataReady, paywall.trackEvent]);

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

      event.preventDefault();
      if (isBusy) return;

      confirmExitOffer(() => {
        declineWith('system_close');
        allowDismissRef.current = true;
        navigation.dispatch(event.data.action);
      });
    });

    return unsubscribe;
  }, [isBusy, navigation, paywall]);

  const purchase = useCallback(async () => {
    const result = await paywall.purchaseSelectedPackage();
    if (result.status === 'purchased' && result.isPro) {
      if (paywall.isEventMetadataReady) {
        trackExitOfferAccepted(
          paywall.trackEvent,
          'post_onboarding',
          'purchased',
        );
      }
      allowDismissRef.current = true;
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const restore = useCallback(async () => {
    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      if (paywall.isEventMetadataReady) {
        trackExitOfferAccepted(
          paywall.trackEvent,
          'post_onboarding',
          'restored',
        );
      }
      allowDismissRef.current = true;
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const decline = useCallback(() => {
    if (isBusy) return;
    declineWith('button');
    allowDismissRef.current = true;
    navigation.goBack();
  }, [declineWith, isBusy, navigation]);

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
