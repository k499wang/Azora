import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { OnboardingPaywallPreviewScreenProps } from '../app/navigation/types';
import OnboardingPaywallScreen from '../components/onboarding/screens/OnboardingPaywallScreen';
import { onboardingPresetFor } from '../lib/onboardingPreset';
import { computeMindMap } from '../lib/onboardingScores';
import { colors } from '../theme/colors';
import type { PaywallOffering, PaywallPackageId } from '../services/paywall';

const PREVIEW_OFFERING: PaywallOffering = {
  offeringIdentifier: 'onboarding_paywall_preview',
  experimentId: null,
  experimentVariant: null,
  paywallMode: 'soft',
  paywallLayout: 'long',
  benefitsTitle: null,
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
      billingPeriod: 'year',
      trialLabel: '7-day free trial',
      trialDays: 7,
      introOffer: null,
      isRecommended: true,
    },
    {
      id: 'monthly',
      packageIdentifier: 'preview_monthly',
      productIdentifier: 'preview_monthly',
      title: 'Monthly',
      priceString: '$9.99',
      priceCents: 999,
      pricePerMonthString: '$9.99',
      currencyCode: 'USD',
      subscriptionPeriod: 'P1M',
      billingPeriod: 'month',
      trialLabel: null,
      trialDays: null,
      introOffer: { priceString: '$5.99', days: 30 },
      isRecommended: false,
    },
  ],
};

const PREVIEW_SCORES = computeMindMap({
  stressLevel: 7,
  sleepQuality: 4,
  agreementResponses: { exhausted: 'agree', racing: 'agree', reactive: 'agree' },
}).scores;

/** The real long paywall with sample plan data and no purchase actions. */
export default function OnboardingPaywallPreviewScreen({ navigation, route }: OnboardingPaywallPreviewScreenProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<PaywallPackageId>('annual');
  const previewOnly = () => Alert.alert('Preview only', 'Purchases are unavailable in this preview.');

  return (
    <View style={styles.screen}>
      <OnboardingPaywallScreen
        preview
        initialStep={route.params.initialStep}
        offering={{ ...PREVIEW_OFFERING, paywallLayout: route.params.layout }}
        planIntent="stress_relief"
        planPreset={onboardingPresetFor('stress_relief')}
        selectedIntents={['stress_relief']}
        goalPhrase="feel calmer on the hard days"
        scores={PREVIEW_SCORES}
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
  screen: { flex: 1, backgroundColor: colors.background.canvas },
});
