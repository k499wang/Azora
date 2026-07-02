import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

export default function AmbientBackground() {
  return (
    <View
      style={[StyleSheet.absoluteFill, styles.fill]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: colors.background.secondary,
  },
});
