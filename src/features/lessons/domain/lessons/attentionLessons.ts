import type { LessonDefinition } from '../lessonBlock';
import { SHORT_RESET_PLAN_PURPOSE } from '../../../program/domain/programResetPurpose';

/** Shared introductions for the two guided attention Resets. */
export const SHARED_ATTENTION_LESSONS = [
  {
    id: 'attention.senses',
    title: 'Notice what is around you right now',
    step: 'Open today’s 5-4-3-2-1 Reset and follow the prompts.',
    blocks: [
      { kind: 'text', text: 'Today you will try **5-4-3-2-1**, a two-minute Reset in Azora. A Reset is a short guided practice. This one asks you to notice ordinary things around you. You do not need to close your eyes, change your breathing, or make your thoughts disappear.' },
      { kind: 'text', text: 'The name tells you what to count: **five things you see, four sounds you hear, three things you touch, two smells, and one taste**. Azora shows each step in order. You can name things silently. A chair, a distant sound, and your feet inside your shoes all count.' },
      { kind: 'text', text: '**Stay where you are comfortable and safe.** You do not need to search the room or taste anything new. If you cannot notice a smell or taste, remember a familiar one or skip that prompt. If a sense is unavailable to you, use another comfortable sense instead.' },
      { kind: 'choice', prompt: 'The smell prompt appears, but you cannot smell anything. What can you do?', options: [
        { label: 'Remember a familiar smell or skip it', feedback: 'Yes. There is no perfect answer to find. Use what is available and continue with the next prompt.' },
        { label: 'Search until I find two smells', feedback: 'You can stay where you are. The practice is noticing, not finding enough objects to pass a test.' },
      ] },
      { kind: 'text', text: '**Finishing the prompts is enough.** You might feel different afterward, or you might feel much the same. Both are useful things to notice. When a thought interrupts you, read the current prompt and continue. You do not need to restart the timer or get the count exactly right.' },
      { kind: 'do', text: 'Return to today’s plan and **open 5-4-3-2-1**. Follow one prompt at a time until the Reset ends.' },
    ],
    source: 'Author practical example: explains the existing Azora guided sensory script without claiming a clinical outcome.',
  },
  {
    id: 'attention.muscles',
    title: 'Gently tighten a muscle, then let go',
    step: 'Open today’s Muscle Release Reset and follow the prompts.',
    blocks: [
      { kind: 'text', text: 'Think back to your 5-4-3-2-1 Reset. Did you try noticing your surroundings? Today you will try **Muscle Release**, a two-minute Reset in Azora. A Reset is a short guided practice. This one asks you to gently tighten a small group of muscles, then let it relax. Muscles are the parts of your body you use to move and hold a position.' },
      { kind: 'text', text: 'For example, **make a loose fist, then open your hand**. Notice the difference between holding and letting go. The guided Reset moves through your hands, shoulders, face, legs, and whole body. Each squeeze lasts five seconds, followed by ten seconds to release. The screen tells you what to do next, so you do not need to remember the order.' },
      { kind: 'text', text: '**Use a gentle squeeze, not your strongest one.** Keep breathing normally. You do not need to hold your breath or force your body into a position. Sit or lie somewhere comfortable. When the prompt says release, stop squeezing and let that part of your body rest.' },
      { kind: 'choice', prompt: 'A prompt asks you to tighten an area that hurts. What should you do?', options: [
        { label: 'Skip the squeeze and let that area rest', feedback: 'Yes. You can follow the release prompt without tightening. Pain is a reason to stop that movement, not squeeze harder.' },
        { label: 'Squeeze harder to finish the step', feedback: 'Keep the practice comfortable. Skip a painful movement and follow the next prompt when you are ready.' },
      ] },
      { kind: 'text', text: '**You do not need to feel fully relaxed afterward.** The first try is simply a chance to notice holding and releasing. If a movement is uncomfortable, skip it. You can also stop the Reset. Following gently matters more than doing every movement exactly as it is shown.' },
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
      { kind: 'text', text: '**Did you try 5-4-3-2-1 yesterday?** That is the Reset where Azora asks you to notice sights, sounds, touch, smells, and taste. If you tried it, think of one prompt you remember. If you did not, you can still do today’s plan. You do not need to catch up first.' },
      { kind: 'text', text: '**Ask what made it easy or awkward.** Perhaps sitting by a window gave you things to see. Perhaps the room was quiet and sounds were hard to find. These are details about your surroundings. They do not mean you did the practice well or badly.' },
      { kind: 'text', text: 'The next time this Reset appears, **use a comfortable place you already know**. Stay seated if you prefer. Name things silently. You can skip a prompt that does not fit, or use another sense. The screen guides the count, so there is nothing you need to memorize.' },
      { kind: 'choice', prompt: 'You followed the prompts but still felt distracted afterward. What does that tell you?', options: [
        { label: 'I tried the practice and noticed my experience', feedback: 'Yes. You completed the noticing practice. A particular feeling afterward is not required for the attempt to count.' },
        { label: 'I must repeat it until my thoughts stop', feedback: 'You do not need to stop your thoughts. Follow the prompts once and let yourself move on afterward.' },
      ] },
      { kind: 'text', text: '**Today’s Reset is shown in your plan.** It may be breathing or another guided practice. Open the one listed for today rather than trying to recreate yesterday from memory. Each short practice has its own instructions. You can finish it one prompt at a time, even when your attention wanders.' },
      { kind: 'do', text: 'Name one detail you remember from yesterday, if you tried it. Then **open today’s Reset** and follow its instructions.' },
    ],
    source: 'Author practical example: a next-day reflection on the guided senses Reset without requiring a mood change.',
  },
  {
    id: 'attention.week',
    title: 'Notice what helped you start this week',
    step: 'Recall yesterday’s Muscle Release, then choose one helpful detail to repeat.',
    blocks: [
      { kind: 'text', text: '**Did you try Muscle Release yesterday?** That is the Reset where you gently tighten a muscle and then let it rest. Think about one part you remember. Was a loose fist comfortable? Did letting your shoulders drop feel different? “I did not notice much” is an answer too.' },
      { kind: 'text', text: '**You have reached the end of your first week.** Your plan has introduced short breathing and attention practices. Attention means what you are noticing at a given moment. The senses Reset points it at your surroundings. Muscle Release points it at holding and letting go in your body.' },
      { kind: 'text', text: '**Look for one thing that made starting easier.** It might be sitting down first, opening the plan after breakfast, or reading the prompt twice. Choose a detail you can repeat. You do not need to decide which Reset is best or compare yourself with anyone else.' },
      { kind: 'choice', prompt: 'You skipped yesterday’s Muscle Release because the day was busy. What can you do today?', options: [
        { label: 'Open today’s plan and start with its first Reset', feedback: 'Yes. Today’s instructions give you a place to begin. A missed practice does not require an extra session today.' },
        { label: 'Wait until I have a perfect week', feedback: 'You can start again today. An ordinary day with a small available moment is enough to continue.' },
      ] },
      { kind: 'text', text: '**You can continue without feeling different yet.** This week gave you chances to try the instructions and learn what fits. Tomorrow the tools you have already tried become a regular part of your plan. You will still see each practice listed by name, with its duration. Nothing depends on remembering this whole lesson or doing the practices from memory.' },
      { kind: 'do', text: 'Choose one detail that helped you start this week. **Use that detail for today’s Reset**, following the practice shown in your plan.' },
    ],
    source: 'Author practical example: reviews the first week and asks about yesterday’s guided muscle practice without a clinical claim.',
  },
  {
    id: 'attention.grows',
    title: 'Your plan now gives you another short Reset',
    step: 'Open today’s plan and follow each Reset shown there.',
    blocks: [
      { kind: 'text', text: '**Today familiar tools become a regular part of your plan.** A Reset is a short guided practice in Azora. You have already tried these tools on earlier days. From today, they appear regularly alongside short breathing. You will see more than one Reset listed in today’s plan. Each has its own name and duration. Open one, finish its prompts, and return to the plan to see the next one.' },
      { kind: 'text', text: '**Breathing stays short: one or two minutes.** Follow the breathing guide at a comfortable pace. The other Reset gives you a different thing to practise. It might ask you to notice your surroundings with 5-4-3-2-1, or to gently tighten and release muscles with Muscle Release.' },
      { kind: 'text', text: '**Read the name before you start.** 5-4-3-2-1 asks you to notice sights, sounds, touch, smells, and taste. Muscle Release asks you to gently squeeze and let go. The breathing guide asks you to follow its breathing pattern. Each screen explains its own steps, so you do not need to learn them by heart.' },
      { kind: 'choice', prompt: 'You finish the first Reset and see another one in your plan. What happens next?', options: [
        { label: 'Open the next Reset and follow its own guide', feedback: 'Yes. It is a separate short practice. Its name and prompts tell you what to do, even when it differs from the first one.' },
        { label: 'Keep repeating the first Reset from memory', feedback: 'Return to the plan instead. It shows which practice comes next and provides the instructions for that practice.' },
      ] },
      { kind: 'text', text: '**Practices will return on later days.** That gives you another chance to use their prompts without adding new instructions every time. You do not have to feel calm or energized for a practice to count. If a muscle movement is uncomfortable, skip it. Use a comfortable sense if a senses prompt is unavailable.' },
      { kind: 'sequence', prompt: 'Put the next practice in a simple order.', steps: [
        'Return to today’s plan.',
        'Read the name and open the next Reset.',
        'Follow that Reset’s prompts until it ends.',
      ], feedback: 'The plan names the practice. Its guide gives the instructions. You only need to follow one step at a time.' },
      { kind: 'do', text: 'Return to today’s plan. **Open each Reset shown there**, one at a time, and follow its own prompts.' },
    ],
    source: 'Author practical example: explains the current Azora short Reset schedule and navigation without promising a health outcome.',
  },
] as const satisfies readonly LessonDefinition[];


