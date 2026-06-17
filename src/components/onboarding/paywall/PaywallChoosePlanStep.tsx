import { ActivityIndicator, Text, View } from 'react-native';
import type {
  PaywallPackageId,
  PaywallPackageOption,
} from '../../../services/paywall';
import { colors } from '../../../theme/colors';
import {
  PlanCard,
} from '../../paywall/PlanCard';
import PaywallFeatureList from '../../paywall/PaywallFeatureList';
import PaywallTrialReminderToggle from '../../paywall/PaywallTrialReminderToggle';
import { paywallStepStyles as styles } from './paywallStepStyles';

interface PaywallChoosePlanStepProps {
  isLoading: boolean;
  annualPackage: PaywallPackageOption | undefined;
  weeklyPackage: PaywallPackageOption | undefined;
  selectedPackageId: PaywallPackageId;
  onSelectPackage: (packageId: PaywallPackageId) => void;
  savingsPercent: number | null;
  selectedPackageHasTrial: boolean;
  hasAnnualTrial: boolean;
}

export function PaywallChoosePlanStep({
  isLoading,
  annualPackage,
  weeklyPackage,
  selectedPackageId,
  onSelectPackage,
  savingsPercent,
  selectedPackageHasTrial,
  hasAnnualTrial,
}: PaywallChoosePlanStepProps) {
  const showCancelAnytime = !selectedPackageHasTrial || selectedPackageId === 'annual';

  return (
    <View style={styles.stepContainer}>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>Your plan is ready.</Text>
        <Text style={styles.title}>Unlock Azora for free</Text>
        <View style={styles.titleDivider} />
        {showCancelAnytime ? (
          <Text style={[styles.trialNote, styles.trialNoteDark]}>Cancel anytime</Text>
        ) : null}
      </View>

      <PaywallFeatureList hasAnnualTrial={hasAnnualTrial} />

      {hasAnnualTrial ? (
        <PaywallTrialReminderToggle dark disabled={!selectedPackageHasTrial} />
      ) : null}

      {isLoading ? (
        <View style={styles.cardsLoading}>
          <ActivityIndicator color={colors.primary.blue600} />
        </View>
      ) : (
        <View style={styles.planCards}>
          {annualPackage ? (
            <PlanCard
              pkg={annualPackage}
              isSelected={selectedPackageId === 'annual'}
              onSelect={onSelectPackage}
              savingsPercent={savingsPercent}
            />
          ) : null}
          {weeklyPackage ? (
            <PlanCard
              pkg={weeklyPackage}
              isSelected={selectedPackageId === 'weekly'}
              onSelect={onSelectPackage}
              savingsPercent={null}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

export default PaywallChoosePlanStep;
