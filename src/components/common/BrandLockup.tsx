import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const MARK_HEIGHT = 28;
const MARK_ASPECT = 317 / 249;

export default function BrandLockup() {
  return (
    <View style={styles.row}>
      <Image
        source={require('../../../assets/blue_river_logo_transparent.png')}
        style={styles.mark}
        resizeMode="contain"
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
    width: MARK_HEIGHT * MARK_ASPECT,
    height: MARK_HEIGHT,
  },
  wordmark: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.text.primary,
  },
});
