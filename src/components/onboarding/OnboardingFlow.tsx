import { useEffect, useMemo, useRef, useState } from 'react';
import AgeScreen from './screens/AgeScreen';
import ScienceCredibilityScreen from './screens/ScienceCredibilityScreen';
import BaselineScreen, { type BaselineResult } from './screens/BaselineScreen';
import BaselineIntroScreen from './screens/BaselineIntroScreen';
import DailyTimeScreen from './screens/DailyTimeScreen';
import ConsistencyScreen from './screens/ConsistencyScreen';
import GenderScreen from './screens/GenderScreen';
import IntentQuestionScreen from './screens/IntentQuestionScreen';
import IntentReflectionScreen from './screens/IntentReflectionScreen';
import IntentProjectionScreen from './screens/IntentProjectionScreen';
import BrainScienceScreen from './screens/BrainScienceScreen';
import AgreementScreen, {
  AGREEMENT_STATEMENTS,
  type AgreementValue,
} from './screens/AgreementScreen';
import AssessmentReflectionScreen from './screens/AssessmentReflectionScreen';
import ExperienceScreen, {
  type ExperienceLevel,
} from './screens/ExperienceScreen';
import NameScreen from './screens/NameScreen';
import GreetingScreen from './screens/GreetingScreen';
import AttPrimingScreen from './screens/AttPrimingScreen';
import PactScreen from './screens/PactScreen';
import NotificationPermissionScreen from './screens/NotificationPermissionScreen';
import SleepScreen from './screens/SleepScreen';
import StressScreen from './screens/StressScreen';
import MindRacingScreen from './screens/MindRacingScreen';
import RecommendationScreen from './screens/RecommendationScreen';
import RecommendedExerciseScreen from './screens/RecommendedExerciseScreen';
import FounderNoteScreen from './screens/FounderNoteScreen';
import FiveMinutesScreen from './screens/FiveMinutesScreen';
import OnboardingPaywallScreen from './screens/OnboardingPaywallScreen';
import ExitOfferSheet from '../paywall/ExitOfferSheet';
import LungCapacityScreen from './screens/LungCapacityScreen';
import type { LungCapacityResult } from '../../lib/lungCapacity';
import { PERSONALIZED_INTENT_OPTIONS } from './data/intentOptions';
import { INTENT_TO_TECHNIQUE } from './data/techniqueRecommendations';
import type { GenderOption } from './data/genderOptions';
import type { OnboardingStep } from './types';
import { usePaywall } from '../../hooks/usePaywall';
import { PaywallPlacement } from '../../services/paywall';
import { useUserEntitlementQuery } from '../../queries/subscriptions/useUserEntitlementQuery';
import { useExitOfferStore } from '../../stores/exitOfferStore';
import { buildPaywallPersonalization } from '../../lib/paywallPersonalization';
import { computeMindMap } from '../../lib/onboardingScores';
import { useAuthStore } from '../../stores/authStore';
import { requestNotificationPermissions } from '../../services/notifications/notificationClient';
import { requestAttPermissionOnce } from '../../services/attribution/attPrompt';
import { initAppsFlyer } from '../../services/attribution/appsFlyerClient';
import { logAppsFlyerDiagnostics } from '../../services/attribution/appsFlyerDiagnostics';
import { collectRevenueCatDeviceIdentifiers } from '../../services/subscriptions/revenueCatClient';
import { syncRevenueCatAttributionForCurrentUser } from '../../services/subscriptions/revenueCatIdentitySync';
import { trackNotificationPermissionResult } from '../../services/analytics/tracking';
import {
  trackOnboardingBackPressed,
  trackOnboardingCompleted,
  type OnboardingCompletionPath,
  trackOnboardingIntentUpdated,
  trackOnboardingProfileSaveFailed,
  trackOnboardingProfileSaveStarted,
  trackOnboardingProfileSaveSucceeded,
  trackOnboardingRegistrationCompleted,
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingStepSkipped,
  trackOnboardingStepViewed,
} from '../../services/analytics/onboarding';
import type { NotificationPreferences } from '../../services/notifications/types';
import { useUpdateNotificationPreferencesMutation } from '../../queries/notifications/useUpdateNotificationPreferencesMutation';
import { buildOnboardingSaveFailureDiagnostics } from '../../queries/profile/onboardingSaveDiagnostics';
import type { SavedOnboardingProfile } from '../../services/profile/onboardingStatusService';
import { requestStoreReview } from '../../services/reviews/storeReview';

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

