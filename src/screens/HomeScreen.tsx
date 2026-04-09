import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import Pill from '../components/common/Pill';
import WeekCalendar from '../components/home/WeekCalendar';
import DailyExerciseButton from '../components/home/DailyExerciseButton';
import DailyScoresSection from '../components/home/DailyScoresSection';
import HighlightCards from '../components/home/HighlightCards';
import AnalyticsSection from '../components/analytics/AnalyticsSection';

const USER_NAME = 'Kevin';
const DAILY_STREAK = 7;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome to Brthe</Text>
            <Text style={styles.name}>Hi, {USER_NAME}!</Text>
          </View>
          <Pill icon="fire" label={String(DAILY_STREAK)} />
        </View>
      </View>
      <WeekCalendar />
      <View style={styles.cta}>
        <DailyExerciseButton onPress={() => {}} />
      </View>
      <DailyScoresSection />
      <AnalyticsSection />
      <HighlightCards />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },
  header: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: padding.screen.vertical,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.title.title1,
    color: colors.text.primary,
  },
  cta: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
});
