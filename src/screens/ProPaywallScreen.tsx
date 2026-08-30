import { Text } from '../components/common/Text';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePaywall } from '../hooks/usePaywall';
import { PaywallPlacement } from '../services/paywall';
import type { RootStackScreenProps } from '../app/navigation';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import Icon from '../components/common/icons/Icon';
import OnboardingPrimaryButton from '../components/onboarding/OnboardingPrimaryButton';
import { PlanCard, computeAnnualSavings, computePerWeek } from '../components/paywall/PlanCard';
import { PaywallFooterLinks } from '../components/paywall/PaywallFooterLinks';
import PaywallTrialReminderToggle from '../components/paywall/PaywallTrialReminderToggle';
import { PaywallTrialStep } from '../components/onboarding/paywall/PaywallTrialStep';
import ScreenContent from '../components/common/ScreenContent';


export function ProPaywallScreen({ navigation, route }: RootStackScreenProps<'ProPaywall'>) {
  const placement = route.params?.placement ?? PaywallPlacement.ProfileUpgrade;
  const isBlocking = route.params?.isBlocking === true;
  const paywall = usePaywall({
    placement,
    feature: route.params?.feature,
    sourceScreen: route.params?.sourceScreen,
    sourceAction: route.params?.sourceAction,
  });
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const exitSlideAnim = useRef(new Animated.Value(0)).current;
  const closeFadeAnim = useRef(new Animated.Value(0)).current;
  const [isExiting, setIsExiting] = useState(false);
  const [closeEnabled, setCloseEnabled] = useState(false);
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

  const annualPackage = paywall.offering?.packages.find((pkg) => pkg.id === 'annual');
  const weeklyPackage = paywall.offering?.packages.find((pkg) => pkg.id === 'weekly');
  const selectedPackage = paywall.offering?.packages.find(
    (pkg) => pkg.id === paywall.selectedPackageId,
  );
  const isAnnualSelected = paywall.selectedPackageId === 'annual';
  const hasAnnualTrial = annualPackage?.trialLabel != null;
  const selectedPackageHasTrial = selectedPackage?.trialLabel != null;
  const isBusy = paywall.isLoading || paywall.isPurchasing || paywall.isRestoring;

  const savingsPercent = useMemo(
    () => computeAnnualSavings(annualPackage, weeklyPackage),
    [annualPackage, weeklyPackage],
  );

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

  const purchaseSelectedPackage = useCallback(async () => {
    const result = await paywall.purchaseSelectedPackage();
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

  const trialDuration = annualPackage?.trialLabel?.replace(/\s+free trial$/i, '') ?? '7-day';
  const ctaLabel =
    isAnnualSelected && selectedPackageHasTrial
      ? `Start my ${trialDuration} free trial`
      : isAnnualSelected
        ? 'Subscribe yearly'
        : 'Continue with weekly';

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
                accessibilityLabel="Close paywall"
                hitSlop={12}
                disabled={isBusy || isExiting || !closeEnabled}
                onPress={closePaywall}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.subtlePressed,
                  (isBusy || isExiting) && styles.disabled,
                ]}
              >
                <Text style={styles.closeText}>×</Text>
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
              <PaywallTrialStep
                hasAnnualTrial={hasAnnualTrial}
                trialLabel={annualPackage?.trialLabel}
              />

              {hasAnnualTrial ? (
                <View style={styles.reminderToggleWrap}>
                  <PaywallTrialReminderToggle disabled={!selectedPackageHasTrial} />
                </View>
              ) : null}

              {paywall.isLoading ? (
                <View style={[styles.cardsLoading, !hasAnnualTrial && styles.planCardsNoTrial]}>
                  <ActivityIndicator color={colors.primary.blue600} />
                </View>
              ) : (
                <View style={[styles.planCards, !hasAnnualTrial && styles.planCardsNoTrial]}>
                  {annualPackage ? (
                    <PlanCard
                      pkg={annualPackage}
                      isSelected={paywall.selectedPackageId === 'annual'}
                      onSelect={paywall.selectPackage}
                      savingsPercent={savingsPercent}
                      comparePerWeek={weeklyPackage ? computePerWeek(weeklyPackage) : null}
                      light
                    />
                  ) : null}
                  {weeklyPackage ? (
                    <PlanCard
                      pkg={weeklyPackage}
                      isSelected={paywall.selectedPackageId === 'weekly'}
                      onSelect={paywall.selectPackage}
                      savingsPercent={null}
                      light
                    />
                  ) : null}
                </View>
              )}

              {paywall.errorMessage ? (
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
              ) : null}
            </Animated.View>
          </ScreenContent>
        </ScrollView>

        <View style={styles.tray}>
          <View style={styles.noPaymentRow}>
            <Icon name="check" size={18} color={colors.text.primary} />
            <Text style={styles.noPaymentText}>
              {selectedPackageHasTrial
                ? 'No Payment Due Now'
                : 'Cancel Anytime In Seconds'}
            </Text>
          </View>
          <OnboardingPrimaryButton
            label={ctaLabel}
            onPress={() => {
              void purchaseSelectedPackage();
            }}
            loading={paywall.isPurchasing}
            disabled={
              paywall.isLoading ||
              selectedPackage == null ||
              paywall.isRestoring ||
              isExiting
            }
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
  closeText: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 32,
    lineHeight: 32,
    color: colors.text.primary,
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
    fontWeight: '500',
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
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'left',
  },
  title: {
    ...typography.title.title1,
    fontSize: 30,
    lineHeight: 38,
    fontFamily: fonts.heavy,
    fontWeight: '800',
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
    fontWeight: '500',
    color: colors.primary.blue600,
    textAlign: 'left',
    marginTop: spacing.xs,
  },
  cardsLoading: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderToggleWrap: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  planCards: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  planCardsNoTrial: {
    marginTop: spacing.lg,
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
  tray: {
    ...card.trayShadow,
    gap: spacing.xs,
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
});
