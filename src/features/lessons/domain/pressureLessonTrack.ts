import type { ProgramEnrollmentV3 } from '../../program/domain/programEnrollment';
import type { OnboardingIntent } from '../../../components/onboarding/types';

export type PressureLessonTrack = 'stress' | 'overthinking' | 'anger';

export const PRESSURE_TRACK_PURPOSE: Record<PressureLessonTrack, string> = {
  stress: 'Practise a pause when demands pile up, then choose one manageable next step.',
  overthinking: 'Practise returning to the present when a worry repeats, then choose an available action.',
  anger: 'Practise pausing when irritation rises, then choose what to say or do.',
};

/** Choose once when starting a plan; saved lesson IDs own the running plan. */
export function pressureLessonTrackForIntent(
  intent: OnboardingIntent | null | undefined,
): PressureLessonTrack {
  if (intent === 'calm_fast') return 'overthinking';
  if (intent === 'emotional_balance') return 'anger';
  return 'stress';
}

/** Running-plan guidance follows saved lessons, never a later profile change. */
export function pressureLessonTrackForEnrollment(
  enrollment: Pick<ProgramEnrollmentV3, 'planId' | 'resolved'> | null | undefined,
): PressureLessonTrack | undefined {
  if (enrollment?.planId !== 'pressure') return undefined;
  const firstLessonId = enrollment.resolved?.days[0]?.lessonActivityId;
  if (firstLessonId === 'lesson:stress.signs') return 'stress';
  if (firstLessonId === 'lesson:worry.loop') return 'overthinking';
  if (firstLessonId === 'lesson:anger.meter') return 'anger';
  return undefined;
}
