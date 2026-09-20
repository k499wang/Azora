import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type {
  PaywallPackageId,
  PaywallPackageOption,
} from '../../services/paywall';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { computePerWeek } from '../../lib/paywall/planPrice';
import { PlanCard } from './PlanCard';

interface PaywallTrayPlansProps {
  annualPackage?: PaywallPackageOption;
  weeklyPackage?: PaywallPackageOption;
  selectedPackageId: PaywallPackageId;
  savingsPercent: number | null;
  isLoading: boolean;
  disabled: boolean;
  light?: boolean;
  /** One tap chooses the plan and opens the store sheet for it. */
  onPurchase: (packageId: PaywallPackageId) => void;
}

const LOADING_HEIGHT = 128;

/**
 * The paywall's only buy control: the two plans, in the tray, where a tap is
 * the purchase rather than a selection to be confirmed by a button underneath.
 */
export function PaywallTrayPlans({
  annualPackage,
  weeklyPackage,
  selectedPackageId,
  savingsPercent,
  isLoading,
  disabled,
  light,
  onPurchase,
}: PaywallTrayPlansProps) {
  if (isLoading || annualPackage == null || weeklyPackage == null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary.blue500} />
      </View>
    );
  }

  const select = (packageId: PaywallPackageId) => {
    if (disabled) return;
    onPurchase(packageId);
  };

  return (
    <View style={styles.cards}>
      <PlanCard
        pkg={annualPackage}
        isSelected={selectedPackageId === 'annual'}
        onSelect={select}
        savingsPercent={savingsPercent}
        comparePerWeek={computePerWeek(weeklyPackage)}
        layout="full-width"
        light={light}
      />
      <PlanCard
        pkg={weeklyPackage}
        isSelected={selectedPackageId === 'weekly'}
        onSelect={select}
        savingsPercent={null}
        layout="full-width"
        light={light}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: spacing.sm,
    minHeight: 104,
  },
  loading: {
    height: LOADING_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
