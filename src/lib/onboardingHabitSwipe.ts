import type { StarterPlanDecision } from './onboardingStarterPlan';

const SWIPE_DISTANCE = 88;
const SWIPE_VELOCITY = 800;

export function habitSwipeDecision(
  translationX: number,
  velocityX: number,
): StarterPlanDecision | null {
  'worklet';

  if (translationX >= SWIPE_DISTANCE) return 'accepted';
  if (translationX <= -SWIPE_DISTANCE) return 'rejected';
  if (velocityX >= SWIPE_VELOCITY) return 'accepted';
  if (velocityX <= -SWIPE_VELOCITY) return 'rejected';
  return null;
}
