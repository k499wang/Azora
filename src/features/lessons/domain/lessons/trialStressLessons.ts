import type { LessonDefinition } from '../lessonBlock';

/** Original first-week teaching: notice demands, choose actions, and make room for support. */
export const TRIAL_STRESS_LESSONS = [
  {
    id: 'stress.trialsigns',
    title: 'Spot Your Stress Pattern',
    step: 'Write what happened, what you thought, and what you did.',
    blocks: [
      { kind: 'text', text: 'Stress can happen when demands feel bigger than the time, help, or energy you have. A demand is something that needs your attention, such as a bill, a work request, or caring for someone. **Start with one recent moment**. You do not need to explain your whole life or decide whether you handled it well.' },
      { kind: 'text', text: 'Imagine you receive three messages while making dinner. You think, “Everyone needs an answer now.” You stop cooking and switch between the messages. Dinner gets late. This example has three parts: **what happened, what you thought, and what you did**. Separating them makes it easier to see where you might choose a different next step.' },
      { kind: 'text', text: 'The messages arrived: that happened. “Everyone needs an answer now” was a thought. It might be true for one message, but you have not checked yet. Replying to all three was an action. **A thought can feel urgent without being an instruction**. Tomorrow, you could check which request actually needs an answer tonight before stopping dinner.' },
      { kind: 'reveal', prompt: 'Look at the dinner example.', items: [
        { label: 'What happened?', detail: 'Three messages arrived while dinner was cooking. This describes the situation without guessing what anyone expected.' },
        { label: 'What did I think?', detail: '“Everyone needs an answer now.” This was the meaning you gave the messages before checking them.' },
        { label: 'What did I do?', detail: 'You stopped cooking and switched between messages. An action is something you could describe someone doing.' },
      ] },
      { kind: 'text', text: '**Look for a useful clue, not someone to blame**. Perhaps several requests arrive at once. Perhaps you say yes before checking your time. Sometimes the demand really is too much, and you need help or a change to the workload. Noticing your pattern helps you describe the problem clearly when deciding what to change.' },
      { kind: 'choice', prompt: 'Three messages arrive while you cook. Which sentence describes a thought?', options: [
        { label: '“Everyone needs an answer now.”', feedback: 'This is your interpretation of the messages. You can check their deadlines before deciding what to do.' },
        { label: '“Three messages arrived.”', feedback: 'This describes what happened. The thought is the meaning you gave the messages, such as assuming every reply was urgent.' },
      ] },
      { kind: 'do', text: '**Write three short lines** about one recent stressful moment: “What happened…”, “I thought…”, and “I did…”. Use ordinary details, such as a late bus or a new request. Stop after those three lines. You are collecting one example to learn from.' },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ https://www.accesstherapiesfife.scot.nhs.uk/step-on-stress/ Original Azora teaching and examples.',
  },
  {
    id: 'breath.trialstress',
    title: 'Pause Before Saying Yes',
    step: 'Check your time before answering one request.',
    blocks: [
      { kind: 'text', text: 'Someone asks, “Can you do this tonight?” You might say yes before remembering dinner, travel, and the work already waiting. **Give yourself time to check**. A pause does not have to be long. “Let me check what I have on today” is a complete answer while you work out what is possible.' },
      { kind: 'text', text: '**Find out what is needed and when**. “Can you help with this?” may mean ten minutes or a whole evening. Ask, “Which part do you need help with?” and “When do you need it?” A clear request is easier to answer than a vague one. You can then compare it with the time and energy you actually have.' },
      { kind: 'text', text: 'Suppose a friend needs help moving boxes tonight. You have half an hour before collecting your child. You could say, **“I can help from six until six thirty.”** You could also say you cannot help tonight. Offering a smaller amount of help is useful only if it really fits. You do not need to offer time you do not have.' },
      { kind: 'choice', prompt: 'A colleague asks you to finish something “soon.” What helps you answer?', options: [
        { label: 'Ask what needs doing and the actual deadline', feedback: 'Now you can compare the request with your existing work and give an answer based on the time available.' },
        { label: 'Say yes and work out the details later', feedback: 'You may agree to more than you have time for. Check the task and deadline before making the promise.' },
      ] },
      { kind: 'text', text: 'Sometimes you cannot refuse a task. **Ask which work should come first**: “I am working on the report due today. If I do this now, should the report move to tomorrow?” This makes the tradeoff clear. You are describing the available time, rather than pretending you can finish two jobs in the same hour.' },
      { kind: 'text', text: 'Today’s **one-minute breathing Reset** is a separate pause. Follow its prompts comfortably. You can breathe normally or stop if needed. You do not need to feel calm before choosing your response.' },
      { kind: 'do', text: '**Prepare one reply to a request**: “Let me check what I can manage.” Then check the task, deadline, and your available time. Choose an honest yes, a smaller offer, or a clear no. If needed, ask which existing task can wait.' },
    ],
    source: 'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/ https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ Original Azora teaching and examples.',
  },
  {
    id: 'attention.trialskillsensesstress',
    title: 'Return to This Task',
    step: 'Notice where you are and choose one task to continue.',
    blocks: [
      { kind: 'text', text: 'You sit down to answer an email, but your mind moves to tomorrow’s appointment, the washing, and another message. Soon you have four jobs open and none finished. **Notice that your attention has moved**. Attention means what you are focusing on. Moving between worries is a sign to choose what you are doing right now.' },
      { kind: 'text', text: '**Look at what is in front of you**. You might notice the screen on your desk or the mug beside it. Name your current job in ordinary words: “I am replying to this email.” This links your attention to the place and task you are in. It does not require pushing away every other thought.' },
      { kind: 'text', text: 'Now choose a small part of the job: “I will write the first sentence.” If you remember something useful, such as buying milk, put a short note somewhere you will check later. **Return to the chosen part**. You can still feel distracted or stressed while writing that sentence. Feeling settled is not a requirement for taking the next action.' },
      { kind: 'reveal', prompt: 'See a return to the email.', items: [
        { label: 'Notice the change', detail: '“I am thinking about the washing instead of this reply.” You have noticed where your attention went.' },
        { label: 'Name the current job', detail: '“I am at my desk replying to Jo.” The task is one reply, rather than every job you remembered.' },
        { label: 'Continue one part', detail: 'Write the greeting and first sentence. If your attention moves again, come back to the sentence you were writing.' },
      ] },
      { kind: 'text', text: '**Check whether something truly needs action now**. A ringing smoke alarm needs a response. Remembering next week’s shopping usually can go on a list. Returning to a task does not mean ignoring real needs. It means choosing where your attention is useful, then returning there when you notice it has wandered.' },
      { kind: 'text', text: 'Today’s **5-4-3-2-1 Reset** offers a guided way to notice your surroundings. Follow it comfortably. Afterwards, choose the task you want to return to; you do not need to wait until you feel calm.' },
      { kind: 'choice', prompt: 'You remember next week’s shopping while writing an email. What could help you continue?', options: [
        { label: 'Note the shopping for later, then write the next sentence', feedback: 'The note keeps the reminder available. You can return to the email without needing to stop every other thought.' },
        { label: 'Wait until no other thoughts arrive', feedback: 'Other thoughts may keep arriving. You can notice them and continue one small part of the chosen task.' },
      ] },
      { kind: 'do', text: '**Choose one task already in front of you**. Notice something you can see nearby, name the task, and continue one small part. For example: “I am in the kitchen washing this plate.” If another thought arrives, return to that plate when you notice.' },
    ],
    source: 'https://www.who.int/thailand/activities/doing-what-matters-in-times-of-stress https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ Original Azora teaching and examples.',
  },
  {
    id: 'stress.trialnext',
    title: 'Choose the Next Step',
    step: 'Check your deadlines and write one small next action.',
    blocks: [
      { kind: 'text', text: 'A list that says “bills, kitchen, work” can feel like three huge problems. It does not show what needs doing first or how to begin. **Write the actual jobs**: pay the electricity bill, wash the dinner plates, send the meeting notes. A clear job gives you something you can act on and eventually finish.' },
      { kind: 'text', text: '**Check the real deadlines**. Look at the bill or message instead of guessing. A bill due today may need attention before notes due next week. Also check what happens if a job waits. Food cooking on the stove needs attention now. A messy shelf usually can wait. If a deadline is unclear, ask the person who set it.' },
      { kind: 'text', text: 'After choosing a job, make its first action small enough to start. “Sort my bills” is broad. **“Open the electricity bill and find the due date”** tells you exactly what to do. It may reveal another step, such as checking your account or asking the provider about payment options. You do not need to solve every part before opening it.' },
      { kind: 'sequence', prompt: 'Put a short task list to work.', steps: [
        'Write the jobs and check their actual deadlines.',
        'Choose the job that needs your attention first.',
        'Write and begin one small action for that job.',
      ], feedback: 'Checking the deadlines first helps you choose using real information. A small action then makes the chosen job easier to begin.' },
      { kind: 'choice', prompt: '“Deal with the work report” feels too large. Which step is easier to start?', options: [
        { label: 'Open the report and list the missing sections', feedback: 'This names a visible action. The missing sections then show you what work remains.' },
        { label: 'Try harder to finish the whole report', feedback: 'This still leaves the starting point unclear. Name the first action, such as opening the file.' },
      ] },
      { kind: 'do', text: '**Write up to three jobs** and check when each is needed. Choose one. Write its first small action, such as “Find the appointment letter.” Begin that action. Keep the other jobs on the list so you can return to them after checking what matters next.' },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/ Original Azora teaching and examples.',
  },
  {
    id: 'stress.trialload',
    title: 'Make the Load Smaller',
    step: 'Ask for one specific change to a demand you face.',
    blocks: [
      { kind: 'text', text: 'Sometimes your list is too full because there is more work than one person can do. **The demands may need to change**. A better routine cannot create extra hours or replace missing support. Today, look for one demand you could reduce, share with someone, or discuss with the person who controls it.' },
      { kind: 'text', text: '**Make the request specific**. “I need help” may leave someone unsure what to do. “Could you collect the shopping on Thursday?” gives them a clear task and time. They may say yes, offer something different, or be unable to help. A clear request helps you find out what support is actually available.' },
      { kind: 'text', text: 'At work, you might say, **“These two tasks are both due Friday. I have time for one. Which should come first?”** If both matter, ask whether someone can share the work or a deadline can move. At home, you might agree to simple meals during a busy week instead of cooking a different meal every night.' },
      { kind: 'reveal', prompt: 'Three ways to change a demand.', items: [
        { label: 'Reduce it', detail: 'Make the job smaller where possible: prepare a simple meal instead of hosting a large dinner this week.' },
        { label: 'Share it', detail: 'Ask for a named part: “Can you wash the dishes tonight while I put the children to bed?”' },
        { label: 'Change the timing', detail: 'Ask before a deadline passes: “Could I send this on Monday instead of Friday?” Wait for agreement before treating the deadline as changed.' },
      ] },
      { kind: 'text', text: '**Choose someone who can help with the actual problem**. A colleague may share a task. A manager may change priorities. A friend may listen or help you prepare a request. Some pressures cannot change quickly. That does not mean you failed; you can still ask what practical support is available rather than carrying the whole problem alone.' },
      { kind: 'choice', prompt: 'You need someone to share a household job. Which request is easier to answer?', options: [
        { label: '“Could you wash the dishes tonight?”', feedback: 'This names the job and when you need help. The other person can tell you whether they can do it.' },
        { label: '“Could you help more sometime?”', feedback: 'The person may not know which job or when you mean. Name one task and a useful time.' },
      ] },
      { kind: 'do', text: '**Write one clear request** about a current demand. Name the task, the help or change you need, and when you need it. For example: “Could you collect the prescription tomorrow?” Send it or choose a suitable time to discuss it with the person who can help.' },
    ],
    source: 'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/ https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ Original Azora teaching and examples.',
  },
  {
    id: 'attention.trialskillmusclesstressready',
    title: 'Take a Useful Break',
    step: 'Pause one task and take a brief, comfortable break.',
    blocks: [
      { kind: 'text', text: 'When a day is busy, you may keep working through every gap. You finish a call and immediately open your inbox. Even a small pause can disappear. **Choose a stopping point on purpose**. For example, finish the current paragraph, save your work, and step away from the screen for a brief break.' },
      { kind: 'text', text: '**Notice extra effort you can leave out**. You might be gripping a pen long after writing, or holding your phone while it rests on the desk. If comfortable, put the item down. This is a chance to stop doing something unnecessary. You do not need to inspect your whole body, force a position, or make a feeling go away.' },
      { kind: 'text', text: 'Choose a break that fits the situation. You could sit comfortably, get some water, or look away from your screen. **Let the break be a break from the task**. Opening a different work message keeps the same demand going. You can take a brief pause before every job is finished.' },
      { kind: 'choice', prompt: 'You have saved your work and planned a short break. Which choice pauses the demand?', options: [
        { label: 'Step away from the screen and get some water', feedback: 'You have changed what you are doing and given the work a clear pause. Choose what is comfortable and accessible for you.' },
        { label: 'Open the next work message while standing up', feedback: 'You are still taking in more work. If you can, leave the messages until the break ends.' },
      ] },
      { kind: 'text', text: '**Leave a simple return note** if stopping makes you worry about losing your place: “Next: check the last two totals.” When you come back, the note tells you where to begin. Breaks do not remove an unreasonable workload. If you repeatedly have no chance to pause, that is a reason to discuss the demands and support you need.' },
      { kind: 'text', text: 'Today’s **Muscle Release Reset** is a separate guided practice. Follow its prompts only as comfortable, and skip or stop anything uncomfortable. The everyday skill here is making room for a brief break.' },
      { kind: 'do', text: '**Choose one stopping point today**. Save or put down what you are doing, leave a short return note if helpful, and take a brief comfortable break. Choose something simple, such as sitting quietly or getting water. Return to the named next step when the break ends.' },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/ Original Azora teaching and examples.',
  },
  {
    id: 'stress.trialplan',
    title: 'Plan for the Next Time',
    step: 'Write when you will use one helpful action again.',
    blocks: [
      { kind: 'text', text: 'A useful week does not have to end with all your stress gone. **Look for one action that helped you handle a moment**. Perhaps checking a deadline stopped you rushing unnecessarily. Perhaps a clear request helped someone share a job. Look at what changed in the situation, even if you still felt stressed.' },
      { kind: 'text', text: '**Choose one action to repeat**. You do not need a long routine. If pausing before saying yes helped, use that again. If you did not try it yet, choose a small situation where it might be useful. Keep the action realistic for your actual day, including work, caring responsibilities, and the help you have.' },
      { kind: 'text', text: 'Make a plan with a clear starting moment: **“When another request arrives, I will check my list before answering.”** “When” names the event you can notice. “I will” names the action. This is easier to use than “I will manage stress better,” because it tells you exactly what to do when the moment arrives.' },
      { kind: 'text', text: '**Try the dinner example from day one again**. Three messages arrive while you are cooking. Keep cooking safely, then check which reply is actually needed tonight. If a request can wait, choose when you will answer. If there is more work than you can fit in, ask for help or a different deadline. Your plan changes what you do; it does not require you to feel calm first.' },
      { kind: 'reveal', prompt: 'Make the plan concrete.', items: [
        { label: 'A moment to notice', detail: '“When two tasks are both due today…” Choose an event you can recognize in an ordinary day.' },
        { label: 'An action to take', detail: '“…I will ask which task should come first.” Choose something you can actually say or do.' },
        { label: 'Support if needed', detail: '“If the work still will not fit, I will discuss the deadline with my manager.” Name the person who can help change the problem.' },
      ] },
      { kind: 'text', text: '**Adjust the plan if it does not fit**. You may discover that a deadline cannot move or a person cannot help. That gives you information for another conversation or a different request. If stress is affecting your daily life or feels hard to manage, consider talking with a health professional. You do not need to solve everything alone.' },
      { kind: 'choice', prompt: 'Which plan tells you what to do when the next request arrives?', options: [
        { label: '“When a request arrives, I will check my list before answering.”', feedback: 'This gives you a moment to notice and a specific action. You can use it even if you still feel stressed.' },
        { label: '“I will be better at handling everything.”', feedback: 'This does not name a starting moment or an action. Choose one small thing to do in a situation you can recognize.' },
      ] },
      { kind: 'do', text: '**Write one sentence for the next stressful moment**: “When ___, I will ___.” Add who you could ask if the demand is still too much. Keep the note where the moment happens, such as beside your task list. Try that one action when the situation next comes up.' },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ https://www.who.int/thailand/activities/doing-what-matters-in-times-of-stress Course progression and final consolidation: https://www.stepiau.org/en/stress-control Original Azora teaching and examples.',
  },
] as const satisfies readonly LessonDefinition[];
