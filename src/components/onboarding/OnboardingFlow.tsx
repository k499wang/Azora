import { useMemo, useState } from 'react';
import AgeScreen from './screens/AgeScreen';
import ScienceCredibilityScreen from './screens/ScienceCredibilityScreen';
import ScienceResearchScreen from './screens/ScienceResearchScreen';
import BaselineScreen, { type BaselineResult } from './screens/BaselineScreen';
import BaselineIntroScreen from './screens/BaselineIntroScreen';
import DailyTimeScreen from './screens/DailyTimeScreen';
import GenderScreen from './screens/GenderScreen';
import IntentQuestionScreen from './screens/IntentQuestionScreen';
import IntentReflectionScreen from './screens/IntentReflectionScreen';
import AgreementScreen, {
  AGREEMENT_STATEMENTS,
  type AgreementValue,
} from './screens/AgreementScreen';
import AssessmentReflectionScreen from './screens/AssessmentReflectionScreen';
import ExperienceScreen, {
  type ExperienceLevel,
} from './screens/ExperienceScreen';
import NameScreen from './screens/NameScreen';
import PactScreen from './screens/PactScreen';
import NotificationPermissionScreen from './screens/NotificationPermissionScreen';
import SleepScreen from './screens/SleepScreen';
import StressScreen from './screens/StressScreen';
import RecommendationScreen from './screens/RecommendationScreen';
import OnboardingPaywallScreen from './screens/OnboardingPaywallScreen';
import { PERSONALIZED_INTENT_OPTIONS } from './data/intentOptions';
import { INTENT_TO_TECHNIQUE } from './data/techniqueRecommendations';
import type { GenderOption } from './data/genderOptions';
import type { OnboardingStep } from './types';
import { usePaywall } from '../../hooks/usePaywall';
import { PaywallPlacement } from '../../services/paywall';
import { buildPaywallPersonalization } from '../../lib/paywallPersonalization';
import { useAuthStore } from '../../stores/authStore';
import { requestNotificationPermissions } from '../../services/notifications/notificationClient';
import { trackNotificationPermissionResult } from '../../services/analytics/tracking';
import type { NotificationPreferences } from '../../services/notifications/types';
import { useUpdateNotificationPreferencesMutation } from '../../queries/notifications/useUpdateNotificationPreferencesMutation';

// Set to true to re-enable the intent reflection screen between intent selection and name entry.
const INTENT_REFLECTION_ENABLED = false;

export interface OnboardingFlowResult {
  onboardingGoal: string;
  displayName: string | null;
  stressLevel: number | null;
  sleepQuality: number | null;
  agreementResponses: Record<string, AgreementValue | null>;
  experienceLevel: ExperienceLevel | null;
  age: number | null;
  gender: GenderOption['id'] | null;
  dailyMinutes: number | null;
  defaultTechniqueId: string | null;
}

interface OnboardingFlowProps {
  onComplete: (result: OnboardingFlowResult) => Promise<void>;
}


