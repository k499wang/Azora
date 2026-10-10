import type { LessonDefinition } from '../lessonBlock';

/**
 * Plan-specific lessons for the life-reset presets.
 *
 * These are deliberately about the moment before a person starts, scrolls, or
 * turns on themselves. They teach a small change in approach; they do not turn
 * the plan into a task list or make a clinical claim.
 */
const BASE_LIFE_RESET_LESSONS = [
  {
    id: 'focus.home',
    title: 'A messy room does not define you',
    step: 'Describe one part of the room without judging yourself.',
    blocks: [
      { kind: 'text', text: 'When you look at a messy room, it can be easy to turn what you see into a judgment about yourself. Describing **the objects in one small area** gives you a more useful starting point: what is there, and what could you do with it?' },
      { kind: 'text', text: 'A messy room just means **things are out of place**. It says nothing about your worth as a person.' },
      { kind: 'text', text: 'The trouble starts when you think, “I am such a mess.” That thought feels huge, and **it gives you nothing to do**.' },
      { kind: 'choice', prompt: 'You see dishes on the counter and think, “I can’t keep anything together.” Which thought helps you start?', options: [
        { label: 'There are dishes on the counter', feedback: 'Yes. This names what you can see, with no judgment. Now you know a first move: wash one dish.' },
        { label: 'I need to fix the whole kitchen', feedback: 'That turns one small spot into a giant job, which makes starting harder. Describe only what you can see first.' },
      ] },
      { kind: 'reveal', prompt: 'Tap both parts of a description that helps you begin.', items: [
        { label: 'What I can see', detail: 'There are dishes on the counter. That is a fact about one spot, not about you.' },
        { label: 'What I can do', detail: 'I can wash one dish or clear one small area. One move is enough to start.' },
      ] },
      { kind: 'do', text: 'Look at one part of the room. **Say what is there**, like a camera would, without judging yourself.' },
    ],
    source: 'Behavioural activation and self-compassion research both support reducing shame and making an avoided task more specific before approaching it.',
  },
  {
    id: 'focus.visible',
    title: 'Start with the part you can see',
    step: 'Choose one small area around you to make easier to use.',
    blocks: [
      { kind: 'text', text: 'When a whole room needs attention, you may not know where to begin. **Choosing one small area** gives you a job you can understand without planning every other part of the room.' },
      { kind: 'text', text: '“Clean the whole place” is really dozens of jobs at once. No wonder it is hard to start. **Pick one spot you can see** instead, like the table in front of you.' },
      { kind: 'text', text: 'A small spot gives your brain **one clear job**. You do not have to plan the whole room. You just begin here, and let the rest wait its turn.' },
      { kind: 'do', text: 'Look around you and **choose one small spot** you could clear in a few minutes. Then clear it.' },
    ],
    source: 'Executive-function guidance commonly recommends breaking large domestic tasks into visible, bounded steps to reduce initiation overload.',
  },
  {
    id: 'focus.return',
    title: 'You can come back without catching up',
    step: 'Open today’s plan and pick one step that fits now.',
    blocks: [
      { kind: 'text', text: 'If you have been away from Azora for a few days, you can continue where you stopped. **Your unfinished steps wait for you**, so returning does not add a separate list of missed lessons or practices.' },
      { kind: 'text', text: 'Your plan is the list of steps Azora has chosen for each day. **A plan day includes a few small steps**: a lesson like this one, a check-in about your mood, one to-do, and on most days a guided Reset.' },
      { kind: 'text', text: 'The guided practices are called Resets. The screen leads you through a short activity, such as breathing or noticing your surroundings. **The next plan day opens when the current day’s steps are finished**, and you can do those steps at separate times.' },
      { kind: 'do', text: 'Open today’s plan and **choose one step** that fits right now.' },
    ],
    source: 'Relapse-prevention and habit-maintenance approaches emphasize restarting after lapses rather than using missed days as evidence of failure.',
  },
  {
    id: 'focus.loop',
    title: 'Notice what happens before you scroll',
    step: 'Next time you reach for your phone, name what just happened.',
    blocks: [
      { kind: 'text', text: 'You may find yourself opening your phone before you have decided what to do with it. To understand how that starts, **notice what happens just before you reach**. A particular feeling or moment may be prompting the habit.' },
      { kind: 'text', text: 'That moment could be finishing a task, feeling bored, or hearing an alert. In this lesson, we call it **the nudge** because it draws you toward checking. Noticing the nudge gives you a chance to decide whether checking is what you want.' },
      { kind: 'text', text: 'For example, after you finish an email, there may be a quiet gap before the next task. **Your hand reaches for the phone** before you even decide to.' },
      { kind: 'choice', prompt: 'You unlock your phone with no plan in mind. What should you notice first?', options: [
        { label: 'What happened just before I reached?', feedback: 'Yes. That finds the nudge: boredom, a pause or a feeling. Once you know it, you can choose differently next time.' },
        { label: 'How long have I already scrolled?', feedback: 'Time matters too, but it comes later. The moment before you reached tells you how the habit started.' },
      ] },
      { kind: 'do', text: 'The next time you reach for your phone, **name what happened just before** you reached.' },
    ],
    source: 'Habit-loop models describe behaviour as cue, routine, and reward; noticing the cue creates an opportunity to choose a different response.',
  },
  {
    id: 'focus.pull',
    title: 'You can pause before following an urge',
    step: 'Pause for a few breaths before opening your phone.',
    blocks: [
      { kind: 'text', text: 'You may feel a strong pull to check your phone even when you have no particular reason to open it. **A brief pause before checking** gives you time to notice that pull and consider whether you need anything from the phone right now.' },
      { kind: 'text', text: 'An urge is a strong want to do something right now, like checking your phone. **Wanting to check is not the same as needing to check.**' },
      { kind: 'text', text: 'You might feel it in your hands. You might hear a thought: “Just check quickly.” **Give it a name**: “I want to check my phone.”' },
      { kind: 'do', text: 'When you want to check your phone, **pause for a few breaths**, then decide whether to open it.' },
    ],
    source: 'Mindfulness-based approaches use urge observation and brief pauses to reduce automatic responding without demanding perfection.',
  },
  {
    id: 'focus.offline',
    title: 'Notice which breaks actually rest you',
    step: 'After your next break, notice whether you feel more rested.',
    blocks: [
      { kind: 'text', text: 'After a break, you might feel more rested, more restless, or much the same. **Noticing that difference** can help you choose a break that fits what you need. You do not have to assume that the same activity will suit you every day.' },
      { kind: 'text', text: 'Scrolling a busy feed can keep your mind racing, even while your body sits still. **Sitting still and resting are not the same thing.**' },
      { kind: 'text', text: 'Try a break without a feed. Drink water, look out the window or play one song. **It does not need to be useful.** It just needs to give your mind a rest.' },
      { kind: 'do', text: 'After your next break, **notice how you feel**: more rested, more restless, or about the same?' },
    ],
    source: 'Sleep and attention guidance recommends reducing stimulating screen use before rest and observing its effect on alertness and recovery.',
  },
  {
    id: 'body.capacity',
    title: 'Your energy can change each day',
    step: 'Pick one of today’s steps that fits your energy, or rest.',
    blocks: [
      { kind: 'text', text: 'The amount you can comfortably do may change from one day to the next. When today’s plan feels demanding, **choose a step that fits the energy you have**, or rest before returning. You do not have to complete every step in one sitting.' },
      { kind: 'text', text: 'Sleep, stress, health and busy days all change how much energy you have. **Low energy is information**, not a sign you are failing.' },
      { kind: 'text', text: 'Think of carrying groceries. On a rested morning, they feel light. After a long shift, **the same bags feel heavy**. The bags did not change. Your energy did.' },
      { kind: 'choice', prompt: 'Today’s full plan feels like too much. What is the best move?', options: [
        { label: 'Do one step, then check how I feel', feedback: 'Yes. One step is real progress, and it stays done. The rest of today’s steps will wait for you.' },
        { label: 'Call the whole day done after one minute', feedback: 'A short break is fine, but the next day opens only after all of today’s steps are finished. Do one now and come back for the rest.' },
      ] },
      { kind: 'do', text: 'Look at today’s steps. **Choose one that fits your energy**, or rest and come back later.' },
    ],
    source: 'Pacing and self-management guidance recommends adjusting activity to current energy and avoiding all-or-nothing responses to difficult days.',
  },
  {
    id: 'body.gentle',
    title: 'A small step can help on a hard day',
    step: 'Do one small act of care that fits your energy today.',
    blocks: [
      { kind: 'text', text: 'On a hard day, deciding what to do can feel like another demand. Instead of trying to fix everything, **look for one small need you can meet**. A drink, something to eat, or a comfortable place to rest may be a useful beginning.' },
      { kind: 'text', text: '“Push harder” can sound like the only plan. It is not. **A small action is still an action** if it meets a real need.' },
      { kind: 'text', text: 'Picture an afternoon when even picking a task feels hard. “Push harder” gives you no direction. **“Drink water, then sit by the window” gives you two clear moves.**' },
      { kind: 'do', text: 'Choose **one small act of care** you can do today without pushing past your energy.' },
    ],
    source: 'Behavioural activation and compassionate mind approaches support achievable, values-aligned actions rather than harsh self-criticism.',
  },
  {
    id: 'body.enough',
    title: 'Decide when enough is enough',
    step: 'Before starting a task, decide where you will stop.',
    blocks: [
      { kind: 'text', text: 'Sometimes finishing one task makes you notice three more, and you never feel ready to stop. **Choosing an ending before you start** gives this task a clear limit. You can finish what you agreed to do and decide separately about anything else.' },
      { kind: 'text', text: 'Without a stopping point, tasks keep growing. One chore turns into five. **A clear finish line lets you feel done.**' },
      { kind: 'text', text: 'For a short practice in Azora, you could say, **“After this guided practice, I will rest.”** These practices are called Resets, and the screen tells you what to do. Finishing the guide can be your stopping point without adding another activity afterward.' },
      { kind: 'do', text: 'Before your next task, **say where you will stop**. When you get there, let that be enough.' },
    ],
    source: 'Pacing and behavioural activation approaches use achievable limits to reduce overwhelm and support repeated engagement over time.',
  },
  {
    id: 'quiet.trust',
    title: 'Remember the times you came back',
    step: 'Recall one time you came back to something important after a miss.',
    blocks: [
      { kind: 'text', text: 'After missing something you meant to do, it is easy to remember only the miss. **Remembering times you returned** gives you a fuller picture of how you follow through. Those examples can help you see that a difficult day does not decide what happens next.' },
      { kind: 'text', text: 'Self-trust means believing you can take a step, and come back after a miss. **Real examples build it.**' },
      { kind: 'text', text: 'The examples can be small. You opened your plan, the list of small daily steps in this app. You paused before a sharp reply. **Small actions count as proof.**' },
      { kind: 'choice', prompt: 'You skipped your plan yesterday and think, “I never follow through.” What is a fairer way to see it?', options: [
        { label: 'The miss and the times I came back', feedback: 'Yes. A fair story includes both. One miss cannot prove “never” when you have come back before.' },
        { label: 'Only the miss, so I try harder', feedback: 'That leaves out half the facts. Count your comebacks too. They show you what already works.' },
      ] },
      { kind: 'do', text: 'Name **one time you came back** to something important after a miss.' },
    ],
    source: 'Self-efficacy research links confidence with repeated experiences of manageable action and recovery after setbacks.',
  },
  {
    id: 'quiet.voice',
    title: 'Talk to yourself like a fair friend',
    step: 'Rewrite one harsh thought as a fact and a next step.',
    blocks: [
      { kind: 'text', text: 'When something goes wrong, a harsh thought about yourself can make the next step harder to see. **Describing what happened fairly** gives you something specific to work with. You can acknowledge the problem and consider what to do without turning it into a judgment about your whole life.' },
      { kind: 'text', text: 'A thought like “I always fail” turns one bad moment into a verdict on your whole life. **That thought leaves out facts.**' },
      { kind: 'text', text: 'Try a fairer sentence that names what happened: “I missed my walk today.” **Specific words show you what to do next.**' },
      { kind: 'do', text: 'When you catch a harsh thought, **rewrite it as one fact** and one next step.' },
    ],
    source: 'Self-compassion research links a less punitive inner response with resilience and willingness to re-engage after difficulty.',
  },
  {
    id: 'quiet.repair',
    title: 'After a miss, choose a next step',
    step: 'Name one small change to try after a missed intention.',
    blocks: [
      { kind: 'text', text: 'If you missed something you intended to do, you can look at what got in the way before deciding what to try next. **Treat the miss as one event** you can learn from, rather than proof that you cannot follow through.' },
      { kind: 'text', text: 'First, say what happened in plain words. **One miss is one event.** It is not a label for who you are.' },
      { kind: 'text', text: 'Next, **ask what got in the way**. Was the time too busy? Was the reminder easy to miss? Was the task too big? **The reason points to the fix.**' },
      { kind: 'do', text: 'Think of one thing you missed and **name one small change** you could try next time.' },
    ],
    source: 'Relapse-prevention and self-compassion approaches frame setbacks as information and encourage a specific, non-punitive return to practice.',
  },
] as const satisfies readonly LessonDefinition[];

