import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { selfCareGoalCoins, type SelfCareGoalRecurrence } from './domain/selfCareGoal';

const COIN_SIZE = 18;

interface Props {
  recurrence: SelfCareGoalRecurrence;
  /** on a coloured block rather than a card */
  inverse?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** What a to-do pays when ticked. Callers fold the amount into their own accessibility label. */
export default function TodoCoinWorth({ recurrence, inverse = false, style }: Props) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.worth, style]}
    >
      <Icon name="coin" size={COIN_SIZE} color={colors.reward.gold} />
      <Text style={[styles.value, inverse && styles.valueInverse]}>
        +{selfCareGoalCoins(recurrence)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  worth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  valueInverse: {
    color: colors.text.inverse,
  },
});
