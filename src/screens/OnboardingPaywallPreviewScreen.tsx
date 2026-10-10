import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { OnboardingPaywallPreviewScreenProps } from '../app/navigation/types';
import OnboardingPaywallScreen from '../components/onboarding/screens/OnboardingPaywallScreen';
import { onboardingPresetFor } from '../lib/onboardingPreset';
import type { PaywallOffering, PaywallPackageId } from '../services/paywall';

const PREVIEW_OFFERING: PaywallOffering = {
  offeringIdentifier: 'onboarding_paywall_preview',
  experimentId: null,
  experimentVariant: null,
  paywallMode: 'soft',
  paywallLayout: 'deck',
  packages: [
    {
      id: 'annual',
      packageIdentifier: 'preview_annual',
      productIdentifier: 'preview_annual',
      title: 'Annual',
      priceString: '$39.99',
      priceCents: 3999,
      pricePerMonthString: '$3.33',
      currencyCode: 'USD',
      subscriptionPeriod: 'P1Y',
      trialLabel: '7-day free trial',
      isRecommended: true,
    },
    {
      id: 'weekly',
      packageIdentifier: 'preview_weekly',
      productIdentifier: 'preview_weekly',
      title: 'Weekly',
      priceString: '$4.99',
      priceCents: 499,
      pricePerMonthString: null,
      currencyCode: 'USD',
      subscriptionPeriod: 'P1W',
      trialLabel: null,
      isRecommended: false,
    },
  ],
};

/** The real paywall deck with sample prices and no purchase actions. */
export default function OnboardingPaywallPreviewScreen({ navigation }: OnboardingPaywallPreviewScreenProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<PaywallPackageId>('annual');
  const previewOnly = () => Alert.alert('Preview only', 'Purchases are unavailable in this preview.');

  return (
    <View style={styles.screen}>
      <OnboardingPaywallScreen
        preview
        offering={PREVIEW_OFFERING}
        planIntent="stress_relief"
        planPreset={onboardingPresetFor('stress_relief')}
        selectedIntents={['stress_relief']}
        paywallMode="soft"
        name="Alex"
        selectedPackageId={selectedPackageId}
        stepIndex={1}
        stepCount={1}
        isLoading={false}
        isPurchasing={false}
        isRestoring={false}
        isCompleting={false}
        errorMessage={null}
        onSelectPackage={setSelectedPackageId}
        onPurchase={previewOnly}
        onOfferPurchased={previewOnly}
        onRestore={previewOnly}
        onRetry={previewOnly}
        onContinueWithoutPro={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
