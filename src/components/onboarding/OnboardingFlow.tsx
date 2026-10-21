import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { GREETING_ANIMATION } from './greetingAnimation';
import { useQueryClient } from '@tanstack/react-query';
import { getProgramEnrollmentQueryKey } from '../../queries/program/useProgramEnrollmentQuery';
import RecommendedHabitsScreen from './screens/RecommendedHabitsScreen';
import HabitPicksScreen from './screens/HabitPicksScreen';
import AdhdSupportScreen from './screens/AdhdSupportScreen';
import GreatDaysScreen from './screens/GreatDaysScreen';
import DailyTimeScreen from './screens/DailyTimeScreen';
import RoutineTimeScreen from './screens/RoutineTimeScreen';
import OnboardingChoiceScreen from './OnboardingChoiceScreen';
import {
  CHORES_OVERWHELM_OPTIONS,
  FALLING_BEHIND_OPTIONS,
  HABIT_MOTIVATION_OPTIONS,
  LIFESTYLE_HAPPINESS_OPTIONS,
  SCROLL_INSTEAD_OPTIONS,
  SKIP_SELF_CARE_OPTIONS,
  DRAINED_FREQUENCY_OPTIONS,
  UNTAPPED_POTENTIAL_OPTIONS,
  WISH_UNDERSTOOD_OPTIONS,
  DOING_IT_FOR_OPTIONS,
  LOSE_MOTIVATION_OPTIONS,
  HABIT_ATTEMPTS_OPTIONS,
  HABIT_RESTART_FREQUENCY_OPTIONS,
  SELF_DISCIPLINE_OPTIONS,
  PUT_OTHERS_FIRST_OPTIONS,
  SACRIFICE_OPTIONS,
  SOCIAL_MEDIA_OPTIONS,
  PUT_OFF_GUILT_OPTIONS,
  DISTRACTION_OPTIONS,
  PROCRASTINATION_AREA_OPTIONS,
  PROCRASTINATION_REASON_OPTIONS,
  ROUTINE_HAPPINESS_OPTIONS,
  SLEEP_CAUSE_OPTIONS,
  STRESS_SIGNAL_OPTIONS,
  STRESS_AWARENESS_OPTIONS,
  SLEEP_DURATION_OPTIONS,
  WAKE_EASE_OPTIONS,
  DAY_ENERGY_OPTIONS,
  SUPPORT_SYSTEM_OPTIONS,
  ADHD_STATUS_OPTIONS,
  MENTAL_HEALTH_OPTIONS,
  HOME_FEELING_OPTIONS,
  HOME_ATMOSPHERE_OPTIONS,
  PLAN_BOOST_OPTIONS,
  CBT_FAMILIARITY_OPTIONS,
  type FamiliarityId,
  type ChoresOverwhelmId,
  type FallingBehindId,
  type HabitMotivationId,
  type LifestyleHappinessId,
  type ScrollInsteadId,
  type SkipSelfCareId,
  type DrainedFrequencyId,
  type UntappedPotentialId,
  type WishUnderstoodId,
  type DoingItForId,
  type LoseMotivationId,
  type HabitAttemptsId,
  type HabitRestartFrequencyId,
  type SelfDisciplineId,
  type PutOthersFirstId,
  type SacrificeId,
  type SocialMediaId,
  type PutOffGuiltId,
  type DistractionId,
  type ProcrastinationAreaId,
  type ProcrastinationReasonId,
  type RoutineHappinessId,
  type SleepCauseId,
  type StressSignalId,
  type StressAwarenessId,
  type SleepDurationId,
  type WakeEaseId,
  type UsageStyleId,
  type DayEnergyId,
  type SupportSystemId,
  type AdhdStatus,
  type MentalHealthId,
  type StruggleId,
  STRUGGLE_OPTIONS,
  type HomeFeelingId,
  type HomeAtmosphereId,
  type PlanBoostId,
} from './data/routineOptions';
import {
  OnboardingProgressProvider,
  useOnboardingSectionLabelSync,
} from './onboardingProgress';
import UsageStyleScreen from './screens/UsageStyleScreen';
import IntentQuestionScreen from './screens/IntentQuestionScreen';
import IntentPriorityScreen from './screens/IntentPriorityScreen';
import GoalProofScreen from './screens/GoalProofScreen';
import HabitsFocusInsightScreen from './screens/HabitsFocusInsightScreen';
import HabitsFocusScienceScreen from './screens/HabitsFocusScienceScreen';
import ChalkboardScreen from './screens/ChalkboardScreen';
import BeforeAfterScreen from './screens/BeforeAfterScreen';
import HalfwayScreen from './screens/HalfwayScreen';
import PlanBenefitsScreen from './screens/PlanBenefitsScreen';
import type { AgreementValue } from '../../lib/onboardingAgreement';
import NameScreen from './screens/NameScreen';
import GreetingScreen from './screens/GreetingScreen';
import AgeScreen from './screens/AgeScreen';
import GenderScreen from './screens/GenderScreen';
import DoctorReferralScreen, {
  type DoctorReferral,
} from './screens/DoctorReferralScreen';
import ExpertReviewScreen from './screens/ExpertReviewScreen';
import CommunityProofScreen from './screens/CommunityProofScreen';
import AzoMessageScreen from './screens/AzoMessageScreen';
import AzoChatScreen from './screens/AzoChatScreen';
import PersonalizeIntroScreen from './screens/PersonalizeIntroScreen';
import AttPrimingScreen from './screens/AttPrimingScreen';
import PactScreen from './screens/PactScreen';
import NotificationPermissionScreen from './screens/NotificationPermissionScreen';
import SleepScreen from './screens/SleepScreen';
import StressScreen from './screens/StressScreen';
import SleepInsightScreen from './screens/SleepInsightScreen';
import PiecesTogetherScreen from './screens/PiecesTogetherScreen';
import PlanIntroScreen from './screens/PlanIntroScreen';
import PlanLoadingScreen, {
  type PlanLoadingInterruptId,
} from './screens/PlanLoadingScreen';
import HabitCurveScreen from './screens/HabitCurveScreen';
import PlanDaysScreen from './screens/PlanDaysScreen';
import { buildOnboardingTodayPreview } from '../../lib/onboardingTodayPreview';
import PlanRevealScreen from './screens/PlanRevealScreen';
import {
  acceptedStarterPlanItems,
  buildStarterPlan,
  starterPlanDrafts,
  type StarterPlanDecisions,
} from '../../lib/onboardingStarterPlan';
import { habitPicksFor } from '../../lib/onboardingHabitPicks';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useCreateSelfCareGoalsMutation } from '../../queries/selfCare/useCreateSelfCareGoalsMutation';
import OnboardingPaywallScreen from './screens/OnboardingPaywallScreen';
import ExitOfferSheet from '../paywall/ExitOfferSheet';
import type { ExitOfferTrigger } from '../../services/analytics/exitOffer';
import {
  INTENT_OPTIONS,
  ONBOARDING_INTENT_LOOKUP_OPTIONS,
  chosenGoalPhrase,
} from './data/intentOptions';
import { techniqueForIntent } from '../../features/exercise/guidedBreathing/techniqueSelection';
import { habitsToBreakFor } from './data/habitsToBreak';
import {
  buildOnboardingPlan,
  fromClockString,
  toClockString,
  type OnboardingPlan,
} from '../../lib/onboardingPlan';
import type { GenderOption } from './data/genderOptions';
import { projectScores } from '../../lib/paywallPersonalization';
import type { AcquisitionSourceId } from './data/acquisitionOptions';
import AcquisitionSourceScreen from './screens/AcquisitionSourceScreen';
import { useSaveOnboardingSurveyMutation } from '../../queries/profile/useSaveOnboardingSurveyMutation';
import { pressureLessonTrackForIntent } from '../../features/lessons/domain/pressureLessonTrack';
import { phoneLessonTrackForIntent } from '../../features/lessons/domain/phoneLessonTrack';
import { startProgramEnrollment } from '../../services/program/programEnrollmentService';
import type { OnboardingIntent, OnboardingStep } from './types';
import {
  activeOnboardingContext,
  adjacentOnboardingStep,
  INTENT_DEPTH_STEPS,
  onboardingSectionLabel,
  onboardingSections,
  onboardingStepOrder,
} from './onboardingStepOrder';
import { usePaywall } from '../../hooks/usePaywall';
import { getPaywallOffering, PaywallPlacement } from '../../services/paywall';
import type { PaywallPackageId } from '../../services/paywall';
import { useUserEntitlementQuery } from '../../queries/subscriptions/useUserEntitlementQuery';
import { setTourSeen } from '../../services/preferences/tourSeenPreference';
import { useTourStore } from '../../features/tour/tourStore';
import { useExitOfferStore } from '../../stores/exitOfferStore';
import { onboardingPresetFor } from '../../lib/onboardingPreset';
import {
  buildIntentTitleLookup,
  resolvePlanIntents,
} from '../../lib/planProgress';
import { computeMindMap } from '../../lib/onboardingScores';
import { echoOption, echoSingle } from '../../lib/onboardingEcho';
import { intentFollowUpsFor, stakesBenefitFor, triedEchoFor } from './data/intentFollowUps';
import { describeStressBand } from '../../lib/onboardingLoad';
import { buildPiecesTogetherSubtitle } from '../../lib/onboardingPiecesTogether';
import { useAuthStore } from '../../stores/authStore';
import { requestNotificationPermissions } from '../../services/notifications/notificationClient';
import { requestAttPermissionOnce } from '../../services/attribution/attPrompt';
import { initAppsFlyer } from '../../services/attribution/appsFlyerClient';
import { logAppsFlyerDiagnostics } from '../../services/attribution/appsFlyerDiagnostics';
import { collectRevenueCatDeviceIdentifiers } from '../../services/subscriptions/revenueCatClient';
import { syncRevenueCatAttributionForCurrentUser } from '../../services/subscriptions/revenueCatIdentitySync';
import { trackNotificationPermissionResult } from '../../services/analytics/tracking';
import { maybeRequestOnboardingReview } from '../../services/reviews/storeReview';
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
} from '../../services/notifications/types';
import { useUpdateDailyPlanScheduleMutation } from '../../queries/dailyPlan/useUpdateDailyPlanScheduleMutation';
import { useUpdateDailyPlanExercisesMutation } from '../../queries/dailyPlan/useUpdateDailyPlanExercisesMutation';
import {
  DEFAULT_DAILY_PLAN_SCHEDULE,
  type DailyPlanSchedule,
} from '../../services/dailyPlan/types';
import type { DailyPlanActionId } from '../../services/dailyPlan/dailyPlanScheduleCore';
import { buildGrowthAreaSevenDayExercisePlanV2 } from '../../features/exercise/guidedBreathing/domain/dailyExercisePlan';
import { formatLocalDate } from '../../lib/calendar/weekCalendarDays';
import { buildOnboardingSaveFailureDiagnostics } from '../../queries/profile/onboardingSaveDiagnostics';
import type { SavedOnboardingProfile } from '../../services/profile/onboardingStatusService';
import { changedOnboardingAnswers } from '../../services/profile/onboardingAnswers';
import { saveOnboardingAnswers } from '../../services/profile/onboardingAnswersService';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { resetTodayJourneyOrderAfterOnboarding } from '../../services/preferences/todayJourneyOrder';

