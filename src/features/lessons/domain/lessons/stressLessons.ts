import type { LessonDefinition } from '../lessonBlock';

/** Practical lessons for feeling overwhelmed, without assuming anger. */
export const STRESS_LESSONS = [
  {
    id: 'stress.signs',
    title: 'Notice how stress shows up for you',
    step: 'Name one sign of stress and one thing you need next.',
    blocks: [
      { kind: 'text', text: 'When several demands arrive at once, you might feel rushed, tense, or unsure where to begin. Stress looks different for different people, so it helps to **notice what changes for you**. Those changes can give you a reason to pause and consider what you need.' },
      { kind: 'text', text: 'To find your own signs, think about a recent moment when everything felt too much. Describe what happened without judging yourself. You may have raised your shoulders, reread a message, or avoided opening a bill. **A clear description gives you something to recognize next time**.' },
      { kind: 'list', items: [
        { term: 'Body', text: 'Notice a clenched hand, raised shoulders, or another change you recognize. A body feeling alone does not tell you its cause.' },
        { term: 'Thoughts', text: 'Notice phrases such as I cannot finish everything or I do not know where to start. You can write the phrase down.' },
        { term: 'Actions', text: 'Notice rushing, switching between tasks, or putting something off. Describe the action without calling yourself lazy or difficult.' },
      ] },
      { kind: 'text', text: 'For example, several messages arrive while you are cooking dinner, and you keep moving between your phone and the stove. Naming the situation as **“I am trying to cook and answer messages at once”** helps explain why your attention is being pulled in different directions.' },
      { kind: 'choice', prompt: 'You notice raised shoulders while looking at several unfinished tasks. What could you say?', options: [
        { label: 'My shoulders are tense and I have several tasks waiting', feedback: 'This describes what you noticed. Next, consider whether you need a pause, clearer priorities, or help with a task.' },
        { label: 'I should be able to handle everything', feedback: 'That expectation does not explain what you need. Try naming the situation and one sign you can actually notice.' },
      ] },
      { kind: 'text', text: 'Once you see what is happening, consider what would make the next few minutes more manageable. You could put the messages aside, write down a task, or ask for help. If you want a guided pause, **a Reset gives you short prompts to follow**. Resets are short practices on your plan, and you can search for one on the Explore tab any time. Afterward, you return to deciding what the waiting tasks need.' },
      { kind: 'do', text: 'Name one sign you recognize when you feel stressed, then **choose one thing you need next**. It might be a pause, help with a task, or a clear place to begin. The whole day can wait while you choose that step.' },
    ],
    source: 'Author practical example: noticing everyday experiences and choosing a next step, without diagnosis or a promised clinical benefit.',
  },
  {
    id: 'stress.load',
    title: 'Decide what needs doing today',
    step: 'Write down your tasks and choose one that needs attention today.',
    blocks: [
      { kind: 'text', text: 'When several jobs are on your mind, each one can feel as if it needs doing immediately. Start by **writing the tasks where you can see them**, on paper or your phone. Plain descriptions such as “pay the bill” or “wash my work shirt” make it easier to compare what needs attention.' },
      { kind: 'text', text: 'With the tasks written down, check their deadlines and what would happen if they waited. A bill due today may need attention before a cupboard you want to sort. **Use the actual timing to choose a priority**, and check any deadline you do not know rather than guessing.' },
      { kind: 'reveal', prompt: 'Tap each part of a busy-day example.', items: [
        { label: 'Needs attention today', detail: 'A form must be submitted today. Check the instructions and identify the first missing detail. Ask for help if you cannot complete it alone.' },
        { label: 'Can wait', detail: 'A cupboard needs sorting, but nothing depends on finishing it today. Write it on a later list so it is recorded without becoming today’s job.' },
        { label: 'Needs a conversation', detail: 'Someone expects a task you cannot fit in. Tell them what you can do and ask which part matters most, rather than silently promising everything.' },
      ] },
      { kind: 'text', text: 'After choosing the task, make its first action specific enough to begin. “Finish the form” may still feel too large, while “find the reference number” gives you a starting point. **One clear action helps you enter the task**. If several jobs are essential, put them in order or ask for help choosing.' },
      { kind: 'choice', prompt: 'A form is due today and you also want to organize a cupboard. Where could you begin?', options: [
        { label: 'Check what the form needs before sorting the cupboard', feedback: 'The deadline gives you a reason to begin there. Choose its first small action and leave the cupboard on your later list.' },
        { label: 'Ask for help understanding the form', feedback: 'If the instructions are unclear, help may be your first useful action. You can still leave the cupboard for another day.' },
      ] },
      { kind: 'text', text: 'The remaining tasks can stay on a separate list for later. Writing them down helps you remember them without promising to finish today. When your time or circumstances change, **review that list and adjust the plan** using the deadlines and information you have then.' },
      { kind: 'do', text: 'Write down the jobs on your mind and **choose one that needs attention today**. Name its first action, and put an optional job on a later list if there is one.' },
    ],
    source: 'Author practical example: checking deadlines and organizing everyday tasks, without claiming that planning resolves every source of stress.',
  },
  {
    id: 'stress.boundary',
    title: 'Say what you can realistically do',
    step: 'Explain what you can offer before agreeing to another task.',
    blocks: [
      { kind: 'text', text: 'When someone asks for help and your day is already full, you may want to agree before checking whether you can manage it. Take a moment to **look at your existing commitments and available time**. That gives you a realistic basis for answering the request.' },
      { kind: 'text', text: 'Once you know what is possible, explain it plainly. You might be able to help with a smaller part, offer another time, or say you are unavailable. **A specific answer helps the other person plan**, because they know what you are offering and what they still need to arrange.' },
      { kind: 'list', items: [
        { term: 'Smaller task', text: 'I can check the first page, but I cannot review the whole document today. This names the part you can actually take on.' },
        { term: 'Later time', text: 'I cannot collect it this afternoon. I can go tomorrow morning if that still helps. The person can decide whether that timing works.' },
        { term: 'No availability', text: 'I cannot take that on today. This is a complete answer when you have no suitable time or capacity to offer.' },
      ] },
      { kind: 'text', text: 'For example, someone asks you to help them move when you already have another commitment. If there is enough time, you might offer to carry a few boxes before leaving. If there is not, **saying you are unavailable gives a clear answer** before they count on your help.' },
      { kind: 'choice', prompt: 'You can help with one part of a task, but not the whole job. What could you say?', options: [
        { label: 'I can do this part; can someone else handle the rest?', feedback: 'This makes your offer specific. The other person can plan around what you have actually agreed to do.' },
        { label: 'Let me check my commitments before answering', feedback: 'You can ask for time to check. Give a realistic time for your answer rather than leaving the request open indefinitely.' },
      ] },
      { kind: 'text', text: 'The person may still feel disappointed, even when your answer is fair and clear. You can listen without promising more than you can do. **Consider whether it is safe to discuss the limit directly**. If speaking up could put you at risk, seek support from someone you trust and prioritize your safety.' },
      { kind: 'do', text: 'Before agreeing to another ordinary request, **check what you can realistically offer**. Explain the task or time you can manage, or say you are unavailable, so the agreement is clear to both of you.' },
    ],
    source: 'Author practical example: discussing availability for ordinary requests, without assuming that every situation permits safe negotiation.',
  },
] as const satisfies readonly LessonDefinition[];
