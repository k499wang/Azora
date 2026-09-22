import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../common/Text';
import type {
  PaywallMode,
  PaywallOffering,
  PaywallPackageId,
} from '../../../services/paywall';
import { PaywallPlacement } from '../../../services/paywall';
import { usePaywall } from '../../../hooks/usePaywall';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { dashboardContentColumn } from '../../../theme/breakpoints';
import ScreenContent from '../../common/ScreenContent';
import { spacing } from '../../../theme/spacing';
import { fonts, scaleType, typography } from '../../../theme/typography';
import { scaleControl } from '../onboardingVisualScale';
import Icon from '../../common/icons/Icon';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { computeAnnualSavings, computeDiscountPercent } from '../../../lib/paywall/planPrice';
import { REFUND_REASSURANCE } from '../../../lib/paywall/paywallReassurance';
import { PaywallChoosePlanStep } from '../paywall/PaywallChoosePlanStep';
import { PaywallFreeTrialHeroStep } from '../paywall/PaywallFreeTrialHeroStep';
import { PaywallBenefitsStep } from '../paywall/PaywallBenefitsStep';
import { PaywallFooterLinks } from '../../paywall/PaywallFooterLinks';
import { PaywallTrayPlans } from '../../paywall/PaywallTrayPlans';
import PaywallTrialReminderToggle from '../../paywall/PaywallTrialReminderToggle';
import { PaywallFreeVsProStep } from '../paywall/PaywallFreeVsProStep';
import { PaywallTrialStep } from '../paywall/PaywallTrialStep';
import { PaywallLongForm } from '../../paywall/longForm/PaywallLongForm';
import { SpecialOfferPopup } from '../../paywall/SpecialOfferPopup';
import ChunkyButton from '../../common/ChunkyButton';
import { loadCriticalOnboardingImages } from '../../../services/images/onboardingImageCache';
import type { OnboardingIntent } from '../types';
import type { OnboardingPreset } from '../../../lib/onboardingPreset';
import { paywallStepStyles } from '../paywall/paywallStepStyles';

// ── Shared constants ──────────────────────────────────────────────────
const HEADER_BUTTON_SIZE = scaleControl(36);
const NO_PAYMENT_ICON_SIZE = scaleControl(18);
const ENTRANCE_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const OFFER_REACHED_SHARE = 0.55;

// ── Deck constants ────────────────────────────────────────────────────
type PaywallStepKey = 'benefits' | 'comparison' | 'hero' | 'plan';
// Only a soft trial reaches the deck, so the step list is fixed: there is a
// free tier to compare against, and a limits to continue on.
const TRIAL_STEPS: PaywallStepKey[] = ['benefits', 'comparison', 'hero', 'plan'];
const STEP_SLIDE_DISTANCE = 40;
const ENTRANCE_INITIAL_SCALE = 0.992;
type StepTransitionPhase = 'idle' | 'exiting' | 'entering';

// ── Props ─────────────────────────────────────────────────────────────
interface OnboardingPaywallScreenProps {
  offering: PaywallOffering | null;
  planIntent?: OnboardingIntent;
  planPreset: OnboardingPreset;
  selectedIntents?: OnboardingIntent[];
  primarySessionMinutes: number;
  /** `hard` locks the app, so this screen pages instead of stepping. */
  paywallMode: PaywallMode;
  name?: string;
  selectedPackageId: PaywallPackageId;
  stepIndex: number;
  stepCount: number;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  isCompleting: boolean;
  errorMessage: string | null;
  onSelectPackage: (packageId: PaywallPackageId) => void;
  onPurchase: (packageId: PaywallPackageId) => void;
  /** Runs after the special offer popup's discounted purchase, to finish the flow. */
  onOfferPurchased: () => void;
  onRestore: () => void;
  onRetry: () => void;
  onContinueWithoutPro?: () => void;
  onOfferReached?: () => void;
}

