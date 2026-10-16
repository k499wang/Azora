import { useCallback, useEffect, useRef } from 'react';
import type { RootStackScreenProps } from '../app/navigation';
import {
  chosenGoalPhrase,
  ONBOARDING_INTENT_LOOKUP_OPTIONS,
} from '../components/onboarding/data/intentOptions';
import OnboardingPaywallScreen from '../components/onboarding/screens/OnboardingPaywallScreen';
import { usePaywall } from '../hooks/usePaywall';
import { enrolledOrGoalPreset } from '../lib/onboardingPreset';
import { computeMindMap } from '../lib/onboardingScores';
import { buildIntentTitleLookup, resolvePlanIntents } from '../lib/planProgress';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useSavedOnboardingProfileQuery } from '../queries/profile/useSavedOnboardingProfileQuery';
import { useProgramEnrollmentQuery } from '../queries/program/useProgramEnrollmentQuery';
import { PaywallPlacement } from '../services/paywall';
import type { PaywallPackageId } from '../services/paywall';
import { useAuthStore } from '../stores/authStore';

const INTENT_TITLES = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);

export function ProPaywallScreen({ navigation, route }: RootStackScreenProps<'ProPaywall'>) {
  const isBlocking = route.params?.isBlocking === true;
  const paywall = usePaywall({
    placement: route.params?.placement ?? PaywallPlacement.ProfileUpgrade,
    feature: route.params?.feature,
    sourceScreen: route.params?.sourceScreen,
    sourceAction: route.params?.sourceAction,
  });
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const personalizationUserId = paywall.offering?.paywallLayout === 'deck' ? null : userId;
  const profileQuery = useProfileQuery(personalizationUserId);
  const savedProfileQuery = useSavedOnboardingProfileQuery(
    personalizationUserId,
    personalizationUserId != null,
  );
  const enrollmentQuery = useProgramEnrollmentQuery(personalizationUserId);
  const profile = profileQuery.data?.userId === personalizationUserId ? profileQuery.data : null;
  const savedProfile = savedProfileQuery.data;
  const selectedIntents = resolvePlanIntents(
    profile?.onboardingGoal ?? savedProfile?.onboardingGoal,
    INTENT_TITLES,
  );
  const planIntent = selectedIntents[0] ?? 'other';
  const planPreset = enrolledOrGoalPreset(enrollmentQuery.data?.planId, planIntent, enrollmentQuery.data?.presetRevision);
  const name = profile != null ? profile.displayName : savedProfile?.displayName;
  const scores = savedProfile?.stressLevel != null && savedProfile.sleepQuality != null
    ? computeMindMap({
      stressLevel: savedProfile.stressLevel,
      sleepQuality: savedProfile.sleepQuality,
      agreementResponses: savedProfile.agreementResponses ?? {},
    }).scores
    : undefined;
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
      name={name ?? undefined}
      planIntent={planIntent}
      planPreset={planPreset}
      selectedIntents={selectedIntents}
      goalPhrase={chosenGoalPhrase(planIntent, selectedIntents)}
      scores={scores}
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
      onStepViewed={paywall.trackStepViewed}
      onPurchase={purchaseSelectedPackage}
      onOfferPurchased={finishPurchase}
      onRestore={restorePurchases}
      onRetry={() => { void paywall.retryRevenueCatSync(); }}
      onContinueWithoutPro={isBlocking ? undefined : continueWithoutPro}
    />
  );
}
