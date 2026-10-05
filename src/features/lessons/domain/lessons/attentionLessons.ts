import type { LessonDefinition } from '../lessonBlock';
import { SHORT_RESET_PLAN_PURPOSE } from '../../../program/domain/programResetPurpose';

/** Shared introductions for the two guided attention Resets. */
export const SHARED_ATTENTION_LESSONS = [
  {
    id: 'attention.senses',
    title: 'Notice what is around you right now',
    step: 'Open today’s 5-4-3-2-1 Reset and follow the prompts.',
    blocks: [
      { kind: 'text', text: 'When your thoughts keep pulling you toward everything you need to do, noticing what is nearby gives you something simple to focus on. Today’s plan introduces **5-4-3-2-1**, a two-minute guided practice called a Reset. Its prompts help you notice ordinary things around you while you stay comfortably where you are.' },
      { kind: 'text', text: 'The guide takes you through one sense at a time, and its name tells you the count: **five things you see, four sounds you hear, three things you touch, two smells, and one taste**. Azora shows each step in order. You can name things silently. A chair, a distant sound, and your feet inside your shoes all count.' },
      { kind: 'text', text: 'Because this practice is about noticing what is available, **stay somewhere comfortable and safe** rather than searching the room or tasting anything new. If you cannot notice a smell or taste, remember a familiar one or skip that prompt. If a sense is unavailable to you, use another comfortable sense instead.' },
      { kind: 'choice', prompt: 'The smell prompt appears, but you cannot smell anything. What can you do?', options: [
        { label: 'Remember a familiar smell or skip it', feedback: 'Yes. There is no perfect answer to find. Use what is available and continue with the next prompt.' },
        { label: 'Search until I find two smells', feedback: 'You can stay where you are. The practice is noticing, not finding enough objects to pass a test.' },
      ] },
      { kind: 'text', text: 'As you follow the prompts, thoughts may still interrupt you. When that happens, **return to the prompt you are on** and continue from there. You do not need to restart or count perfectly. Afterward, simply notice how you feel, whether anything has changed or you feel much the same.' },
      { kind: 'do', text: 'Return to today’s plan and **open 5-4-3-2-1**. Follow one prompt at a time until the Reset ends.' },
    ],
    source: 'Author practical example: explains the existing Azora guided sensory script without claiming a clinical outcome.',
  },
  {
    id: 'attention.muscles',
    title: 'Gently tighten a muscle, then let go',
    step: 'Open today’s Muscle Release Reset and follow the prompts.',
    blocks: [
      { kind: 'text', text: 'The 5-4-3-2-1 practice focuses on your surroundings. This next practice turns your attention toward your body instead. It is called **Muscle Release**, a two-minute guided session in Azora that asks you to gently tighten muscles, then let them rest. Muscles are the parts of your body that help you move or hold a position.' },
      { kind: 'text', text: 'For example, **make a loose fist, then open your hand**. Notice the difference between holding and letting go. The guided Reset moves through your hands, shoulders, face, legs, and whole body. Each squeeze lasts five seconds, followed by ten seconds to release. The screen tells you what to do next, so you do not need to remember the order.' },
      { kind: 'text', text: 'To try this comfortably, sit or lie somewhere you can rest and **use only a gentle squeeze**. Keep breathing normally rather than holding your breath or forcing a position. When the guide says release, stop squeezing and give that part of your body time to rest.' },
      { kind: 'choice', prompt: 'A prompt asks you to tighten an area that hurts. What should you do?', options: [
        { label: 'Skip the squeeze and let that area rest', feedback: 'Yes. You can follow the release prompt without tightening. Pain is a reason to stop that movement, not squeeze harder.' },
        { label: 'Squeeze harder to finish the step', feedback: 'Keep the practice comfortable. Skip a painful movement and follow the next prompt when you are ready.' },
      ] },
      { kind: 'text', text: 'The first try gives you a chance to notice the difference between holding tension and letting go. There is **no particular feeling you have to reach afterward**. If a movement is uncomfortable, skip it or stop the Reset, so you can keep the practice gentle and suited to your body.' },
      { kind: 'reveal', prompt: 'Tap each part of a comfortable practice.', items: [
        { label: 'Gentle squeeze', detail: 'Use a small amount of effort. You do not need a strong squeeze to follow the prompt.' },
        { label: 'Let go', detail: 'Stop squeezing when the guide says release. Let that area rest while you keep breathing normally.' },
      ] },
      { kind: 'do', text: 'Return to today’s plan and **open Muscle Release**. Follow the prompts gently and skip any movement that is uncomfortable.' },
    ],
    source: 'Author practical example: explains the existing Azora guided muscle script with comfortable movement and no promised health outcome.',
  },
  {
    id: 'attention.return',
    title: 'Use what you noticed on your first try',
    step: 'Remember one detail from 5-4-3-2-1, then try today’s Reset.',
    blocks: [
      { kind: 'text', text: 'The 5-4-3-2-1 Reset uses prompts for sights, sounds, touch, smells, and taste. If you tried it yesterday, **think of one detail you remember**, such as a sound you noticed. If you did not try it, today’s plan still gives you a place to begin without catching up first.' },
      { kind: 'text', text: 'That detail can help you notice **what made the practice easier or harder**. Perhaps a window gave you plenty to look at, while a quiet room made sounds harder to find. These are useful clues about your surroundings, rather than a way to grade how well you practised.' },
      { kind: 'text', text: 'The next time this Reset appears, **use a comfortable place you already know**. Stay seated if you prefer. Name things silently. You can skip a prompt that does not fit, or use another sense. The screen guides the count, so there is nothing you need to memorize.' },
      { kind: 'choice', prompt: 'You followed the prompts but still felt distracted afterward. What does that tell you?', options: [
        { label: 'I tried the practice and noticed my experience', feedback: 'Yes. You completed the noticing practice. A particular feeling afterward is not required for the attempt to count.' },
        { label: 'I must repeat it until my thoughts stop', feedback: 'You do not need to stop your thoughts. Follow the prompts once and let yourself move on afterward.' },
      ] },
      { kind: 'text', text: 'You can use what you noticed while following **the Reset listed in today’s plan**. It may be breathing or another practice, and its screen gives you the instructions. There is no need to recreate yesterday from memory; follow the current guide one prompt at a time, returning when your attention wanders.' },
      { kind: 'do', text: 'Name one detail you remember from yesterday, if you tried it. Then **open today’s Reset** and follow its instructions.' },
    ],
    source: 'Author practical example: a next-day reflection on the guided senses Reset without requiring a mood change.',
  },
  {
    id: 'attention.week',
    title: 'Notice what helped you start this week',
    step: 'Recall yesterday’s Muscle Release, then choose one helpful detail to repeat.',
    blocks: [
      { kind: 'text', text: 'If you tried Muscle Release yesterday, you gently tightened muscles and then let them rest. **Think about one part you remember**, such as opening your hand after a loose fist or letting your shoulders drop. You might have noticed a difference, or very little; either is a useful description of your experience.' },
      { kind: 'text', text: 'By the end of this first week, your plan has introduced **different ways to practise paying attention**. The breathing guide gives you a rhythm to follow, the senses Reset focuses on your surroundings, and Muscle Release focuses on tension and release in your body. Each gives you something specific to notice.' },
      { kind: 'text', text: 'As you think about those practices, look for **one thing that made starting easier**. It might be sitting down first, opening the plan after breakfast, or reading the prompt twice. Choose a detail you can repeat. You do not need to decide which Reset is best or compare yourself with anyone else.' },
      { kind: 'choice', prompt: 'You skipped yesterday’s Muscle Release because the day was busy. What can you do today?', options: [
        { label: 'Open today’s plan and start with its first Reset', feedback: 'Yes. Today’s instructions give you a place to begin. A missed practice does not require an extra session today.' },
        { label: 'Wait until I have a perfect week', feedback: 'You can start again today. An ordinary day with a small available moment is enough to continue.' },
      ] },
      { kind: 'text', text: 'The things you noticed this week can help as **the familiar practices return in your plan**. You can continue even if you do not feel different yet. Each session will still be listed by name and duration, with its own guide, so you can learn through repeating the prompts rather than memorizing the lessons.' },
      { kind: 'do', text: 'Choose one detail that helped you start this week. **Use that detail for today’s Reset**, following the practice shown in your plan.' },
    ],
    source: 'Author practical example: reviews the first week and asks about yesterday’s guided muscle practice without a clinical claim.',
  },
  {
    id: 'attention.grows',
    title: 'Your plan now gives you another short Reset',
    step: 'Open today’s plan and follow each Reset shown there.',
    blocks: [
      { kind: 'text', text: 'You have already tried these tools on earlier days, when the plan introduced breathing and other short guided practices called Resets. From today, **your plan brings those familiar practices together more regularly**. You will see more than one Reset, each with its own name and duration. This gives you another chance to practise what you have learned, without needing to remember the steps yourself.' },
      { kind: 'text', text: 'The sessions stay manageable because **the breathing practice is still only one or two minutes**. Alongside it, another Reset gives you a different focus: noticing your surroundings in 5-4-3-2-1, or gently tightening and releasing muscles in Muscle Release. You can follow each guide at a comfortable pace.' },
      { kind: 'text', text: 'Since each Reset has a different focus, **its name helps you know what to expect**. After finishing one, return to the plan and open the next practice shown there. Its screen will explain what to do, so you can follow one prompt at a time without learning the instructions by heart.' },
      { kind: 'choice', prompt: 'You finish the first Reset and see another one in your plan. What happens next?', options: [
        { label: 'Open the next Reset and follow its own guide', feedback: 'Yes. It is a separate short practice. Its name and prompts tell you what to do, even when it differs from the first one.' },
        { label: 'Keep repeating the first Reset from memory', feedback: 'Return to the plan instead. It shows which practice comes next and provides the instructions for that practice.' },
      ] },
      { kind: 'text', text: 'As **these practices return on later days**, you can become more familiar with their prompts. A session still counts if your mood feels much the same afterward. Keep adapting it to your needs: skip an uncomfortable muscle movement or use a comfortable sense when a senses prompt is unavailable.' },
      { kind: 'sequence', prompt: 'Put the next practice in a simple order.', steps: [
        'Return to today’s plan.',
        'Read the name and open the next Reset.',
        'Follow that Reset’s prompts until it ends.',
      ], feedback: 'The plan names the practice. Its guide gives the instructions. You only need to follow one step at a time.' },
      { kind: 'do', text: 'When you return to today’s plan, **begin with one of the Resets shown there**. Follow its guide, then come back to the plan for the next practice.' },
    ],
    source: 'Author practical example: explains the current Azora short Reset schedule and navigation without promising a health outcome.',
  },
] as const satisfies readonly LessonDefinition[];


