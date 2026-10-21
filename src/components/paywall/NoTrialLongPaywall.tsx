import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Reanimated, {
  LinearTransition,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../common/Text';
import CloseButton from '../common/CloseButton';
import Icon from '../common/icons/Icon';
import OnboardingPrimaryButton from '../onboarding/OnboardingPrimaryButton';
import { entranceTiming } from '../onboarding/entranceTiming';
import { PaywallFreeVsProStep } from '../onboarding/paywall/PaywallFreeVsProStep';
import { PaywallFooterLinks } from './PaywallFooterLinks';
import { PaywallSection } from './longForm/PaywallSection';
import { TestimonialsSection } from './longForm/TestimonialsSection';
import { PaywallPlanStory } from './longForm/PaywallPlanStory';
import { personalizedPaywallPlan } from '../../lib/paywall/paywallLongForm';
import type { OnboardingPreset } from '../../lib/onboardingPreset';
import type { OnboardingIntent } from '../onboarding/types';
import type { MindMapScore } from '../../lib/onboardingScores';
import type {
  PaywallMode,
  PaywallOffering,
  PaywallPackageId,
  PaywallPackageOption,
} from '../../services/paywall';
import { getOnboardingImageSource } from '../../services/images/onboardingImageCache';
import {
  computeAnnualSavings,
  formatCurrencyLike,
  packagePriceCents,
} from '../../lib/paywall/planPrice';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { dashboardContentColumn } from '../../theme/breakpoints';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import HarvardLogo from '../../../assets/logos/harvard.svg';

const HERO_HEIGHT = 240;
// How far the canvas hill climbs into the sky at the centre of the screen.
const HILL_RISE = 44;
const MASCOT_WIDTH_SHARE = 0.52;
const MASCOT_MAX = 220;
const ENTRANCE_EASING = Easing.bezier(0.22, 1, 0.36, 1);

const SPARKLES = [
  { top: 0.3, left: 0.2, size: 18 },
  { top: 0.22, left: 0.82, size: 22 },
  { top: 0.55, left: 0.86, size: 14 },
  { top: 0.62, left: 0.1, size: 12 },
];

const RESEARCH_LOGO_HEIGHT = 56;
const PLAN_REVEAL_MS = 420;

interface NoTrialLongPaywallProps {
  /** Visual-only Settings preview. */
  preview?: boolean;
  offering: PaywallOffering | null;
  /** `plan` means an in-app upgrade, which slides in with the navigator. */
  initialStep?: 'plan';
  paywallMode: PaywallMode;
  name?: string;
  planPreset: OnboardingPreset;
  planIntent?: OnboardingIntent;
  goalPhrase?: string | null;
  scores?: MindMapScore[];
  selectedPackageId: PaywallPackageId;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  isCompleting: boolean;
  errorMessage: string | null;
  onSelectPackage: (packageId: PaywallPackageId) => void;
  onPurchase: (packageId: PaywallPackageId) => void;
  onRestore: () => void;
  onRetry: () => void;
  onContinueWithoutPro?: () => void;
  onOfferReached?: () => void;
  onReady?: () => void;
  /** Replaces purchasing: Continue hands off to another screen instead. */
  onContinue?: () => void;
}

/**
 * The long paywall page, opted into per offering. The plan is at the top and
 * the buy button is pinned, so everything below is the argument for pressing
 * it. An eligible trial turns the annual card and button into trial copy.
 */
export function NoTrialLongPaywall({
  preview = false,
  offering,
  initialStep,
  paywallMode,
  name,
  planPreset,
  planIntent = 'other',
  goalPhrase,
  scores,
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
  onReady,
  onContinue,
}: NoTrialLongPaywallProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [today] = useState(() => new Date());
  const plan = personalizedPaywallPlan(planPreset, planIntent, name, goalPhrase, today);

  const annualPackage = offering?.packages.find((pkg) => pkg.id === 'annual');
  const monthlyPackage = offering?.packages.find((pkg) => pkg.id === 'monthly');
  const selectedPackage = offering?.packages.find(
    (pkg) => pkg.id === selectedPackageId,
  );
  const savingsPercent = computeAnnualSavings(annualPackage, monthlyPackage);
  const isBusy = isLoading || isPurchasing || isRestoring || isCompleting;
  const canClose = paywallMode !== 'hard' && onContinueWithoutPro != null;

  // The whole page is the offer, so it is reached as soon as it is shown.
  const onOfferReachedRef = useRef(onOfferReached);
  onOfferReachedRef.current = onOfferReached;
  useEffect(() => {
    onOfferReachedRef.current?.();
  }, []);

  // In-app upgrades slide in with the navigator; onboarding fades in like the
  // rest of its screens.
  const fadeAnim = useRef(new Animated.Value(initialStep === 'plan' ? 1 : 0)).current;
  const [hasLayout, setHasLayout] = useState(false);
  const readyReported = useRef(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  useEffect(() => {
    if (!hasLayout) return;
    const reportReady = () => {
      if (readyReported.current) return;
      readyReported.current = true;
      onReadyRef.current?.();
    };
    if (initialStep === 'plan') {
      reportReady();
      return;
    }
    let active = true;
    const entrance = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: entranceTiming.fade,
      easing: ENTRANCE_EASING,
      useNativeDriver: true,
    });
    entrance.start(({ finished }) => {
      if (active && finished) reportReady();
    });
    return () => {
      active = false;
      entrance.stop();
    };
  }, [fadeAnim, initialStep, hasLayout]);

  const heroHeight = HERO_HEIGHT + insets.top;
  const mascotSize = Math.min(MASCOT_MAX, Math.round(screenWidth * MASCOT_WIDTH_SHARE));
  // A circle three screens wide, so only a gentle arc of it shows.
  const hillDiameter = screenWidth * 3;

  return (
    <Animated.View
      onLayout={() => setHasLayout(true)}
      style={[styles.screen, { opacity: fadeAnim }]}
    >
      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
        >
          {/* The sky's top color carried above the page, so pulling down past
              the top reveals more sky instead of the canvas. */}
          <View
            style={[styles.overscrollSky, { top: -screenHeight, height: screenHeight }]}
          />
          <View style={[styles.hero, { height: heroHeight }]}>
            <LinearGradient
              colors={[colors.primary.blue400, colors.primary.blue200, colors.yellow[100]]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            {SPARKLES.map((sparkle, index) => (
              <View
                key={index}
                style={[
                  styles.sparkle,
                  {
                    top: insets.top + (HERO_HEIGHT - HILL_RISE) * sparkle.top,
                    left: screenWidth * sparkle.left,
                  },
                ]}
              >
                <Icon name="sparkle" size={sparkle.size} color={colors.neutral[0]} />
              </View>
            ))}
            <View
              style={[
                styles.hill,
                {
                  top: heroHeight - HILL_RISE,
                  left: (screenWidth - hillDiameter) / 2,
                  width: hillDiameter,
                  height: hillDiameter,
                  borderRadius: hillDiameter / 2,
                },
              ]}
            />
            <View style={[styles.mascotWrap, { bottom: HILL_RISE / 2 }]}>
              <Image
                source={getOnboardingImageSource('azoGiftKoala')}
                style={{ width: mascotSize, height: mascotSize }}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={0}
                accessible={false}
              />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.headline}>
              {plan.headline}
            </Text>
            <Text style={styles.planSummary}>
              {plan.planName} · Built around your answers
            </Text>

            {onContinue == null ? (
              <View style={styles.plans}>
              {isLoading ? (
                <View style={styles.plansLoading}>
                  <ActivityIndicator color={colors.primary.blue500} />
                </View>
              ) : (
                <>
                  {annualPackage ? (
                    <PlanOption
                      pkg={annualPackage}
                      isSelected={selectedPackageId === 'annual'}
                      savingsPercent={savingsPercent}
                      disabled={isBusy}
                      onSelect={onSelectPackage}
                    />
                  ) : null}
                  {monthlyPackage ? (
                    <PlanOption
                      pkg={monthlyPackage}
                      isSelected={selectedPackageId === 'monthly'}
                      savingsPercent={null}
                      disabled={isBusy}
                      onSelect={onSelectPackage}
                    />
                  ) : null}
                </>
              )}
              {preview ? (
                <Text style={styles.note}>Sample prices · Preview only</Text>
              ) : null}
            </View>
            ) : null}

            {/* Moves with the plan reveal instead of jumping. */}
            <Reanimated.View layout={LinearTransition.duration(PLAN_REVEAL_MS)}>
              {errorMessage ? (
                <View style={styles.errorBlock}>
                  <Text style={styles.error}>{errorMessage}</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isBusy}
                    onPress={onRetry}
                    style={({ pressed }) => [
                      styles.retryButton,
                      pressed && styles.pressed,
                      isBusy && styles.disabled,
                    ]}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              ) : null}

              <PaywallPlanStory plan={plan} scores={scores} showChangeTitle={onContinue == null} />

              <PaywallFreeVsProStep
                hasTrial={false}
                hasFreeTier={paywallMode !== 'hard'}
                layout="section"
              />

              <PaywallSection title="Built on research from">
                <View style={styles.logoCard}>
                  <HarvardLogo
                    width={RESEARCH_LOGO_HEIGHT * (600 / 165)}
                    height={RESEARCH_LOGO_HEIGHT}
                    viewBox="0 0 600 165"
                  />
                  <Image
                    source={getOnboardingImageSource('oxfordLogo')}
                    style={[styles.logo, { aspectRatio: 823 / 257 }]}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    transition={0}
                  />
                  <Image
                    source={getOnboardingImageSource('cambridgeLogo')}
                    style={[styles.logo, { aspectRatio: 861 / 180 }]}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    transition={0}
                  />
                </View>
              </PaywallSection>

              <TestimonialsSection name={name} />

            </Reanimated.View>
          </View>
        </ScrollView>

        <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.footerInner}>
            <View style={styles.secureRow}>
              <Icon name="shield-check" size={16} color={colors.text.secondary} />
              <Text style={styles.secureText}>
                Secured with the App Store. Cancel anytime.
              </Text>
            </View>
            <OnboardingPrimaryButton
              label={
                onContinue == null && selectedPackage?.trialLabel != null
                  ? 'Start my free trial'
                  : 'Continue'
              }
              onPress={() => (onContinue != null ? onContinue() : onPurchase(selectedPackageId))}
              loading={isPurchasing || isCompleting}
              disabled={isBusy || selectedPackage == null}
            />
            <PaywallFooterLinks
              isRestoring={isRestoring}
              restoreDisabled={isBusy}
              onRestore={onRestore}
            />
          </View>
        </View>
      </View>

      {canClose ? (
        <CloseButton
          onBlock
          accessibilityLabel={preview ? 'Close paywall preview' : 'Continue with limits'}
          onPress={() => {
            if (!isBusy) onContinueWithoutPro?.();
          }}
          style={[styles.closeButton, { top: insets.top + spacing.sm }]}
        />
      ) : null}
    </Animated.View>
  );
}

