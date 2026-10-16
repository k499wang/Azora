import type { LessonDefinition } from '../lessonBlock';

/** Original beginner teaching informed by public worry-management courses. */
export const TRIAL_OVERTHINKING_LESSONS = [
  {
    id: 'worry.trialloop',
    title: 'When Thinking Repeats',
    step: 'Notice one repeated question and choose your next ordinary activity.',
    blocks: [
      { kind: 'text', text: 'Thinking helps you make plans and solve problems. **A thinking loop repeats the same question** without giving you useful new information. You may ask, “Why have they not replied?” ten times and still have no answer. The problem is the repeated search, not the fact that you care about the person.' },
      { kind: 'text', text: 'Imagine you sent a friend a message. They have not replied. You read your message again, check their status, and guess that they are angry. **Checking again does not explain the silence**. They might be busy, but you do not know yet. A guess can feel convincing without becoming a fact.' },
      { kind: 'text', text: '**The same loop can happen with the past**. You might replay yesterday’s conversation and ask, “Did I sound rude?” If you remember a specific hurtful comment, you can decide whether to apologize. If you are replaying the same words without learning anything new, more replaying may leave you with the same question. Look for a useful next action rather than a perfect replay.' },
      { kind: 'text', text: 'Ask yourself: “Am I learning anything new, or asking the same thing again?” If you are repeating, name it simply: “I am going over the unanswered message again.” **Choose the next ordinary thing you need to do**, such as making lunch. You can start that activity while the question is still in your mind. You do not need to win an argument with it first.' },
      { kind: 'reveal', prompt: 'Compare useful thinking with repeated thinking.', items: [
        { label: 'Useful planning', detail: 'You need to confirm a meeting time. You send one clear question and return to your work while waiting.' },
        { label: 'A repeated search', detail: 'You reread the same message several times, hoping its words will prove whether someone likes you.' },
        { label: 'A possible stopping point', detail: 'You have no new information. Put the phone down and begin making your lunch, even if you still feel unsure.' },
      ] },
      { kind: 'choice', prompt: 'You have reread an unanswered message four times. Nothing has changed. What could you do next?', options: [
        { label: 'Notice the repeat and start making lunch', feedback: 'Lunch is a real next activity. Starting it does not require you to know why the reply is late.' },
        { label: 'Read it until I feel completely sure', feedback: 'The same words may not answer the question. Waiting for complete certainty can keep the search going.' },
      ] },
      { kind: 'do', text: '**Notice one repeated question** today. Ask whether you have new information or a useful action. If you do not, name the repeat once and start one ordinary activity. Your stopping point is starting that activity, not making every thought disappear.' },
    ],
    source: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination Original Azora prose and examples.',
  },
  {
    id: 'breath.trialworry',
    title: 'Problem or What If?',
    step: 'Write one worry and check whether you can act today.',
    blocks: [
      { kind: 'text', text: '**Put one worry into one sentence**. For example: “I might miss my bill payment.” Writing makes the concern easier to look at. You are not trying to write every possible bad outcome. One clear sentence is enough for this step.' },
      { kind: 'text', text: 'Next ask: “Is there a real problem I can do something about now?” **An unpaid bill has a possible action**: check the due date and arrange payment. “What if every payment goes wrong someday?” asks for knowledge about the future. You cannot check the whole future today. These two concerns need different responses.' },
      { kind: 'text', text: 'For an actual problem, choose one practical step. For a future possibility you cannot act on now, say, “That could happen, but I do not have a useful step today.” **Return to what you were doing**. This does not mean the future is guaranteed to go well. It means more guessing is not the job you need to do right now.' },
      { kind: 'reveal', prompt: 'See the difference in everyday worries.', items: [
        { label: 'The bill is due tomorrow', detail: 'Check the amount and how you can pay. If you cannot pay, contact the provider to ask about options.' },
        { label: 'What if I lose all my money someday?', detail: 'This broad question has no finish line. If you identify a specific planning task, schedule that task; otherwise return to today’s activity.' },
      ] },
      { kind: 'choice', prompt: 'You worry about being late tomorrow and have not checked the bus time. What is a useful first step?', options: [
        { label: 'Check the timetable and choose a bus', feedback: 'This gives you information you need and a plan you can use. You can stop after choosing the bus.' },
        { label: 'Imagine every reason the journey might fail', feedback: 'Listing every possible delay does not choose your bus. Start with the information needed for the actual journey.' },
      ] },
      { kind: 'text', text: 'Today’s **one-minute breathing Reset** is a separate pause. Follow its prompts comfortably. Breathe normally or stop if needed; the guide handles the timing.' },
      { kind: 'do', text: '**Write one worry in one sentence**. Decide whether there is a real action for today. Do or schedule that one action. If there is none, close the note and return to your next ordinary task.' },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora prose and examples.',
  },
  {
    id: 'attention.trialskillsensesoverthinking',
    title: 'Return to One Task',
    step: 'Return your attention to one small part of your current task.',
    blocks: [
      { kind: 'text', text: '**Attention means what you are noticing right now**. While washing a mug, you might notice the water, or you might be replaying an email from work. Your hands can be at the sink while your attention is on a conversation that happened hours ago. Noticing that shift gives you a chance to return.' },
      { kind: 'text', text: 'You do not need to tell yourself to stop thinking forever. **Choose one thing in the task to notice**. With the mug, notice where soap remains. Move the sponge over that part. Rinse it, put it down, and move to the next item. The task gives your attention somewhere specific to go.' },
      { kind: 'text', text: 'The email may come back into your mind. That does not mean you did the task wrong. Say, “There is that email thought,” and **return to the next small action**. You might need to return more than once. Finish the mug rather than checking whether your mind is perfectly quiet. If the email needs a reply, choose a time to handle it after the dishes.' },
      { kind: 'sequence', prompt: 'Put these steps for returning to the mug in order.', steps: [
        'Notice that you are replaying the email.',
        'Look for the part of the mug that still needs washing.',
        'Wash that part, rinse the mug, and put it down.',
      ], feedback: 'You notice where attention went, choose a specific part of the task, then continue. The thought can remain while your hands finish the job.' },
      { kind: 'choice', prompt: 'The email thought returns while you rinse the mug. What now?', options: [
        { label: 'Notice it and keep rinsing the mug', feedback: 'Returning is the skill. A thought coming back does not erase the time you spent doing the task.' },
        { label: 'Stop until I can make my mind blank', feedback: 'Waiting for a blank mind can interrupt the task again. You can rinse the mug while a thought is present.' },
      ] },
      { kind: 'text', text: 'Today’s **5-4-3-2-1 Reset** offers a separate guided way to notice your surroundings. For this lesson, practise returning to one part of an ordinary task.' },
      { kind: 'do', text: '**Choose one small task**, such as washing a mug. When you notice a repeated thought, return to the next visible action. Stop when the task is finished; you do not need a perfectly quiet mind.' },
    ],
    source: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.who.int/thailand/activities/doing-what-matters-in-times-of-stress Original Azora prose and examples.',
  },
  {
    id: 'worry.trialaction',
    title: 'Choose One Real Step',
    step: 'Write what you will do, how, and when.',
    blocks: [
      { kind: 'text', text: '**A useful action changes something about a real problem**. Suppose you are worried because you do not understand a work deadline. Asking the person responsible for the due date can help. Reading the same message repeatedly may leave you with the same missing information.' },
      { kind: 'text', text: 'Make the action small and clear. Write **what, how, and when**. What: ask which day the report is due. How: send one short email to the person who assigned it. When: after lunch today. You have a plan you can follow without solving your whole working life.' },
      { kind: 'text', text: 'After sending the question, return to another task while waiting. **Repeated checking is not always another useful step**. Refreshing your inbox every minute does not make the answer arrive sooner. You can choose the next time you normally check your messages. If you need an answer urgently for a real deadline, use an appropriate direct contact instead.' },
      { kind: 'list', items: [
        { term: 'What', text: 'Name the result you need: find out the report’s due date.' },
        { term: 'How', text: 'Name the action: send one clear question to the person who assigned it.' },
        { term: 'When', text: 'Choose an actual time: after lunch today, before starting the next report section.' },
      ] },
      { kind: 'choice', prompt: 'You have sent a clear question about the deadline. There is no urgent decision waiting. What next?', options: [
        { label: 'Continue another task and check messages at my usual time', feedback: 'You have taken the useful step available. Another task gives your waiting time a purpose.' },
        { label: 'Ask three other people whether my message sounded okay', feedback: 'More opinions may offer brief relief while leaving the deadline unanswered. Wait for the person who has the information.' },
      ] },
      { kind: 'do', text: '**Choose one actual problem**. Write one action with what, how, and when. Carry it out or schedule it, then leave the note alone until it is needed. Finish by starting the next ordinary task.' },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination Original Azora prose and examples.',
  },
  {
    id: 'worry.trialfacts',
    title: 'Facts and Guesses',
    step: 'Write one fact, one guess, and a fairer sentence.',
    blocks: [
      { kind: 'text', text: '**A fact is something you can check**. “My manager asked to speak tomorrow” is a fact if that is what their message says. “I am going to be fired” is a guess about what the meeting means. The guess may feel frightening, but that feeling does not tell you the meeting’s purpose.' },
      { kind: 'text', text: 'Write the fact and the guess on separate lines. Then ask, “What else could explain this?” The manager might want an update, need your help, or have difficult feedback. **You do not need to pick the happiest answer**. The aim is to notice that you do not yet know which explanation is right.' },
      { kind: 'text', text: 'Try a fair sentence: “My manager wants to talk. I do not know why yet. I can review my current work and listen tomorrow.” **A fair sentence leaves room for uncertainty**. It does not promise that nothing bad can happen. Read it once, choose any reasonable preparation, and continue your day instead of rewriting it until you feel certain.' },
      { kind: 'reveal', prompt: 'Look at the three parts of this example.', items: [
        { label: 'The fact', detail: 'The message asks for a conversation tomorrow. It does not give a reason.' },
        { label: 'The guess', detail: '“I will be fired” predicts an outcome that the message does not establish.' },
        { label: 'The fairer sentence', detail: '“I do not know the reason yet. I can prepare a short work update and hear what they say.”' },
      ] },
      { kind: 'choice', prompt: 'Which sentence fits the information you actually have?', options: [
        { label: 'I do not know the reason yet; I can prepare a short update', feedback: 'This admits what is unknown and gives you one reasonable action without promising a particular result.' },
        { label: 'It will definitely be good news', feedback: 'That is another prediction. A useful response does not need to replace a frightening guess with a happy guarantee.' },
      ] },
      { kind: 'do', text: '**Choose one worrying prediction**. Write the checkable fact, your guess, and one fairer sentence. Take a useful preparation step if there is one. Then close the note and continue with your day.' },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/reframing-unhelpful-thoughts/ https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination Original Azora prose and examples.',
  },
  {
    id: 'attention.trialskillmusclesoverthinkingready',
    title: 'Give Worry a Review Time',
    step: 'Choose a short daytime slot to review one nonurgent worry.',
    blocks: [
      { kind: 'text', text: 'A worry can interrupt you when you cannot usefully deal with it. **A planned review time gives it a place later**. The NHS suggests a short worry period, such as 10 to 15 minutes. You can try a daytime slot that fits your day. This is an option to test, not another task you must do perfectly.' },
      { kind: 'text', text: 'Nonurgent means it does not need action right away. If a nonurgent worry interrupts you, make **one brief note** so you can remember it. For example: “Ask about next week’s shift.” Tell yourself, “I will look at that at four.” Then return to your current activity. If the same worry returns, use the same plan. You do not need to make another note each time.' },
      { kind: 'text', text: 'At the planned time, read the note. If there is a practical problem, choose one next action. If it asks for an answer nobody can give yet, say, “I do not know yet.” **Stop at the end of the slot** and begin an ordinary activity, such as making dinner. Do not postpone urgent safety concerns, urgent health needs, or a problem that needs action before the review time.' },
      { kind: 'sequence', prompt: 'Put a nonurgent worry review in order.', steps: [
        'Note the concern once and return to your current task.',
        'At the planned time, choose an action if one is available.',
        'End the review on time and begin your next activity.',
      ], feedback: 'The review has a beginning and an end. It is a time to choose useful action or leave an unanswered question, rather than search without stopping.' },
      { kind: 'choice', prompt: 'The same nonurgent worry returns after you have noted it. What could you do?', options: [
        { label: 'Keep the existing note and return to what I am doing', feedback: 'The concern already has a place in your plan. You do not need a new note for every repetition.' },
        { label: 'Rewrite the note every time until I feel calm', feedback: 'Repeated writing can become another way to keep checking the worry. One reminder is enough for the planned review.' },
      ] },
      { kind: 'text', text: 'Today’s **Muscle Release Reset** is a separate guided pause. Follow it comfortably. The review-time skill is something you can try with a nonurgent concern during your day.' },
      { kind: 'do', text: '**Choose a short daytime review slot** and an activity to do afterward. If a nonurgent concern interrupts you, note it once. Review it at that time, choose any useful action, and stop when the slot ends.' },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora prose and examples.',
  },
  {
    id: 'quiet.trialworryquestion',
    title: 'Make Your Return Plan',
    step: 'Choose one unanswered question and return to an ordinary activity.',
    blocks: [
      { kind: 'text', text: '**An ordinary question can stay unanswered for a while**. A friend may not reply until tomorrow. You may not know how a meeting will go until it happens. Replaying these questions cannot always produce the missing information. You can care about the answer and still spend some time doing something else.' },
      { kind: 'text', text: 'Use the week’s skills in a short plan. First, notice that you are repeating a question. Next, ask whether there is a useful action now. If there is, do or schedule it. If there is not, **choose one ordinary activity to return to**. This could be eating lunch, answering a different email, or talking with the person beside you.' },
      { kind: 'text', text: '**Return to the unanswered message from day one**. The fact is that your friend has not replied. “They must be angry” is still a guess. If you need to agree a meeting time, ask that specific question. If there is nothing else to ask, put the phone down and start lunch. When the question returns, continue lunch unless new information changes what you need to do.' },
      { kind: 'text', text: 'Expect the question to return sometimes. **Repeat the return, not the whole investigation**. You do not need to reread every message or write another page to earn permission to continue your day. If worry keeps disrupting sleep, work, or relationships, consider talking with a qualified mental health professional. You can ask for support while continuing to use small everyday skills.' },
      { kind: 'list', items: [
        { term: 'Notice', text: '“I am asking why they have not replied again.” Name what is happening without insulting yourself.' },
        { term: 'Choose', text: '“I have sent the message. There is no useful next action right now.” If a real action exists, choose it.' },
        { term: 'Return', text: '“I will eat my lunch now.” Begin the activity even if the unanswered question is still present.' },
      ] },
      { kind: 'choice', prompt: 'You start lunch, then wonder about the unanswered message again. What helps you follow your plan?', options: [
        { label: 'Notice the thought and continue eating', feedback: 'The return plan allows thoughts to come back. Continuing lunch is a real use of the skill.' },
        { label: 'Start the investigation again because the thought returned', feedback: 'A returning thought is not new information. You can use the decision you already made unless the situation changes.' },
      ] },
      { kind: 'do', text: '**Choose one ordinary unanswered question**. Decide whether it needs an action now. Then name the next activity and begin it. If the question returns, return to the activity again. Finish when that activity is done, rather than when you feel completely certain.' },
    ],
    source: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.who.int/thailand/activities/doing-what-matters-in-times-of-stress Story-to-action-plan structure: https://thiswayup.org.au/what-we-treat/worry-and-rumination Original Azora prose and examples.',
  },
] as const satisfies readonly LessonDefinition[];