// ── Deck (trial path) ─────────────────────────────────────────────────
// Extracted so its animation effects only mount when a trial exists.
function TrialDeck({
  offering,
  selectedPackageId,
  planIntent,
  primarySessionMinutes,
  isLoading,
  isPurchasing,
  isRestoring,
  isCompleting,
  errorMessage,
  onSelectPackage,
  onPurchase,
  onRestore,
  onRetry,
  onContinueWithoutPro,
  onOfferReached,
}: Omit<OnboardingPaywallScreenProps, 'selectedIntents' | 'stepIndex' | 'stepCount'> & {
  onOfferReached?: () => void;
}) {
  const insets = useSafeAreaInsets();

  const selectedPackage = offering?.packages.find(
    (pkg) => pkg.id === selectedPackageId,
  );
  const annualPackage = offering?.packages.find((pkg) => pkg.id === 'annual');
  const weeklyPackage = offering?.packages.find((pkg) => pkg.id === 'weekly');
  const hasAnnualTrial = annualPackage?.trialLabel != null;
  const selectedPackageHasTrial = selectedPackage?.trialLabel != null;
  const showFreeTrialIntro = true;
  const isBusy = isLoading || isPurchasing || isRestoring || isCompleting;

  const savingsPercent = useMemo(
    () => computeAnnualSavings(annualPackage, weeklyPackage),
    [annualPackage, weeklyPackage],
  );

  // Step state
  const [step, setStep] = useState(0);
  const steps = TRIAL_STEPS;
  const stepCount = steps.length;
  const activeStep = steps[Math.min(step, stepCount - 1)];
  const stepRef = useRef(step);
  const isFinal = step === stepCount - 1;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(ENTRANCE_INITIAL_SCALE)).current;
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const stepTranslateX = useRef(new Animated.Value(0)).current;

  // Transition bookkeeping
  const isInitialStep = useRef(true);
  const entranceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entranceAnimationRef = useRef<{ stop: () => void } | null>(null);
  const hasStartedEntranceRef = useRef(false);
  const stepTransitionRef = useRef<{ stop: () => void } | null>(null);
  const stepTransitionVersionRef = useRef(0);
  const stepTransitionPhaseRef = useRef<StepTransitionPhase>('idle');
  const stepScrollRef = useRef<ScrollView>(null);
  const pendingStepTransitionRef = useRef<{
    next: number;
    direction: number;
  } | null>(null);
  const animateToStepRef = useRef<(next: number, direction: number) => void>(
    () => {},
  );

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const flushPendingStepTransition = useCallback(() => {
    const pending = pendingStepTransitionRef.current;
    pendingStepTransitionRef.current = null;
    if (!pending || pending.next === stepRef.current) return;
    animateToStepRef.current(pending.next, pending.direction);
  }, []);

  const animateToStep = useCallback(
    (next: number, direction: number) => {
      if (next === stepRef.current) return;
      if (stepTransitionPhaseRef.current !== 'idle') {
        pendingStepTransitionRef.current = { next, direction };
        return;
      }

      const version = stepTransitionVersionRef.current + 1;
      stepTransitionVersionRef.current = version;
      stepTransitionRef.current?.stop();
      stepTransitionPhaseRef.current = 'exiting';

      const exit = Animated.parallel([
        Animated.timing(stepOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateX, {
          toValue: -direction * STEP_SLIDE_DISTANCE,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      stepTransitionRef.current = exit;
      exit.start(({ finished }) => {
        if (version !== stepTransitionVersionRef.current) return;
        if (!finished) {
          stepTransitionPhaseRef.current = 'idle';
          stepTransitionRef.current = null;
          return;
        }
        stepTranslateX.setValue(direction * STEP_SLIDE_DISTANCE);
        stepRef.current = next;
        stepScrollRef.current?.scrollTo({ y: 0, animated: false });
        setStep(next);
      });
    },
    [stepOpacity, stepTranslateX, steps],
  );

  animateToStepRef.current = animateToStep;

  // Step enter animation
  useEffect(() => {
    if (isInitialStep.current) {
      isInitialStep.current = false;
      return;
    }

    const version = stepTransitionVersionRef.current + 1;
    stepTransitionVersionRef.current = version;
    stepTransitionPhaseRef.current = 'entering';

    const enter = Animated.parallel([
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(stepTranslateX, {
        toValue: 0,
        damping: 18,
        stiffness: 140,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]);

    stepTransitionRef.current = enter;
    enter.start(({ finished }) => {
      if (version !== stepTransitionVersionRef.current) return;
      if (!finished) {
        stepTransitionPhaseRef.current = 'idle';
        return;
      }
      stepTransitionPhaseRef.current = 'idle';
      stepTransitionRef.current = null;
      flushPendingStepTransition();
    });

    return () => enter.stop();
  }, [flushPendingStepTransition, step, stepOpacity, stepTranslateX]);

  // Cleanup all transition state on unmount
  useEffect(
    () => () => {
      stepTransitionPhaseRef.current = 'idle';
      pendingStepTransitionRef.current = null;
      stepTransitionRef.current?.stop();
      stepTransitionRef.current = null;
    },
    [],
  );

  // Entrance animation
  const startEntranceAnimation = useCallback(() => {
    if (hasStartedEntranceRef.current) return;
    hasStartedEntranceRef.current = true;

    entranceTimeoutRef.current = setTimeout(() => {
      const entrance = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 680,
          easing: ENTRANCE_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 760,
          easing: ENTRANCE_EASING,
          useNativeDriver: true,
        }),
      ]);

      entranceAnimationRef.current = entrance;
      entrance.start(({ finished }) => {
        if (finished) entranceAnimationRef.current = null;
      });
    }, 80);
  }, [fadeAnim, scaleAnim]);

  useEffect(
    () => () => {
      if (entranceTimeoutRef.current) {
        clearTimeout(entranceTimeoutRef.current);
        entranceTimeoutRef.current = null;
      }
      entranceAnimationRef.current?.stop();
      entranceAnimationRef.current = null;
    },
    [],
  );

  // Report when the final step is reached
  useEffect(() => {
    if (isFinal) onOfferReached?.();
  }, [isFinal, onOfferReached]);

  const handleNext = useCallback(() => {
    if (step < stepCount - 1) animateToStep(step + 1, 1);
  }, [animateToStep, step, stepCount]);

  const handleBack = useCallback(() => {
    if (step > 0) animateToStep(step - 1, -1);
  }, [animateToStep, step]);

  const handleContinueWithoutPro = useCallback(() => {
    if (isBusy || onContinueWithoutPro == null) return;
    onContinueWithoutPro();
  }, [isBusy, onContinueWithoutPro]);

  const trialDuration =
    annualPackage?.trialLabel?.replace(/\s+free trial$/i, '') ?? '7-day';
  const isAnnualSelected = selectedPackageId === 'annual';
  const ctaLabel =
    isAnnualSelected && selectedPackageHasTrial
      ? `Start my ${trialDuration} free trial`
      : isAnnualSelected
        ? 'Subscribe yearly'
        : 'Continue with weekly';

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.screenBody,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <Animated.View
          onLayout={startEntranceAnimation}
          style={[
            styles.entrance,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.header}>
            {step > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={12}
                disabled={isBusy}
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.subtlePressed,
                  isBusy && styles.disabled,
                ]}
              >
                <Text style={styles.headerText}>{'\u2039'}</Text>
              </Pressable>
            ) : (
              <View style={styles.headerButton} />
            )}
            {isFinal && onContinueWithoutPro != null ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue with limits"
                hitSlop={12}
                disabled={isBusy}
                onPress={handleContinueWithoutPro}
                style={({ pressed }) => [
                  styles.headerDeclineButton,
                  pressed && styles.subtlePressed,
                  isBusy && styles.disabled,
                ]}
              >
                <Text style={styles.headerDeclineText}>
                  Continue with limits
                </Text>
              </Pressable>
            ) : (
              <View style={styles.headerButton} />
            )}
          </View>

          <ScrollView
            ref={stepScrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled
            alwaysBounceVertical={false}
          >
            <Animated.View style={styles.content}>
              <Animated.View
                style={[
                  styles.stepLayer,
                  {
                    opacity: stepOpacity,
                    transform: [{ translateX: stepTranslateX }],
                  },
                ]}
              >
                {activeStep === 'benefits' ? (
                  <PaywallBenefitsStep hasTrial={showFreeTrialIntro} />
                ) : null}
                {activeStep === 'comparison' ? (
                  <PaywallFreeVsProStep
                    hasTrial={showFreeTrialIntro}
                    trialDuration={trialDuration}
                    intent={planIntent}
                    durationMinutes={primarySessionMinutes}
                  />
                ) : null}
                {activeStep === 'hero' ? <PaywallFreeTrialHeroStep /> : null}
                {activeStep === 'plan' ? (
                  <View style={styles.finalStepContent}>
                    <PaywallTrialStep
                      hasAnnualTrial={hasAnnualTrial}
                      trialLabel={annualPackage?.trialLabel}
                    />
                    {hasAnnualTrial ? (
                      <View style={paywallStepStyles.reminderToggleWrap}>
                        <PaywallTrialReminderToggle
                          disabled={!selectedPackageHasTrial}
                        />
                      </View>
                    ) : null}
                    <PaywallChoosePlanStep
                      isLoading={isLoading}
                      annualPackage={annualPackage}
                      weeklyPackage={weeklyPackage}
                      selectedPackageId={selectedPackageId}
                      onSelectPackage={onSelectPackage}
                      savingsPercent={savingsPercent}
                      hasAnnualTrial={hasAnnualTrial}
                    />
                    <Text style={styles.refundNote}>{REFUND_REASSURANCE}</Text>
                  </View>
                ) : null}
              </Animated.View>

              {isFinal && errorMessage ? (
                <View style={styles.errorBlock}>
                  <Text style={styles.error}>{errorMessage}</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isBusy}
                    onPress={onRetry}
                    style={({ pressed }) => [
                      styles.retryButton,
                      pressed && styles.subtlePressed,
                      isBusy && styles.disabled,
                    ]}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              ) : null}
            </Animated.View>
          </ScrollView>
        </Animated.View>

        <View style={styles.footerBar}>
          <View style={styles.footerInner}>
            {!isFinal ? (
              <>
                <View style={styles.noPaymentRow}>
                  <Icon
                    name="check"
                    size={NO_PAYMENT_ICON_SIZE}
                    color={colors.text.primary}
                  />
                  <Text style={styles.noPaymentText}>No Payment Due Now</Text>
                </View>
                <OnboardingPrimaryButton
                  label="Continue"
                  onPress={handleNext}
                  disabled={isBusy}
                />
              </>
            ) : (
              <>
                <View style={styles.noPaymentRow}>
                  <Icon
                    name="check"
                    size={NO_PAYMENT_ICON_SIZE}
                    color={colors.text.primary}
                  />
                  <Text style={styles.noPaymentText}>
                    {selectedPackageHasTrial
                      ? 'No Payment Due Now'
                      : 'Cancel Anytime In Seconds'}
                  </Text>
                </View>
                <OnboardingPrimaryButton
                  label={ctaLabel}
                  onPress={() => onPurchase(selectedPackageId)}
                  loading={isPurchasing || isCompleting}
                  disabled={
                    isLoading ||
                    selectedPackage == null ||
                    isRestoring ||
                    isCompleting
                  }
                />
                <PaywallFooterLinks
                  isRestoring={isRestoring}
                  restoreDisabled={isBusy}
                  onRestore={onRestore}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// ── No-trial long-form paywall ────────────────────────────────────────
function LongFormPaywall({
  offering,
  selectedPackageId,
  planIntent,
  planPreset,
  primarySessionMinutes,
  paywallMode,
  name,
  isLoading,
  isPurchasing,
  isRestoring,
  isCompleting,
  errorMessage,
  onPurchase,
  onOfferPurchased,
  onRestore,
  onRetry,
  onContinueWithoutPro,
  onOfferReached,
}: Omit<OnboardingPaywallScreenProps, 'selectedIntents' | 'stepIndex' | 'stepCount'> & {
  onOfferReached?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const entranceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entranceAnimationRef = useRef<{ stop: () => void } | null>(null);
  const hasStartedEntranceRef = useRef(false);
  const hasReportedOfferRef = useRef(false);

  const annualPackage = offering?.packages.find((pkg) => pkg.id === 'annual');
  const weeklyPackage = offering?.packages.find((pkg) => pkg.id === 'weekly');
  const selectedPackage = offering?.packages.find(
    (pkg) => pkg.id === selectedPackageId,
  );
  const hasAnnualTrial = annualPackage?.trialLabel != null;
  const selectedPackageHasTrial = selectedPackage?.trialLabel != null;
  const trialDuration = annualPackage?.trialLabel?.replace(/\s+free trial$/i, '');
  const isBusy = isLoading || isPurchasing || isRestoring || isCompleting;

  const savingsPercent = useMemo(
    () => computeAnnualSavings(annualPackage, weeklyPackage),
    [annualPackage, weeklyPackage],
  );

  // A hard paywall has no free tier, so there is no Free column to compare
  // against on the page either.
  const showPlanComparison = paywallMode !== 'hard';

  const [showSpecialOffer, setShowSpecialOffer] = useState(false);

  const anchorPaywall = usePaywall({
    placement: PaywallPlacement.ProfileUpgrade,
    sourceScreen: 'onboarding_anchor',
  });
  // The popup sells a different price than this page asks, so it reads its own
  // offering rather than the one onboarding loaded.
  const offerPaywall = usePaywall({
    placement: PaywallPlacement.ExitDiscount,
    sourceScreen: 'onboarding_special_offer',
  });

  const anchorAnnual = useMemo(
    () => anchorPaywall.offering?.packages.find((pkg) => pkg.id === 'annual') ?? null,
    [anchorPaywall.offering],
  );
  const offerAnnual = useMemo(
    () => offerPaywall.offering?.packages.find((pkg) => pkg.id === 'annual') ?? null,
    [offerPaywall.offering],
  );
  const discountPercent = useMemo(
    () => computeDiscountPercent(anchorAnnual, offerAnnual),
    [anchorAnnual, offerAnnual],
  );

  useEffect(() => {
    void loadCriticalOnboardingImages();
  }, []);

  const startEntranceAnimation = useCallback(() => {
    if (hasStartedEntranceRef.current) return;
    hasStartedEntranceRef.current = true;

    entranceTimeoutRef.current = setTimeout(() => {
      const entrance = Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 680,
        easing: ENTRANCE_EASING,
        useNativeDriver: true,
      });

      entranceAnimationRef.current = entrance;
      entrance.start(({ finished }) => {
        if (finished) entranceAnimationRef.current = null;
      });
    }, 80);
  }, [fadeAnim]);

  useEffect(
    () => () => {
      if (entranceTimeoutRef.current) {
        clearTimeout(entranceTimeoutRef.current);
        entranceTimeoutRef.current = null;
      }
      entranceAnimationRef.current?.stop();
      entranceAnimationRef.current = null;
    },
    [],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (hasReportedOfferRef.current) return;
      const { contentOffset, layoutMeasurement, contentSize } =
        event.nativeEvent;
      const scrollable = contentSize.height - layoutMeasurement.height;
      if (scrollable <= 0) return;
      if (contentOffset.y / scrollable < OFFER_REACHED_SHARE) return;
      hasReportedOfferRef.current = true;
      onOfferReached?.();
    },
    [onOfferReached],
  );

  const handleContinueWithoutPro = useCallback(() => {
    if (isBusy || onContinueWithoutPro == null) return;
    onContinueWithoutPro();
  }, [isBusy, onContinueWithoutPro]);

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.screenBody,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <Animated.View
          onLayout={startEntranceAnimation}
          style={[styles.entrance, { opacity: fadeAnim }]}
        >
          <View style={styles.header}>
            <View style={styles.headerButton} />
            {onContinueWithoutPro != null ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue with limits"
                hitSlop={12}
                disabled={isBusy}
                onPress={handleContinueWithoutPro}
                style={({ pressed }) => [
                  styles.headerDeclineButton,
                  pressed && styles.subtlePressed,
                  isBusy && styles.disabled,
                ]}
              >
                <Text style={styles.headerDeclineText}>
                  Continue with limits
                </Text>
              </Pressable>
            ) : (
              <View style={styles.headerButton} />
            )}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={64}
          >
            <ScreenContent width="dashboard">
              <PaywallLongForm
                name={name}
                intent={planIntent ?? 'stress_relief'}
                preset={planPreset}
                sessionMinutes={primarySessionMinutes}
                comparison={
                  showPlanComparison ? (
                    // On the page this is one of its own sections rather than a
                    // deck step.
                    <PaywallFreeVsProStep
                      hasTrial={hasAnnualTrial}
                      trialDuration={trialDuration}
                      intent={planIntent}
                      durationMinutes={primarySessionMinutes}
                      layout="section"
                    />
                  ) : null
                }
                // Trial-only: there is a timeline to explain only when the plan
                // actually bills on a date.
                howItWorks={
                  hasAnnualTrial ? (
                    <PaywallTrialStep
                      hasAnnualTrial={hasAnnualTrial}
                      trialLabel={annualPackage?.trialLabel}
                      layout="section"
                    />
                  ) : null
                }
                // The reminder the timeline promises, and the control for it —
                // this page is the only place a hard trial sees either.
                trialReminder={
                  hasAnnualTrial ? (
                    <PaywallTrialReminderToggle
                      disabled={!selectedPackageHasTrial}
                    />
                  ) : null
                }
                claimOfferSlot={
                  <ChunkyButton
                    label={discountPercent != null ? `Claim your special offer · -${discountPercent}%` : 'Claim your special offer'}
                    onPress={() => setShowSpecialOffer(true)}
                    style={styles.claimButton}
                  />
                }
                footerSlot={
                  errorMessage ? (
                    <View style={styles.errorBlock}>
                      <Text style={styles.error}>{errorMessage}</Text>
                      <Pressable
                        accessibilityRole="button"
                        disabled={isBusy}
                        onPress={onRetry}
                        style={({ pressed }) => [
                          styles.retryButton,
                          pressed && styles.subtlePressed,
                          isBusy && styles.disabled,
                        ]}
                      >
                        <Text style={styles.retryText}>Retry</Text>
                      </Pressable>
                    </View>
                  ) : null
                }
              />
            </ScreenContent>
          </ScrollView>
        </Animated.View>

        <View style={styles.footerBar}>
          <View style={styles.footerInner}>
            <View style={styles.noPaymentRow}>
              <Icon
                name="check"
                size={NO_PAYMENT_ICON_SIZE}
                color={colors.text.primary}
              />
              <Text style={styles.noPaymentText}>
                {hasAnnualTrial
                  ? 'No Payment Due Now'
                  : '30-Day Money-Back Guarantee'}
              </Text>
            </View>
            <PaywallTrayPlans
              annualPackage={annualPackage}
              weeklyPackage={weeklyPackage}
              selectedPackageId={selectedPackageId}
              savingsPercent={savingsPercent}
              isLoading={isLoading}
              disabled={isBusy}
              light
              onPurchase={onPurchase}
            />
            <PaywallFooterLinks
              isRestoring={isRestoring}
              restoreDisabled={isBusy}
              onRestore={onRestore}
            />
          </View>
        </View>
      </View>

      {showSpecialOffer ? (
        <SpecialOfferPopup
          paywall={offerPaywall}
          anchorPaywall={anchorPaywall}
          onPurchased={onOfferPurchased}
          onDismiss={() => setShowSpecialOffer(false)}
        />
      ) : null}
    </View>
  );
}

