import { StyleSheet, useWindowDimensions, View } from 'react-native';
import CoinFlightLayer from '../../components/common/CoinFlightLayer';
import EarnedCoinBalance from '../../components/common/EarnedCoinBalance';
import { EarnedCoinsCard, HeaderStripStatRow } from '../../components/common/HeaderStripStatCard';
import { useCoinRewardFlight } from '../../hooks/useCoinRewardFlight';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { useReducedMotionSetting } from '../../hooks/useReducedMotionSetting';
import { grantCoinsOncePerDayMutationKey } from '../../queries/wallet/useGrantCoinsOncePerDayMutation';
import { useWalletSettledAfterWrites } from '../../queries/wallet/useWalletSettledAfterWrites';
import { padding } from '../../theme/spacing';
import ActivityCompletionContent from '../plan/ActivityCompletionContent';
import { rewardCardEnterAt } from '../plan/rewardEntrance';
import { cleanupCompletionCopy } from './domain/cleanupCompletionCopy';

const COIN_CARD_ENTERS_AT = rewardCardEnterAt(0);

interface Props {
  userId: string | null;
  completedCount: number;
  /** wall-clock minutes from Start to the last item, or null when not timed */
  elapsedMinutes: number | null;
  /** what the run's finished steps paid; 0 when they had already paid today */
  earned: number;
  active: boolean;
}

export default function RoutineRunCompletion({ userId, completedCount, elapsedMinutes, earned, active }: Props) {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotionSetting();
  useCompletionSound('activity', { autoPlay: completedCount > 0, active });
  const copy = cleanupCompletionCopy(completedCount, elapsedMinutes, 'routine');
  const balanceSettled = useWalletSettledAfterWrites(userId, grantCoinsOncePerDayMutationKey(userId));
  const coins = balanceSettled ? earned : 0;
  const flight = useCoinRewardFlight({ coins, landedAfterMs: COIN_CARD_ENTERS_AT });

  return (
    <View style={styles.root}>
      <ActivityCompletionContent title={copy.title} subtitle={copy.subtitle} pose="calm">
        {coins === 0 ? null : (
          <View style={{ width: width - padding.screen.horizontal * 2 }}>
            <HeaderStripStatRow>
              <EarnedCoinsCard
                ref={flight.sourceRef}
                coins={flight.cardCoins}
                finalCoins={coins}
                enterAt={reducedMotion ? undefined : COIN_CARD_ENTERS_AT}
              />
            </HeaderStripStatRow>
          </View>
        )}
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