const BASE_LESSON_DEPTH = {
  'focus.home': [
    'Now try the camera way: “There are dishes on the counter.” **That is a fact.** You can point to it. And a fact comes with a clear first move: wash one plate.',
    'To practise this, look at one spot and **describe what you can see**: “Clothes on the chair. Mail on the table.” If a mean thought shows up, let it pass. Go back to what your eyes see.',
    'Too tired to act right now? That is fine. **The fact will still be there later**, and it will still tell you exactly where to begin.',
  ],
  'focus.visible': [
    'Picture a table covered in stuff. “Fix the room” is vague. **“Make room for a cup” is clear.** Move two papers and a bag, and you are done. You can see the result right away.',
    'Before you start, pick one surface, one basket or a few minutes. That gives the job an end point. If the spot turns out bigger than you thought, shrink it again. **Smaller is always allowed.**',
    'When the cup has a place, stop and look. **That small win counts**, even if the rest of the room looks the same. Tomorrow you can pick another spot, and the room gets better one spot at a time.',
  ],
  'focus.return': [
    'Miss a day? No problem. **Your plan waits for you right where you left off.** Say your lesson was open on Monday and you come back on Thursday. You read that same lesson. Thursday brings no extra lessons to make up.',
    '**You do not have to do it all at once.** Do one step now and the rest later. Each step you finish stays done. The next day opens once all of today’s steps are finished, whenever that happens.',
    'Coming back might feel ordinary, not exciting. That is fine. **Opening the app again is the comeback.** It does not need to feel big to count.',
  ],
  'focus.loop': [
    'The nudge was the email ending. **Spot the order: task ends, hand reaches, app opens.** The nudge can also be a sound, a place or a feeling, like boredom or worry.',
    '**Once you see the nudge, ask what you need.** Wanted a break? Decide if scrolling is the break you want. Wanted a message from a friend? Go straight to that chat and skip the feed.',
    'You can still choose to scroll. That is allowed. **The skill is choosing on purpose**, instead of letting the nudge choose for you.',
  ],
  'focus.pull': [
    'Naming it puts a little space between you and the urge. **An urge is a feeling, not an order.** You can notice how strong it is and still decide what to do.',
    'To try this, take a few slow breaths. Ask: would checking help with something I need right now? If you want something to notice during the pause, search the Explore tab for **5-4-3-2-1**, a short guided Reset. It leads you through five things you see, four sounds you hear, three things you touch, two smells, and one taste.',
    'After the pause, you can still use your phone. **Now it is your choice**, not a reflex. Need to text someone or look something up? Go ahead.',
  ],
  'focus.offline': [
    'Compare two breaks. After ten minutes of scrolling, how do you feel? After ten minutes with tea by the window? **Your own answer is what counts.** A feed can be fun and still leave you buzzing.',
    'To find out what suits you, **try one break with a screen and another without**. Afterward, ask: do I feel rested, restless or the same? Pick your next break based on what you learn.',
    'Screens are not the enemy. A show or a chat with a friend can be a great break. **Choose the break you need** right now: fun, connection or quiet. Then notice how it leaves you.',
  ],
  'body.capacity': [
    'Your plan works with this. Your plan is the list of small daily steps this app gives you. **Each day has a few small things to do**: a lesson like this one, a quick check-in about your mood, one to-do, and on most days a short Reset.',
    'The guided practices are called Resets. The screen leads you through a short activity, such as breathing or noticing your surroundings. **The next plan day opens when the current day’s steps are finished**, and you can do those steps at separate times. Each step you finish stays done.',
    'So on a low day, **do one step now** and come back for the rest later. Or rest first. Your plan waits for you right where you left off.',
  ],
  'body.gentle': [
    'You can do the first move without promising the second. **If the water is enough for now, that counts.** You can rest and decide on the next move later.',
    'To choose a starting point, Ask: what would make the next hour a little easier? Drink water. Make food easy to reach. Step outside for a minute. If following a guide would help you start, you could choose **a short practice in Azora, called a Reset**. The screen leads you through the activity. Pick the one that fits the energy you have.',
    'Afterward, check in with yourself. Did the next moment feel a little easier? **Small steps add up**, one hour at a time. Tomorrow, you can pick again.',
  ],
  'body.enough': [
    'Now you know exactly what you agreed to. **When you reach it, you are done.** This works especially well for tasks that tend to grow once you start, like cleaning or email.',
    'A thought may pop up: “It doesn’t count unless I do more.” Ask who made that rule. **One finished step is still finished**, even when other tasks are waiting.',
    'Your plan in the app works the same way. Each day has a few small steps: a lesson like this one, a quick mood check-in, one to-do, and on most days a Reset. **You can rest with some steps still open.** They wait for you, right where you left off.',
  ],
  'quiet.trust': [
    'After a miss, write two facts. “I missed Tuesday.” “I came back on Thursday.” **Both are true, and both belong in the story.** The second fact stops the miss from turning into “I never follow through.”',
    '**Then ask what got in the way.** Was the time too busy? Was there no reminder? A clear reason points to a clear fix. If dinner time is always hectic, move your step to the morning.',
    'Next, **make a small, clear plan**: “After breakfast, I will open the app.” Try it. If it does not fit, change it. Each comeback adds to your proof.',
  ],
  'quiet.voice': [
    '“I am useless” is a label about your whole self. It gives you nothing to do. **“I missed my walk” is one event.** You can ask about it: what made it hard, and when can I try again?',
    'When you notice a harsh thought, **name one fact and one possible next step**: “I missed it, and I can go after lunch.” You do not have to pretend you feel great. Just be honest without insults.',
    'Check your new sentence. Does it show a next step? **If yes, it is doing its job.** Fair words make the next choice clearer. Practice this a few times, and the fair voice gets easier to find.',
  ],
  'quiet.repair': [
    'Say you planned a quiet evening, then scrolled your phone all night. **Name it plainly**: “I used my phone longer than I planned.” That is clear enough to work with. “I always ruin my evenings” is not.',
    'Now ask why. Was the phone right beside you? Did you want company? **The reason tells you what to change.** If you wanted company, plan a call with a friend. If the phone was just close, put it in another room.',
    '**Then try one small change** next time, like moving the charger or making the quiet time shorter. That is how you begin again, with no punishment needed. Each small fix makes the next try easier.',
  ],
} as const;

