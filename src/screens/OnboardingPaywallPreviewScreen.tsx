import { FullMotion } from '../hooks/useReducedMotionSetting';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { OnboardingPaywallPreviewScreenProps } from '../app/navigation/types';
import OnboardingPaywallScreen from '../components/onboarding/screens/OnboardingPaywallScreen';
import { onboardingPresetFor } from '../lib/onboardingPreset';
import { computeMindMap } from '../lib/onboardingScores';
import { defaultPackageId } from '../lib/paywall/singlePackage';
import { colors } from '../theme/colors';
import type { PaywallLayout, PaywallOffering, PaywallPackageId, PaywallPackageOption, PaywallPlanPicker } from '../services/paywall';
import type { PreviewPlans } from '../app/navigation/types';
import type { OnboardingIntent } from '../components/onboarding/types';

export const PREVIEW_OFFERING: PaywallOffering = {
  offeringIdentifier: 'onboarding_paywall_preview',
  experimentId: null,
  experimentVariant: null,
  paywallMode: 'soft',
  paywallLayout: 'long',
  planPicker: 'stacked',
  benefitsTitle: null,
  onlyPackageId: null,
  trialTitle: null,
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

const PREVIEW_PAID_ANNUAL_PACKAGES = PREVIEW_OFFERING.packages.map((pkg) =>
  pkg.id === 'annual'
    ? {
        ...pkg,
        priceString: '$29.99',
        priceCents: 2999,
        pricePerMonthString: '$2.50',
        trialLabel: null,
        trialDays: null,
        introOffer: { priceString: '$4.99', days: 30 },
      }
    : pkg,
);

const PREVIEW_PAID_WEEKLY: PaywallPackageOption = {
  ...PREVIEW_OFFERING.packages[1],
  packageIdentifier: 'preview_weekly',
  productIdentifier: 'preview_weekly',
  title: 'Weekly',
  priceString: '$9.99',
  priceCents: 999,
  pricePerMonthString: null,
  subscriptionPeriod: 'P1W',
  billingPeriod: 'week',
  introOffer: { priceString: '$0.99', days: 7 },
};

const PREVIEW_ANNUAL = PREVIEW_OFFERING.packages[0];
const PREVIEW_MONTHLY = PREVIEW_OFFERING.packages[1];
const NO_INTRO = { trialLabel: null, trialDays: null, introOffer: null };

export const PREVIEW_PLAN_SETS: Record<PreviewPlans, PaywallPackageOption[]> = {
  weeklyFreeTrial: [{ ...PREVIEW_PAID_WEEKLY, introOffer: null, trialLabel: '3-day free trial', trialDays: 3 }],
  annualFreeTrialWeekly: [PREVIEW_ANNUAL, { ...PREVIEW_PAID_WEEKLY, ...NO_INTRO }],
  annualFreeTrialWeeklyPaidTrial: [PREVIEW_ANNUAL, PREVIEW_PAID_WEEKLY],
  monthlyPaidTrialWeeklyFreeTrial: [
    { ...PREVIEW_MONTHLY, id: 'annual' },
    { ...PREVIEW_PAID_WEEKLY, introOffer: null, trialLabel: '3-day free trial', trialDays: 3 },
  ],
  weeklyPaidTrial: [PREVIEW_PAID_WEEKLY],
  monthlyPaidTrial: [PREVIEW_MONTHLY],
  annualPaidTrial: [PREVIEW_PAID_ANNUAL_PACKAGES[0]],
  weeklyNoTrial: [{ ...PREVIEW_PAID_WEEKLY, ...NO_INTRO }],
  monthlyNoTrial: [{ ...PREVIEW_MONTHLY, ...NO_INTRO }],
  annualNoTrial: [{ ...PREVIEW_ANNUAL, ...NO_INTRO }],
  annualWeekly: [PREVIEW_PAID_ANNUAL_PACKAGES[0], PREVIEW_PAID_WEEKLY],
  monthlyWeekly: [
    {
      ...PREVIEW_OFFERING.packages[1],
      id: 'annual',
      introOffer: { priceString: '$4.99', days: 30 },
    },
    PREVIEW_PAID_WEEKLY,
  ],
};

const PREVIEW_SCORES = computeMindMap({
  stressLevel: 7,
  sleepQuality: 4,
  agreementResponses: { exhausted: 'agree', racing: 'agree', reactive: 'agree' },
}).scores;

/** The real long paywall with sample plan data and no purchase actions. */
export default function OnboardingPaywallPreviewScreen({ navigation, route }: OnboardingPaywallPreviewScreenProps) {
  return (
    <OnboardingPaywallPreview
      layout={route.params.layout}
      initialStep={route.params.initialStep}
      cleaning={route.params.cleaning}
      onlyPackageId={route.params.onlyPackageId}
      plans={route.params.plans}
      planPicker={route.params.planPicker}
      planIntent={route.params.cleaning ? 'cleaning' : 'stress_relief'}
      goalPhrase="feel calmer on the hard days"
      onClose={() => navigation.goBack()}
    />
  );
}

interface OnboardingPaywallPreviewProps {
  layout: PaywallLayout;
  initialStep?: 'plan';
  cleaning?: boolean;
  onlyPackageId?: PaywallPackageId;
  plans?: PreviewPlans;
  planPicker?: PaywallPlanPicker;
  planIntent: OnboardingIntent;
  goalPhrase: string;
  onClose: () => void;
}

export function OnboardingPaywallPreview({
  layout,
  initialStep,
  cleaning,
  onlyPackageId,
  plans,
  planPicker = 'stacked',
  planIntent,
  goalPhrase,
  onClose,
}: OnboardingPaywallPreviewProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<PaywallPackageId>((plans != null ? defaultPackageId(PREVIEW_PLAN_SETS[plans]) : null) ?? 'annual');
  const previewOnly = () => Alert.alert('Preview only', 'Purchases are unavailable in this preview.');

  return (
    <FullMotion>
      <View style={styles.screen}>
        <OnboardingPaywallScreen
          preview
          initialStep={initialStep}
          offering={{
            ...PREVIEW_OFFERING,
            paywallLayout: layout,
            planPicker,
            onlyPackageId: onlyPackageId ?? null,
            packages: plans != null
              ? PREVIEW_PLAN_SETS[plans]
              : onlyPackageId === 'annual' ? PREVIEW_PAID_ANNUAL_PACKAGES : PREVIEW_OFFERING.packages,
          }}
          planIntent={planIntent}
          planPreset={onboardingPresetFor(planIntent)}
          selectedIntents={[planIntent]}
          goalPhrase={goalPhrase}
          scores={PREVIEW_SCORES}
          paywallMode="soft"
          cleaning={cleaning}
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
          onContinueWithoutPro={onClose}
        />
      </View>
    </FullMotion>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
});
