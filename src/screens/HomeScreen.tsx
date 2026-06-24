import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import AmbientBackground from '../components/common/AmbientBackground';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import TopBarWeekCalendar from '../components/common/TopBarWeekCalendar';
import BreathingLibrary from '../components/home/BreathingLibrary';
import DailyPlanCard from '../components/home/DailyPlanCard';
import EmotionRow from '../components/home/EmotionRow';
import { getBackgroundImageSource } from '../services/images/backgroundImageCache';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { formatLocalDate } from '../lib/calendar/weekCalendarDays';
import { deriveHoldStats } from '../lib/holdStats';
import type { HomeScreenProps } from '../app/navigation';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { useAuthStore } from '../stores/authStore';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import type {
  FeatureAccessResult,
  FeatureKeyValue,
} from '../services/subscriptions/featureAccess';

const HERO_FRAME_ASPECT_RATIO = 1.1;

function getMsUntilNextLocalDay(): number {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 1, 0);

  return Math.max(1000, nextDay.getTime() - now.getTime());
}

function StreakNudge({
  streakDays,
  todayDone,
}: {
  streakDays: number;
  todayDone: boolean;
}) {
  let message: string;
  if (todayDone) {
    if (streakDays <= 0) return null;
    message =
      streakDays === 1
        ? 'Day 1 locked in — see you tomorrow'
        : `${streakDays}-day streak locked in for today`;
  } else if (streakDays <= 0) {
    message = 'Start your streak with today’s hold';
  } else if (streakDays === 1) {
    message = 'Day 1 in the books — keep it going today';
  } else {
    message = `${streakDays}-day streak — don’t break it today`;
  }

  return (
    <Text style={styles.streakNudge} numberOfLines={1} ellipsizeMode="tail">
      {message}
    </Text>
  );
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function Greeting({ displayName }: { displayName: string | null | undefined }) {
  const firstName = displayName?.trim().split(/\s+/)[0];
  const greeting = getTimeOfDayGreeting();
  return (
    <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
      {firstName ? `${greeting}, ${firstName}` : greeting}
    </Text>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const displayName = profileSummaryQuery.data?.profile?.displayName ?? null;
  const dailyExerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const [todayLocalDate, setTodayLocalDate] = useState(() => formatLocalDate(new Date()));
  const [selectedLocalDate, setSelectedLocalDate] = useState(todayLocalDate);
  const refreshTodayLocalDate = useCallback(() => {
    const nextTodayLocalDate = formatLocalDate(new Date());

    if (nextTodayLocalDate === todayLocalDate) {
      return;
    }

    setTodayLocalDate(nextTodayLocalDate);
    setSelectedLocalDate((currentSelectedLocalDate) =>
      currentSelectedLocalDate === todayLocalDate
        ? nextTodayLocalDate
        : currentSelectedLocalDate,
    );
  }, [todayLocalDate]);
  const homeStatsQuery = useHomeStatsQuery(user?.id ?? null, selectedLocalDate);
  const stats = homeStatsQuery.data;
  const todayBreathHold = stats?.todayBreathHold ?? null;
  useEffect(() => {
    const timeout = setTimeout(refreshTodayLocalDate, getMsUntilNextLocalDay());

    return () => clearTimeout(timeout);
  }, [refreshTodayLocalDate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshTodayLocalDate();
      }
    });

    return () => subscription.remove();
  }, [refreshTodayLocalDate]);

  // The recently-logged list and its analytics now live on the Heart tab
  // (see RecentlyLoggedSection — it uses useIsFocused to gate the view event).

  const currentStreak = stats?.streak?.currentStreak ?? 0;
  const holdStats = deriveHoldStats(stats?.dailyActivity, todayLocalDate);
  const showProPaywall = useCallback((
    feature: FeatureKeyValue,
    placement: typeof PaywallPlacement[keyof typeof PaywallPlacement],
    access: FeatureAccessResult,
    sourceAction?: string,
  ) => {
    trackFeatureGateHit({
      feature,
      placement,
      sourceScreen: 'Home',
      sourceAction,
      access,
    });
    navigation.navigate('ProPaywall', {
      placement,
      sourceScreen: 'Home',
      sourceAction,
      feature,
    });
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <View style={styles.heroBackdrop} pointerEvents="none">
            <MaskedView
              style={StyleSheet.absoluteFill}
              maskElement={(
                <LinearGradient
                  colors={['black', 'black', 'transparent']}
                  locations={[0, 0.65, 1]}
                  style={StyleSheet.absoluteFill}
                />
              )}
            >
              <Image
                source={getBackgroundImageSource('homeHero')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
              />
            </MaskedView>
          </View>
          <AppTopBar
            leftSlot={(
              <TopBarWeekCalendar
                todayLocalDate={todayLocalDate}
                selectedLocalDate={selectedLocalDate}
                completedDaysAgo={stats?.completedDaysAgo ?? []}
                streakDays={currentStreak}
                onSelectDay={setSelectedLocalDate}
              />
            )}
          />

          <View style={styles.heroTextSection}>
            <Greeting displayName={displayName} />
            <StreakNudge
              streakDays={currentStreak}
              todayDone={todayBreathHold?.holdSeconds != null}
            />
          </View>
        </View>

        <View style={styles.dailyBreathholdSection}>
          <SectionHeader title="Daily Breathhold" />
          <DailyPlanCard
            todayHoldSeconds={todayBreathHold?.holdSeconds ?? null}
            lastHoldSeconds={holdStats.lastHoldSeconds}
            bestHoldSeconds={holdStats.bestHoldSeconds}
            streakDays={currentStreak}
            onPress={() => {
              if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
                showProPaywall(
                  FeatureKey.DailyExercise,
                  PaywallPlacement.ExercisePremiumGate,
                  dailyExerciseAccess,
                  'daily_plan',
                );
                return;
              }

              navigation.navigate('DailyExercise');
            }}
          />
        </View>

        <View style={styles.feelingSection}>
          <SectionHeader title="How are you feeling?" />
          <EmotionRow />
        </View>

        <BreathingLibrary />
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
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: spacing['7xl'] + spacing.xl,
    gap: margin.sectionGap,
  },
  topSection: {
    position: 'relative',
    paddingBottom: spacing.xl,
  },
  heroBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: HERO_FRAME_ASPECT_RATIO,
    overflow: 'hidden',
  },
  heroTextSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  dailyBreathholdSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing['4xl'],
    gap: spacing.md,
  },
  feelingSection: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
  greeting: {
    ...typography.display.display3,
    fontSize: 30,
    lineHeight: 38,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  streakNudge: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.neutral[600],
    marginTop: -spacing.xs,
    textAlign: 'center',
  },
});
