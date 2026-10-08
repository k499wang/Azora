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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../common/Text';
import type {
  PaywallMode,
  PaywallOffering,
  PaywallPackageId,
} from '../../../services/paywall';
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
import { paywallStepStyles } from '../paywall/paywallStepStyles';

// ── Shared constants ──────────────────────────────────────────────────
const HEADER_BUTTON_SIZE = scaleControl(36);
const NO_PAYMENT_ICON_SIZE = scaleControl(18);
const ENTRANCE_EASING = Easing.bezier(0.22, 1, 0.36, 1);

// ── Deck constants ────────────────────────────────────────────────────
type PaywallStepKey = 'benefits' | 'hero' | 'plan';
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
  primarySessionMinutes: number;
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
}

// ── Deck (trial path) ─────────────────────────────────────────────────
// Mount after the offering resolves so trial introductions reflect eligibility.
function TrialDeck({
  initialStep,
  preview = false,
  offering,
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
  const showFreeTrialIntro = hasAnnualTrial;
  const isBusy = isLoading || isPurchasing || isRestoring || isCompleting;

  const savingsPercent = useMemo(
    () => computeAnnualSavings(annualPackage, weeklyPackage),
    [annualPackage, weeklyPackage],
  );

  // Step state
  const [step, setStep] = useState(0);
  const steps: PaywallStepKey[] = hasAnnualTrial && initialStep !== 'plan'
    ? TRIAL_STEPS
    : ['plan'];
  const stepCount = steps.length;
  const activeStep = steps[Math.min(step, stepCount - 1)];
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
        if (finished) entranceAnimationRef.current = null;
      });
    }, 80);
  }, [fadeAnim, initialStep]);

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
    if (isBusy || paywallMode === 'hard' || onContinueWithoutPro == null) return;
    onContinueWithoutPro();
  }, [isBusy, paywallMode, onContinueWithoutPro]);

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
            { opacity: fadeAnim },
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
                  <PaywallBenefitsStep hasTrial={showFreeTrialIntro} />
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
                          preview={preview}
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

  return <TrialDeck {...props} />;
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
