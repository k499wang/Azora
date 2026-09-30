import { useCallback, useEffect, useRef } from 'react';
import type { RootStackScreenProps } from '../app/navigation';
import OnboardingPaywallScreen from '../components/onboarding/screens/OnboardingPaywallScreen';
import { usePaywall } from '../hooks/usePaywall';
import { enrolledOrGoalPreset } from '../lib/onboardingPreset';
import { PaywallPlacement } from '../services/paywall';
import type { PaywallPackageId } from '../services/paywall';

const FALLBACK_PRESET = enrolledOrGoalPreset(undefined, 'other');

export function ProPaywallScreen({ navigation, route }: RootStackScreenProps<'ProPaywall'>) {
  const isBlocking = route.params?.isBlocking === true;
  const paywall = usePaywall({
    placement: route.params?.placement ?? PaywallPlacement.ProfileUpgrade,
    feature: route.params?.feature,
    sourceScreen: route.params?.sourceScreen,
    sourceAction: route.params?.sourceAction,
  });
  const allowDismissRef = useRef(false);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isBlocking });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [isBlocking, navigation]);

  useEffect(() => {
    if (!isBlocking) return;
    return navigation.addListener('beforeRemove', (event) => {
      if (!allowDismissRef.current) event.preventDefault();
    });
  }, [isBlocking, navigation]);

  const finishPurchase = useCallback(() => {
    allowDismissRef.current = true;
    navigation.goBack();
  }, [navigation]);

  const purchaseSelectedPackage = useCallback(async (packageId: PaywallPackageId) => {
    paywall.selectPackage(packageId);
    const result = await paywall.purchaseSelectedPackage(packageId);
    if (result.status === 'purchased' && result.isPro) finishPurchase();
  }, [finishPurchase, paywall]);

  const restorePurchases = useCallback(async () => {
    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) finishPurchase();
  }, [finishPurchase, paywall]);

  const continueWithoutPro = useCallback(() => {
    if (isBlocking || paywall.isLoading || paywall.isPurchasing || paywall.isRestoring) return;
    paywall.trackDismissed();
    navigation.goBack();
  }, [isBlocking, navigation, paywall]);

  return (
    <OnboardingPaywallScreen
      initialStep="plan"
      offering={paywall.offering}
      planIntent="other"
      planPreset={FALLBACK_PRESET}
      primarySessionMinutes={5}
      paywallMode={isBlocking ? 'hard' : paywall.offering?.paywallMode ?? 'soft'}
      selectedPackageId={paywall.selectedPackageId}
      stepIndex={0}
      stepCount={1}
      isLoading={paywall.isLoading}
      isPurchasing={paywall.isPurchasing}
      isRestoring={paywall.isRestoring}
      isCompleting={false}
      errorMessage={paywall.errorMessage}
      onSelectPackage={paywall.selectPackage}
      onPurchase={purchaseSelectedPackage}
      onOfferPurchased={finishPurchase}
      onRestore={restorePurchases}
      onRetry={() => { void paywall.retryRevenueCatSync(); }}
      onContinueWithoutPro={isBlocking ? undefined : continueWithoutPro}
    />
  );
}
