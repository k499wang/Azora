import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useSelfCareGoalsQuery } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { useCreateSelfCareGoalMutation } from '../../queries/selfCare/useCreateSelfCareGoalMutation';
import { useToggleSelfCareGoalMutation } from '../../queries/selfCare/useToggleSelfCareGoalMutation';
import { useArchiveSelfCareGoalMutation } from '../../queries/selfCare/useArchiveSelfCareGoalMutation';
import {
  MAX_SELF_CARE_GOALS,
  MAX_SELF_CARE_GOAL_TITLE_LENGTH,
  normalizeSelfCareGoalTitle,
  type SelfCareGoal,
} from './domain/selfCareGoal';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  TODAY_JOURNEY_COLUMN_WIDTH,
  TODAY_JOURNEY_MARKER_ICON_SIZE,
  TODAY_JOURNEY_MARKER_SIZE,
  TODAY_JOURNEY_RAIL_WIDTH,
} from '../../components/home/todayJourneyLayout';

const GOAL_ROW_HEIGHT = 60;
const ADD_ROW_HEIGHT = 56;
const JOURNEY_ROW_GAP = spacing.sm;
const JOURNEY_CONNECTOR_OVERHANG = spacing.md;
const RAIL_BOTTOM_AT_GOAL =
  GOAL_ROW_HEIGHT / 2 + TODAY_JOURNEY_MARKER_SIZE / 2;
const RAIL_BOTTOM_AT_ADD =
  ADD_ROW_HEIGHT / 2 + TODAY_JOURNEY_MARKER_SIZE / 2;

