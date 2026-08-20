import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import ExtraPracticeSection from '../components/home/ExtraPracticeSection';
import TodaysDailiesSection from '../components/home/TodaysDailiesSection';
import HomeRoom from '../features/room/HomeRoom';
import RoomProgressCard from '../features/room/RoomProgressCard';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { useStartDaily } from '../hooks/useStartDaily';
import type { HomeScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../services/dailyPlan/types';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const user = useAuthStore((state) => state.user);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(user?.id ?? null);
  const dailyPlanSchedule =
    dailyPlanScheduleQuery.data ?? DEFAULT_DAILY_PLAN_SCHEDULE;
  const roomClaim = useRoomClaim(user?.id ?? null);
  const dailies = roomClaim.dailies;
  const { start, accessAllowed, exerciseAccess } = useStartDaily('Home', dailies);

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
        <AppTopBar showNotifications showAvatar={false} />

        <HomeRoom room={roomClaim.room} progress={roomClaim.progress} />

        <View style={styles.bodySection}>
          <RoomProgressCard
            progress={roomClaim.progress}
            dailies={dailies}
            isLoading={roomClaim.isLoading}
          />
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
            onPressHistory={() => navigation.navigate('History')}
          />
          <ExtraPracticeSection
            recommendedTechniqueId={dailies.guidedTechnique?.id ?? null}
            excludedTechniqueIds={[
              dailies.guidedTechnique?.id,
              dailies.handPickedTechnique?.id,
            ]}
            exerciseAccess={exerciseAccess}
            onSeeAll={() => navigation.navigate('Explore')}
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
  bodySection: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
});
