import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const HALO_SIZE = 96;

interface Props {
  message: string;
}

export default function HistoryEmptyDay({ message }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.halo}>
        <Icon name="moon" size={44} color={colors.primary.blue300} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  halo: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.accentSoft,
  },
  message: {
    ...typography.body.medium,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
