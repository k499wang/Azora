import { programDayLesson, type ProgramEnrollmentV3 } from '../../program/domain/programEnrollment';
import type { LearningPracticeRecord } from './learningPractice';

/** Reports belong to the exact saved lesson, not just the same day number. */
export function learningPracticeForEnrollment(
  enrollment: ProgramEnrollmentV3,
  records: readonly LearningPracticeRecord[],
) {
  return records.filter((record) =>
    programDayLesson(enrollment, record.programDay)?.id === record.lessonId,
  );
}
