import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import type { MyRoutineScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import ScreenContent from '../components/common/ScreenContent';
import Skeleton from '../components/common/Skeleton';
import { Text } from '../components/common/Text';
import Icon from '../components/common/icons/Icon';
import GoalEditSheet from '../features/selfCare/GoalEditSheet';
import RoutineHistoryStrip from '../features/selfCare/RoutineHistoryStrip';
import RoutineTaskIcon from '../features/selfCare/RoutineTaskIcon';
import {
  groupSelfCareGoalsByDaypart,
  selfCareGoalScheduleLabel,
} from '../features/selfCare/domain/selfCareGoal';
import { selfCareGoalHistory } from '../features/selfCare/domain/selfCareGoalHistory';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { triggerTapHaptic } from '../native/tapHaptics';
import { useActiveSelfCareGoalsQuery } from '../queries/selfCare/useActiveSelfCareGoalsQuery';
import { useSelfCareCompletionHistoryQuery } from '../queries/selfCare/useSelfCareCompletionHistoryQuery';
import { useArchiveSelfCareGoalMutation } from '../queries/selfCare/useArchiveSelfCareGoalMutation';
import { useUpdateSelfCareGoalMutation } from '../queries/selfCare/useUpdateSelfCareGoalMutation';
import { useAuthStore } from '../stores/authStore';
import { card, radius } from '../theme/card';
import { colors } from '../theme/colors';
import { pressable } from '../theme/pressable';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const ROW_MIN_HEIGHT = 82;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

/** Every habit on the routine, including the ones today is not one of the days for. */
export default function MyRoutineScreen(_: MyRoutineScreenProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const goalsQuery = useActiveSelfCareGoalsQuery(userId, todayLocalDate);
  const updateGoal = useUpdateSelfCareGoalMutation(userId, todayLocalDate);
  const historyQuery = useSelfCareCompletionHistoryQuery(userId, todayLocalDate);
  const archiveGoal = useArchiveSelfCareGoalMutation(userId, todayLocalDate);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);

  const goals = goalsQuery.data;
  const sections = useMemo(
    () =>
      groupSelfCareGoalsByDaypart(goals ?? []).map((group) => ({
        key: group.id,
        title: group.label,
        data: group.goals,
      })),
    [goals],
  );
  const history = historyQuery.data;
  const editGoal = goals?.find((goal) => goal.id === editGoalId) ?? null;

  const closeEdit = () => {
    setEditGoalId(null);
    updateGoal.reset();
    archiveGoal.reset();
  };

  const status = goalsQuery.isPending ? (
    <View accessibilityLabel="Loading your routine" style={styles.loading}>
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} height={ROW_MIN_HEIGHT} radius={radius.xl} />
      ))}
    </View>
  ) : goalsQuery.isError ? (
    <Text accessibilityRole="alert" style={styles.status}>
      {errorMessage(goalsQuery.error)}
    </Text>
  ) : sections.length === 0 ? (
    <Text style={styles.status}>No habits yet</Text>
  ) : null;

  return (
    <View style={styles.screen}>
      <AppTopBar
        title="My routine"
        showBack
        showAvatar={false}
        showStreak={false}
      />
      <SectionList
        sections={sections}
        stickySectionHeadersEnabled={false}
        keyExtractor={(goal) => goal.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          status == null ? null : (
            <ScreenContent width="grouped">{status}</ScreenContent>
          )
        }
        renderSectionHeader={({ section }) => (
          <ScreenContent width="grouped">
            <View style={styles.sectionHeader}>
              <SectionHeader title={section.title} />
            </View>
          </ScreenContent>
        )}
        renderItem={({ item }) => (
          <ScreenContent width="grouped">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${selfCareGoalScheduleLabel(item)}`}
              accessibilityHint="Opens this habit to edit"
              onPress={() => {
                triggerTapHaptic();
                setEditGoalId(item.id);
              }}
              style={({ pressed }) => [
                card.base,
                card.outlined,
                styles.row,
                pressed && pressable.surface,
              ]}
            >
              <View style={styles.rowTop}>
                <RoutineTaskIcon name={item.icon} />
                <View style={styles.copy}>
                  <Text numberOfLines={2} style={styles.rowTitle}>{item.title}</Text>
                  <Text numberOfLines={1} style={styles.rowDetail}>
                    {selfCareGoalScheduleLabel(item)}
                  </Text>
                </View>
                <Icon bold name="chevron-right" size={20} color={colors.text.tertiary} />
              </View>
              <RoutineHistoryStrip
                days={
                  history == null
                    ? null
                    : selfCareGoalHistory(item, history[item.id] ?? [], todayLocalDate)
                }
              />
            </Pressable>
          </ScreenContent>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <GoalEditSheet
        goal={editGoal}
        pending={updateGoal.isPending}
        error={updateGoal.error ?? archiveGoal.error}
        onClose={closeEdit}
        onSave={(edit) => {
          if (editGoal == null) return;
          updateGoal.mutate(
            { goalId: editGoal.id, previousRecurrence: editGoal.recurrence, ...edit },
            { onSuccess: () => setEditGoalId(null) },
          );
        }}
        removing={archiveGoal.isPending}
        onRemove={() => {
          if (editGoal == null) return;
          archiveGoal.mutate(editGoal.id, {
            onSuccess: () => setEditGoalId(null),
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingTop: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing['7xl'],
  },
  loading: {
    gap: spacing.sm,
  },
  status: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
  row: {
    minHeight: ROW_MIN_HEIGHT,
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  rowDetail: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
    color: colors.text.tertiary,
  },
  sectionHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
});
