import { useEffect, useMemo, useRef, useState } from 'react';
import AgeScreen from './screens/AgeScreen';
import ScienceCredibilityScreen from './screens/ScienceCredibilityScreen';
import BaselineScreen, { type BaselineResult } from './screens/BaselineScreen';
import BaselineIntroScreen from './screens/BaselineIntroScreen';
import DailyTimeScreen from './screens/DailyTimeScreen';
import GenderScreen from './screens/GenderScreen';
import IntentQuestionScreen from './screens/IntentQuestionScreen';
import IntentReflectionScreen from './screens/IntentReflectionScreen';
import IntentProjectionScreen from './screens/IntentProjectionScreen';
import AgreementScreen, {
  AGREEMENT_STATEMENTS,
  type AgreementValue,
} from './screens/AgreementScreen';
import AssessmentReflectionScreen from './screens/AssessmentReflectionScreen';
import ExperienceScreen, {
  type ExperienceLevel,
} from './screens/ExperienceScreen';
import NameScreen from './screens/NameScreen';
import FounderVideoScreen from './screens/FounderVideoScreen';
import GreetingScreen from './screens/GreetingScreen';
import PactScreen from './screens/PactScreen';
import NotificationPermissionScreen from './screens/NotificationPermissionScreen';
import SleepScreen from './screens/SleepScreen';
import StressScreen from './screens/StressScreen';
import RecommendationScreen from './screens/RecommendationScreen';
import OnboardingPaywallScreen from './screens/OnboardingPaywallScreen';
import LungCapacityScreen from './screens/LungCapacityScreen';
import type { LungCapacityResult } from '../../lib/lungCapacity';
import { PERSONALIZED_INTENT_OPTIONS } from './data/intentOptions';
import { INTENT_TO_TECHNIQUE } from './data/techniqueRecommendations';
import type { GenderOption } from './data/genderOptions';
import type { OnboardingStep } from './types';
import { usePaywall } from '../../hooks/usePaywall';
import { PaywallPlacement } from '../../services/paywall';
import { buildPaywallPersonalization } from '../../lib/paywallPersonalization';
import { computeMindMap } from '../../lib/onboardingScores';
import { useAuthStore } from '../../stores/authStore';
import { requestNotificationPermissions } from '../../services/notifications/notificationClient';
import { trackNotificationPermissionResult } from '../../services/analytics/tracking';
import {
  trackOnboardingBackPressed,
  trackOnboardingCompleted,
  type OnboardingCompletionPath,
  trackOnboardingIntentUpdated,
  trackOnboardingProfileSaveFailed,
  trackOnboardingProfileSaveStarted,
  trackOnboardingProfileSaveSucceeded,
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingStepSkipped,
  trackOnboardingStepViewed,
} from '../../services/analytics/onboarding';
import type { NotificationPreferences } from '../../services/notifications/types';
import { useUpdateNotificationPreferencesMutation } from '../../queries/notifications/useUpdateNotificationPreferencesMutation';
import { buildOnboardingSaveFailureDiagnostics } from '../../queries/profile/onboardingSaveDiagnostics';
import type { SavedOnboardingProfile } from '../../services/profile/onboardingStatusService';

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
  lungCapacity: LungCapacityResult | null;
}

interface OnboardingFlowProps {
  initialSavedProfile?: SavedOnboardingProfile | null;
  isSavingProfile?: boolean;
  isCompletingOnboarding?: boolean;
  onSaveProfile: (result: OnboardingFlowResult) => Promise<void>;
  onComplete: () => Promise<void>;
}


const STEP_COUNT = 22;
const STEP_INDEX: Record<OnboardingStep, number> = {
  intent: 1,
  intentReflection: 2,
  intentProjection: 3,
  name: 4,
  greeting: 5,
  stress: 6,
  sleep: 7,
  agreement: 8,
  scienceCredibility: 9,
  experience: 10,
  assessmentReflection: 11,
  lungCapacity: 12,
  age: 13,
  gender: 14,
  dailyTime: 15,
  notifications: 16,
  baselineIntro: 17,
  baseline: 18,
  recommendation: 19,
  founderVideo: 20,
  pact: 21,
  paywall: 22,
};

type OnboardingTransitionAction = 'continue' | 'skip' | 'back' | 'auto';
type OnboardingAnalyticsProperties = Record<string, string | number | boolean | null>;