// ── Router ────────────────────────────────────────────────────────────
export default function OnboardingPaywallScreen(
  props: OnboardingPaywallScreenProps,
) {
  const annualPackage = props.offering?.packages.find(
    (pkg) => pkg.id === 'annual',
  );
  const hasAnnualTrial = annualPackage?.trialLabel != null;
  const isHardPaywall = props.paywallMode === 'hard';
  const hasOffering = props.offering != null;

  // The offering resolves after this screen is already up, and the shared hook
  // reports "not loading" on the first frame because its fetch only starts once
  // the paywall step mounts. An offering that has not arrived and an error that
  // has not fired mean the answer is still in flight, so neither page mounts
  // yet: the free-trial deck must never be shown on spec and then swapped for
  // the page — that swap is the half-second flash right after the seal.
  const isOfferingPending =
    props.offering == null && (props.isLoading || props.errorMessage == null);

  // Only the soft trial steps. Everything else pages: a plan with no trial has
  // nothing to step through, and a hard paywall has both no free tier and no
  // decline, so it goes where the timeline can explain the trial in one read.
  if (isOfferingPending) {
    return <PaywallHold />;
  }

  if (hasOffering && (!hasAnnualTrial || isHardPaywall)) {
    return <LongFormPaywall {...props} />;
  }

  return <TrialDeck {...props} />;
}

