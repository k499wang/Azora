import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { scaleControl } from '../onboarding/onboardingVisualScale';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';

const ICON_SIZE = scaleControl(18);

interface Props {
  label: string;
}

/** A centred tick and one reassurance, e.g. "No commitment, cancel anytime". */
export function PaywallCheckLine({ label }: Props) {
  return (
    <View style={styles.row}>
      <Icon name="check" size={ICON_SIZE} color={colors.text.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
