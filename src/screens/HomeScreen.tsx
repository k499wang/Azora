import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import useBreathingStats from '../hooks/useBreathingStats';

const USER_NAME = 'Kevin';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [selectedDaysAgo, setSelectedDaysAgo] = useState(0);
  const { summary } = useBreathingStats(selectedDaysAgo);

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandBlock}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/icon2.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>Azora</Text>
            </View>
            <Text style={styles.name}>Hi, {USER_NAME}!</Text>
          </View>
          <Pill icon="fire" label={String(summary.streakCount)} />
        </View>
      </View>
      <WeekCalendar onSelectDay={setSelectedDaysAgo} />
      <View style={styles.cta}>
        <DailyExerciseButton
          onPress={() => navigation.navigate('DailyExercise')}
        />
      </View>
      <DailyScoresSection
        bestHoldSeconds={summary.selectedDayStats.bestHoldSeconds}
        totalPracticeSeconds={summary.selectedDayStats.totalPracticeSeconds}
        sessionCount={summary.selectedDayStats.sessionCount}
      />
      <AnalyticsSection data={summary.weeklyHoldTrend} />
      <HighlightCards bestHoldSeconds={summary.bestHoldSeconds} />
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
    alignItems: 'flex-start',
  },
  brandBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  brandName: {
    ...typography.title.title3,
    color: colors.text.primary,
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
