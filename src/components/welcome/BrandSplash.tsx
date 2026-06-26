import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const LOCKUP = require('../../../assets/splash-lockup.png');

export function BrandSplash() {
  return (
    <View style={styles.root}>
      <Image source={LOCKUP} style={styles.lockup} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  lockup: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
