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
    text: 'Reset your mind and sharpen focus by settling your nervous system',
  },
  {
    icon: 'heart',
    text: 'Track heart rate, HRV, and stress with just your camera',
  },
  {
    icon: 'moon',
    text: 'Enjoy calmer nights with wind downs made for sleep',
  },
  {
    icon: 'sparkle',
    text: 'Get a personalized plan that adapts as you improve',
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
            <Icon name={feature.icon} size={16} color={colors.neutral[0]} />
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paywall.iconFill,
  },
  text: {
    flex: 1,
    ...typography.body.medium,
    color: colors.neutral[0],
  },
});
