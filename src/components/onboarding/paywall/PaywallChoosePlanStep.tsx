import { Text } from '../../common/Text';
import { ActivityIndicator, View } from 'react-native';
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
    <View style={styles.choosePlanContainer}>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>Your free plan is ready.</Text>
        <Text style={styles.title}>
          {hasAnnualTrial ? 'Your 7-day Free Trial' : 'Unlock Azora Pro'}
        </Text>
        <View style={styles.titleDivider} />
        {showCancelAnytime ? (
          <Text style={[styles.trialNote, styles.trialNoteDark]}>Cancel anytime</Text>
        ) : null}
      </View>

      <PaywallFeatureList hasAnnualTrial={hasAnnualTrial} />

      {hasAnnualTrial ? (
        <View style={styles.reminderToggleWrap}>
          <PaywallTrialReminderToggle dark disabled={!selectedPackageHasTrial} />
        </View>
      ) : null}

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
