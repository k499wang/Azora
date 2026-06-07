import { useCallback, useEffect, useState } from 'react';
import {
  isHeartRateMonitoringEnabled,
  loadHeartRateMonitoringEnabled,
  setHeartRateMonitoringEnabled,
  subscribeHeartRateMonitoringEnabled,
} from '../services/preferences/heartRateMonitoringPreference';

export function useHeartRateMonitoringPreference() {
  const [enabled, setEnabled] = useState(isHeartRateMonitoringEnabled);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeHeartRateMonitoringEnabled(setEnabled);
    let cancelled = false;

    loadHeartRateMonitoringEnabled()
      .then((storedEnabled) => {
        if (cancelled) return;
        setEnabled(storedEnabled);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoaded(true);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const updateEnabled = useCallback((nextEnabled: boolean) => {
    setHeartRateMonitoringEnabled(nextEnabled).catch(() => {});
  }, []);

  return {
    heartRateMonitoringEnabled: enabled,
    heartRateMonitoringPreferenceLoaded: loaded,
    setHeartRateMonitoringEnabled: updateEnabled,
  };
}
