import type { LessonDefinition } from '../lessonBlock';
import { attentionLessonForPurpose, SHARED_ATTENTION_LESSONS, TEACHING_MUSCLE_LESSON } from './attentionLessons';

const CONTEXTS = [
  {
    track: 'stress',
    sensesTitle: 'Notice your surroundings when everything feels too much',
    musclesTitle: 'Notice tension before choosing your next task',
    senses: 'When work, messages, and unfinished jobs are all on your mind, it can be hard to choose where to begin. Today’s practice gives you **a pause to notice your surroundings**, so you have one simple thing to focus on before deciding which task needs attention. You do not need to feel angry to use it.',
    muscles: 'When several jobs need attention, you may notice tight shoulders or clenched hands as you move between them. Today’s practice helps you **explore that tension through gentle movements**, before deciding what you need next. You can choose one manageable task or take a break; finishing everything is not a requirement for resting.',
    sensesStep: 'Try 5-4-3-2-1, then choose one manageable next step.',
    musclesStep: 'Try Muscle Release gently, then choose a next step or a break.',
    sensesAction: 'In today’s plan, open **5-4-3-2-1** and follow the prompts at your own pace. When you finish, choose one manageable next step, such as opening the message that needs a reply.',
    musclesAction: 'In today’s plan, open **Muscle Release** and follow the gentle prompts. Afterward, decide whether you need a break or are ready to choose one manageable next task.',
  },
  {
    track: 'overthinking',
    sensesTitle: 'Return to your surroundings when a worry repeats',
    musclesTitle: 'Give tense muscles a break while thoughts keep coming',
    senses: 'When you keep replaying a conversation or imagining tomorrow, the same question may return without an answer. Today’s practice offers **something around you to notice instead**, before you choose what to do next. It will not answer the worry for you, and you can continue even while thoughts are still arriving.',
    muscles: 'If you are worried, your hands or shoulders may feel tense while the same thoughts keep coming. Today’s practice gives you **a gentle way to let your muscles rest**, without needing to settle every question first. Afterward, you can check for a useful action or leave the question open for now.',
    sensesStep: 'Try 5-4-3-2-1, then choose an action or leave the worry unanswered.',
    musclesStep: 'Try Muscle Release gently without needing to stop your thoughts.',
    sensesAction: 'In today’s plan, open **5-4-3-2-1** and follow the prompts. Afterward, check whether there is a useful action available. If there is not, you can leave the worry unanswered and return to your next activity.',
    musclesAction: 'In today’s plan, open **Muscle Release** and let your muscles rest between prompts. If a thought interrupts, continue from where you are; your thoughts do not need to stop for you to finish.',
  },
  {
    track: 'anger',
    sensesTitle: 'Pause and notice your surroundings before replying',
    musclesTitle: 'Notice tight muscles before irritation grows',
    senses: 'When someone interrupts you, the urge to reply sharply may arrive before you have chosen your words. Today’s practice gives you **a pause to notice your surroundings before responding**. Afterward, you can return to the conversation and explain what bothered you, with more time to decide how to say it.',
    muscles: 'When you lose patience, your hands may clench or your shoulders may rise before you speak. Today’s practice lets you **notice the difference between holding tension and letting it go** during a quiet moment. That feeling can become a reminder to pause when irritation builds later.',
    sensesStep: 'Try 5-4-3-2-1, then pause before choosing a reply.',
    musclesStep: 'Try Muscle Release gently and notice one place that holds tension.',
    sensesAction: 'In today’s plan, open **5-4-3-2-1** and follow the prompts. Use this practice to get familiar with pausing, so you can try a pause before choosing your words when irritation rises.',
    musclesAction: 'In today’s plan, open **Muscle Release** and follow the gentle prompts. Notice one place where you held tension, so you can recognize that feeling as a reminder to pause later.',
  },
] as const;

export const PRESSURE_ATTENTION_LESSONS = CONTEXTS.flatMap((context) => [
  {
    ...attentionLessonForPurpose(SHARED_ATTENTION_LESSONS[0],
      `attention.senses${context.track}`, context.senses, context.sensesStep, context.sensesAction),
    title: context.sensesTitle,
  },
  {
    ...attentionLessonForPurpose(SHARED_ATTENTION_LESSONS[1],
      `attention.muscles${context.track}`, context.muscles, context.musclesStep, context.musclesAction),
    title: context.musclesTitle,
  },
]) satisfies readonly LessonDefinition[];

export const TEACHING_PRESSURE_MUSCLE_LESSONS = CONTEXTS.map((context) => ({
  ...attentionLessonForPurpose(TEACHING_MUSCLE_LESSON,
    `attention.muscles${context.track}ready`, context.muscles, context.musclesStep, context.musclesAction),
  title: context.musclesTitle,
})) satisfies readonly LessonDefinition[];
