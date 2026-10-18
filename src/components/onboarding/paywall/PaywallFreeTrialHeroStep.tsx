import { Text } from '../../common/Text';
import { View } from 'react-native';
import { paywallStepStyles as styles } from './paywallStepStyles';
import { TrialReminderBell } from './TrialReminderBell';
import { TRIAL_REMINDER_DAYS_BEFORE_END } from '../../../lib/paywall/trialReminder';

export function PaywallFreeTrialHeroStep() {
  return (
    <View style={styles.heroContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          We&apos;ll remind you {TRIAL_REMINDER_DAYS_BEFORE_END} days before your free trial ends
        </Text>
      </View>

      <View style={styles.bellWrap}>
        <TrialReminderBell />
      </View>
    </View>
  );
}

export default PaywallFreeTrialHeroStep;
