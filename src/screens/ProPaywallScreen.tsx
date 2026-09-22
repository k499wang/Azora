import { Text } from '../components/common/Text';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePaywall } from '../hooks/usePaywall';
import { PaywallPlacement } from '../services/paywall';
import type { PaywallPackageId } from '../services/paywall';
import type { RootStackScreenProps } from '../app/navigation';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import Icon from '../components/common/icons/Icon';
import { computeAnnualSavings, computeDiscountPercent } from '../lib/paywall/planPrice';
import { PaywallFooterLinks } from '../components/paywall/PaywallFooterLinks';
import { PaywallTrayPlans } from '../components/paywall/PaywallTrayPlans';
import PaywallTrialReminderToggle from '../components/paywall/PaywallTrialReminderToggle';
import { PaywallLongForm } from '../components/paywall/longForm/PaywallLongForm';
import { PaywallFreeVsProStep } from '../components/onboarding/paywall/PaywallFreeVsProStep';
import { PaywallTrialStep } from '../components/onboarding/paywall/PaywallTrialStep';
import { SpecialOfferPopup } from '../components/paywall/SpecialOfferPopup';
import ChunkyButton from '../components/common/ChunkyButton';
import { loadCriticalOnboardingImages } from '../services/images/onboardingImageCache';
import ScreenContent from '../components/common/ScreenContent';
import { useAuthStore } from '../stores/authStore';
import { useSavedOnboardingProfileQuery } from '../queries/profile/useSavedOnboardingProfileQuery';
import { ONBOARDING_INTENT_LOOKUP_OPTIONS } from '../components/onboarding/data/intentOptions';
import { buildIntentTitleLookup, resolvePlanIntents } from '../lib/planProgress';
import type { OnboardingIntent } from '../components/onboarding/types';
import { onboardingPresetFor } from '../lib/onboardingPreset';

const INTENT_TITLES = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);
/** What a paywall opened without a saved goal sells: the broadest plan. */
const FALLBACK_INTENT: OnboardingIntent = 'other';
const FALLBACK_SESSION_MINUTES = 5;


