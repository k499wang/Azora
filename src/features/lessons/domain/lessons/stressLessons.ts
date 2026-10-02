import type { LessonDefinition } from '../lessonBlock';

/** Practical lessons for feeling overwhelmed, without assuming anger. */
export const STRESS_LESSONS = [
  {
    id: 'stress.signs',
    title: 'Notice how stress shows up for you',
    step: 'Name one sign of stress and one thing you need next.',
    blocks: [
      { kind: 'text', text: 'Stress can feel different from person to person. You might feel rushed, tense, distracted, or unsure where to begin. **Notice your own signs.** You do not have to feel angry for this plan to fit you.' },
      { kind: 'text', text: 'Think of a recent moment when everything felt too much. **Describe what you noticed**, rather than judging yourself. Perhaps your shoulders were raised, you kept rereading a message, or you avoided opening a bill.' },
      { kind: 'list', items: [
        { term: 'Body', text: 'Notice a clenched hand, raised shoulders, or another change you recognize. A body feeling alone does not tell you its cause.' },
        { term: 'Thoughts', text: 'Notice phrases such as I cannot finish everything or I do not know where to start. You can write the phrase down.' },
        { term: 'Actions', text: 'Notice rushing, switching between tasks, or putting something off. Describe the action without calling yourself lazy or difficult.' },
      ] },
      { kind: 'text', text: 'For example, several messages arrive while you are making dinner. You start moving between your phone and the stove. **Name the situation clearly:** I am trying to answer messages and cook at the same time.' },
      { kind: 'choice', prompt: 'You notice raised shoulders while looking at several unfinished tasks. What could you say?', options: [
        { label: 'My shoulders are tense and I have several tasks waiting', feedback: 'This describes what you noticed. Next, consider whether you need a pause, clearer priorities, or help with a task.' },
        { label: 'I should be able to handle everything', feedback: 'That expectation does not explain what you need. Try naming the situation and one sign you can actually notice.' },
      ] },
      { kind: 'text', text: '**Choose a small next step.** You could open today’s short Reset, write down the tasks, or ask someone for practical help. A Reset is a guided practice in Azora. It does not remove the demands waiting for you.' },
      { kind: 'do', text: '**Name one sign you recognize**, then choose one thing you need next. It might be a short pause, one clear task, or help. You do not need to solve the whole day now.' },
    ],
    source: 'Author practical example: noticing everyday experiences and choosing a next step, without diagnosis or a promised clinical benefit.',
  },
  {
    id: 'stress.load',
    title: 'Decide what needs doing today',
    step: 'Write down your tasks and choose one that needs attention today.',
    blocks: [
      { kind: 'text', text: 'When several jobs are waiting, they can all feel urgent. **Put them somewhere you can see.** Use paper or a note on your phone. Write the jobs in plain words, such as pay the bill or wash the work shirt.' },
      { kind: 'text', text: '**Check what actually has a deadline.** Ask what would happen if a job waited. A bill due today may need attention now. Sorting a drawer may wait. If you do not know a deadline, check rather than guessing.' },
      { kind: 'reveal', prompt: 'Tap each part of a busy-day example.', items: [
        { label: 'Needs attention today', detail: 'A form must be submitted today. Check the instructions and identify the first missing detail. Ask for help if you cannot complete it alone.' },
        { label: 'Can wait', detail: 'A cupboard needs sorting, but nothing depends on finishing it today. Write it on a later list so it is recorded without becoming today’s job.' },
        { label: 'Needs a conversation', detail: 'Someone expects a task you cannot fit in. Tell them what you can do and ask which part matters most, rather than silently promising everything.' },
      ] },
      { kind: 'text', text: '**Choose one starting action.** Finish the form is still a large instruction. Find the reference number tells you where to begin. If more than one job is essential, decide their order or ask someone to help you choose.' },
      { kind: 'choice', prompt: 'A form is due today and you also want to organize a cupboard. Where could you begin?', options: [
        { label: 'Check what the form needs before sorting the cupboard', feedback: 'The deadline gives you a reason to begin there. Choose its first small action and leave the cupboard on your later list.' },
        { label: 'Ask for help understanding the form', feedback: 'If the instructions are unclear, help may be your first useful action. You can still leave the cupboard for another day.' },
      ] },
      { kind: 'text', text: '**Let the later list stay later.** Writing something down is not a promise to finish it today. Your available time may change. Review the list when you can and adjust it using the deadlines and information you have.' },
      { kind: 'do', text: '**Write down the jobs on your mind.** Choose one that needs attention today, name its first action, and move one optional job to a later list if there is one.' },
    ],
    source: 'Author practical example: checking deadlines and organizing everyday tasks, without claiming that planning resolves every source of stress.',
  },
  {
    id: 'stress.boundary',
    title: 'Say what you can realistically do',
    step: 'Explain what you can offer before agreeing to another task.',
    blocks: [
      { kind: 'text', text: 'A request can arrive when your day is already full. **Check before agreeing.** Look at the time, energy, and commitments you actually have. Wanting to help does not mean you can do every part of a request.' },
      { kind: 'text', text: '**Say what you can offer clearly.** You might offer a smaller task, a later time, or no help today. You do not need a long explanation. Give enough detail for the other person to understand what you are agreeing to.' },
      { kind: 'list', items: [
        { term: 'Smaller task', text: 'I can check the first page, but I cannot review the whole document today. This names the part you can actually take on.' },
        { term: 'Later time', text: 'I cannot collect it this afternoon. I can go tomorrow morning if that still helps. The person can decide whether that timing works.' },
        { term: 'No availability', text: 'I cannot take that on today. This is a complete answer when you have no suitable time or capacity to offer.' },
      ] },
      { kind: 'text', text: 'For example, someone asks for help moving while you have another commitment. **Explain the limit before promising.** You could offer to carry one box before leaving, if that is genuinely possible, or say you are unavailable.' },
      { kind: 'choice', prompt: 'You can help with one part of a task, but not the whole job. What could you say?', options: [
        { label: 'I can do this part; can someone else handle the rest?', feedback: 'This makes your offer specific. The other person can plan around what you have actually agreed to do.' },
        { label: 'Let me check my commitments before answering', feedback: 'You can ask for time to check. Give a realistic time for your answer rather than leaving the request open indefinitely.' },
      ] },
      { kind: 'text', text: '**A clear answer may still disappoint someone.** You cannot guarantee their reaction. In situations where speaking directly feels unsafe, seek support from someone you trust and prioritize your safety. This suggestion is for ordinary requests where you can discuss a limit.' },
      { kind: 'do', text: 'Before accepting another ordinary request, **check what you can actually offer**. Say the task or time you can manage, or explain that you are unavailable. Keep the agreement specific.' },
    ],
    source: 'Author practical example: discussing availability for ordinary requests, without assuming that every situation permits safe negotiation.',
  },
] as const satisfies readonly LessonDefinition[];
