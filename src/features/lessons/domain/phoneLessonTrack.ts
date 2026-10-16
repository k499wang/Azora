import type { ProgramEnrollmentV3 } from '../../program/domain/programEnrollment';
import type { OnboardingIntent } from '../../../components/onboarding/types';

export type PhoneLessonTrack = 'bedtime' | 'work';

/** Choose once at enrollment; resolved lesson IDs preserve the chosen track. */
export function phoneLessonTrackForIntent(
  intent: OnboardingIntent | null | undefined,
): PhoneLessonTrack {
  return intent === 'sleep' ? 'bedtime' : 'work';
}

export const PHONE_TRACK_PURPOSE: Record<PhoneLessonTrack, string> = {
  bedtime: 'Practise leaving the phone behind at bedtime and choosing a restful next step.',
  work: 'Practise putting the phone aside and returning to one concrete work task.',
};

/** Running-plan copy follows its immutable lesson snapshot, not a changed profile. */
export function phoneLessonTrackForEnrollment(
  enrollment: Pick<ProgramEnrollmentV3, 'planId' | 'resolved'> | null | undefined,
): PhoneLessonTrack | undefined {
  if (enrollment?.planId !== 'phone') return undefined;
  const firstLessonId = enrollment.resolved?.days[0]?.lessonActivityId;
  if (firstLessonId?.startsWith('lesson:') && firstLessonId.includes('.phonebedtime')) return 'bedtime';
  if (firstLessonId?.startsWith('lesson:') && firstLessonId.includes('.phonework')) return 'work';
  return undefined;
}
