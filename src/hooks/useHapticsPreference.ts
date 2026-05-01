import { useCallback, useEffect, useState } from 'react';
import {
  isHapticsEnabled,
  loadHapticsEnabled,
  setHapticsEnabled,
} from '../services/preferences/hapticsPreference';

export function useHapticsPreference() {
  const [enabled, setEnabled] = useState(isHapticsEnabled);

  useEffect(() => {
    let cancelled = false;

    loadHapticsEnabled()
      .then((storedEnabled) => {
        if (!cancelled) setEnabled(storedEnabled);
      })
      .catch(() => {
        if (!cancelled) setEnabled(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateEnabled = useCallback((nextEnabled: boolean) => {
    setEnabled(nextEnabled);
    setHapticsEnabled(nextEnabled).catch(() => {
      setEnabled(isHapticsEnabled());
    });
  }, []);

  return {
    hapticsEnabled: enabled,
    setHapticsEnabled: updateEnabled,
  };
}
