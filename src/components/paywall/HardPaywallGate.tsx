import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePaywall } from '../../hooks/usePaywall';
import { PaywallPlacement } from '../../services/paywall';
import OnboardingPaywallScreen from '../onboarding/screens/OnboardingPaywallScreen';
import ExitOfferSheet from './ExitOfferSheet';
import { colors } from '../../theme/colors';

const EXIT_OFFER_IDLE_MS = 20_000;

// Blocking paywall over Home for signed-in, onboarded users without an active
// entitlement while paywall_mode is hard — lapsed trials/subscriptions and
// legacy freemium users alike. No decline affordance: purchase and restore are
// the only ways through. A successful purchase/restore flips the entitlement
// query upstream, which unmounts the gate.
export function HardPaywallGate() {
  const paywall = usePaywall({
    placement: PaywallPlacement.ProfileUpgrade,
    sourceScreen: 'hard_paywall_gate',
    sourceAction: 'app_boot',
  });
  const [isExitOfferVisible, setIsExitOfferVisible] = useState(false);
  const [hasReachedPlanStep, setHasReachedPlanStep] = useState(false);
  const hasAutoShownExitOfferRef = useRef(false);

  const purchase = async () => {
    const result = await paywall.purchaseSelectedPackage();

    // Cancelling the store sheet is exit intent — counter with the offer.
    if (result.status === 'cancelled' && !hasAutoShownExitOfferRef.current) {
      hasAutoShownExitOfferRef.current = true;
      setIsExitOfferVisible(true);
    }
  };

  useEffect(() => {
    // Same idle trigger as the onboarding hard paywall: lingering on the plan
    // step without acting is exit intent. The countdown never runs while a
    // purchase/restore is in flight and restarts from zero when it ends.
    if (!hasReachedPlanStep) return;
    if (hasAutoShownExitOfferRef.current || isExitOfferVisible) return;
    if (paywall.isPurchasing || paywall.isRestoring) return;

    const id = setTimeout(() => {
      hasAutoShownExitOfferRef.current = true;
      setIsExitOfferVisible(true);
    }, EXIT_OFFER_IDLE_MS);
    return () => clearTimeout(id);
  }, [
    hasReachedPlanStep,
    isExitOfferVisible,
    paywall.isPurchasing,
    paywall.isRestoring,
  ]);

  return (
    <View style={styles.overlay}>
      <OnboardingPaywallScreen
        offering={paywall.offering}
        selectedPackageId={paywall.selectedPackageId}
        stepIndex={100}
        stepCount={100}
        isLoading={paywall.isLoading}
        isPurchasing={paywall.isPurchasing}
        isRestoring={paywall.isRestoring}
        isCompleting={false}
        errorMessage={paywall.errorMessage}
        onSelectPackage={paywall.selectPackage}
        onPurchase={() => {
          void purchase();
        }}
        onRestore={() => {
          void paywall.restorePurchases();
        }}
        onRetry={() => {
          void paywall.retryRevenueCatSync();
        }}
        onFinalStepReached={() => setHasReachedPlanStep(true)}
      />
      <ExitOfferSheet
        visible={isExitOfferVisible}
        sourceScreen="hard_paywall_gate_exit_offer"
        onPurchased={() => setIsExitOfferVisible(false)}
        onRestored={() => setIsExitOfferVisible(false)}
        onDismiss={() => setIsExitOfferVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.primary,
  },
});
