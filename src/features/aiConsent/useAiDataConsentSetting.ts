import { useCallback, useEffect, useState } from 'react';
import {
  clearAiDataConsent,
  loadAiDataConsent,
} from '../../services/preferences/aiDataConsentPreference';
import { ensureAiDataConsent, type AiDataConsentNavigation } from './ensureAiDataConsent';

/** The Settings switch: on asks the same question as first use, off withdraws the yes. */
export function useAiDataConsentSetting(userId: string | null, navigation: AiDataConsentNavigation) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (userId == null) {
      setAllowed(false);
      return undefined;
    }
    let cancelled = false;
    void loadAiDataConsent(userId).then((stored) => {
      if (!cancelled) setAllowed(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const change = useCallback(async (next: boolean) => {
    if (userId == null) return;
    if (next) {
      setAllowed(await ensureAiDataConsent(userId, navigation));
      return;
    }
    setAllowed(false);
    await clearAiDataConsent(userId);
  }, [navigation, userId]);

  return { allowed, change };
}
