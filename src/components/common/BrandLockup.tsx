import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const MARK_SIZE = 28;

export default function BrandLockup() {
  return (
    <View style={styles.row}>
      <Image
        source={require('../../../assets/iconApp.webp')}
        style={styles.mark}
      />
      <Text style={styles.wordmark}>Azora</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: 8,
  },
  wordmark: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.text.primary,
  },
});