// Only the purpose and next action vary; every plan teaches the same guided steps.
const TOOL_CONTEXTS = [
  {
    plan: 'morning',
    lessonSuffix: 'morning',
    senses: '**Notice the morning before deciding what to do next.** Perhaps your thoughts are already on everything you need to do. This Reset asks you to notice the room you are in instead. Afterward, choose one small morning step, such as opening the curtains or getting a drink.',
    muscles: '**Let go of a little tension before your next morning step.** You might notice raised shoulders or clenched hands while getting ready. This practice is not an energy boost. Try it gently, then choose one small thing to begin your morning, such as getting dressed.',
    sensesStep: 'Try 5-4-3-2-1, then choose one small morning step.',
    musclesStep: 'Try Muscle Release gently, then choose one small morning step.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, choose one small morning step, such as opening the curtains.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, choose one small morning step, such as getting dressed.',
  },
  {
    plan: 'focus',
    lessonSuffix: 'focus',
    senses: '**Pause before returning to one task.** If your attention has jumped between messages and unfinished work, notice the things around you for a moment. This Reset does not finish the work for you. Afterward, choose one task and one small action that would help you start it.',
    muscles: '**Notice what you are holding while you work.** You might have tense hands or raised shoulders after looking at a screen. Follow this gentle practice before returning to your work. Then choose one small action on one task, such as opening the document you need.',
    sensesStep: 'Try 5-4-3-2-1, then choose one small action on one task.',
    musclesStep: 'Try Muscle Release gently, then return to one small work action.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, choose one task and its first small action.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, return to one task, starting with one small action.',
  },
  {
    plan: 'home',
    lessonSuffix: 'home',
    senses: '**Pause before starting one small household task.** Looking at a messy room can bring up many jobs at once. For this Reset, simply notice what is around you. You do not have to clean while following the prompts. Afterward, choose something small, such as putting away one cup.',
    muscles: '**Give yourself a gentle pause before a household task.** You might be holding your shoulders up while thinking about everything that needs doing. Follow the guided practice from a comfortable position. Then choose one small job, such as clearing one chair, and let the other jobs wait.',
    sensesStep: 'Try 5-4-3-2-1, then choose one small household task.',
    musclesStep: 'Try Muscle Release gently, then choose one small household task.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, choose one small household task, such as putting away a cup.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, choose one small household task, such as clearing a chair.',
  },
  {
    plan: 'phone',
    lessonSuffix: 'phone',
    senses: '**Notice the moment before you scroll.** Perhaps you picked up your phone during a pause without choosing what to open. Use this guided Reset to notice your surroundings. Afterward, ask what you wanted from the phone. You can choose a specific use or put it down.',
    muscles: '**Pause before following the urge to scroll.** You may reach for your phone when you feel uncomfortable or restless. This gentle Reset gives you something else to do for a moment. Afterward, decide whether you need the phone for something specific or would like to put it down.',
    sensesStep: 'Try 5-4-3-2-1, then decide what you want to do with your phone.',
    musclesStep: 'Try Muscle Release gently, then decide whether to use your phone.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, choose a specific use for your phone or put it down.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, choose a specific use for your phone or put it down.',
  },
  {
    plan: 'recovery',
    lessonSuffix: 'recovery',
    senses: '**Try a small practice from a comfortable position.** On a low-energy day, you do not have to get up and search for things. Notice what is already nearby while sitting or lying down. Afterward, decide what fits your energy now. Resting can be the next thing you choose.',
    muscles: '**Keep this practice gentle on a low-energy day.** Sit or lie somewhere comfortable and use only a small squeeze. You can follow a release prompt without tightening first. This is not a push to do more. Afterward, choose what fits your energy, including continuing to rest.',
    sensesStep: 'Try 5-4-3-2-1 comfortably, then choose what fits your energy.',
    musclesStep: 'Try Muscle Release gently, then choose what fits your energy.',
    sensesAction: 'Open **5-4-3-2-1** from a comfortable position. After the prompts, choose what fits your energy, including rest.',
    musclesAction: 'Open **Muscle Release** from a comfortable position. Skip uncomfortable movements. Afterward, choose what fits your energy, including rest.',
  },
  {
    plan: 'selfTrust',
    lessonSuffix: 'selftrust',
    senses: '**Practise one small action without demanding a perfect result.** Your plan is about following through on something manageable. Today that means trying the noticing prompts. You do not need to feel calm afterward to say you tried. Notice the action you took instead of grading the feeling it produced.',
    muscles: '**Follow through gently, without forcing a result.** Your small action today is to try the guided prompts comfortably. Skipping a painful movement is a sensible choice, not a failed promise. Afterward, name what you actually did. You do not need to feel fully relaxed for your attempt to count.',
    sensesStep: 'Try 5-4-3-2-1, then name the small action you followed through on.',
    musclesStep: 'Try Muscle Release gently, then name the small action you took.',
    sensesAction: 'Open **5-4-3-2-1** in today’s plan. After the prompts, name the small action you took, without grading your mood.',
    musclesAction: 'Open **Muscle Release** in today’s plan. After the prompts, name what you did, without demanding a perfect feeling.',
  },
  {
    plan: 'quiet',
    lessonSuffix: 'quiet',
    senses: '**Notice your surroundings without trying to empty your mind.** This plan gives you short chances to practise paying attention. Today you will notice ordinary sights, sounds, and other sensations. When a thought interrupts you, follow the current prompt again. Coming back to noticing is the practice.',
    muscles: '**Notice holding and letting go in your body.** Yesterday’s senses Reset asked you to notice your surroundings. Today’s practice asks you to notice muscles tightening and resting. You do not need to stop thinking. Follow each comfortable prompt, then notice one feeling in your body afterward.',
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
    { kind: 'text', text: 'Today you will try **Muscle Release**, a two-minute Reset in Azora. A Reset is a short guided practice. This one asks you to gently tighten a small group of muscles, then let it relax. Muscles are the parts of your body you use to move and hold a position.' },
    ...SHARED_ATTENTION_LESSONS[1].blocks.slice(1),
  ],
};

const TEACHING_PLAN_MUSCLE_LESSONS = TOOL_CONTEXTS.map((context) =>
  attentionLessonForPurpose(TEACHING_MUSCLE_LESSON, `attention.muscles${context.lessonSuffix}ready`,
    `${SHORT_RESET_PLAN_PURPOSE[context.plan]} ${context.plan === 'quiet'
      ? '**Notice holding and letting go in your body.** Today’s practice asks you to notice muscles tightening and resting. You do not need to stop thinking. Follow each comfortable prompt and let the guide tell you when to release.'
      : context.muscles}`, context.musclesStep, context.musclesAction),
);

export const ATTENTION_LESSONS = [
  ...SHARED_ATTENTION_LESSONS,
  ...PLAN_ATTENTION_LESSONS,
  ...TEACHING_PLAN_MUSCLE_LESSONS,
] as const satisfies readonly LessonDefinition[];
