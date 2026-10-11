import { useState } from 'react';
import type { RootStackParamList } from '../../app/navigation';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { EARN_RATES } from '../../lib/wallet/coins';
import type { ClaimPlanTodoStepResponse } from '../../services/program/planTodoStepService';
import type { useTodoClaimReward } from './useTodoClaimReward';

type PreviewMode = Extract<RootStackParamList['ActivityReward'], { previewClaim: unknown }>['previewClaim'];

/** Exercises the real claim presentation without writing a claim or wallet balance. */
export function useTodoClaimRewardPreview(mode: PreviewMode): ReturnType<typeof useTodoClaimReward> {
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState<ClaimPlanTodoStepResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useWhileVisible(() => {
    if (!__DEV__ || response != null || failed) return () => {};
    const delay = mode === 'slow' ? 2500 : mode === 'retry' && attempt === 0 ? 700 : 100;
    return startUiTimer(delay, () => {
      if (mode === 'retry' && attempt === 0) {
        setFailed(true);
        return;
      }
      setResponse({
        outcome: 'recorded',
        coinsAwarded: EARN_RATES.todoStep,
        enrollmentId: null,
        programDay: null,
        activityId: null,
      });
    });
  }, [attempt, failed, mode, response]);

  const canRetry = __DEV__ && failed && response == null;
  const retry = async () => {
    if (!canRetry) return;
    setFailed(false);
    setAttempt((current) => current + 1);
  };

  return {
    response: __DEV__ ? response : null,
    failed: __DEV__ && failed,
    canRetry,
    retry,
    getDayCompleteUnitId: () => undefined,
  };
}
