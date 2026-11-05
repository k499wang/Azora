import type { Ref } from 'react';
import type { View } from 'react-native';
import HeaderStripStatCard, { EarnedCoinsCard, HeaderStripStatRow } from '../../../components/common/HeaderStripStatCard';
import { useReducedMotionSetting } from '../../../hooks/useReducedMotionSetting';
import { colors } from '../../../theme/colors';
import { rewardCardEnterAt } from '../../plan/rewardEntrance';

function showsMinutes(minutes: number | null): minutes is number {
  return minutes != null && minutes > 0;
}

/** When the coin card has arrived, for the flight that leaves from it. */
export function routineCoinCardEnterAt(minutes: number | null): number {
  return rewardCardEnterAt(showsMinutes(minutes) ? 2 : 1);
}

interface Props {
  done: number;
  total: number;
  minutes: number | null;
  /** what the coin card shows right now, counting up */
  coins: number;
  /** the total `coins` ends on */
  finalCoins: number;
  coinCardRef: Ref<View>;
}

/** The Done, Minutes and Coins cards every finished routine ends on. */
export default function RoutineResultCards({ done, total, minutes, coins, finalCoins, coinCardRef }: Props) {
  const reducedMotion = useReducedMotionSetting();
  const enterAt = (card: number) => (reducedMotion ? undefined : rewardCardEnterAt(card));
  return (
    <HeaderStripStatRow>
      <HeaderStripStatCard
        label="Done"
        value={`${done}/${total}`}
        tone="sky"
        icon={{ name: 'check', color: colors.playful.sky.mid }}
        enterAt={enterAt(0)}
        sparkleRing={done > 0}
      />
      {showsMinutes(minutes) ? (
        <HeaderStripStatCard
          label="Minutes"
          value={`${minutes}`}
          countTo={minutes}
          tone="sky"
          icon={{ name: 'clock', color: colors.playful.sky.mid }}
          enterAt={enterAt(1)}
        />
      ) : null}
      <EarnedCoinsCard
        ref={coinCardRef}
        coins={coins}
        finalCoins={finalCoins}
        enterAt={reducedMotion ? undefined : routineCoinCardEnterAt(minutes)}
      />
    </HeaderStripStatRow>
  );
}