// Only the purpose and next action vary; every plan teaches the same guided steps.
const TOOL_CONTEXTS = [
  {
    plan: 'morning',
    lessonSuffix: 'morning',
    senses: 'If your thoughts are already on everything you need to do, it can help to **notice the morning around you before choosing your next step**. This Reset asks you to notice the room you are in instead. Afterward, choose one small morning step, such as opening the curtains or getting a drink.',
    muscles: 'While getting ready, you might notice raised shoulders or clenched hands. This Reset gives you a chance to **gently release some of that tension before your next morning step**. This practice is not an energy boost. Try it gently, then choose one small thing to begin your morning, such as getting dressed.',
    sensesStep: 'Try 5-4-3-2-1, then choose one small morning step.',
    musclesStep: 'Try Muscle Release gently, then choose one small morning step.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, choose one small morning step, such as opening the curtains.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, choose one small morning step, such as getting dressed.',
  },
  {
    plan: 'focus',
    lessonSuffix: 'focus',
    senses: 'After jumping between messages and unfinished work, you can **pause to notice what is around you before returning to one task**. This Reset does not finish the work for you. Afterward, choose one task and one small action that would help you start it.',
    muscles: 'After working at a screen, you might notice tense hands or raised shoulders. Taking a moment to **notice and release that tension** gives you a pause before returning to work. Follow this gentle practice before returning to your work. Then choose one small action on one task, such as opening the document you need.',
    sensesStep: 'Try 5-4-3-2-1, then choose one small action on one task.',
    musclesStep: 'Try Muscle Release gently, then return to one small work action.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, choose one task and its first small action.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, return to one task, starting with one small action.',
  },
  {
    plan: 'home',
    lessonSuffix: 'home',
    senses: 'Looking at a messy room can bring up many jobs at once. Before choosing one, you can **pause to notice what is around you**. For this Reset, simply notice what is around you. You do not have to clean while following the prompts. Afterward, choose something small, such as putting away one cup.',
    muscles: 'Thinking about everything that needs doing at home may leave you holding your shoulders up. This Reset gives you **a gentle pause before choosing one household task**. Follow the guided practice from a comfortable position. Then choose one small job, such as clearing one chair, and let the other jobs wait.',
    sensesStep: 'Try 5-4-3-2-1, then choose one small household task.',
    musclesStep: 'Try Muscle Release gently, then choose one small household task.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, choose one small household task, such as putting away a cup.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, choose one small household task, such as clearing a chair.',
  },
  {
    plan: 'phone',
    lessonSuffix: 'phone',
    senses: 'You may pick up your phone during a pause before deciding what you want to open. This Reset gives you a chance to **notice that moment before you scroll**. Use this guided Reset to notice your surroundings. Afterward, ask what you wanted from the phone. You can choose a specific use or put it down.',
    muscles: 'When you feel uncomfortable or restless, you may reach for your phone automatically. This Reset offers **a pause before deciding whether to scroll**. This gentle Reset gives you something else to do for a moment. Afterward, decide whether you need the phone for something specific or would like to put it down.',
    sensesStep: 'Try 5-4-3-2-1, then decide what you want to do with your phone.',
    musclesStep: 'Try Muscle Release gently, then decide whether to use your phone.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, choose a specific use for your phone or put it down.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, choose a specific use for your phone or put it down.',
  },
  {
    plan: 'recovery',
    lessonSuffix: 'recovery',
    senses: 'On a low-energy day, you can **try this practice from a comfortable position**, without getting up to search for anything. Notice what is already nearby while sitting or lying down. Afterward, decide what fits your energy now. Resting can be the next thing you choose.',
    muscles: 'If your energy is low, sitting or lying somewhere comfortable lets you **keep this practice gentle**, using only a small squeeze. You can follow a release prompt without tightening first. This is not a push to do more. Afterward, choose what fits your energy, including continuing to rest.',
    sensesStep: 'Try 5-4-3-2-1 comfortably, then choose what fits your energy.',
    musclesStep: 'Try Muscle Release gently, then choose what fits your energy.',
    sensesAction: 'Open **5-4-3-2-1** from a comfortable position. After the prompts, choose what fits your energy, including rest.',
    musclesAction: 'Open **Muscle Release** from a comfortable position. Skip uncomfortable movements. Afterward, choose what fits your energy, including rest.',
  },
  {
    plan: 'selfTrust',
    lessonSuffix: 'selftrust',
    senses: 'Following through becomes easier to recognize when you choose something manageable. This practice gives you **one small action to try without demanding a perfect result**. Today that means trying the noticing prompts. You do not need to feel calm afterward to say you tried. Notice the action you took instead of grading the feeling it produced.',
    muscles: 'Today, trying the guided prompts comfortably gives you **a small action you can follow through on gently**. Skipping a painful movement is a sensible choice, not a failed promise. Afterward, name what you actually did. You do not need to feel fully relaxed for your attempt to count.',
    sensesStep: 'Try 5-4-3-2-1, then name the small action you followed through on.',
    musclesStep: 'Try Muscle Release gently, then name the small action you took.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, name the small action you took, without grading your mood.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, name what you did, without demanding a perfect feeling.',
  },
  {
    plan: 'quiet',
    lessonSuffix: 'quiet',
    senses: 'This plan gives you short chances to practise paying attention, beginning with **noticing your surroundings while thoughts come and go**. Today you will notice ordinary sights, sounds, and other sensations. When a thought interrupts you, follow the current prompt again. Coming back to noticing is the practice.',
    muscles: 'After noticing your surroundings with the senses Reset, you can turn your attention toward **holding tension and letting go in your body**. Today’s practice asks you to notice muscles tightening and resting. You do not need to stop thinking. Follow each comfortable prompt, then notice one feeling in your body afterward.',
    sensesStep: 'Try 5-4-3-2-1, then notice one thing around you.',
    musclesStep: 'Try Muscle Release gently, then notice one comfortable body feeling.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, notice one thing around you, such as a sound.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, notice one comfortable body feeling, such as your feet resting.',
  },
] as const;

