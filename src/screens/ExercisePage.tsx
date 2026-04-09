import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function ExercisePage() {
  const insets = useSafeAreaInsets();

  return <View style={[styles.screen, { paddingTop: insets.top }]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
