import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { formatLocalDate } from '../lib/calendar/weekCalendarDays';

function getMsUntilNextLocalDay(): number {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 1, 0);

  return Math.max(1000, nextDay.getTime() - now.getTime());
}

export function useTodayLocalDate(): string {
  const [todayLocalDate, setTodayLocalDate] = useState(() =>
    formatLocalDate(new Date()),
  );

  const refreshTodayLocalDate = useCallback(() => {
    setTodayLocalDate((currentDate) => {
      const nextDate = formatLocalDate(new Date());
      return nextDate === currentDate ? currentDate : nextDate;
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(refreshTodayLocalDate, getMsUntilNextLocalDay());
    return () => clearTimeout(timeout);
  }, [refreshTodayLocalDate, todayLocalDate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refreshTodayLocalDate();
    });

    return () => subscription.remove();
  }, [refreshTodayLocalDate]);

  return todayLocalDate;
}
