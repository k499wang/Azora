import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PaywallPlanPreviewsScreenProps, PreviewPlans } from '../app/navigation';
import { returnToHome } from '../app/navigation/returnToHome';
import AppTopBar from '../components/common/AppTopBar';
import { Text } from '../components/common/Text';
import OnboardingPrimaryButton from '../components/onboarding/OnboardingPrimaryButton';
import { PaywallChoiceCard } from '../components/paywall/PaywallChoiceCard';
import { singlePackage } from '../lib/paywall/singlePackage';
import type { PaywallLayout, PaywallPlanPicker } from '../services/paywall';
import { useAuthStore } from '../stores/authStore';
import { useHomeCardPaywallStore } from '../stores/homeCardPaywallStore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import { PREVIEW_PLAN_SETS } from './OnboardingPaywallPreviewScreen';

const LAYOUTS: { id: PaywallLayout; title: string; detail: string }[] = [
  { id: 'deck', title: 'Steps', detail: 'Benefits, reminder, then plans' },
  { id: 'deck_plan', title: 'Steps, opens on plan', detail: '7-day plan, reminder, then plans' },
  { id: 'plan', title: 'Plan paywall', detail: 'One page, one package' },
  { id: 'home_card', title: 'Home card', detail: 'One card over Home, one package' },
  { id: 'long', title: 'Long page', detail: 'Scrolling page with plan cards' },
];

const PICKERS: { id: PaywallPlanPicker; title: string; detail: string }[] = [
  { id: 'side_by_side', title: 'Side by side', detail: 'Two compact cards in a row' },
  { id: 'stacked', title: 'Stacked', detail: 'Two full-width cards' },
];

const PLANS: { id: PreviewPlans; title: string; detail: string }[] = [
  { id: 'weeklyFreeTrial', title: 'Weekly, free trial', detail: '3 days free, then $9.99/week' },
  { id: 'annualFreeTrialWeekly', title: 'Annual free trial + weekly', detail: '7 days free, then $39.99/year, or $9.99/week' },
  { id: 'annualFreeTrialWeeklyPaidTrial', title: 'Annual free trial + weekly paid trial', detail: '7 days free, or 7 days for $0.99' },
  { id: 'monthlyPaidTrialWeeklyFreeTrial', title: 'Monthly paid trial + weekly free trial', detail: '30 days for $5.99, or 3 days free' },
  { id: 'weeklyPaidTrial', title: 'Weekly, paid trial', detail: '7 days for $0.99, then $9.99/week' },
  { id: 'monthlyPaidTrial', title: 'Monthly, paid trial', detail: '30 days for $5.99, then $9.99/month' },
  { id: 'annualPaidTrial', title: 'Annual, paid trial', detail: '30 days for $4.99, then $29.99/year' },
  { id: 'annualWeekly', title: 'Annual + weekly, paid trials', detail: 'Both with a paid trial' },
  { id: 'monthlyWeekly', title: 'Monthly + weekly, paid trials', detail: 'Both with a paid trial' },
  { id: 'weeklyNoTrial', title: 'Weekly, no trial', detail: '$9.99/week' },
  { id: 'monthlyNoTrial', title: 'Monthly, no trial', detail: '$9.99/month' },
  { id: 'annualNoTrial', title: 'Annual, no trial', detail: '$39.99/year' },
];

/** Dev only: any paywall layout with any plan shape, using sample prices. */
export default function PaywallPlanPreviewsScreen({ navigation }: PaywallPlanPreviewsScreenProps) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [layout, setLayout] = useState<PaywallLayout>('deck');
  const [plans, setPlans] = useState<PreviewPlans>('monthlyPaidTrialWeeklyFreeTrial');
  const [planPicker, setPlanPicker] = useState<PaywallPlanPicker>('side_by_side');

  const open = () => {
    if (layout !== 'home_card') {
      navigation.navigate('OnboardingPaywallPreview', { layout, plans, planPicker });
      return;
    }
    const pkg = singlePackage({ onlyPackageId: null, packages: PREVIEW_PLAN_SETS[plans] });
    if (userId == null || pkg == null) return;
    useHomeCardPaywallStore.getState().show({
      userId,
      name: 'Alex',
      goalPhrase: 'feel calmer on the hard days',
      preview: { pkg },
    });
    returnToHome(navigation);
  };

  return (
    <View style={[styles.screen, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <AppTopBar title="Paywall plans" showBack showAvatar={false} showStreak={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Paywall</Text>
        {LAYOUTS.map((option) => (
          <PaywallChoiceCard
            key={option.id}
            title={option.title}
            detail={option.detail}
            selected={layout === option.id}
            onPress={() => setLayout(option.id)}
          />
        ))}
        <Text style={styles.heading}>Two-plan layout</Text>
        {PICKERS.map((option) => (
          <PaywallChoiceCard
            key={option.id}
            title={option.title}
            detail={option.detail}
            selected={planPicker === option.id}
            onPress={() => setPlanPicker(option.id)}
          />
        ))}
        <Text style={styles.heading}>Plans</Text>
        {PLANS.map((option) => (
          <PaywallChoiceCard
            key={option.id}
            title={option.title}
            detail={option.detail}
            selected={plans === option.id}
            onPress={() => setPlans(option.id)}
          />
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <OnboardingPrimaryButton label="Open preview" onPress={open} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  heading: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