export default function OnboardingFlow({
  initialSavedProfile = null,
  isSavingProfile = false,
  isCompletingOnboarding = false,
  onSaveProfile,
  onComplete,
}: OnboardingFlowProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [step, setStep] = useState<OnboardingStep>(
    initialSavedProfile == null ? 'intent' : 'paywall',
  );
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [customIntent, setCustomIntent] = useState(
    initialSavedProfile?.onboardingGoal ?? '',
  );
  const primaryIntent = useMemo(() => {
    const nonOther = selectedIntents.find((id) => id !== 'other');
    return nonOther ?? selectedIntents[0] ?? null;
  }, [selectedIntents]);
  const [name, setName] = useState(initialSavedProfile?.displayName ?? '');
  const [stressLevel, setStressLevel] = useState(
    initialSavedProfile?.stressLevel ?? 5,
  );
  const [sleepQuality, setSleepQuality] = useState(
    initialSavedProfile?.sleepQuality ?? 5,
  );
  const [agreementResponses, setAgreementResponses] = useState<
    Record<string, AgreementValue | null>
  >(() =>
    AGREEMENT_STATEMENTS.reduce<Record<string, AgreementValue | null>>(
      (acc, statement) => {
        acc[statement.id] =
          initialSavedProfile?.agreementResponses?.[statement.id] ?? null;
        return acc;
      },
      {},
    ),
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(
    initialSavedProfile?.experienceLevel ?? null,
  );
  const [age, setAge] = useState(initialSavedProfile?.age ?? 25);
  const [gender, setGender] = useState<GenderOption['id'] | null>(
    toGenderOptionId(initialSavedProfile?.gender),
  );
  const [dailyMinutes, setDailyMinutes] = useState(
    initialSavedProfile?.dailyMinutes ?? 5,
  );
  const [baseline, setBaseline] = useState<BaselineResult | null>(null);
  const [lungCapacity, setLungCapacity] = useState<LungCapacityResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationErrorMessage, setNotificationErrorMessage] = useState<string | null>(null);
  const [isNotificationSubmitting, setIsNotificationSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateNotificationPreferences = useUpdateNotificationPreferencesMutation(userId);
  const entryStateRef = useRef<'new' | 'saved_profile'>(
    initialSavedProfile == null ? 'new' : 'saved_profile',
  );
  const hasTrackedStartRef = useRef(false);
  const previousViewedStepRef = useRef<OnboardingStep | null>(null);
  const paywall = usePaywall({
    placement: PaywallPlacement.OnboardingComplete,
    sourceScreen: 'onboarding',
    enabled: step === 'paywall',
  });

  const selectedOption = useMemo(
    () => PERSONALIZED_INTENT_OPTIONS.find((option) => option.id === primaryIntent) ?? null,
    [primaryIntent],
  );

  const getStepEventInput = (targetStep: OnboardingStep = step) => ({
    step: targetStep,
    stepIndex: STEP_INDEX[targetStep],
    stepCount: STEP_COUNT,
  });

  const buildProfileAnalyticsProperties = (
    result?: OnboardingFlowResult,
  ): OnboardingAnalyticsProperties => {
    const profile = result ?? buildOnboardingResult();
    return {
      selected_intent_count: selectedIntents.length,
      has_custom_intent: customIntent.trim().length > 0,
      has_display_name: (profile?.displayName ?? null) != null,
      has_default_technique: (profile?.defaultTechniqueId ?? null) != null,
      has_stress_level: (profile?.stressLevel ?? null) != null,
      has_sleep_quality: (profile?.sleepQuality ?? null) != null,
      agreement_response_count: Object.values(agreementResponses).filter(
        (value) => value != null,
      ).length,
      has_experience_level: (profile?.experienceLevel ?? null) != null,
      has_age: (profile?.age ?? null) != null,
      has_gender: (profile?.gender ?? null) != null,
      has_daily_minutes: (profile?.dailyMinutes ?? null) != null,
      has_lung_capacity: (profile?.lungCapacity ?? null) != null,
      has_baseline: baseline != null,
    };
  };

  const goToStep = (
    nextStep: OnboardingStep,
    action: OnboardingTransitionAction,
    properties?: OnboardingAnalyticsProperties,
  ) => {
    const eventInput = {
      ...getStepEventInput(),
      nextStep,
      action,
      properties,
    };

    if (action === 'back') {
      trackOnboardingBackPressed(eventInput);
    } else if (action === 'skip') {
      trackOnboardingStepSkipped(eventInput);
    } else {
      trackOnboardingStepCompleted(eventInput);
    }

    setStep(nextStep);
  };

  useEffect(() => {
    const eventInput = getStepEventInput(step);

    if (!hasTrackedStartRef.current) {
      trackOnboardingStarted({
        ...eventInput,
        entry_state: entryStateRef.current,
      });
      hasTrackedStartRef.current = true;
    }

    trackOnboardingStepViewed({
      ...eventInput,
      previousStep: previousViewedStepRef.current,
    });
    previousViewedStepRef.current = step;
  }, [step]);

  const toggleIntent = (intentId: string) => {
    if (isSubmitting) return;
    const isSelected = selectedIntents.includes(intentId);
    const nextSelectedIntents = isSelected
      ? selectedIntents.filter((id) => id !== intentId)
      : [...selectedIntents, intentId];

    setSelectedIntents(nextSelectedIntents);
    trackOnboardingIntentUpdated({
      ...getStepEventInput('intent'),
      intentId,
      selected: !isSelected,
      selectedIntentCount: nextSelectedIntents.length,
      hasCustomIntent: customIntent.trim().length > 0,
    });
    setErrorMessage(null);
  };

  const goFromIntent = () => {
    if (selectedIntents.length === 0 || isSubmitting) return;
    if (selectedIntents.includes('other') && customIntent.trim().length === 0) {
      setErrorMessage('Please share a few words.');
      return;
    }

    const onlyOther = selectedIntents.length === 1 && selectedIntents[0] === 'other';
    const nextStep = onlyOther ? 'name' : 'intentProjection';
    const properties = {
      selected_intent_count: selectedIntents.length,
      has_custom_intent: customIntent.trim().length > 0,
      only_custom_intent: onlyOther,
    };

    if (INTENT_REFLECTION_ENABLED && !onlyOther) {
      goToStep('intentReflection', 'continue', properties);
      return;
    }
    goToStep(nextStep, 'continue', properties);
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

  const buildOnboardingResult = (): OnboardingFlowResult | null => {
    const goal = buildOnboardingGoal();
    if (goal.length === 0) return null;

    return {
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
        primaryIntent != null
          ? INTENT_TO_TECHNIQUE[primaryIntent] ?? null
          : initialSavedProfile?.defaultTechniqueId ?? null,
      lungCapacity,
    };
  };

  const saveProfileAndShowPaywall = async () => {
    if (isSubmitting) return;

    const result = buildOnboardingResult();
    if (result == null) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    const startedAt = Date.now();

    console.log('[onboarding-seal] save started', {
      userId,
      selectedIntentCount: selectedIntents.length,
      hasCustomIntent: customIntent.trim().length > 0,
      hasDisplayName: result.displayName != null,
      hasDefaultTechnique: result.defaultTechniqueId != null,
      hasLungCapacity: result.lungCapacity != null,
    });

    try {
      trackOnboardingProfileSaveStarted({
        ...getStepEventInput(),
        ...buildProfileAnalyticsProperties(result),
      });
      await Promise.all([
        onSaveProfile(result),
        new Promise<void>((resolve) => setTimeout(resolve, 3500)),
      ]);
      trackOnboardingProfileSaveSucceeded({
        ...getStepEventInput(),
        elapsed_ms: Date.now() - startedAt,
        ...buildProfileAnalyticsProperties(result),
      });
      console.log('[onboarding-seal] save succeeded', {
        userId,
        elapsedMs: Date.now() - startedAt,
      });
      goToStep('paywall', 'continue', buildProfileAnalyticsProperties(result));
    } catch (error) {
      trackOnboardingProfileSaveFailed({
        ...getStepEventInput(),
        elapsed_ms: Date.now() - startedAt,
        error_message: getErrorMessage(error),
        ...buildProfileAnalyticsProperties(result),
      });
      console.warn('[onboarding-seal] save failed', {
        userId,
        elapsedMs: Date.now() - startedAt,
        errorMessage: getErrorMessage(error),
      });
      console.warn(
        '[onboarding-seal] save diagnostics',
        await buildOnboardingSaveFailureDiagnostics({
          userId,
          elapsedMs: Date.now() - startedAt,
          requestType: 'onboarding-seal-flow',
          retryAttempt: 0,
          error,
        }),
      );
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const finish = async (completionPath: OnboardingCompletionPath) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onComplete();
      trackOnboardingCompleted({
        ...getStepEventInput(),
        completion_path: completionPath,
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
      await finish('purchase');
    }
  };

  const restorePurchases = async () => {
    if (isSubmitting) return;

    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      await finish('restore');
    }
  };

  const continueWithoutPro = async () => {
    if (isSubmitting) return;

    paywall.trackDismissed();
    await finish('continue_without_pro');
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

      goToStep('baselineIntro', 'continue', {
        notification_status: permissionStatus,
      });
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
        onContinue={() => goToStep('intentProjection', 'continue')}
        onBack={() => goToStep('intent', 'back')}
      />
    );
  }

  if (step === 'intentProjection') {
    return (
      <IntentProjectionScreen
        selectedIntents={selectedIntents}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onContinue={() => goToStep('name', 'continue')}
        onBack={() => goToStep('intent', 'back')}
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
        onContinue={() => goToStep('greeting', 'continue', {
          has_display_name: name.trim().length > 0,
        })}
        onBack={() => goToStep('intentProjection', 'back')}
        onSkip={() => {
          setName('');
          goToStep('greeting', 'skip');
        }}
      />
    );
  }

  if (step === 'greeting') {
    return (
      <GreetingScreen
        name={name}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onContinue={() => goToStep('stress', 'continue')}
        onBack={() => goToStep('name', 'back')}
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
        onContinue={() => goToStep('sleep', 'continue', { has_stress_level: true })}
        onBack={() => goToStep(name.trim() ? 'greeting' : 'name', 'back')}
        onSkip={() => goToStep('sleep', 'skip')}
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
        onContinue={() => goToStep('agreement', 'continue', { has_sleep_quality: true })}
        onBack={() => goToStep('stress', 'back')}
        onSkip={() => goToStep('agreement', 'skip')}
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
        onContinue={() => goToStep('scienceCredibility', 'continue', {
          agreement_response_count: Object.values(agreementResponses).filter(
            (value) => value != null,
          ).length,
        })}
        onBack={() => goToStep('sleep', 'back')}
        onSkip={() => goToStep('scienceCredibility', 'skip')}
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
        onContinue={() => goToStep('assessmentReflection', 'continue', {
          has_experience_level: experienceLevel != null,
        })}
        onBack={() => goToStep('scienceCredibility', 'back')}
        onSkip={() => goToStep('assessmentReflection', 'skip')}
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
        onContinue={() => goToStep('lungCapacity', 'continue')}
        onBack={() => goToStep('experience', 'back')}
      />
    );
  }

  if (step === 'lungCapacity') {
    return (
      <LungCapacityScreen
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onContinue={(result) => {
          setLungCapacity(result);
          goToStep('age', 'continue', { has_lung_capacity: true });
        }}
        onBack={() => goToStep('assessmentReflection', 'back')}
        onSkip={() => goToStep('age', 'skip')}
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
        onContinue={() => goToStep('gender', 'continue', { has_age: true })}
        onBack={() => goToStep('lungCapacity', 'back')}
        onSkip={() => goToStep('gender', 'skip')}
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
        onContinue={() => goToStep('dailyTime', 'continue', { has_gender: gender != null })}
        onBack={() => goToStep('age', 'back')}
        onSkip={() => goToStep('dailyTime', 'skip')}
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
        onContinue={() => goToStep('notifications', 'continue', { has_daily_minutes: true })}
        onBack={() => goToStep('gender', 'back')}
        onSkip={() => goToStep('notifications', 'skip')}
      />
    );
  }

  if (step === 'baselineIntro') {
    return (
      <BaselineIntroScreen
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        name={name}
        onContinue={() => goToStep('baseline', 'continue')}
        onBack={() => goToStep('notifications', 'back')}
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
          goToStep('recommendation', 'continue', {
            baseline_completed: result.completed,
            has_baseline_bpm: result.avgBpm != null,
            has_baseline_drop: result.bpmDrop != null,
          });
        }}
        onBack={() => goToStep('baselineIntro', 'back')}
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
        stressLevel={stressLevel}
        sleepQuality={sleepQuality}
        agreementResponses={agreementResponses}
        experienceLevel={experienceLevel}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onContinue={() => goToStep('founderVideo', 'continue')}
        onBack={() => goToStep('baseline', 'back')}
      />
    );
  }

  if (step === 'founderVideo') {
    return (
      <FounderVideoScreen
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onContinue={() => goToStep('pact', 'continue')}
        onSkip={() => goToStep('pact', 'skip')}
        onBack={() => goToStep('recommendation', 'back')}
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
          goToStep('baselineIntro', 'skip');
        }}
        onBack={() => goToStep('dailyTime', 'back')}
      />
    );
  }

  if (step === 'scienceCredibility') {
    const scIntentTitle =
      primaryIntent === 'other' || primaryIntent == null
        ? null
        : selectedOption?.title ?? null;
    return (
      <ScienceCredibilityScreen
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        name={name.trim() || null}
        intentTitle={scIntentTitle}
        onContinue={() => goToStep('experience', 'continue')}
        onBack={() => goToStep('agreement', 'back')}
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
          void saveProfileAndShowPaywall();
        }}
        onBack={() => goToStep('founderVideo', 'back')}
      />
    );
  }

  if (step === 'paywall') {
    const mindMap = computeMindMap({
      stressLevel,
      sleepQuality,
      agreementResponses,
      experienceLevel,
    });
    const personalization = buildPaywallPersonalization({
      displayName: name.trim() || null,
      dailyMinutes,
      baselineBpm: baseline?.avgBpm ?? null,
      mindMap,
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
        isCompleting={isSubmitting || isSavingProfile || isCompletingOnboarding}
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

function toGenderOptionId(
  value: SavedOnboardingProfile['gender'] | undefined,
): GenderOption['id'] | null {
  if (
    value === 'female' ||
    value === 'male' ||
    value === 'nonbinary' ||
    value === 'prefer_not'
  ) {
    return value;
  }

  return null;
}
