import { useCallback, useRef, useState } from 'react';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useGrantCoinsOncePerDayMutation } from '../../queries/wallet/useGrantCoinsOncePerDayMutation';
import type { CoinReward } from './domain/cleanupPlan';

/** Pays each finished step of a routine run as it finishes, and adds up what really paid. */
export function useRoutineRunCoins(userId: string | null) {
  const localDate = useTodayLocalDate();
  const { mutateAsync: grant } = useGrantCoinsOncePerDayMutation(userId);
  const [earned, setEarned] = useState(0);
  // A double tap or the timer ending under a tap must not read the ledger twice before either write lands.
  const claimed = useRef(new Set<string>());

  const earn = useCallback((reward: CoinReward) => {
    if (claimed.current.has(reward.reason)) return;
    claimed.current.add(reward.reason);
    grant({ amount: reward.coins, reason: reward.reason, localDate })
      .then((entry) => {
        if (entry != null) setEarned((total) => total + entry.delta);
      })
      .catch(() => {
        claimed.current.delete(reward.reason);
      });
  }, [grant, localDate]);

  return { earned, earn };
}
