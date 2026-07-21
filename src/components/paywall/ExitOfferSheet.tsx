import { Modal } from 'react-native';
import { usePaywall } from '../../hooks/usePaywall';
import { PaywallPlacement } from '../../services/paywall';
import { ExitOfferContent } from './ExitOfferContent';

interface ExitOfferSheetProps {
  visible: boolean;
  sourceScreen: string;
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

  const purchase = async () => {
    const result = await paywall.purchaseSelectedPackage();
    if (result.status === 'purchased' && result.isPro) {
      onPurchased();
    }
  };

  const restore = async () => {
    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      onRestored();
    }
  };

  const decline = () => {
    if (isBusy) return;
    paywall.trackDismissed();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={decline}
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
        onDecline={decline}
      />
    </Modal>
  );
}
