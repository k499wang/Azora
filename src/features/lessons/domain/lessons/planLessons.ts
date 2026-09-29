import type { LessonDefinition } from '../lessonBlock';

/**
 * The plan talking about itself.
 *
 * Every plan draws on all of these, because none of them is about sleep or
 * temper or attention — they are about the thing the user is doing, and that is
 * the same thing whichever outcome they came for.
 */
export const PLAN_LESSONS = [
  {
    id: 'plan.grows',
    title: 'Your plan grows one reset at a time',
    blocks: [
      {
        kind: 'text',
        text: "A reset is a short guided breathing session in this app. **Your plan starts with one reset a day**, then may add more. Each day also has a lesson and a check-in, which is a short moment to record how you are doing.",
      },
      { kind: 'fact', value: '3', caption: 'the most resets it ever asks of a day' },
      {
        kind: 'text',
        text: 'The plan adds sessions gradually so you can learn the routine one step at a time. **You practise more often as it grows.** You do not need to master a difficult session on day one.',
      },
      {
        kind: 'text',
        text: 'Each reset happens at a separate time. A morning session lets you notice how you feel at the start of the day. **A later session gives you another chance to practise.** They may feel different, and that is fine.',
      },
      { kind: 'choice', prompt: 'You finish one reset, then the day gets busy. What happens to your place in the plan?', options: [
        { label: 'Today stays open', feedback: 'The next program day waits for today’s full set of resets, lesson, and check-in. There is no backlog to catch up on.' },
        { label: 'Tomorrow adds missed resets', feedback: 'The plan stays on this program day until its set is complete. It does not stack missed resets onto another day.' },
      ] },
      {
        kind: 'do',
        text: 'Look at **today’s resets, lesson, and check-in**. Start with whichever fits now; the next program day waits until today’s set is complete.',
      },
    ],
    source: 'Current product rules: programCatalogue.ts defines the daily reset count and duration; advance_program_day_if_ready requires the prescribed resets, lesson, and check-in.',
  },
  {
    id: 'plan.hour',
    title: 'A fixed time of day does more than willpower',
    blocks: [
      {
        kind: 'text',
        text: "A cue is a reminder to start an action. **A regular time can become a cue for your reset.** For example, opening the reset after brushing your teeth gives it a place in your day.",
      },
      {
        kind: 'text',
        text: 'Choose an hour that fits an ordinary day. **The time can change** when your life changes.',
      },
      {
        kind: 'text',
        text: 'If you have missed twice in a row at the same time, that is the time telling you it is wrong, not you. **Move it somewhere it fits** and carry on.',
      },
      {
        kind: 'text',
        text: 'A useful plan names a real moment: “After lunch, I will open today’s reset.” That tells you **when to begin** instead of leaving the decision for later.',
      },
      {
        kind: 'text',
        text: 'After a few days, ask whether the new time worked on busy days too. If it only worked on easy days, **choose a more reliable reminder**, such as getting home or having a meal.',
      },
      {
        kind: 'choice',
        prompt: 'Your planned reset time keeps getting crowded out. What is worth testing?',
        options: [
          { label: 'Try a time beside an existing routine', feedback: 'A familiar event can act as a cue. Try the new time for a few days and see whether it fits.' },
          { label: 'Keep the time and try harder', feedback: 'Effort may help once, but repeated misses are useful information. A different cue may ask less remembering.' },
        ],
      },
      {
        kind: 'do',
        text: 'Ask whether your planned time fits the day you actually have. **You can move it** if another time would make showing up easier.',
      },
    ],
    source: 'Habit formation: context stability, especially time of day, predicts automaticity more than motivation does.',
  },
  {
    id: 'plan.stacking',
    title: 'Attach it to something you already do',
    blocks: [
      {
        kind: 'text',
        text: "An existing habit can remind you to do a new one. **Put your reset right after something you already do.** For example, after brushing your teeth, open today’s reset before moving to another task.",
      },
      {
        kind: 'text',
        text: 'The hard part is often remembering to start. **The old habit becomes a reminder** for the new action. When you finish brushing your teeth, that is your signal to open the reset.',
      },
      {
        kind: 'text',
        text: 'A cue is the event that reminds you to start. **Choose something that happens most days**, such as breakfast or getting into bed. If it stops happening, pick a new cue.',
      },
      {
        kind: 'text',
        text: 'Start soon after the cue. **“After dinner, before I leave the table” is clear.** “Sometime tonight” leaves you to choose a time later, when you may be busy or forget.',
      },
      { kind: 'choice', prompt: 'You want a cue for your reset that works on weekends too. Which is likelier to help?', options: [
        { label: 'After brushing my teeth', feedback: 'An everyday routine gives the reset a familiar place. Test whether you can begin soon after the cue.' },
        { label: 'After a weekday meeting', feedback: 'A meeting can be useful on workdays, but it disappears on weekends. Choose a cue that happens on the days you need it.' },
      ] },
      {
        kind: 'do',
        text: 'Notice what usually happens before your reset. Could **one familiar moment** help you remember it without another thing to track?',
      },
    ],
    source: 'Implementation intentions and habit stacking: an existing routine is a more reliable cue than an intention.',
  },
  {
    id: 'plan.low',
    title: 'This is meant to feel too easy',
    blocks: [
      {
        kind: 'text',
        text: "A reset is a short guided breathing session. It may feel too small to matter, but **a small action is easier to repeat** on an ordinary busy day. The aim is to give yourself a practice moment you can return to.",
      },
      { kind: 'fact', value: '1–3', caption: 'short resets as the plan grows' },
      {
        kind: 'text',
        text: 'Ambition is not always what is missing. A short session can be **easier to repeat** than a long one, especially on a crowded day. Repetition gives you chances to learn what fits.',
      },
      {
        kind: 'text',
        text: 'A reset can feel underwhelming when you expect a dramatic change. Its job today is narrower: give you a **repeatable moment of practice**. You can notice your breathing or attention without making the session prove anything.',
      },
      { kind: 'choice', prompt: 'A short reset feels too small to count. Which response supports tomorrow’s practice?', options: [
        { label: 'Complete the prescribed set', feedback: 'A repeatable set is enough for this program day. You can notice what happened without requiring a dramatic result.' },
        { label: 'Make every reset much longer', feedback: 'More time is optional, and making the task bigger may make tomorrow harder to start. The prescribed set already counts.' },
      ] },
      {
        kind: 'do',
        text: 'If your mind says a short reset cannot count, ask: **what would make it enough today?** You do not have to earn a longer version.',
      },
    ],
    source: 'Behaviour change: starting below capacity protects adherence; difficulty is the most common cause of early dropout.',
  },
  {
    id: 'plan.expect',
    title: 'Week one is for noticing what fits',
    blocks: [
      {
        kind: 'text',
        text: "The first week gives you time to learn how this plan fits your day. **Notice when a reset is easy or hard to start.** You can also notice how you feel before and after it, without expecting one session to change everything.",
      },
      { kind: 'fact', value: '7 days', caption: 'to learn which moments fit' },
      {
        kind: 'text',
        text: 'A small shift might be **noticing tension sooner**, returning to the breath, or choosing a better time tomorrow. None is a promise of a particular symptom change.',
      },
      {
        kind: 'text',
        text: 'A useful observation has a before and an after: “I was rushing when I opened the reset; afterward I noticed I had been holding my shoulders high.” **That is information**, even if the rest of the day stays difficult.',
      },
      { kind: 'choice', prompt: 'After a reset, you still feel tense. What would be useful to notice this week?', options: [
        { label: 'What changed, even slightly', feedback: 'You might notice when tension appeared, where you felt it, or which time fit. An observation is useful without a promised outcome.' },
        { label: 'Whether one session fixed it', feedback: 'One session cannot fairly settle that question. Sleep and daily demands also affect how you feel; look across several days.' },
      ] },
      {
        kind: 'do',
        text: 'When you catch yourself asking whether it is working yet, try **“What have I noticed?”** A small observation is enough for today.',
      },
    ],
    source: 'NHS CBT guidance describes noticing thoughts, feelings, and actions and practising between sessions; the seven-day window is the first week of this authored plan.',
  },
  {
    id: 'plan.two',
    title: 'Two resets give you two practice moments',
    blocks: [
      {
        kind: 'text',
        text: "Today your plan has two separate resets, or guided breathing sessions. **Each one is a chance to practise at a different moment.** You can do them at times that fit your day; the lesson and check-in are also part of today’s set.",
      },
      { kind: 'fact', value: '2', caption: 'separate chances to pause' },
      {
        kind: 'text',
        text: 'Completing one is still a real action. **The program day advances** when all of its prescribed resets, the lesson, and the check-in are complete. Nothing needs to be doubled tomorrow.',
      },
      {
        kind: 'text',
        text: 'The two resets can happen at different times. One may fit before a demanding task and one after it. **Try both times and notice which feels easier to use** on an ordinary day.',
      },
      { kind: 'choice', prompt: 'Your two planned reset times both collide with work. What can you change?', options: [
        { label: 'Move one to a reliable opening', feedback: 'The times can flex around your day. Today still asks for both prescribed resets, the lesson, and the check-in.' },
        { label: 'Count one reset as both', feedback: 'One reset is a real action, but each prescribed reset is a separate practice moment in the daily set.' },
      ] },
      {
        kind: 'do',
        text: 'If your plan has two resets today, notice where each one **could fit naturally**. They do not need perfect timing to be useful.',
      },
    ],
    source: 'Current product rules: programCatalogue.ts prescribes distinct daily activities; advance_program_day_if_ready requires all prescribed activities, the lesson, and a check-in.',
  },
  {
    id: 'plan.consistency',
    title: 'Repetition helps a reset become familiar',
    blocks: [
      {
        kind: 'text',
        text: "Repeating a reset at a familiar time can make it easier to remember. **Consistency means coming back when you can**, even if today feels harder than yesterday. Notice what helped you begin and use it again.",
      },
      { kind: 'fact', value: '1 day', caption: 'the only set in front of you now' },
      {
        kind: 'text',
        text: 'The plan adds resets over time. If the full day stops fitting, **notice which part is hard**: the hour, the technique, or simply finding a pause. That is useful information for tomorrow.',
      },
      {
        kind: 'text',
        text: '“I did it yesterday, so today should be easy” is an understandable thought, but every day has different demands. **Consistency means returning**, not feeling the same level of ease each time.',
      },
      { kind: 'choice', prompt: 'Yesterday’s reset was easy; today’s feels hard. What could help you return?', options: [
        { label: 'Reuse yesterday’s helpful setup', feedback: 'A reminder, quiet corner, or earlier start may still help. Difficulty can change from day to day without erasing progress.' },
        { label: 'Wait to feel exactly like yesterday', feedback: 'Today may have different demands. You can adjust the setup and begin without needing the same feeling.' },
      ] },
      {
        kind: 'do',
        text: 'If today feels full, ask what **a doable version** would look like. A smaller return still tells you something useful about what fits.',
      },
    ],
    source: 'Habit formation — repetition in a stable context drives automaticity more than session length.',
  },
  {
    id: 'plan.bad',
    title: 'A difficult day does not erase the plan',
    blocks: [
      {
        kind: 'text',
        text: "Some days leave little time or energy. **Doing one part of the plan is still a real action.** The next program day opens after you finish today’s resets, lesson, and check-in; you can return to unfinished parts later.",
      },
      { kind: 'fact', value: '1 day', caption: 'waits here until its set is complete' },
      {
        kind: 'text',
        text: 'The thought “If I cannot finish, why begin?” is **all-or-nothing thinking**. You can choose the next available part, or rest and return. Neither choice puts missed days in a backlog.',
      },
      {
        kind: 'text',
        text: 'A fairer version might be: “I may not finish the full set right now, but I can see whether one part fits.” That sentence **leaves room for choice** without pretending the day is complete.',
      },
      {
        kind: 'choice',
        prompt: 'You have time for one reset, but today asks for two. Which statement matches the plan?',
        options: [
          { label: 'One reset helps; the day stays open', feedback: 'Yes. The action counts as done, while the next program day waits for the remaining items.' },
          { label: 'One reset means the whole day is done', feedback: 'One reset is worth doing, but the program day advances only after every prescribed reset, the lesson, and the check-in.' },
        ],
      },
      {
        kind: 'do',
        text: 'Ask what fits right now: **one prescribed reset, the lesson, the check-in, or rest**. You can return to the unfinished set later.',
      },
    ],
    source: 'Current product rules: advance_program_day_if_ready advances only after the full daily set; NHS CBT thought-record guidance describes identifying all-or-nothing interpretations.',
  },
  {
    id: 'plan.missed',
    title: 'A missed day leaves your place in the plan',
    blocks: [
      {
        kind: 'text',
        text: "If you miss a calendar day, **your plan stays on the same program day**. You do not need to make up extra resets. When you return, look at what got in the way and choose a time that may work better.",
      },
      {
        kind: 'list',
        items: [
          { term: 'The time was wrong', text: 'Move it to a time that would have worked and try again.' },
          { term: 'The day was full', text: 'A crowded day may leave little room for a reset.' },
          { term: 'You forgot', text: 'That is a reminder to set, not a willpower problem.' },
        ],
      },
      {
        kind: 'text',
        text: 'A missed day can bring the thought “I always quit.” **One day is not a pattern**, and a thought is not a verdict.',
      },
      {
        kind: 'text',
        text: 'Use the miss as a small investigation. What was happening when the planned time arrived? Was the phone elsewhere, were you travelling, or did a task run late? **A specific obstacle** is easier to respond to than a judgment about yourself.',
      },
      {
        kind: 'choice',
        prompt: 'You missed yesterday and think, “I always stop.” Which reply uses the evidence you have?',
        options: [
          { label: 'Yesterday was missed; I can return today', feedback: 'That keeps the event specific and leaves room to choose a better cue for this program day.' },
          { label: 'My earlier completed days no longer count', feedback: 'The earlier days remain part of your plan. A missed calendar day does not erase them or move your place backward.' },
        ],
      },
      {
        kind: 'do',
        text: 'If you missed a day, ask **what got in the way** without blaming yourself. You can adjust the plan when you know more.',
      },
    ],
    source: 'Current product rules: programEnrollment.ts keeps programDay in place after a missed date; NHS CBT guidance supports examining a setback without treating one event as a global verdict.',
  },
  {
    id: 'plan.streak',
    title: 'The streak exists to make tomorrow easier',
    blocks: [
      {
        kind: 'text',
        text: "A streak is the number of calendar days you completed in a row. **It is only a count.** If it ends, the resets and lessons you already finished remain part of your progress.",
      },
      {
        kind: 'text',
        text: 'When a streak starts making you feel worse every time it breaks, it has stopped doing that job. **The day after the break** is what matters, not the number.',
      },
      { kind: 'fact', value: '1', caption: 'next day is a new chance to return' },
      {
        kind: 'text',
        text: 'A streak measures a run of dates, while your plan records the program days you completed. The two numbers can move differently. **Losing a streak does not erase** the lessons or resets already behind you.',
      },
      { kind: 'choice', prompt: 'Your streak ended yesterday. Which thought helps you take the next step?', options: [
        { label: 'My practice remains; I can return', feedback: 'A streak counts consecutive dates. Completed program days and what you learned remain yours after a break.' },
        { label: 'I lost all my progress', feedback: 'A broken streak changes the count, but it does not erase completed resets, lessons, or the next available action.' },
      ] },
      {
        kind: 'do',
        text: 'When the number resets, remember that **your practice did not disappear**. The next day is a fresh choice, not a debt.',
      },
    ],
    source: 'Streak mechanics cut both ways: loss framing raises adherence and raises dropout after a break.',
  },
  {
    id: 'plan.week',
    title: 'Judge it by the week, not the day',
    blocks: [
      {
        kind: 'text',
        text: "One difficult day does not tell you much about your routine. **Look across several days for a pattern.** For example, if evening resets keep getting missed, an earlier time may fit better.",
      },
      { kind: 'fact', value: '7 days', caption: 'to notice what made returning easier' },
      {
        kind: 'text',
        text: 'Across several days, you may see **a practical pattern**: which hours held, which were crowded, and whether another cue helped. There is no score you need to reach for that observation to matter.',
      },
      {
        kind: 'text',
        text: 'Separate two questions when you look back: “Did the time fit?” and “How did I feel?” One is about your **routine’s design**; the other can vary for many reasons. Keeping them apart makes your next adjustment clearer.',
      },
      { kind: 'choice', prompt: 'Your evening reset was missed on several busy days. What does that pattern suggest testing?', options: [
        { label: 'An earlier opening', feedback: 'The pattern may point to a crowded time slot. Moving the cue tests your routine without judging the whole practice.' },
        { label: 'Whether one day was a failure', feedback: 'Several days give more useful information than a verdict about one. Look at the time and demands around each miss.' },
      ] },
      {
        kind: 'do',
        text: 'When you look back on the week, notice **what helped you return**. That tells you more than judging one difficult day.',
      },
    ],
    source: 'Self-monitoring is a common CBT method for identifying patterns across situations; no completion threshold is required by the plan to reflect on a week.',
  },
  {
    id: 'plan.after',
    title: 'What to keep when this ends',
    blocks: [
      {
        kind: 'text',
        text: "When this plan ends, you can keep practising without keeping every part of it. **Choose one reset you can use on an ordinary day.** Think about when it was easiest to start and what reminded you.",
      },
      {
        kind: 'text',
        text: 'The rest were how you found it, and a practice that lasts years is usually **one thing at one time of day** rather than a whole programme.',
      },
      {
        kind: 'text',
        text: 'It does not have to be the longest one, or the one you think you should have picked. It only has to be **the one you actually do**.',
      },
      {
        kind: 'text',
        text: 'Think about an ordinary week. Which reset was easiest to begin, and what happened just before it? **Keep using that reminder** after the plan ends.',
      },
      { kind: 'choice', prompt: 'The plan is ending. Which practice is most worth carrying into an ordinary week?', options: [
        { label: 'One I actually return to', feedback: 'A familiar reset or lesson skill with a reliable cue is a practical way to continue after the plan ends.' },
        { label: 'The longest one on the best day', feedback: 'A demanding session may suit some days. For a lasting routine, consider what you can return to on an ordinary day.' },
      ] },
      {
        kind: 'do',
        text: 'Which part of the plan felt **most useful to return to**? You can keep that part and let the rest stay optional.',
      },
    ],
    source: 'Maintenance phase — narrowing to a single cue-bound behaviour is what survives the end of a structured programme.',
  },
] as const satisfies readonly LessonDefinition[];
