import { useCallback, useEffect, useRef } from 'react';
import { runOnJS, useAnimatedReaction, type SharedValue } from 'react-native-reanimated';
import { useCompletionSound } from './useCompletionSound';

// Reserve the native audio start before the tab moves, while JS still has time
// to deliver the command. The deadline comes from the visual clock itself.
const SCHEDULE_LEAD_MS = 200;
const LATE_CUE_MS = 50;

/** The tab's visual clock owns its cue, including the fallback without native scheduling. */
export function useStatCardPopSound(clock: SharedValue<number>, popAt: number) {
  const play = useCompletionSound('cardPop');
  const latestPlay = useRef(play);
  const scheduled = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    latestPlay.current = play;
  }, [play]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const schedule = useCallback((deadline: number) => {
    if (!mounted.current) return;
    scheduled.current = latestPlay.current.scheduleAt(deadline);
  }, []);

  const pop = useCallback((deadline: number) => {
    if (!mounted.current || scheduled.current || Date.now() - deadline > LATE_CUE_MS) return;
    // A cue that is still loading must not arrive after its tab has expanded.
    latestPlay.current.playIfReady();
  }, []);

  useAnimatedReaction(
    () => clock.value,
    (ms, previous) => {
      const before = previous ?? -Infinity;
      if (ms >= popAt - SCHEDULE_LEAD_MS && before < popAt - SCHEDULE_LEAD_MS) {
        runOnJS(schedule)(Date.now() + popAt - ms);
      }
      if (ms >= popAt && before < popAt) {
        runOnJS(pop)(Date.now() + popAt - ms);
      }
    },
    [clock, popAt, schedule, pop],
  );
}
