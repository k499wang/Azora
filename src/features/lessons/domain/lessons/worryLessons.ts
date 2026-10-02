import type { LessonDefinition } from '../lessonBlock';

/** Practical lessons for repeated worries and uncertain everyday choices. */
export const WORRY_LESSONS = [
  {
    id: 'worry.loop',
    title: 'Notice when the same worry keeps returning',
    step: 'Write one repeated worry and check for a useful next action.',
    blocks: [
      { kind: 'text', text: 'You may think about a problem many times without finding anything new. **Notice the repeated question.** Perhaps you keep asking whether a message sounded rude or whether tomorrow will go badly. You do not have to force the thought away.' },
      { kind: 'text', text: '**Ask whether the thinking adds information.** Checking the meeting time gives you a fact. Reading the same message again may leave you with the same uncertainty. The difference is what you learn, not how long you have thought about it.' },
      { kind: 'reveal', prompt: 'Tap each part of a message example.', items: [
        { label: 'A useful check', detail: 'You check whether you sent the correct date. If it is wrong, you can send a correction. The check answers a specific question.' },
        { label: 'The repeated worry', detail: 'You keep wondering whether the person dislikes your wording, but no new reply or information has arrived. Another reread may not answer that question.' },
        { label: 'An available action', detail: 'If clarification is genuinely needed, write a clear question. If nothing needs correcting now, note the worry and choose what you will do next.' },
      ] },
      { kind: 'text', text: '**Give the worry a short description.** Write I am worried about how my message sounded. This records the concern without deciding that your fear is true. You can return to it if new information arrives.' },
      { kind: 'choice', prompt: 'You reread a message and find no mistake or new information. What could you try?', options: [
        { label: 'Note the worry and return to my next activity', feedback: 'The concern may still be there. You can choose an ordinary next activity without settling what the other person thinks.' },
        { label: 'Check whether a specific clarification is needed', feedback: 'Keep the question concrete. A missing date may need clarification; guessing every possible reaction does not give you the same clear action.' },
      ] },
      { kind: 'text', text: '**Use today’s Reset as a guided pause.** A Reset is a short practice in Azora. Follow its prompts, then return to the next activity you chose. Thoughts can interrupt the practice; you do not need to restart whenever they appear.' },
      { kind: 'do', text: '**Write one worry that keeps returning.** Check whether new information or a practical action is available. If neither is available now, choose an ordinary next activity without demanding that the worry disappear first.' },
    ],
    source: 'Author practical example: distinguishing repeated everyday thinking from a specific information check, without diagnosis or a promised treatment effect.',
  },
  {
    id: 'worry.facts',
    title: 'Separate what you know from what you fear',
    step: 'Write one known fact, one worry, and one available next action.',
    blocks: [
      { kind: 'text', text: 'A worrying thought can sound like something you already know. **Separate the event from your prediction.** They have different jobs. The event tells you what happened. The prediction describes what you fear may happen next.' },
      { kind: 'text', text: 'For example, a friend has not replied to your message. **The missing reply is a fact.** They are upset with me is a possible explanation. Without more information, you do not know why the reply has not arrived.' },
      { kind: 'list', items: [
        { term: 'What I know', text: 'Write what you can check: I sent the message this morning and have not received a reply. Avoid adding a reason you have not confirmed.' },
        { term: 'What I fear', text: 'Write the worry separately: I am afraid they are annoyed. Naming a fear does not mean it is true or that it must be ignored.' },
        { term: 'What I can do', text: 'Check whether anything practical needs attention. If the message was urgent, use an appropriate way to contact them. Otherwise, you may be able to wait.' },
      ] },
      { kind: 'text', text: '**Leave room for missing information.** You do not need to replace the worry with a cheerful guess. They might be busy is also a guess until you know. It is enough to say that the reason is currently unknown.' },
      { kind: 'choice', prompt: 'A friend has not replied. Which sentence separates the fact from the worry?', options: [
        { label: 'There is no reply yet, and I am worried they are upset', feedback: 'This names both parts without presenting the worry as confirmed. Now check whether the situation needs an actual next action.' },
        { label: 'I do not know why they have not replied', feedback: 'This honestly names the missing information. You can decide what to do using the urgency of the message rather than an assumed explanation.' },
      ] },
      { kind: 'text', text: '**Respond to what the situation needs.** A time-sensitive arrangement may need another contact attempt. An ordinary conversation may not. Use the details you can check. Separating facts and fears is not a reason to dismiss a real problem.' },
      { kind: 'do', text: 'Choose one current worry. **Write the fact and the fear separately**, then name one available action. If no action is needed now, say what information you are waiting for and return to your next activity.' },
    ],
    source: 'Author practical example: separating checked information from an uncertain interpretation in an everyday situation, without promising a change in anxiety.',
  },
  {
    id: 'worry.uncertainty',
    title: 'Take one step without knowing everything',
    step: 'Choose a small, reversible next step using the information you have.',
    blocks: [
      { kind: 'text', text: 'Some everyday choices come with unanswered questions. You might not know whether you will enjoy a class or whether your first draft will be good. **Check what you need to know now**, rather than demanding every answer before beginning.' },
      { kind: 'text', text: '**Choose a step you can change later.** A reversible step is something you can undo or adjust without a large consequence. Reading a class description is different from paying a large fee. Writing a draft is different from sending it.' },
      { kind: 'reveal', prompt: 'Tap the parts of trying an unfamiliar class.', items: [
        { label: 'Important information', detail: 'Check the time, location, cost, accessibility, and any requirements that matter to you. These details may affect whether the class is practical or suitable.' },
        { label: 'Still unknown', detail: 'You may not know whether you will enjoy the class or meet someone friendly. Those questions can remain unanswered while you gather the practical details.' },
        { label: 'A small first step', detail: 'Read the description or ask the organizer a specific question. You are gathering information, not promising to attend every future class.' },
      ] },
      { kind: 'text', text: '**Keep the size of the decision clear.** Opening a document does not commit you to finishing it today. Trying one paragraph does not mean keeping it unchanged. Name exactly what you are choosing, and what you are leaving undecided.' },
      { kind: 'choice', prompt: 'You want to draft a message but do not know the perfect wording. What could you do?', options: [
        { label: 'Write a draft that I can review before sending', feedback: 'A draft lets you try words without sending them. You can check the important details and change it afterward.' },
        { label: 'Write down the main point before choosing the words', feedback: 'This gives you a small starting action. The final wording can remain undecided while you clarify what the message needs to say.' },
      ] },
      { kind: 'text', text: '**Use extra care for decisions with serious consequences.** A small trial is useful for ordinary, adjustable choices. Important health, financial, or safety decisions may need reliable information and appropriate advice. You do not have to rush a consequential choice.' },
      { kind: 'do', text: 'Choose an ordinary decision you have been circling. **Name one small step you can change later.** Check the information needed for that step, then try it while leaving the larger decision open.' },
    ],
    source: 'Author practical example: choosing reversible steps for ordinary decisions, without recommending risk-taking or replacing appropriate advice for consequential choices.',
  },
] as const satisfies readonly LessonDefinition[];
