import type { LessonBlock, LessonDefinition } from '../lessonBlock';
import { goalLessonTeaching } from './goalLessonTeaching';
import { goalLessonInteraction } from './goalLessonInteractions';
import { GOAL_LESSON_CONTEXTS } from './goalLessonContexts';
import { PRESSURE_LESSON_CONTEXTS } from './pressureLessonContexts';
import { PHONE_LESSON_CONTEXTS } from './phoneLessonContexts';

export interface GoalLessonContext {
  title: string;
  chapterTitle?: string;
  explanation: string;
  step: string;
  action?: string;
  prompt?: string;
  alternative: string;
  alternativeFeedback?: string;
}

const CONTEXTS = { ...GOAL_LESSON_CONTEXTS, ...PRESSURE_LESSON_CONTEXTS, ...PHONE_LESSON_CONTEXTS };
type Contexts = typeof CONTEXTS;
export type LessonGoal = keyof Contexts;
type ContextId<Goal extends string, Source extends string> =
  Source extends `${infer Subject}.${infer Name}` ? `${Subject}.${Lowercase<Goal>}${Name}` : never;
export type GoalLessonId = {
  [Goal in LessonGoal]: ContextId<Goal, keyof Contexts[Goal] & string>;
}[LessonGoal];

export function goalLessonId(goal: LessonGoal, sourceId: string): GoalLessonId | null {
  if (!(sourceId in CONTEXTS[goal])) return null;
  const [subject, name] = sourceId.split('.');
  return `${subject}.${goal.toLowerCase()}${name}` as GoalLessonId;
}

export const GOAL_CHAPTER_TITLES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(CONTEXTS).flatMap(([goal, contexts]) =>
    Object.entries(contexts).map(([sourceId, authored]) => {
      const context: GoalLessonContext = authored;
      return [goalLessonId(goal as LessonGoal, sourceId), context.chapterTitle ?? context.title];
    }),
  ),
);

/** Keep source-backed teaching; author the scenario, decision and action for its goal. */
export function goalLessonVariants(sources: readonly LessonDefinition[]): readonly (LessonDefinition & { id: GoalLessonId })[] {
  const sourceById = new Map(sources.map((lesson) => [lesson.id, lesson]));
  return Object.entries(CONTEXTS).flatMap(([goal, contexts]) =>
    Object.entries(contexts).map(([sourceId, authored]) => {
      const context: GoalLessonContext = authored;
      const source = sourceById.get(sourceId);
      if (source == null) throw new Error(`Missing source lesson: ${sourceId}`);
      const choice: LessonBlock = {
        kind: 'choice',
        prompt: context.prompt ?? `${context.explanation.replace(/\*\*/g, '')} What could you try next?`,
        options: [
          { label: context.step.replace(/\.$/, ''), feedback: context.explanation.replace(/\*\*/g, '') },
          { label: context.alternative, feedback: context.alternativeFeedback ?? `That does not address this situation. ${context.explanation.replace(/\*\*/g, '')}` },
        ],
      };
      let introduced = false;
      const blocks = (goalLessonTeaching(goal, sourceId) ?? source.blocks).map((block): LessonBlock => {
        if (block.kind === 'text' && !introduced) {
          introduced = true;
          return { kind: 'text', text: context.explanation };
        }
        if (block.kind === 'choice') return choice;
        if (block.kind === 'do') return { kind: 'do', text: context.action ?? `**${context.step}**` };
        return goalLessonInteraction(goal, sourceId, block);
      });
      if (!blocks.some((block) => block.kind === 'choice')) blocks.splice(blocks.length - 1, 0, choice);
      return {
        id: goalLessonId(goal as LessonGoal, sourceId)!,
        title: context.title,
        step: context.step,
        blocks,
        source: `${source.source} Author practical example: ${goal} application of ${sourceId}; contextual scenario and action add no clinical claims.`,
      };
    }),
  );
}
