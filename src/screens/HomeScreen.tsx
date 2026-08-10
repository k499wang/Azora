import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import CompactActionBanner from '../components/common/CompactActionBanner';
import WeekCalendarStrip from '../components/common/WeekCalendarStrip';
import TodaysDailiesSection from '../components/home/TodaysDailiesSection';
import HomeRoom from '../features/room/HomeRoom';
import RoomProgressCard from '../features/room/RoomProgressCard';
import { useDailiesCompletion } from '../hooks/useDailiesCompletion';
import { useStartDaily } from '../hooks/useStartDaily';
import type { HomeScreenProps } from '../app/navigation';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { useAuthStore } from '../stores/authStore';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../services/dailyPlan/types';

const SURVEY_DISCOUNT_URL = 'https://docs.google.com/forms/d/1wdbzWnXbhdpFZ3HoPcRet5K7EGW9RRtEQqrVYiXHwtc/viewform?edit_requested=true';

export default function HomeScreen(_: HomeScreenProps) {
  const user = useAuthStore((state) => state.user);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(user?.id ?? null);
  const dailyPlanSchedule =
    dailyPlanScheduleQuery.data ?? DEFAULT_DAILY_PLAN_SCHEDULE;
  const dailies = useDailiesCompletion(user?.id ?? null);
  const todayLocalDate = dailies.todayLocalDate;
  const homeStatsQuery = useHomeStatsQuery(user?.id ?? null, todayLocalDate);
  const stats = homeStatsQuery.data;
  const { start, accessAllowed } = useStartDaily('Home');

  // The recently-logged list and its analytics now live on the Heart tab
  // (see RecentlyLoggedSection — it uses useIsFocused to gate the view event).

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <AppTopBar>
          <View style={styles.weekCalendar}>
            <WeekCalendarStrip
              todayLocalDate={todayLocalDate}
              completedDaysAgo={stats?.completedDaysAgo ?? []}
            />
          </View>
        </AppTopBar>

        <View style={styles.roomSection}>
          <HomeRoom />
        </View>

        <View style={styles.bodySection}>
          <RoomProgressCard />
          <TodaysDailiesSection
            technique={dailies.guidedTechnique}
            techniqueLoading={dailies.guidedTechniqueLoading}
            sessionTime={dailyPlanSchedule.actions.session}
            handPickedTechnique={dailies.handPickedTechnique}
            handPickedTechniqueLoading={dailies.handPickedTechniqueLoading}
            handPickedTime={dailyPlanSchedule.actions.handPicked}
            breathHoldTime={dailyPlanSchedule.actions.checkIn}
            guidedExerciseCompleted={dailies.guidedCompleted}
            handPickedExerciseCompleted={dailies.handPickedCompleted}
            breathHoldCompleted={dailies.breathHoldCompleted}
            exerciseAccessAllowed={accessAllowed}
            onPressGuidedExercise={() => start('guided')}
            onPressHandPickedExercise={() => start('handPicked')}
            onPressBreathHold={() => start('breathHold')}
          />
          <CompactActionBanner
            icon="message"
            label="Take a survey and get 50% off"
            onPress={() => void Linking.openURL(SURVEY_DISCOUNT_URL)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: spacing['7xl'] + spacing.xl,
    gap: margin.itemGap,
  },
  weekCalendar: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
  },
  roomSection: {
    marginVertical: spacing.lg,
  },
  bodySection: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
});
