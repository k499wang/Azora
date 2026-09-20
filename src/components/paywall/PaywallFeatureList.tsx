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
  compact?: boolean;
}

export default function PaywallFeatureList({ features, compact }: PaywallFeatureListProps) {
  const resolvedFeatures = features ?? DEFAULT_FEATURES;

  return (
    <View style={[styles.list, compact && styles.listCompact]}>
      {resolvedFeatures.map((feature) => (
        <View key={feature.text} style={[styles.row, compact && styles.rowCompact]}>
          <View style={[styles.checkCircle, compact && styles.checkCircleCompact]}>
            <Icon name="check" size={compact ? 12 : 14} color={colors.primary.blue500} />
          </View>
          <Text style={[styles.text, compact && styles.textCompact]}>{feature.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  listCompact: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rowCompact: {
    gap: spacing.xs,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginTop: 2,
    borderWidth: 2,
    borderColor: colors.primary.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleCompact: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  text: {
    flex: 1,
    minWidth: 0,
    ...typography.body.medium,
    color: colors.text.primary,
  },
  textCompact: {
    ...typography.caption.caption1,
  },
});
