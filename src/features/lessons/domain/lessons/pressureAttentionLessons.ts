import type { LessonDefinition } from '../lessonBlock';
import { attentionLessonForPurpose, SHARED_ATTENTION_LESSONS, TEACHING_MUSCLE_LESSON } from './attentionLessons';

const CONTEXTS = [
  {
    track: 'stress',
    sensesTitle: 'Notice your surroundings when everything feels too much',
    musclesTitle: 'Notice tension before choosing your next task',
    senses: '**Take a pause when demands pile up.** You might be thinking about work, messages, and unfinished jobs at once. This plan is about stress and overwhelm. You do not need to feel angry to use it. Notice what is around you, then choose one thing that needs your attention now.',
    muscles: '**Notice tension without assuming you are angry.** Stress might show up as tight shoulders, clenched hands, or rushing between jobs. Try the guided movements gently. Afterward, choose one manageable next step or a break. You do not need to finish every task before taking that break.',
    sensesStep: 'Try 5-4-3-2-1, then choose one manageable next step.',
    musclesStep: 'Try Muscle Release gently, then choose a next step or a break.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, choose one manageable next step, such as opening one message.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, choose one manageable next step or a break.',
  },
  {
    track: 'overthinking',
    sensesTitle: 'Return to your surroundings when a worry repeats',
    musclesTitle: 'Give tense muscles a break while thoughts keep coming',
    senses: '**Notice when the same worry keeps returning.** Perhaps you keep replaying a conversation or imagining what could go wrong tomorrow. This plan helps you practise returning to what is happening now. The Reset does not answer the worry. It gives you a different thing to notice before choosing an available action.',
    muscles: '**You can rest your muscles while thoughts keep coming.** Worry can happen while your hands or shoulders feel tense. Follow this gentle practice without trying to force your thoughts away. Afterward, notice whether there is one useful action available. If not, you can leave the question unanswered for now.',
    sensesStep: 'Try 5-4-3-2-1, then choose an action or leave the worry unanswered.',
    musclesStep: 'Try Muscle Release gently without needing to stop your thoughts.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, choose one useful action you can take, or leave the worry unanswered for now.',
    musclesAction: 'Open **Muscle Release** in today’s plan. Let your muscles rest between prompts. Your thoughts do not need to stop for you to finish.',
  },
  {
    track: 'anger',
    sensesTitle: 'Pause and notice your surroundings before replying',
    musclesTitle: 'Notice tight muscles before irritation grows',
    senses: '**Pause before replying when irritation rises.** Perhaps someone interrupts you and you want to answer sharply. This plan is about noticing that moment and choosing your response. Try noticing your surroundings before returning to the conversation. You can still explain what bothered you, without replying in the first rush.',
    muscles: '**Notice what your body does when you lose patience.** Your hands might clench or your shoulders might rise. Try this gentle guided practice during a quiet moment, so you know what holding and letting go feel like. When irritation comes later, notice the tension and pause before choosing your words.',
    sensesStep: 'Try 5-4-3-2-1, then pause before choosing a reply.',
    musclesStep: 'Try Muscle Release gently and notice one place that holds tension.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. Next time irritation rises, take a pause before choosing what to say.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, notice one place where you held tension. Use that sign as a reminder to pause.',
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