interface PlanOptionProps {
  pkg: PaywallPackageOption;
  isSelected: boolean;
  savingsPercent: number | null;
  disabled: boolean;
  onSelect: (packageId: PaywallPackageId) => void;
}

function PlanOption({ pkg, isSelected, savingsPercent, disabled, onSelect }: PlanOptionProps) {
  const isAnnual = pkg.id === 'annual';
  const cents = packagePriceCents(pkg);
  const perMonth =
    pkg.pricePerMonthString ??
    (cents == null ? null : formatCurrencyLike(pkg.priceString, cents / 12 / 100));
  const hasTrial = pkg.trialLabel != null;
  const intro = isAnnual ? null : pkg.introOffer;
  const trialDays = Number.parseInt(pkg.trialLabel ?? '', 10);
  const unitPrice = intro != null
    ? intro.priceString
    : hasTrial
    ? Number.isFinite(trialDays)
      ? `${trialDays} days`
      : 'Free'
    : isAnnual
      ? perMonth ?? pkg.priceString
      : pkg.priceString;
  const unitLabel = intro != null
    ? `for ${intro.days} days`
    : hasTrial
    ? 'Free trial'
    : isAnnual && perMonth != null
      ? 'per month'
      : isAnnual
        ? 'per year'
        : 'per month';
  const title = hasTrial
    ? 'Try Free'
    : intro != null
      ? `${intro.days}-Day Trial`
      : isAnnual ? 'Annual' : 'Monthly';
  const period = isAnnual ? 'yr' : 'mo';

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, disabled }}
      disabled={disabled}
      onPress={() => onSelect(pkg.id)}
      style={({ pressed }) => [
        styles.plan,
        isSelected && styles.planSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.planLeft}>
        {isAnnual ? (
          <View style={styles.planBadges}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Most popular</Text>
            </View>
            {savingsPercent != null ? (
              <View style={[styles.planBadge, styles.planBadgeSoft]}>
                <Text style={[styles.planBadgeText, styles.planBadgeSoftText]}>
                  Save {savingsPercent}%
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={styles.planDetail}>
          {hasTrial || intro != null ? 'then ' : ''}
          {pkg.priceString}/{period}
        </Text>
      </View>
      <View style={styles.planRight}>
        <Text style={styles.planPrice}>{unitPrice}</Text>
        <Text style={styles.planUnit}>{unitLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  overscrollSky: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.primary.blue400,
  },
  hero: {
    overflow: 'hidden',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
    opacity: 0.85,
  },
  hill: {
    position: 'absolute',
    backgroundColor: colors.background.canvas,
  },
  mascotWrap: {
    position: 'absolute',
    alignSelf: 'center',
  },
  content: {
    ...dashboardContentColumn,
    paddingHorizontal: spacing.lg,
  },
  headline: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  planSummary: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.primary.blue600,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  plans: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  plansLoading: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: {
    ...card.base,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border.subtle,
  },
  planSelected: {
    backgroundColor: colors.surface.selected,
    borderColor: colors.primary.blue500,
  },
  planLeft: {
    flex: 1,
    gap: 2,
  },
  planBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  planBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primary.blue500,
  },
  planBadgeText: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.neutral[0],
  },
  planBadgeSoft: {
    backgroundColor: colors.primary.blue100,
  },
  planBadgeSoftText: {
    color: colors.primary.blue700,
  },
  planTitle: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  planDetail: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  planRight: {
    alignItems: 'flex-end',
    paddingLeft: spacing.sm,
  },
  planPrice: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  planUnit: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  note: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  logoCard: {
    ...card.base,
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  logo: {
    height: RESEARCH_LOGO_HEIGHT,
  },
  errorBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 20,
    padding: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.error[100],
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: radius.full,
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
    backgroundColor: colors.background.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  footerInner: {
    ...dashboardContentColumn,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secureRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  secureText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  closeButton: {
    position: 'absolute',
    left: spacing.lg,
  },
  pressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
});
