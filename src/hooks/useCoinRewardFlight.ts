import { useCallback, useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import type { CoinFlightHandle } from '../components/common/CoinFlightLayer';
import { startUiTimer } from '../lib/ui/uiThreadTimer';
import { useCompletionSound } from './useCompletionSound';

/** `coin-count.wav` ticks once per step at this spacing; change them together */
const COUNT_STEPS = 8;
const COUNT_STEP_MS = 70;
/** the full total rests on its card a beat before the coins leave it */
const COUNT_HOLD_MS = 220;

interface Options {
  /** what was earned; nothing flies while this is zero */
  coins: number;
  /** when the card the coins leave from has finished arriving */
  landedAfterMs: number;
}

/**
 * Earned coins counted up on their card, then flown into the balance.
 *
 * The count starts once the card has landed, in a fixed number of steps so the
 * tick sound fits any total. The flight waits for the count and for the coin
 * pool to be built: a
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
  const leavesAfterMs = active
    ? landedAfterMs + COUNT_STEPS * COUNT_STEP_MS + COUNT_HOLD_MS
    : landedAfterMs;
  const [counted, setCounted] = useState(0);
  const [landed, setLanded] = useState(false);
  const [flightReady, setFlightReady] = useState(false);
  const [launched, setLaunched] = useState(false);
  const playCount = useCompletionSound('coinCount', { active });
  const latestPlayCount = useRef(playCount);

  useEffect(() => {
    latestPlayCount.current = playCount;
  }, [playCount]);

  useEffect(() => {
    if (!active) return;
    const cancels = Array.from({ length: COUNT_STEPS }, (_, step) =>
      startUiTimer(landedAfterMs + step * COUNT_STEP_MS, () => {
        if (step === 0) latestPlayCount.current();
        setCounted(step + 1);
      }),
    );
    cancels.push(startUiTimer(leavesAfterMs, () => setLanded(true)));
    return () => cancels.forEach((cancel) => cancel());
  }, [active, landedAfterMs, leavesAfterMs]);

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
    /** when the coins leave their card, for anything that follows them */
    leavesAfterMs,
    /** what the card shows: counting up from zero once it lands */
    cardCoins: active ? Math.round((coins * counted) / COUNT_STEPS) : coins,
    /** the coins have left their card, so the balance may count them in */
    earnedShown: reducedMotion || launched,
  };
}
