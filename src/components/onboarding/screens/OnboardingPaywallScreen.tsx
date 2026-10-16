import { entranceTiming } from '../entranceTiming';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Reanimated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../common/Text';
import type {
  PaywallMode,
  PaywallOffering,
  PaywallPackageId,
  PaywallStepKey,
  PaywallStepView,
} from '../../../services/paywall';
import { useWhileVisible } from '../../../hooks/useWhileVisible';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { dashboardContentColumn } from '../../../theme/breakpoints';
import { spacing } from '../../../theme/spacing';
import { fonts, scaleType, typography } from '../../../theme/typography';
import { scaleControl } from '../onboardingVisualScale';
import Icon from '../../common/icons/Icon';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { computeAnnualSavings } from '../../../lib/paywall/planPrice';
import { REFUND_REASSURANCE } from '../../../lib/paywall/paywallReassurance';
import { PaywallChoosePlanStep } from '../paywall/PaywallChoosePlanStep';
import { PaywallFreeTrialHeroStep } from '../paywall/PaywallFreeTrialHeroStep';
import { PaywallBenefitsStep } from '../paywall/PaywallBenefitsStep';
import { PaywallFooterLinks } from '../../paywall/PaywallFooterLinks';
import { NoTrialLongPaywall } from '../../paywall/NoTrialLongPaywall';
import PaywallTrialReminderToggle from '../../paywall/PaywallTrialReminderToggle';
import { PaywallTrialStep } from '../paywall/PaywallTrialStep';
import type { OnboardingIntent } from '../types';
import type { OnboardingPreset } from '../../../lib/onboardingPreset';
import type { MindMapScore } from '../../../lib/onboardingScores';
import { paywallStepStyles } from '../paywall/paywallStepStyles';

// ── Shared constants ──────────────────────────────────────────────────
const HEADER_BUTTON_SIZE = scaleControl(36);
const NO_PAYMENT_ICON_SIZE = scaleControl(18);
const ENTRANCE_EASING = Easing.bezier(0.22, 1, 0.36, 1);

// ── Deck constants ────────────────────────────────────────────────────
// Trial introductions lead into the same compact plan screen.
const TRIAL_STEPS: PaywallStepKey[] = ['benefits', 'hero', 'plan'];
const STEP_SLIDE_DISTANCE = 40;
type StepTransitionPhase = 'idle' | 'exiting' | 'entering';

// ── Props ─────────────────────────────────────────────────────────────
interface OnboardingPaywallScreenProps {
  /** Visual-only Settings preview; disables reminder changes. */
  preview?: boolean;
  offering: PaywallOffering | null;
  planIntent?: OnboardingIntent;
  planPreset: OnboardingPreset;
  selectedIntents?: OnboardingIntent[];
  goalPhrase?: string | null;
  /** Their stakes answer as the first benefit; null falls back to the generic line. */
  stakesBenefit?: string | null;
  scores?: MindMapScore[];
  /** Open directly on the compact plan screen for in-app upgrades. */
  initialStep?: 'plan';
  /** `hard` locks the app and removes free continuation. */
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
  /** Reports a laid-out step after its entrance completes in the foreground. */
  onStepViewed?: (view: PaywallStepView) => void;
}

