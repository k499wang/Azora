import { useEffect, useRef } from 'react';
import { Modal } from 'react-native';
import { usePaywall } from '../../hooks/usePaywall';
import { PaywallPlacement } from '../../services/paywall';
import {
  trackExitOfferAccepted,
  trackExitOfferDeclined,
  trackExitOfferShown,
  type ExitOfferDeclineMethod,
  type ExitOfferTrigger,
} from '../../services/analytics/exitOffer';
import { ExitOfferContent, confirmExitOffer } from './ExitOfferContent';

interface ExitOfferSheetProps {
  visible: boolean;
  sourceScreen: string;
  /** which exit intent summoned it; the offer is identical, the user is not */
  trigger: ExitOfferTrigger;
  onPurchased: () => void;
  onRestored: () => void;
  onDismiss: () => void;
}

// Hard-paywall exit offer: slides up over a blocking paywall when the user
// shows exit intent (cancels the store sheet or idles on the plan step).
// Dismissing it returns to the paywall — never into the app.
export default function ExitOfferSheet({
  visible,
  sourceScreen,
  trigger,
  onPurchased,
  onRestored,
  onDismiss,
}: ExitOfferSheetProps) {
  const paywall = usePaywall({
    placement: PaywallPlacement.ExitDiscount,
    sourceScreen,
    sourceAction: 'hard_paywall_exit_intent',
    enabled: visible,
  });
  const anchorPaywall = usePaywall({
    placement: PaywallPlacement.ProfileUpgrade,
    sourceScreen: `${sourceScreen}_anchor`,
    enabled: visible,
  });

  const isBusy = paywall.isLoading || paywall.isPurchasing || paywall.isRestoring;

  // Once per presentation. `visible` can flip back on for a second exit intent
  // in the same session, and that is a second showing.
  const shownRef = useRef(false);
  useEffect(() => {
    if (!visible) {
      shownRef.current = false;
      return;
    }
    if (!paywall.isEventMetadataReady || shownRef.current) return;
    shownRef.current = true;
    trackExitOfferShown(paywall.trackEvent, trigger);
  }, [
    paywall.isEventMetadataReady,
    paywall.trackEvent,
    trigger,
    visible,
  ]);

  const purchase = async () => {
    const result = await paywall.purchaseSelectedPackage();
    if (result.status === 'purchased' && result.isPro) {
      if (paywall.isEventMetadataReady) {
        trackExitOfferAccepted(paywall.trackEvent, trigger, 'purchased');
      }
      onPurchased();
    }
  };

  const restore = async () => {
    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      if (paywall.isEventMetadataReady) {
        trackExitOfferAccepted(paywall.trackEvent, trigger, 'restored');
      }
      onRestored();
    }
  };

  const decline = (method: ExitOfferDeclineMethod = 'button') => {
    if (isBusy) return;
    if (paywall.isEventMetadataReady) {
      trackExitOfferDeclined(paywall.trackEvent, trigger, method);
    }
    paywall.trackDismissed();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (isBusy) return;
        confirmExitOffer(() => decline('system_close'));
      }}
      onDismiss={onDismiss}
    >
      <ExitOfferContent
        paywall={paywall}
        anchorPaywall={anchorPaywall}
        onPurchase={() => {
          void purchase();
        }}
        onRestore={() => {
          void restore();
        }}
        onDecline={() => decline('button')}
      />
    </Modal>
  );
}