function resetLesson<Id extends keyof typeof LIFE_RESET_PRACTICE>(
  id: Id,
  title: string,
  claim: string,
  reason: string,
  insight: string,
  reflection: string,
  source: string,
) {
  const practice = LIFE_RESET_PRACTICE[id];
  const introduction = { kind: 'text' as const, text: `${claim} ${reason}` };
  const setup = {
    kind: 'list' as const,
    items: [
      { term: 'The idea', text: claim },
      { term: 'Why it helps', text: reason },
    ],
  };

  return {
    id,
    title,
    step: LIFE_RESET_STEP[id],
    blocks: [
      LIST_LESSONS.has(id) ? setup : introduction,
      { kind: 'text' as const, text: `${practice.situation} ${insight}` },
      { kind: 'text' as const, text: LIFE_RESET_EXPLANATION[id] },
      { kind: 'text' as const, text: `${practice.response} ${practice.limit}` },
      { kind: 'do' as const, text: `${LIFE_RESET_TODAY[id]} You can use this question to choose your starting point: ${reflection}` },
    ],
    source,
  } as const;
}

// These lessons teach a two-part distinction, so the setup reads as a pair.
// The remaining lessons use prose to lead into a single situation.
const LIST_LESSONS: ReadonlySet<string> = new Set([
  'focus.eyes', 'focus.bin', 'focus.landing', 'focus.edge',
  'focus.unlock', 'focus.hands', 'focus.save', 'focus.company',
  'body.signal', 'body.floor', 'body.decision', 'body.finish',
  'quiet.cue', 'quiet.yes', 'quiet.yesterday', 'quiet.no',
]);

