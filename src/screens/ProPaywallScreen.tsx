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
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  const hasAnnualTrial = annualPackage?.trialLabel != null;
  const selectedPackageHasTrial = selectedPackage?.trialLabel != null;
  const showCancelAnytime = !selectedPackageHasTrial || isAnnualSelected;
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
      <ImageBackground
        source={require('../../assets/backgrounds/sunset.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0.08)',
            'rgba(0,0,0,0.38)',
          ]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      <SafeAreaView
        style={[styles.screenBody, { paddingTop: insets.top }]}
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
              <Text style={styles.eyebrow}>Your plan is ready.</Text>
              <Text style={styles.title}>Unlock Azora for free</Text>
              <View style={styles.titleDivider} />
              {showCancelAnytime ? (
                <Text style={styles.trialNote}>Cancel anytime</Text>
              ) : null}
            </View>

            <PaywallFeatureList hasAnnualTrial={hasAnnualTrial} />

            {hasAnnualTrial ? (
              <PaywallTrialReminderToggle dark disabled={!selectedPackageHasTrial} />
            ) : null}

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

        <View style={[styles.tray, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.trayHandle} />
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
        </View>
      </SafeAreaView>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },
  background: {
    flex: 1,
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
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 32,
    color: colors.neutral[0],
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
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  eyebrow: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'left',
  },
  title: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.neutral[0],
    textAlign: 'left',
  },
  titleDivider: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  trialNote: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.primary.blue200,
    textAlign: 'left',
    marginTop: spacing.xs,
  },
  cardsLoading: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCards: {
    gap: spacing.md,
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
  tray: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
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
  trayHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: spacing.xs,
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
    color: colors.neutral[0],
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