// ── Deck (trial path) ─────────────────────────────────────────────────
// Mount after the offering resolves so trial introductions reflect eligibility.
function TrialDeck({
  initialStep,
  preview = false,
  offering,
  planIntent,
  stakesBenefit,
  paywallMode,
  selectedPackageId,
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
  onStepViewed,
  onExit,
}: Omit<OnboardingPaywallScreenProps, 'selectedIntents' | 'stepIndex' | 'stepCount'> & {
  onOfferReached?: () => void;
  /** Shows a back control on the first step that leaves the deck. */
  onExit?: () => void;
}) {
  const insets = useSafeAreaInsets();

  const selectedPackage = offering?.packages.find(
    (pkg) => pkg.id === selectedPackageId,
  );
  const annualPackage = offering?.packages.find((pkg) => pkg.id === 'annual');
  const monthlyPackage = offering?.packages.find((pkg) => pkg.id === 'monthly');
  const hasAnnualTrial = annualPackage?.trialLabel != null;
  const selectedPackageHasTrial = selectedPackage?.trialLabel != null;
  const showFreeTrialIntro = hasAnnualTrial;
  const isBusy = isLoading || isPurchasing || isRestoring || isCompleting;

  const savingsPercent = useMemo(
    () => computeAnnualSavings(annualPackage, monthlyPackage),
    [annualPackage, monthlyPackage],
  );

  // Step state
  const [step, setStep] = useState(0);
  const steps: PaywallStepKey[] = hasAnnualTrial && initialStep !== 'plan'
    ? TRIAL_STEPS
    : ['plan'];
  const stepCount = steps.length;
  const activeStepIndex = Math.min(step, stepCount - 1);
  const activeStep = steps[activeStepIndex];
  const stepRef = useRef(step);
  const isFinal = step === stepCount - 1;

  // Animation values
  // Direct plan screens use the navigator's slide-up entrance.
  const fadeAnim = useRef(new Animated.Value(initialStep === 'plan' ? 1 : 0)).current;
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
  const isVisibleRef = useRef(false);
  const hasLaidOutRef = useRef(false);
  const hasFinishedEntranceRef = useRef(initialStep === 'plan');
  const settledStepRef = useRef<PaywallStepView | null>(null);
  const reportedStepRef = useRef<PaywallStepView | null>(null);
  const stepViewContextRef = useRef({ preview, offering, onStepViewed, activeStep, activeStepIndex, stepCount });
  stepViewContextRef.current = { preview, offering, onStepViewed, activeStep, activeStepIndex, stepCount };

  const reportVisibleStep = useCallback(() => {
    const context = stepViewContextRef.current;
    const view = settledStepRef.current;
    if (context.preview || context.offering == null || !context.onStepViewed || !view ||
      !isVisibleRef.current || !hasLaidOutRef.current || !hasFinishedEntranceRef.current ||
      stepTransitionPhaseRef.current !== 'idle' || view.step !== context.activeStep ||
      view.index !== context.activeStepIndex + 1 || view.count !== context.stepCount) return;
    const previous = reportedStepRef.current;
    if (previous?.step === view.step && previous.index === view.index && previous.count === view.count) return;
    reportedStepRef.current = view;
    context.onStepViewed(view);
  }, []);

  useWhileVisible(() => {
    isVisibleRef.current = true;
    reportVisibleStep();
    return () => { isVisibleRef.current = false; };
  }, [reportVisibleStep]);

  useEffect(() => {
    // Revalidation may replace a trial deck with a single plan screen.
    if (settledStepRef.current && stepTransitionPhaseRef.current === 'idle') {
      settledStepRef.current = { step: activeStep, index: activeStepIndex + 1, count: stepCount };
      reportVisibleStep();
    }
  }, [activeStep, activeStepIndex, stepCount, offering, preview, onStepViewed, reportVisibleStep]);

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
      settledStepRef.current = null;

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
      const context = stepViewContextRef.current;
      settledStepRef.current = { step: context.activeStep, index: context.activeStepIndex + 1, count: context.stepCount };
      reportVisibleStep();
      flushPendingStepTransition();
    });

    return () => enter.stop();
  }, [flushPendingStepTransition, reportVisibleStep, step, stepOpacity, stepTranslateX]);

  // Cleanup all transition state on unmount
  useEffect(
    () => () => {
      stepTransitionVersionRef.current += 1;
      stepTransitionPhaseRef.current = 'idle';
      pendingStepTransitionRef.current = null;
      stepTransitionRef.current?.stop();
      stepTransitionRef.current = null;
    },
    [],
  );

  // Entrance animation
  const startEntranceAnimation = useCallback(() => {
    if (initialStep === 'plan') return;
    if (hasStartedEntranceRef.current) return;
    hasStartedEntranceRef.current = true;

    entranceTimeoutRef.current = setTimeout(() => {
      // Keep artwork at its final size so the fade does not resample SVGs.
      const entrance = Animated.timing(fadeAnim, {
        toValue: 1,
        duration: entranceTiming.fade,
        easing: ENTRANCE_EASING,
        useNativeDriver: true,
      });

      entranceAnimationRef.current = entrance;
      entrance.start(({ finished }) => {
        if (!finished) return;
        entranceAnimationRef.current = null;
        hasFinishedEntranceRef.current = true;
        if (stepRef.current === 0 && stepTransitionPhaseRef.current === 'idle') {
          const context = stepViewContextRef.current;
          settledStepRef.current = { step: context.activeStep, index: 1, count: context.stepCount };
        }
        reportVisibleStep();
      });
    }, 80);
  }, [fadeAnim, initialStep, reportVisibleStep]);

  const handleLayout = useCallback(() => {
    hasLaidOutRef.current = true;
    if (initialStep === 'plan') {
      settledStepRef.current = { step: 'plan', index: 1, count: 1 };
      reportVisibleStep();
    }
    startEntranceAnimation();
  }, [initialStep, reportVisibleStep, startEntranceAnimation]);

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
    else onExit?.();
  }, [animateToStep, onExit, step]);

  const handleContinueWithoutPro = useCallback(() => {
    if (isBusy || paywallMode === 'hard' || onContinueWithoutPro == null) return;
    onContinueWithoutPro();
  }, [isBusy, paywallMode, onContinueWithoutPro]);

  const trialDuration =
    annualPackage?.trialLabel?.replace(/\s+free trial$/i, '') ?? '7-day';
  const isAnnualSelected = selectedPackageId === 'annual';
  const trialDays = trialDuration.replace(/-day$/i, ' days');
  const monthlyIntro = monthlyPackage?.introOffer;
  const ctaLabel =
    isAnnualSelected && selectedPackageHasTrial
      ? `Redeem ${trialDays} for $0.00`
      : isAnnualSelected
        ? 'Subscribe yearly'
        : monthlyIntro != null
          ? `Redeem ${monthlyIntro.days} days for ${monthlyIntro.priceString}`
          : 'Continue with monthly';

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
          onLayout={handleLayout}
          style={[
            styles.entrance,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.header}>
            {step > 0 || onExit != null ? (
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
            {isFinal && paywallMode !== 'hard' && onContinueWithoutPro != null ? (
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
            ) : preview && paywallMode !== 'hard' && onContinueWithoutPro != null ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close paywall preview"
                hitSlop={12}
                onPress={onContinueWithoutPro}
                style={styles.headerDeclineButton}
              >
                <Text style={styles.headerDeclineText}>Close preview</Text>
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
                  <PaywallBenefitsStep
                    hasTrial={showFreeTrialIntro}
                    intent={planIntent}
                    stakesBenefit={stakesBenefit}
                  />
                ) : null}
                {activeStep === 'hero' ? <PaywallFreeTrialHeroStep /> : null}
                {activeStep === 'plan' ? (
                  <View style={styles.finalStepContent}>
                    <PaywallTrialStep
                      hasAnnualTrial={hasAnnualTrial}
                      trialLabel={annualPackage?.trialLabel}
                      paidTrial={
                        selectedPackageId === 'monthly' && monthlyIntro != null && monthlyPackage != null
                          ? {
                              days: monthlyIntro.days,
                              introPrice: monthlyIntro.priceString,
                              renewalPrice: monthlyPackage.priceString,
                            }
                          : null
                      }
                    />
                    {hasAnnualTrial ? (
                      <View style={paywallStepStyles.reminderToggleWrap}>
                        <PaywallTrialReminderToggle
                          preview={preview}
                          disabled={!selectedPackageHasTrial && !(selectedPackageId === 'monthly' && monthlyIntro != null)}
                        />
                      </View>
                    ) : null}
                    <PaywallChoosePlanStep
                      isLoading={isLoading}
                      annualPackage={annualPackage}
                      monthlyPackage={monthlyPackage}
                      selectedPackageId={selectedPackageId}
                      onSelectPackage={onSelectPackage}
                      savingsPercent={savingsPercent}
                      hasAnnualTrial={hasAnnualTrial}
                    />
                    {preview ? <Text style={styles.refundNote}>Sample prices · Preview only</Text> : null}
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
                  label={activeStep === 'benefits' ? 'Try for $0.00' : 'Continue for free'}
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
                  disabled={isBusy || selectedPackage == null}
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

// ── Router ────────────────────────────────────────────────────────────
export default function OnboardingPaywallScreen(
  props: OnboardingPaywallScreenProps,
) {
  const isOfferingPending =
    props.offering == null && (props.isLoading || props.errorMessage == null);

  if (isOfferingPending) {
    return <PaywallHold />;
  }

  // Opted into per offering from RevenueCat, so no one sees the long page
  // until an offering they are served carries `paywall_layout: "long"`.
  if (props.offering?.paywallLayout === 'long') {
    return <NoTrialLongPaywall {...props} />;
  }

  if (props.offering?.paywallLayout === 'long_then_trial') {
    return <LongThenTrialPaywall {...props} />;
  }

  return <TrialDeck {...props} />;
}

const TRIAL_SHEET_MS = 320;

function LongThenTrialPaywall(props: OnboardingPaywallScreenProps) {
  const [atTrial, setAtTrial] = useState(false);

  return (
    <View style={styles.screen}>
      <NoTrialLongPaywall {...props} onContinue={() => setAtTrial(true)} />
      {atTrial ? (
        <Reanimated.View
          entering={SlideInDown.duration(TRIAL_SHEET_MS)}
          exiting={SlideOutDown.duration(TRIAL_SHEET_MS)}
          style={StyleSheet.absoluteFill}
        >
          <TrialDeck {...props} initialStep="plan" onExit={() => setAtTrial(false)} />
        </Reanimated.View>
      ) : null}
    </View>
  );
}

/**
 * Wait for trial eligibility before mounting the deck. Failed loads show its
 * error and retry controls.
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  subtlePressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
});
