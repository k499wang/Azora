import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Icon from '../common/icons/Icon';

const DEFAULT_FEATURES = [
  "3 day free trial for annual users.",
  'Heart rate, HRV & stress from your phone camera — no wearable needed',
  'Unlimited guided sessions',
  'Daily streak & progress insights',
];

interface PaywallFeatureListProps {
  features?: string[];
}

export default function PaywallFeatureList({
  features = DEFAULT_FEATURES,
}: PaywallFeatureListProps) {
  return (
    <View style={styles.list}>
      {features.map((feature) => (
        <View key={feature} style={styles.row}>
          <View style={styles.check}>
            <Icon name="check" size={14} color={colors.text.inverse} />
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
    backgroundColor: colors.primary.blue600,
  },
  text: {
    flex: 1,
    ...typography.body.medium,
    color: colors.text.primary,
  },
});
