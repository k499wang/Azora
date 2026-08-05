import { ActivityIndicator, View } from 'react-native';
import type {
  PaywallPackageId,
  PaywallPackageOption,
} from '../../../services/paywall';
import { colors } from '../../../theme/colors';
import { PlanCard, computePerWeek } from '../../paywall/PlanCard';
import { paywallStepStyles as styles } from './paywallStepStyles';

interface PaywallChoosePlanStepProps {
  isLoading: boolean;
  annualPackage: PaywallPackageOption | undefined;
  weeklyPackage: PaywallPackageOption | undefined;
  selectedPackageId: PaywallPackageId;
  onSelectPackage: (packageId: PaywallPackageId) => void;
  savingsPercent: number | null;
  hasAnnualTrial: boolean;
}

export function PaywallChoosePlanStep({
  isLoading,
  annualPackage,
  weeklyPackage,
  selectedPackageId,
  onSelectPackage,
  savingsPercent,
  hasAnnualTrial,
}: PaywallChoosePlanStepProps) {
  return (
    <View style={styles.choosePlanContainer}>
      {isLoading ? (
        <View style={[styles.cardsLoading, !hasAnnualTrial && styles.planCardsNoTrial]}>
          <ActivityIndicator color={colors.primary.blue600} />
        </View>
      ) : (
        <View style={[styles.planCards, !hasAnnualTrial && styles.planCardsNoTrial]}>
          {annualPackage ? (
            <PlanCard
              pkg={annualPackage}
              isSelected={selectedPackageId === 'annual'}
              onSelect={onSelectPackage}
              savingsPercent={savingsPercent}
              comparePerWeek={weeklyPackage ? computePerWeek(weeklyPackage) : null}
              light
            />
          ) : null}
          {weeklyPackage ? (
            <PlanCard
              pkg={weeklyPackage}
              isSelected={selectedPackageId === 'weekly'}
              onSelect={onSelectPackage}
              savingsPercent={null}
              light
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

export default PaywallChoosePlanStep;