export function ProPaywallScreen({ navigation, route }: RootStackScreenProps<'ProPaywall'>) {
  const placement = route.params?.placement ?? PaywallPlacement.ProfileUpgrade;
  const isBlocking = route.params?.isBlocking === true;
  const paywall = usePaywall({
    placement,
    feature: route.params?.feature,
    sourceScreen: route.params?.sourceScreen,
    sourceAction: route.params?.sourceAction,
  });
  const anchorPaywall = usePaywall({
    placement: PaywallPlacement.ProfileUpgrade,
    sourceScreen: `${route.params?.sourceScreen ?? 'paywall'}_anchor`,
  });
  // The special offer is a different price than this page asks, so it reads its
  // own offering instead of borrowing the page's.
  const offerPaywall = usePaywall({
    placement: PaywallPlacement.ExitDiscount,
    sourceScreen: `${route.params?.sourceScreen ?? 'paywall'}_special_offer`,
  });
  const insets = useSafeAreaInsets();

  const annualPackage = useMemo(
    () => paywall.offering?.packages.find((pkg) => pkg.id === 'annual') ?? null,
    [paywall.offering],
  );
  const offerAnnual = useMemo(
    () => offerPaywall.offering?.packages.find((pkg) => pkg.id === 'annual') ?? null,
    [offerPaywall.offering],
  );
  const anchorAnnual = useMemo(
    () => anchorPaywall.offering?.packages.find((pkg) => pkg.id === 'annual') ?? null,
    [anchorPaywall.offering],
  );
  const discountPercent = useMemo(
    () => computeDiscountPercent(anchorAnnual, offerAnnual),
    [anchorAnnual, offerAnnual],
  );
  const { height: windowHeight } = useWindowDimensions();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const exitSlideAnim = useRef(new Animated.Value(0)).current;
  const closeFadeAnim = useRef(new Animated.Value(0)).current;
  const [isExiting, setIsExiting] = useState(false);
  const [closeEnabled, setCloseEnabled] = useState(false);
  const [showSpecialOffer, setShowSpecialOffer] = useState(false);
  const allowDismissRef = useRef(false);

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

    if (isBlocking) return;

    const timeout = setTimeout(() => {
      setCloseEnabled(true);
      Animated.timing(closeFadeAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [closeFadeAnim, fadeAnim, isBlocking, slideAnim]);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isBlocking });
    return () => {
      navigation.setOptions({ gestureEnabled: true });
    };
  }, [isBlocking, navigation]);

  useEffect(() => {
    if (!isBlocking) return;

    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowDismissRef.current) return;
      event.preventDefault();
    });

    return unsubscribe;
  }, [isBlocking, navigation]);

  const weeklyPackage = paywall.offering?.packages.find((pkg) => pkg.id === 'weekly');
  const selectedPackage = paywall.offering?.packages.find(
    (pkg) => pkg.id === paywall.selectedPackageId,
  );
  const hasAnnualTrial = annualPackage?.trialLabel != null;
  const selectedPackageHasTrial = selectedPackage?.trialLabel != null;
  const trialDuration = annualPackage?.trialLabel?.replace(/\s+free trial$/i, '');
  const isBusy = paywall.isLoading || paywall.isPurchasing || paywall.isRestoring;
  // Same rule as onboarding's page: a hard paywall has no free tier, so there
  // is no Free column to compare against. Missing metadata fails soft.
  const showPlanComparison = paywall.offering?.paywallMode !== 'hard';

  const savingsPercent = useMemo(
    () => computeAnnualSavings(annualPackage, weeklyPackage),
    [annualPackage, weeklyPackage],
  );

  useEffect(() => {
    if (!hasAnnualTrial) {
      void loadCriticalOnboardingImages();
    }
  }, [hasAnnualTrial]);

  // The page sells their plan, so it is built from the goal they already gave
  // onboarding rather than from anything asked again here.
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const savedProfile = useSavedOnboardingProfileQuery(userId, true);
  const intent =
    resolvePlanIntents(savedProfile.data?.onboardingGoal, INTENT_TITLES)[0] ??
    FALLBACK_INTENT;
  const sessionMinutes =
    savedProfile.data?.dailyMinutes ?? FALLBACK_SESSION_MINUTES;
  const preset = onboardingPresetFor(intent);

  const closePaywall = useCallback(() => {
    if (isBlocking) return;
    if (isBusy || isExiting) return;
    setIsExiting(true);
    Animated.timing(exitSlideAnim, {
      toValue: windowHeight,
      duration: 320,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        paywall.trackDismissed();
        navigation.goBack();
      }
    });
  }, [exitSlideAnim, isBlocking, isBusy, isExiting, navigation, paywall, windowHeight]);

  const purchaseSelectedPackage = useCallback(async (packageId?: PaywallPackageId) => {
    // The tray's plan cards choose and buy in one tap, so the selection is set
    // here for the highlight and passed through for the charge.
    if (packageId != null) paywall.selectPackage(packageId);
    const result = await paywall.purchaseSelectedPackage(packageId);
    if (result.status === 'purchased' && result.isPro) {
      allowDismissRef.current = true;
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const restorePurchases = useCallback(async () => {
    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      allowDismissRef.current = true;
      navigation.goBack();
    }
  }, [navigation, paywall]);

  return (
    <Animated.View style={[styles.screen, { transform: [{ translateY: exitSlideAnim }] }]}>
      <SafeAreaView
        style={[styles.screenBody, { paddingTop: insets.top }]}
        edges={['left', 'right']}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          {isBlocking ? (
            <View style={styles.headerSpacer} />
          ) : (
            <Animated.View style={{ opacity: closeFadeAnim }} pointerEvents={closeEnabled ? 'auto' : 'none'}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue with limits"
                hitSlop={12}
                disabled={isBusy || isExiting || !closeEnabled}
                onPress={closePaywall}
                style={({ pressed }) => [
                  styles.headerDeclineButton,
                  pressed && styles.subtlePressed,
                  (isBusy || isExiting) && styles.disabled,
                ]}
              >
                <Text style={styles.headerDeclineText}>Continue with limits</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ScreenContent>
            <Animated.View
              style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <PaywallLongForm
                name={savedProfile.data?.displayName}
                intent={intent}
                preset={preset}
                sessionMinutes={sessionMinutes}
                comparison={
                  showPlanComparison ? (
                    <PaywallFreeVsProStep
                      hasTrial={hasAnnualTrial}
                      trialDuration={trialDuration}
                      intent={intent}
                      durationMinutes={sessionMinutes}
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
                  paywall.errorMessage ? (
                    <View style={styles.errorBlock}>
                      <Text style={styles.error}>{paywall.errorMessage}</Text>
                      <Pressable
                        accessibilityRole="button"
                        disabled={isBusy || isExiting}
                        onPress={() => {
                          void paywall.retryRevenueCatSync();
                        }}
                        style={({ pressed }) => [
                          styles.retryButton,
                          pressed && styles.subtlePressed,
                          (isBusy || isExiting) && styles.disabled,
                        ]}
                      >
                        <Text style={styles.retryText}>Retry</Text>
                      </Pressable>
                    </View>
                  ) : null
                }
              />
            </Animated.View>
          </ScreenContent>
        </ScrollView>

        <View style={styles.tray}>
          <View style={styles.noPaymentRow}>
            <Icon name="check" size={18} color={colors.text.primary} />
            <Text style={styles.noPaymentText}>
              {selectedPackageHasTrial
                ? 'No Payment Due Now'
                : hasAnnualTrial
                  ? 'Cancel Anytime In Seconds'
                  : '30-Day Money-Back Guarantee'}
            </Text>
          </View>
          <PaywallTrayPlans
            annualPackage={annualPackage ?? undefined}
            weeklyPackage={weeklyPackage}
            selectedPackageId={paywall.selectedPackageId}
            savingsPercent={savingsPercent}
            isLoading={paywall.isLoading}
            disabled={isBusy || isExiting}
            // Light on both plans and both trial states: this page is the cream
            // canvas, so the blue cards' dark surface has nothing to sit on.
            light
            onPurchase={(packageId) => {
              void purchaseSelectedPackage(packageId);
            }}
          />
          <PaywallFooterLinks
            isRestoring={paywall.isRestoring}
            restoreDisabled={isBusy || isExiting}
            onRestore={() => {
              void restorePurchases();
            }}
          />
        </View>
      </SafeAreaView>

      {showSpecialOffer ? (
        <SpecialOfferPopup
          paywall={offerPaywall}
          anchorPaywall={anchorPaywall}
          onPurchased={() => {
            allowDismissRef.current = true;
            navigation.goBack();
          }}
          onDismiss={() => setShowSpecialOffer(false)}
        />
      ) : null}
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
  header: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The decline path names what it costs to take it rather than hiding behind
  // an ×. Wider than the glyph it replaced, so this control sizes to its label
  // instead of the fixed square the header spacer uses.
  headerDeclineButton: {
    height: 36,
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
  content: {
    gap: spacing.sm,
  },
  headerCopy: {
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  eyebrow: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'left',
  },
  title: {
    ...typography.title.title1,
    fontSize: 30,
    lineHeight: 38,
    fontFamily: fonts.heavy,
    color: colors.text.primary,
    textAlign: 'left',
  },
  titleDivider: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  trialNote: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.primary.blue500,
    textAlign: 'left',
    marginTop: spacing.xs,
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
    color: colors.error[700],
  },
  tray: {
    ...card.trayShadow,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
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
