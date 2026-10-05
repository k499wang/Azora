import { useCallback, useRef, useState } from 'react';
import { useWhileVisible } from '../../hooks/useWhileVisible';

export type CleanupStepFinishPhase = 'idle' | 'holding' | 'fading';

export function useCleanupStepFinish({
  active,
  onFinished,
}: {
  active: boolean;
  onFinished: () => void;
}) {
  const [phase, setPhase] = useState<CleanupStepFinishPhase>('idle');
  const phaseRef = useRef<CleanupStepFinishPhase>('idle');
  const visibleRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useWhileVisible(() => {
    visibleRef.current = active;
    return () => {
      visibleRef.current = false;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
      phaseRef.current = 'idle';
      setPhase('idle');
    };
  }, [active]);

  const finish = useCallback(() => {
    if (!visibleRef.current || phaseRef.current !== 'idle') return;
    phaseRef.current = 'holding';
    setPhase('holding');
    timerRef.current = setTimeout(() => {
      phaseRef.current = 'fading';
      setPhase('fading');
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onFinishedRef.current();
        phaseRef.current = 'idle';
        setPhase('idle');
      }, 180);
    }, 350);
  }, []);

  return { phase, finish };
}
