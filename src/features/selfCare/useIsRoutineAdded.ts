import { useCallback } from 'react';
import type { RoutineTemplate } from '../../data/routineLibrary';
import { isRoutineAdded } from '../../data/routineShelves';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useActiveSelfCareGoalsQuery } from '../../queries/selfCare/useActiveSelfCareGoalsQuery';
import { useAuthStore } from '../../stores/authStore';

/** Answers from every active to-do, so a weekly routine still shows as added on its off days. */
export function useIsRoutineAdded() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const goals = useActiveSelfCareGoalsQuery(userId, todayLocalDate).data;
  return useCallback(
    (routine: RoutineTemplate) => goals != null && isRoutineAdded(routine, goals),
    [goals],
  );
}
