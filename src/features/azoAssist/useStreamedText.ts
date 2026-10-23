import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';

const STEP_MS = 40;
/** Words and the spaces after them, so two words land per step. */
const TOKENS_PER_STEP = 4;

/**
 * Reveals a finished reply a couple of words at a time, the way chat apps
 * stream. `onDone` fires once the whole text is showing.
 */
export function useStreamedText(text: string, streaming: boolean, onDone: () => void): string {
  const reducedMotion = useReducedMotion();
  const tokens = useMemo(() => text.split(/(\s+)/), [text]);
  const animate = streaming && !reducedMotion;
  const [shown, setShown] = useState(animate ? 0 : tokens.length);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!streaming) return;
    if (!animate || shown >= tokens.length) {
      done.current();
      return;
    }
    return startUiTimer(STEP_MS, () => {
      setShown((count) => Math.min(tokens.length, count + TOKENS_PER_STEP));
    });
  }, [animate, shown, streaming, tokens.length]);

  return animate ? tokens.slice(0, shown).join('') : text;
}
