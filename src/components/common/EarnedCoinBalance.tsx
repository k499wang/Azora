import { useWalletQuery } from '../../queries/wallet/useWalletQuery';
import { COIN_FLIGHT_MS } from './CoinFlightLayer';
import TopBarCoins from './TopBarCoins';

interface Props {
  userId: string | null;
  coins: number;
  /** the flight has left the card, so the pill may count the reward in */
  earnedShown: boolean;
}

/**
 * The balance, already credited by the write that earned it, shown without the
 * reward until the coins are on their way.
 */
export default function EarnedCoinBalance({ userId, coins, earnedShown }: Props) {
  const balance = useWalletQuery(userId).data;
  return (
    <TopBarCoins
      coins={balance == null ? undefined : earnedShown ? balance : balance - coins}
      countUpDelayMs={COIN_FLIGHT_MS}
      size="compact"
    />
  );
}
