import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  PaywallOffering,
  PaywallPackageId,
  PaywallPackageOption,
} from '../../../services/paywall';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import Icon, { type IconName } from '../../common/icons/Icon';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface OnboardingPaywallScreenProps {
  offering: PaywallOffering | null;
  selectedPackageId: PaywallPackageId;
  stepIndex: number;
  stepCount: number;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  errorMessage: string | null;
  onSelectPackage: (packageId: PaywallPackageId) => void;
  onPurchase: () => void;
  onRestore: () => void;
  onRetry: () => void;
  onContinueWithoutPro: () => void;
  onBack: () => void;
}

export default function OnboardingPaywallScreen({
  offering,
  selectedPackageId,
  isLoading,
  isPurchasing,
  isRestoring,
  errorMessage,
  onSelectPackage,
  onPurchase,
  onRestore,
  onRetry,
  onContinueWithoutPro,
  onBack,
}: OnboardingPaywallScreenProps) {
  const selectedPackage = offering?.packages.find(
    (pkg) => pkg.id === selectedPackageId,
  );
  const annualPackage = offering?.packages.find((pkg) => pkg.id === 'annual');
  const weeklyPackage = offering?.packages.find((pkg) => pkg.id === 'weekly');
  const isAnnualSelected = selectedPackageId === 'annual';
  const isBusy = isLoading || isPurchasing || isRestoring;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

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

  const ctaLabel = isAnnualSelected && selectedPackage?.trialLabel
    ? 'Start my free trial'
    : 'Continue with weekly';
  const timelineSteps = getAnnualTrialSteps();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close paywall"
          hitSlop={12}
          onPress={onBack}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.subtlePressed,
          ]}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
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
          <View style={styles.copy}>
            <Text style={styles.title}>Azora Pro</Text>
            <Text style={styles.subtitle}>
              Heart data, unlimited sessions, personalized plans, and progress insights.
            </Text>
          </View>

          <View style={styles.planSection}>
            <View style={styles.planTabs}>
              {isLoading ? (
                <View style={styles.planLoading}>
                  <ActivityIndicator color={colors.primary.blue600} />
                </View>
              ) : (
                <>
                  {annualPackage ? (
                    <PlanTab
                      pkg={annualPackage}
                      isSelected={selectedPackageId === annualPackage.id}
                      onSelectPackage={onSelectPackage}
                    />
                  ) : null}
                  {weeklyPackage ? (
                    <PlanTab
                      pkg={weeklyPackage}
                      isSelected={selectedPackageId === weeklyPackage.id}
                      onSelectPackage={onSelectPackage}
                    />
                  ) : null}
                </>
              )}
            </View>
            {!isLoading && selectedPackage ? (
              <PlanPriceDetail pkg={selectedPackage} />
            ) : null}
          </View>

          {isAnnualSelected ? (
            <View style={styles.timeline}>
              {timelineSteps.map((step, index) => (
                <TimelineStep
                  key={step.label}
                  {...step}
                  showLine={index < timelineSteps.length - 1}
                />
              ))}
            </View>
          ) : (
            <IncludedInPro />
          )}

          <Pressable
            accessibilityRole="button"
            disabled={isLoading || isPurchasing || isRestoring}
            onPress={onRestore}
            style={({ pressed }) => [
              styles.restoreButton,
              pressed && styles.subtlePressed,
              (isLoading || isPurchasing || isRestoring) && styles.disabled,
            ]}
          >
            <Text style={styles.restoreText}>
              {isRestoring ? 'Restoring...' : 'Restore Purchase'}
            </Text>
          </Pressable>

          {errorMessage ? (
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

      <View style={styles.footer}>
        <OnboardingPrimaryButton
          label={ctaLabel}
          onPress={onPurchase}
          loading={isPurchasing}
          disabled={isLoading || selectedPackage == null || isRestoring}
        />
        <Pressable
          accessibilityRole="button"
          disabled={isBusy}
          onPress={onContinueWithoutPro}
          style={({ pressed }) => [
            styles.freeButton,
            pressed && styles.subtlePressed,
            isBusy && styles.disabled,
          ]}
        >
          <Text style={styles.freeButtonText}>Continue free</Text>
        </Pressable>
        <Text style={styles.legal}>
          Auto-renews unless cancelled. Manage or cancel in App Store settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}

interface PlanTabProps {
  pkg: PaywallPackageOption;
  isSelected: boolean;
  onSelectPackage: (packageId: PaywallPackageId) => void;
}

function PlanTab({ pkg, isSelected, onSelectPackage }: PlanTabProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onSelectPackage(pkg.id)}
      style={({ pressed }) => [
        styles.planTab,
        isSelected && styles.planTabSelected,
        pressed && styles.planTabPressed,
      ]}
    >
      <Text style={[styles.planTabText, isSelected && styles.planTabTextSelected]}>
        {pkg.id === 'annual' ? 'Annual' : 'Weekly'}
      </Text>
    </Pressable>
  );
}