async function syncPostAttAttribution(): Promise<void> {
  try {
    void logAppsFlyerDiagnostics();
    await syncRevenueCatAttributionForCurrentUser();
  } catch {
    // Attribution is best-effort and must never block onboarding.
  }
}

interface OnboardingFlowProps {
  initialSavedProfile?: SavedOnboardingProfile | null;
  isSavingProfile?: boolean;
  isCompletingOnboarding?: boolean;
  onSaveProfile: (result: OnboardingFlowResult) => Promise<void>;
  onComplete: () => Promise<void>;
}

const STEP_ORDER: OnboardingStep[] = [
  'intent',
  'intentReflection',
  'intentProjection',
  'brainScience',
  'name',
  'greeting',
  'stress',
  'mindRacing',
  'sleep',
  'agreement',
  'experience',
  'assessmentReflection',
  'scienceCredibility',
  'lungCapacity',
  'age',
  'gender',
  'consistency',
  'dailyTime',
  'baselineIntro',
  'baseline',
  'recommendation',
  'recommendedExercise',
  'attPriming',
  'notifications',
  'fiveMinutes',
  'founderNote',
  'pact',
  'paywall',
];

const BASE_STEP_INDEX = STEP_ORDER.reduce<Record<OnboardingStep, number>>(
  (acc, step, index) => {
    acc[step] = index + 1;
    return acc;
  },
  {} as Record<OnboardingStep, number>,
);
const VISUAL_PROGRESS_STEP_COUNT = 100;
const FRONT_LOADED_PROGRESS_EXPONENT = 0.65;
const PROGRESS_ANIMATION_MS = 520;
const EXIT_OFFER_IDLE_MS = 20_000;

