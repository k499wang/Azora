import { ActivityIndicator, View } from 'react-native';
import type {
  PaywallPackageId,
  PaywallPackageOption,
} from '../../../services/paywall';
import { colors } from '../../../theme/colors';
import { PlanCard } from '../../paywall/PlanCard';
import { computePerMonth } from '../../../lib/paywall/planPrice';
import { paywallStepStyles as styles } from './paywallStepStyles';

interface PaywallChoosePlanStepProps {
  isLoading: boolean;
  annualPackage: PaywallPackageOption | undefined;
  monthlyPackage: PaywallPackageOption | undefined;
  selectedPackageId: PaywallPackageId;
  onSelectPackage: (packageId: PaywallPackageId) => void;
  savingsPercent: number | null;
  hasAnnualTrial: boolean;
}

export function PaywallChoosePlanStep({
  isLoading,
  annualPackage,
  monthlyPackage,
  selectedPackageId,
  onSelectPackage,
  savingsPercent,
  hasAnnualTrial,
}: PaywallChoosePlanStepProps) {
  return (
    <View style={styles.choosePlanContainer}>
      {isLoading ? (
        <View style={[styles.cardsLoading, !hasAnnualTrial && styles.planCardsNoTrial]}>
          <ActivityIndicator color={colors.primary.blue500} />
        </View>
      ) : (
        <View style={[styles.planCardsStacked, !hasAnnualTrial && styles.planCardsNoTrial]}>
          {annualPackage ? (
            <View style={styles.annualCard}>
              <PlanCard
                pkg={annualPackage}
                isSelected={selectedPackageId === 'annual'}
                onSelect={onSelectPackage}
                savingsPercent={savingsPercent}
                comparePerMonth={monthlyPackage ? computePerMonth(monthlyPackage) : null}
                light
                layout="full-width"
                balanced
              />
            </View>
          ) : null}
          {monthlyPackage ? (
            <View style={styles.monthlyCard}>
              <PlanCard
                pkg={monthlyPackage}
                isSelected={selectedPackageId === 'monthly'}
                onSelect={onSelectPackage}
                savingsPercent={null}
                light
                layout="full-width"
                balanced
              />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default PaywallChoosePlanStep;
