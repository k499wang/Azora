import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const SPLASH_IMAGE = require('../../../assets/app/splash.png');

export function BrandSplash() {
  return (
    <View style={styles.root}>
      <Image source={SPLASH_IMAGE} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
