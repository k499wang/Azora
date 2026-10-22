import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { cancelTaskTimerAlert, scheduleTaskTimerAlert } from './taskTimerNotification';

interface TaskTimerAlertOptions {
  kind: 'routine' | 'focus';
  title: string | null;
  nextTitle?: string | null;
  seconds: number;
  active: boolean;
}

/** Hand a running timer to a local notification while the app is in the background. */
export function useTaskTimerAlert({ kind, title, nextTitle = null, seconds, active }: TaskTimerAlertOptions) {
  const focused = useIsFocused();
  const secondsLeft = useRef(seconds);
  secondsLeft.current = seconds;
  useEffect(() => {
    if (!focused || !active || title == null) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        cancelTaskTimerAlert(kind);
        return;
      }
      if (state !== 'background' || secondsLeft.current <= 0) return;
      scheduleTaskTimerAlert({
        kind, title, nextTitle,
        at: new Date(Date.now() + secondsLeft.current * 1000),
      });
    });
    return () => {
      subscription.remove();
      cancelTaskTimerAlert(kind);
    };
  }, [focused, active, kind, title, nextTitle]);
}
