import { useEffect, useMemo, useRef, useState } from 'react';
import AgeScreen from './screens/AgeScreen';
import ScienceCredibilityScreen from './screens/ScienceCredibilityScreen';
import BaselineScreen from './screens/BaselineScreen';
import BaselineIntroScreen from './screens/BaselineIntroScreen';
import HeartVariabilityScreen from './screens/HeartVariabilityScreen';
import DailyTimeScreen from './screens/DailyTimeScreen';
import RoutineTimeScreen from './screens/RoutineTimeScreen';
import ConsistencyScreen from './screens/ConsistencyScreen';
import GenderScreen from './screens/GenderScreen';
import IntentQuestionScreen from './screens/IntentQuestionScreen';
import IntentPriorityScreen from './screens/IntentPriorityScreen';
import IntentReflectionScreen from './screens/IntentReflectionScreen';
import IntentProjectionScreen from './screens/IntentProjectionScreen';
import BrainScienceScreen from './screens/BrainScienceScreen';
import ModernBreathingScreen from './screens/ModernBreathingScreen';
import BreathPrimerScreen from './screens/BreathPrimerScreen';
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
import BrainFogScreen from './screens/BrainFogScreen';
import HeartWorryScreen from './screens/HeartWorryScreen';
import StressScreen from './screens/StressScreen';
import PlanIntroScreen from './screens/PlanIntroScreen';
import PlanLoadingScreen from './screens/PlanLoadingScreen';
import DiagnosisScreen from './screens/DiagnosisScreen';
import RecommendedExerciseScreen from './screens/RecommendedExerciseScreen';
import OnboardingPaywallScreen from './screens/OnboardingPaywallScreen';
import ExitOfferSheet from '../paywall/ExitOfferSheet';
import BreathHoldScreen from './screens/BreathHoldScreen';
import BreathHoldBenefitsScreen from './screens/BreathHoldBenefitsScreen';
import DoctorReferralScreen, {
  type DoctorReferral,
} from './screens/DoctorReferralScreen';
import {
  INTENT_OPTIONS,
  PERSONALIZED_INTENT_OPTIONS,
} from './data/intentOptions';
import { techniqueForIntent } from '../../features/exercise/guidedBreathing/techniqueSelection';
import {
  applyPlanTimeOverrides,
  buildOnboardingPlan,
  fromClockString,
  toClockString,
  type OnboardingPlan,
  type PlanActionId,
  type PlanTimeOverrides,
} from '../../lib/onboardingPlan';
import type { GenderOption } from './data/genderOptions';
import type { AcquisitionSourceId } from './data/acquisitionOptions';
import AcquisitionSourceScreen from './screens/AcquisitionSourceScreen';
import { useSaveOnboardingSurveyMutation } from '../../queries/profile/useSaveOnboardingSurveyMutation';
import type {
  CompletedOnboardingBaselineResult,
  OnboardingBreathHoldResult,
  OnboardingIntent,
  OnboardingStep,
} from './types';
import { usePaywall } from '../../hooks/usePaywall';
import { PaywallPlacement } from '../../services/paywall';
import { useUserEntitlementQuery } from '../../queries/subscriptions/useUserEntitlementQuery';
import { useExitOfferStore } from '../../stores/exitOfferStore';
import { projectScores } from '../../lib/paywallPersonalization';
import { buildPlanHighlights } from '../../lib/paywallPlanHighlights';
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
  trackOnboardingAttributionAnswered,
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
import { useUpdateNotificationPreferencesMutation } from '../../queries/notifications/useUpdateNotificationPreferencesMutation';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  ONBOARDING_NOTIFICATION_PREFERENCES,
  type DailyPlanReminderActionId,
  type DailyPlanReminderPreferences,
} from '../../services/notifications/types';
import { useUpdateDailyPlanScheduleMutation } from '../../queries/dailyPlan/useUpdateDailyPlanScheduleMutation';
import { useUpdateDailyPlanExercisesMutation } from '../../queries/dailyPlan/useUpdateDailyPlanExercisesMutation';
import {
  DEFAULT_DAILY_PLAN_SCHEDULE,
  type DailyPlanSchedule,
} from '../../services/dailyPlan/types';
import { buildGrowthAreaSevenDayExercisePlanV2 } from '../../features/exercise/guidedBreathing/domain/dailyExercisePlan';
import { formatLocalDate } from '../../lib/calendar/weekCalendarDays';
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
  breathHold: OnboardingBreathHoldResult | null;
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
  'intentPriority',
  'intentReflection',
  'intentProjection',
  'brainScience',
  'modernBreathing',
  'breathPrimer',
  'name',
  'greeting',
  'acquisitionSource',
  'stress',
  'sleep',
  'brainFog',
  'heartWorry',
  'agreement',
  'experience',
  'assessmentReflection',
  'consistency',
  'scienceCredibility',
  'age',
  'gender',
  'breathHoldBenefits',
  'lungCapacity',
  'dailyTime',
  'wakeTime',
  'sleepTime',
  'doctorReferral',
  'heartVariability',
  'baselineIntro',
  'baseline',
  'planIntro',
  'planLoading',
  'diagnosis',
  'recommendedExercise',
  'attPriming',
  'notifications',
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

