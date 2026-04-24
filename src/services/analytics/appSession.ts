import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { posthog } from '../../config/posthog';
import { AnalyticsEvent } from './events';

const LAST_OPEN_AT_KEY = 'analytics.last_open_at';
const MS_PER_DAY = 86_400_000;

async function fireForegrounded(): Promise<void> {
  const raw = await AsyncStorage.getItem(LAST_OPEN_AT_KEY);
  const now = Date.now();
  const last = raw ? Number(raw) : null;
  const days =
    last != null && Number.isFinite(last)
      ? Math.floor((now - last) / MS_PER_DAY)
      : null;

  posthog.capture(AnalyticsEvent.AppForegrounded, {
    days_since_last_open: days,
    is_returning_d1: days != null && days >= 1,
    is_returning_d7: days != null && days >= 7,
    is_returning_d30: days != null && days >= 30,
  });

  await AsyncStorage.setItem(LAST_OPEN_AT_KEY, String(now));
}

export function registerAppSessionTracking(): () => void {
  let sessionStart = Date.now();
  let current: AppStateStatus = AppState.currentState;

  void fireForegrounded();

  const sub = AppState.addEventListener('change', (next) => {
    const wentToBackground =
      current === 'active' && (next === 'background' || next === 'inactive');
    const cameToForeground =
      current !== 'active' && next === 'active';

    if (wentToBackground) {
      const seconds = Math.max(0, Math.round((Date.now() - sessionStart) / 1000));
      posthog.capture(AnalyticsEvent.SessionEnded, { foreground_seconds: seconds });
      posthog.flush();
    }

    if (cameToForeground) {
      sessionStart = Date.now();
      void fireForegrounded();
    }

    current = next;
  });

  return () => sub.remove();
}
