import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type {
  PaywallOffering,
  PaywallPackageId,
} from '../../../services/paywall';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import Icon from '../../common/icons/Icon';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { computeAnnualSavings } from '../../paywall/PlanCard';
import { PaywallChoosePlanStep } from '../paywall/PaywallChoosePlanStep';
import { PaywallFreeTrialHeroStep } from '../paywall/PaywallFreeTrialHeroStep';
import { PaywallPersonalizedPlanStep } from '../paywall/PaywallPersonalizedPlanStep';
import { PaywallStepDots } from '../paywall/PaywallStepDots';
import { PaywallTrialStep } from '../paywall/PaywallTrialStep';
import { PaywallValueStep } from '../paywall/PaywallValueStep';
import type { PaywallPersonalization } from '../../../lib/paywallPersonalization';

const TERMS_URL = 'https://www.tryazora.app/terms';
const PRIVACY_URL = 'https://www.tryazora.app/privacy';
const STEP_COUNT = 4;
const STEP_SLIDE_DISTANCE = 40;

interface OnboardingPaywallScreenProps {
  offering: PaywallOffering | null;
  selectedPackageId: PaywallPackageId;
  stepIndex: number;
  stepCount: number;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  isCompleting: boolean;
  errorMessage: string | null;
  personalization?: PaywallPersonalization | null;
  continueWithoutProLabel?: string;
  onSelectPackage: (packageId: PaywallPackageId) => void;
  onPurchase: () => void;
  onRestore: () => void;
  onRetry: () => void;
  onContinueWithoutPro: () => void;
}

