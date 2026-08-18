import { useEffect, useRef } from 'react';

interface UseBreathingSessionLeadInOptions {
  /** True while the session is in its lead-in phase. */
  active: boolean;
  /** How long the character stays on screen before the first cue. */
  durationMs: number;
  /** Guards a lead-in whose session was cancelled while the timer was pending. */
  isActive: () => boolean;
  /** Starts the guided sequence once the character has settled. */
  onComplete: () => void;
}

/**
 * Every breathing session opens the same way: the character arrives, holds a
 * beat, and only then asks for the first breath. Both entry points run through
 * here — the plain intro card and the pulse-finding screen — so finding a heart
 * rate never drops the session straight into a cue.
 */
export function useBreathingSessionLeadIn({
  active,
  durationMs,
  isActive,
  onComplete,
}: UseBreathingSessionLeadInOptions) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) return;

    const timeout = setTimeout(() => {
      if (!isActive()) return;
      onCompleteRef.current();
    }, durationMs);

    return () => clearTimeout(timeout);
  }, [active, durationMs, isActive]);
}
