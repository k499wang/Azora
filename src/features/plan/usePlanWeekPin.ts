import { useCallback, useMemo, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * What the plan path and the week banner pinned over it share. The path
 * reports where it and its weeks sit; the banner reads that against the scroll
 * to know when to show and which week to name.
 */
export interface PlanWeekPin {
  scrollY: SharedValue<number>;
  /** The window y the pinned banner sits at. */
  stickTop: number;
  /** Window y of the path's top at scroll offset zero; null until measured. */
  origin: SharedValue<number | null>;
  /** The overlay has laid out at the shared banner height and can take over. */
  overlayReady: SharedValue<boolean>;
  /** The inline placeholder has laid out at this height. */
  inlineHeight: SharedValue<number>;
  /** Number of weeks whose natural banner height has been measured. */
  measuredWeekCount: number;
  /** Each week's top within the path. */
  weekTops: SharedValue<number[]>;
  /** The tallest week's banner, which every banner takes so a switch never resizes it. */
  bannerHeight: number;
  measureWeek: (week: number, height: number) => void;
}

export function usePlanWeekPin(scrollY: SharedValue<number>, stickTop: number): PlanWeekPin {
  const origin = useSharedValue<number | null>(null);
  const overlayReady = useSharedValue(false);
  const inlineHeight = useSharedValue(0);
  const weekTops = useSharedValue<number[]>([]);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const measuredWeekCount = Object.keys(heights).length;
  const bannerHeight = Math.max(0, ...Object.values(heights));

  const measureWeek = useCallback((week: number, height: number) => {
    setHeights((prev) => (prev[week] === height ? prev : { ...prev, [week]: height }));
  }, []);

  return useMemo(
    () => ({ scrollY, stickTop, origin, overlayReady, inlineHeight, measuredWeekCount, weekTops, bannerHeight, measureWeek }),
    [scrollY, stickTop, origin, overlayReady, inlineHeight, measuredWeekCount, weekTops, bannerHeight, measureWeek],
  );
}