/**
 * The quiet beat between the seal and the paywall: the same canvas both pages
 * paint, so the page's entrance fade reads as one continuous surface rather
 * than a swap. It exists so no paywall page is ever shown before the
 * presentation behind it is known — a failed load still lands on the deck,
 * where its error and retry live.
 */
function PaywallHold() {
  return <View style={styles.screen} />;
}

// ── Shared styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  screenBody: {
    flex: 1,
  },
  entrance: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  headerButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontFamily: fonts.semibold,
    fontSize: scaleType(34),
    lineHeight: scaleType(34),
    color: colors.text.primary,
  },
  headerDeclineButton: {
    height: HEADER_BUTTON_SIZE,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerDeclineText: {
    ...typography.button.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  content: {
    gap: spacing.lg,
    flexGrow: 1,
  },
  stepLayer: {
    flexGrow: 1,
  },
  finalStepContent: {
    gap: spacing.sm,
  },
  noPaymentRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  noPaymentText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  refundNote: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  errorBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 20,
    padding: spacing.md,
    backgroundColor: colors.error[100],
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.card,
  },
  retryText: {
    ...typography.button.small,
    fontFamily: fonts.semibold,
    color: colors.error[700],
  },
  footerBar: {
    ...card.trayShadow,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  footerInner: {
    ...dashboardContentColumn,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  subtlePressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
  claimButton: {
    alignSelf: 'stretch',
  },
});
