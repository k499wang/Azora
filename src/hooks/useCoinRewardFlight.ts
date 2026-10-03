import { useCallback, useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import type { CoinFlightHandle } from '../components/common/CoinFlightLayer';
import { startUiTimer } from '../lib/ui/uiThreadTimer';

interface Options {
  /** what was earned; nothing flies while this is zero */
  coins: number;
  /** when the card the coins leave from has finished arriving */
  landedAfterMs: number;
}

/**
 * Earned coins flown from their card into the balance, once both are ready.
 *
 * The flight waits for the card to land and for the coin pool to be built: a
 * launch before the pool is ready is dropped without a word. Until the coins
 * leave, the balance is shown without them; with reduced motion nothing flies
 * and the balance is simply whole.
 */
export function useCoinRewardFlight({ coins, landedAfterMs }: Options) {
  const reducedMotion = useReducedMotion();
  const flightRef = useRef<CoinFlightHandle>(null);
  const balanceRef = useRef<View>(null);
  const sourceRef = useRef<View>(null);
  const active = coins > 0 && !reducedMotion;
  const [landed, setLanded] = useState(false);
  const [flightReady, setFlightReady] = useState(false);
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    if (!active) return;
    return startUiTimer(landedAfterMs, () => setLanded(true));
  }, [active, landedAfterMs]);

  useEffect(() => {
    if (!landed || !flightReady) return;
    const source = sourceRef.current;
    if (source == null) {
      setLaunched(true);
      return;
    }
    source.measureInWindow((x, y, width, height) => {
      flightRef.current?.launch({
        coins,
        from: { x: x + width / 2, y: y + height / 2 },
      });
      setLaunched(true);
    });
  }, [coins, flightReady, landed]);

  const onFlightReady = useCallback(() => setFlightReady(true), []);

  return {
    flightRef,
    balanceRef,
    sourceRef,
    onFlightReady,
    /** the coins have left their card, so the balance may count them in */
    earnedShown: reducedMotion || launched,
  };
}
