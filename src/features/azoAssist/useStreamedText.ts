import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';

/** How many of the newest words are still fading in. */
export const STREAM_TAIL_LENGTH = 3;
/** A reply takes about this long to reveal, however long it is, within the step bounds. */
const TARGET_REVEAL_MS = 1600;
const MIN_STEP_MS = 18;
const MAX_STEP_MS = 45;

export interface StreamedText {
  /** fully faded in */
  settled: string;
  /** the newest words, oldest first; `step` counts up from 0 as a word fades in, below STREAM_TAIL_LENGTH */
  tail: { word: string; step: number }[];
}

/**
 * Reveals a finished reply one word at a time, with the last few words still
 * fading in, so the edge of the text glides rather than jumps. `onDone` fires
 * once every word has settled.
 */
export function useStreamedText(text: string, streaming: boolean, onDone: () => void): StreamedText {
  const reducedMotion = useReducedMotion();
  const words = useMemo(() => text.match(/\S+\s*/g) ?? [], [text]);
  const animate = streaming && !reducedMotion;
  const end = words.length + STREAM_TAIL_LENGTH;
  const stepMs = Math.min(MAX_STEP_MS, Math.max(MIN_STEP_MS, TARGET_REVEAL_MS / Math.max(1, words.length)));
  const [cursor, setCursor] = useState(animate ? 0 : end);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!streaming) return;
    if (!animate || cursor >= end) {
      done.current();
      return;
    }
    return startUiTimer(stepMs, () => setCursor((count) => Math.min(end, count + 1)));
  }, [animate, cursor, end, stepMs, streaming]);

  if (!animate) return { settled: text, tail: [] };
  const shown = Math.min(cursor, words.length);
  const settledCount = Math.min(shown, Math.max(0, cursor - STREAM_TAIL_LENGTH));
  return {
    settled: words.slice(0, settledCount).join(''),
    tail: words.slice(settledCount, shown).map((word, index) => ({
      word,
      step: cursor - (settledCount + index) - 1,
    })),
  };
}
