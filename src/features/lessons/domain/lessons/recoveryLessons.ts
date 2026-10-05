import type { LessonDefinition } from '../lessonBlock';

export const RECOVERY_LESSONS = [
  {
    id: 'body.restchoice',
    title: 'Choose the rest you need',
    step: 'Choose rest that fits how you feel today.',
    blocks: [
      {
        kind: 'text',
        text: 'After standing for a long time, you may want to sit down. After a busy conversation, you may want less noise. These are different needs, so **notice what feels tiring before choosing how to rest**. A rough sense of what you need is enough to try something suitable.',
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Your body',
            text: 'If standing or moving feels tiring, consider a comfortable place to sit or lie down, if one is available.',
          },
          {
            term: 'Noise and messages',
            text: 'If conversation, messages, or noise feel demanding, try a quiet place with fewer things to listen to or read.',
          },
          {
            term: 'Wanting company',
            text: 'If being alone feels difficult, consider resting near someone you trust or asking whether they can spend a little time with you.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'The examples above give you a few possible starting points. **Choose the one that fits how you feel today**, then notice whether it is comfortable. You may still feel tired afterward, and you can stop or change what you are doing without waiting to feel better.',
      },
      {
        kind: 'choice',
        prompt: 'You have been standing all afternoon and now have somewhere comfortable to sit. What could you try?',
        options: [
          {
            label: 'Sit down and notice whether that feels suitable',
            feedback: 'Your legs have been working while you stood. Sitting gives them a break. You may still feel tired afterward.',
          },
          {
            label: 'Pick the rest activity that should work for everyone',
            feedback: 'There is no one kind of rest for everyone. Choose something that fits how you feel and where you are now.',
          },
        ],
      },
      {
        kind: 'do',
        text: 'Today, **name what feels tiring** and choose one kind of rest that fits. Afterward, notice whether you would choose it again on a day like this.',
      },
    ],
    source: 'NHS Every Mind Matters, Problem solving: identifying a specific practical problem and considering possible solutions. https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ The particular everyday practice and examples are authored suggestions, not evidence of an energy benefit or an individual activity prescription.',
  },
  {
    id: 'body.shareload',
    title: 'Ask for one specific kind of help',
    step: 'Ask someone for help with one clearly named task.',
    blocks: [
      {
        kind: 'text',
        text: 'When several tasks need doing, you may want help but find it hard to explain what would be useful. **Choosing one specific task to ask about** gives the other person something clear to consider. “Could you collect the parcel today?” is easier to answer than “I need help with everything.”',
      },
      {
        kind: 'text',
        text: 'Once you have named the task, explain when it is needed and **ask whether the person can help**. They may agree, offer another time, or be unavailable. Listening to their answer lets you work out what is possible without assuming they can take on the task.',
      },
      {
        kind: 'sequence',
        prompt: 'Put a clear request in order.',
        steps: [
          'Choose one task you would like help with.',
          'Name the task and when it is needed.',
          'Ask whether the person can help and confirm what you both agreed.',
        ],
        feedback: 'Make sure you both know who is doing the task and when. An offer to help is easier to use when the details are clear.',
      },
      {
        kind: 'choice',
        prompt: 'A friend says they can collect the parcel tomorrow but not today. What comes next?',
        options: [
          {
            label: 'Check whether tomorrow works for you',
            feedback: 'You can accept, ask someone else, or make another plan. Their answer gives you information about the help available.',
          },
          {
            label: 'Assume they will collect it today anyway',
            feedback: 'That would leave the task unclear. Confirm the actual agreement before relying on someone to do it.',
          },
        ],
      },
      {
        kind: 'do',
        text: 'Choose **one task to ask for help with**. Tell someone what it is and when it is needed, ask whether they can help, and confirm their answer.',
      },
    ],
    source: 'NHS Every Mind Matters, Problem solving: identifying a specific practical problem and considering possible solutions. https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ The particular everyday practice and examples are authored suggestions, not evidence of an energy benefit or an individual activity prescription.',
  },
  {
    id: 'body.energycost',
    title: 'Plan for getting there and getting home',
    step: 'List what you need to do before, during, and after an activity.',
    blocks: [
      {
        kind: 'text',
        text: 'When you plan to go out, the visit itself is only part of what you will do. Getting dressed, travelling, and getting home also take time and effort. **Include those parts when considering your energy**, so you can decide whether the whole outing fits today.',
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Before',
            text: 'List what you need to get ready or bring. Getting dressed, finding an item, or finding a ride may each be part of the plan.',
          },
          {
            term: 'Getting there',
            text: 'If you need to travel, include the trip there. A long walk or bus ride is also part of what you will need to do.',
          },
          {
            term: 'During',
            text: 'List what you will do when you get there. You might choose to join one part and leave before the next part.',
          },
          {
            term: 'After',
            text: 'Include getting home and putting things away. These tasks still belong to the plan even though the main activity has ended.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Looking at the whole outing may show a detail you need to check, such as bus times or help carrying something. **Find out what would make the plan manageable** before deciding. If it still feels like too much, you could shorten the visit, ask for help, or choose another day.',
      },
      {
        kind: 'choice',
        prompt: 'You are planning to cook for a friend. What belongs in the description?',
        options: [
          {
            label: 'Shopping, preparing, cooking, and cleaning up',
            feedback: 'The meal includes these jobs too. Check what you have time and energy for, and whether someone can help with a part.',
          },
          {
            label: 'Only the time spent eating together',
            feedback: 'Eating is only one part of the plan. Getting food ready and washing dishes afterward take time and effort too.',
          },
        ],
      },
      {
        kind: 'do',
        text: 'Before planning **one activity**, list getting ready, travelling, what you will do there, and getting home. Check one thing you still need to know before deciding whether it fits today.',
      },
    ],
    source: 'NHS Every Mind Matters, Problem solving: identifying a specific practical problem and considering possible solutions. https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ The particular everyday practice and examples are authored suggestions, not evidence of an energy benefit or an individual activity prescription.',
  },
] as const satisfies readonly LessonDefinition[];
