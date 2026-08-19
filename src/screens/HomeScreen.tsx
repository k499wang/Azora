import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import CompactActionBanner from '../components/common/CompactActionBanner';
import GlassIconButton from '../components/common/GlassIconButton';
import Icon from '../components/common/icons/Icon';
import TodaysDailiesSection from '../components/home/TodaysDailiesSection';
import HomeRoom from '../features/room/HomeRoom';
import RoomProgressCard from '../features/room/RoomProgressCard';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { useStartDaily } from '../hooks/useStartDaily';
import type { HomeScreenProps } from '../app/navigation';
import { useAuthStore } from '../stores/authStore';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../services/dailyPlan/types';

const SURVEY_DISCOUNT_URL = 'https://docs.google.com/forms/d/1wdbzWnXbhdpFZ3HoPcRet5K7EGW9RRtEQqrVYiXHwtc/viewform?edit_requested=true';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const user = useAuthStore((state) => state.user);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(user?.id ?? null);
  const dailyPlanSchedule =
    dailyPlanScheduleQuery.data ?? DEFAULT_DAILY_PLAN_SCHEDULE;
  const roomClaim = useRoomClaim(user?.id ?? null);
  const dailies = roomClaim.dailies;
  const { start, accessAllowed } = useStartDaily('Home', dailies);

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
        <AppTopBar
          showNotifications
          rightSlot={
            <GlassIconButton
              accessibilityLabel="Open your history"
              onPress={() => navigation.navigate('History')}
            >
              <Icon
                name="calendar"
                size={20}
                color={colors.text.secondary}
              />
            </GlassIconButton>
          }
        />

        <View style={styles.roomSection}>
          <HomeRoom room={roomClaim.room} progress={roomClaim.progress} />
        </View>

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
  roomSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  bodySection: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
});
