import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import AppTopBar from '../components/common/AppTopBar';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#F0E6F6', '#E8EEF8', colors.background.primary]} locations={[0, 0.4, 0.75]} style={StyleSheet.absoluteFill} />
      <AppTopBar />
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
  },
});
