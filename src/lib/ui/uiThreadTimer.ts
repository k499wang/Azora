import {
  cancelAnimation,
  makeMutable,
  runOnJS,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

/**
 * A one-shot timer kept by the UI thread's frame clock instead of React
 * Native's timers module.
 *
 * On iOS a JS `setTimeout` more than a second out is parked on a sleep timer,
 * and a parked timer was seen to sit unfired until the next touch woke the
 * timers module — a ticked to-do stayed on screen and its coins never counted
 * until the person tapped something else. The frame clock that drives the
 * animations has no such state, and it keeps time while the JS thread is busy.
 *
 * Returns a cancel function; a cancelled timer never calls back.
 */
export function startUiTimer(ms: number, callback: () => void): () => void {
  const clock = makeMutable(0);
  clock.value = withDelay(
    ms,
    withTiming(1, { duration: 0 }, (finished) => {
      if (finished) runOnJS(callback)();
    }),
  );
  return () => cancelAnimation(clock);
}
