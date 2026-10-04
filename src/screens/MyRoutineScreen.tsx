import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { MyRoutineScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import ScreenContent from '../components/common/ScreenContent';
import Skeleton from '../components/common/Skeleton';
import { Text } from '../components/common/Text';
import Icon from '../components/common/icons/Icon';
import GoalEditSheet from '../features/selfCare/GoalEditSheet';
import RoutineTaskIcon from '../features/selfCare/RoutineTaskIcon';
import {
  selfCareGoalScheduleLabel,
  sortSelfCareGoalsByCreated,
} from '../features/selfCare/domain/selfCareGoal';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { triggerTapHaptic } from '../native/tapHaptics';
import { useActiveSelfCareGoalsQuery } from '../queries/selfCare/useActiveSelfCareGoalsQuery';
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
  const archiveGoal = useArchiveSelfCareGoalMutation(userId, todayLocalDate);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);

  const goals = goalsQuery.data;
  const sortedGoals = useMemo(() => sortSelfCareGoalsByCreated(goals ?? []), [goals]);
  const editGoal = goals?.find((goal) => goal.id === editGoalId) ?? null;

  const closeEdit = () => {
    setEditGoalId(null);
    updateGoal.reset();
    archiveGoal.reset();
  };

  const status = goalsQuery.isPending ? (
    <View accessibilityLabel="Loading your routine" style={styles.loading}>
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} height={ROW_MIN_HEIGHT} radius={radius.card} />
      ))}
    </View>
  ) : goalsQuery.isError ? (
    <Text accessibilityRole="alert" style={styles.status}>
      {errorMessage(goalsQuery.error)}
    </Text>
  ) : sortedGoals.length === 0 ? (
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
      <FlatList
        data={sortedGoals}
        keyExtractor={(goal) => goal.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          status == null ? null : (
            <ScreenContent width="grouped">{status}</ScreenContent>
          )
        }
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
                card.shadow,
                styles.row,
                pressed && pressable.surface,
              ]}
            >
              <RoutineTaskIcon name={item.icon} />
              <View style={styles.copy}>
                <Text numberOfLines={2} style={styles.rowTitle}>{item.title}</Text>
                <Text numberOfLines={1} style={styles.rowDetail}>
                  {selfCareGoalScheduleLabel(item)}
                </Text>
              </View>
              <Icon bold name="chevron-right" size={20} color={colors.text.tertiary} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
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
  separator: {
    height: spacing.sm,
  },
});
