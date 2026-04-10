import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  deriveProgressSummary,
  loadProgress,
  type ProgressSummary,
} from '../storage/progress';

function shiftByDays(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

const EMPTY_SUMMARY: ProgressSummary = {
  streakCount: 0,
  bestHoldSeconds: 0,
  selectedDayStats: {
    bestHoldSeconds: 0,
    totalPracticeSeconds: 0,
    sessionCount: 0,
  },
  weeklyHoldTrend: [
    { label: 'Mon', value: 0 },
    { label: 'Tue', value: 0 },
    { label: 'Wed', value: 0 },
    { label: 'Thu', value: 0 },
    { label: 'Fri', value: 0 },
    { label: 'Sat', value: 0 },
    { label: 'Sun', value: 0 },
  ],
};

export default function useBreathingStats(selectedDaysAgo = 0) {
  const [summary, setSummary] = useState<ProgressSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const progress = await loadProgress();
    setSummary(deriveProgressSummary(progress, shiftByDays(selectedDaysAgo)));
    setLoading(false);
  }, [selectedDaysAgo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return useMemo(
    () => ({
      summary,
      loading,
      refresh,
    }),
    [summary, loading, refresh],
  );
}
