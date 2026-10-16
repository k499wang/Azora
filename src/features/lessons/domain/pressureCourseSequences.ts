import { PRESSURE_STRESS_COURSE_LESSONS } from './lessons/pressureStressCourseLessons';
import { PRESSURE_OVERTHINKING_COURSE_LESSONS } from './lessons/pressureOverthinkingCourseLessons';

export const FIRST_PRESSURE_COURSE_REVISION = 13;

export const PRESSURE_COURSE_LESSON_SEQUENCES = {
  stress: [
    'stress.trialsigns', 'breath.trialstress', 'attention.trialskillsensesstress',
    'stress.trialnext', 'stress.trialload', 'attention.trialskillmusclesstressready', 'stress.trialplan',
    ...PRESSURE_STRESS_COURSE_LESSONS.map(({ id }) => id),
  ],
  overthinking: [
    'worry.trialloop', 'breath.trialworry', 'attention.trialskillsensesoverthinking',
    'worry.trialaction', 'worry.trialfacts', 'attention.trialskillmusclesoverthinkingready', 'quiet.trialworryquestion',
    ...PRESSURE_OVERTHINKING_COURSE_LESSONS.map(({ id }) => id),
  ],
} as const;
