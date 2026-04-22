import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import WeekCalendar from '../components/home/WeekCalendar';
import HeroActionCard from '../components/home/HeroActionCard';
import RingStatCard from '../components/home/RingStatCard';
import EmptyStateCard from '../components/home/EmptyStateCard';
import BreathingLibrary from '../components/home/BreathingLibrary';
import DailyQuote from '../components/home/DailyQuote';

const DAILY_STREAK = 1;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const handleStart = () => navigation.navigate('DailyExercise');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppTopBar streak={DAILY_STREAK} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={[styles.section, styles.ringsRow]}>
          <RingStatCard
            label="BPM"
            value="62"
            target="60"
            progress={0.48}
            color={colors.error[500]}
            trackColor={colors.neutral[200]}
            icon="heart-pulse"
          />
          <RingStatCard
            label="Hold"
            value="1:42"
            target="2:00"
            progress={0.72}
            color={colors.primary.blue500}
            trackColor={colors.neutral[200]}
            icon="timer-sand"
          />
          <RingStatCard
            label="Health"
            value="92"
            target="100"
            progress={0.92}
            color={colors.success[500]}
            trackColor={colors.neutral[200]}
            icon="heart-plus"
          />
        </View>

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
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  heroSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.md,
  },
  quoteSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  ringsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recentSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: spacing.md,
  },
});