export interface OnboardingFlowResult {
  onboardingGoal: string;
  displayName: string | null;
  stressLevel: number | null;
  sleepQuality: number | null;
  agreementResponses: Record<string, AgreementValue | null>;
  age: number | null;
  gender: GenderOption['id'] | null;
  dailyMinutes: number | null;
  defaultTechniqueId: string | null;
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

type IntentDepthStep = (typeof INTENT_DEPTH_STEPS)[number];

const VISUAL_PROGRESS_STEP_COUNT = 100;
const FRONT_LOADED_PROGRESS_EXPONENT = 0.65;
const EXIT_OFFER_IDLE_MS = 40_000;

function computeFrontLoadedProgress(stepIndex: number, stepCount: number) {
  if (stepCount <= 0) return 0;
  const rawProgress = Math.max(0, Math.min(1, stepIndex / stepCount));
  return Math.pow(rawProgress, FRONT_LOADED_PROGRESS_EXPONENT);
}

/**
 * A list where one option means "none of the above" and clears the rest, and
 * any real pick clears it. `mentalHealth` and `struggles` ask this way.
 */
function toggleExclusiveNone<Id extends string>(current: Id[], id: Id): Id[] {
  if (id === 'none') return current.includes(id) ? [] : [id];
  const without = current.filter((entry) => entry !== 'none');
  return without.includes(id)
    ? without.filter((entry) => entry !== id)
    : [...without, id];
}

/** Half an hour before the hour they said they sleep. */
const WIND_DOWN_BEFORE_SLEEP_MINUTES = 30;

/**
 * The hour each of the plan's three slots sits at.
 *
 * The plan asks for one exercise on day one and three by the end, and all three
 * hours are settled here rather than a week at a time: the answers that place
 * them are in hand now, and asking again in week five would be asking about a
 * routine they have since changed.
 */
function planSlotTimes(
  plan: OnboardingPlan,
  sleepTimeMinutes: number | null,
): Record<DailyPlanActionId, number> {
  const fromPlan = (slot: 'session' | 'handPicked'): number =>
    plan.actions.find((action) => action.id === slot)?.minutesFromMidnight ??
    fromClockString(DEFAULT_DAILY_PLAN_SCHEDULE.actions[slot]) ??
    0;

  return {
    session: fromPlan('session'),
    handPicked: fromPlan('handPicked'),
    windDown:
      sleepTimeMinutes == null
        ? fromClockString(DEFAULT_DAILY_PLAN_SCHEDULE.actions.windDown) ?? 0
        : sleepTimeMinutes - WIND_DOWN_BEFORE_SLEEP_MINUTES,
  };
}

/** Authored constants, so this is built once rather than per render. */
const INTENT_TITLES = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);

function buildDailyPlanSchedule(
  slotTimes: Record<DailyPlanActionId, number>,
): DailyPlanSchedule {
  return {
    version: 1,
    timeMode: 'device_local',
    actions: {
      session: toClockString(slotTimes.session),
      handPicked: toClockString(slotTimes.handPicked),
      windDown: toClockString(slotTimes.windDown),
    },
  };
}

type OnboardingTransitionAction = 'continue' | 'skip' | 'back' | 'auto';
type OnboardingAnalyticsProperties = Record<string, string | number | boolean | null>;

