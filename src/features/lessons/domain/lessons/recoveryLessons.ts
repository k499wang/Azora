import type { LessonDefinition } from '../lessonBlock';

export const RECOVERY_LESSONS = [
  {
    id: 'body.restchoice',
    title: 'Choose the rest you need',
    step: 'Choose rest that fits how you feel today.',
    blocks: [
      {
        kind: 'text',
        text: 'You can feel tired in different ways. You may want to sit after standing for a long time, or want less noise after a busy conversation. **Notice what feels tiring** before choosing a rest activity. You do not need a perfect explanation of why you are tired.',
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
        text: 'These are things you can try. Different people may need different rest. **Try what fits your day** and notice whether it feels comfortable. You may still feel tired afterward. Rest may help slowly. You can stop even if you do not feel better right away. Choose something else if what you are doing feels uncomfortable.',
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
        text: 'When several tasks need doing, another person may not know which part would help most. **Name one specific task** you would like support with. A request such as “Could you collect the parcel today?” tells them more than “I need help with everything.” Choose something you can explain clearly.',
      },
      {
        kind: 'text',
        text: 'Say when the task is needed and ask whether the person can do it. **Leave room for their answer**. They might agree, offer a different time, or be unavailable. A clear request helps both of you understand what is being asked. It does not guarantee that help will be available.',
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
        text: 'Going out takes more time and effort than the time you spend there. Meeting a friend can also mean getting ready, travelling, and putting things away when you return. **List what you need to do** before deciding whether the plan fits your day. Getting dressed and travelling take effort too. Include those parts when you look at how tired you feel.',
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
        text: 'Once you have described the parts, **check what you still need to know**. You might need bus times, help carrying something, or a time to leave. Now look at the whole list. If it feels like too much today, you could ask for help, do fewer parts, or choose another day.',
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
