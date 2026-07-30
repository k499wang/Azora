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

const TRIAL_FEATURE: PaywallFeature = {
  icon: 'unlock',
  text: 'Start 7 days free, cancel anytime before you are charged',
};

const SUBSCRIPTION_FEATURE: PaywallFeature = {
  icon: 'unlock',
  text: 'Unlock every breathing and heart-rate tool in Azora',
};

const DEFAULT_FEATURES: PaywallFeature[] = [
  TRIAL_FEATURE,
  {
    icon: 'heart',
    text: 'Track heart rate, HRV, and stress with just your camera',
  },
  {
    icon: 'moon',
    text: 'Enjoy calmer nights with wind downs made for sleep',
  },
  {
    icon: 'timer',
    text: 'Remove session limits and practice as often as you like',
  },
  {
    icon: 'sparkle',
    text: 'Get a personalized plan that adapts as you improve',
  },
];

interface PaywallFeatureListProps {
  features?: PaywallFeature[];
  hasAnnualTrial?: boolean;
}

export default function PaywallFeatureList({
  features,
  hasAnnualTrial = true,
}: PaywallFeatureListProps) {
  const resolvedFeatures =
    features ??
    DEFAULT_FEATURES.map((feature) =>
      feature === TRIAL_FEATURE && !hasAnnualTrial ? SUBSCRIPTION_FEATURE : feature,
    );

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
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  text: {
    flex: 1,
    ...typography.body.medium,
    color: colors.neutral[0],
  },
});