const LIFE_RESET_PRACTICE = {
  'focus.category': {
    situation: 'You look at a pile of laundry. “Do laundry” still leaves you choosing: gather, wash, fold or put away? **That hidden choosing is what makes it feel heavy.**',
    response: 'To try this, find the first thing your hands could do, like putting the clothes on the chair into the hamper. When that is done, decide again. You never have to commit to the whole job.',
    limit: 'Still feels too big? **Make the move even smaller**, like picking up one sock. The best first step is the one you can start right now.',
  },
  'focus.eyes': {
    situation: 'You walk past the same cup on the table every day. It might not be the biggest job in the room. But you already know where it goes. **Seeing it removes a decision.**',
    response: 'To try this with the cup, Take the cup to the kitchen, then pause and look again. Pick another item you can see, or stop there. You are practicing starting, not finishing.',
    limit: 'If the first thing you see belongs to someone else or needs a big decision, skip it. **Choose the next easy item instead.**',
  },
  'focus.sort': {
    situation: 'A stack of papers seems to need a whole filing system. But one envelope in it already has a home. **Putting that envelope away is a much smaller job than sorting the stack.**',
    response: '**Split the pile in two.** Things with a known home go there now. Things you are unsure about stay together in one spot, to sort another day.',
    limit: 'Some things do need a new system. That job can wait until you have the time and energy for it. **Putting one familiar item away is a useful place to start.**',
  },
  'focus.bin': {
    situation: 'You mean to throw out a wrapper, but the bin is across the room. So the wrapper stays on the table. **The room made the messy choice the easy one.**',
    response: 'You can try this for a few days. Put a small bin or bag right where the mess gathers. Watch whether less trash piles up there. If it works, keep it.',
    limit: 'If the bin gets in the way, move it to a better spot. Choose **a spot that fits your home**, and adjust it if it gets in the way. The aim is to make throwing things away easier when you need to.',
  },
  'focus.timer': {
    situation: '“I should clean until it looks good” has no clear end. It could take all evening. **A five-minute limit tells you exactly what you are signing up for.**',
    response: '**Pick a short time and one area.** Set a timer for five minutes. When it rings, look at what you got done. Keep going only if you want to. It is a fresh choice, not a debt.',
    limit: 'If a ticking timer stresses you out, **use a finish line instead**, like clearing one chair.',
  },
  'focus.landing': {
    situation: 'Your desk is busy, but one corner has room for tomorrow’s notebook. **One clear spot helps**, even when the rest of the room is not done.',
    response: '**Pick one small surface and give it a job**: “This is where my keys go.” Move only what blocks that job. Then keep it clear.',
    limit: 'If the spot fills up again, that is useful to know. **Try a better place or a new job for it.** Keep the spot small enough to clear in under a minute.',
  },
  'focus.doorway': {
    situation: 'You walk in with your bag and keys, then forget the small tidy step you meant to do. **Coming home happens every day**, so it can carry a reminder for you.',
    response: '**Link one action to that moment**: after I set down my keys, I put one item away. Say it out loud a few times so it sticks.',
    limit: 'If busy days make you forget, **pick a moment that happens more reliably**. There are no missed days to make up.',
  },
  'focus.edge': {
    situation: '“Tidy the kitchen” can grow from the counter to the cupboards to the floor, until it eats your whole evening. **Without a finish line, done keeps moving away.**',
    response: '**Name your finish before you start**: “Done means the table is clear.” When you reach it, stop and ask: did that meet today’s need? If yes, enjoy being done.',
    limit: 'Got more time and energy? You can always pick a new goal. **Just do not let the first one quietly grow.** The bigger job can wait for another day.',
  },
  'focus.livedin': {
    situation: '**A blanket on the sofa** or dishes after dinner just show that people live here. The thought “I have failed again” adds a judgment the objects cannot prove.',
    response: '**Ask yourself two questions:** What can I see? What story am I adding? “Three plates need washing” gives you a next step. “I am hopeless” does not.',
    limit: 'You can want a tidier space without being mean to yourself. **Kind, clear words make starting easier than shame does.**',
  },
  'focus.ending': {
    situation: 'You open a feed to check one update. Every swipe brings something new, and you forget why you came. **The feed always has one more thing to show you.**',
    response: '**Set your exit point first**: “After I read the message, I will close the app.” If you get pulled into something else, say your reason for opening it again.',
    limit: 'Sometimes you will want to browse just for fun. That is fine. **The goal is that you choose it**, not the feed.',
  },
  'focus.unlock': {
    situation: 'You pick up your phone to check the weather and end up in your messages. **The switch happens so fast that you forget why you picked it up.**',
    response: '**Say the job before the first tap**: “weather, then close.” Or “reply to Sam.” Keep it to a few words. If you land somewhere else, pause and decide if you want to stay.',
    limit: 'Drifting off sometimes is normal, so go easy on yourself. **Every time you notice, you can choose again.** Noticing is the whole skill, and it gets easier with practice.',
  },
  'focus.default': {
    situation: '**A bright app icon on your first screen** is easy to tap during a dull moment. Move it into a folder, and you get an extra second to decide.',
    response: '**Change one thing on your phone**: move an app into a folder, turn off one alert, or remove a shortcut. Then notice if you check it less.',
    limit: 'Keep the alerts you need for work, family or safety. **Only change the ones that pull you in for no reason.**',
  },
  'focus.hands': {
    situation: 'You put your phone down, and right away the moment feels empty. **That empty feeling is why picking it back up feels so easy.**',
    response: '**Try one small move:** look outside, stretch your hands or take three slow breaths. Then decide what you want to do next.',
    limit: 'It does not need to be useful. **A small pause lets you choose on purpose.** You are free to pick up the phone afterward.',
  },
  'focus.charger': {
    situation: '**A phone charging next to your bed** is right there when you wake at night. On a shelf across the room, reaching for it takes a real decision.',
    response: '**Pick a charging spot that helps you rest.** Try a shelf, a dresser or the kitchen. Make sure it still works for your alarm and any calls you must take.',
    limit: 'Every home is different. **Find the spot that fits yours** and keep it there for a few nights.',
  },
  'focus.save': {
    situation: 'You open a message from a friend, then stay for posts that have nothing to do with them. **You finished the message you came for**, then continued into a different activity without choosing it.',
    response: '**Name what you came for.** Reply to the friend, save the useful post or write down the idea. Then close the app and get on with your day.',
    limit: 'Want to browse for fun? Go for it. **Enjoying it is a fine reason.** Just make it your choice, not the app’s. Your time, your call.',
  },
  'focus.wait': {
    situation: '**An alert buzzes while you are resting.** The urge to look feels urgent, even when the message has no deadline at all.',
    response: '**Notice the pull**, wait for a few slow breaths, and ask: does this need me now? Then choose, with no guilt about the urge. Feeling the pull is normal.',
    limit: 'If something is truly urgent, answer it right away. **The pause is for choosing**, not for testing how long you can wait. Your attention is yours to give.',
  },
  'focus.company': {
    situation: '**A video plays while you scroll another app.** Two streams pull at you at once. Afterward, you can feel more scattered than rested.',
    response: '**Pick one screen for a short break.** Watch the video or scroll the feed, not both. Then compare how you feel with your usual way.',
    limit: 'You do not need silence. Background music can be comforting. **Let how you feel guide you** to the right amount of input. For some people that is one screen. For others it is a screen plus soft music.',
  },
  'focus.capture': {
    situation: '**You spot a great recipe** and keep scrolling so you do not lose it. Now the recipe is the reason you cannot put the phone down.',
    response: '**Save the item**, send it to yourself or jot it down in your notes app. Close the app. Check your saved list later, when you actually have time to cook or read.',
    limit: 'Saving everything makes a new pile. **Save only what you will really use**, and let the rest scroll by. The feed will always have more.',
  },
  'body.corner': {
    situation: '**A hard morning** can make “today is ruined” sound true. But lunch, a shower or a short walk is still a fresh choice you get to make.',
    response: 'For the next part of the day, **choose one small act of care**, such as drinking water with lunch or sitting by a window. You could also follow a short guided practice in Azora, called a Reset, if that fits what you need.',
    limit: 'You do not have to rescue the whole day. **Meeting one need is a useful start**, even if the day remains difficult.',
  },
  'body.signal': {
    situation: '**When you feel stuck**, “How do I fix my life?” is too big to answer. “Am I thirsty, hungry, tense or uncomfortable?” is small enough to answer now.',
    response: '**Notice one body signal**, then answer it. Drink water, eat something, change position or take a few slow breaths. Then check in again. Did that take the edge off?',
    limit: 'This clears the easy problems first. **Then you can see what else needs care.** If a hard feeling stays, it is worth paying attention to, and maybe talking to someone you trust.',
  },
  'body.comfort': {
    situation: '**Two breaks can look the same from the outside**, but leave you feeling different. One makes the day softer. The other leaves you restless.',
    response: '**After a break, ask what changed**: your energy, your tension, or how ready you feel to go back. You do not need to score it.',
    limit: 'The same break can help one day and drain you the next. **Check how you feel today**, not what worked last week.',
  },
  'body.floor': {
    situation: '**On a low day, everything can feel too big.** The thought “then nothing counts” shows up. But a smaller step keeps the door open.',
    response: '**Name the smallest useful step for today**: make food easy to grab, step outside for a minute, or do just one step of your plan.',
    limit: 'Finish all of a day’s steps and the next day opens. **Each step you finish stays done.** Miss a day? No problem. Your plan waits for you right where you left off.',
  },
  'body.sight': {
    situation: '**You mean to drink more water**, but the bottle is in the kitchen. You only remember it later, when you are already tired.',
    response: '**Put one helpful thing near where you need it**: a bottle on your desk, shoes by the door, or a book on your pillow. Think about where you will be when you need it.',
    limit: 'When your routine changes, **move things to match**. Keep testing until the reminder catches your eye every time.',
  },
  'body.decision': {
    situation: '**An afternoon choice feels strangely annoying.** Then you realize you have not eaten since breakfast. Hunger is adding pressure to the decision.',
    response: '**Before a decision that can wait, check your basics**: food, water, rest and time. Meet the ones you can. Then come back to the choice. Even a glass of water counts.',
    limit: 'This takes the edge off. **Then you can face the real question** with a clearer head. A choice that felt huge before a snack often feels normal after one.',
  },
  'body.hour': {
    situation: '**After a slow, messy morning**, “I ruined the day” can make the afternoon feel decided. That thought is trying to predict the future.',
    response: '**Describe the morning honestly**, then ask what the next hour needs. A small change, like opening a window or making tea, marks a fresh start.',
    limit: 'You do not have to pretend the morning was good. **The next hour can still go well.**',
  },
  'body.finish': {
    situation: '**You finish one helpful thing** and right away add three more. The finish line keeps moving, so you never get to feel done.',
    response: '**Name the finish before you begin**: “After lunch, I will stop planning.” Or “After this one Reset, I will rest.” When you get there, notice it and let it end. Enjoy that done feeling.',
    limit: 'If something important still needs you, start a new task on purpose. **A clear stop means nothing gets added by accident.** You decide what comes next.',
  },
  'body.returnpath': {
    situation: '**Resting can feel risky** when you picture restarting your whole day afterward. One clear next step makes coming back easy.',
    response: '**Before resting, leave a reminder**: set out a glass of water, write your next task on a sticky note, or pick a time to check in. Keep it small and easy to see.',
    limit: 'The reminder is a friendly invite, not a deadline. **If your energy changes, pick a different next step.** Resting well is part of looking after yourself.',
  },
  'quiet.when': {
    situation: '**“I will do it sometime today”** makes you keep deciding when. “After lunch, I will take a short walk” gives it a time and a place.',
    response: '**Use a moment that already happens**: after breakfast, before your shower, or when you sit down at night. Pair it with one clear action, like “After breakfast, I will stretch for two minutes.”',
    limit: 'If that moment does not happen one day, pick another. **A different reminder may fit better next time.** It says nothing about you. Just try a new moment tomorrow.',
  },
  'quiet.cue': {
    situation: '**You want to read before bed**, but your reminder lives in an app you never open at night. You never see it when it counts.',
    response: '**Move the reminder to the spot where you act**: a note by the lamp, a book on your pillow, or your mug next to the kettle. Put it where your eyes already go.',
    limit: 'If you start ignoring it, move it. **Try a fresh spot** instead of a louder alarm. A new spot catches your eye again.',
  },
  'quiet.no': {
    situation: '**You planned a full evening of self-care**, then a hard day hits. “I cannot do all of it” quickly becomes “I will do none of it.”',
    response: '**Pick your smaller option ahead of time.** On a hard day, do one step now and the rest later. Or rest, and come back tomorrow.',
    limit: 'Finish all of a day’s steps and the next day opens. **Your plan waits for you right where you left off.** Each step you finish stays done.',
  },
  'quiet.yes': {
    situation: '**You promise yourself a calm evening**, but the evening is already packed. You mean it. But the promise has no room to happen.',
    response: '**Look at what is already planned.** Move, shorten or drop one optional thing if you can. Then put your promise in the space you made. Even ten free minutes is enough room.',
    limit: 'Some days really are full. **Picking an honest later time builds more trust** than a promise your day cannot hold.',
  },
  'quiet.story': {
    situation: '**You miss one Reset** and the thought “I never follow through” shows up. The word “never” turns one event into a story about who you are.',
    response: '**Write what happened first**: “I did not do my Reset yesterday.” Then ask what got in the way and what you could try next.',
    limit: 'You can take a miss seriously without calling yourself a failure. **A clear account helps you fix the plan.** A label does not.',
  },
  'quiet.yesterday': {
    situation: '**Your Reset felt easy after lunch yesterday.** Today you start hunting for a brand-new schedule, even though that time could still work fine.',
    response: '**Copy the helpful part**: the time, the place or the setup. Try it again today. Your own experience is great evidence.',
    limit: 'If today is different, adjust that one detail. **Use yesterday as a clue, not a rule.** Sometimes the useful part is the place, not the time.',
  },
  'quiet.plain': {
    situation: '**“I will do one Reset”** quietly grows into “and I must feel calm and finish everything else.” The promise changed without you noticing.',
    response: '**Say the promise as an action**: “I will do my Reset after breakfast.” Keep it separate from how you hope to feel.',
    limit: 'Feelings come and go on their own schedule. **You can check whether you did the action**, without requiring a particular feeling afterward.',
  },
  'quiet.boundary': {
    situation: '**You set aside a quiet moment in the evening**, but messages and requests keep coming in. A boundary gives that moment room to happen.',
    response: '**Pick one small limit**: mute a non-urgent alert, tell someone you will reply later, or set aside a short private moment. Say it kindly and simply.',
    limit: 'Fit the limit to your life and your people. **You can always make an exception on purpose** when something truly urgent comes up. A boundary is a tool, not a wall.',
  },
  'quiet.receipt': {
    situation: 'Say you skipped one Reset this week. **You remember that miss** but forget the three times you showed up. Your memory gives the miss too much space.',
    response: '**Name one real action you finished**, and when. Treat it as proof. Count the misses too when they teach you something. Write it down if that helps you remember.',
    limit: 'Every finished step is proof. **A completed action belongs in the picture too.** Today can be one more.',
  },
} as const;

