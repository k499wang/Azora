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
  /** How far the path has revealed itself, 0 to 1; the overlay shows no more than the path does. */
  shown: SharedValue<number>;
  /** Number of weeks whose natural banner height has been measured. */
  measuredWeekCount: number;
  /** Each week's top within the path. */
  weekTops: SharedValue<number[]>;
  /** The tallest week's banner, which every banner takes so a switch never resizes it. */
  bannerHeight: number;
  measureWeek: (week: number, height: number) => void;
}

export function usePlanWeekPin(
  scrollY: SharedValue<number>,
  stickTop: number,
  planId: string | null,
): PlanWeekPin {
  const origin = useSharedValue<number | null>(null);
  const overlayReady = useSharedValue(false);
  const inlineHeight = useSharedValue(0);
  const shown = useSharedValue(0);
  const weekTops = useSharedValue<number[]>([]);
  const [measurements, setMeasurements] = useState<{
    planId: string | null;
    heights: Record<number, number>;
  }>({ planId, heights: {} });
  // A new plan must measure its own copy, even when it has the same weeks.
  const heights = measurements.planId === planId ? measurements.heights : {};
  const measuredWeekCount = Object.keys(heights).length;
  const bannerHeight = Math.max(0, ...Object.values(heights));

  const measureWeek = useCallback((week: number, height: number) => {
    setMeasurements((prev) => {
      const heights = prev.planId === planId ? prev.heights : {};
      return heights[week] === height
        ? prev
        : { planId, heights: { ...heights, [week]: height } };
    });
  }, [planId]);

  return useMemo(
    () => ({ scrollY, stickTop, origin, overlayReady, inlineHeight, shown, measuredWeekCount, weekTops, bannerHeight, measureWeek }),
    [scrollY, stickTop, origin, overlayReady, inlineHeight, shown, measuredWeekCount, weekTops, bannerHeight, measureWeek],
  );
}
