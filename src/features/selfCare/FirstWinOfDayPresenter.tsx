import { useEffect, useState } from 'react';
import { useProfileSummaryQuery } from '../../queries/profile/useProfileSummaryQuery';
import { useAuthStore } from '../../stores/authStore';
import { withTodaysSession } from '../../lib/weeklyProgress';
import { loadStreakGoal, saveStreakGoal } from '../../services/preferences/streakGoalPreference';
import RoutineFirstCompletionModal from './RoutineFirstCompletionModal';
import { useFirstWinOfDayStore } from './firstWinOfDayStore';
import { useCompletionSound } from '../../hooks/useCompletionSound';

interface Props {
  /** whether the screen hosting it is the one on top */
  active: boolean;
}

/**
 * The streak popup for the day's first win. Mounted by Home and Routine, and
 * shown by whichever is on screen — a win on the check-in or the lesson waits
 * for that screen to have finished closing before it celebrates.
 */
export default function FirstWinOfDayPresenter({ active }: Props) {
  const showing = useFirstWinOfDayStore((state) => state.showing);
  const heldForClose = useFirstWinOfDayStore((state) => state.heldForClose);
  const dismiss = useFirstWinOfDayStore((state) => state.dismiss);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const profileQuery = useProfileSummaryQuery(userId);
  const profileSummary = profileQuery.data;
  const streak = withTodaysSession(
    profileSummary?.currentStreak ?? 0,
    profileSummary?.completedDaysAgo ?? [],
  );
  const [loadedGoal, setLoadedGoal] = useState<{ userId: string; days: number | null } | null>(null);
  const streakGoalLoaded = userId != null && loadedGoal?.userId === userId;
  const streakGoal = streakGoalLoaded ? loadedGoal.days : null;
  const visible = active && showing && !heldForClose && profileSummary != null && streakGoalLoaded;
  const playStreakSound = useCompletionSound('streak', { active: visible });

  useEffect(() => {
    if (userId == null) return;
    let cancelled = false;
    void loadStreakGoal(userId).then((days) => {
      if (!cancelled) setLoadedGoal({ userId, days });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const commitStreakGoal = (days: number) => {
    if (userId == null) return;
    setLoadedGoal({ userId, days });
    void saveStreakGoal(userId, days);
  };

  return (
    <RoutineFirstCompletionModal
      visible={visible}
      onShow={playStreakSound}
      streakDays={streak.currentStreak}
      completedDaysAgo={streak.completedDaysAgo}
      streakGoal={streakGoal}
      onCommitStreakGoal={commitStreakGoal}
      onContinue={dismiss}
    />
  );
}
