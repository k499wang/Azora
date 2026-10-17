import { Text } from '../../common/Text';
import { View } from 'react-native';
import { paywallStepStyles as styles } from './paywallStepStyles';
import { TrialReminderBell } from './TrialReminderBell';

export function PaywallFreeTrialHeroStep() {
  return (
    <View style={styles.heroContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          We&apos;ll send you a reminder before your trial ends
        </Text>
      </View>

      <View style={styles.bellWrap}>
        <TrialReminderBell />
      </View>
    </View>
  );
}

export default PaywallFreeTrialHeroStep;
