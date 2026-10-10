import type { LessonDefinition } from '../lessonBlock';

/** Practical lessons for repeated worries and uncertain everyday choices. */
export const WORRY_LESSONS = [
  {
    id: 'worry.loop',
    title: 'Notice when the same worry keeps returning',
    step: 'Write one repeated worry and check for a useful next action.',
    blocks: [
      { kind: 'text', text: 'You may find yourself rereading a message and wondering again whether it sounded rude. Each reread brings back the question, but no answer. When that happens, it helps to **notice whether you are learning anything new**, rather than trying to force yourself to stop thinking.' },
      { kind: 'text', text: 'A useful check answers a specific question, such as whether you included the right meeting time. Worrying about every possible reaction may leave the same uncertainty in place. **Look at what the thinking gives you**: a new fact, an action you can take, or the same unanswered question.' },
      { kind: 'reveal', prompt: 'Tap each part of a message example.', items: [
        { label: 'A useful check', detail: 'You check whether you sent the correct date. If it is wrong, you can send a correction. The check answers a specific question.' },
        { label: 'The repeated worry', detail: 'You keep wondering whether the person dislikes your wording, but no new reply or information has arrived. Another reread may not answer that question.' },
        { label: 'An available action', detail: 'If clarification is genuinely needed, write a clear question. If nothing needs correcting now, note the worry and choose what you will do next.' },
      ] },
      { kind: 'text', text: 'If no new information is available, write a short description such as “I am worried about how my message sounded.” That lets you **record the concern without treating it as a fact**. You can return to it if a reply arrives or something practical needs your attention.' },
      { kind: 'choice', prompt: 'You reread a message and find no mistake or new information. What could you try?', options: [
        { label: 'Note the worry and return to my next activity', feedback: 'The concern may still be there. You can choose an ordinary next activity without settling what the other person thinks.' },
        { label: 'Check whether a specific clarification is needed', feedback: 'Keep the question concrete. A missing date may need clarification; guessing every possible reaction does not give you the same clear action.' },
      ] },
      { kind: 'text', text: 'If you would like something simple to follow before moving on, open a Reset. Resets are short guided practices on your plan, and you can search for one on the Explore tab any time. **Follow the prompts, then return to your next activity**. If a worry interrupts, continue from where you are rather than restarting.' },
      { kind: 'do', text: 'Write down one worry that keeps returning and **check whether there is new information or a useful action**. If neither is available now, choose your next activity. You can begin it even while the concern is still there.' },
    ],
    source: 'Author practical example: distinguishing repeated everyday thinking from a specific information check, without diagnosis or a promised treatment effect.',
  },
  {
    id: 'worry.facts',
    title: 'Separate what you know from what you fear',
    step: 'Write one known fact, one worry, and one available next action.',
    blocks: [
      { kind: 'text', text: 'When you are worried, a possible explanation can start to feel certain. It helps to **separate what happened from what you fear it means**. This gives you a clearer picture of the information you have, the part that is still unknown, and anything that needs doing.' },
      { kind: 'text', text: 'For example, a friend has not replied to your message. You know there is no reply yet, and you may worry that they are upset with you. **The worry describes one possible reason**, but you cannot confirm it from the missing reply alone.' },
      { kind: 'list', items: [
        { term: 'What I know', text: 'Write what you can check: I sent the message this morning and have not received a reply. Avoid adding a reason you have not confirmed.' },
        { term: 'What I fear', text: 'Write the worry separately: I am afraid they are annoyed. Naming a fear does not mean it is true or that it must be ignored.' },
        { term: 'What I can do', text: 'Check whether anything practical needs attention. If the message was urgent, use an appropriate way to contact them. Otherwise, you may be able to wait.' },
      ] },
      { kind: 'text', text: 'You also do not need to replace that fear with a reassuring guess. “They must be busy” is uncertain too. For now, **you can leave the reason unknown**. That is an honest description of the information you have, and it leaves room to learn more later.' },
      { kind: 'choice', prompt: 'A friend has not replied. Which sentence separates the fact from the worry?', options: [
        { label: 'There is no reply yet, and I am worried they are upset', feedback: 'This names both parts without presenting the worry as confirmed. Now check whether the situation needs an actual next action.' },
        { label: 'I do not know why they have not replied', feedback: 'This honestly names the missing information. You can decide what to do using the urgency of the message rather than an assumed explanation.' },
      ] },
      { kind: 'text', text: 'With those parts separated, consider what the message actually needs. An urgent arrangement may call for another way to contact your friend, while an ordinary chat may be able to wait. **Choose your next step using the situation’s practical details**, rather than treating either a feared or reassuring explanation as confirmed.' },
      { kind: 'do', text: 'Choose a current worry and **write the fact and the fear separately**. Then name one available action, or say what information you are waiting for before returning to your next activity.' },
    ],
    source: 'Author practical example: separating checked information from an uncertain interpretation in an everyday situation, without promising a change in anxiety.',
  },
  {
    id: 'worry.uncertainty',
    title: 'Take one step without knowing everything',
    step: 'Choose a small, reversible next step using the information you have.',
    blocks: [
      { kind: 'text', text: 'You might want to try a class or write a message while still wondering whether it will go well. Some questions can be answered beforehand, and others only become clear later. Begin by **checking what you need to know for the first small step**, so the whole decision does not have to happen at once.' },
      { kind: 'text', text: 'For an ordinary choice, that first step can be something you can easily change. Reading a class description does not require booking, and writing a draft does not require sending it. **A step you can undo or adjust** lets you learn more without committing to every part of the decision.' },
      { kind: 'reveal', prompt: 'Tap the parts of trying an unfamiliar class.', items: [
        { label: 'Important information', detail: 'Check the time, location, cost, accessibility, and any requirements that matter to you. These details may affect whether the class is practical or suitable.' },
        { label: 'Still unknown', detail: 'You may not know whether you will enjoy the class or meet someone friendly. Those questions can remain unanswered while you gather the practical details.' },
        { label: 'A small first step', detail: 'Read the description or ask the organizer a specific question. You are gathering information, not promising to attend every future class.' },
      ] },
      { kind: 'text', text: 'As you begin, keep clear what you have actually chosen. Opening a document only means opening it; writing one paragraph does not mean it must stay unchanged. **Leaving the next decision open** makes room to review what you learn before choosing whether to continue.' },
      { kind: 'choice', prompt: 'You want to draft a message but do not know the perfect wording. What could you do?', options: [
        { label: 'Write a draft that I can review before sending', feedback: 'A draft lets you try words without sending them. You can check the important details and change it afterward.' },
        { label: 'Write down the main point before choosing the words', feedback: 'This gives you a small starting action. The final wording can remain undecided while you clarify what the message needs to say.' },
      ] },
      { kind: 'text', text: 'This approach works best for ordinary choices with small consequences. Where a decision affects health, finances, or safety, you may need more reliable information and appropriate advice before acting. **Match the care you take to the consequences**, rather than feeling that every unanswered question must be ignored.' },
      { kind: 'do', text: 'Choose an ordinary decision you have been thinking about and **name one small step you can change later**. Check the information needed for that step, then try it while leaving the larger decision open.' },
    ],
    source: 'Author practical example: choosing reversible steps for ordinary decisions, without recommending risk-taking or replacing appropriate advice for consequential choices.',
  },
] as const satisfies readonly LessonDefinition[];
