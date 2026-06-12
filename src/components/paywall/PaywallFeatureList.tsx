import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Icon from '../common/icons/Icon';

const TRIAL_FEATURE = '7-day free trial on annual, no charge to start, cancel anytime';
const SUBSCRIPTION_FEATURE = 'Full Pro access across every breathing and heart-rate tool';

const DEFAULT_FEATURES = [
  TRIAL_FEATURE,
  'Heart rate, HRV & stress from your phone camera, no wearable needed',
  'Unlimited guided sessions',
  'Daily streak & progress insights',
];

interface PaywallFeatureListProps {
  features?: string[];
  hasAnnualTrial?: boolean;
}

export default function PaywallFeatureList({
  features,
  hasAnnualTrial = true,
}: PaywallFeatureListProps) {
  const resolvedFeatures =
    features ??
    DEFAULT_FEATURES.map((feature) =>
      feature === TRIAL_FEATURE && !hasAnnualTrial
        ? SUBSCRIPTION_FEATURE
        : feature,
    );

  return (
    <View style={styles.list}>
      {resolvedFeatures.map((feature) => (
        <View key={feature} style={styles.row}>
          <View style={styles.check}>
            <Icon name="check" size={12} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.text}>{feature}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  text: {
    flex: 1,
    ...typography.body.medium,
    color: colors.neutral[0],
  },
});
