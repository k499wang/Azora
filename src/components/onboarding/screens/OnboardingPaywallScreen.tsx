import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  PaywallPackageOption,
} from '../../../services/paywall';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { card } from '../../../theme/card';
import Icon, { type IconName } from '../../common/icons/Icon';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  PlanCard,
  computeAnnualSavings,
  PRO_INK,
} from '../../paywall/PlanCard';
import PaywallFeatureList from '../../paywall/PaywallFeatureList';
import PaywallTrialReminderToggle from '../../paywall/PaywallTrialReminderToggle';
import MindMapRadar from '../MindMapRadar';
import type { PaywallPersonalization } from '../../../lib/paywallPersonalization';

const TERMS_URL = 'https://www.tryazora.app/terms';
const PRIVACY_URL = 'https://www.tryazora.app/privacy';
const STEP_COUNT = 3;

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
  const stepAnim = useRef(new Animated.Value(0)).current;
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
    (next: number) => {
      Animated.timing(stepAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setStep(next);
        Animated.timing(stepAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    },
    [stepAnim],
  );

  useEffect(() => {
    stepAnim.setValue(1);
  }, [stepAnim]);

  const handleContinueWithoutPro = useCallback(() => {
    if (isBusy) return;
    onContinueWithoutPro();
  }, [isBusy, onContinueWithoutPro]);

  const handleNext = useCallback(() => {
    if (step < STEP_COUNT - 1) animateToStep(step + 1);
  }, [animateToStep, step]);

  const handleBack = useCallback(() => {
    if (step > 0) animateToStep(step - 1);
  }, [animateToStep, step]);

  const ctaLabel =
    isAnnualSelected && selectedPackageHasTrial
      ? 'Start my 3-day free trial'
      : isAnnualSelected
        ? 'Subscribe yearly'
        : 'Continue with weekly';

  const stepContentTranslate = stepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  const isFinal = step === STEP_COUNT - 1;

  return (
    <Animated.View
      style={[
        styles.screen,
        isFinal ? styles.screenDark : styles.screenLight,
      ]}
    >
      <ImageBackground
        source={require('../../../../assets/backgrounds/sunset.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        {isFinal ? (
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
        style={[styles.screenBody, { paddingTop: insets.top + spacing.sm }]}
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
              <Text style={[styles.backText, !isFinal && styles.headerTextLight]}>‹</Text>
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
          <StepDots count={STEP_COUNT} current={step} dark={isFinal} />
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
              <Text style={[styles.closeText, !isFinal && styles.headerTextLight]}>×</Text>
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
                opacity: stepAnim,
                transform: [{ translateY: stepContentTranslate }],
              }}
            >
              {step === 0 ? (
                personalization ? (
                  <StepPersonalizedPlan
                    personalization={personalization}
                    hasAnnualTrial={hasAnnualTrial}
                  />
                ) : (
                  <StepValue hasAnnualTrial={hasAnnualTrial} />
                )
              ) : null}
              {step === 1 ? <StepTrial hasAnnualTrial={hasAnnualTrial} /> : null}
              {step === 2 ? (
                <StepChoose
                  isLoading={isLoading}
                  annualPackage={annualPackage}
                  weeklyPackage={weeklyPackage}
                  selectedPackageId={selectedPackageId}
                  onSelectPackage={onSelectPackage}
                  savingsPercent={savingsPercent}
                  selectedPackageHasTrial={selectedPackageHasTrial}
                />
              ) : null}
            </Animated.View>

            {step === 2 && errorMessage ? (
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

        <View style={[styles.footer, isFinal ? styles.footerDark : styles.footerLight]}>
          {step < STEP_COUNT - 1 ? (
            <OnboardingPrimaryButton
              label="Continue"
              onPress={handleNext}
              disabled={isBusy}
            />
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
                {selectedPackageHasTrial
                  ? '3-day free trial, then auto-renews unless cancelled. Manage or cancel in App Store settings. '
                  : 'Auto-renews unless cancelled. Manage or cancel in App Store settings. '}
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

function StepValue({ hasAnnualTrial }: { hasAnnualTrial: boolean }) {
  const benefits: Array<{
    icon: IconName;
    title: string;
    body: string;
    accent: string;
    accentSoft: string;
  }> = [
    {
      icon: 'heart',
      title: 'Heart data insights',
      body: 'Heart rate, HRV, stress, and recovery in one place.',
      accent: colors.primary.blue500,
      accentSoft: colors.primary.blue100,
    },
    {
      icon: 'timer',
      title: 'Unlimited sessions',
      body: 'Measure and train as often as you want — no caps.',
      accent: colors.primary.blue700,
      accentSoft: colors.primary.blue100,
    },
    {
      icon: 'sparkle',
      title: 'Personalized plan',
      body: 'Guidance shaped around your baseline and goals.',
      accent: colors.primary.blue600,
      accentSoft: colors.primary.blue100,
    },
  ];

  return (
    <View style={styles.stepContainer}>
      <View style={styles.valueHeader}>
        <Text style={styles.valueTitle}>Azora Pro</Text>
        <View style={styles.valueTitleUnderline} />
        <Text style={styles.valueSubtitle}>
          Heart data, unlimited sessions, and a plan built around you.
        </Text>
        {hasAnnualTrial ? (
          <Text style={styles.trialNote}>Try free for 3 days — no charge until day 3</Text>
        ) : null}
      </View>

      <View style={styles.valueGrid}>
        {benefits.map((benefit) => (
          <View key={benefit.title} style={styles.valueTile}>
            <View style={[styles.valueTileIcon, { backgroundColor: benefit.accent }]}>
              <Icon name={benefit.icon} size={22} color={colors.text.inverse} />
            </View>
            <View style={styles.valueTileCopy}>
              <Text style={styles.valueTileTitle}>{benefit.title}</Text>
              <Text style={styles.valueTileBody}>{benefit.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function StepPersonalizedPlan({
  personalization,
  hasAnnualTrial,
}: {
  personalization: PaywallPersonalization;
  hasAnnualTrial: boolean;
}) {
  const { displayName, baselineBpm, currentScores, targetScores } = personalization;
  const greeting = displayName ? `${displayName}, your plan is ready!` : 'Your plan is ready!';

  const milestones: Array<{ day: string; title: string; body: string }> = [
    { day: 'Day 1', title: 'Start today', body: 'Your first guided session, paced to your baseline.' },
    { day: 'Day 7', title: 'Momentum', body: 'Daily reps build the first signs of calmer breathing.' },
    { day: 'Day 21', title: 'Past the hard part', body: 'The neuroscience-backed threshold where habits stick.' },
    { day: 'Day 30', title: 'Habit locked in', body: 'A steadier baseline you can feel — and measure.' },
  ];

  return (
    <View style={styles.stepContainer}>
      <View style={styles.valueHeader}>
        <Text style={styles.planHeadline}>{greeting}</Text>
        <View style={styles.valueTitleUnderline} />
        <Text style={styles.valueSubtitle}>Built around your baseline — 30 days to a steadier you.</Text>
        {hasAnnualTrial ? (
          <Text style={styles.trialNote}>Try free for 3 days — no charge until day 3</Text>
        ) : null}
      </View>

      {currentScores ? (
        <View style={styles.radarBlock}>
          <View style={styles.radarWrap}>
            <MindMapRadar
              scores={currentScores}
              targetScores={targetScores ?? undefined}
              size={300}
            />
          </View>
          <View style={styles.radarLegend}>
            <View style={styles.radarLegendItem}>
              <View style={[styles.radarLegendDot, { backgroundColor: colors.primary.blue500 }]} />
              <Text style={styles.radarLegendLabel}>Today</Text>
            </View>
            <View style={styles.radarLegendItem}>
              <View style={[styles.radarLegendDot, styles.radarLegendDotTarget]} />
              <Text style={styles.radarLegendLabel}>Day 30 target</Text>
            </View>
          </View>
          {baselineBpm != null ? (
            <View style={styles.radarFooter}>
              <Text style={styles.radarFooterLabel}>Resting heart rate</Text>
              <Text style={styles.radarFooterValue}>{baselineBpm} bpm</Text>
            </View>
          ) : null}
        </View>
      ) : baselineBpm != null ? (
        <View style={styles.baselineStrip}>
          <View style={styles.baselineChip}>
            <Text style={styles.baselineChipValue}>{baselineBpm}</Text>
            <Text style={styles.baselineChipLabel}>resting bpm</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Your roadmap</Text>

      <View style={styles.ladder}>
        {milestones.map((m, index) => {
          const isFinal = index === milestones.length - 1;
          return (
            <View key={m.day} style={styles.ladderRow}>
              <View style={styles.ladderRail}>
                <View style={[styles.ladderNode, isFinal && styles.ladderNodeFinal]}>
                  {isFinal ? <View style={styles.ladderNodeInner} /> : null}
                </View>
                {index < milestones.length - 1 ? <View style={styles.ladderLine} /> : null}
              </View>
              <View style={styles.ladderCopy}>
                <Text style={styles.ladderDay}>{m.day}</Text>
                <Text style={styles.ladderTitle}>{m.title}</Text>
                <Text style={styles.ladderBody}>{m.body}</Text>
              </View>
            </View>
          );
        })}
      </View>

    </View>
  );
}

function StepTrial({ hasAnnualTrial }: { hasAnnualTrial: boolean }) {
  const steps: Array<Omit<TimelineStepProps, 'showLine'>> = hasAnnualTrial
    ? [
        {
          icon: 'sparkle',
          label: 'Today',
          title: 'Unlock everything',
          body: 'Start your 3-day free trial — all Pro features unlocked instantly.',
        },
        {
          icon: 'timer',
          label: 'Day 2',
          title: "We'll send a reminder",
          body: "You'll get a notification before your trial converts to a paid plan.",
        },
        {
          icon: 'heart',
          label: 'Day 3',
          title: 'Cancel anytime',
          body: 'Cancel in App Store settings up to the moment billing starts.',
        },
      ]
    : [
        {
          icon: 'sparkle',
          label: 'Today',
          title: 'Unlock everything',
          body: 'Subscribe to unlock every Pro feature instantly.',
        },
        {
          icon: 'timer',
          label: 'Anytime',
          title: 'Cancel in one tap',
          body: 'Manage or cancel in App Store settings whenever you want.',
        },
        {
          icon: 'heart',
          label: 'Welcome back',
          title: 'Pick up where you left off',
          body: 'Your past progress and insights stay with you.',
        },
      ];

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {hasAnnualTrial ? '3 days free, fully cancellable' : 'Pro, on your terms'}
        </Text>
        <Text style={styles.stepSubtitle}>
          {hasAnnualTrial
            ? "You won't be charged until day 3 — and we'll always remind you first."
            : 'Cancel anytime in App Store settings — no questions asked.'}
        </Text>
      </View>
      <View style={styles.timeline}>
        {steps.map((step, index) => (
          <TimelineStep
            key={step.label}
            {...step}
            showLine={index < steps.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

interface StepChooseProps {
  isLoading: boolean;
  annualPackage: PaywallPackageOption | undefined;
  weeklyPackage: PaywallPackageOption | undefined;
  selectedPackageId: PaywallPackageId;
  onSelectPackage: (packageId: PaywallPackageId) => void;
  savingsPercent: number | null;
  selectedPackageHasTrial: boolean;
}

function StepChoose({
  isLoading,
  annualPackage,
  weeklyPackage,
  selectedPackageId,
  onSelectPackage,
  savingsPercent,
  selectedPackageHasTrial,
}: StepChooseProps) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, styles.stepTitleDark]}>Start Breathing Better</Text>
        <Text style={[styles.stepSubtitle, styles.stepSubtitleDark]}>
          {selectedPackageHasTrial
            ? 'Get a 3 day free trial, on us.'
            : 'Pick a plan to unlock everything.'}
        </Text>
      </View>

      <PaywallFeatureList />

      {selectedPackageHasTrial ? <PaywallTrialReminderToggle dark /> : null}

      {isLoading ? (
        <View style={styles.cardsLoading}>
          <ActivityIndicator color={colors.primary.blue600} />
        </View>
      ) : (
        <View style={styles.planCards}>
          {annualPackage ? (
            <PlanCard
              pkg={annualPackage}
              isSelected={selectedPackageId === 'annual'}
              onSelect={onSelectPackage}
              savingsPercent={savingsPercent}
            />
          ) : null}
          {weeklyPackage ? (
            <PlanCard
              pkg={weeklyPackage}
              isSelected={selectedPackageId === 'weekly'}
              onSelect={onSelectPackage}
              savingsPercent={null}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

interface TimelineStepProps {
  icon: IconName;
  label: string;
  title: string;
  body: string;
  showLine?: boolean;
}

function TimelineStep({ icon, label, title, body, showLine = false }: TimelineStepProps) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={styles.timelineIcon}>
          <Icon name={icon} size={20} color={colors.text.inverse} />
        </View>
        {showLine ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={styles.timelineLabel}>{label}</Text>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineBody}>{body}</Text>
      </View>
    </View>
  );
}

function StepDots({ count, current, dark }: { count: number; current: number; dark: boolean }) {
  return (
    <View style={styles.stepDots}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            dark ? styles.stepDotDark : styles.stepDotLight,
            i === current && (dark ? styles.stepDotActiveDark : styles.stepDotActiveLight),
            i < current && (dark ? styles.stepDotPastDark : styles.stepDotPastLight),
          ]}
        />
      ))}
    </View>
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
    minHeight: 56,
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
    fontWeight: '600',
    fontSize: 34,
    lineHeight: 34,
    color: colors.neutral[0],
  },
  closeText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 32,
    color: colors.neutral[0],
  },
  headerTextLight: {
    color: colors.text.primary,
  },
  stepDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepDotLight: {
    backgroundColor: colors.neutral[300],
  },
  stepDotDark: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  stepDotPastLight: {
    backgroundColor: colors.neutral[400],
  },
  stepDotPastDark: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  stepDotActiveLight: {
    width: 22,
    backgroundColor: PRO_INK,
  },
  stepDotActiveDark: {
    width: 22,
    backgroundColor: colors.neutral[0],
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
  stepContainer: {
    gap: spacing.xl,
  },
  stepHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  stepEyebrow: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.brand,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  stepTitle: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  stepTitleDark: {
    color: colors.neutral[0],
  },
  stepSubtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  stepSubtitleDark: {
    color: 'rgba(255,255,255,0.75)',
  },
  valueHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  valueTitle: {
    ...typography.display.display1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  valueTitleUnderline: {
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.blue600,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  planHeadline: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sectionTitle: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  radarBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  radarLegend: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  radarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radarLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radarLegendDotTarget: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.orange[500],
  },
  radarLegendLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  radarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  radarFooterLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  radarFooterValue: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.primary.blue600,
  },
  baselineStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  baselineChip: {
    ...card.base,
    ...card.shadow,
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    gap: 2,
  },
  baselineChipValue: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.primary.blue600,
    letterSpacing: -0.4,
  },
  baselineChipValueGrowth: {
    color: colors.orange[500],
  },
  baselineChipLabel: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  ladder: {
    ...card.base,
    ...card.shadow,
    backgroundColor: colors.background.elevated,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  ladderRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ladderRail: {
    alignItems: 'center',
    width: 24,
  },
  ladderNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.primary.blue600,
    backgroundColor: colors.background.elevated,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ladderNodeFinal: {
    backgroundColor: colors.primary.blue600,
  },
  ladderNodeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background.elevated,
  },
  ladderLine: {
    width: 2,
    flex: 1,
    minHeight: 36,
    backgroundColor: colors.primary.blue100,
    marginTop: 2,
  },
  ladderCopy: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  ladderDay: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.brand,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ladderTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 2,
  },
  ladderBody: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: 2,
  },
  commitmentTile: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.elevated,
  },
  valueSubtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  trialNote: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.primary.blue600,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  trialNoteDark: {
    color: colors.primary.blue200,
  },
  valueGrid: {
    gap: spacing.sm,
  },
  valueTile: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.elevated,
  },
  valueTileIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  valueTileCopy: {
    flex: 1,
  },
  valueTileTitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  valueTileBody: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timeline: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineRail: {
    alignItems: 'center',
    width: 42,
  },
  timelineIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue600,
  },
  timelineLine: {
    width: 6,
    flex: 1,
    minHeight: 56,
    backgroundColor: colors.primary.blue100,
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineLabel: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timelineTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 2,
  },
  timelineBody: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cardsLoading: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCards: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  restoreButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  restoreText: {
    ...typography.button.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
  subtlePressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
});
