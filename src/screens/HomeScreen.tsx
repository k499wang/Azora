import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import WeekCalendar from '../components/home/WeekCalendar';
import HeroActionCard from '../components/home/HeroActionCard';
import HeartHealthSection from '../components/home/HeartHealthSection';
import HomeTopMesh from '../components/home/HomeTopMesh';
import SessionStatsPager from '../components/home/SessionStatsPager';
import EmptyStateCard from '../components/home/EmptyStateCard';
import BreathingLibrary from '../components/home/BreathingLibrary';
import DailyQuote from '../components/home/DailyQuote';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const handleStart = () => navigation.navigate('DailyExercise');

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <HomeTopMesh />

          <AppTopBar />

          <WeekCalendar />

          <View style={styles.quoteSection}>
            <DailyQuote />
          </View>

          <View style={styles.heroSection}>
            <HeroActionCard
              title="Daily breath"
              subtitle="Box breathing to center your focus"
              onPress={handleStart}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SessionStatsPager />
        </View>

        <HeartHealthSection />

        <BreathingLibrary />

        <View style={styles.recentSection}>
          <SectionHeader title="Recently logged" />
          <EmptyStateCard
            title="No sessions yet"
            subtitle="Start today's breath to see it show up here."
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },
  topSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  heroSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.lg,
  },
  quoteSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  recentSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: spacing.md,
  },
});
