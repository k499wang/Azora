import { Text } from '../../common/Text';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
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
import { PaywallFreeVsProStep } from '../paywall/PaywallFreeVsProStep';
import { PaywallTrialStep } from '../paywall/PaywallTrialStep';
import { PaywallFooterLinks } from '../../paywall/PaywallFooterLinks';
import PaywallTrialReminderToggle from '../../paywall/PaywallTrialReminderToggle';
import type { PaywallFeature } from '../../paywall/PaywallFeatureList';
import type { OnboardingIntent } from '../types';
import { paywallStepStyles } from '../paywall/paywallStepStyles';

const STEP_COUNT = 4;
const HEADER_BUTTON_SIZE = scaleControl(36);
const NO_PAYMENT_ICON_SIZE = scaleControl(18);
const STEP_SLIDE_DISTANCE = 40;
const ENTRANCE_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const ENTRANCE_INITIAL_SCALE = 0.992;
type StepTransitionPhase = 'idle' | 'exiting' | 'entering';

interface OnboardingPaywallScreenProps {
  offering: PaywallOffering | null;
  /** Personalized "your trial unlocks" bullets built from the plan just created. */
  planHighlights?: PaywallFeature[];
  /** The goal the plan was built around, so the intro headline can name it. */
  planIntent?: OnboardingIntent;
  /** Duration of the primary session configured before this deck. */
  primarySessionMinutes: number;
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
  onPurchase: () => void;
  onRestore: () => void;
  onRetry: () => void;
  // Absent under the hard paywall: no self-serve decline; exit intent
  // (cancelled purchase / idling on the plan step) drives the exit offer.
  onContinueWithoutPro?: () => void;
  onFinalStepReached?: () => void;
}