function getPlanActionTime(
  plan: OnboardingPlan,
  actionId: PlanActionId,
  fallback: string,
): string {
  const action = plan.actions.find((candidate) => candidate.id === actionId);
  return action == null ? fallback : toClockString(action.minutesFromMidnight);
}

function buildDailyPlanSchedule(plan: OnboardingPlan): DailyPlanSchedule {
  return {
    version: 1,
    timeMode: 'device_local',
    actions: {
      session: getPlanActionTime(
        plan,
        'session',
        DEFAULT_DAILY_PLAN_SCHEDULE.actions.session,
      ),
      handPicked: getPlanActionTime(
        plan,
        'handPicked',
        DEFAULT_DAILY_PLAN_SCHEDULE.actions.handPicked,
      ),
      checkIn: getPlanActionTime(
        plan,
        'checkIn',
        DEFAULT_DAILY_PLAN_SCHEDULE.actions.checkIn,
      ),
    },
  };
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
  const [selectedIntents, setSelectedIntents] = useState<OnboardingIntent[]>([]);
  const [primaryIntent, setPrimaryIntent] = useState<OnboardingIntent | null>(
    null,
  );
  const isOnlyCustomIntent =
    selectedIntents.length === 1 && selectedIntents[0] === 'other';
  const [name, setName] = useState(initialSavedProfile?.displayName ?? '');
  const [stressLevel, setStressLevel] = useState(
    initialSavedProfile?.stressLevel ?? 5,
  );
  const [hasAnsweredStress, setHasAnsweredStress] = useState(false);
  const [sleepQuality, setSleepQuality] = useState(
    initialSavedProfile?.sleepQuality ?? 5,
  );
  const [hasAnsweredSleep, setHasAnsweredSleep] = useState(false);
  const [brainFogLevel, setBrainFogLevel] = useState(5);
  const [hasAnsweredBrainFog, setHasAnsweredBrainFog] = useState(false);
  const [heartWorryLevel, setHeartWorryLevel] = useState(5);
  const [hasAnsweredHeartWorry, setHasAnsweredHeartWorry] = useState(false);
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
    initialSavedProfile?.dailyMinutes ?? 3,
  );
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [acquisitionSource, setAcquisitionSource] =
    useState<AcquisitionSourceId | null>(null);
  const [doctorReferral, setDoctorReferral] = useState<DoctorReferral | null>(
    null,
  );
  const [baseline, setBaseline] =
    useState<CompletedOnboardingBaselineResult | null>(null);
  const [breathHold, setBreathHold] = useState<OnboardingBreathHoldResult | null>(null);
  const [planTimeOverrides, setPlanTimeOverrides] = useState<PlanTimeOverrides>(
    {},
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationErrorMessage, setNotificationErrorMessage] = useState<string | null>(null);
  const [isNotificationSubmitting, setIsNotificationSubmitting] = useState(false);
  const [onboardingReminders, setOnboardingReminders] =
    useState<DailyPlanReminderPreferences>(() => ({
      session: {
        ...ONBOARDING_NOTIFICATION_PREFERENCES.dailyPlanReminders.session,
      },
      handPicked: {
        ...ONBOARDING_NOTIFICATION_PREFERENCES.dailyPlanReminders.handPicked,
      },
      checkIn: {
        ...ONBOARDING_NOTIFICATION_PREFERENCES.dailyPlanReminders.checkIn,
      },
    }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateNotificationPreferences = useUpdateNotificationPreferencesMutation(userId);
  const updateDailyPlanSchedule = useUpdateDailyPlanScheduleMutation(userId);
  const updateDailyPlanExercises = useUpdateDailyPlanExercisesMutation(userId);
  const saveOnboardingSurvey = useSaveOnboardingSurveyMutation(userId);
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
  // the explicit close tap can always reopen the offer.
  const hasAutoShownExitOfferRef = useRef(false);

  const showExitOffer = () => {
    hasAutoShownExitOfferRef.current = true;
    setIsExitOfferVisible(true);
  };

  const selectedOption = useMemo(
    () => PERSONALIZED_INTENT_OPTIONS.find((option) => option.id === primaryIntent) ?? null,
    [primaryIntent],
  );
  const selectedGoalPhrases = useMemo(
    () =>
      selectedIntents.reduce<string[]>((phrases, intentId) => {
        const option = PERSONALIZED_INTENT_OPTIONS.find(
          (candidate) => candidate.id === intentId,
        );
        if (option) phrases.push(option.goalPhrase);
        return phrases;
      }, []),
    [selectedIntents],
  );

  const visibleStepOrder = useMemo(
    () =>
      STEP_ORDER.filter((candidate) => {
        if (!INTENT_REFLECTION_ENABLED && candidate === 'intentReflection') {
          return false;
        }
        if (candidate === 'intentPriority' && selectedIntents.length < 2) {
          return false;
        }
        if (isOnlyCustomIntent && candidate === 'intentProjection') {
          return false;
        }
        return true;
      }),
    [isOnlyCustomIntent, selectedIntents.length],
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
      has_display_name: (profile?.displayName ?? null) != null,
      has_default_technique: (profile?.defaultTechniqueId ?? null) != null,
      has_stress_level: (profile?.stressLevel ?? null) != null,
      has_sleep_quality: (profile?.sleepQuality ?? null) != null,
      has_brain_fog_level: hasAnsweredBrainFog,
      brain_fog_level: hasAnsweredBrainFog ? brainFogLevel : null,
      agreement_response_count: Object.values(agreementResponses).filter(
        (value) => value != null,
      ).length,
      has_experience_level: (profile?.experienceLevel ?? null) != null,
      has_age: (profile?.age ?? null) != null,
      has_gender: (profile?.gender ?? null) != null,
      has_daily_minutes: (profile?.dailyMinutes ?? null) != null,
      has_lung_capacity: (profile?.breathHold ?? null) != null,
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

  const toggleIntent = (intentId: OnboardingIntent) => {
    if (isSubmitting) return;
    const isSelected = selectedIntents.includes(intentId);
    const nextSelectedIntents = isSelected
      ? selectedIntents.filter((id) => id !== intentId)
      : [...selectedIntents, intentId];

    setSelectedIntents(nextSelectedIntents);
    if (isSelected && primaryIntent === intentId) {
      setPrimaryIntent(null);
    }
    trackOnboardingIntentUpdated({
      ...getStepEventInput('intent'),
      intentId,
      selected: !isSelected,
      selectedIntentCount: nextSelectedIntents.length,
    });
    setErrorMessage(null);
  };

  const continueAfterIntentPriority = (
    nextPrimaryIntent: OnboardingIntent,
    properties: OnboardingAnalyticsProperties,
  ) => {
    const nextProperties = {
      ...properties,
      primary_intent_id: nextPrimaryIntent,
    };

    if (isOnlyCustomIntent) {
      goToStep('brainScience', 'continue', nextProperties);
      return;
    }
    if (INTENT_REFLECTION_ENABLED) {
      goToStep('intentReflection', 'continue', nextProperties);
      return;
    }
    goToStep('intentProjection', 'continue', nextProperties);
  };

  const goFromIntent = () => {
    if (selectedIntents.length === 0 || isSubmitting) return;
    const properties = {
      selected_intent_count: selectedIntents.length,
      only_custom_intent: isOnlyCustomIntent,
    };

    if (selectedIntents.length === 1) {
      const onlyIntent = selectedIntents[0];
      setPrimaryIntent(onlyIntent);
      continueAfterIntentPriority(onlyIntent, properties);
      return;
    }

    goToStep('intentPriority', 'continue', {
      ...properties,
      primary_intent_id: primaryIntent,
    });
  };

  const buildOnboardingGoal = () => {
    const parts: string[] = [];
    for (const id of selectedIntents) {
      const option = INTENT_OPTIONS.find((o) => o.id === id);
      if (option) parts.push(option.title);
      else parts.push(id);
    }
    return parts.join(', ');
  };

  // Persisted on tap rather than on continue so the answer survives an
  // abandoned onboarding. Analytics-only data, so a failed write is logged and
  // swallowed — it must never block the flow.
  const recordAcquisitionSource = (source: AcquisitionSourceId | 'skipped') => {
    if (source !== 'skipped') {
      setAcquisitionSource(source);
    }

    trackOnboardingAttributionAnswered({
      ...getStepEventInput(),
      acquisitionSource: source,
    });

    saveOnboardingSurvey.mutate(
      { acquisitionSource: source },
      {
        onError: (error) => {
          console.warn(
            '[onboarding-survey] acquisition source save failed',
            getErrorMessage(error),
          );
        },
      },
    );
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
      // The slider's 0 stop means "30 seconds"; the DB column holds whole minutes.
      dailyMinutes: Math.max(1, dailyMinutes),
      defaultTechniqueId:
        primaryIntent != null
          ? techniqueForIntent(primaryIntent)
          : initialSavedProfile?.defaultTechniqueId ?? null,
      breathHold,
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
      hasDisplayName: result.displayName != null,
      hasDefaultTechnique: result.defaultTechniqueId != null,
      hasLungCapacity: result.breathHold != null,
    });

    try {
      trackOnboardingProfileSaveStarted({
        ...getStepEventInput(),
        ...buildProfileAnalyticsProperties(result),
      });
      if (userId == null) {
        throw new Error('Cannot save onboarding without a signed-in user.');
      }
      const schedule = buildDailyPlanSchedule(plan);
      const exercisePlan = buildGrowthAreaSevenDayExercisePlanV2({
        primaryTechniqueId: result.defaultTechniqueId,
        growthAreaAxis: planMindMap.growthArea.axis,
        startsOn: formatLocalDate(new Date()),
      });
      await Promise.all([
        (async () => {
          // The profile owns the user_preferences row through its foreign key,
          // so save it before persisting the independent plan preferences.
          await onSaveProfile(result);
          await Promise.all([
            updateDailyPlanSchedule.mutateAsync(schedule),
            updateDailyPlanExercises.mutateAsync(exercisePlan),
          ]);
        })(),
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

  const enableNotifications = async () => {
    if (isNotificationSubmitting) return;

    setIsNotificationSubmitting(true);
    setNotificationErrorMessage(null);

    try {
      const schedule = buildDailyPlanSchedule(plan);
      const hasEnabledReminder = Object.values(onboardingReminders).some(
        (reminder) => reminder.enabled,
      );
      const permissionStatus = hasEnabledReminder
        ? await requestNotificationPermissions()
        : 'undetermined';
      trackNotificationPermissionResult({ status: permissionStatus, source: 'onboarding' });

      if (userId != null) {
        const reminders =
          permissionStatus === 'granted'
            ? onboardingReminders
            : DEFAULT_NOTIFICATION_PREFERENCES.dailyPlanReminders;
        await Promise.all([
          updateDailyPlanSchedule.mutateAsync(schedule),
          updateNotificationPreferences.mutateAsync({
            dailyPlanReminders: reminders,
            trialEndingReminder:
              DEFAULT_NOTIFICATION_PREFERENCES.trialEndingReminder,
          }),
        ]);
      }

      void requestStoreReview().finally(() =>
        goToStep('pact', 'continue', {
          notification_status: permissionStatus,
        }),
      );
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
      void requestStoreReview().finally(() => goToStep('pact', 'skip'));
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

  if (step === 'intentPriority' && selectedIntents.length >= 2) {
    return (
      <IntentPriorityScreen
        selectedIntents={selectedIntents}
        primaryIntent={primaryIntent}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        isSubmitting={isSubmitting}
        onSelect={setPrimaryIntent}
        onContinue={() => {
          if (primaryIntent == null || !selectedIntents.includes(primaryIntent)) {
            return;
          }
          continueAfterIntentPriority(primaryIntent, {
            selected_intent_count: selectedIntents.length,
            only_custom_intent: isOnlyCustomIntent,
          });
        }}
        onBack={() => goToStep('intent', 'back')}
      />
    );
  }

  if (step === 'intentReflection' && selectedOption) {
    return (
      <IntentReflectionScreen
        option={selectedOption}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        isSubmitting={isSubmitting}
        onContinue={() => goToStep('intentProjection', 'continue')}
        onBack={() =>
          goToStep(
            selectedIntents.length >= 2 ? 'intentPriority' : 'intent',
            'back',
          )
        }
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
          goToStep(
            INTENT_REFLECTION_ENABLED
              ? 'intentReflection'
              : selectedIntents.length >= 2
                ? 'intentPriority'
                : 'intent',
            'back',
          )
        }
      />
    );
  }

  if (step === 'brainScience') {
    return (
      <BrainScienceScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('modernBreathing', 'continue')}
        onBack={() =>
          goToStep(isOnlyCustomIntent ? 'intent' : 'intentProjection', 'back')
        }
      />
    );
  }

  if (step === 'modernBreathing') {
    return (
      <ModernBreathingScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('breathPrimer', 'continue')}
        onBack={() => goToStep('brainScience', 'back')}
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
        onBack={() => goToStep('breathPrimer', 'back')}
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
        onContinue={() => goToStep('acquisitionSource', 'continue')}
        onBack={() => goToStep('name', 'back')}
      />
    );
  }

  if (step === 'acquisitionSource') {
    return (
      <AcquisitionSourceScreen
        value={acquisitionSource}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={recordAcquisitionSource}
        onContinue={() =>
          goToStep('stress', 'continue', {
            acquisition_source: acquisitionSource,
          })
        }
        onBack={() => goToStep('greeting', 'back')}
        onSkip={() => {
          recordAcquisitionSource('skipped');
          goToStep('stress', 'skip');
        }}
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
        onContinue={() => {
          setHasAnsweredStress(true);
          goToStep('sleep', 'continue', { has_stress_level: true });
        }}
        onBack={() => goToStep('acquisitionSource', 'back')}
        onSkip={() => {
          setHasAnsweredStress(false);
          goToStep('sleep', 'skip');
        }}
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
        onContinue={() => {
          setHasAnsweredSleep(true);
          goToStep('brainFog', 'continue', { has_sleep_quality: true });
        }}
        onBack={() => goToStep('stress', 'back')}
        onSkip={() => {
          setHasAnsweredSleep(false);
          goToStep('brainFog', 'skip');
        }}
      />
    );
  }

  if (step === 'brainFog') {
    return (
      <BrainFogScreen
        value={brainFogLevel}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setBrainFogLevel}
        onContinue={() => {
          setHasAnsweredBrainFog(true);
          goToStep('heartWorry', 'continue', { has_brain_fog_level: true });
        }}
        onBack={() => goToStep('sleep', 'back')}
        onSkip={() => {
          setHasAnsweredBrainFog(false);
          goToStep('heartWorry', 'skip');
        }}
      />
    );
  }

  if (step === 'heartWorry') {
    return (
      <HeartWorryScreen
        value={heartWorryLevel}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setHeartWorryLevel}
        onContinue={() => {
          setHasAnsweredHeartWorry(true);
          goToStep('agreement', 'continue', { has_heart_worry_level: true });
        }}
        onBack={() => goToStep('brainFog', 'back')}
        onSkip={() => {
          setHasAnsweredHeartWorry(false);
          goToStep('agreement', 'skip');
        }}
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
        onBack={() => goToStep('heartWorry', 'back')}
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
        stressLevel={hasAnsweredStress ? stressLevel : null}
        sleepQuality={hasAnsweredSleep ? sleepQuality : null}
        heartWorryLevel={hasAnsweredHeartWorry ? heartWorryLevel : null}
        agreementResponses={agreementResponses}
        experienceLevel={experienceLevel}
        intentOption={selectedOption}
        goalPhrases={selectedGoalPhrases}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('consistency', 'continue')}
        onBack={() => goToStep('experience', 'back')}
      />
    );
  }

  if (step === 'breathHoldBenefits') {
    return (
      <BreathHoldBenefitsScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('lungCapacity', 'continue')}
        onBack={() => goToStep('gender', 'back')}
        onSkip={() => goToStep('lungCapacity', 'skip')}
      />
    );
  }

  if (step === 'lungCapacity') {
    return (
      <BreathHoldScreen
        age={age}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={(result) => {
          setBreathHold(result);
          goToStep('dailyTime', 'continue', { has_lung_capacity: true });
        }}
        onBack={() => goToStep('breathHoldBenefits', 'back')}
        onSkip={() => goToStep('dailyTime', 'skip')}
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
        onBack={() => goToStep('scienceCredibility', 'back')}
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
        onContinue={() =>
          goToStep('breathHoldBenefits', 'continue', {
            has_gender: gender != null,
          })
        }
        onBack={() => goToStep('age', 'back')}
        onSkip={() => goToStep('breathHoldBenefits', 'skip')}
      />
    );
  }

  if (step === 'consistency') {
    return (
      <ConsistencyScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('scienceCredibility', 'continue')}
        onBack={() => goToStep('assessmentReflection', 'back')}
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
        onContinue={() =>
          goToStep('wakeTime', 'continue', { has_daily_minutes: true })
        }
        onBack={() => goToStep('lungCapacity', 'back')}
        onSkip={() => goToStep('wakeTime', 'skip')}
      />
    );
  }

  if (step === 'wakeTime') {
    return (
      <RoutineTimeScreen
        key="wakeTime"
        title="When do you usually wake up?"
        subtitle="We’ll use this to fit your plan naturally into your day."
        pickerTitle="Set wake-up time"
        value={wakeTime}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setWakeTime}
        onContinue={() => goToStep('sleepTime', 'continue')}
        onBack={() => goToStep('dailyTime', 'back')}
      />
    );
  }

  if (step === 'sleepTime') {
    return (
      <RoutineTimeScreen
        key="sleepTime"
        title="When do you usually go to sleep?"
        subtitle="We’ll keep your evening exercises close to your wind-down routine."
        pickerTitle="Set sleep time"
        value={sleepTime}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setSleepTime}
        onContinue={() => goToStep('doctorReferral', 'continue')}
        onBack={() => goToStep('wakeTime', 'back')}
      />
    );
  }

  if (step === 'doctorReferral') {
    return (
      <DoctorReferralScreen
        value={doctorReferral}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setDoctorReferral}
        onContinue={() =>
          goToStep('heartVariability', 'continue', {
            doctor_referral: doctorReferral,
          })
        }
        onBack={() => goToStep('sleepTime', 'back')}
        onSkip={() => goToStep('heartVariability', 'skip')}
      />
    );
  }

  if (step === 'heartVariability') {
    return (
      <HeartVariabilityScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('baselineIntro', 'continue')}
        onBack={() => goToStep('doctorReferral', 'back')}
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
        onBack={() => goToStep('heartVariability', 'back')}
      />
    );
  }

  if (step === 'baseline') {
    return (
      <BaselineScreen
        age={age}
        gender={gender}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={(result) => {
          setBaseline(result);
          goToStep('planIntro', 'continue', {
            baseline_completed: true,
            has_baseline_bpm: true,
            has_baseline_drop: result.bpmDrop != null,
          });
        }}
        onSkip={(attempt) => {
          goToStep('planIntro', attempt.completed ? 'continue' : 'skip', {
            baseline_completed: attempt.completed,
            has_baseline_bpm: false,
            has_baseline_drop: false,
          });
        }}
        onBack={() => goToStep('baselineIntro', 'back')}
      />
    );
  }

  if (step === 'planIntro') {
    return (
      <PlanIntroScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('planLoading', 'continue')}
        onBack={() => goToStep('baseline', 'back')}
      />
    );
  }

  const plan = applyPlanTimeOverrides(
    buildOnboardingPlan({
      intents: primaryIntent ? [primaryIntent] : selectedIntents,
      stressLevel,
      sleepQuality,
      age,
      dailyMinutes,
      wakeTimeMinutes: fromClockString(wakeTime) ?? 7 * 60,
      sleepTimeMinutes: fromClockString(sleepTime) ?? 22 * 60,
      breathHoldSeconds: breathHold?.holdSeconds ?? null,
    }),
    planTimeOverrides,
  );

  const planMindMap = computeMindMap({
    stressLevel,
    sleepQuality,
    agreementResponses,
  });
  if (step === 'planLoading') {
    return <PlanLoadingScreen onDone={() => goToStep('diagnosis', 'auto')} />;
  }

  if (step === 'diagnosis') {
    return (
      <DiagnosisScreen
        age={age}
        scores={planMindMap.scores}
        superpower={planMindMap.superpower}
        growthArea={planMindMap.growthArea}
        holdSeconds={breathHold?.holdSeconds ?? null}
        lungAgeYears={breathHold?.lungAgeYears ?? null}
        restingBpm={baseline?.avgBpm ?? null}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('recommendedExercise', 'continue')}
        onBack={() => goToStep('planIntro', 'back')}
      />
    );
  }

  if (step === 'recommendedExercise') {
    return (
      <RecommendedExerciseScreen
        plan={plan}
        currentScores={planMindMap.scores}
        targetScores={projectScores(planMindMap.scores)}
        growthArea={planMindMap.growthArea}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChangeActionTime={(actionId, minutesFromMidnight) =>
          setPlanTimeOverrides((current) => ({
            ...current,
            [actionId]: minutesFromMidnight,
          }))
        }
        onContinue={() => goToStep('attPriming', 'continue')}
        onBack={() => goToStep('diagnosis', 'back')}
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

  if (step === 'notifications') {
    return (
      <NotificationPermissionScreen
        schedule={buildDailyPlanSchedule(plan)}
        reminders={onboardingReminders}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        isSubmitting={isNotificationSubmitting}
        errorMessage={notificationErrorMessage}
        onReminderEnabledChange={(
          actionId: DailyPlanReminderActionId,
          enabled: boolean,
        ) => {
          setOnboardingReminders((current) => ({
            ...current,
            [actionId]: { enabled },
          }));
        }}
        onEnable={() => {
          void enableNotifications();
        }}
        onSkip={() => {
          void skipNotifications();
        }}
        onBack={() => goToStep('attPriming', 'back')}
      />
    );
  }

  if (step === 'breathPrimer') {
    return (
      <BreathPrimerScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goToStep('name', 'continue')}
        onBack={() => goToStep('modernBreathing', 'back')}
        onSkip={() => goToStep('name', 'skip')}
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
        onContinue={() => goToStep('age', 'continue')}
        onBack={() => goToStep('consistency', 'back')}
      />
    );
  }

  if (step === 'pact') {
    return (
      <PactScreen
        dailyMinutes={dailyMinutes}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onConfirm={() => {
          void saveProfileAndShowPaywall();
        }}
        onBack={() => goToStep('notifications', 'back')}
      />
    );
  }

  if (step === 'paywall') {
    return (
      <>
        <OnboardingPaywallScreen
          offering={paywall.offering}
          planHighlights={buildPlanHighlights({
            plan,
            growthArea: planMindMap.growthArea,
            holdSeconds: breathHold?.holdSeconds ?? null,
          })}
          name={name}
          selectedPackageId={paywall.selectedPackageId}
          stepIndex={visualStepIndex}
          stepCount={visualStepCount}
          isLoading={paywall.isLoading}
          isPurchasing={paywall.isPurchasing}
          isRestoring={paywall.isRestoring}
          isCompleting={isSubmitting || isSavingProfile || isCompletingOnboarding}
          errorMessage={paywall.errorMessage ?? errorMessage}
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
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      stepIndex={visualStepIndex}
      stepCount={visualStepCount}
      onToggle={toggleIntent}
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
