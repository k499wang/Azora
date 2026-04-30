import { useEffect } from 'react';
import * as Brightness from 'expo-brightness';

export function useLockedBrightness(active: boolean, level?: number) {
  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let previous: number | null = null;
    let lockInterval: ReturnType<typeof setInterval> | null = null;

    (async () => {
      try {
        previous = await Brightness.getBrightnessAsync();
        if (cancelled) return;
        const target = level ?? previous;
        await Brightness.setBrightnessAsync(target);
        lockInterval = setInterval(() => {
          Brightness.setBrightnessAsync(target).catch(() => {});
        }, 1000);
      } catch {}
    })();

    return () => {
      cancelled = true;
      if (lockInterval) clearInterval(lockInterval);
      (async () => {
        try {
          if (previous != null) {
            await Brightness.setBrightnessAsync(previous);
          } else {
            await Brightness.restoreSystemBrightnessAsync();
          }
        } catch {}
      })();
    };
  }, [active, level]);
}
