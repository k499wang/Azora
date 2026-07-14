import { Text } from '../../common/Text';
import { View } from 'react-native';
import { colors } from '../../../theme/colors';
import Icon, { type IconName } from '../../common/icons/Icon';
import { paywallStepStyles as styles } from './paywallStepStyles';

const benefits: Array<{
  icon: IconName;
  title: string;
  body: string;
  accent: string;
}> = [
  {
    icon: 'heart',
    title: 'Heart data insights',
    body: 'Heart rate, HRV, stress, and recovery in one place.',
    accent: colors.primary.blue500,
  },
  {
    icon: 'timer',
    title: 'Unlimited sessions',
    body: 'Measure and train as often as you want — no caps.',
    accent: colors.primary.blue700,
  },
  {
    icon: 'sparkle',
    title: 'Personalized plan',
    body: 'Guidance shaped around your baseline and goals.',
    accent: colors.primary.blue600,
  },
];

export function PaywallValueStep() {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.valueHeader}>
        <Text style={styles.valueTitle}>Try your plan for free</Text>
        <View style={styles.valueTitleUnderline} />
        <Text style={styles.valueSubtitle}>
          Heart data, unlimited sessions, and a plan built around you.
        </Text>
      </View>

      <View style={styles.valueGrid}>
        {benefits.map((benefit) => (
          <View key={benefit.title} style={styles.valueTile}>
            <View style={[styles.valueTileIcon, { backgroundColor: benefit.accent }]}>
              <Icon name={benefit.icon} size={22} color={colors.text.inverse} />
            </View>
            <View style={styles.valueTileCopy}>
              <Text style={styles.valueTileTitle}>{benefit.title}</Text>
              <Text style={styles.valueTileBody}>{benefit.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default PaywallValueStep;
