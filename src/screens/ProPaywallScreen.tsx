import { useCallback } from 'react';
import OnboardingPaywallScreen from '../components/onboarding/screens/OnboardingPaywallScreen';
import { usePaywall } from '../hooks/usePaywall';
import { PaywallPlacement } from '../services/paywall';
import type { RootStackScreenProps } from '../app/navigation';

export function ProPaywallScreen({ navigation, route }: RootStackScreenProps<'ProPaywall'>) {
  const placement = route.params?.placement ?? PaywallPlacement.ProfileUpgrade;
  const paywall = usePaywall({
    placement,
    sourceScreen: route.params?.sourceScreen,
  });
  const copy = getPaywallCopy(route.params?.feature);

  const closePaywall = useCallback(() => {
    paywall.trackDismissed();
    navigation.goBack();
  }, [navigation, paywall]);

  const purchaseSelectedPackage = useCallback(async () => {
    const result = await paywall.purchaseSelectedPackage();
    if (result.status === 'purchased' && result.isPro) {
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const restorePurchases = useCallback(async () => {
    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      navigation.goBack();
    }
  }, [navigation, paywall]);

  return (
    <OnboardingPaywallScreen
      offering={paywall.offering}
      selectedPackageId={paywall.selectedPackageId}
      stepIndex={0}
      stepCount={1}
      isLoading={paywall.isLoading}
      isPurchasing={paywall.isPurchasing}
      isRestoring={paywall.isRestoring}
      errorMessage={paywall.errorMessage}
      title={copy.title}
      subtitle={copy.subtitle}
      continueWithoutProLabel="Not now"
      onSelectPackage={paywall.setSelectedPackageId}
      onPurchase={() => {
        void purchaseSelectedPackage();
      }}
      onRestore={() => {
        void restorePurchases();
      }}
      onRetry={() => {
        void paywall.retryRevenueCatSync();
      }}
      onContinueWithoutPro={closePaywall}
    />
  );
}

function getPaywallCopy(feature: RootStackScreenProps<'ProPaywall'>['route']['params']['feature']) {
  switch (feature) {
    case 'heart_rate_measurement':
      return {
        title: 'Measure without limits',
        subtitle: 'Unlock unlimited heart-rate readings, HRV, stress, and recovery insights.',
      };
    case 'daily_exercise':
      return {
        title: 'Keep training today',
        subtitle: 'Azora Pro unlocks unlimited breath holds, guided exercises, and progress insights.',
      };
    case 'advanced_stats':
      return {
        title: 'Unlock your heart insights',
        subtitle: 'See RMSSD, HRV, stress, recovery response, and deeper trends after each session.',
      };
    case 'session_history':
      return {
        title: 'Open your full history',
        subtitle: 'Azora Pro unlocks detailed session history, graphs, and trend comparisons.',
      };
    default:
      return {
        title: 'Azora Pro',
        subtitle: 'Unlock unlimited sessions, advanced stats, and personalized progress insights.',
      };
  }
}
