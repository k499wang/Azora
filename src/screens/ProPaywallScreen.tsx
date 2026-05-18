import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePaywall } from '../hooks/usePaywall';
import { PaywallPlacement } from '../services/paywall';
import type { RootStackScreenProps } from '../app/navigation';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import OnboardingPrimaryButton from '../components/onboarding/OnboardingPrimaryButton';
import { PlanCard, computeAnnualSavings } from '../components/paywall/PlanCard';
import PaywallFeatureList from '../components/paywall/PaywallFeatureList';
import PaywallTrialReminderToggle from '../components/paywall/PaywallTrialReminderToggle';

const TERMS_URL = 'https://www.tryazora.app/terms';
const PRIVACY_URL = 'https://www.tryazora.app/privacy';

export function ProPaywallScreen({ navigation, route }: RootStackScreenProps<'ProPaywall'>) {
  const placement = route.params?.placement ?? PaywallPlacement.ProfileUpgrade;
  const paywall = usePaywall({
    placement,
    sourceScreen: route.params?.sourceScreen,
  });
  const copy = getPaywallCopy(route.params?.feature);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const exitSlideAnim = useRef(new Animated.Value(0)).current;
  const closeFadeAnim = useRef(new Animated.Value(0)).current;
  const [isExiting, setIsExiting] = useState(false);
  const [closeEnabled, setCloseEnabled] = useState(false);

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
  }, [closeFadeAnim, fadeAnim, slideAnim]);

  const annualPackage = paywall.offering?.packages.find((pkg) => pkg.id === 'annual');
  const weeklyPackage = paywall.offering?.packages.find((pkg) => pkg.id === 'weekly');
  const selectedPackage = paywall.offering?.packages.find(
    (pkg) => pkg.id === paywall.selectedPackageId,
  );
  const isAnnualSelected = paywall.selectedPackageId === 'annual';
  const selectedPackageHasTrial = selectedPackage?.trialLabel != null;
  const isBusy = paywall.isLoading || paywall.isPurchasing || paywall.isRestoring;

  const savingsPercent = useMemo(
    () => computeAnnualSavings(annualPackage, weeklyPackage),
    [annualPackage, weeklyPackage],
  );

  const closePaywall = useCallback(() => {
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
  }, [exitSlideAnim, isBusy, isExiting, navigation, paywall, windowHeight]);

  const purchaseSelectedPackage = useCallback(async () => {
    const result = await paywall.purchaseSelectedPackage();
    if (result.status === 'purchased' && result.isPro) {
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const restorePurchases = useCallback(async () => {
    const result = await paywall.restorePurchases();
    if (result.status === 'restored' && result.isPro) {
      navigation.goBack();
    }
  }, [navigation, paywall]);

  const ctaLabel =
    isAnnualSelected && selectedPackageHasTrial
      ? 'Start my 3-day free trial'
      : isAnnualSelected
        ? 'Subscribe yearly'
        : 'Continue with weekly';

  return (
    <Animated.View style={[styles.screen, { transform: [{ translateY: exitSlideAnim }] }]}>
      <SafeAreaView
        style={[styles.screenBody, { paddingTop: insets.top + spacing.sm }]}
        edges={['left', 'right']}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
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
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>
              {selectedPackageHasTrial ? (
                <Text style={styles.trialNote}>Try free for 3 days — no charge until day 3</Text>
              ) : null}
            </View>

            <PaywallFeatureList />

            {selectedPackageHasTrial ? <PaywallTrialReminderToggle /> : null}

            {paywall.isLoading ? (
              <View style={styles.cardsLoading}>
                <ActivityIndicator color={colors.primary.blue600} />
              </View>
            ) : (
              <View style={styles.planCards}>
                {annualPackage ? (
                  <PlanCard
                    pkg={annualPackage}
                    isSelected={paywall.selectedPackageId === 'annual'}
                    onSelect={paywall.selectPackage}
                    savingsPercent={savingsPercent}
                  />
                ) : null}
                {weeklyPackage ? (
                  <PlanCard
                    pkg={weeklyPackage}
                    isSelected={paywall.selectedPackageId === 'weekly'}
                    onSelect={paywall.selectPackage}
                    savingsPercent={null}
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
        </ScrollView>

        <View style={styles.footer}>
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
          <Pressable
            accessibilityRole="button"
            disabled={isBusy || isExiting}
            onPress={() => {
              void restorePurchases();
            }}
            style={({ pressed }) => [
              styles.restoreButton,
              pressed && styles.subtlePressed,
              (isBusy || isExiting) && styles.disabled,
            ]}
          >
            <Text style={styles.restoreText}>
              {paywall.isRestoring ? 'Restoring...' : 'Restore Purchase'}
            </Text>
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
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

function getPaywallCopy(feature: RootStackScreenProps<'ProPaywall'>['route']['params']['feature']) {
  switch (feature) {
    case 'heart_rate_measurement':
      return {
        title: 'Measure without limits',
        subtitle: 'Unlock unlimited heart-rate readings, HRV, stress, and recovery insights.',
      };
    case 'daily_exercise':
      return {
        title: 'Breath whenever, wherever',
        subtitle: 'Unlock guided exercises and progress insights.',
      };
    case 'advanced_stats':
      return {
        title: 'Unlock your heart',
        subtitle: 'See RMSSD, HRV, stress, recovery response, and deeper trends.',
      };
    case 'session_history':
      return {
        title: 'Open your full history',
        subtitle: 'Detailed session history, graphs, and trend comparisons.',
      };
    default:
      return {
        title: 'Unlock the full experience',
        subtitle: 'Unlimited sessions, advanced stats, and personalized progress insights.',
      };
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  screenBody: {
    flex: 1,
  },
  header: {
    minHeight: 56,
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
    fontWeight: '600',
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
  content: {
    gap: spacing.lg,
  },
  headerCopy: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  title: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  trialNote: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.primary.blue600,
    textAlign: 'center',
    marginTop: spacing.xs,
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
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  restoreButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  restoreText: {
    ...typography.button.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.brand,
  },
  legal: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 15,
  },
  legalLink: {
    color: colors.text.brand,
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
