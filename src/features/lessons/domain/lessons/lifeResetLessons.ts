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
      { kind: 'text', text: 'A messy room means things are out of place. It does not prove anything about your worth. **The room is a space, not a judgment.**' },
      { kind: 'text', text: 'When you think “I am a mess,” it can be hard to see what to do. **Name one thing you can see** instead, such as dishes on the counter.' },
      { kind: 'text', text: 'You can begin without waiting to feel motivated. **Choose one small area** you could use more easily, such as part of the counter.' },
      { kind: 'choice', prompt: 'You see dishes on the counter and think, “I cannot keep anything together.” Which description gives you a place to start?', options: [
        { label: 'There are dishes on the counter', feedback: 'This names what is visible without turning the room into a verdict about you. You can choose one area from here.' },
        { label: 'I need to fix the whole kitchen', feedback: 'That adds a large task to an already hard moment. Try describing only what you can see first.' },
      ] },
      { kind: 'reveal', prompt: 'Tap both parts of a description that helps you begin.', items: [
        { label: 'What I can see', detail: 'There are dishes on the counter. This is a fact about one part of the room.' },
        { label: 'What I can do', detail: 'I can move one dish or clear a small area. The action does not need to fix everything.' },
      ] },
      { kind: 'do', text: 'Look at one part of the room. **Say what is there** without adding a judgment about yourself.' },
    ],
    source: 'Behavioural activation and self-compassion research both support reducing shame and making an avoided task more specific before approaching it.',
  },
  {
    id: 'focus.visible',
    title: 'Start with the part you can see',
    step: 'Choose one small area around you to make easier to use.',
    blocks: [
      { kind: 'text', text: '“Clean the whole place” gives you many jobs at once. **Choose one area you can see**, such as the table in front of you.' },
      { kind: 'text', text: 'You only need to decide what to do first. **One small area** gives you a clear place to start.' },
      { kind: 'text', text: 'If you clear enough space for a cup, that area is more useful. **A small result counts** even when the rest of the room is unchanged.' },
      { kind: 'do', text: 'Look around you and **choose one small area** you could make easier to use.' },
    ],
    source: 'Executive-function guidance commonly recommends breaking large domestic tasks into visible, bounded steps to reduce initiation overload.',
  },
  {
    id: 'focus.return',
    title: 'You can return without catching up',
    step: 'Open today’s plan and pick one item that fits now.',
    blocks: [
      { kind: 'text', text: 'A program day is your current set of assigned resets, lesson, and check-in. If you miss a calendar day, **that set stays open** until you finish it.' },
      { kind: 'text', text: 'Trying to do everything at once can make returning feel harder. **Start with today’s open set**, one assigned item at a time.' },
      { kind: 'text', text: 'A quiet return is enough. **You do not need a dramatic restart** or proof that you will never miss again.' },
      { kind: 'do', text: 'Open your current plan day and **choose one assigned item** that fits now.' },
    ],
    source: 'Relapse-prevention and habit-maintenance approaches emphasize restarting after lapses rather than using missed days as evidence of failure.',
  },
  {
    id: 'focus.loop',
    title: 'Notice what happens before you scroll',
    step: 'Next time you reach for your phone, name what just happened.',
    blocks: [
      { kind: 'text', text: 'Before you scroll, something often happens: a task ends, you feel bored, or the phone lights up. **That moment is a cue**, or a reminder to reach for the phone.' },
      { kind: 'text', text: 'If you notice the cue, you can ask what you need. **A short pause gives you a choice** before you open an app.' },
      { kind: 'text', text: 'You may still choose to scroll. **The useful skill is noticing** why you picked up the phone.' },
      { kind: 'choice', prompt: 'You unlock your phone without a task in mind. What could you notice first?', options: [
        { label: 'What happened just before I reached?', feedback: 'That question looks for the cue: boredom, a pause, a feeling, or something else. Knowing the cue gives you a choice next time.' },
        { label: 'How long have I already scrolled?', feedback: 'Time can be useful later. Here, the earlier cue tells you more about how the loop began.' },
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
      { kind: 'text', text: 'An urge is a strong want to do something, like checking your phone right away. **Wanting to check does not require checking** this second.' },
      { kind: 'text', text: 'Wait for a few breaths and notice the feeling. **The urge may change** or stay strong; either way, you have had time to decide.' },
      { kind: 'text', text: 'You can still use your phone after the pause. **The point is to choose** instead of reacting without noticing.' },
      { kind: 'do', text: 'When you want to check your phone, **pause for a few breaths**, then decide whether to open it.' },
    ],
    source: 'Mindfulness-based approaches use urge observation and brief pauses to reduce automatic responding without demanding perfection.',
  },
  {
    id: 'focus.offline',
    title: 'Notice which breaks help you rest',
    step: 'After your next break, notice whether you feel more rested.',
    blocks: [
      { kind: 'text', text: 'Sitting still with a busy feed may leave your mind active. **Stillness and rest can feel different** for different people.' },
      { kind: 'text', text: 'A break without a feed can be simple: drink water, look outside, or listen to one song. **It does not need to be productive.**' },
      { kind: 'text', text: 'Screens can also be enjoyable. **Notice how each break leaves you** instead of making a rule that one kind is always better.' },
      { kind: 'do', text: 'After your next break, **notice whether you feel** more rested, more alert, or about the same.' },
    ],
    source: 'Sleep and attention guidance recommends reducing stimulating screen use before rest and observing its effect on alertness and recovery.',
  },
  {
    id: 'body.capacity',
    title: 'Your energy can change each day',
    step: 'Pick one of today’s items that fits your energy, or rest.',
    blocks: [
      { kind: 'text', text: 'Your available energy can change with sleep, health, stress, and daily demands. **Less energy today is information**, not a judgment about you.' },
      { kind: 'text', text: 'If the full plan feels too much right now, **one assigned item can still be done**. The program day remains open until all its items are complete.' },
      { kind: 'text', text: 'You can do one item, pause, and return later. **Rest is also an option** when that is what you need.' },
      { kind: 'choice', prompt: 'Today’s full set feels too much. Which response keeps the plan honest and gentle?', options: [
        { label: 'Do one assigned item, then check how I feel', feedback: 'One item is real progress. The current plan day stays open until every assigned item is complete.' },
        { label: 'Call the whole day complete after one minute', feedback: 'A brief pause may help, but the next plan day opens only after today’s resets, lesson, and check-in are complete.' },
      ] },
      { kind: 'do', text: 'Look at today’s assigned items. **Choose one that fits now**, or decide to rest and return later.' },
    ],
    source: 'Pacing and self-management guidance recommends adjusting activity to current energy and avoiding all-or-nothing responses to difficult days.',
  },
  {
    id: 'body.gentle',
    title: 'A small step can help on a hard day',
    step: 'Do one small act of care that fits your energy today.',
    blocks: [
      { kind: 'text', text: 'On a hard day, “push harder” can sound like the only plan. **A smaller action is still an action** if it meets a real need.' },
      { kind: 'text', text: 'For example, drink water, make food easier to reach, or open your plan. **Pick a step that fits your energy** right now.' },
      { kind: 'text', text: 'The step may not change your mood. **Notice whether it helps** with the next hour, even a little.' },
      { kind: 'do', text: 'Choose **one small act of care** you could do without pushing past your energy today.' },
    ],
    source: 'Behavioural activation and compassionate mind approaches support achievable, values-aligned actions rather than harsh self-criticism.',
  },
  {
    id: 'body.enough',
    title: 'Decide when enough is enough',
    step: 'Before starting a task, decide where you will stop.',
    blocks: [
      { kind: 'text', text: 'If you keep adding tasks, it can become hard to feel finished. **Choose a stopping point** before you begin.' },
      { kind: 'text', text: 'For example, you might decide to do one assigned reset and then rest. **That is a clear plan** for now; other assigned items can wait.' },
      { kind: 'text', text: 'Stopping your personal effort for now is separate from completing the program day. **The day stays open** until all assigned items are done.' },
      { kind: 'do', text: 'Before starting one task, **say where you will stop**. Let that be enough for this session.' },
    ],
    source: 'Pacing and behavioural activation approaches use achievable limits to reduce overwhelm and support repeated engagement over time.',
  },
  {
    id: 'quiet.trust',
    title: 'Remember the times you returned',
    step: 'Recall one time you came back to something important after a miss.',
    blocks: [
      { kind: 'text', text: 'Self-trust means believing you can take a step and return after a miss. **Look for real examples** of times you did that.' },
      { kind: 'text', text: 'An example can be small: you opened the plan, paused before replying, or came back after a hard day. **Small actions are evidence.**' },
      { kind: 'text', text: 'You do not have to keep every promise perfectly. **You can notice the miss** and choose a next step.' },
      { kind: 'choice', prompt: 'You missed a reset and think, “I never follow through.” What would a fair account include?', options: [
        { label: 'The miss and the times I did return', feedback: 'A fair account includes both. One missed action cannot prove an “always” about you.' },
        { label: 'Only the miss, so I try harder', feedback: 'That leaves out evidence. Notice what happened, then use earlier returns to choose a workable next step.' },
      ] },
      { kind: 'do', text: 'Name **one time you returned** to something important after a miss.' },
    ],
    source: 'Self-efficacy research links confidence with repeated experiences of manageable action and recovery after setbacks.',
  },
  {
    id: 'quiet.voice',
    title: 'Speak to yourself in fair words',
    step: 'Rewrite one harsh thought as a fact and a next step.',
    blocks: [
      { kind: 'text', text: 'A thought like “I always fail” can make one hard moment feel like a verdict on your life. **That thought may leave out facts.**' },
      { kind: 'text', text: 'A fairer sentence names what happened: “I missed today’s reset.” **Specific words help you see** what to do next.' },
      { kind: 'text', text: 'You do not need to tell yourself everything is fine. **Tell the truth without insults** about yourself. A missed task is something you can respond to; a label about your whole self is harder to use.' },
      { kind: 'do', text: 'When you notice a harsh thought, **rewrite it as one specific fact** and one possible next step.' },
    ],
    source: 'Self-compassion research links a less punitive inner response with resilience and willingness to re-engage after difficulty.',
  },
  {
    id: 'quiet.repair',
    title: 'After a miss, choose a next step',
    step: 'Name one small adjustment to try after a missed intention.',
    blocks: [
      { kind: 'text', text: 'If you missed something you planned, first say what happened. **One miss is one event**, not a label for who you are.' },
      { kind: 'text', text: 'Next, ask what got in the way. Was the time crowded, the reminder easy to miss, or the task too large? **The reason can guide a change.**' },
      { kind: 'text', text: 'Repair means trying a workable next step, such as moving the reminder or choosing a smaller start. **You can begin again** without punishing yourself.' },
      { kind: 'do', text: 'Think of one missed intention and **name one small adjustment** you could try next time.' },
    ],
    source: 'Relapse-prevention and self-compassion approaches frame setbacks as information and encourage a specific, non-punitive return to practice.',
  },
] as const satisfies readonly LessonDefinition[];

const BASE_LESSON_DEPTH = {
  'focus.home': [
    'A fact is something you can point to. **“There are dishes on the counter” is a fact.** “I cannot keep anything together” is a much bigger story about you. If the story appears, you do not need to argue with it. You can return to what your eyes can actually see.',
    'The fact gives you a possible first move, like washing one plate. The bigger story gives you no clear task. **Specific words make starting easier.** A plate can be washed, moved, or left for later; a judgment about your whole self cannot tell you what to do next.',
    'If you are tired, you can decide to wait. A fair description still helps because it shows **what needs care** when you are ready.',
  ],
  'focus.visible': [
    'Imagine a table covered with things. **Make room for a cup** is a clearer job than “fix the room.” You can see when the cup will fit. You might move two papers and a bag, then have enough space. The rest of the table can remain as it is for now.',
    'Before starting, choose one surface, one basket, or a few minutes. **That gives the task an end** so you need not decide when to stop as you work. If the chosen area turns out to need more than you expected, you can make the boundary smaller instead of pushing through.',
    'When the cup has a place, pause. The rest of the room can wait. **The small result serves a purpose** even if the room is not finished.',
  ],
  'focus.return': [
    'Suppose you miss a few calendar days. **The same set waits for you** when you return; the app does not add new sets for the days you missed. For example, if your lesson was still open on Monday, you can read that same lesson on Thursday. Thursday does not come with extra lessons to repay.',
    'You can do one assigned item now and the rest later. **The plan advances after the full set is done**, whenever that happens. Completing one reset keeps that reset marked done. You still need the other assigned items before the next program day opens, even if the calendar changes overnight.',
    'You may not feel excited to return. That is okay. **Opening the plan again is a return** even when it feels ordinary.',
  ],
  'focus.loop': [
    'A cue is the thing that starts an action. **Finishing a task can be a cue:** the task ends, there is a gap, and your hand moves toward the phone. The cue can also be a sound, a place, or a feeling. You are looking for what happened immediately before the reach.',
    'Name the order: **task ends, hand reaches, app opens**. Then ask what you wanted from the app, such as a break or a message from someone. If you wanted a break, you can decide whether the feed would help. If you wanted a message, you can go straight to that conversation.',
    'Next time, you can open the app on purpose or do something else first. **Either way, notice the choice** you are making.',
  ],
  'focus.pull': [
    'You might feel restless in your hands or think “just check quickly.” **Name the urge:** “I want to check my phone.” An urge can feel strong without being an instruction. You can notice its strength and still decide what to do after a short pause.',
    'Take a few breaths before deciding. Ask whether checking would help with something you need right now. **The pause is a small test**, not a contest. Sometimes the urge eases; sometimes it does not. Both outcomes teach you something about the moment without requiring you to win or lose.',
    'If you need to contact someone or get information, use the phone. **You can choose to check** after you have noticed why.',
  ],
  'focus.offline': [
    'Think of one break with a feed and one without it. After each, did you feel rested, entertained, restless, or the same? **Your own answer matters.** A feed can be fun while still leaving your attention busy, and a quiet minute can be boring while still helping you settle. Those are different results.',
    'A break with less to follow could be a drink without a screen, looking outside, or listening to music. **Try one for a minute** and see how it feels. You do not need to choose the same kind of break every day. Match it to whether you want entertainment, connection, or a little less input.',
    'A screen may be fun or help you connect with someone. **Choose the break you need** instead of assuming all quiet-looking breaks feel the same.',
  ],
  'body.capacity': [
    'A task can feel harder after poor sleep or a busy day. **The task may be the same, but your energy is different.** Think of carrying groceries on a rested morning and after a long shift. The bags have not changed, but the effort can feel different. That difference is useful information when you choose your next step.',
    'The plan still asks for the same assigned items. You can do one now and return later, or rest first. **The program day stays open** until all items are complete. For example, if two resets are assigned and you finish one, that one remains done. You can return to the other when it fits instead of starting over.',
    'Ask “What can I do now?” This gives you a next step. “Why can’t I do everything?” can turn the moment into **a judgment about yourself.**',
  ],
  'body.gentle': [
    'Imagine an afternoon when even choosing a task feels hard. “Push harder” gives no clear direction. **“Drink water, then open the plan” names two small moves.** You can try the first move without promising the second. If the drink is enough for now, you can rest and look at the plan later.',
    'You can prepare for less time, pause between items, or do one assigned reset now. **A smaller start can fit** the energy you have. The app still keeps unfinished items open, so doing one part is an honest start rather than a claim that the whole day is done. You can check again after each part.',
    'The step may not change your mood. Ask whether it made the next moment easier to handle. **A small effect is useful information.**',
  ],
  'body.enough': [
    'Say the stopping point before you start: “After one assigned reset, I will sit down.” **A clear end makes it easier to stop** without adding another task. You know what you are agreeing to, and you can notice when you have done it. This is especially useful when a task tends to grow after you begin.',
    'If you think “This does not count unless I do more,” ask who made that rule. **One completed action is still completed** even when other tasks remain. It is fair to name both facts: you did the reset, and the rest of the program day is still open. Neither fact cancels the other.',
    'Stopping now is different from marking the program day complete. **You can rest with items still open** and return to them later.',
  ],
  'quiet.trust': [
    'After a miss, write two facts: what you missed and one time you came back. **Both facts belong** in a fair account. For example, “I missed Tuesday’s reset” and “I returned on Thursday” can both be true. The second fact does not erase the first; it keeps the record from becoming a story that you never return.',
    'Ask what got in the way. Was the time crowded? Was there no reminder? **A specific reason suggests a specific change.** If dinner time is always busy, move the reset to another part of the day. If you forgot, place a reminder where you will actually see it. You can change the setup instead of judging yourself.',
    'Try a small, clear plan, such as “After breakfast, I will open today’s plan.” **You can check what happened** and adjust it next time.',
  ],
  'quiet.voice': [
    '“I am useless” is a label about your whole self. “I missed a reset yesterday” describes **one event you can name**. A label gives you no clear action. An event gives you a question you can answer: What made the reset hard to do, and when might there be room to return?',
    'A fair reply could be “I missed it, and I can choose when to return.” **That is honest** without pretending everything is fine. You might still feel disappointed. The point is to describe the disappointment and the missed action without turning them into a claim about every part of who you are.',
    'Ask whether your new sentence shows a possible next step. **Helpful words make the next choice clearer.**',
  ],
  'quiet.repair': [
    'Imagine planning a quiet evening, then using your phone through it. **Name the event:** “I used my phone longer than I planned.” That sentence is specific enough to examine. “I always ruin my evenings” is broader than the evidence and gives you no clear place to begin again.',
    'Ask why it happened. Was the phone beside you? Did you want to talk to someone? **The reason can help you choose** what to change. If you needed company, a planned conversation may fit better than a vague ban on screens. If the phone was simply close, moving it may be enough to test next time.',
    'Try one change, such as moving the charger or making the quiet time shorter. **A next step can follow a miss** without erasing it.',
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
  const introduction = { kind: 'text' as const, text: `**Here is the idea:** ${claim} ${reason}` };
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
      { kind: 'text' as const, text: `**For example:** ${practice.situation} ${insight}` },
      { kind: 'text' as const, text: LIFE_RESET_EXPLANATION[id] },
      { kind: 'text' as const, text: `${practice.response} ${practice.limit}` },
      { kind: 'do' as const, text: `${LIFE_RESET_TODAY[id]} Then ask: ${reflection}` },
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
    situation: 'Imagine looking at a pile of laundry. “Do laundry” still leaves you deciding whether to gather, wash, fold, or put away. **That hidden decision is part of the effort.**',
    response: '**Name one physical** action instead: put the clothes already in your hands into the hamper. When that is done, decide again. The first action does not commit you to finishing all the laundry.',
    limit: 'If even that action feels too large, make it smaller or leave it for later. **A useful step is one you can actually start**, not the most impressive one.',
  },
  'focus.eyes': {
    situation: 'You notice a cup on the table each time you walk past. It may be less urgent than the cupboard, but you already know where to begin. **Visibility removes one decision.**',
    response: '**Try returning the** cup, then pause and look again. You can choose another visible item or stop. The point is to practice starting without a perfect ranking of the room.',
    limit: 'If what catches your eye belongs to someone else or needs a bigger decision, choose a different item. **You do not have to move the first thing you see.**',
  },
  'focus.sort': {
    situation: 'A stack of papers invites a whole filing system. But one envelope may already have a known home. **Returning that envelope is a different task from sorting the stack.**',
    response: '**Separate known destinations** from uncertain ones. Put away an item with a clear destination, and leave uncertain items together for a later sorting decision.',
    limit: 'Some belongings really do need a new system. You can still postpone designing it until you have time and attention for that job. **One return can be enough today.**',
  },
  'focus.bin': {
    situation: 'You mean to discard a wrapper, but the bin is across the room. Leaving it nearby becomes the easiest option. **The room has made one choice more convenient.**',
    response: '**Notice where the** decision happens and whether a small bin or bag could live there. Test the location for a few days before deciding it is the right setup.',
    limit: 'This is a small test, not a rule about tidy homes. If a bin there creates another problem, move it. **The setup should work in your space.**',
  },
  'focus.timer': {
    situation: '“I should clean until it looks good” gives no clear end. A five-minute boundary says exactly what you are offering today. **A known ending can lower the cost of starting.**',
    response: '**Choose a short** interval and one area. When the timer ends, look at what changed before deciding whether to continue. Continuing is a fresh choice, not a debt.',
    limit: '**A timer is** only useful if you are allowed to stop when it rings. If time pressure makes you tense, choose a visible endpoint instead, such as clearing one chair.',
  },
  'focus.landing': {
    situation: 'A desk can stay busy while one corner has room for tomorrow’s notebook. **One small usable spot can help** even when the rest of the room is not finished.',
    response: '**Pick a small** surface and name its job. Move only what prevents that job, then leave the space available. Protecting it may be easier than clearing every surface.',
    limit: '**If the spot** fills again, that tells you something about how the space is used. Adjust its purpose or location rather than treating the change as a failure.',
  },
  'focus.doorway': {
    situation: 'You enter with your bag and keys, then forget the small reset you hoped to do. **Arrival already happens every day**, so it can carry a reminder.',
    response: '**Connect one action** to that moment: after setting down your keys, return one item to its place. Say the reminder and action together so the plan is clear.',
    limit: '**If that reminder** gets lost on rushed days, choose a time that happens more reliably. You do not have missed actions to repay.',
  },
  'focus.edge': {
    situation: '“Tidy the kitchen” can expand from the counter to cupboards to the floor. **Without an edge, finishing keeps moving away.**',
    response: '**Before starting, define** a finish you could recognize: the table is usable, or three items are returned. Stop there and notice whether it met today’s need.',
    limit: '**A boundary can** be revised when you genuinely have more time. It should not quietly grow because the first effort feels too small to count. You can return to the larger job another day.',
  },
  'focus.livedin': {
    situation: '**A blanket on** the sofa or dishes after dinner show that people used the room. The thought “I have failed again” adds a judgment that the objects cannot prove.',
    response: '**Ask two questions:** What can I see, and what story am I adding? “Three plates need washing” points to a possible action; “I am hopeless” does not.',
    limit: 'You can want a different space without using shame to get there. **A fair description leaves room for both care and change.**',
  },
  'focus.ending': {
    situation: 'You open a feed to check one update. Each swipe brings another item, so the original reason disappears. **The next item supplies its own invitation.**',
    response: '**Before opening, choose** when you will close the app: “After I read the message, I will stop.” If you get sidetracked, say your reason for opening it again.',
    limit: '**You may sometimes** choose open-ended browsing. The useful distinction is whether that was your choice or whether the feed made it for you.',
  },
  'focus.unlock': {
    situation: '**You pick up** the phone to check the weather and end up in messages. The switch can happen so quickly that the first intention vanishes.',
    response: '**At unlock, name** the job in a few words: “weather, then close.” If you reach another app, pause and decide whether the new task is needed now.',
    limit: 'This is a reminder to notice, not a test of perfect attention. **You can choose again** after opening a different app.',
  },
  'focus.default': {
    situation: '**A bright app** icon on the first screen is easy to tap during a dull pause. Moving it gives you an extra moment to decide.',
    response: '**Change one common** reminder: move an app, turn off one notification, or remove a shortcut. Notice whether you check less often before adding more rules.',
    limit: '**Some alerts matter** for work, care, or safety. Keep the access you need and change the reminder that leads to unwanted checking.',
  },
  'focus.hands': {
    situation: '**You put the** phone down and immediately feel an empty moment. That gap may be why picking it back up feels so easy.',
    response: '**Give the gap** a simple shape: look out the window, stretch your hands, or sit for three breaths. Then decide whether you still want the phone.',
    limit: 'The replacement does not need to be productive. **A small pause makes the choice visible**; it does not require you to avoid the phone afterward.',
  },
  'focus.charger': {
    situation: '**A phone charging** beside the bed is within reach during a wakeful minute. On a shelf across the room, reaching becomes a deliberate action.',
    response: '**Choose a charging** place that supports the boundary you want. If you use the phone as an alarm, test whether the new place still works for waking.',
    limit: 'Your setup has to fit your home and responsibilities. **Distance is a tool**, not a moral rule about where a phone belongs.',
  },
  'focus.save': {
    situation: '**You open a** message from a friend and then stay for unrelated posts. The connection was valuable; the extra checking may not be.',
    response: '**Name the part** you came for. Reply to the friend, save a useful post, or write down the idea, then close the surrounding feed.',
    limit: 'You can also decide to browse for pleasure. **The skill is choosing the purpose** and noticing when the app takes you somewhere else. Enjoyment is a valid reason to use it.',
  },
  'focus.wait': {
    situation: '**A notification arrives** while you are resting. The urge to check can feel urgent even when the message has no deadline.',
    response: '**Notice the pull** in your hands or attention and wait for a few breaths. Ask whether this needs an answer now. Then make a choice without judging the urge.',
    limit: 'If the message is urgent, respond. **The pause is for deciding**, not for proving how long you can wait.',
  },
  'focus.company': {
    situation: '**A video plays** while you scroll another app. Both streams offer something to follow, and you may notice you feel less settled afterward.',
    response: '**Try one source** of input for a few minutes. Keep the video or keep the feed, then compare how your attention feels with the usual combination.',
    limit: 'Silence is not the goal. Background sound can be comforting. **Use your own response as information** about how much input helps during this part of the day.',
  },
  'focus.capture': {
    situation: '**You see a** useful recipe or sentence and keep scrolling because you might lose it. The useful item becomes a reason to stay.',
    response: '**Save the specific** item, send it to yourself, or write its name down. Close the app and check later whether you still want it.',
    limit: 'Saving everything creates another pile. **Capture only what you expect to use**, and let a passing idea pass when that is enough.',
  },
  'body.corner': {
    situation: '**A difficult morning** can make the thought “today is gone” sound convincing. Yet lunch, a shower, or a short walk is still a separate decision.',
    response: '**Pick one part** of the day to care for. For example, drink water with lunch, sit near daylight, or complete one assigned reset when it fits.',
    limit: 'One helpful moment does not have to rescue the whole day. **Helping with the next hour is enough.**',
  },
  'body.signal': {
    situation: '**When you feel** stuck, asking “How do I fix my life?” may be too broad. Asking “Am I thirsty, hungry, tense, or uncomfortable?” is narrower.',
    response: '**Notice one body** signal, then try a small response that fits it: a drink, food, a changed position, or a few breaths. Check again afterward.',
    limit: 'A body check does not explain every difficult feeling. **It can remove one ordinary source of strain** before you decide what else you need.',
  },
  'body.comfort': {
    situation: '**Two breaks can** look similar from the outside but leave you differently afterward. One may soften the day; another may keep you restless.',
    response: '**After a pause,** ask what changed: energy, tension, or willingness to return. Use the answer to choose the next break, without turning comfort into a score.',
    limit: 'The same activity can help on one day and feel draining on another. **Notice the effect in this moment** rather than making a permanent rule.',
  },
  'body.floor': {
    situation: '**If the usual** plan is too much, the thought “then nothing counts” can close every option. A smaller version can leave a path open.',
    response: '**Name the smallest** useful step for today: make food easy to reach, step outside briefly, or do one assigned plan item and leave the day open.',
    limit: 'A smaller action does not change Azora’s completion rules. **Your plan day advances when all its assigned items are done**, whenever that happens. You can return to the remaining items later.',
  },
  'body.sight': {
    situation: '**You intend to** drink water but the bottle is in another room. Later, you remember only when you are already tired.',
    response: '**Put one helpful** thing near the moment you need it: a bottle on the table, shoes by the door, or a reminder beside your usual chair.',
    limit: 'If you stop noticing the item, move it or choose a different reminder. **You can change the setup** when your day changes.',
  },
  'body.decision': {
    situation: '**An afternoon choice** feels unusually irritating, and you realize you have not eaten since morning. Hunger may be adding pressure to the decision.',
    response: '**Before making a** non-urgent decision, check ordinary needs: food, water, rest, and time. Meet what you can, then return to the question.',
    limit: 'Food is not a cure for every hard feeling. **This is a check for a basic need**, not a way to dismiss what is bothering you.',
  },
  'body.hour': {
    situation: '**After an unproductive** morning, “I ruined the day” can make the afternoon feel decided. That thought predicts the future from one part of the day.',
    response: '**Describe the morning** accurately, then ask what the next hour requires. A small transition, like opening a window or starting one reset, can mark a new part.',
    limit: 'You do not need to pretend the morning was good. **The next hour can be different** without erasing what happened earlier.',
  },
  'body.finish': {
    situation: '**You finish one** helpful thing and immediately add three more. The moving finish line can make care feel impossible to complete.',
    response: '**Choose a finish** before starting: after one reset, I will rest; after lunch, I will stop planning. Notice when you reach it and allow that ending.',
    limit: 'If something still needs your attention, you can choose a new task. **A named stopping point prevents extra tasks** from being added without a decision.',
  },
  'body.returnpath': {
    situation: '**Rest can feel** risky when you imagine needing to restart the entire day afterward. One known next step makes the return less vague.',
    response: '**Before resting, leave** a simple reminder for later: set out a glass of water, write the next task on a note, or choose when you will check in again.',
    limit: 'The reminder is an invitation, not a deadline. If your energy changes, **you can choose a different next step** after the pause.',
  },
  'quiet.when': {
    situation: '**“I will do** this sometime today” asks you to keep deciding when. “After lunch, I will open today’s plan” gives the intention a place.',
    response: '**Use a moment** that already happens: after breakfast, before a shower, or when you sit down in the evening. Pair it with one specific action.',
    limit: 'If that moment does not happen, choose another time. **A missed reminder tells you about the plan**, not about your worth.',
  },
  'quiet.cue': {
    situation: '**You mean to** pause before bed, but the reminder is in an app you never open at night. You do not see it when you need it.',
    response: '**Move the reminder** to where the action begins: a note near the lamp, a book on the pillow, or a prompt attached to an existing routine.',
    limit: 'If you stop noticing a reminder, move it. **A useful reminder can change**; it does not need to be louder or more frequent.',
  },
  'quiet.no': {
    situation: '**You planned a** full evening reset, then a hard day arrives. “I cannot do all of it” can quickly become “I will do none of it.”',
    response: '**Decide on a** smaller honest option in advance. You might do one assigned item now and return later, or choose rest and keep the program day open.',
    limit: 'The smaller option helps you stay connected to the intention. **It does not claim that unfinished items are complete.**',
  },
  'quiet.yes': {
    situation: '**You promise yourself** an evening pause while the evening is already packed. The promise may be sincere, but the time has no place to live.',
    response: '**Look at what** is already scheduled. Move, shorten, or decline one optional thing if you can, then place the promise in the space that remains.',
    limit: 'Sometimes there is no room today. **An honest later time builds more trust** than agreeing to a plan your schedule cannot hold.',
  },
  'quiet.story': {
    situation: '**You miss one** reset and the thought “I never follow through” appears. The word “never” turns one event into an identity claim.',
    response: '**Write what happened** first: “I did not do the reset yesterday.” Then ask what got in the way and what you could do next.',
    limit: 'You can take the miss seriously without accepting a global verdict. **A specific account helps you adjust the plan**; a label does not.',
  },
  'quiet.yesterday': {
    situation: '**A reset was** easier after lunch yesterday. Today you begin searching for an entirely new schedule, even though that time may still work.',
    response: '**Borrow the helpful** part: time, location, or preparation. Repeat it once and observe whether it still fits. Your own experience is useful evidence.',
    limit: 'A previous success is a clue, not a requirement. **If today differs, adapt the structure** instead of measuring yourself against yesterday. The useful detail might be the place, not the time.',
  },
  'quiet.plain': {
    situation: '**“I will do** one reset” quietly grows into “and I must feel calm and finish everything else.” The original agreement has changed.',
    response: '**State the promise** as an action you can see: “I will complete the assigned reset after breakfast.” Keep it separate from how you hope to feel.',
    limit: 'Feelings are not fully under your control. **An agreement about an action is clearer** than an agreement about producing a particular mood.',
  },
  'quiet.boundary': {
    situation: '**You hope to** keep an evening promise, but requests and notifications keep entering that time. A boundary can give the intention room.',
    response: '**Choose one practical** limit: silence a non-urgent alert, tell someone when you will reply, or set aside a short private interval.',
    limit: 'A boundary should fit your relationships and obligations. **It protects a chosen action** without requiring you to ignore genuine needs. You can make exceptions deliberately instead of keeping every moment open.',
  },
  'quiet.receipt': {
    situation: '**You remember the** reset you missed but forget the three times you returned. Memory can give the miss more space than the quiet follow-through.',
    response: '**Name one specific** action you completed, with when it happened. Treat it as evidence, not a grade. Include misses too when they help you learn.',
    limit: 'A receipt does not promise you will always follow through. **It supports a fairer statement:** you have followed through before and can choose again.',
  },
} as const;

/** The extra explanation is authored per topic so the longer page earns its place. */
const LIFE_RESET_EXPLANATION = {
  'focus.category': 'Suppose you say “I will do the laundry.” Before anything moves, you still have to choose whether to collect clothes, start a wash, fold clean things, or put them away. **A named first move removes one decision.** You can finish that move and then decide, with the task in front of you, whether another step fits today.',
  'focus.eyes': 'The cup you keep seeing is a useful starting point because you already know what it is and where it belongs. **You can act without planning the whole room.** Moving it does not mean it was the most important task. It simply gives you one completed step from which you can look around again.',
  'focus.sort': 'Sorting papers asks you to decide what each one is and where it should live. Returning an envelope with a known home is simpler. **Do the certain step first.** That may make the remaining pile smaller, but it does not require you to invent a filing system while you are tired or short on time.',
  'focus.bin': 'Notice the point where rubbish usually gets left behind. If the bin is far from that point, throwing something away takes extra movement every time. **Changing the room can make the action easier.** A small bag may be enough to test the idea. If it gets in the way, move it and try another location.',
  'focus.timer': 'A task without an end can feel as if it might take the whole evening. A timer offers a different agreement: you will work on one area for a chosen amount of time. **The time limit belongs to you.** When it ends, you can stop and count what changed, or choose another short round if you want to.',
  'focus.landing': 'Think about where you look for your keys, bag, or notebook. One clear patch of space can give that item a reliable home. **The spot has a specific job.** You are not trying to prove the room is tidy; you are making tomorrow’s first step easier by keeping one useful place ready.',
  'focus.doorway': 'A reminder works better when it meets you at a moment that already happens. Coming through the door is one such moment. **Pair arrival with one small action**, such as returning your keys to a bowl. If you often arrive carrying too much, choose a later moment, like when you put down your bag.',
  'focus.edge': 'Before touching the kitchen, decide whether today’s goal is a usable table, three returned items, or a clear path to the sink. **That answer defines the job.** Without it, each finished part can point to another task. You can still do more later, but the extra work becomes a new choice rather than a hidden requirement.',
  'focus.livedin': 'The same three plates can lead to two very different sentences: “These plates need washing” and “I never keep up.” The first describes objects and a possible job. The second makes a claim about your whole life. **Stay with what you can see.** A clear description helps you decide whether to act now or return later.',
  'focus.ending': 'For example, you might open an app to read one message from a friend. The next post appears as soon as you finish, so the app gives you no clear end. **Choose the end yourself** before opening it: read the message, reply if needed, then close the app. You can decide separately whether you want more browsing time.',
  'focus.unlock': 'Picking up the phone and opening an app can happen so quickly that you forget the original job. Saying “weather, then close” before unlocking gives you a short reminder. **The words make the purpose visible.** If you notice yourself in another app, you have not failed; you can ask whether that new task matters now and decide what to do.',
  'focus.default': 'An app on the first screen is easy to tap without much thought. Moving its icon or silencing one alert adds a small moment before the tap. **The extra moment is the useful part.** You still have access when you want it, but the phone asks less often whether you want to check right now.',
  'focus.hands': 'When a phone leaves your hands, the next few seconds may feel strangely empty. That feeling does not mean you need to pick it up again. **Give the pause a simple activity** such as looking outside or stretching your fingers. Afterward, you can still choose your phone if it is what you want.',
  'focus.charger': 'If your phone charges beside the bed, checking it during a wakeful moment takes almost no effort. Charging it farther away creates a decision before you reach. **Distance can support the choice you want.** Keep practical needs in mind: if it is your alarm or a way to receive urgent calls, test a location that still works for those jobs.',
  'focus.save': 'You may open an app because a friend wrote to you, then stay for posts that have nothing to do with your friend. **Keep the original purpose separate** from the feed around it. Reply to the person, then decide whether you also want to browse. Both choices are allowed; the aim is to notice which one you are making.',
  'focus.wait': 'A notification can feel urgent because it arrived now, even when nobody needs an immediate answer. **Arrival time and urgency are different.** Pause long enough to ask what the message is likely to need. If it concerns safety or a real deadline, respond. If it can wait, you can return to what you were doing.',
  'focus.company': 'A video and a feed both offer new things to watch. Following them together may be enjoyable, or it may leave you more scattered. **Try changing one part of the break**, such as keeping the video and closing the feed. After a few minutes, notice how you feel. Your answer matters more than a rule about screens.',
  'focus.capture': 'You might keep scrolling because you saw a recipe you want to remember. In that case, the useful job is saving the recipe, not staying inside the feed. **Give the idea another place to live:** bookmark it or write down its name. Then you can close the app and decide later whether you still need it.',
  'body.corner': 'A hard morning can make the rest of the day feel decided. Yet lunch, a drink, a short rest, or a shower is still a separate event you can choose. **Care can stay small and local.** One helpful moment does not have to turn the whole day around; it can simply make the next hour a little easier to meet.',
  'body.signal': 'When you feel stuck, a big question like “What is wrong with me?” may not lead anywhere useful. A smaller question can: “Am I hungry, thirsty, tense, or uncomfortable?” **Check one ordinary need first.** Meeting it may help, or it may show that something else needs attention. Either result gives you clearer information.',
  'body.comfort': 'Imagine two breaks: scrolling for ten minutes and sitting with a drink for ten minutes. Either could be enjoyable. What matters is how each leaves you afterward. **Compare the effect, not the appearance.** You may feel more rested, equally tired, or ready to continue. That observation helps you choose a break the next time you need one.',
  'body.floor': 'A smaller action can keep you connected to a plan without pretending the whole plan is complete. For example, opening today’s page or doing one assigned reset is a real action. **The remaining items stay open.** You can return when you have more time or energy. The useful question is what first step is possible now.',
  'body.sight': 'A water bottle in another room depends on you remembering it later. A bottle beside your usual chair gives you a visible reminder at the moment you might use it. **The setup does some remembering for you.** If the bottle stops catching your eye, move it. The goal is a useful place, not a perfect arrangement.',
  'body.decision': 'Suppose a non-urgent decision feels unusually irritating in the afternoon. You may be hungry, thirsty, tired, or pressed for time. **Check those ordinary conditions** before deciding what the feeling means. A meal or short break will not answer every question, but it can remove one avoidable source of strain while you think. After meeting that need, return to the decision and notice whether it still feels as urgent or difficult.',
  'body.hour': 'A difficult morning is a fact about the morning, not a prediction about the afternoon. You may still need rest, help, or a smaller plan. **Ask about the next hour specifically.** Could you eat, open a window, or complete one assigned item? Naming that step gives you something real to choose without claiming the earlier hours were easy.',
  'body.finish': 'If you complete one helpful thing and immediately add three more, the work never feels finished. **Decide on a finish before starting.** It might be one reset followed by rest, or making lunch without planning dinner too. When you reach that point, pause. You can still make a new choice if an important need remains.',
  'body.returnpath': 'Rest can feel hard to allow when you worry that starting again will take another big decision. Leave yourself one simple reminder before the break, such as a note saying “call Sam” or a glass beside the sink. **Make the return easy to see.** It is a reminder, not a deadline, and you can change your mind after resting.',
  'quiet.when': 'A plan that says “sometime today” leaves the starting moment undecided. When the day becomes busy, you have to make that decision again. **Attach the action to something familiar**, such as lunch or sitting down after work. Then the reminder is already part of the day, and you can change it if that moment stops fitting.',
  'quiet.cue': 'Imagine wanting a quiet pause before bed while your reminder is hidden in an app you only open in the morning. **The reminder is in the wrong place.** A note by the lamp or a book on the pillow is more likely to be seen when the action can happen. Move it again if it stops helping.',
  'quiet.no': 'If your full evening plan no longer fits, you still have more than two choices. You can complete one assigned item, leave the others open, or rest and return. **A smaller plan is honest when it names what remains.** You do not need to pretend the full set is done, and you do not need to give up on it altogether.',
  'quiet.yes': 'A promise needs a place in your real schedule. If the evening is already full, saying yes to another task does not create more time. **Look for room before committing.** You might move one optional task, choose a shorter version, or plan for a different day. A later honest time is more useful than a time that cannot work.',
  'quiet.story': 'After one missed reset, your mind may say “I never follow through.” The word “never” turns one event into a claim about every attempt you have made. **Use the smaller, accurate sentence:** “I missed this reset.” Then ask what got in the way. That answer can help you choose a better time, reminder, or first step.',
  'quiet.yesterday': 'You do not need to invent a new routine whenever you want to try again. If yesterday’s reset fit after lunch, that is useful evidence about your day. **Borrow one detail that worked**, such as the time, place, or preparation. Repeat it once and notice whether it still fits. If today is different, adjust that detail.',
  'quiet.plain': 'A promise can quietly grow after you make it. “I will do one reset” may become “I must also feel calm and finish everything else.” Those extra demands were never in the original plan. **Keep the agreement about an action you can see.** You can complete the action even if your feelings do not change afterward.',
  'quiet.boundary': 'A boundary is a simple limit that leaves room for something you chose. For example, you might silence a non-urgent alert for ten minutes while you finish a reset. **The limit protects the time**, not your status as a good or bad person. It should fit your relationships and responsibilities, and you can respond to urgent needs.',
  'quiet.receipt': 'A missed step can be easier to remember than three quiet returns. If you only count the miss, your picture of the week is incomplete. **Name one action you did complete**, including when it happened. This is not a score of your worth; it is a fact that belongs beside the misses when you decide what to do next.',
} as const satisfies Record<keyof typeof LIFE_RESET_PRACTICE, string>;

const LIFE_RESET_TODAY = {
  'focus.category': 'Choose one unfinished job and **name its first physical move**. Stop after that move if you want to.',
  'focus.eyes': 'Look around and **move one item you can see** to a place you already know.',
  'focus.sort': 'Find one item with a known home and **put it there**. Leave the sorting for another time.',
  'focus.bin': 'If rubbish gathers in one spot, **try placing a bag or bin nearby** for a day.',
  'focus.timer': 'Choose one area and **set a short stopping point** before you begin.',
  'focus.landing': 'Pick one small surface and **make room for something you use** tomorrow.',
  'focus.doorway': 'When you come home next, **put one item away** after setting down your keys.',
  'focus.edge': 'Before you start a task, **say what will count as done** for now.',
  'focus.livedin': 'Look at one messy spot and **describe only what you see**, without a label about yourself.',
  'focus.ending': 'Before opening a feed, **say what you came to see** and when you will close it.',
  'focus.unlock': 'Before your next phone unlock, **say the job in a few words**.',
  'focus.default': 'Move one app or turn off one alert, then **notice whether checking changes**.',
  'focus.hands': 'After putting your phone down, **choose one quiet minute** before deciding what comes next.',
  'focus.charger': 'Look at where your phone charges and **try a place that fits your rest** and responsibilities.',
  'focus.save': 'When you open an app for a person or idea, **finish that purpose first** before browsing.',
  'focus.wait': 'When a non-urgent alert arrives, **pause for a few breaths** before choosing whether to look.',
  'focus.company': 'During one break, **use just one screen** and notice how you feel afterward.',
  'focus.capture': 'Save one useful item outside the feed, then **close the app and check later** if you need it.',
  'body.corner': 'Choose **one small part of today to care for**, such as lunch or a short rest.',
  'body.signal': 'Check for one basic need and **try one small response**, such as water or a change of position.',
  'body.comfort': 'After your next break, **notice what changed** in your energy or tension.',
  'body.floor': 'Choose **one first step that fits your energy**. The remaining plan items can stay open.',
  'body.sight': 'Move **one helpful thing into sight** where you are likely to need it.',
  'body.decision': 'Before a decision that can wait, **check one basic need** and return to the question.',
  'body.hour': 'For the next hour, **choose one small thing that could help**, such as a drink or rest.',
  'body.finish': 'Before beginning a task, **name where you will stop** and let that end count.',
  'body.returnpath': 'Before a rest, **leave one simple reminder** of what you may want to do afterward.',
  'quiet.when': 'Choose one action and **place it after a daily event**, such as breakfast.',
  'quiet.cue': 'Move one reminder so **you will see it when the action begins**.',
  'quiet.no': 'For a hard day, **choose one smaller plan item** or rest and return later.',
  'quiet.yes': 'Before making a promise, **look for a real place in your day** where it could fit.',
  'quiet.story': 'After a miss, **name what happened in one sentence**, then choose a next step.',
  'quiet.yesterday': 'Repeat **one detail that helped before**, such as the time or place.',
  'quiet.plain': 'Say your next promise as **one action you can see**, without adding a required feeling.',
  'quiet.boundary': 'Choose **one small limit** that protects a few minutes for something you value.',
  'quiet.receipt': 'Name **one action you completed and when**, even if you also missed something.',
} as const satisfies Record<keyof typeof LIFE_RESET_PRACTICE, string>;

const LIFE_RESET_STEP = {
  'focus.category': 'Name the first physical move on one unfinished job.',
  'focus.eyes': 'Move one item you can see back to its usual place.',
  'focus.sort': 'Put one item back in its known home and stop there.',
  'focus.bin': 'Put a bag or bin where rubbish tends to gather.',
  'focus.timer': 'Set a short stopping point before you start tidying one area.',
  'focus.landing': 'Clear one small surface for something you will use tomorrow.',
  'focus.doorway': 'When you get home, put one item away after your keys.',
  'focus.edge': 'Before you start a task, say what will count as done.',
  'focus.livedin': 'Describe one messy spot by what you see, not who you are.',
  'focus.ending': 'Before opening a feed, decide what you want and when to close.',
  'focus.unlock': 'Before unlocking your phone, say why in a few words.',
  'focus.default': 'Move one tempting app or turn off one alert.',
  'focus.hands': 'After putting your phone down, take one quiet minute first.',
  'focus.charger': 'Try charging your phone somewhere that supports your rest.',
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
  'body.hour': 'Pick one small thing that could help in the next hour.',
  'body.finish': 'Name a clear stopping point before you begin a task.',
  'body.returnpath': 'Before resting, leave one simple reminder of what comes next.',
  'quiet.when': 'Tie one small action to a daily event like breakfast.',
  'quiet.cue': 'Move one reminder to where the action actually begins.',
  'quiet.no': 'On a hard day, choose one smaller item or rest.',
  'quiet.yes': 'Find a real slot in your day before making a promise.',
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
  resetLesson('focus.category', 'Name one action, not the whole job', '“Laundry” names a whole job. “Put one shirt in the basket” names something you can do now.', 'A whole job contains many smaller decisions. Naming the first physical move removes one of those decisions.', 'You can leave the rest for later. **One clear move is enough to begin.**', 'What is the first thing my hands could do?', HOME_SOURCES),
  resetLesson('focus.eyes', 'Begin with one thing you can see', 'Look around and choose one item that is out of place, such as a cup on the table.', 'You do not need to find the most important job before moving one item. That search can make starting harder.', '**Choose one visible item** that is yours to move. You can decide what comes next after that.', 'Which item can I move in less than a minute?', HOME_SOURCES),
  resetLesson('focus.sort', 'Put away what already has a place', 'You can put one item away without sorting everything around it.', 'Sorting means deciding where many items belong. Putting away a familiar item needs only one decision.', '**Start with an item** whose place you already know. Leave the harder pile for another time.', 'Is there one thing here whose place I already know?', HOME_SOURCES),
  resetLesson('focus.bin', 'Keep a bin near the mess', 'If the bin is far away, a wrapper may stay on the table even when you mean to throw it out.', 'A nearby bin makes the next step easier at the moment you need it.', 'This is about where the bin is, not your character. **Move the bin if it helps.**', 'Would a bin or bag closer to this spot help?', HOME_SOURCES),
  resetLesson('focus.timer', 'Choose when to stop before you start', 'A short timer can tell you when a task will end, even if the room is not finished.', 'When you know the task has an end, starting may ask less of you. You can stop when the timer rings.', '**Try a few minutes** in one area. If a timer feels stressful, choose one item as your stopping point instead.', 'What short stopping point feels possible today?', HOME_SOURCES),
  resetLesson('focus.landing', 'Keep one small surface ready', 'A small clear spot can hold what you need next, like your keys or a notebook.', 'If that spot stays usable, you have one less thing to clear when you come back.', 'You do not need to clear the whole room. **Choose one useful spot** and give it a job.', 'Which small surface would help me tomorrow?', HOME_SOURCES),
  resetLesson('focus.doorway', 'Use arriving home as a reminder', 'Coming through your door can remind you to do one small thing, like putting your keys away.', 'Arriving home already happens. Linking one action to it means you do not need a new alarm.', '**After you enter, do one small action.** If that moment is too busy, choose another moment you already have.', 'What small action could follow coming home?', HOME_SOURCES),
  resetLesson('focus.edge', 'Decide what “done” means first', 'Before you begin, choose a clear end, such as clearing the table or returning three items.', 'A clear end keeps a small job from growing into a demand to fix the whole room.', '**Stop at the end you chose.** You can choose a new job later if you have time and want to.', 'What small result would be enough today?', HOME_SOURCES),
  resetLesson('focus.livedin', 'Mess does not describe who you are', 'Dishes after dinner mean the room was used. They do not tell you whether you are a good person.', 'When you describe what is there, you can see a possible task. When you judge yourself, the task can feel much bigger.', '**Name what you see:** “Three plates need washing.” Leave out a label about yourself.', 'What is here, and what story am I adding to it?', HOME_SOURCES),

  resetLesson('focus.ending', 'Choose when to close the feed', 'A social feed keeps showing new posts. It does not tell you when you have seen enough.', 'If you decide what you came to see before opening the app, you have a clear point when you can close it.', '**Choose an exit point** such as “after I read the message.” You can still choose to browse longer.', 'What am I opening the app to see?', PHONE_SOURCES),
  resetLesson('focus.unlock', 'Name why you opened your phone', 'Before you unlock, say the job: “check the weather” or “reply to Sam.”', 'A named job is easier to remember than a vague wish to use the phone less.', '**Say the job before the first tap.** If you open something else, you can pause and choose again.', 'What am I picking up my phone to do?', PHONE_SOURCES),
  resetLesson('focus.default', 'Move one app that pulls you in', 'A bright icon on your home screen can invite a tap every time you see it.', 'Moving that icon or turning off one alert creates a small pause before you open the app.', '**Change one prompt** on your phone, then notice whether you check it less often.', 'Which icon or alert pulls me in most often?', PHONE_SOURCES),
  resetLesson('focus.hands', 'Plan the minute after putting your phone down', 'The first quiet minute after you stop scrolling can feel empty or restless.', 'If you have a simple next move, the empty minute is easier to stay with.', '**Choose one small move:** look outside, stretch your hands, or take a drink. Then decide what you want next.', 'What could I do for one quiet minute?', PHONE_SOURCES),
  resetLesson('focus.charger', 'Charge your phone where it helps you rest', 'A phone beside the bed is easy to reach during a wakeful moment.', 'A different charging place can make checking a deliberate choice instead of an easy reflex.', '**Try a spot** that still works for your alarm and responsibilities. The best place depends on your home.', 'Would moving my charger make bedtime easier?', PHONE_SOURCES),
  resetLesson('focus.save', 'Keep the message, leave the feed', 'You can open your phone to connect with a person and end up reading unrelated posts.', 'Replying to the person first keeps the useful part of the visit clear.', '**Reply or save** what you came for. Then choose whether you want to keep browsing.', 'What did I actually open the app for?', PHONE_SOURCES),
  resetLesson('focus.wait', 'Pause before checking a new alert', 'A new alert can make you want to look right away, even when it is not urgent.', 'A few breaths give you time to ask whether you need to look now. The feeling may change or it may not.', '**Pause, ask, then choose.** If the message is urgent, respond. Waiting is a tool, not a test.', 'Does this alert need my attention right now?', PHONE_SOURCES),
  resetLesson('focus.company', 'Try using one screen at a time', 'Watching a video while scrolling another app gives your attention two things to follow.', 'Turning off one source for a few minutes can help you notice which amount of input feels better.', '**Choose one screen** for a short break. Notice how you feel afterward; silence is not required.', 'How do I feel after using one screen versus two?', PHONE_SOURCES),
  resetLesson('focus.capture', 'Save what matters and close the app', 'One useful idea in a feed can keep you scrolling because you do not want to lose it.', 'Saving that idea somewhere else lets you leave the app without losing the useful part.', '**Save the item** or write its name down, then close the app. You can decide later if you still want it.', 'What do I want to keep from this visit?', PHONE_SOURCES),

  resetLesson('body.corner', 'Care for one part of a hard day', 'If the morning was hard, you can still care for one small part of the afternoon.', 'A single meal, drink, or planned pause is one manageable decision. It does not have to fix the whole day.', '**Pick one part** of the day you can still care for. Let that be useful on its own.', 'What is one small thing I need this afternoon?', RECOVERY_SOURCES),
  resetLesson('body.signal', 'Check what your body needs first', 'When you feel stuck, check simple needs: food, water, fresh air, or a more comfortable position.', 'A basic need can be easier to answer than “Why do I feel like this?” It may be one part of what is going on.', '**Notice one need** and try a small response. Then check how you feel; the answer may point to something else too.', 'Am I hungry, thirsty, tense, or uncomfortable?', RECOVERY_SOURCES),
  resetLesson('body.comfort', 'Notice how a break leaves you feeling', 'Two breaks can look the same but feel different afterward.', 'Checking how you feel after a break helps you choose what might help next time.', '**Ask what changed:** your energy, tension, or ability to return. You do not need to score the break.', 'Which break has helped me feel a little better able to continue?', RECOVERY_SOURCES),
  resetLesson('body.floor', 'Make the first step small enough', 'On a low-energy day, the usual plan may feel too big to start.', 'A smaller first step, such as opening the plan or doing one assigned item, can keep you connected to it.', '**Choose a step you can do now.** The program day stays open until every assigned item is complete.', 'What first step could I do with the energy I have?', RECOVERY_SOURCES),
  resetLesson('body.sight', 'Put helpful things where you see them', 'It is easier to remember water when the bottle is on the table than when it is in another room.', 'Seeing a helpful object can remind you at the time you need it.', '**Move one useful thing** closer to the moment you want it. Change the setup if it stops helping.', 'What could I put where I will see it?', RECOVERY_SOURCES),
  resetLesson('body.decision', 'Check basic needs before a hard decision', 'Hunger or tiredness can make an ordinary decision feel harder.', 'Eating, drinking, or resting may remove one source of strain. It will not solve every problem.', '**Check one basic need** before a decision that can wait. Then come back to the decision.', 'Have I eaten, had water, or rested recently?', RECOVERY_SOURCES),
  resetLesson('body.hour', 'A hard morning does not decide the afternoon', 'A difficult morning has happened. The next hour has not happened yet.', 'Calling the whole day ruined can stop you from seeing what is still possible.', '**Name one thing** that would make the next hour easier, such as a drink, open window, or short rest.', 'What could help me in the next hour?', RECOVERY_SOURCES),
  resetLesson('body.finish', 'Choose a clear place to stop', 'Before you start, decide what “enough for now” will mean.', 'A clear end stops one useful task from growing into many more tasks you did not agree to.', '**Name the finish:** one reset, one meal, or one cleared chair. Stop there unless you decide to start a new task.', 'What would be enough for now?', RECOVERY_SOURCES),
  resetLesson('body.returnpath', 'Leave yourself an easy way back', 'Before you rest, choose one simple thing that could help you return later.', 'A note or object left in sight can remind you what comes next without making a new plan.', '**Leave one reminder,** such as your water bottle or a note. Rest first; change the plan later if you need to.', 'What small reminder would help me after I rest?', RECOVERY_SOURCES),

  resetLesson('quiet.when', 'Say when you will do the small step', '“I will do it sometime” gives you no clear moment to start.', 'Linking the action to something that already happens, like lunch, gives you a reminder.', '**Name the moment and action:** “After lunch, I will open the plan.” If that moment does not happen, choose another.', 'What daily moment could remind me to start?', SELF_TRUST_SOURCES),
  resetLesson('quiet.cue', 'Put the reminder where you need it', 'A note beside your bed may work better than an alert hidden inside an app you rarely open.', 'A reminder is most useful at the place where you want to take action.', '**Move one reminder** closer to the action. If you stop noticing it, try a different place.', 'Where would I see a helpful reminder?', SELF_TRUST_SOURCES),
  resetLesson('quiet.no', 'Have a smaller plan for hard days', 'A hard day may leave less time or energy than you expected.', 'If you decide on a smaller option ahead of time, “I cannot do it all” does not have to become “I can do nothing.”', '**Choose one smaller step** or rest. Unfinished plan items remain open for later.', 'What smaller step could still fit a hard day?', SELF_TRUST_SOURCES),
  resetLesson('quiet.yes', 'Make room for a promise you want to keep', 'A promise needs time in the day, even when it is small.', 'If the evening is already full, adding another task may make the promise impossible to keep.', '**Look at your schedule** before saying yes. Move or drop an optional task if you can; otherwise choose a better time.', 'Where would this promise fit in my real day?', SELF_TRUST_SOURCES),
  resetLesson('quiet.story', 'One missed step is one event', 'Missing a reset means you missed that reset. It does not prove you always fail.', 'A statement about one event lets you look for a reason and a useful next step.', '**Say what happened** without a label: “I missed yesterday’s reset.” Then ask what got in the way.', 'What happened, and what could help next time?', SELF_TRUST_SOURCES),
  resetLesson('quiet.yesterday', 'Use what worked before', 'If a reset was easier after lunch yesterday, try that time again.', 'You do not need a new plan every day. A time or place that helped once gives you a place to start.', '**Repeat one helpful detail** from an earlier day. Keep it if it still fits; change it if today is different.', 'What made a past reset easier to start?', SELF_TRUST_SOURCES),
  resetLesson('quiet.plain', 'Keep a promise specific and small', '“I will do one reset” is a clear promise. “I must also feel calm” adds something you cannot control.', 'A promise about an action is easier to check than a promise about a feeling.', '**Name only the action** you intend to take. Notice if extra rules start to appear later.', 'What exactly did I agree to do?', SELF_TRUST_SOURCES),
  resetLesson('quiet.boundary', 'Protect a little time for what matters', 'A boundary is a simple limit, such as silencing a non-urgent alert for ten minutes.', 'That limit can protect time for something you chose to do.', '**Choose one small limit** that fits your responsibilities. You can respond to urgent needs when they arise.', 'What could I pause for a few minutes?', SELF_TRUST_SOURCES),
  resetLesson('quiet.receipt', 'Remember what you did, not only what you missed', 'If you missed one reset but completed three others, both facts belong in the story.', 'Remembering completed actions gives you a fairer picture of what you have done.', '**Name one real action** and when you did it. It is evidence, not a score or a promise about tomorrow.', 'What is one thing I actually followed through on?', SELF_TRUST_SOURCES),
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
