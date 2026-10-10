import { useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { RootStackNavigationProp } from '../../app/navigation';
import { todoStepState, type TodoStepState } from '../program/domain/programTodoStep';
import { takeForcedDayComplete } from '../room/devDayCompleteOverride';
import type { RoomClaim } from '../room/useRoomClaim';
import type { SelfCareGoal } from '../selfCare/domain/selfCareGoal';
import { isLastUnfinishedDayUnit } from '../../hooks/dayUnits/dayUnit';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import type { TodayProgramDayState } from '../../hooks/useTodayProgramDay';
import { hasPieceToEarn } from '../../lib/room/roomProgress';
import { useClaimPlanTodoStepMutation } from '../../queries/program/useClaimPlanTodoStepMutation';
import { getSelfCareGoalsQueryOptions } from '../../queries/selfCare/useSelfCareGoalsQuery';

/** Only what the step reads, so a renamed or re-timed to-do re-renders nothing. */
const selectTicks = (goals: SelfCareGoal[]) =>
  goals.map(({ completedToday }) => ({ completedToday }));

export interface TodoStepAction {
  /** Null on a day that does not ask for the step. */
  state: TodoStepState | null;
  /** Today's to-dos are still loading, so `add`, `open` and `claimable` are unknown. */
  isLoading: boolean;
  run: () => void;
}

/**
 * The plan's "Do a to-do" step, for Home's row and the plan's start button.
 *
 * Until a to-do is ticked it opens Routine, where to-dos are ticked. Once one
 * is, it claims the step and shows the coins, celebrating the day over Home
 * when the claim was the last thing it asked for.
 */
export function useTodoStepAction(
  userId: string | null,
  program: TodayProgramDayState,
  roomClaim: Pick<RoomClaim, 'progress' | 'dailies'>,
): TodoStepAction {
  const navigation = useNavigation<RootStackNavigationProp>();
  const todayLocalDate = useTodayLocalDate();
  const todoStep = program.day?.todoStep ?? null;
  const required = todoStep?.required === true;
  const goalsQuery = useQuery({
    ...getSelfCareGoalsQueryOptions(userId as string, todayLocalDate),
    enabled: userId != null && required,
    select: selectTicks,
  });
  const claim = useClaimPlanTodoStepMutation(userId);
  const claiming = useRef(false);

  const state =
    todoStep == null
      ? null
      : todoStepState({
          required: todoStep.required,
          claimed: todoStep.claimed,
          goals: goalsQuery.data ?? [],
        });
  // A failed to-dos read falls back to `open` rather than holding the row, and
  // with it Insights' next step, on a skeleton.
  const isLoading = claim.isPending ||
    program.isLoading || (required && goalsQuery.data == null && !goalsQuery.isError);

  const run = () => {
    if (isLoading || state == null || state === 'claimed') return;
    if (state === 'add' || state === 'open') {
      navigation.navigate('MainTabs', { screen: 'Plan' }, { pop: true });
      return;
    }
    if (claiming.current) return;
    claiming.current = true;

    const units = roomClaim.dailies.units;
    const unit = units.find((candidate) => candidate.kind === 'todo');
    const dayCompleteUnitId =
      unit != null &&
      ((isLastUnfinishedDayUnit(units, unit.id) && hasPieceToEarn(roomClaim.progress)) ||
        takeForcedDayComplete())
        ? unit.id
        : undefined;
    claim.mutate(
      {
        localDate: todayLocalDate,
      },
      {
        onSuccess: (response) => {
          if (response.outcome !== 'recorded') {
            Alert.alert('Could not claim this step', 'Check your to-do and try again.');
            return;
          }
          navigation.navigate('ActivityReward', {
            kind: 'todo',
            coins: response.coinsAwarded,
            dayCompleteUnitId,
          });
        },
        onError: () => {
          Alert.alert('Could not claim this step', 'Please try again.');
        },
        onSettled: () => { claiming.current = false; },
      },
    );
  };

  return { state, isLoading, run };
}
