import { useState } from 'react';
import { Alert } from 'react-native';
import type { OnboardingPaywallPreviewScreenProps } from '../app/navigation';
import OnboardingPaywallScreen from '../components/onboarding/screens/OnboardingPaywallScreen';
import { onboardingPresetFor } from '../lib/onboardingPreset';
import type { PaywallOffering, PaywallPackageId } from '../services/paywall';

const SAMPLE_OFFERING: PaywallOffering = {
  offeringIdentifier: 'development_trial_preview',
  experimentId: null,
  experimentVariant: null,
  paywallMode: 'soft',
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

const SAMPLE_INTENT = 'stress_relief' as const;
const SAMPLE_PRESET = onboardingPresetFor(SAMPLE_INTENT);

/** Renders the real onboarding trial deck with sample data and no purchases. */
export default function OnboardingPaywallPreviewScreen({
  navigation,
}: OnboardingPaywallPreviewScreenProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<PaywallPackageId>('annual');
  const isDev = __DEV__;
  if (!isDev) return null;

  const showPreviewOnly = () => {
    Alert.alert('Preview only', 'Purchases and restores are disabled in this preview.');
  };

  return (
    <OnboardingPaywallScreen
      preview
      offering={SAMPLE_OFFERING}
      planIntent={SAMPLE_INTENT}
      planPreset={SAMPLE_PRESET}
      selectedIntents={[SAMPLE_INTENT]}
      primarySessionMinutes={5}
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
      onPurchase={showPreviewOnly}
      onOfferPurchased={showPreviewOnly}
      onRestore={showPreviewOnly}
      onRetry={showPreviewOnly}
      onContinueWithoutPro={() => navigation.goBack()}
    />
  );
}
