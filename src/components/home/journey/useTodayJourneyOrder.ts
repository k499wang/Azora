import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SelfCareGoal, SelfCareGoalPlaces } from '../../../features/selfCare/domain/selfCareGoal';
import type { DailyPlanSchedule } from '../../../services/dailyPlan/types';
import { dailyPlanOrderNow, loadDailyPlanOrder } from '../../../services/preferences/dailyPlanOrder';
import { loadSelfCareGoalPlaces, selfCareGoalPlacesNow } from '../../../services/preferences/selfCareGoalOrder';
import {
  loadTodayJourneyOrder,
  saveTodayJourneyOrder,
  todayJourneyOrderNow,
} from '../../../services/preferences/todayJourneyOrder';
import {
  defaultTodayJourneyOrder,
  mergeVisibleTodayJourneyOrder,
  reconcileTodayJourneyOrder,
  removeTodayJourneyItem,
  todoJourneyId,
  type TodayJourneyId,
} from './todayJourneyOrder';

interface UseTodayJourneyOrderInput {
  userId: string | null;
  actions: DailyPlanSchedule['actions'] | null;
  goals: SelfCareGoal[] | undefined;
}

export interface TodayJourneyLoadInput {
  scheduleAvailable: boolean;
  scheduleError: boolean;
  goalsAvailable: boolean;
  goalsError: boolean;
  orderReady: boolean;
}

export type TodayJourneyLoadState = 'loading' | 'error' | 'ready';

/** A refresh failure is non-fatal while canonical data remains available. */
export function todayJourneyLoadState({
  scheduleAvailable,
  scheduleError,
  goalsAvailable,
  goalsError,
  orderReady,
}: TodayJourneyLoadInput): TodayJourneyLoadState {
  if (
    (!scheduleAvailable && scheduleError) ||
    (!goalsAvailable && goalsError)
  ) return 'error';
  return scheduleAvailable && goalsAvailable && orderReady ? 'ready' : 'loading';
}

function sameOrder(
  left: readonly TodayJourneyId[] | null,
  right: readonly TodayJourneyId[],
): boolean {
  return left != null &&
    left.length === right.length &&
    left.every((id, index) => id === right[index]);
}

/** Owns loading, reconciling, and persisting the unified Today order. */
export function useTodayJourneyOrder({
  userId,
  actions,
  goals,
}: UseTodayJourneyOrderInput) {
  const [places, setPlaces] = useState<SelfCareGoalPlaces>(selfCareGoalPlacesNow);
  const [storedOrder, setStoredOrder] = useState<TodayJourneyId[] | null>(
    () => todayJourneyOrderNow(userId),
  );
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (userId == null) return;
    let active = true;
    setStoredOrder(todayJourneyOrderNow(userId));
    setLoadedUserId(null);
    void Promise.all([
      loadSelfCareGoalPlaces(),
      loadDailyPlanOrder(),
      loadTodayJourneyOrder(userId),
    ]).then(([storedPlaces, _dailyOrder, journeyOrder]) => {
      if (!active) return;
      setPlaces(storedPlaces);
      setStoredOrder(journeyOrder);
      setLoadedUserId(userId);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const defaults = useMemo(
    () => actions == null || goals == null
      ? []
      : defaultTodayJourneyOrder(actions, goals),
    [actions, goals],
  );
  const ready =
    userId != null &&
    actions != null &&
    goals != null &&
    loadedUserId === userId;
  const fullOrder = ready
    ? reconcileTodayJourneyOrder(
        storedOrder,
        defaults,
        dailyPlanOrderNow(),
        places,
      )
    : [];
  const fullOrderRef = useRef(fullOrder);
  fullOrderRef.current = fullOrder;

  useEffect(() => {
    if (!ready || userId == null || sameOrder(storedOrder, fullOrder)) return;
    setStoredOrder(fullOrder);
    void saveTodayJourneyOrder(userId, fullOrder);
  }, [fullOrder, ready, storedOrder, userId]);

  const commitVisibleOrder = useCallback((orderedIds: TodayJourneyId[]) => {
    const next = mergeVisibleTodayJourneyOrder(fullOrderRef.current, orderedIds);
    if (next == null || userId == null) return false;
    setStoredOrder(next);
    void saveTodayJourneyOrder(userId, next);
    return true;
  }, [userId]);

  const removeGoalFromOrder = useCallback((goalId: string) => {
    if (userId == null) return;
    const next = removeTodayJourneyItem(fullOrderRef.current, todoJourneyId(goalId));
    fullOrderRef.current = next;
    setStoredOrder(next);
    void saveTodayJourneyOrder(userId, next);
  }, [userId]);

  return {
    places,
    fullOrder,
    ready,
    commitVisibleOrder,
    removeGoalFromOrder,
  };
}
