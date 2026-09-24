import { useProfileSummaryQuery } from '../../queries/profile/useProfileSummaryQuery';
import { useAuthStore } from '../../stores/authStore';
import { withTodaysSession } from '../../lib/weeklyProgress';
import RoutineFirstCompletionModal from './RoutineFirstCompletionModal';
import { useFirstWinOfDayStore } from './firstWinOfDayStore';

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
  const profileSummary = useProfileSummaryQuery(userId).data;
  const streak = withTodaysSession(
    profileSummary?.currentStreak ?? 0,
    profileSummary?.completedDaysAgo ?? [],
  );

  return (
    <RoutineFirstCompletionModal
      visible={active && showing && !heldForClose}
      streakDays={streak.currentStreak}
      completedDaysAgo={streak.completedDaysAgo}
      onContinue={dismiss}
    />
  );
}
