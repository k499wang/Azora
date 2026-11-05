import { useCallback, useRef, useState } from 'react';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useGrantCoinsMutation } from '../../queries/wallet/useGrantCoinsMutation';
import type { CoinReward } from './domain/cleanupPlan';

/** Pays each finished step of a run as it finishes, and adds up what really paid. Every run pays again. */
export function useRoutineRunCoins(userId: string | null) {
  const localDate = useTodayLocalDate();
  const { mutateAsync: grant } = useGrantCoinsMutation(userId);
  const [earned, setEarned] = useState(0);
  // A double tap, or the timer ending under a tap, must not pay one step twice.
  const claimed = useRef(new Set<string>());

  const earn = useCallback((reward: CoinReward) => {
    if (claimed.current.has(reward.reason)) return;
    claimed.current.add(reward.reason);
    grant({ amount: reward.coins, reason: reward.reason, localDate })
      .then((entry) => {
        setEarned((total) => total + entry.delta);
      })
      .catch(() => {
        claimed.current.delete(reward.reason);
      });
  }, [grant, localDate]);

  return { earned, earn };
}
