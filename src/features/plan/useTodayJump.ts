import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { ScrollView, View } from 'react-native';
import { runOnJS, useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';

export type TodayDirection = 'up' | 'down';
export type TodayPlacement = 'pending' | 'on-screen' | TodayDirection;

interface Options {
  scrollRef: RefObject<Pick<ScrollView, 'scrollTo'> | null>;
  scrollY: SharedValue<number>;
  visibleTop: number;
  visibleBottom: number;
  /** Changes when a different enrollment or calendar day owns today's node. */
  nodeKey: string;
}

/** One measured anchor drives both floating controls; an unmeasured node shows neither. */
export function useTodayJump({ scrollRef, scrollY, visibleTop, visibleBottom, nodeKey }: Options) {
  const node = useRef<View | null>(null);
  const generation = useRef(0);
  const retry = useRef<number | null>(null);
  const anchor = useSharedValue<{ centre: number; reach: number; generation: number } | null>(null);
  const identity = `${nodeKey}:${visibleTop}:${visibleBottom}`;
  const [result, setResult] = useState<{ identity: string; placement: TodayPlacement } | null>(null);

  const publish = useCallback((placement: TodayPlacement, measuredGeneration: number) => {
    if (generation.current !== measuredGeneration) return;
    setResult((previous) => previous?.identity === identity && previous.placement === placement
      ? previous : { identity, placement });
  }, [identity]);

  const remeasure = useCallback(() => {
    const current = node.current;
    const measuredGeneration = ++generation.current;
    if (retry.current != null) cancelAnimationFrame(retry.current);
    retry.current = null;
    anchor.value = null;
    publish('pending', measuredGeneration);
    if (current == null) return;

    // A ref can attach before native layout. Layout events also remeasure; these
    // three frames cover an initial zero or missing native callback without polling.
    let accepted = false;
    const attempt = (remaining: number) => {
      if (accepted || generation.current !== measuredGeneration || node.current !== current) return;
      if (remaining > 0) retry.current = requestAnimationFrame(() => attempt(remaining - 1));
      const measuredScrollY = scrollY.value;
      current.measureInWindow((_x, y, width, height) => {
        if (accepted || generation.current !== measuredGeneration || node.current !== current ||
          !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
        accepted = true;
        if (retry.current != null) cancelAnimationFrame(retry.current);
        retry.current = null;
        anchor.value = { centre: y + height / 2 + measuredScrollY, reach: height, generation: measuredGeneration };
      });
    };
    attempt(2);
  }, [anchor, publish, scrollY]);

  const todayRef = useCallback((next: View | null) => {
    node.current = next;
    remeasure();
  }, [remeasure]);

  useEffect(() => {
    remeasure();
    return () => {
      generation.current += 1;
      anchor.value = null;
      if (retry.current != null) cancelAnimationFrame(retry.current);
    };
  }, [anchor, remeasure]);

  useAnimatedReaction(
    () => {
      const measured = anchor.value;
      if (measured == null) return null;
      const centre = measured.centre - scrollY.value;
      const placement: TodayPlacement = centre < visibleTop - measured.reach ? 'up'
        : centre > visibleBottom + measured.reach ? 'down' : 'on-screen';
      return { placement, generation: measured.generation };
    },
    (next, previous) => {
      if (next != null && (next.placement !== previous?.placement || next.generation !== previous?.generation)) {
        runOnJS(publish)(next.placement, next.generation);
      }
    },
    [publish, visibleTop, visibleBottom],
  );

  const jump = useCallback(() => {
    if (anchor.value == null) return;
    scrollRef.current?.scrollTo({
      y: Math.max(0, anchor.value.centre - (visibleTop + visibleBottom) / 2), animated: true,
    });
  }, [anchor, scrollRef, visibleTop, visibleBottom]);

  const placement = result?.identity === identity ? result.placement : 'pending';
  return { placement, todayRef, remeasure, jump };
}
