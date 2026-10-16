import type { LessonBlock, LessonDefinition } from '../lessonBlock';

type CourseInteraction = Extract<LessonBlock, { kind: 'list' | 'reveal' | 'sequence' }>;
type CourseChoice = Omit<Extract<LessonBlock, { kind: 'choice' }>, 'kind'>;

interface PressureCourseLesson {
  id: string;
  title: string;
  step: string;
  teaching: readonly [string, string, string];
  interaction: CourseInteraction;
  choice: CourseChoice;
  action: string;
  source: string;
  day: number;
}

// The published pressure schedule is shared by all three tracks. Keep notes
// explicit here so content does not import the catalogue that composes it.
const BREATHING_DAYS = new Set([8, 12, 13, 14, 17, 19, 23, 25]);
const MUSCLE_DAYS = new Set([8, 12, 19, 22, 25, 28]);
const SENSE_DAYS = new Set([9, 10]);

export function definePressureCourseLesson<const Definition extends PressureCourseLesson>(
  definition: Definition,
): LessonDefinition & { id: Definition['id'] } {
  const practices = [
    ...(BREATHING_DAYS.has(definition.day) ? ['breathing Reset'] : []),
    ...(MUSCLE_DAYS.has(definition.day) ? ['Muscle Release'] : []),
    ...(SENSE_DAYS.has(definition.day) ? ['5-4-3-2-1'] : []),
  ];
  return {
    id: definition.id,
    title: definition.title,
    step: definition.step,
    blocks: [
      ...definition.teaching.map((text): LessonBlock => ({ kind: 'text', text })),
      definition.interaction,
      { kind: 'choice', ...definition.choice },
      ...(practices.length === 0 ? [] : [{
        kind: 'text' as const,
        text: `Today’s **${practices.join(' and ')}** ${practices.length === 1 ? 'is a separate guided practice' : 'are separate guided practices'}. Follow the prompts comfortably. Breathe normally or stop if needed; you can try the lesson’s everyday step separately.`,
      }]),
      { kind: 'do', text: definition.action },
    ],
    source: definition.source,
  };
}