/** The extra explanation is authored per topic so the longer page earns its place. */
const LIFE_RESET_EXPLANATION = {
  'focus.category': 'A broad job often includes several small decisions about what to do first. **Naming the first move removes one decision.** Once your hands are busy, the next step is easier to see. You decide again with the task right in front of you.',
  'focus.eyes': 'The cup is a great place to start. You know what it is, and you know where it belongs. **You can act without planning the whole room.** Moving it gives you one finished step. From there, look around and pick the next thing you see.',
  'focus.sort': 'Sorting is hard because every item asks, “Where do you go?” A familiar item already has an answer. **Do the easy return first.** The pile gets a little smaller. And you do not have to design a filing system while you are tired or busy.',
  'focus.bin': 'Look for the spot where trash usually gets left behind. If the bin is far from there, every wrapper takes an extra trip. **Change the room, not your willpower.** A small bag hung on a chair can be enough to test the idea.',
  'focus.timer': 'A job with no end can feel like it will swallow your whole night. A timer makes a deal: you work on one area for a set time. **You set the time, and you can stop when it rings.** Then look at what changed. You can always choose another round.',
  'focus.landing': 'Think about where you look for your keys or bag each morning. **One clear spot can be their home.** You are not trying to make the whole room tidy. You are just making tomorrow’s first step easier by keeping one useful place ready.',
  'focus.doorway': 'A reminder works best at a moment that already happens. Walking through your door is that kind of moment. **Pair coming home with one small action**, like putting your keys in a bowl. If your hands are always full when you arrive, pick a later moment, like when you put your bag down.',
  'focus.edge': 'Before you touch the kitchen, pick today’s goal. A usable table? Three things put away? A clear path to the sink? **That answer is the whole job.** Without it, each finished part points to another task. You can still do more later, but now it is a new choice.',
  'focus.livedin': 'The same three plates can lead to two very different sentences. “These plates need washing” points to a job. “I never keep up” is a claim about your whole life. **The first one helps you act.** It lets you decide to wash them now or come back later.',
  'focus.ending': 'Say you open an app to read one message from a friend. As soon as you finish, the next post appears. **Choose your exit before you open the app**: read the message, reply, then close. If you want to browse after that, make it a separate choice.',
  'focus.unlock': 'Opening an app takes a split second, so your first reason can slip away. Saying “weather, then close” before you unlock gives you a quick reminder. **The words keep your purpose in view.** If you end up in another app, just ask: does this matter right now?',
  'focus.default': 'An app on your first screen takes zero thought to open. Moving it, or turning off one alert, adds a small pause. **That pause is the useful part.** You can still open the app any time you want. Your phone just stops grabbing your attention so often.',
  'focus.hands': 'When your phone leaves your hands, the next few seconds can feel strange. That feeling does not mean you need the phone again. **Give the gap a simple action**, like looking out the window or stretching your fingers. After that, you can still pick up your phone if you really want it.',
  'focus.charger': 'If your phone charges by your pillow, checking it at 2 a.m. takes almost no effort. Across the room, you have to decide to get up. **That decision is your chance to stay in bed.** If your phone is your alarm, test a spot where you can still hear it.',
  'focus.save': 'It is easy to open an app for a friend and stay for the feed around them. **Keep your reason separate from the feed.** Reply to your friend first. Then decide if you also want to browse. Both choices are fine. The goal is to notice which one you are making.',
  'focus.wait': 'A buzz makes a message feel like an emergency. **When it arrives and how urgent it is are two different things.** Pause long enough to ask what the message probably needs. If it is about safety or a real deadline, answer it. If it can wait, go back to what you were doing.',
  'focus.company': 'A video and a feed both keep giving you new things to watch. Doing both at once can be fun, or it can leave you frazzled. **Change one part of the break**: keep the video and close the feed. After a few minutes, check how you feel. Your own answer is what matters.',
  'focus.capture': 'If you keep scrolling to hold on to a recipe, your real job is saving the recipe, not staying in the feed. **Give the idea another home:** bookmark it, screenshot it or write its name down. Then close the app. Later, decide if you still want it.',
  'body.corner': 'A hard morning can make the whole day feel decided. It is not. Lunch, a drink, a rest or a shower are each a separate moment you can choose. **Care can stay small.** One good moment does not have to save the day. It just makes the next hour easier.',
  'body.signal': 'A big question like “What is wrong with me?” rarely leads anywhere. A smaller one does: “Am I hungry, thirsty, tense or uncomfortable?” **Check one basic need first.** If meeting it helps, great. If not, you have ruled it out and know where to look next.',
  'body.comfort': 'Picture two breaks: ten minutes of scrolling, and ten minutes with a drink by the window. Both can be nice. What matters is how each one leaves you. **Judge the break by how you feel after.** More rested? The same? Ready to keep going? That tells you which break to pick next time.',
  'body.floor': 'Your plan in Azora is the list of small daily steps this app gives you. **Each day has a few small things to do**: a lesson like this one, a quick check-in about your mood, one to-do, and on most days a short Reset. A Reset is a short guided practice, a minute or two long, that helps you calm down or wake up.',
  'body.sight': 'A bottle in another room depends on you remembering it. A bottle next to your chair reminds you at the exact moment you can drink. **Your setup does the remembering for you.** If you stop noticing it, move it somewhere new. You want a useful spot, not a perfect one.',
  'body.decision': 'Say a small decision feels oddly stressful in the afternoon. You may be hungry, thirsty, tired or rushed. **Check those basic needs first**, before deciding what the feeling means. A snack or a short break removes one easy source of stress. Then go back to the question and notice if it feels lighter.',
  'body.hour': 'A hard morning is a fact about the morning. It does not predict the afternoon. You may still need rest, help or a smaller to-do list. **Ask about the next hour only.** Could you eat, open a window, or take a short rest? Naming one step gives you something real to choose.',
  'body.finish': 'If you finish one thing and pile on three more, the work never ends. **Pick your finish before you start.** It might be one Reset, a short guided practice in this app, and then rest. Or it might be making lunch without planning dinner too. When you reach it, stop.',
  'body.returnpath': 'It can be hard to rest when you fear that starting again will take a big decision. Before the break, **leave one simple reminder**, like a note saying “call Sam” or a glass by the sink. **Make the way back easy to see.** You can still change your mind after resting.',
  'quiet.when': 'A goal that says “sometime today” leaves the start time open. When the day gets busy, you have to decide all over again. **Hook the action onto something you already do**, like lunch or sitting down after work. That moment reminds you every day. If it stops fitting, pick another.',
  'quiet.cue': 'Your reminder needs to meet you where the action begins. **A note by your lamp or a book on your pillow** is hard to miss at bedtime. An alert hidden in an app you only open in the morning is easy to miss. **If you stop noticing your reminder, move it again.**',
  'quiet.no': 'Your plan in Azora is the list of small daily steps this app gives you. **Each day has a few small things to do**: a lesson like this one, a quick check-in about your mood, one to-do, and on most days a short Reset. A Reset is a short guided practice, a minute or two long, that helps you calm down or wake up.',
  'quiet.yes': 'A promise needs a real spot in your schedule. If the evening is already full, saying yes to one more thing does not create more time. **Look for room before you commit.** Move one optional task, choose a shorter version, or pick another day. A real time beats a hopeful one.',
  'quiet.story': 'After one missed Reset, your mind may say, “I never follow through.” The word “never” may leave out times when you did follow through. **Use the smaller, honest sentence:** “I missed this Reset.” Then ask what got in the way. That answer helps you pick a better time, reminder or first step.',
  'quiet.yesterday': 'You do not need to invent a new routine every time you try again. If yesterday’s Reset fit after lunch, that tells you something useful about your day. **Borrow one detail that worked**: the time, the place or what you got ready. Repeat it once and see if it still fits.',
  'quiet.plain': 'A promise can grow after you make it. “I will do one Reset” turns into “I must also feel calm and finish everything.” **Those extra rules were never part of the deal.** Keep your promise about an action you can see. You can keep it even if your mood stays the same.',
  'quiet.boundary': 'A boundary is a simple limit that makes room for something you chose. For example, you might silence alerts for ten minutes while you do a Reset, a short guided practice in this app. **The limit protects the time.** It does not make you a good or bad person.',
  'quiet.receipt': 'A miss sticks in your mind more easily than three quiet wins. If you only count the miss, your picture of the week is wrong. **Name one thing you did finish**, and when. That is not a grade. It is a fact that belongs right next to the misses.',
} as const satisfies Record<keyof typeof LIFE_RESET_PRACTICE, string>;