export default function OnboardingPaywallScreen({
  offering,
  selectedPackageId,
  isLoading,
  isPurchasing,
  isRestoring,
  isCompleting,
  errorMessage,
  personalization,
  continueWithoutProLabel = 'Continue free',
  onSelectPackage,
  onPurchase,
  onRestore,
  onRetry,
  onContinueWithoutPro,
}: OnboardingPaywallScreenProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const stepTranslateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  const selectedPackage = offering?.packages.find((pkg) => pkg.id === selectedPackageId);
  const annualPackage = offering?.packages.find((pkg) => pkg.id === 'annual');
  const weeklyPackage = offering?.packages.find((pkg) => pkg.id === 'weekly');
  const isAnnualSelected = selectedPackageId === 'annual';
  const hasAnnualTrial = annualPackage?.trialLabel != null;
  const selectedPackageHasTrial = selectedPackage?.trialLabel != null;
  const isBusy = isLoading || isPurchasing || isRestoring || isCompleting;

  const savingsPercent = useMemo(
    () => computeAnnualSavings(annualPackage, weeklyPackage),
    [annualPackage, weeklyPackage],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const animateToStep = useCallback(
    (next: number, direction: number) => {
      Animated.parallel([
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
      ]).start(() => {
        setStep(next);
        stepTranslateX.setValue(direction * STEP_SLIDE_DISTANCE);
        Animated.parallel([
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
        ]).start();
      });
    },
    [stepOpacity, stepTranslateX],
  );

  const handleContinueWithoutPro = useCallback(() => {
    if (isBusy) return;
    onContinueWithoutPro();
  }, [isBusy, onContinueWithoutPro]);

  const handleNext = useCallback(() => {
    if (step < STEP_COUNT - 1) animateToStep(step + 1, 1);
  }, [animateToStep, step]);

  const handleBack = useCallback(() => {
    if (step > 0) animateToStep(step - 1, -1);
  }, [animateToStep, step]);

  const ctaLabel =
    isAnnualSelected && selectedPackageHasTrial
      ? 'Start my free trial'
      : isAnnualSelected
        ? 'Subscribe yearly'
        : 'Continue with weekly';

  const isFinal = step === STEP_COUNT - 1;
  const darkChrome = isFinal;

  return (
    <Animated.View
      style={[
        styles.screen,
        darkChrome ? styles.screenDark : styles.screenLight,
      ]}
    >
      <ImageBackground
        source={require('../../../../assets/backgrounds/sunset.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        {darkChrome ? (
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.38)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, styles.lightOverlay]}
            pointerEvents="none"
          />
        )}
      </ImageBackground>
      <SafeAreaView
        style={[styles.screenBody, { paddingTop: insets.top }]}
        edges={['left', 'right']}
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
              <Text style={[styles.backText, !darkChrome && styles.headerTextLight]}>‹</Text>
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
          <PaywallStepDots count={STEP_COUNT} current={step} dark={darkChrome} />
          {step === STEP_COUNT - 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close paywall"
              hitSlop={12}
              disabled={isBusy}
              onPress={handleContinueWithoutPro}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.subtlePressed,
                isBusy && styles.disabled,
              ]}
            >
              <Text style={[styles.closeText, !darkChrome && styles.headerTextLight]}>×</Text>
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Animated.View
              style={{
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              }}
            >
              {step === 0 ? (
                personalization ? (
                  <PaywallPersonalizedPlanStep personalization={personalization} />
                ) : (
                  <PaywallValueStep />
                )
              ) : null}
              {step === 1 ? <PaywallTrialStep hasAnnualTrial={hasAnnualTrial} /> : null}
              {step === 2 ? <PaywallFreeTrialHeroStep /> : null}
              {step === 3 ? (
                <PaywallChoosePlanStep
                  isLoading={isLoading}
                  annualPackage={annualPackage}
                  weeklyPackage={weeklyPackage}
                  selectedPackageId={selectedPackageId}
                  onSelectPackage={onSelectPackage}
                  savingsPercent={savingsPercent}
                  selectedPackageHasTrial={selectedPackageHasTrial}
                  hasAnnualTrial={hasAnnualTrial}
                />
              ) : null}
            </Animated.View>

            {step === 3 && errorMessage ? (
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

        <View style={[styles.footer, darkChrome ? styles.footerDark : styles.footerLight]}>
          {step < STEP_COUNT - 1 ? (
            <>
              {step === 2 ? (
                <View style={styles.noPaymentRow}>
                  <Icon name="check" size={18} color={colors.text.primary} />
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
              <OnboardingPrimaryButton
                label={ctaLabel}
                onPress={onPurchase}
                loading={isPurchasing || isCompleting}
                disabled={isLoading || selectedPackage == null || isRestoring || isCompleting}
              />
              <Pressable
                accessibilityRole="button"
                disabled={isBusy}
                onPress={onRestore}
                style={({ pressed }) => [
                  styles.restoreButton,
                  pressed && styles.subtlePressed,
                  isBusy && styles.disabled,
                ]}
              >
                <Text style={styles.restoreText}>
                  {isRestoring ? 'Restoring...' : 'Restore Purchase'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isBusy}
                onPress={handleContinueWithoutPro}
                style={({ pressed }) => [
                  styles.freeButton,
                  pressed && styles.subtlePressed,
                  isBusy && styles.disabled,
                ]}
              >
                <Text style={styles.freeButtonText}>{continueWithoutProLabel}</Text>
              </Pressable>
              <Text style={styles.legal}>
                Subscriptions auto-renew unless cancelled. Manage or cancel in App Store settings.{' '}
                By continuing, you agree to the{' '}
                <Text style={styles.legalLink} onPress={() => void Linking.openURL(TERMS_URL)}>
                  Terms
                </Text>{' '}
                and acknowledge the{' '}
                <Text style={styles.legalLink} onPress={() => void Linking.openURL(PRIVACY_URL)}>
                  Privacy Policy
                </Text>
                .
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenLight: {
    backgroundColor: colors.background.primary,
  },
  screenDark: {
    backgroundColor: colors.neutral[900],
  },
  lightOverlay: {
    backgroundColor: colors.background.primary,
  },
  screenBody: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 34,
    lineHeight: 34,
    color: colors.neutral[0],
  },
  closeText: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 32,
    lineHeight: 32,
    color: colors.neutral[0],
  },
  headerTextLight: {
    color: colors.text.primary,
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
    fontWeight: '500',
    color: colors.text.primary,
  },
  restoreButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  restoreText: {
    ...typography.button.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.neutral[0],
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
    backgroundColor: colors.background.elevated,
  },
  retryText: {
    ...typography.button.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.error[700],
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footerLight: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  footerDark: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(10, 28, 68, 0.92)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  freeButton: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  freeButtonText: {
    ...typography.button.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },
  legal: {
    ...typography.caption.caption2,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 15,
  },
  legalLink: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  subtlePressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
});