const STEP_COUNT = 19;
const STEP_INDEX: Record<OnboardingStep, number> = {
  intent: 1,
  intentReflection: 2,
  name: 3,
  stress: 4,
  sleep: 5,
  agreement: 6,
  experience: 7,
  assessmentReflection: 8,
  age: 9,
  gender: 10,
  dailyTime: 11,
  scienceResearch: 12,
  baselineIntro: 13,
  baseline: 14,
  recommendation: 15,
  notifications: 16,
  scienceCredibility: 17,
  pact: 18,
  paywall: 19,
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [step, setStep] = useState<OnboardingStep>('intent');
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [customIntent, setCustomIntent] = useState('');
  const primaryIntent = useMemo(() => {
    const nonOther = selectedIntents.find((id) => id !== 'other');
    return nonOther ?? selectedIntents[0] ?? null;
  }, [selectedIntents]);
  const [name, setName] = useState('');
  const [stressLevel, setStressLevel] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [agreementResponses, setAgreementResponses] = useState<
    Record<string, AgreementValue | null>
  >(() =>
    AGREEMENT_STATEMENTS.reduce<Record<string, AgreementValue | null>>(
      (acc, statement) => {
        acc[statement.id] = null;
        return acc;
      },
      {},
    ),
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(
    null,
  );
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<GenderOption['id'] | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState(5);
  const [baseline, setBaseline] = useState<BaselineResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationErrorMessage, setNotificationErrorMessage] = useState<string | null>(null);
  const [isNotificationSubmitting, setIsNotificationSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateNotificationPreferences = useUpdateNotificationPreferencesMutation(userId);
  const paywall = usePaywall({
    placement: PaywallPlacement.OnboardingComplete,
    sourceScreen: 'onboarding',
    enabled: step === 'paywall',
  });

  const selectedOption = useMemo(
    () => PERSONALIZED_INTENT_OPTIONS.find((option) => option.id === primaryIntent) ?? null,
    [primaryIntent],
  );

  const toggleIntent = (intentId: string) => {
    if (isSubmitting) return;
    setSelectedIntents((prev) =>
      prev.includes(intentId) ? prev.filter((id) => id !== intentId) : [...prev, intentId],
    );
    setErrorMessage(null);
  };

  const goFromIntent = () => {
    if (selectedIntents.length === 0 || isSubmitting) return;
    if (selectedIntents.includes('other') && customIntent.trim().length === 0) {
      setErrorMessage('Please share a few words.');
      return;
    }

    const onlyOther = selectedIntents.length === 1 && selectedIntents[0] === 'other';
    setStep(onlyOther || !INTENT_REFLECTION_ENABLED ? 'name' : 'intentReflection');
  };

  const buildOnboardingGoal = () => {
    const parts: string[] = [];
    for (const id of selectedIntents) {
      if (id === 'other') {
        const trimmed = customIntent.trim();
        if (trimmed.length > 0) parts.push(trimmed);
        continue;
      }
      const option = PERSONALIZED_INTENT_OPTIONS.find((o) => o.id === id);
      if (option) parts.push(option.title);
      else parts.push(id);
    }
    return parts.join(', ');
  };

  const finish = async () => {
    const goal = buildOnboardingGoal();
    if (isSubmitting || goal.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onComplete({
        onboardingGoal: goal,
        displayName: name.trim() || null,
        stressLevel,
        sleepQuality,
        agreementResponses,
        experienceLevel,
        age,
        gender,
        dailyMinutes,
        defaultTechniqueId:
          primaryIntent != null ? INTENT_TO_TECHNIQUE[primaryIntent] ?? null : null,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  const purchaseSelectedPackage = async () => {
    if (isSubmitting) return;

    const result = await paywall.purchaseSelectedPackage();
    if (result.status === 'purchased' && result.isPro) {
      await finish();
    }
  };

  const restorePurchases = async () => {
    if (isSubmitting) return;

    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      await finish();
    }
  };

  const continueWithoutPro = async () => {
    if (isSubmitting) return;

    paywall.trackDismissed();
    await finish();
  };

  const enableNotifications = async (preferences: NotificationPreferences) => {
    if (isNotificationSubmitting) return;

    setIsNotificationSubmitting(true);
    setNotificationErrorMessage(null);

    try {
      const permissionStatus = await requestNotificationPermissions();
      trackNotificationPermissionResult({ status: permissionStatus, source: 'onboarding' });

      if (userId != null) {
        if (permissionStatus === 'granted') {
          await updateNotificationPreferences.mutateAsync({
            dailyReminder: preferences.dailyReminder,
            trialEndingReminder: preferences.trialEndingReminder,
          });
        } else {
          await updateNotificationPreferences.mutateAsync({
            dailyReminder: {
              enabled: false,
              time: preferences.dailyReminder.time,
            },
            trialEndingReminder: { enabled: false },
          });
        }
      }

      setStep('scienceCredibility');
    } catch (error) {
      setNotificationErrorMessage(getErrorMessage(error));
    } finally {
      setIsNotificationSubmitting(false);
    }
  };

  const stepIndex = STEP_INDEX[step];

  if (step === 'intentReflection' && selectedOption) {
    return (
      <IntentReflectionScreen
        option={selectedOption}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        isSubmitting={isSubmitting}
        onContinue={() => setStep('name')}
        onBack={() => setStep('intent')}
      />
    );
  }

  if (step === 'name') {
    return (
      <NameScreen
        value={name}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onChange={setName}
        onContinue={() => setStep('stress')}
        onBack={() => setStep('intent')}
      />
    );
  }

  if (step === 'stress') {
    return (
      <StressScreen
        value={stressLevel}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onChange={setStressLevel}
        onContinue={() => setStep('sleep')}
        onBack={() => setStep('name')}
      />
    );
  }

  if (step === 'sleep') {
    return (
      <SleepScreen
        value={sleepQuality}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onChange={setSleepQuality}
        onContinue={() => setStep('agreement')}
        onBack={() => setStep('stress')}
      />
    );
  }

  if (step === 'agreement') {
    return (
      <AgreementScreen
        responses={agreementResponses}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onChange={(id, value) =>
          setAgreementResponses((prev) => ({ ...prev, [id]: value }))
        }
        onContinue={() => setStep('experience')}
        onBack={() => setStep('sleep')}
      />
    );
  }

  if (step === 'experience') {
    return (
      <ExperienceScreen
        value={experienceLevel}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onSelect={setExperienceLevel}
        onContinue={() => setStep('assessmentReflection')}
        onBack={() => setStep('agreement')}
      />
    );
  }

  if (step === 'assessmentReflection') {
    return (
      <AssessmentReflectionScreen
        name={name}
        stressLevel={stressLevel}
        sleepQuality={sleepQuality}
        agreementResponses={agreementResponses}
        experienceLevel={experienceLevel}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onContinue={() => setStep('age')}
        onBack={() => setStep('experience')}
      />
    );
  }

  if (step === 'age') {
    return (
      <AgeScreen
        value={age}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onChange={setAge}
        onContinue={() => setStep('gender')}
        onBack={() => setStep('assessmentReflection')}
      />
    );
  }

  if (step === 'gender') {
    return (
      <GenderScreen
        value={gender}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onSelect={setGender}
        onContinue={() => setStep('dailyTime')}
        onBack={() => setStep('age')}
      />
    );
  }

  if (step === 'dailyTime') {
    return (
      <DailyTimeScreen
        value={dailyMinutes}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onChange={setDailyMinutes}
        onContinue={() => setStep('scienceResearch')}
        onBack={() => setStep('gender')}
      />
    );
  }

  if (step === 'scienceResearch') {
    return (
      <ScienceResearchScreen
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onContinue={() => setStep('baselineIntro')}
        onBack={() => setStep('dailyTime')}
      />
    );
  }

  if (step === 'baselineIntro') {
    return (
      <BaselineIntroScreen
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        name={name}
        onContinue={() => setStep('baseline')}
        onBack={() => setStep('scienceResearch')}
      />
    );
  }

  if (step === 'baseline') {
    return (
      <BaselineScreen
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onContinue={(result) => {
          setBaseline(result);
          setStep('recommendation');
        }}
        onBack={() => setStep('baselineIntro')}
      />
    );
  }

  if (step === 'recommendation') {
    const intentTitle =
      primaryIntent === 'other' || primaryIntent == null
        ? customIntent.trim() || 'reach your goal'
        : selectedOption?.title ?? 'reach your goal';
    const techniqueId =
      primaryIntent != null ? INTENT_TO_TECHNIQUE[primaryIntent] ?? 'box' : 'box';

    return (
      <RecommendationScreen
        techniqueId={techniqueId}
        intentTitle={intentTitle}
        age={age}
        dailyMinutes={dailyMinutes}
        baseline={baseline}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onContinue={() => setStep('notifications')}
        onBack={() => setStep('baseline')}
      />
    );
  }

  if (step === 'notifications') {
    return (
      <NotificationPermissionScreen
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        isSubmitting={isNotificationSubmitting}
        errorMessage={notificationErrorMessage}
        onEnable={(preferences) => {
          void enableNotifications(preferences);
        }}
        onSkip={() => {
          setNotificationErrorMessage(null);
          setStep('scienceCredibility');
        }}
        onBack={() => setStep('recommendation')}
      />
    );
  }

  if (step === 'scienceCredibility') {
    return (
      <ScienceCredibilityScreen
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onContinue={() => setStep('pact')}
        onBack={() => setStep('notifications')}
      />
    );
  }

  if (step === 'pact') {
    const intentTitle =
      primaryIntent === 'other' || primaryIntent == null
        ? customIntent.trim() || 'reach your goal'
        : selectedOption?.title ?? 'reach your goal';

    return (
      <PactScreen
        intentTitle={intentTitle}
        displayName={name.trim() || null}
        dailyMinutes={dailyMinutes}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onConfirm={() => {
          setTimeout(() => setStep('paywall'), 3500);
        }}
        onBack={() => setStep('scienceCredibility')}
      />
    );
  }

  if (step === 'paywall') {
    const personalization = buildPaywallPersonalization({
      displayName: name.trim() || null,
      intentId: primaryIntent,
      stressLevel,
      sleepQuality,
      dailyMinutes,
    });
    return (
      <OnboardingPaywallScreen
        offering={paywall.offering}
        selectedPackageId={paywall.selectedPackageId}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        isLoading={paywall.isLoading}
        isPurchasing={paywall.isPurchasing}
        isRestoring={paywall.isRestoring}
        errorMessage={paywall.errorMessage ?? errorMessage}
        personalization={personalization}
        onSelectPackage={paywall.selectPackage}
        onPurchase={() => {
          void purchaseSelectedPackage();
        }}
        onRestore={() => {
          void restorePurchases();
        }}
        onRetry={() => {
          void paywall.retryRevenueCatSync();
        }}
        onContinueWithoutPro={continueWithoutPro}
      />
    );
  }

  return (
    <IntentQuestionScreen
      selectedIntents={selectedIntents}
      customIntent={customIntent}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      stepIndex={stepIndex}
      stepCount={STEP_COUNT}
      onToggle={toggleIntent}
      onCustomIntentChange={setCustomIntent}
      onContinue={goFromIntent}
    />
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Please try again.';
}
