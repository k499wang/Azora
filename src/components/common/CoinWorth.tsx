import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import Icon from './icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const COIN_SIZE = 24;

interface Props {
  coins: number;
  /** on a coloured block rather than a card */
  inverse?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** What finishing something pays. Callers fold the amount into their own accessibility label. */
export default function CoinWorth({ coins, inverse = false, style }: Props) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.worth, style]}
    >
      <Icon name="coin" size={COIN_SIZE} color={colors.reward.gold} />
      <Text style={[styles.value, inverse && styles.valueInverse]}>{coins}</Text>
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