const LIFE_RESET_TODAY = {
  'focus.category': 'Choose one unfinished job and **name its first physical move**. Do that move, and stop there if you want.',
  'focus.eyes': 'Look around and **move one item you can see** back to where it belongs.',
  'focus.sort': 'Find one item with a known home and **put it there**. Leave the sorting for another time.',
  'focus.bin': 'Find where trash gathers and **put a bag or bin right there** for a day.',
  'focus.timer': 'Choose one area and **set a short stopping point** before you begin.',
  'focus.landing': 'Pick one small surface and **make room for something you will use** tomorrow.',
  'focus.doorway': 'When you come home next, **put one item away** right after setting down your keys.',
  'focus.edge': 'Before you start a task, **say what will count as done** for now.',
  'focus.livedin': 'Look at one messy spot and **describe only what you see**, with no label about yourself.',
  'focus.ending': 'Before opening a feed, **say what you came to see** and when you will close it.',
  'focus.unlock': 'Before your next phone unlock, **say the job in a few words**.',
  'focus.default': 'Move one app or turn off one alert, then **notice whether you check less**.',
  'focus.hands': 'After putting your phone down, **spend one quiet minute** before deciding what comes next.',
  'focus.charger': 'Look at where your phone charges and **try a spot that helps you rest**.',
  'focus.save': 'When you open an app for a person or an idea, **finish that first** before you browse.',
  'focus.wait': 'When a non-urgent alert arrives, **pause for a few breaths** before you look.',
  'focus.company': 'During one break, **use just one screen** and notice how you feel afterward.',
  'focus.capture': 'Save one useful item outside the feed, then **close the app** and look at it later.',
  'body.corner': 'Choose **one small part of today to care for**, like lunch or a short rest.',
  'body.signal': 'Check for one basic need and **try one small fix**, like water or a new position.',
  'body.comfort': 'After your next break, **notice what changed** in your energy or tension.',
  'body.floor': 'Choose **one first step that fits your energy**. The rest of today’s steps will wait for you.',
  'body.sight': 'Move **one helpful thing into sight** where you will need it.',
  'body.decision': 'Before a decision that can wait, **check one basic need**, then come back to it.',
  'body.hour': 'For the next hour, **choose one small thing that will help**, like a drink or a rest.',
  'body.finish': 'Before beginning a task, **name where you will stop** and let that count.',
  'body.returnpath': 'Before a rest, **leave one simple reminder** of what you want to do afterward.',
  'quiet.when': 'Choose one action and **link it to a daily moment**, like breakfast.',
  'quiet.cue': 'Move one reminder so **you see it right where the action starts**.',
  'quiet.no': 'For a hard day, **choose one smaller step**, or rest and come back later.',
  'quiet.yes': 'Before making a promise, **find a real spot in your day** where it fits.',
  'quiet.story': 'After a miss, **say what happened in one sentence**, then choose a next step.',
  'quiet.yesterday': 'Repeat **one detail that helped before**, like the time or the place.',
  'quiet.plain': 'Say your next promise as **one action you can see**, with no feeling attached.',
  'quiet.boundary': 'Choose **one small limit** that protects a few minutes for something you value.',
  'quiet.receipt': 'Name **one thing you finished and when**, even if you also missed something.',
} as const satisfies Record<keyof typeof LIFE_RESET_PRACTICE, string>;

const LIFE_RESET_STEP = {
  'focus.category': 'Name the first physical move on one unfinished job.',
  'focus.eyes': 'Move one item you can see back to its usual place.',
  'focus.sort': 'Put one item back in its known home and stop there.',
  'focus.bin': 'Put a bag or bin where trash tends to gather.',
  'focus.timer': 'Set a short stopping point before you start tidying one area.',
  'focus.landing': 'Clear one small surface for something you will use tomorrow.',
  'focus.doorway': 'When you get home, put one item away after your keys.',
  'focus.edge': 'Before you start a task, say what will count as done.',
  'focus.livedin': 'Describe one messy spot by what you see, not who you are.',
  'focus.ending': 'Before opening a feed, decide what you want and when to close.',
  'focus.unlock': 'Before unlocking your phone, say why in a few words.',
  'focus.default': 'Move one tempting app or turn off one alert.',
  'focus.hands': 'After putting your phone down, take one quiet minute first.',
  'focus.charger': 'Try charging your phone somewhere that helps you rest.',
  'focus.save': 'When you open an app for something, finish that before browsing.',
  'focus.wait': 'Pause for a few breaths before checking a non-urgent alert.',
  'focus.company': 'Use just one screen during a break and notice how you feel.',
  'focus.capture': 'Save one useful item outside the feed, then close the app.',
  'body.corner': 'Care for one small part of today, like lunch or a rest.',
  'body.signal': 'Check for one basic need and try one small fix.',
  'body.comfort': 'After your next break, notice what changed in your energy.',
  'body.floor': 'Choose one first step that fits the energy you have.',
  'body.sight': 'Move one helpful thing to where you will see it.',
  'body.decision': 'Check one basic need before making a decision that can wait.',
  'body.hour': 'Pick one small thing that will help in the next hour.',
  'body.finish': 'Name a clear stopping point before you begin a task.',
  'body.returnpath': 'Before resting, leave one simple reminder of what comes next.',
  'quiet.when': 'Tie one small action to a daily moment like breakfast.',
  'quiet.cue': 'Move one reminder to where the action actually begins.',
  'quiet.no': 'On a hard day, choose one smaller step or rest.',
  'quiet.yes': 'Find a real spot in your day before making a promise.',
  'quiet.story': 'Describe a miss in one sentence, then choose a next step.',
  'quiet.yesterday': 'Repeat one detail that helped before, like the time or place.',
  'quiet.plain': 'State your next promise as one action someone could see.',
  'quiet.boundary': 'Set one small limit to protect a few minutes for something important.',
  'quiet.receipt': 'Name one thing you actually followed through on today.',
} as const satisfies Record<keyof typeof LIFE_RESET_PRACTICE, string>;

