import { Text } from '../common/Text';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Icon, { type IconName } from '../common/icons/Icon';

export interface PaywallFeature {
  icon: IconName;
  text: string;
}

const DEFAULT_FEATURES: PaywallFeature[] = [
  {
    icon: 'waves',
    text: 'Calm your racing mind in minutes and stay sharper all day',
  },
  {
    icon: 'heart',
    text: 'Track stress, recovery, and heart rate with just your camera',
  },
  {
    icon: 'moon',
    text: 'Fall asleep faster with wind downs built for deep rest',
  },
  {
    icon: 'sparkle',
    text: 'Get a plan that grows smarter as you do',
  },
];

interface PaywallFeatureListProps {
  features?: PaywallFeature[];
}

export default function PaywallFeatureList({ features }: PaywallFeatureListProps) {
  const resolvedFeatures = features ?? DEFAULT_FEATURES;

  return (
    <View style={styles.list}>
      {resolvedFeatures.map((feature) => (
        <View key={feature.text} style={styles.row}>
          <View style={styles.iconWrap}>
            <Icon name={feature.icon} size={22} color={colors.primary.blue600} />
          </View>
          <Text style={styles.text}>{feature.text}</Text>
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
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue100,
  },
  text: {
    flex: 1,
    ...typography.body.medium,
    color: colors.text.primary,
  },
});