function computeFrontLoadedProgress(stepIndex: number, stepCount: number) {
  if (stepCount <= 0) return 0;
  const rawProgress = Math.max(0, Math.min(1, stepIndex / stepCount));
  return Math.pow(rawProgress, FRONT_LOADED_PROGRESS_EXPONENT);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

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
  const isPro = useUserEntitlementQuery(userId).data?.isPro === true;
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
  const isOnlyCustomIntent =
    selectedIntents.length === 1 && selectedIntents[0] === 'other';
  const [name, setName] = useState(initialSavedProfile?.displayName ?? '');
  const [stressLevel, setStressLevel] = useState(
    initialSavedProfile?.stressLevel ?? 5,
  );
  const [sleepQuality, setSleepQuality] = useState(
    initialSavedProfile?.sleepQuality ?? 5,
  );
  const [racingLevel, setRacingLevel] = useState(5);
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
  const resumedAttributionSyncedUserRef = useRef<string | null>(null);
  const previousViewedStepRef = useRef<OnboardingStep | null>(null);
  const setExitOfferPending = useExitOfferStore((state) => state.setPending);
  const paywall = usePaywall({
    placement: PaywallPlacement.OnboardingComplete,
    sourceScreen: 'onboarding',
    enabled: step === 'paywall',
  });
  // Fail-soft: a missing/unloadable offering means we can't sell anything, so
  // the free path must stay available.
  const paywallMode = paywall.offering?.paywallMode ?? 'soft';
  const [isExitOfferVisible, setIsExitOfferVisible] = useState(false);
  const [hasReachedPlanStep, setHasReachedPlanStep] = useState(false);
  // Auto triggers (idle, cancelled purchase) fire at most once per session;
  // the explicit "Maybe later" tap can always reopen the offer.
  const hasAutoShownExitOfferRef = useRef(false);

  const showExitOffer = () => {
    hasAutoShownExitOfferRef.current = true;
    setIsExitOfferVisible(true);
  };

  const selectedOption = useMemo(
    () => PERSONALIZED_INTENT_OPTIONS.find((option) => option.id === primaryIntent) ?? null,
    [primaryIntent],
  );

  const visibleStepOrder = useMemo(
    () =>
      STEP_ORDER.filter((candidate) => {
        if (!INTENT_REFLECTION_ENABLED && candidate === 'intentReflection') {
          return false;
        }
        if (
          isOnlyCustomIntent &&
          (candidate === 'intentProjection' || candidate === 'brainScience')
        ) {
          return false;
        }
        return true;
      }),
    [isOnlyCustomIntent],
  );

  const stepIndexMap = useMemo(
    () =>
      visibleStepOrder.reduce<Partial<Record<OnboardingStep, number>>>(
        (acc, visibleStep, index) => {
          acc[visibleStep] = index + 1;
          return acc;
        },
        {},
      ),
    [visibleStepOrder],
  );

  const stepCount = visibleStepOrder.length;

  const getStepEventInput = (targetStep: OnboardingStep = step) => ({
    step: targetStep,
    stepIndex: stepIndexMap[targetStep] ?? BASE_STEP_INDEX[targetStep],
    stepCount,
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
    // IDFV is always available; IDFA only after ATT is granted. The ATT prompt
    // itself is shown from the dedicated priming step so it gets a pre-prompt.
    // Re-collecting later (after the prompt resolves) is a harmless no-op.
    void collectRevenueCatDeviceIdentifiers();
  }, []);

  useEffect(() => {
    // Resumed onboarding starts at the paywall, past the attPriming step, so a
    // reinstalled user (ATT reset by iOS) or a pre-attPriming-version user
    // would reach the paywall with ATT undetermined — the SDK would remain in
    // manual-start mode and their trial/registration events would be dropped.
    // Prompt here instead, mirroring attPriming's post-prompt sequence.
    if (initialSavedProfile == null || userId == null) return;
    if (resumedAttributionSyncedUserRef.current === userId) return;
    resumedAttributionSyncedUserRef.current = userId;
    void requestAttPermissionOnce()
      .then(() => initAppsFlyer())
      .then(() => syncPostAttAttribution());
  }, [initialSavedProfile, userId]);

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

  useEffect(() => {
    // Hard-paywall idle trigger: lingering on the plan step ("Unlock Azora
    // for free") without acting is exit intent, so slide the one-time offer
    // up. The countdown never runs while a purchase/restore/completion is in
    // flight (the store sheet being open must not count as idling) and
    // restarts from zero when that activity ends.
    if (step !== 'paywall' || paywallMode !== 'hard' || isPro) return;
    if (!hasReachedPlanStep) return;
    if (hasAutoShownExitOfferRef.current || isExitOfferVisible) return;
    if (paywall.isPurchasing || paywall.isRestoring || isSubmitting) return;

    const id = setTimeout(() => {
      hasAutoShownExitOfferRef.current = true;
      setIsExitOfferVisible(true);
    }, EXIT_OFFER_IDLE_MS);
    return () => clearTimeout(id);
  }, [
    step,
    paywallMode,
    isPro,
    hasReachedPlanStep,
    isExitOfferVisible,
    paywall.isPurchasing,
    paywall.isRestoring,
    isSubmitting,
  ]);

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

    const nextStep = isOnlyCustomIntent ? 'name' : 'intentProjection';
    const properties = {
      selected_intent_count: selectedIntents.length,
      has_custom_intent: customIntent.trim().length > 0,
      only_custom_intent: isOnlyCustomIntent,
    };

    if (INTENT_REFLECTION_ENABLED && !isOnlyCustomIntent) {
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
      trackOnboardingRegistrationCompleted();
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

    // Cancelling the store sheet is exit intent — counter with the offer.
    if (
      result.status === 'cancelled' &&
      paywallMode === 'hard' &&
      !isPro &&
      !hasAutoShownExitOfferRef.current
    ) {
      showExitOffer();
      return;
    }

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

    // Queue the discounted exit offer to slide up over Home once onboarding
    // finishes. Never offered to an existing subscriber.
    if (!isPro) {
      setExitOfferPending(true);
    }

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

      goToStep('fiveMinutes', 'continue', {
        notification_status: permissionStatus,
      });
    } catch (error) {
      setNotificationErrorMessage(getErrorMessage(error));
    } finally {
      setIsNotificationSubmitting(false);
    }
  };

  const skipNotifications = async () => {
    if (isNotificationSubmitting) return;
    setNotificationErrorMessage(null);
    setIsNotificationSubmitting(true);
    try {
      goToStep('fiveMinutes', 'skip');
    } finally {
      setIsNotificationSubmitting(false);
    }
  };

  const stepIndex = stepIndexMap[step] ?? BASE_STEP_INDEX[step];
  const visualProgressTarget = computeFrontLoadedProgress(stepIndex, stepCount);
  const [displayedProgress, setDisplayedProgress] = useState(visualProgressTarget);
  const displayedProgressRef = useRef(visualProgressTarget);
  const progressFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (progressFrameRef.current != null) {
      cancelAnimationFrame(progressFrameRef.current);
      progressFrameRef.current = null;
    }

    const from = displayedProgressRef.current;
    const delta = visualProgressTarget - from;

    if (Math.abs(delta) < 0.001) {
      displayedProgressRef.current = visualProgressTarget;
      setDisplayedProgress(visualProgressTarget);
      return undefined;
    }

    const startedAt = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const t = Math.min(1, elapsed / PROGRESS_ANIMATION_MS);
      const next = from + delta * easeOutCubic(t);

      displayedProgressRef.current = next;
      setDisplayedProgress(next);

      if (t < 1) {
        progressFrameRef.current = requestAnimationFrame(tick);
      } else {
        progressFrameRef.current = null;
      }
    };

    progressFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (progressFrameRef.current != null) {
        cancelAnimationFrame(progressFrameRef.current);
        progressFrameRef.current = null;
      }
    };
  }, [visualProgressTarget]);

  const visualStepIndex = displayedProgress * VISUAL_PROGRESS_STEP_COUNT;
  const visualStepCount = VISUAL_PROGRESS_STEP_COUNT;

  if (step === 'intentReflection' && selectedOption) {
    return (
      <IntentReflectionScreen
        option={selectedOption}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
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
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('brainScience', 'continue')}
        onBack={() =>
          goToStep(INTENT_REFLECTION_ENABLED ? 'intentReflection' : 'intent', 'back')
        }
      />
    );
  }

  if (step === 'brainScience') {
    return (
      <BrainScienceScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('name', 'continue')}
        onBack={() => goToStep('intentProjection', 'back')}
      />
    );
  }

  if (step === 'name') {
    return (
      <NameScreen
        value={name}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setName}
        onContinue={() => goToStep('greeting', 'continue', {
          has_display_name: name.trim().length > 0,
        })}
        onBack={() =>
          goToStep(isOnlyCustomIntent ? 'intent' : 'brainScience', 'back')
        }
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
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('stress', 'continue')}
        onBack={() => goToStep('name', 'back')}
      />
    );
  }

  if (step === 'stress') {
    return (
      <StressScreen
        value={stressLevel}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setStressLevel}
        onContinue={() => goToStep('mindRacing', 'continue', { has_stress_level: true })}
        onBack={() => goToStep('greeting', 'back')}
        onSkip={() => goToStep('mindRacing', 'skip')}
      />
    );
  }

  if (step === 'mindRacing') {
    return (
      <MindRacingScreen
        value={racingLevel}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setRacingLevel}
        onContinue={() => goToStep('sleep', 'continue', { has_racing_level: true })}
        onBack={() => goToStep('stress', 'back')}
        onSkip={() => goToStep('sleep', 'skip')}
      />
    );
  }

  if (step === 'sleep') {
    return (
      <SleepScreen
        value={sleepQuality}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setSleepQuality}
        onContinue={() => goToStep('agreement', 'continue', { has_sleep_quality: true })}
        onBack={() => goToStep('mindRacing', 'back')}
        onSkip={() => goToStep('agreement', 'skip')}
      />
    );
  }

  if (step === 'agreement') {
    return (
      <AgreementScreen
        responses={agreementResponses}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={(id, value) =>
          setAgreementResponses((prev) => ({ ...prev, [id]: value }))
        }
        onContinue={() => goToStep('experience', 'continue', {
          agreement_response_count: Object.values(agreementResponses).filter(
            (value) => value != null,
          ).length,
        })}
        onBack={() => goToStep('sleep', 'back')}
        onSkip={() => goToStep('experience', 'skip')}
      />
    );
  }

  if (step === 'experience') {
    return (
      <ExperienceScreen
        value={experienceLevel}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setExperienceLevel}
        onContinue={() => goToStep('assessmentReflection', 'continue', {
          has_experience_level: experienceLevel != null,
        })}
        onBack={() => goToStep('agreement', 'back')}
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
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('scienceCredibility', 'continue')}
        onBack={() => goToStep('experience', 'back')}
      />
    );
  }

  if (step === 'lungCapacity') {
    return (
      <LungCapacityScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={(result) => {
          setLungCapacity(result);
          goToStep('age', 'continue', { has_lung_capacity: true });
        }}
        onBack={() => goToStep('scienceCredibility', 'back')}
        onSkip={() => goToStep('age', 'skip')}
      />
    );
  }

  if (step === 'age') {
    return (
      <AgeScreen
        value={age}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
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
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setGender}
        onContinue={() => goToStep('consistency', 'continue', { has_gender: gender != null })}
        onBack={() => goToStep('age', 'back')}
        onSkip={() => goToStep('consistency', 'skip')}
      />
    );
  }

  if (step === 'consistency') {
    return (
      <ConsistencyScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('dailyTime', 'continue')}
        onBack={() => goToStep('gender', 'back')}
      />
    );
  }

  if (step === 'dailyTime') {
    return (
      <DailyTimeScreen
        value={dailyMinutes}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setDailyMinutes}
        onContinue={() => goToStep('baselineIntro', 'continue', { has_daily_minutes: true })}
        onBack={() => goToStep('consistency', 'back')}
        onSkip={() => goToStep('baselineIntro', 'skip')}
      />
    );
  }

  if (step === 'baselineIntro') {
    return (
      <BaselineIntroScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('baseline', 'continue')}
        onBack={() => goToStep('dailyTime', 'back')}
      />
    );
  }

  if (step === 'baseline') {
    return (
      <BaselineScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
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

    return (
      <RecommendationScreen
        intentTitle={intentTitle}
        stressLevel={stressLevel}
        sleepQuality={sleepQuality}
        racingLevel={racingLevel}
        agreementResponses={agreementResponses}
        experienceLevel={experienceLevel}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('recommendedExercise', 'continue')}
        onBack={() => goToStep('baseline', 'back')}
      />
    );
  }

  if (step === 'recommendedExercise') {
    const techniqueId =
      primaryIntent != null ? INTENT_TO_TECHNIQUE[primaryIntent] ?? 'box' : 'box';

    return (
      <RecommendedExerciseScreen
        techniqueId={techniqueId}
        baseline={baseline}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('attPriming', 'continue')}
        onBack={() => goToStep('recommendation', 'back')}
      />
    );
  }

  if (step === 'attPriming') {
    return (
      <AttPrimingScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => {
          // Show Apple's ATT dialog right after the pre-prompt, then advance once
          // the user has responded. requestAttPermissionOnce never rejects and
          // no-ops if already resolved, so navigation always proceeds. The
          // attribution sync runs in the background — it can wait on the SDK
          // start and must not hold the funnel.
          void requestAttPermissionOnce()
            .then(() => initAppsFlyer())
            .then(() => {
              void syncPostAttAttribution();
              goToStep('notifications', 'continue');
            });
        }}
        onBack={() => goToStep('recommendedExercise', 'back')}
      />
    );
  }

  if (step === 'fiveMinutes') {
    return (
      <FiveMinutesScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('founderNote', 'continue')}
        onBack={() => goToStep('notifications', 'back')}
      />
    );
  }

  if (step === 'founderNote') {
    return (
      <FounderNoteScreen
        name={name.trim() || null}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => {
          void requestStoreReview().finally(() => goToStep('pact', 'continue'));
        }}
        onBack={() => goToStep('fiveMinutes', 'back')}
      />
    );
  }

  if (step === 'notifications') {
    return (
      <NotificationPermissionScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        isSubmitting={isNotificationSubmitting}
        errorMessage={notificationErrorMessage}
        onEnable={(preferences) => {
          void enableNotifications(preferences);
        }}
        onSkip={() => {
          void skipNotifications();
        }}
        onBack={() => goToStep('attPriming', 'back')}
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
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        name={name.trim() || null}
        intentTitle={scIntentTitle}
        onContinue={() => goToStep('lungCapacity', 'continue')}
        onBack={() => goToStep('assessmentReflection', 'back')}
      />
    );
  }

  if (step === 'pact') {
    return (
      <PactScreen
        displayName={name.trim() || null}
        dailyMinutes={dailyMinutes}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onConfirm={() => {
          void saveProfileAndShowPaywall();
        }}
        onBack={() => goToStep('founderNote', 'back')}
      />
    );
  }

  if (step === 'paywall') {
    const mindMap = computeMindMap({
      stressLevel,
      sleepQuality,
      racingLevel,
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
      <>
        <OnboardingPaywallScreen
          offering={paywall.offering}
          selectedPackageId={paywall.selectedPackageId}
          stepIndex={visualStepIndex}
          stepCount={visualStepCount}
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
          onContinueWithoutPro={
            paywallMode === 'hard' && !isPro ? undefined : continueWithoutPro
          }
          onFinalStepReached={() => setHasReachedPlanStep(true)}
        />
        <ExitOfferSheet
          visible={isExitOfferVisible}
          sourceScreen="onboarding_exit_offer"
          onPurchased={() => {
            setIsExitOfferVisible(false);
            void finish('purchase');
          }}
          onRestored={() => {
            setIsExitOfferVisible(false);
            void finish('restore');
          }}
          onDismiss={() => setIsExitOfferVisible(false)}
        />
      </>
    );
  }

  return (
    <IntentQuestionScreen
      selectedIntents={selectedIntents}
      customIntent={customIntent}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      stepIndex={visualStepIndex}
      stepCount={visualStepCount}
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
