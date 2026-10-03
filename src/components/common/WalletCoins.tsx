import TopBarCoins from './TopBarCoins';
import type { StatChipSize, StatChipSurface } from './StatChip';
import { useWalletQuery } from '../../queries/wallet/useWalletQuery';

interface WalletCoinsProps {
  userId: string | null;
  countUpDelayMs?: number;
  size?: StatChipSize;
  surface?: StatChipSurface;
}

/**
 * The balance, read here rather than by the screen: it moves on every tick,
 * and re-rendering the whole header with it landed on the tick's busiest frames.
 */
export default function WalletCoins({ userId, ...pill }: WalletCoinsProps) {
  const coins = useWalletQuery(userId).data;
  return <TopBarCoins coins={coins} {...pill} />;
}
