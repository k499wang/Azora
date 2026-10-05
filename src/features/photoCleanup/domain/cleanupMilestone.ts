export function getCleanupMilestone(completedCount: number, totalCount: number): string | null {
  if (completedCount <= 0 || completedCount >= totalCount) return null;

  if (totalCount >= 3 && completedCount === totalCount - 1) {
    return 'One more small win to go.';
  }

  if (totalCount >= 3 && completedCount === Math.ceil(totalCount / 2)) {
    return 'Look at that—you’re halfway there.';
  }

  if (completedCount === 1) return 'One less thing to think about.';

  return null;
}