function OnboardingFlowSteps({
  greetingReady,
  initialSavedProfile = null,
  isSavingProfile = false,
  isCompletingOnboarding = false,
  onSaveProfile,
  onComplete,
}: OnboardingFlowProps & { greetingReady: boolean }) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const isPro = useUserEntitlementQuery(userId).data?.isPro === true;
  const [step, setStep] = useState<OnboardingStep>(
    initialSavedProfile == null ? 'azoChatInvite' : 'paywall',
  );
  const [azoChatAnswers, setAzoChatAnswers] = useState<string[]>([]);

  /**
   * A resumed profile rejoins at the paywall, so the goal questions are never
   * asked again — but the plan is still built from the answers. Left empty, the
   * flow would enroll them on the fallback plan while their saved goal says
   * something else, and Home reads that goal: the header would name one plan and
   * the days would come from another.
   */
  const savedIntents = resolvePlanIntents(
    initialSavedProfile?.onboardingGoal,
    INTENT_TITLES,
  );
  const [selectedIntents, setSelectedIntents] =
    useState<OnboardingIntent[]>(savedIntents);
  const [primaryIntent, setPrimaryIntent] = useState<OnboardingIntent | null>(
    savedIntents[0] ?? null,
  );
  const isOnlyCustomIntent =
    selectedIntents.length === 1 && selectedIntents[0] === 'other';
  const [name, setName] = useState(initialSavedProfile?.displayName ?? '');
  const [stressLevel, setStressLevel] = useState(
    initialSavedProfile?.stressLevel ?? 5,
  );
  const [sleepQuality, setSleepQuality] = useState(
    initialSavedProfile?.sleepQuality ?? 5,
  );
  const [sleepDuration, setSleepDuration] = useState<SleepDurationId | null>(
    null,
  );
  const [wakeEase, setWakeEase] = useState<WakeEaseId | null>(null);
  const [usageStyles, setUsageStyles] = useState<UsageStyleId[]>([]);
  const [dayEnergy, setDayEnergy] = useState<DayEnergyId | null>(null);
  const [routineHappiness, setRoutineHappiness] =
    useState<RoutineHappinessId | null>(null);
  const [choresOverwhelm, setChoresOverwhelm] =
    useState<ChoresOverwhelmId | null>(null);
  const [socialMedia, setSocialMedia] = useState<SocialMediaId | null>(null);
  const [fallingBehind, setFallingBehind] = useState<FallingBehindId | null>(null);
  const [lifestyleHappiness, setLifestyleHappiness] =
    useState<LifestyleHappinessId | null>(null);
  const [habitMotivations, setHabitMotivations] = useState<HabitMotivationId[]>([]);
  const [scrollInstead, setScrollInstead] = useState<ScrollInsteadId | null>(null);
  const [skipSelfCare, setSkipSelfCare] = useState<SkipSelfCareId | null>(null);
  const [drainedFrequency, setDrainedFrequency] = useState<DrainedFrequencyId | null>(null);
  const [untappedPotential, setUntappedPotential] = useState<UntappedPotentialId | null>(null);
  const [doingItFor, setDoingItFor] = useState<DoingItForId[]>([]);
  const [loseMotivation, setLoseMotivation] = useState<LoseMotivationId | null>(null);
  const [habitAttempts, setHabitAttempts] = useState<HabitAttemptsId | null>(null);
  const [habitRestartFrequency, setHabitRestartFrequency] = useState<HabitRestartFrequencyId | null>(null);
  const [selfDiscipline, setSelfDiscipline] = useState<SelfDisciplineId | null>(null);
  const [putOthersFirst, setPutOthersFirst] = useState<PutOthersFirstId | null>(null);
  const [sacrificeForOthers, setSacrificeForOthers] = useState<SacrificeId[]>([]);
  const [wishUnderstood, setWishUnderstood] = useState<WishUnderstoodId[]>([]);
  const [putOffGuilt, setPutOffGuilt] = useState<PutOffGuiltId | null>(null);
  const [distraction, setDistraction] = useState<DistractionId | null>(null);
  const [procrastinationAreas, setProcrastinationAreas] = useState<
    ProcrastinationAreaId[]
  >([]);
  const [procrastinationReasons, setProcrastinationReasons] = useState<
    ProcrastinationReasonId[]
  >([]);
  const [intentFollowUpAnswers, setIntentFollowUpAnswers] = useState<
    Record<string, string[]>
  >({});
  const [habitPickIds, setHabitPickIds] = useState<string[]>([]);
  const [starterPlanDecisions, setStarterPlanDecisions] =
    useState<StarterPlanDecisions>({});
  const [sleepCause, setSleepCause] = useState<SleepCauseId | null>(null);
  const [stressSignal, setStressSignal] = useState<StressSignalId | null>(null);
  const [stressAwareness, setStressAwareness] = useState<StressAwarenessId | null>(null);
  const [hasAnsweredStress, setHasAnsweredStress] = useState(initialSavedProfile?.stressLevel != null);
  const [hasAnsweredSleep, setHasAnsweredSleep] = useState(initialSavedProfile?.sleepQuality != null);
  // Onboarding no longer asks the agreement statements. A profile saved before
  // they were removed still carries the answers, and the plan, score and
  // reflection still read them, so they are carried through rather than wiped.
  const agreementResponses: Record<string, AgreementValue | null> =
    initialSavedProfile?.agreementResponses ?? {};
  const [age, setAge] = useState(initialSavedProfile?.age ?? null);
  const [gender, setGender] = useState(
    toGenderOptionId(initialSavedProfile?.gender),
  );
  const [supportSystem, setSupportSystem] = useState<SupportSystemId | null>(
    null,
  );
  const [adhdStatus, setAdhdStatus] = useState<AdhdStatus | null>(null);
  const [mentalHealth, setMentalHealth] = useState<MentalHealthId[]>([]);
  const [struggles, setStruggles] = useState<StruggleId[]>([]);
  const [homeFeelings, setHomeFeelings] = useState<HomeFeelingId[]>([]);
  const [homeAtmosphere, setHomeAtmosphere] = useState<HomeAtmosphereId[]>([]);
  const [habitsToBreak, setHabitsToBreak] = useState<string[]>([]);
  const [cbtFamiliarity, setCbtFamiliarity] = useState<FamiliarityId | null>(
    null,
  );
  const [doctorReferral, setDoctorReferral] = useState<DoctorReferral | null>(
    null,
  );
  const [planBoosts, setPlanBoosts] = useState<PlanBoostId[]>([]);
  const [hasAnsweredDailyTime, setHasAnsweredDailyTime] = useState(
    initialSavedProfile?.dailyMinutes != null,
  );
  const [dailyMinutes, setDailyMinutes] = useState(
    initialSavedProfile?.dailyMinutes ?? 5,
  );
  // '07:00' is a placeholder for the picker, not an answer — the plan screen
  // only quotes the wake time back once the user has actually set one.
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [acquisitionSource, setAcquisitionSource] =
    useState<AcquisitionSourceId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationErrorMessage, setNotificationErrorMessage] = useState<string | null>(null);
  const [isNotificationSubmitting, setIsNotificationSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sealInFlightRef = useRef(false);
  const celebrationFinishedRef = useRef<(() => void) | null>(null);
  const updateNotificationPreferences = useUpdateNotificationPreferencesMutation(userId);
  const updateDailyPlanSchedule = useUpdateDailyPlanScheduleMutation(userId);
  const queryClient = useQueryClient();
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
  // Warm the user-scoped offering without recording a paywall view early.
  useEffect(() => {
    if (userId == null || (step !== 'planLoading' && step !== 'pact')) return;
    void getPaywallOffering(PaywallPlacement.OnboardingComplete).catch(() => {});
  }, [step, userId]);
  // Fail-soft: a missing/unloadable offering means we can't sell anything, so
  // the free path must stay available.
  const paywallMode = paywall.offering?.paywallMode ?? 'soft';
  const [isExitOfferVisible, setIsExitOfferVisible] = useState(false);
  const [exitOfferTrigger, setExitOfferTrigger] =
    useState<ExitOfferTrigger>('idle');
  const [hasReachedPlanStep, setHasReachedPlanStep] = useState(false);
  // Auto triggers (idle, cancelled purchase) fire at most once per session;
  // the explicit close tap can always reopen the offer.
  const hasAutoShownExitOfferRef = useRef(false);

  const showExitOffer = useCallback(
    (trigger: ExitOfferTrigger) => {
      hasAutoShownExitOfferRef.current = true;
      setExitOfferTrigger(trigger);
      setIsExitOfferVisible(true);
    },
    [],
  );

  const intentFollowUps = useMemo(
    () => intentFollowUpsFor(primaryIntent),
    [primaryIntent],
  );
  const activeIntentDepthSteps = INTENT_DEPTH_STEPS.slice(0, intentFollowUps.length);

  /**
   * The follow-up answers as analytics properties: the ids picked, and how many.
   * Named after the question rather than the step, so the key keeps meaning the
   * same thing if the question ever moves.
   */
  const intentFollowUpProperties = (answer?: { questionId: string; id: string }): OnboardingAnalyticsProperties =>
    intentFollowUps.reduce<OnboardingAnalyticsProperties>((acc, question) => {
      const chosen = answer?.questionId === question.id
        ? [answer.id]
        : intentFollowUpAnswers[question.id] ?? [];
      acc[`intent_${question.id}`] = chosen.length > 0 ? chosen.join(',') : null;
      acc[`intent_${question.id}_count`] = chosen.length;
      return acc;
    }, {});

  const visibleSections = useMemo(
    () => onboardingSections(
      primaryIntent,
      selectedIntents.length,
      intentFollowUps.length,
      adhdStatus,
    ),
    [primaryIntent, selectedIntents.length, intentFollowUps.length, adhdStatus],
  );
  const visibleStepOrder = useMemo(
    () => visibleSections.flatMap(({ steps }) => steps),
    [visibleSections],
  );
  const currentSection = visibleSections.find(({ steps }) => steps.includes(step));
  useOnboardingSectionLabelSync(
    currentSection
      ? onboardingSectionLabel(currentSection.section, primaryIntent, name)
      : null,
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
  const activeContext = activeOnboardingContext(visibleStepOrder, {
    stressLevel: hasAnsweredStress ? stressLevel : null,
    sleepQuality: hasAnsweredSleep ? sleepQuality : null,
    sleepDuration,
    wakeEase,
    dayEnergy,
    routineHappiness,
    choresOverwhelm,
    distraction,
    sleepCause,
    stressSignal,
    procrastinationAreas,
    procrastinationReasons,
  });

  const getStepEventInput = (targetStep: OnboardingStep = step) => ({
    step: targetStep,
    stepIndex: stepIndexMap[targetStep] ?? 1,
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
      ...intentFollowUpProperties(),
      agreement_response_count: Object.values(agreementResponses).filter(
        (value) => value != null,
      ).length,
      has_age: (profile?.age ?? null) != null,
      has_gender: (profile?.gender ?? null) != null,
      has_daily_minutes: (profile?.dailyMinutes ?? null) != null,
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

  const goNext = (
    action: Exclude<OnboardingTransitionAction, 'back'>,
    properties?: OnboardingAnalyticsProperties,
  ) => {
    const next = adjacentOnboardingStep(visibleStepOrder, step, 'forward');
    if (next != null) goToStep(next, action, properties);
  };

  const advanceAdhdStatus = (
    answer: AdhdStatus | null,
    action: 'continue' | 'skip',
  ) => {
    setAdhdStatus(answer);
    // Reduced motion can advance before the selected answer has rerendered.
    const answeredStepOrder = onboardingStepOrder(
      primaryIntent,
      selectedIntents.length,
      intentFollowUps.length,
      answer,
    );
    const next = adjacentOnboardingStep(answeredStepOrder, 'adhdStatus', 'forward');
    if (next != null) goToStep(next, action, { adhd_status: answer });
  };

  const goBack = () => {
    if (sealInFlightRef.current) return;
    const previous = adjacentOnboardingStep(visibleStepOrder, step, 'back');
    if (previous != null) goToStep(previous, 'back');
  };

  const leftStepsRef = useRef(new Set<OnboardingStep>());
  const sentAnswersRef = useRef<Record<string, string>>({});
  const previousStepRef = useRef(step);

  // Saved on every step change, not at the seal, so an abandoned onboarding
  // still keeps its answers. Keys are stored as question ids — a new question
  // only needs a line here. Analytics-only, so a failed write never blocks.
  useEffect(() => {
    if (previousStepRef.current === step) return;
    leftStepsRef.current.add(previousStepRef.current);
    previousStepRef.current = step;
    if (userId == null) return;

    const left = leftStepsRef.current;
    const changed = changedOnboardingAnswers(
      {
        azoChat: azoChatAnswers,
        intents: selectedIntents,
        primaryIntent,
        name,
        stressLevel: hasAnsweredStress ? stressLevel : null,
        sleepQuality: hasAnsweredSleep ? sleepQuality : null,
        sleepDuration,
        wakeEase,
        usageStyles,
        dayEnergy,
        routineHappiness,
        choresOverwhelm,
        socialMedia,
        fallingBehind,
        lifestyleHappiness,
        habitMotivations,
        scrollInstead,
        skipSelfCare,
        drainedFrequency,
        untappedPotential,
        doingItFor,
        loseMotivation,
        habitAttempts,
        habitRestartFrequency,
        selfDiscipline,
        putOthersFirst,
        sacrificeForOthers,
        wishUnderstood,
        putOffGuilt,
        distraction,
        procrastinationAreas,
        procrastinationReasons,
        intentFollowUps: intentFollowUpAnswers,
        habitPicks: habitPickIds,
        starterPlanDecisions,
        sleepCause,
        stressSignal,
        stressAwareness,
        age,
        gender,
        supportSystem,
        adhdStatus,
        mentalHealth,
        struggles,
        homeFeelings,
        homeAtmosphere,
        habitsToBreak,
        cbtFamiliarity,
        doctorReferral,
        planBoosts,
        dailyMinutes: hasAnsweredDailyTime ? dailyMinutes : null,
        wakeTime: left.has('wakeTime') ? wakeTime : null,
        sleepTime: left.has('sleepTime') ? sleepTime : null,
        acquisitionSource,
      },
      sentAnswersRef.current,
    );
    if (Object.keys(changed).length === 0) return;

    for (const [questionId, value] of Object.entries(changed)) {
      sentAnswersRef.current[questionId] = JSON.stringify(value);
    }
    saveOnboardingAnswers(userId, changed).catch((error: unknown) => {
      for (const questionId of Object.keys(changed)) {
        delete sentAnswersRef.current[questionId];
      }
      console.warn('[onboarding-answers] save failed', getErrorMessage(error));
    });
    // Only a step change commits answers; the values are read from that render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, userId]);

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
    // Paywall idle trigger: lingering on the plan step ("Unlock Azora
    // for free") without acting is exit intent, so slide the one-time offer
    // up. The countdown never runs while a purchase/restore/completion is in
    // flight (the store sheet being open must not count as idling) and
    // restarts from zero when that activity ends.
    if (step !== 'paywall' || isPro) return;
    if (!hasReachedPlanStep) return;
    if (hasAutoShownExitOfferRef.current || isExitOfferVisible) return;
    if (paywall.isPurchasing || paywall.isRestoring || isSubmitting) return;

    const id = setTimeout(() => showExitOffer('idle'), EXIT_OFFER_IDLE_MS);
    return () => clearTimeout(id);
  }, [
    step,
    isPro,
    hasReachedPlanStep,
    isExitOfferVisible,
    paywall.isPurchasing,
    paywall.isRestoring,
    isSubmitting,
  ]);

  /**
   * The questions the plan build stops to ask. Neither changes the plan; both
   * are only tracked.
   */
  const handlePlanLoadingAnswer = (
    id: PlanLoadingInterruptId,
    answer: string,
  ) => {
    trackOnboardingStepCompleted({
      ...getStepEventInput('planLoading'),
      nextStep: 'planLoading',
      action: 'continue',
      properties: {
        plan_loading_interrupt: id,
        plan_loading_answer: answer,
      },
    });
  };

  const selectIntent = (intentId: OnboardingIntent) => {
    if (isSubmitting) return;
    setSelectedIntents([intentId]);
    setPrimaryIntent(intentId);
    trackOnboardingIntentUpdated({
      ...getStepEventInput('intent'),
      intentId,
      selected: true,
      selectedIntentCount: 1,
    });
    setErrorMessage(null);
  };

  const continueAfterIntentPriority = (
    nextPrimaryIntent: OnboardingIntent,
    properties: OnboardingAnalyticsProperties,
  ) => {
    setPrimaryIntent(nextPrimaryIntent);
    const nextProperties = {
      ...properties,
      primary_intent_id: nextPrimaryIntent,
    };

    continueAfterIntentChoice('continue', nextProperties);
  };

  /** where the intent chain lands once a goal and its priority are known */
  const continueAfterIntentChoice = (
    action: Exclude<OnboardingTransitionAction, 'back'>,
    properties?: OnboardingAnalyticsProperties,
  ) => {
    goNext(action, properties);
  };

  const goFromIntent = () => {
    if (selectedIntents.length === 0 || isSubmitting) return;
    const properties = {
      selected_intent_count: selectedIntents.length,
      only_custom_intent: isOnlyCustomIntent,
    };

    const onlyIntent = selectedIntents.length === 1 ? selectedIntents[0] : null;
    if (onlyIntent) setPrimaryIntent(onlyIntent);

    if (selectedIntents.length >= 2) {
      goToStep('intentPriority', 'continue', properties);
      return;
    }
    continueAfterIntentChoice('continue', {
      ...properties,
      primary_intent_id: onlyIntent,
    });
  };

  /**
   * The goals as stored, with the one they said matters most written first.
   *
   * The order is load-bearing rather than cosmetic: this string is the only
   * record of what was picked, and the plan is resolved back out of it by
   * reading the leading goal. Selection order is the order they happened to
   * tap; the priority answer is the one the plan was built from, so it leads.
   */
  const buildOnboardingGoal = () => {
    const ordered =
      primaryIntent == null
        ? selectedIntents
        : [primaryIntent, ...selectedIntents.filter((id) => id !== primaryIntent)];

    return ordered
      .map((id) => INTENT_OPTIONS.find((option) => option.id === id)?.title ?? id)
      .join(', ');
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

  const todayLocalDate = useTodayLocalDate();
  const createSelfCareGoals = useCreateSelfCareGoalsMutation(
    userId,
    todayLocalDate,
  );

  const starterPlan = useMemo(
    () => buildStarterPlan({
      intent: primaryIntent ?? selectedIntents[0] ?? null,
      wakeEase: activeContext.wakeEase,
      sleepDuration: activeContext.sleepDuration,
      routineHappiness: activeContext.routineHappiness,
      choresOverwhelm: activeContext.choresOverwhelm,
      mentalHealth,
      adhdStatus,
      procrastinationAreas: activeContext.procrastinationAreas,
      procrastinationReasons: activeContext.procrastinationReasons,
    }),
    [
      activeContext.wakeEase,
      activeContext.sleepDuration,
      activeContext.routineHappiness,
      activeContext.choresOverwhelm,
      activeContext.procrastinationAreas,
      activeContext.procrastinationReasons,
      mentalHealth,
      adhdStatus,
      primaryIntent,
      selectedIntents,
    ],
  );

  /**
   * The plan page shows the list; it does not write it. Everything else
   * onboarding collects is held until the pact seals the whole run, and the
   * to-dos are written there too — a page you can step back onto must not be a
   * page that saves, or stepping back saves the list a second time.
   */
  const acceptedStarterPlan = useMemo(
    () => acceptedStarterPlanItems(starterPlan, starterPlanDecisions),
    [starterPlan, starterPlanDecisions],
  );
  const habitPicks = useMemo(
    () => habitPicksFor(primaryIntent ?? selectedIntents[0] ?? null, starterPlan),
    [primaryIntent, selectedIntents, starterPlan],
  );
  const pickedHabits = habitPicks.filter((item) => habitPickIds.includes(item.id));
  const starterPlanDraftList = () =>
    starterPlanDrafts([...acceptedStarterPlan, ...pickedHabits], []);

  const continueFromStarterPlan = () => {
    goNext('continue', {
      starter_plan_kept_count: starterPlanDraftList().length,
    });
    void maybeRequestOnboardingReview();
  };

  const buildOnboardingResult = (): OnboardingFlowResult | null => {
    // A saved profile starts the flow at the paywall, so the intent questions
    // that build this goal were never asked again. Fall back to the goal that
    // profile already carries, the way the default technique does.
    const goal = buildOnboardingGoal() || (initialSavedProfile?.onboardingGoal ?? '');
    if (goal.length === 0) return null;

    return {
      onboardingGoal: goal,
      displayName: name.trim() || null,
      stressLevel: activeContext.stressLevel ?? initialSavedProfile?.stressLevel ?? null,
      sleepQuality: activeContext.sleepQuality ?? initialSavedProfile?.sleepQuality ?? null,
      agreementResponses,
      age,
      gender,
      dailyMinutes: hasAnsweredDailyTime ? Math.max(1, dailyMinutes) : null,
      defaultTechniqueId:
        primaryIntent != null
          ? techniqueForIntent(primaryIntent)
          : initialSavedProfile?.defaultTechniqueId ?? null,
    };
  };

  const saveProfileAndSeal = async () => {
    if (isSubmitting || sealInFlightRef.current) return;

    const result = buildOnboardingResult();
    if (result == null) {
      // The pact screen has already stamped; an error is what resets it.
      setErrorMessage('We couldn’t save your plan. Tap the seal to try again.');
      return;
    }

    sealInFlightRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    const startedAt = Date.now();

    console.log('[onboarding-seal] save started', {
      userId,
      selectedIntentCount: selectedIntents.length,
      hasDisplayName: result.displayName != null,
      hasDefaultTechnique: result.defaultTechniqueId != null,
    });

    try {
      trackOnboardingProfileSaveStarted({
        ...getStepEventInput(),
        ...buildProfileAnalyticsProperties(result),
      });
      if (userId == null) {
        throw new Error('Cannot save onboarding without a signed-in user.');
      }
      const schedule = buildDailyPlanSchedule(slotTimes);
      const exercisePlan = buildGrowthAreaSevenDayExercisePlanV2({
        primaryTechniqueId: result.defaultTechniqueId,
        growthAreaAxis: planMindMap.growthArea.axis,
        startsOn: formatLocalDate(new Date()),
      });
      // Keep the whole handoff bounded, including the celebration callback.
      let saveActive = true;
      let cancelDeadline: (() => void) | undefined;
      const saveTimeout = new Promise<never>((_, reject) => {
        cancelDeadline = startUiTimer(20_000, () => {
          saveActive = false;
          reject(new Error('seal_save_timeout'));
        });
      });
      const requireActiveSave = () => {
        if (!saveActive) throw new Error('seal_save_timeout');
      };
      // Enrollment is optional; its response still publishes the canonical cache.
      void startProgramEnrollment({
        userId,
        // The resolver is pure; pass the same answers used by the preview
        // so the enrollment is a snapshot of the plan the user accepted.
        planId: onboardingPresetFor(plan.intent, {
          followUpAnswers: intentFollowUpAnswers,
          sleepCause: activeContext.sleepCause === 'phone' ? 'phone' : null,
        }).id,
        pressureLessonTrack: pressureLessonTrackForIntent(plan.intent),
        phoneLessonTrack: phoneLessonTrackForIntent(plan.intent),
        enrolledOn: formatLocalDate(new Date()),
      }).then(async (enrollment) => {
        const queryKey = getProgramEnrollmentQueryKey(userId);
        await queryClient.cancelQueries({ queryKey, exact: true });
        queryClient.setQueryData(queryKey, enrollment);
      }).catch((error) => {
        console.warn(
          '[onboarding-program] starting the plan failed',
          getErrorMessage(error),
        );
      });
      await Promise.race([
        saveTimeout,
        Promise.all([
          (async () => {
            // Independent writes overlap; the recovery marker stays last.
            await Promise.all([
              createSelfCareGoals.mutateAsync(starterPlanDraftList()),
              updateDailyPlanSchedule.mutateAsync(schedule),
              updateDailyPlanExercises.mutateAsync(exercisePlan),
            ]);
            requireActiveSave();
            await resetTodayJourneyOrderAfterOnboarding(userId);
            requireActiveSave();
            await onSaveProfile(result);
          })(),
          new Promise<void>((resolve) => {
            celebrationFinishedRef.current = resolve;
          }),
        ]),
      ]).finally(() => {
        saveActive = false;
        cancelDeadline?.();
        celebrationFinishedRef.current = null;
      });
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
      setErrorMessage(
        getErrorMessage(error) === 'seal_save_timeout'
          ? 'Saving is taking longer than usual. Check your connection and tap the seal to try again.'
          : 'We couldn’t save your plan. Tap the seal to try again.',
      );
      void buildOnboardingSaveFailureDiagnostics({
        userId,
        elapsedMs: Date.now() - startedAt,
        requestType: 'onboarding-seal-flow',
        retryAttempt: 0,
        error,
      }).then((diagnostics) => {
        console.warn('[onboarding-seal] save diagnostics', diagnostics);
      }).catch(() => {});

    } finally {
      sealInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const finish = async (completionPath: OnboardingCompletionPath) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Queue the tour for every finished onboarding. The seen flag otherwise
      // survives from an earlier run on this install and the tour never plays.
      useTourStore.getState().prepare();
      await setTourSeen(false);
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

  const purchaseSelectedPackage = async (packageId?: PaywallPackageId) => {
    if (isSubmitting) return;

    // The tray's plan cards choose and buy in one tap, so the selection is set
    // here for the highlight and passed through for the charge.
    if (packageId != null) paywall.selectPackage(packageId);
    const result = await paywall.purchaseSelectedPackage(packageId);

    // Cancelling the store sheet is exit intent — counter with the offer.
    // This is immediate, not gated by the idle timer.
    if (
      result.status === 'cancelled' &&
      !isPro &&
      !hasAutoShownExitOfferRef.current
    ) {
      showExitOffer('purchase_cancelled');
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
      const schedule = buildDailyPlanSchedule(slotTimes);
      const onboardingReminders = ONBOARDING_NOTIFICATION_PREFERENCES.dailyPlanReminders;
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

      goToStep('pact', 'continue', {
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
      goToStep('pact', 'skip');
    } finally {
      setIsNotificationSubmitting(false);
    }
  };

  const stepIndex = stepIndexMap[step] ?? 1;
  // The bar animates itself from this target, on the UI thread — see
  // `OnboardingProgressProvider` below and `ProgressBar` in the screen layout.
  const visualStepIndex =
    computeFrontLoadedProgress(stepIndex, stepCount) *
    VISUAL_PROGRESS_STEP_COUNT;
  const visualStepCount = VISUAL_PROGRESS_STEP_COUNT;

  if (step === 'azoChatInvite') {
    return (
      <AzoMessageScreen
        onContinue={() => goNext('continue')}
      />
    );
  }

  if (step === 'azoChat') {
    return (
      <AzoChatScreen
        answers={azoChatAnswers}
        onAnswersChange={setAzoChatAnswers}
        onContinue={() => goNext('continue')}
        onSkip={() => goNext('skip')}
        onBack={goBack}
      />
    );
  }

  if (step === 'planIntro') {
    return (
      <PlanIntroScreen
        name={name.trim() || null}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  // The plan is already built by the time this runs, so the wait is the last
  // screen before the plan can be shown rather than a real build.
  if (step === 'planLoading') {
    return (
      <PlanLoadingScreen
        intent={primaryIntent ?? 'other'}
        onDone={() => goNext('auto')}
        onAnswerInterrupt={handlePlanLoadingAnswer}
      />
    );
  }

  if (step === 'personalizeIntro') {
    return (
      <PersonalizeIntroScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'expertReview') {
    return (
      <ExpertReviewScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'communityProof') {
    return (
      <CommunityProofScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'intentPriority' && selectedIntents.length >= 2) {
    return (
      <IntentPriorityScreen
        selectedIntents={selectedIntents}
        primaryIntent={primaryIntent}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        isSubmitting={isSubmitting}
        onSelect={setPrimaryIntent}
        onContinue={(chosenIntent) => {
          if (!selectedIntents.includes(chosenIntent)) {
            return;
          }
          continueAfterIntentPriority(chosenIntent, {
            selected_intent_count: selectedIntents.length,
            only_custom_intent: isOnlyCustomIntent,
          });
        }}
        onBack={goBack}
      />
    );
  }

  if (step === 'name') {
    return (
      <NameScreen
        greetingReady={greetingReady}
        value={name}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setName}
        onContinue={() => goNext('continue', {
          has_display_name: name.trim().length > 0,
        })}
        onBack={goBack}
        onSkip={() => {
          setName('');
          goNext('skip');
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
        onContinue={() => goNext('continue')}
        onBack={goBack}
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
        onContinue={(source) =>
          goNext('continue', {
            acquisition_source: source,
          })
        }
        onBack={goBack}
        onSkip={() => {
          recordAcquisitionSource('skipped');
          goNext('skip');
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
          goNext('continue', { has_stress_level: true });
        }}
        onBack={goBack}
        onSkip={() => {
          setHasAnsweredStress(false);
          goNext('skip');
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
          goNext('continue', { has_sleep_quality: true });
        }}
        onBack={goBack}
        onSkip={() => {
          setHasAnsweredSleep(false);
          goNext('skip');
        }}
      />
    );
  }

  if (step === 'sleepDuration') {
    return (
      <OnboardingChoiceScreen
        question={
          primaryIntent === 'sleep'
            ? 'How many hours do you usually sleep?'
            : 'How has sleep been lately?'
        }
        expression="curious"
        options={SLEEP_DURATION_OPTIONS}
        selectedIds={sleepDuration ? [sleepDuration] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setSleepDuration}
        onContinue={() =>
          goNext('continue', {
            has_sleep_duration: true,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'usageStyle') {
    return (
      <UsageStyleScreen
        selectedIds={usageStyles}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setUsageStyles((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            usage_style_ids: usageStyles.join(','),
          })
        }
        onBack={goBack}
      />
    );
  }

  if (step === 'wakeEase') {
    return (
      <OnboardingChoiceScreen
        question={
          primaryIntent === 'sleep'
            ? 'How easy is it to get out of bed?'
            : 'How do mornings usually start?'
        }
        expression="listening"
        options={WAKE_EASE_OPTIONS}
        selectedIds={wakeEase ? [wakeEase] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setWakeEase}
        onContinue={() =>
          goNext('continue', {
            has_wake_ease: true,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'dayEnergy') {
    return (
      <OnboardingChoiceScreen
        question="How is your energy during the day?"
        expression="curious"
        options={DAY_ENERGY_OPTIONS}
        selectedIds={dayEnergy ? [dayEnergy] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setDayEnergy}
        onContinue={(id) =>
          goNext('continue', {
            day_energy: id ?? dayEnergy,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'sleepCause') {
    return (
      <OnboardingChoiceScreen
        question={
          primaryIntent === 'sleep'
            ? 'What makes it hard to settle at night?'
            : 'What makes it hardest to switch off at night?'
        }
        expression="thinking"
        options={SLEEP_CAUSE_OPTIONS}
        selectedIds={sleepCause ? [sleepCause] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setSleepCause}
        onContinue={(id) =>
          goNext('continue', {
            sleep_cause: id ?? sleepCause,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'adhdSupport') {
    return (
      <AdhdSupportScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'sleepInsight') {
    return (
      <SleepInsightScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'goalProof') {
    return (
      <GoalProofScreen
        intent={primaryIntent ?? 'other'}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'habitsToBreak') {
    return (
      <OnboardingChoiceScreen
        question="What habits would you like to break?"
        expression="listening"
        options={habitsToBreakFor(primaryIntent ?? 'other')}
        selectedIds={habitsToBreak}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setHabitsToBreak((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            habits_to_break_count: habitsToBreak.length,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'cbtFamiliarity') {
    return (
      <OnboardingChoiceScreen
        question="How familiar are you with CBT?"
        note="CBT stands for cognitive behavioral therapy. It helps you reframe unhelpful thoughts and manage stress."
        expression="thinking"
        options={CBT_FAMILIARITY_OPTIONS}
        selectedIds={cbtFamiliarity ? [cbtFamiliarity] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setCbtFamiliarity}
        onContinue={(id) =>
          goNext('continue', {
            cbt_familiarity: id ?? cbtFamiliarity,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'cbtIntro') {
    return (
      <ChalkboardScreen
        lesson="cbtIntro"
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'routineHappiness') {
    return (
      <OnboardingChoiceScreen
        question="Do you feel on top of daily life right now?"
        expression="thinking"
        options={ROUTINE_HAPPINESS_OPTIONS}
        selectedIds={routineHappiness ? [routineHappiness] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setRoutineHappiness}
        onContinue={() =>
          goNext('continue', {
            has_routine_happiness: true,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'distraction') {
    return (
      <OnboardingChoiceScreen
        question="How easily distracted are you?"
        expression="thinking"
        options={DISTRACTION_OPTIONS}
        selectedIds={distraction ? [distraction] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setDistraction}
        onContinue={() =>
          goNext('continue', {
            has_distraction: true,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'procrastinationArea') {
    return (
      <OnboardingChoiceScreen
        question="What are you avoiding most right now?"
        expression="listening"
        options={PROCRASTINATION_AREA_OPTIONS}
        selectedIds={procrastinationAreas}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setProcrastinationAreas((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            procrastination_area_count: procrastinationAreas.length,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'procrastinationReason') {
    return (
      <OnboardingChoiceScreen
        question="What makes it hard to begin?"
        expression="thinking"
        options={PROCRASTINATION_REASON_OPTIONS}
        selectedIds={procrastinationReasons}
        multiSelect={false}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) => setProcrastinationReasons([id])}
        onContinue={() =>
          goNext('continue', {
            procrastination_reason_count: 1,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'choresOverwhelm') {
    return (
      <OnboardingChoiceScreen
        question={
          primaryIntent === 'cleaning'
            ? 'How often do you feel overwhelmed by cleaning tasks?'
            : 'How often do you feel overwhelmed by your day-to-day chores?'
        }
        expression="thinking"
        options={CHORES_OVERWHELM_OPTIONS}
        selectedIds={choresOverwhelm ? [choresOverwhelm] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setChoresOverwhelm}
        onContinue={() =>
          goNext('continue', {
            has_chores_overwhelm: true,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'lifestyleHappiness') {
    return (
      <OnboardingChoiceScreen
        question="How happy are you with your current lifestyle?"
        expression="listening"
        options={LIFESTYLE_HAPPINESS_OPTIONS}
        selectedIds={lifestyleHappiness ? [lifestyleHappiness] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setLifestyleHappiness}
        onContinue={(id) =>
          goNext('continue', {
            lifestyle_happiness: id ?? lifestyleHappiness,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'habitMotivation') {
    return (
      <OnboardingChoiceScreen
        question="What motivates you to build good habits?"
        expression="curious"
        options={HABIT_MOTIVATION_OPTIONS}
        selectedIds={habitMotivations}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setHabitMotivations((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            habit_motivations: habitMotivations.join(','),
            habit_motivation_count: habitMotivations.length,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'greatDaysChart') {
    return (
      <GreatDaysScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'fallingBehind') {
    return (
      <OnboardingChoiceScreen
        question="How often do you feel like you’re falling behind?"
        expression="thinking"
        options={FALLING_BEHIND_OPTIONS}
        selectedIds={fallingBehind ? [fallingBehind] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setFallingBehind}
        onContinue={(id) =>
          goNext('continue', {
            falling_behind: id ?? fallingBehind,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'scrollInstead') {
    return (
      <OnboardingChoiceScreen
        question="Do you often end up scrolling instead of doing what you planned?"
        expression="curious"
        options={SCROLL_INSTEAD_OPTIONS}
        selectedIds={scrollInstead ? [scrollInstead] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setScrollInstead}
        onContinue={(id) =>
          goNext('continue', {
            scroll_instead: id ?? scrollInstead,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'skipSelfCare') {
    return (
      <OnboardingChoiceScreen
        question="Do you skip self-care?"
        expression="listening"
        options={SKIP_SELF_CARE_OPTIONS}
        selectedIds={skipSelfCare ? [skipSelfCare] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setSkipSelfCare}
        onContinue={(id) =>
          goNext('continue', {
            skip_self_care: id ?? skipSelfCare,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'drainedFrequency') {
    return (
      <OnboardingChoiceScreen
        question="How often do you feel mentally or physically drained?"
        expression="curious"
        options={DRAINED_FREQUENCY_OPTIONS}
        selectedIds={drainedFrequency ? [drainedFrequency] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setDrainedFrequency}
        onContinue={(id) =>
          goNext('continue', {
            drained_frequency: id ?? drainedFrequency,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'untappedPotential') {
    return (
      <OnboardingChoiceScreen
        question="Do you feel like there's untapped potential inside of you?"
        expression="thinking"
        options={UNTAPPED_POTENTIAL_OPTIONS}
        selectedIds={untappedPotential ? [untappedPotential] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setUntappedPotential}
        onContinue={(id) =>
          goNext('continue', {
            untapped_potential: id ?? untappedPotential,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'doingItFor') {
    return (
      <OnboardingChoiceScreen
        question="Who are you doing this for?"
        expression="listening"
        options={DOING_IT_FOR_OPTIONS}
        selectedIds={doingItFor}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setDoingItFor((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            doing_it_for: doingItFor.join(','),
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'loseMotivation') {
    return (
      <OnboardingChoiceScreen
        question="Do you tend to lose motivation easily?"
        expression="curious"
        options={LOSE_MOTIVATION_OPTIONS}
        selectedIds={loseMotivation ? [loseMotivation] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setLoseMotivation}
        onContinue={(id) =>
          goNext('continue', {
            lose_motivation: id ?? loseMotivation,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'habitAttempts') {
    return (
      <OnboardingChoiceScreen
        question="Have you ever tried building habits but couldn’t stick with them?"
        expression="listening"
        options={HABIT_ATTEMPTS_OPTIONS}
        selectedIds={habitAttempts ? [habitAttempts] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setHabitAttempts}
        onContinue={(id) =>
          goNext('continue', {
            habit_attempts: id ?? habitAttempts,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'habitRestartFrequency') {
    return (
      <OnboardingChoiceScreen
        question="How often do you find yourself restarting a habit?"
        expression="curious"
        options={HABIT_RESTART_FREQUENCY_OPTIONS}
        selectedIds={habitRestartFrequency ? [habitRestartFrequency] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setHabitRestartFrequency}
        onContinue={(id) =>
          goNext('continue', {
            habit_restart_frequency: id ?? habitRestartFrequency,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'selfDiscipline') {
    return (
      <OnboardingChoiceScreen
        question="How would you describe your relationship with self-discipline?"
        expression="thinking"
        options={SELF_DISCIPLINE_OPTIONS}
        selectedIds={selfDiscipline ? [selfDiscipline] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setSelfDiscipline}
        onContinue={(id) =>
          goNext('continue', {
            self_discipline: id ?? selfDiscipline,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'putOthersFirst') {
    return (
      <OnboardingChoiceScreen
        question="Do you put other people's needs above your own?"
        expression="listening"
        options={PUT_OTHERS_FIRST_OPTIONS}
        selectedIds={putOthersFirst ? [putOthersFirst] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setPutOthersFirst}
        onContinue={(id) =>
          goNext('continue', {
            put_others_first: id ?? putOthersFirst,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'sacrificeForOthers') {
    return (
      <OnboardingChoiceScreen
        question="What do you sacrifice for others?"
        expression="thinking"
        options={SACRIFICE_OPTIONS}
        selectedIds={sacrificeForOthers}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setSacrificeForOthers((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            sacrifice_for_others: sacrificeForOthers.join(','),
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'wishUnderstood') {
    return (
      <OnboardingChoiceScreen
        question="What's one thing you wish people understood about you?"
        expression="listening"
        options={WISH_UNDERSTOOD_OPTIONS}
        selectedIds={wishUnderstood}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setWishUnderstood((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            wish_understood: wishUnderstood.join(','),
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'socialMedia') {
    return (
      <OnboardingChoiceScreen
        question="How much time do you spend on social media?"
        expression="curious"
        options={SOCIAL_MEDIA_OPTIONS}
        selectedIds={socialMedia ? [socialMedia] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setSocialMedia}
        onContinue={() =>
          goNext('continue', {
            has_social_media: true,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'putOffGuilt') {
    return (
      <OnboardingChoiceScreen
        question="Do you feel guilty when you put things off?"
        expression="listening"
        options={PUT_OFF_GUILT_OPTIONS}
        selectedIds={putOffGuilt ? [putOffGuilt] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setPutOffGuilt}
        onContinue={(id) =>
          goNext('continue', {
            put_off_guilt: id ?? putOffGuilt,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'habitsFocusInsight') {
    return (
      <HabitsFocusInsightScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'habitsFocusScience1') {
    return (
      <HabitsFocusScienceScreen
        text="You are not lazy. Your brain is protecting you."
        highlights={['not lazy', 'protecting you']}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'habitsFocusScience2') {
    return (
      <HabitsFocusScienceScreen
        text="What feels like laziness is often your brain trying to protect you from uncertainty, effort, or emotional risk."
        highlights={['laziness', 'uncertainty, effort, or emotional risk']}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'habitsFocusScience3') {
    return (
      <HabitsFocusScienceScreen
        text="Azora uses brain-based techniques to help you follow through one step at a time."
        highlights={['brain-based techniques', 'follow through']}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'routineBrain') {
    return (
      <ChalkboardScreen
        lesson="routineBrain"
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'beforeAfter') {
    return (
      <BeforeAfterScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'halfway') {
    return (
      <HalfwayScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
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
        onContinue={() => goNext('continue', { has_age: true })}
        onBack={goBack}
        onSkip={() => goNext('skip')}
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
        onContinue={() => goNext('continue', { has_gender: true })}
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'supportSystem') {
    return (
      <OnboardingChoiceScreen
        question="How strong is your support system?"
        expression="listening"
        options={SUPPORT_SYSTEM_OPTIONS}
        selectedIds={supportSystem ? [supportSystem] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setSupportSystem}
        onContinue={(id) =>
          goNext('continue', {
            support_system: id ?? supportSystem,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'adhdStatus') {
    return (
      <OnboardingChoiceScreen
        question="Do you have ADHD or do you suspect you have it?"
        note="Your answer helps us better understand your needs"
        expression="listening"
        options={ADHD_STATUS_OPTIONS}
        selectedIds={adhdStatus ? [adhdStatus] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setAdhdStatus}
        onContinue={(id) => advanceAdhdStatus(id ?? adhdStatus, 'continue')}
        onBack={goBack}
        onSkip={() => advanceAdhdStatus(null, 'skip')}
      />
    );
  }

  if (step === 'mentalHealth') {
    return (
      <OnboardingChoiceScreen
        question="Have you been diagnosed with any of these?"
        note="Share only what feels comfortable. It just helps us tailor your plan to you."
        expression="curious"
        options={MENTAL_HEALTH_OPTIONS}
        selectedIds={mentalHealth}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setMentalHealth((current) => toggleExclusiveNone(current, id))
        }
        onContinue={() =>
          goNext('continue', {
            mental_health_count: mentalHealth.length,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'struggles') {
    return (
      <OnboardingChoiceScreen
        question="Do you struggle with any of these?"
        note="Lots of people do, and every one of them can get easier. Pick any that fit."
        expression="curious"
        options={STRUGGLE_OPTIONS}
        selectedIds={struggles}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setStruggles((current) => toggleExclusiveNone(current, id))
        }
        onContinue={() =>
          goNext('continue', {
            struggles_count: struggles.length,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'homeFeeling') {
    return (
      <OnboardingChoiceScreen
        question="How do you envision yourself living a better life?"
        expression="listening"
        options={HOME_FEELING_OPTIONS}
        selectedIds={homeFeelings}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setHomeFeelings((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            home_feeling_count: homeFeelings.length,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'homeAtmosphere') {
    return (
      <OnboardingChoiceScreen
        question="How do you want to feel after you finish using Azora?"
        expression="listening"
        options={HOME_ATMOSPHERE_OPTIONS}
        selectedIds={homeAtmosphere}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setHomeAtmosphere((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            home_atmosphere_count: homeAtmosphere.length,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
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
        onContinue={(id) =>
          goNext('continue', {
            doctor_referral: id ?? doctorReferral,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'dailyTime') {
    return (
      <DailyTimeScreen
        value={dailyMinutes}
        hasAnswered={hasAnsweredDailyTime}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={(minutes) => {
          setHasAnsweredDailyTime(true);
          setDailyMinutes(minutes);
        }}
        onContinue={() =>
          goNext('continue', { has_daily_minutes: true })
        }
        onBack={goBack}
        onSkip={() => {
          setHasAnsweredDailyTime(false);
          goNext('skip');
        }}
      />
    );
  }

  if (step === 'wakeTime') {
    return (
      <RoutineTimeScreen
        key="wakeTime"
        question="When do you usually wake up?"
        pickerTitle="Set wake-up time"
        value={wakeTime}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setWakeTime}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'sleepTime') {
    return (
      <RoutineTimeScreen
        key="sleepTime"
        question="When do you usually go to sleep?"
        pickerTitle="Set sleep time"
        value={sleepTime}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onChange={setSleepTime}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'planBoost') {
    return (
      <OnboardingChoiceScreen
        question="What would make your plan more fun and helpful?"
        expression="curious"
        options={PLAN_BOOST_OPTIONS}
        selectedIds={planBoosts}
        multiSelect
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setPlanBoosts((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            plan_boost_count: planBoosts.length,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'stressSignal') {
    return (
      <OnboardingChoiceScreen
        question="When your day feels like too much, what happens first?"
        expression="listening"
        options={STRESS_SIGNAL_OPTIONS}
        selectedIds={stressSignal ? [stressSignal] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setStressSignal}
        onContinue={(id) =>
          goNext('continue', {
            stress_signal: id ?? stressSignal,
          })
        }
        onBack={goBack}
        onSkip={() => {
          setStressSignal(null);
          goNext('skip');
        }}
      />
    );
  }

  if (step === 'stressAwareness') {
    return (
      <OnboardingChoiceScreen
        question="How well do you understand how your body reacts to stress?"
        expression="thinking"
        options={STRESS_AWARENESS_OPTIONS}
        selectedIds={stressAwareness ? [stressAwareness] : []}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={setStressAwareness}
        onContinue={(id) =>
          goNext('continue', {
            stress_awareness: id ?? stressAwareness,
          })
        }
        onBack={goBack}
        onSkip={() => {
          setStressAwareness(null);
          goNext('skip');
        }}
      />
    );
  }

  if (step === 'piecesTogether') {
    const contextQuestion = intentFollowUps[0];
    const subtitle = buildPiecesTogetherSubtitle({
      goalPhrase: chosenGoalPhrase(primaryIntent, selectedIntents),
      contextEcho: echoOption(
        contextQuestion.options,
        intentFollowUpAnswers[contextQuestion.id] ?? [],
      ),
      energyEcho: echoSingle(DAY_ENERGY_OPTIONS, activeContext.dayEnergy),
      sleepEcho: echoSingle(SLEEP_CAUSE_OPTIONS, activeContext.sleepCause),
      stressEcho: activeContext.stressLevel == null ? null : describeStressBand(activeContext.stressLevel),
    });
    return (
      <PiecesTogetherScreen
        subtitle={subtitle}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  // Their own words for when the problem hits, so the session row can say which
  // answer put it where it is.
  const whenQuestion = intentFollowUps[0];
  const planWhenEcho = echoOption(
    whenQuestion.options,
    intentFollowUpAnswers[whenQuestion.id] ?? [],
  );

  const plan = buildOnboardingPlan({
    intents: primaryIntent ? [primaryIntent] : selectedIntents,
    stressLevel: activeContext.stressLevel ?? 5,
    sleepQuality: activeContext.sleepQuality ?? 5,
    age: age ?? 25,
    dailyMinutes,
    wakeTimeMinutes: fromClockString(wakeTime) ?? 7 * 60,
    sleepTimeMinutes: fromClockString(sleepTime) ?? 22 * 60,
    whenEcho: planWhenEcho,
  });
  const onboardingPreset = onboardingPresetFor(plan.intent, {
    followUpAnswers: intentFollowUpAnswers,
    sleepCause: activeContext.sleepCause === 'phone' ? 'phone' : null,
  });
  const slotTimes = planSlotTimes(
    plan,
    fromClockString(sleepTime),
  );

  const planMindMap = computeMindMap({
    stressLevel: activeContext.stressLevel ?? initialSavedProfile?.stressLevel ?? 5,
    sleepQuality: activeContext.sleepQuality ?? initialSavedProfile?.sleepQuality ?? 5,
    strains: [
      ...(activeContext.stressSignal == null || activeContext.stressSignal === 'unsure'
        ? [] : [activeContext.stressSignal]),
      ...activeContext.procrastinationReasons,
      ...(activeContext.sleepCause == null ? [] : [activeContext.sleepCause]),
    ],
    agreementResponses,
  });

  const triedQuestion = intentFollowUps[1];
  const triedEcho = triedEchoFor(
    primaryIntent,
    triedQuestion == null ? [] : intentFollowUpAnswers[triedQuestion.id] ?? [],
  );

  const cleaningAnswerEcho = (questionId: string) => {
    const question = intentFollowUps.find((candidate) => candidate.id === questionId);
    if (question == null) return null;
    const selected = intentFollowUpAnswers[questionId] ?? [];
    if (!question.multiSelect) return echoOption(question.options, selected);
    const clauses = question.options
      .filter((option) => selected.includes(option.id) && option.echo != null)
      .map((option) => option.echo);
    return clauses.length > 0 ? clauses.join(', ') : null;
  };
  const planRevealProps = () => ({
    planId: onboardingPreset.id,
    intent: primaryIntent ?? plan.intent,
    presetRevision: onboardingPreset.revision,
    scores: planMindMap.scores,
    targetScores: projectScores(planMindMap.scores),
    reportAnswers: {
      startingEcho: primaryIntent === 'cleaning' ? planWhenEcho : null,
      goalPhrase: chosenGoalPhrase(primaryIntent, selectedIntents),
      sleepEcho: echoSingle(SLEEP_CAUSE_OPTIONS, activeContext.sleepCause),
      energyEcho: echoSingle(DAY_ENERGY_OPTIONS, activeContext.dayEnergy),
      focusEcho: echoSingle(DISTRACTION_OPTIONS, activeContext.distraction),
      stressEcho: activeContext.stressLevel == null ? null : describeStressBand(activeContext.stressLevel),
      contextEcho: primaryIntent === 'cleaning'
        ? cleaningAnswerEcho('cleaning_space_state')
        : planWhenEcho,
      routineEcho: primaryIntent === 'cleaning'
        ? cleaningAnswerEcho('cleaning_living_situation')
        : echoSingle(ROUTINE_HAPPINESS_OPTIONS, activeContext.routineHappiness),
      obstacleEcho: primaryIntent === 'cleaning'
        ? cleaningAnswerEcho('cleaning_barriers')
        : echoOption(PROCRASTINATION_REASON_OPTIONS, activeContext.procrastinationReasons),
    },
    stepIndex: visualStepIndex,
    stepCount: visualStepCount,
  });

  if (step === 'diagnosis') {
    return (
      <PlanRevealScreen
        phase="diagnosis"
        {...planRevealProps()}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  const planBenefitsProps = {
    preset: onboardingPreset,
    intent: primaryIntent ?? 'other',
    goalPhrase: chosenGoalPhrase(primaryIntent, selectedIntents) ?? 'feel more in control of your day',
    triedEcho,
    stepIndex: visualStepIndex,
    stepCount: visualStepCount,
  };

  if (step === 'planOutcome') {
    return (
      <PlanBenefitsScreen
        key="planOutcome"
        phase="outcome"
        {...planBenefitsProps}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'planPersonalization') {
    return (
      <PlanBenefitsScreen
        key="planPersonalization"
        phase="personalization"
        {...planBenefitsProps}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'recommendedExercise') {
    return (
      <PlanRevealScreen
        phase="plan"
        {...planRevealProps()}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'planDays') {
    return (
      <PlanDaysScreen
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        preview={buildOnboardingTodayPreview({
          preset: onboardingPreset,
          intent: primaryIntent ?? plan.intent,
          answers: intentFollowUpAnswers,
          goalPhrase: chosenGoalPhrase(primaryIntent, selectedIntents),
          selectedGoalCount: selectedIntents.length,
        })}
        intent={primaryIntent ?? 'other'}
        preset={onboardingPreset}
        onContinue={continueFromStarterPlan}
        name={name}
        goalPhrase={chosenGoalPhrase(primaryIntent, selectedIntents)}
        onBack={goBack}
      />
    );
  }

  if (step === 'recommendedHabits') {
    return (
      <RecommendedHabitsScreen
        items={starterPlan}
        decisions={starterPlanDecisions}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onDecide={(id, decision) =>
          setStarterPlanDecisions((current) => ({ ...current, [id]: decision }))
        }
        onRestart={() => setStarterPlanDecisions({})}
        onContinue={() =>
          goNext('continue', {
            starter_plan_kept_count: acceptedStarterPlan.length,
          })
        }
        onBack={goBack}
      />
    );
  }

  if (step === 'habitCurve') {
    return (
      <HabitCurveScreen
        intent={
          primaryIntent ??
          (selectedIntents.length === 1 ? selectedIntents[0] : null)
        }
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onContinue={() => goNext('continue')}
        onBack={goBack}
      />
    );
  }

  if (step === 'habitPicks') {
    return (
      <HabitPicksScreen
        items={habitPicks}
        selectedIds={pickedHabits.map((item) => item.id)}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setHabitPickIds((current) =>
            current.includes(id)
              ? current.filter((entry) => entry !== id)
              : [...current, id],
          )
        }
        onContinue={() =>
          goNext('continue', {
            habit_picks_count: pickedHabits.length,
          })
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
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
              goNext('continue');
            });
        }}
        onBack={goBack}
      />
    );
  }

  if (step === 'notifications') {
    return (
      <NotificationPermissionScreen
        schedule={buildDailyPlanSchedule(slotTimes)}
        intent={plan.intent}
        planId={onboardingPreset.id}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        isSubmitting={isNotificationSubmitting}
        errorMessage={notificationErrorMessage}
        onEnable={() => {
          void enableNotifications();
        }}
        onSkip={() => {
          void skipNotifications();
        }}
        onBack={goBack}
      />
    );
  }

  const followUpIndex = activeIntentDepthSteps.indexOf(step as IntentDepthStep);
  if (followUpIndex !== -1) {
    const question = intentFollowUps[followUpIndex];

    return (
      <OnboardingChoiceScreen
        question={question.question}
        expression={question.expression}
        options={question.options}
        selectedIds={intentFollowUpAnswers[question.id] ?? []}
        multiSelect={question.multiSelect}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        onSelect={(id) =>
          setIntentFollowUpAnswers((current) => {
            const chosen = current[question.id] ?? [];
            if (!question.multiSelect) {
              return { ...current, [question.id]: [id] };
            }
            return {
              ...current,
              [question.id]: chosen.includes(id)
                ? chosen.filter((entry) => entry !== id)
                : [...chosen, id],
            };
          })
        }
        onContinue={(id) =>
          goNext('continue', intentFollowUpProperties(id ? { questionId: question.id, id } : undefined))
        }
        onBack={goBack}
        onSkip={() => goNext('skip')}
      />
    );
  }

  if (step === 'pact') {
    return (
      <PactScreen
        dailyMinutes={dailyMinutes}
        name={name.trim() || null}
        stepIndex={visualStepIndex}
        stepCount={visualStepCount}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onConfirm={() => {
          void saveProfileAndSeal();
        }}
        onCelebrated={() => celebrationFinishedRef.current?.()}
        onBack={goBack}
      />
    );
  }

  if (step === 'paywall') {
    return (
      <>
        <OnboardingPaywallScreen
          offering={paywall.offering}
          planIntent={plan.intent}
          planPreset={onboardingPreset}
          selectedIntents={selectedIntents}
          goalPhrase={chosenGoalPhrase(primaryIntent, selectedIntents)}
          stakesBenefit={stakesBenefitFor(primaryIntent, intentFollowUpAnswers)}
          scores={planMindMap.scores}
          paywallMode={paywallMode}
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
          onPurchase={(packageId) => {
            void purchaseSelectedPackage(packageId);
          }}
          onOfferPurchased={() => {
            void finish('purchase');
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
          onOfferReached={() => setHasReachedPlanStep(true)}
          onStepViewed={paywall.trackStepViewed}
        />
        <ExitOfferSheet
          visible={isExitOfferVisible}
          sourceScreen="onboarding_exit_offer"
          trigger={exitOfferTrigger}
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
      onSelect={selectIntent}
      onContinue={goFromIntent}
      onBack={goBack}
    />
  );
}

/**
 * Holds the progress bar's animated value above the steps, so it survives the
 * screen swap each transition and every screen's bar slides the same way.
 */
export default function OnboardingFlow(props: OnboardingFlowProps) {
  const [greetingReady, setGreetingReady] = useState(false);

  return (
    <OnboardingProgressProvider>
      {/* Decode with the same WebP codec before the name step can advance. */}
      <Image
        source={GREETING_ANIMATION}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
        pointerEvents="none"
        accessible={false}
        autoplay={false}
        allowDownscaling={false}
        cachePolicy="memory"
        useAppleWebpCodec={false}
        onLoad={() => setGreetingReady(true)}
        // A failed asset must not trap the user on the name question.
        onError={() => setGreetingReady(true)}
      />
      <OnboardingFlowSteps {...props} greetingReady={greetingReady} />
    </OnboardingProgressProvider>
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