const HOME_SOURCES = 'Implementation-intention and executive-function guidance support defining a visible, bounded next action and reducing friction in the environment.';
const PHONE_SOURCES = 'Habit-loop and attention research support noticing cues, reducing frictionless access, and creating a deliberate pause before automatic checking.';
const RECOVERY_SOURCES = 'Behavioural activation and pacing guidance support choosing an achievable form of care that fits the energy available in the present moment.';
const SELF_TRUST_SOURCES = 'Implementation-intention and self-compassion research support specific, achievable commitments and a non-punitive return after setbacks.';

const EXPANDED_LIFE_RESET_LESSONS = [
  resetLesson('focus.category', 'Name one action, not the whole job', 'A chore such as laundry can feel large because its name includes several different jobs. **Naming one physical action** gives you a clearer beginning.', '“Laundry” hides a dozen choices. “Put one shirt in the basket” has none, so you can just begin.', 'Pick the first move and the weight drops. **One clear move is enough to begin.**', 'What is the first thing my hands could do?', HOME_SOURCES),
  resetLesson('focus.eyes', 'Begin with one thing you can see', 'When a room needs attention, choosing where to start can become a job of its own. **One familiar item in front of you** can be enough to begin.', 'Hunting for the most important job first makes starting harder. Grabbing what is in front of you skips that step.', 'You do not need a ranking. **Start with what your eyes land on.**', 'Which item can I move in less than a minute?', HOME_SOURCES),
  resetLesson('focus.sort', 'Put away what already has a place', 'A cluttered pile may contain both things you know how to put away and things that need a decision. **Begin with something that already has a place**.', 'Sorting means deciding where many things belong. Putting away one familiar thing takes just one decision.', 'Do the sure thing first. **Leave the hard pile for later.**', 'Is there one thing here whose home I already know?', HOME_SOURCES),
  resetLesson('focus.bin', 'Keep a bin near the mess', 'If wrappers keep collecting in the same spot, notice how far away the bin is. **A nearby bin** can make throwing them away easier.', 'With the bin closer, each wrapper takes a shorter trip. That can make it easier to throw away at the moment you notice it.', 'Move the bin and you flip that. **Now the easy choice is the tidy one.**', 'Would a bin closer to this spot make it easier?', HOME_SOURCES),
  resetLesson('focus.timer', 'Choose when to stop before you start', 'Tidying can feel difficult to begin when you do not know how long it will take. **A short time limit** makes the commitment clearer.', 'When you know the job ends in five minutes, starting asks very little of you. When the timer rings, you are allowed to stop.', 'Your brain can relax. **A known ending makes starting easier.**', 'What short stopping point feels doable today?', HOME_SOURCES),
  resetLesson('focus.landing', 'Keep one small surface ready', 'Searching for your keys or notebook can add work to an already busy morning. **Keeping one small spot clear** gives the things you need somewhere to go.', 'When that spot stays clear, tomorrow starts easier. Having a familiar place can reduce the searching you need to do before leaving.', 'It saves you a search in the morning. **It gives your things a home.**', 'Which small surface would help me most tomorrow?', HOME_SOURCES),
  resetLesson('focus.doorway', 'Use arriving home as a reminder', 'You may intend to put things away after coming home, then forget as the evening starts. **Link one small action to arriving** so that familiar moment can remind you.', 'You already come home every day. Linking one action to that moment gives you a reminder without adding another alarm.', 'You do not need to remember anything new. **The door becomes your reminder.**', 'What small action could follow coming home?', HOME_SOURCES),
  resetLesson('focus.edge', 'Decide what “done” means first', 'A small tidy-up can gradually turn into cleaning the whole room. **Deciding what finished means** helps you keep the job to the size you intended.', 'A clear finish stops a small job from growing into “fix the whole room.” You get to feel done.', 'Draw the finish line first. **Then you can actually reach it.**', 'What small result would be enough today?', HOME_SOURCES),
  resetLesson('focus.livedin', 'Mess does not describe who you are', 'Seeing mess at home can bring up harsh thoughts about yourself. **Describe the objects you see** so you can separate a practical task from those judgments.', 'When you describe what is there, you can see a task. When you judge yourself, the task feels much bigger.', 'Drop the judgment. **Stick to what you can see.**', 'What is here, and what story am I adding to it?', HOME_SOURCES),

  resetLesson('focus.ending', 'Choose when to close the feed', 'A feed keeps offering new posts after you have seen what you came for. **Choosing an ending before opening it** gives you a way to notice when your visit is complete.', 'A social feed never runs out of posts, so it will never tell you to stop. A plan made beforehand gives you a clear way out.', 'It will never say stop. **So you pick the end yourself.**', 'What am I opening this app to see?', PHONE_SOURCES),
  resetLesson('focus.unlock', 'Name why you opened your phone', 'You may unlock your phone for one reason and find yourself doing something else. **Naming the reason before you tap** helps you keep the original task in view.', 'A clear reason is easier to stick to than a vague wish to use your phone less.', 'It happens to everyone. **Naming the job keeps you on track.**', 'What am I picking up my phone to do?', PHONE_SOURCES),
  resetLesson('focus.default', 'Move one app that pulls you in', 'An app you see every time you unlock your phone can become easy to open without thinking. **Moving its icon** creates a small pause before that familiar tap.', 'A bright icon invites a tap every time you see it. Moving it adds a tiny pause, and that pause gives you a choice.', 'That one second is when you get to decide. **Small speed bumps change habits.**', 'Which icon or alert pulls me in most often?', PHONE_SOURCES),
  resetLesson('focus.hands', 'Plan the minute after putting your phone down', 'After putting your phone down, you may feel restless and pick it up again. **Having one simple next action ready** gives you something else to try during that gap.', 'That first quiet minute can feel empty or restless. With a small next move ready, it is easier to stay off.', 'Fill the gap with something simple. **Then the urge has less to grab.**', 'What could I do for one quiet minute?', PHONE_SOURCES),
  resetLesson('focus.charger', 'Charge your phone where it helps you rest', 'If you reach for your phone while trying to sleep, its charging spot may make that easier. **A spot farther from your hands** can give you a moment to choose.', 'A phone beside your bed is easy to grab when you wake up at night. A few steps away, grabbing it becomes a real choice.', 'That short walk is enough. **Distance gives you a moment to choose.**', 'Would moving my charger make bedtime easier?', PHONE_SOURCES),
  resetLesson('focus.save', 'Keep the message, leave the feed', 'You might open an app to reply to a friend, then drift into posts you did not come to see. **Finish the task you intended** before deciding whether to stay.', 'You came for a message from a friend. Finishing that first keeps the good part of the visit and skips the rest.', 'Get the good part. **Then you are free to leave.**', 'What did I actually open the app for?', PHONE_SOURCES),
  resetLesson('focus.wait', 'Pause before checking a new alert', 'An alert can feel like something you must answer simply because it has arrived. **Pausing before a nonurgent message** gives you a moment to check whether it needs attention.', 'Alerts feel urgent because they arrive right now. A short pause lets you ask if it really needs you now.', 'Most messages can wait a minute. **Arriving now does not mean urgent.**', 'Does this alert need my attention right now?', PHONE_SOURCES),
  resetLesson('focus.company', 'Try using one screen at a time', 'If a video is playing while you scroll another app, your attention has two streams to follow. **Trying one screen during a break** can help you notice how much input suits you.', 'A video plus a feed gives your attention two things to chase. Dropping one shows you how much input feels best for you.', 'Try the same break with just one. **Notice the difference.**', 'How do I feel after one screen compared with two?', PHONE_SOURCES),
  resetLesson('focus.capture', 'Save what matters and close the app', 'Finding a useful recipe or article can make leaving a feed feel difficult. **Saving the item somewhere you can find it** lets you keep it without continuing to scroll.', 'A good find can keep you scrolling because you are afraid to lose it. Saving it somewhere safe lets you leave with what you came for.', 'Give it a safe home. **Then you are free to go.**', 'What do I want to keep from this visit?', PHONE_SOURCES),

  resetLesson('body.corner', 'Care for one part of a hard day', 'A difficult morning may leave you feeling that the whole day has gone wrong. **Meeting one need in the next part of the day** is still possible, even if other problems remain.', 'A meal, a glass of water or a short rest is one small choice. It does not have to fix everything to help.', 'One bad part does not decide the rest. **The day is still open.**', 'What is one small thing I need this afternoon?', RECOVERY_SOURCES),
  resetLesson('body.signal', 'Check what your body needs first', 'When you feel stuck, working out the whole reason can be difficult. **Checking a basic need first**, such as hunger or an uncomfortable position, gives you something specific to consider.', 'You may be able to meet a basic need even before you understand everything that feels difficult. It gives you one practical thing to try, without assuming it explains the whole problem.', 'Start small. **Small questions get answered.**', 'Am I hungry, thirsty, tense or uncomfortable?', RECOVERY_SOURCES),
  resetLesson('body.comfort', 'Notice how a break leaves you feeling', 'An activity that looks relaxing may not feel restful to you today. **Notice how you feel after a break** so you can learn which choices suit your needs.', 'Two breaks can look the same and feel very different. Checking how you feel afterward helps you pick a better one next time.', 'You will not know until you check. **The after-feeling tells you which is which.**', 'Which break helped me feel ready to keep going?', RECOVERY_SOURCES),
  resetLesson('body.floor', 'Make the first step small enough', 'On a day with less energy, your usual first step may feel too demanding. **Choosing a smaller useful action** lets you adjust to what you can comfortably do.', 'A tiny step, like opening the app, keeps you moving. You can try one manageable action, or rest if that is what you need.', 'Small still counts. **Any step keeps you moving.**', 'What first step could I do with the energy I have?', RECOVERY_SOURCES),
  resetLesson('body.sight', 'Put helpful things where you see them', 'You may intend to use something helpful, such as a water bottle, but forget when it is out of sight. **Placing it where you need it** can provide a simple reminder.', 'A water bottle on the table reminds you to drink. In another room, it gets forgotten until you are already thirsty and tired.', 'The fix is easy and takes ten seconds. **Move the bottle where you will see it.**', 'What could I put where I will see it?', RECOVERY_SOURCES),
  resetLesson('body.decision', 'Check basic needs before a hard decision', 'A decision may feel more demanding when you are hungry, thirsty, or tired. If it can wait, **check those needs before deciding** and meet one that you can.', 'These basic needs make simple choices feel hard. Meeting them first clears your head.', 'If hunger is adding to the difficulty, **having something to eat can come before a decision that can wait**.', 'Have I eaten, had water or rested lately?', RECOVERY_SOURCES),
  resetLesson('body.hour', 'A hard morning does not decide the afternoon', 'After a rough morning, it can be hard to imagine the afternoon going differently. **Looking at what the next hour needs** gives you a smaller part of the day to work with.', 'Calling the whole day ruined hides what is still possible. Thinking one hour at a time brings it back into view.', 'But it has no say over what comes next. **The next hour has not happened yet.**', 'What could help me in the next hour?', RECOVERY_SOURCES),
  resetLesson('body.finish', 'Choose a clear place to stop', 'Finishing one task can lead you straight into another before you have chosen to continue. **Naming a stopping point** helps you notice when the original task is complete.', 'A clear stopping point keeps one good task from turning into five more you never agreed to. You get to actually feel finished.', 'Fix it before you begin, not halfway through. **Set the finish line first.**', 'What would be enough for now?', RECOVERY_SOURCES),
  resetLesson('body.returnpath', 'Leave yourself an easy way back', 'Resting can feel difficult when you worry about finding your place afterward. **Leaving a simple reminder of the next step** can make returning easier.', 'A note or object in plain sight tells you where to pick up. Coming back takes no planning at all.', 'You know exactly where to start. **So you can rest without worry.**', 'What small reminder would help me after I rest?', RECOVERY_SOURCES),

  resetLesson('quiet.when', 'Say when you will do the small step', 'A small action can be easy to forget when its timing is vague. **Pairing it with an ordinary daily moment**, such as lunch, gives you a reminder that is already part of your day.', '“After lunch” gives you a moment to look for, while “sometime today” leaves the timing undecided. Choose a moment that usually happens in your day.', 'You stop having to remember. **A set moment does the remembering.**', 'What daily moment could remind me to start?', SELF_TRUST_SOURCES),
  resetLesson('quiet.cue', 'Put the reminder where you need it', 'A reminder may be easy to miss if it appears somewhere you do not look when you need it. **Put it near the place where the action begins**.', 'A reminder only works if you see it at the right moment. An alert buried in an app gets missed.', 'The reminder is in the wrong place. **Move it to where you will be.**', 'Where would I see a helpful reminder?', SELF_TRUST_SOURCES),
  resetLesson('quiet.no', 'Have a smaller plan for hard days', 'Your usual plan may be too much on a difficult day. **Choosing a smaller option in advance** gives you something manageable to consider when your energy or time changes.', 'Then “I cannot do it all” turns into “I can do this part,” instead of “I will do nothing.”', 'Decide it ahead of time. **A backup plan stops that slide.**', 'What smaller step could still fit a hard day?', SELF_TRUST_SOURCES),
  resetLesson('quiet.yes', 'Make room for a promise you want to keep', 'An action you want to do still needs room among your other responsibilities. **Look for a realistic moment before promising it to yourself**, so the promise fits your actual day.', 'A promise needs time, even a small one. If the evening is already full, the promise has nowhere to go, and you end up feeling let down.', 'Make room before you say yes. **Find the time first, then promise.**', 'Where would this promise fit in my real day?', SELF_TRUST_SOURCES),
  resetLesson('quiet.story', 'One missed step is one event', 'Missing a short guided practice in Azora, called a Reset, can bring up a much bigger judgment about yourself. **Describe the one missed activity** before deciding what it means.', 'It does not prove you always fail. Talking about one event lets you find the reason and fix it.', 'Shrink it back down. **One miss is one event.**', 'What happened, and what could help next time?', SELF_TRUST_SOURCES),
  resetLesson('quiet.yesterday', 'Use what worked before', 'A particular time or place may have made a guided practice easier to begin before. **Trying that helpful detail again** gives you a starting point for your next attempt.', 'You do not need a new plan every day. What worked once is the best place to start.', 'What worked before gives you **a useful clue to try again**, rather than a rule you must follow.', 'What made a past Reset easier to start?', SELF_TRUST_SOURCES),
  resetLesson('quiet.plain', 'Keep a promise specific and small', 'A promise can become harder to keep when it includes a feeling you hope to have. **Name the action itself**, such as following one short guided practice in Azora after breakfast.', '“And I must feel calm afterward” adds a part you cannot control. An action is easy to check. A feeling is not.', 'Cut the extras. **Keep it to the action.**', 'What exactly did I agree to do?', SELF_TRUST_SOURCES),
  resetLesson('quiet.boundary', 'Protect a little time for what matters', 'Messages and requests can fill a moment you wanted for yourself. **A small boundary, or limit on your availability**, can help you protect that time while keeping necessary contact possible.', 'Without one, requests and buzzes eat up the time you set aside. A small limit keeps that time yours.', 'Ten quiet minutes can be enough. **Small limits protect big things.**', 'What could I pause for a few minutes?', SELF_TRUST_SOURCES),
  resetLesson('quiet.receipt', 'Remember what you did, not only what you missed', 'After a missed activity, you may overlook the things you did complete. **Remembering both completed and missed steps** gives you a fuller picture of your follow-through.', 'Your memory holds on to misses and forgets wins. Counting both gives you the true picture, and real confidence.', 'Give your wins equal space. **They are part of the story too.**', 'What is one thing I actually followed through on?', SELF_TRUST_SOURCES),
] as const;

export const LIFE_RESET_LESSONS = [
  ...BASE_LIFE_RESET_LESSONS.map((lesson) => {
    const opening = lesson.blocks.filter((block) => block.kind === 'text');
    const choice = lesson.blocks.find((block) => block.kind === 'choice');
    const interaction = lesson.blocks.find((block) => block.kind === 'reveal');
    const closing = lesson.blocks[lesson.blocks.length - 1];
    const depth = BASE_LESSON_DEPTH[lesson.id];
    return {
      ...lesson,
      blocks: [
        { kind: 'text' as const, text: `${opening[0].text} ${opening[1].text}` },
        { kind: 'text' as const, text: `${opening[2].text} ${depth[0]}` },
        { kind: 'text' as const, text: depth[1] },
        { kind: 'text' as const, text: depth[2] },
        ...(choice == null ? [] : [choice]),
        ...(interaction == null ? [] : [interaction]),
        closing,
      ],
    };
  }),
  ...EXPANDED_LIFE_RESET_LESSONS,
] as const satisfies readonly LessonDefinition[];
