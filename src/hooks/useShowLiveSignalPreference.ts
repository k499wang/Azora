import { useCallback, useEffect, useState } from 'react';
import {
  isShowLiveSignalEnabled,
  loadShowLiveSignalEnabled,
  setShowLiveSignalEnabled,
  subscribeShowLiveSignalEnabled,
} from '../services/preferences/showLiveSignalPreference';

export function useShowLiveSignalPreference() {
  const [enabled, setEnabled] = useState(isShowLiveSignalEnabled);

  useEffect(() => {
    const unsubscribe = subscribeShowLiveSignalEnabled(setEnabled);
    loadShowLiveSignalEnabled().catch(() => {});
    return unsubscribe;
  }, []);

  const updateEnabled = useCallback((nextEnabled: boolean) => {
    setShowLiveSignalEnabled(nextEnabled).catch(() => {});
  }, []);

  return {
    showLiveSignalEnabled: enabled,
    setShowLiveSignalEnabled: updateEnabled,
  };
}
