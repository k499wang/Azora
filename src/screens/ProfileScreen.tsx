import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { padding, spacing } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import AnalyticsSection from '../components/analytics/AnalyticsSection';
import HighlightCards from '../components/home/HighlightCards';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppTopBar />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>
        <AnalyticsSection />
        <HighlightCards />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['2xl'],
  },
  pageHeader: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: padding.screen.vertical,
  },
  pageTitle: {
    ...typography.title.title1,
    color: colors.text.primary,
  },
});
