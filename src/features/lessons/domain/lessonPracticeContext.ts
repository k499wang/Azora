import type { ProgramEnrollmentV3 } from '../../program/domain/programEnrollment';
import { pressureLessonTrackForEnrollment } from './pressureLessonTrack';
import { phoneLessonTrackForEnrollment } from './phoneLessonTrack';

export function lessonPracticeContext(enrollment: ProgramEnrollmentV3 | null): string {
  switch (enrollment?.planId) {
    case 'home': return 'When a household job feels overwhelming or you are unsure where to start.';
    case 'morning': return 'When beginning your day feels difficult and you want a manageable first step.';
    case 'quiet': return 'When you want to pause and make room for a calmer activity.';
    case 'recovery': return 'When your energy is low and you need to balance effort with rest.';
    case 'selfTrust': return 'When you doubt your next step and want to make a small choice for yourself.';
    case 'focus': return 'When you are putting off a task or need help getting back to it.';
    case 'night': return 'When you are getting ready for bed or finding it hard to settle.';
    case 'phone': return phoneLessonTrackForEnrollment(enrollment) === 'bedtime'
      ? 'When scrolling keeps you on your phone at bedtime.'
      : 'When your phone pulls you away from the work you meant to do.';
    case 'pressure': {
      const track = pressureLessonTrackForEnrollment(enrollment);
      if (track === 'overthinking') return 'When the same worry repeats and you need to choose what to do next.';
      if (track === 'anger') return 'When irritation rises and you want a moment to choose your response.';
      return 'When demands pile up and you need one manageable next step.';
    }
    default: return 'When you want to try this skill in an everyday situation.';
  }
}