interface PlanPriceDetailProps {
  pkg: PaywallPackageOption;
}

function PlanPriceDetail({ pkg }: PlanPriceDetailProps) {
  const priceLine =
    pkg.id === 'annual'
      ? `${pkg.priceString}/year`
      : `${pkg.priceString}/week`;
  const detailLine =
    pkg.id === 'annual'
      ? '3 days free'
      : 'No free trial';

  return (
    <View style={styles.planPriceDetail}>
      <Text style={styles.planPriceDetailPrice}>{priceLine}</Text>
      <Text style={styles.planPriceDetailTrial}>{detailLine}</Text>
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

function TimelineStep({
  icon,
  label,
  title,
  body,
  showLine = false,
}: TimelineStepProps) {
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

function getAnnualTrialSteps(): Omit<TimelineStepProps, 'showLine'>[] {
  return [
    {
      icon: 'sparkle',
      label: 'Today',
      title: 'Unlock Azora Pro',
      body: 'Start your 3-day free trial for Azora Pro today.',
    },
    {
      icon: 'timer',
      label: 'Day 3',
      title: "We'll send you a reminder",
      body: 'We’ll remind you before annual billing begins.',
    },
    {
      icon: 'heart',
      label: 'Anytime',
      title: 'Cancel anytime',
      body: 'Manage or cancel in App Store settings whenever you want.',
    },
  ];
}

function IncludedInPro() {
  const benefits: Array<{ icon: IconName; title: string; body: string }> = [
    {
      icon: 'heart',
      title: 'Heart data insights',
      body: 'See heart-rate, HRV, and stress signals in one place.',
    },
    {
      icon: 'timer',
      title: 'Unlimited heart-rate sessions',
      body: 'Measure as often as you want without session limits.',
    },
    {
      icon: 'sparkle',
      title: 'Personalized plan',
      body: 'Get guidance shaped around your baseline and goals.',
    },
    {
      icon: 'journal',
      title: 'Progress insights',
      body: 'Track patterns over time and understand what is changing.',
    },
  ];

  return (
    <View style={styles.includedList}>
      {benefits.map((benefit, index) => (
        <View key={benefit.title}>
            <View style={styles.includedRow}>
            <View style={styles.includedIcon}>
              <Icon name={benefit.icon} size={20} color={colors.text.inverse} />
            </View>
            <View style={styles.includedCopy}>
              <Text style={styles.includedItemTitle}>{benefit.title}</Text>
              <Text style={styles.includedItemBody}>{benefit.body}</Text>
            </View>
          </View>
          {index < benefits.length - 1 ? <View style={styles.includedDivider} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.elevated,
  },
  header: {
    minHeight: 56,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 36,
    lineHeight: 36,
    color: colors.neutral[900],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  content: {
    gap: spacing.xl,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.medium,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  planTabs: {
    alignSelf: 'center',
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
    backgroundColor: colors.neutral[100],
  },
  planLoading: {
    minWidth: 160,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  planTab: {
    minWidth: 94,
    minHeight: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  planTabSelected: {
    backgroundColor: colors.neutral[700],
  },
  planTabPressed: {
    opacity: 0.8,
  },
  planTabText: {
    ...typography.button.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  planTabPrice: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    marginTop: 2,
  },
  planTabTextSelected: {
    color: colors.text.inverse,
  },
  planPriceDetail: {
    alignItems: 'center',
    gap: 2,
  },
  planPriceDetailPrice: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  planPriceDetailTrial: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
  },
  timeline: {
    alignSelf: 'stretch',
    gap: 0,
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
    width: 8,
    flex: 1,
    minHeight: 70,
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
    ...typography.body.medium,
    color: colors.text.secondary,
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
    color: colors.text.brand,
  },
  includedList: {
    paddingHorizontal: spacing.sm,
  },
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  includedIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue600,
  },
  includedCopy: {
    flex: 1,
  },
  includedItemTitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  includedItemBody: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  includedDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.border.subtle,
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
    backgroundColor: colors.background.elevated,
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
    color: colors.text.secondary,
  },
  legal: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 15,
  },
  subtlePressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
});