export function attentionLessonForPurpose<Id extends string>(
  base: LessonDefinition,
  id: Id,
  context: string,
  step: string,
  action: string,
): LessonDefinition & { id: Id } {
  return {
    ...base,
    id,
    step,
    blocks: [
      { kind: 'text', text: context },
      ...base.blocks.slice(0, -1),
      { kind: 'do', text: action },
    ],
  };
}

const PLAN_ATTENTION_LESSONS = TOOL_CONTEXTS.flatMap((context) => {
  const senses = SHARED_ATTENTION_LESSONS[0];
  const muscles = SHARED_ATTENTION_LESSONS[1];
  return [
    attentionLessonForPurpose(senses, `attention.senses${context.lessonSuffix}`,
      `${SHORT_RESET_PLAN_PURPOSE[context.plan]} ${context.senses}`, context.sensesStep, context.sensesAction),
    attentionLessonForPurpose(muscles, `attention.muscles${context.lessonSuffix}`,
      `${SHORT_RESET_PLAN_PURPOSE[context.plan]} ${context.muscles}`, context.musclesStep, context.musclesAction),
  ];
});

/** The current introduction teaches the movement without a practice review. */
export const TEACHING_MUSCLE_LESSON: LessonDefinition = {
  ...SHARED_ATTENTION_LESSONS[1],
  blocks: [
    { kind: 'text', text: 'You may notice that your hands stay clenched or your shoulders stay raised when you are busy. Today’s plan introduces **Muscle Release**, a two-minute guided practice called a Reset. It helps you explore the difference between gently tightening your muscles and letting them rest, with prompts that explain each movement.' },
    ...SHARED_ATTENTION_LESSONS[1].blocks.slice(1),
  ],
};

const TEACHING_PLAN_MUSCLE_LESSONS = TOOL_CONTEXTS.map((context) =>
  attentionLessonForPurpose(TEACHING_MUSCLE_LESSON, `attention.muscles${context.lessonSuffix}ready`,
    `${SHORT_RESET_PLAN_PURPOSE[context.plan]} ${context.plan === 'quiet'
      ? 'Today’s practice turns your attention toward **the difference between muscles tightening and resting**. You do not need to stop thinking. Follow each comfortable prompt and let the guide tell you when to release.'
      : context.muscles}`, context.musclesStep, context.musclesAction),
);

export const ATTENTION_LESSONS = [
  ...SHARED_ATTENTION_LESSONS,
  ...PLAN_ATTENTION_LESSONS,
  ...TEACHING_PLAN_MUSCLE_LESSONS,
] as const satisfies readonly LessonDefinition[];
