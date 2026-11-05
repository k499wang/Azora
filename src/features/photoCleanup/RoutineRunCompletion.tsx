import { StyleSheet, useWindowDimensions, View } from 'react-native';
import CoinFlightLayer from '../../components/common/CoinFlightLayer';
import EarnedCoinBalance from '../../components/common/EarnedCoinBalance';
import { useCoinRewardFlight } from '../../hooks/useCoinRewardFlight';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { grantCoinsMutationKey } from '../../queries/wallet/useGrantCoinsMutation';
import { useWalletSettledAfterWrites } from '../../queries/wallet/useWalletSettledAfterWrites';
import { padding } from '../../theme/spacing';
import ActivityCompletionContent from '../plan/ActivityCompletionContent';
import RoutineResultCards, { routineCoinCardEnterAt } from '../selfCare/shared/RoutineResultCards';
import { cleanupCompletionCopy } from './domain/cleanupCompletionCopy';

interface Props {
  userId: string | null;
  completedCount: number;
  totalCount: number;
  /** wall-clock minutes from Start to the last item, or null when not timed */
  elapsedMinutes: number | null;
  /** what the run's finished steps paid */
  earned: number;
  active: boolean;
}

export default function RoutineRunCompletion({ userId, completedCount, totalCount, elapsedMinutes, earned, active }: Props) {
  const { width } = useWindowDimensions();
  useCompletionSound('activity', { autoPlay: completedCount > 0, active });
  const copy = cleanupCompletionCopy(completedCount, null, 'routine');
  const balanceSettled = useWalletSettledAfterWrites(userId, grantCoinsMutationKey(userId));
  const coins = balanceSettled ? earned : 0;
  const flight = useCoinRewardFlight({ coins, landedAfterMs: routineCoinCardEnterAt(elapsedMinutes) });

  return (
    <View style={styles.root}>
      <ActivityCompletionContent title={copy.title} subtitle={copy.subtitle} pose="calm">
        <View style={{ width: width - padding.screen.horizontal * 2 }}>
          <RoutineResultCards
            done={completedCount}
            total={totalCount}
            minutes={elapsedMinutes}
            coins={flight.cardCoins}
            finalCoins={earned}
            coinCardRef={flight.sourceRef}
          />
        </View>
      </ActivityCompletionContent>
      <View ref={flight.balanceRef} collapsable={false} style={styles.balance}>
        {coins === 0 ? null : <EarnedCoinBalance userId={userId} coins={coins} earnedShown={flight.earnedShown} />}
      </View>
      <CoinFlightLayer ref={flight.flightRef} targetRef={flight.balanceRef} onReady={flight.onFlightReady} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  balance: { position: 'absolute', top: 0, right: 0 },
});
