import { useProfileSummaryQuery } from '../../queries/profile/useProfileSummaryQuery';
import { useAuthStore } from '../../stores/authStore';
import { withTodaysSession } from '../../lib/weeklyProgress';
import { saveStreakGoal } from '../../services/preferences/streakGoalPreference';
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
  const visible = active && showing && !heldForClose && profileSummary != null && userId != null;
  const playStreakSound = useCompletionSound('streak', { active: visible });

  const commitStreakGoal = (days: number) => {
    if (userId == null) return;
    void saveStreakGoal(userId, days);
  };

  return (
    <RoutineFirstCompletionModal
      visible={visible}
      onIgnite={playStreakSound}
      streakDays={streak.currentStreak}
      completedDaysAgo={streak.completedDaysAgo}
      onCommitStreakGoal={commitStreakGoal}
      onContinue={dismiss}
    />
  );
}