interface TodoListSectionProps {
  userId: string | null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

export default function TodoListSection({ userId }: TodoListSectionProps) {
  const localDate = useTodayLocalDate();
  const goalsQuery = useSelfCareGoalsQuery(userId, localDate);
  const createGoal = useCreateSelfCareGoalMutation(userId, localDate);
  const toggleGoal = useToggleSelfCareGoalMutation(userId, localDate);
  const archiveGoal = useArchiveSelfCareGoalMutation(userId, localDate);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  if (userId == null) return null;

  const goals = goalsQuery.data ?? [];
  const normalizedTitle = normalizeSelfCareGoalTitle(title);
  const atLimit = goals.length >= MAX_SELF_CARE_GOALS;
  const mutationError = createGoal.error ?? toggleGoal.error ?? archiveGoal.error;
  const addNodeVisible = goalsQuery.isSuccess && !adding && !atLimit;
  const journeyNodeCount = goals.length + (addNodeVisible ? 1 : 0);

  const save = () => {
    if (normalizedTitle == null || createGoal.isPending || atLimit) return;
    createGoal.mutate(normalizedTitle, {
      onSuccess: () => {
        setTitle('');
        setAdding(false);
      },
    });
  };

  const confirmRemove = (goal: SelfCareGoal) => {
    Alert.alert('Remove this to-do?', goal.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => archiveGoal.mutate(goal.id),
      },
    ]);
  };

  return (
    <View style={styles.section}>
      {goalsQuery.isPending ? (
        <View style={styles.statusRow}>
          <ActivityIndicator color={colors.primary.blue600} />
          <Text style={styles.statusText}>Loading your list…</Text>
        </View>
      ) : goalsQuery.isError ? (
        <View style={[card.base, styles.statusCard]}>
          <Text style={styles.statusText}>Couldn’t load your list.</Text>
          <Pressable accessibilityRole="button" onPress={() => goalsQuery.refetch()}>
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : goalsQuery.isSuccess && journeyNodeCount > 0 ? (
        <View style={styles.journey}>
          <View
            pointerEvents="none"
            style={[
              styles.journeyRail,
              {
                top: -JOURNEY_CONNECTOR_OVERHANG,
                bottom: addNodeVisible
                  ? RAIL_BOTTOM_AT_ADD
                  : RAIL_BOTTOM_AT_GOAL,
              },
            ]}
          >
            {Array.from(
              { length: Math.max(3, journeyNodeCount * 4) },
              (_, dash) => (
                <View key={dash} style={styles.journeyRailDash} />
              ),
            )}
          </View>
          {goals.map((goal) => (
            <View key={goal.id} style={styles.journeyRow}>
              <View style={styles.timelineColumn} pointerEvents="none">
                <View
                  style={[
                    styles.statusMarker,
                    goal.completedToday
                      ? styles.statusMarkerCompleted
                      : styles.statusMarkerIdle,
                  ]}
                >
                  {goal.completedToday ? (
                    <Icon
                      name="check"
                      size={TODAY_JOURNEY_MARKER_ICON_SIZE}
                      color={colors.text.inverse}
                    />
                  ) : null}
                </View>
              </View>
              <View style={[card.base, styles.goalCard]}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: goal.completedToday }}
                  accessibilityLabel={`${goal.title}, ${goal.completedToday ? 'completed' : 'not completed'}`}
                  disabled={
                    toggleGoal.isPending &&
                    toggleGoal.variables?.goalId === goal.id
                  }
                  onPress={() =>
                    toggleGoal.mutate({
                      goalId: goal.id,
                      completed: !goal.completedToday,
                    })
                  }
                  style={({ pressed }) => [
                    styles.goalButton,
                    pressed && pressable.subtle,
                  ]}
                >
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.goalTitle,
                      goal.completedToday && styles.goalTitleDone,
                    ]}
                  >
                    {goal.title}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${goal.title}`}
                  onPress={() => confirmRemove(goal)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && pressable.control,
                  ]}
                >
                  <Icon name="close" size={17} color={colors.text.tertiary} />
                </Pressable>
              </View>
            </View>
          ))}
          {addNodeVisible ? (
            <View style={[styles.journeyRow, styles.addRow]}>
              <View style={styles.timelineColumn} pointerEvents="none">
                <View style={[styles.statusMarker, styles.statusMarkerIdle]} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a to-do"
                onPress={() => setAdding(true)}
                style={({ pressed }) => [
                  styles.addScrim,
                  pressed && pressable.surface,
                ]}
              >
                <Icon name="plus" size={22} color={colors.neutral[500]} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {adding ? (
        <View style={[card.base, card.shadow, styles.composer]}>
          <TextInput
            autoFocus
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={save}
            maxLength={MAX_SELF_CARE_GOAL_TITLE_LENGTH}
            placeholder="Add a small self-care task"
            placeholderTextColor={colors.text.tertiary}
            returnKeyType="done"
            editable={!createGoal.isPending}
            style={styles.input}
            accessibilityLabel="To-do title"
          />
          <View style={styles.composerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setAdding(false);
                setTitle('');
                createGoal.reset();
              }}
              style={({ pressed }) => [styles.cancelButton, pressed && pressable.subtle]}
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={normalizedTitle == null || createGoal.isPending || atLimit}
              onPress={save}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && pressable.control,
                (normalizedTitle == null || createGoal.isPending || atLimit) &&
                  styles.disabled,
              ]}
            >
              {createGoal.isPending ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Text style={styles.saveLabel}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      {atLimit ? (
        <Text style={styles.limitText}>Remove a to-do before adding another.</Text>
      ) : null}
      {mutationError != null ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {errorMessage(mutationError)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  journey: {
    position: 'relative',
    gap: JOURNEY_ROW_GAP,
  },
  journeyRail: {
    position: 'absolute',
    left:
      TODAY_JOURNEY_COLUMN_WIDTH / 2 - TODAY_JOURNEY_RAIL_WIDTH / 2,
    width: TODAY_JOURNEY_RAIL_WIDTH,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journeyRailDash: {
    width: TODAY_JOURNEY_RAIL_WIDTH,
    height: 8,
    borderRadius: TODAY_JOURNEY_RAIL_WIDTH / 2,
    backgroundColor: colors.border.default,
  },
  journeyRow: {
    height: GOAL_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  addRow: {
    height: ADD_ROW_HEIGHT,
  },
  timelineColumn: {
    width: TODAY_JOURNEY_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  statusMarker: {
    width: TODAY_JOURNEY_MARKER_SIZE,
    height: TODAY_JOURNEY_MARKER_SIZE,
    borderRadius: TODAY_JOURNEY_MARKER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusMarkerIdle: {
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  statusMarkerCompleted: {
    backgroundColor: colors.success[500],
  },
  addScrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.medium,
    backgroundColor: colors.glass.lockedScrim,
  },
  composer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.background.cardSoft,
    color: colors.text.primary,
    ...typography.body.medium,
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  cancelLabel: {
    ...typography.button.medium,
    color: colors.text.secondary,
  },
  saveButton: {
    minWidth: 76,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.primary.blue600,
  },
  saveLabel: {
    ...typography.button.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  disabled: {
    opacity: 0.5,
  },
  statusRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  statusText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  retryLabel: {
    ...typography.button.medium,
    color: colors.text.brand,
  },
  goalCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    borderRadius: radius.medium,
  },
  goalButton: {
    height: GOAL_ROW_HEIGHT,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  goalTitle: {
    flex: 1,
    ...typography.body.medium,
    color: colors.text.primary,
  },
  goalTitleDone: {
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  limitText: {
    ...typography.body.xsmall,
    color: colors.text.tertiary,
  },
  errorText: {
    ...typography.body.xsmall,
    color: colors.error[700],
  },
});