export default function OnboardingPaywallScreen({
  offering,
  planHighlights,
  planIntent,
  primarySessionMinutes,
  name,
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
  onFinalStepReached,
}: OnboardingPaywallScreenProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const stepRef = useRef(step);
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const stepTranslateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(ENTRANCE_INITIAL_SCALE)).current;
  const isInitialStep = useRef(true);
  const entranceAnimationRef = useRef<{ stop: () => void } | null>(null);
  const entranceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedEntranceRef = useRef(false);
  const stepTransitionRef = useRef<{ stop: () => void } | null>(null);
  const stepTransitionVersionRef = useRef(0);
  const stepTransitionPhaseRef = useRef<StepTransitionPhase>('idle');
  const pendingStepTransitionRef = useRef<{
    next: number;
    direction: number;
  } | null>(null);
  const animateToStepRef = useRef<(next: number, direction: number) => void>(
    () => {},
  );

  const selectedPackage = offering?.packages.find((pkg) => pkg.id === selectedPackageId);
  const annualPackage = offering?.packages.find((pkg) => pkg.id === 'annual');
  const weeklyPackage = offering?.packages.find((pkg) => pkg.id === 'weekly');
  const isAnnualSelected = selectedPackageId === 'annual';
  const hasAnnualTrial = annualPackage?.trialLabel != null;
  const selectedPackageHasTrial = selectedPackage?.trialLabel != null;
  // The first three steps are one stable free-trial presentation. Store
  // eligibility only changes transactional copy on the plan step below.
  const showFreeTrialIntro = true;
  const isBusy = isLoading || isPurchasing || isRestoring || isCompleting;

  const savingsPercent = useMemo(
    () => computeAnnualSavings(annualPackage, weeklyPackage),
    [annualPackage, weeklyPackage],
  );

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const flushPendingStepTransition = useCallback(() => {
    const pendingTransition = pendingStepTransitionRef.current;
    pendingStepTransitionRef.current = null;
    if (!pendingTransition || pendingTransition.next === stepRef.current) {
      return;
    }
    animateToStepRef.current(
      pendingTransition.next,
      pendingTransition.direction,
    );
  }, []);

  const startEntranceAnimation = useCallback(() => {
    if (hasStartedEntranceRef.current) return;
    hasStartedEntranceRef.current = true;

    entranceTimeoutRef.current = setTimeout(() => {
      const entranceAnimation = Animated.parallel([
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

      entranceAnimationRef.current = entranceAnimation;
      entranceAnimation.start(({ finished }) => {
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

  const animateToStep = useCallback(
    (next: number, direction: number) => {
      if (next === stepRef.current) return;
      if (stepTransitionPhaseRef.current !== 'idle') {
        pendingStepTransitionRef.current = { next, direction };
        return;
      }

      const transitionVersion = stepTransitionVersionRef.current + 1;
      stepTransitionVersionRef.current = transitionVersion;
      stepTransitionRef.current?.stop();
      stepTransitionPhaseRef.current = 'exiting';

      const exitAnimation = Animated.parallel([
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

      stepTransitionRef.current = exitAnimation;
      exitAnimation.start(({ finished }) => {
        if (transitionVersion !== stepTransitionVersionRef.current) return;
        if (!finished) {
          stepTransitionPhaseRef.current = 'idle';
          stepTransitionRef.current = null;
          return;
        }
        stepTranslateX.setValue(direction * STEP_SLIDE_DISTANCE);
        stepRef.current = next;
        setStep(next);
      });
    },
    [stepOpacity, stepTranslateX],
  );

  animateToStepRef.current = animateToStep;

  useEffect(() => {
    if (isInitialStep.current) {
      isInitialStep.current = false;
      return;
    }

    const transitionVersion = stepTransitionVersionRef.current + 1;
    stepTransitionVersionRef.current = transitionVersion;
    stepTransitionPhaseRef.current = 'entering';

    const enterAnimation = Animated.parallel([
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

    stepTransitionRef.current = enterAnimation;
    enterAnimation.start(({ finished }) => {
      if (transitionVersion !== stepTransitionVersionRef.current) return;
      if (!finished) {
        stepTransitionPhaseRef.current = 'idle';
        return;
      }
      stepTransitionPhaseRef.current = 'idle';
      stepTransitionRef.current = null;
      flushPendingStepTransition();
    });

    return () => enterAnimation.stop();
  }, [flushPendingStepTransition, step, stepOpacity, stepTranslateX]);

  useEffect(
    () => () => {
      stepTransitionPhaseRef.current = 'idle';
      pendingStepTransitionRef.current = null;
      stepTransitionRef.current?.stop();
      stepTransitionRef.current = null;
    },
    [],
  );

  const handleContinueWithoutPro = useCallback(() => {
    if (isBusy || onContinueWithoutPro == null) return;
    onContinueWithoutPro();
  }, [isBusy, onContinueWithoutPro]);

  useEffect(() => {
    if (step === STEP_COUNT - 1) {
      onFinalStepReached?.();
    }
  }, [step, onFinalStepReached]);

  const handleNext = useCallback(() => {
    if (step < STEP_COUNT - 1) animateToStep(step + 1, 1);
  }, [animateToStep, step]);

  const handleBack = useCallback(() => {
    if (step > 0) animateToStep(step - 1, -1);
  }, [animateToStep, step]);

  const trialDuration = annualPackage?.trialLabel?.replace(/\s+free trial$/i, '') ?? '7-day';
  const ctaLabel =
    isAnnualSelected && selectedPackageHasTrial
      ? `Start my ${trialDuration} free trial`
      : isAnnualSelected
        ? 'Subscribe yearly'
        : 'Continue with weekly';

  const isFinal = step === STEP_COUNT - 1;

  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const contentOverflows = contentHeight > viewportHeight + 1;

  return (
    <Animated.View
      style={[styles.screen]}
    >
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
              <Text style={styles.headerText}>‹</Text>
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
              <Text style={styles.headerDeclineText}>Continue with limits</Text>
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={contentOverflows}
          alwaysBounceVertical={false}
          onLayout={(event) =>
            setViewportHeight(event.nativeEvent.layout.height)
          }
          onContentSizeChange={(_, height) => setContentHeight(height)}
        >
          <Animated.View
            style={[
              styles.content,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.stepLayer,
                {
                  opacity: stepOpacity,
                  transform: [{ translateX: stepTranslateX }],
                },
              ]}
            >
              {step === 0 ? (
                <PaywallBenefitsStep
                  features={planHighlights}
                  intent={planIntent}
                  name={name}
                  hasTrial={showFreeTrialIntro}
                />
              ) : null}
              {step === 1 ? (
                <PaywallFreeVsProStep
                  hasTrial={showFreeTrialIntro}
                  trialDuration={trialDuration}
                  intent={planIntent}
                  durationMinutes={primarySessionMinutes}
                />
              ) : null}
              {step === 2 ? <PaywallFreeTrialHeroStep /> : null}
              {step === 3 ? (
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

            {step === STEP_COUNT - 1 && errorMessage ? (
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

        <View style={styles.footerBar}>
          <View style={styles.footerInner}>
            {step < STEP_COUNT - 1 ? (
              <>
                {step < STEP_COUNT - 1 ? (
                  <View style={styles.noPaymentRow}>
                    <Icon
                      name="check"
                      size={NO_PAYMENT_ICON_SIZE}
                      color={colors.text.primary}
                    />
                    <Text style={styles.noPaymentText}>No Payment Due Now</Text>
                  </View>
                ) : null}
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
                  onPress={onPurchase}
                  loading={isPurchasing || isCompleting}
                  disabled={isLoading || selectedPackage == null || isRestoring || isCompleting}
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
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  screenBody: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  entrance: {
    flex: 1,
  },
  header: {
    ...dashboardContentColumn,
    minHeight: scaleControl(40),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
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
  // The decline path names what it costs to take it rather than hiding behind
  // an ×. Wider than the glyph it replaced, so this control sizes to its label
  // instead of the fixed square the back control uses.
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
    ...dashboardContentColumn,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    // The first step is a title over a single drawing, so it has to be able to
    // use the whole viewport to centre that drawing in the space left under the
    // title. The later steps already overflow, where growing to the viewport is
    // what they do anyway.
    flexGrow: 1,
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
  // The tray keeps its full-bleed background, shadow and divider so the rule
  // still reaches both window edges; only what sits on it is capped.
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
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  subtlePressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
});
