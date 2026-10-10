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
    title: 'Your plan grows one Reset at a time',
    step: 'Start with whichever of today’s steps fits right now.',
    blocks: [
      {
        kind: 'text',
        text: 'The plan in this app gives you **a few small steps each day**. Most days include a Reset, which is **a short session with instructions on the screen**, usually lasting a minute or two. Every day you also read a lesson like this one, tap how you feel in a quick check-in, and tick off one to-do.',
      },
      { kind: 'fact', value: '3', caption: 'the most Resets your plan will ever ask for in one day' },
      {
        kind: 'text',
        text: 'The different Resets give you something specific to focus on during that pause. Some guide your breathing, while **5-4-3-2-1** asks you to notice your surroundings through your senses. Another is **Muscle Release**, which guides you through gently tightening and relaxing different muscle groups.',
      },
      {
        kind: 'text',
        text: '**The plan starts small and grows.** Later, it includes two Resets, and sometimes three, giving you chances to repeat the practices you have learned. You can spread them out: one after breakfast, one after work. **Each Reset is saved the moment you finish it**, even if the rest of your day gets busy.',
      },
      { kind: 'reveal', prompt: 'Your plan has two parts, and each one does a different job. Tap each to see how it works.', items: [
        { label: 'Today’s plan day', detail: 'A lesson, a check-in, one claimed to-do and the Resets the day lists. Finish them all to earn today’s room piece.' },
        { label: 'Your routine', detail: 'A list of small daily habits on the Routine tab, like getting fresh air. It starts with a few we picked for you, and you can add your own.' },
      ] },
      {
        kind: 'text',
        text: 'Alongside these guided practices, your routine gives you **small habits to try through the day**. Tick one off on the Routine tab, then claim it on your plan to finish today’s list and earn its room piece. The rest are yours to skip. And **every habit you finish keeps your streak going**, your count of days in a row.',
      },
      { kind: 'choice', prompt: 'You finish today’s plan steps and claim one to-do, but skip your evening habit. What happens to your plan?', options: [
        { label: 'Tomorrow’s plan day opens as usual', feedback: 'Right. The listed Resets, lesson and check-in open the next plan day. Claiming one to-do also finishes today’s list for its room piece. Your evening habit can wait until tomorrow.' },
        { label: 'The plan waits until the habit is done', feedback: 'The next plan day opens after the listed Resets, lesson and check-in. Claim one to-do for today’s room piece; you can skip the other routine habits.' },
      ] },
      {
        kind: 'do',
        text: 'Look at **today’s steps on Home**, then open **the Routine tab** and pick one to-do. Start with whichever fits right now. One small step done today is a real start.',
      },
    ],
    source: 'Current product rules: programCatalogue.ts defines the daily reset count and duration; advance_program_day_if_ready requires the prescribed resets, lesson and check-in. The new UI additionally requires the to-do claim (todo:claim) for its room reward; recompute_daily_activity_streak_qualification counts a completed routine habit toward the streak.',
  },
  {
    id: 'plan.hour',
    title: 'The same time every day beats willpower',
    step: 'Check your Reset time and move it if another fits better.',
    blocks: [
      {
        kind: 'text',
        text: 'A Reset is a short session in this app with prompts to guide your breathing or attention. If you often forget to start, **choosing a regular time each day** can give you a useful reminder.',
      },
      {
        kind: 'text',
        text: 'Think of brushing your teeth at night. It is easier to remember because it belongs to a familiar part of your evening. Your Reset can become more familiar too when **the same daily moment reminds you to start**, although the time it takes to build that habit varies.',
      },
      {
        kind: 'text',
        text: 'Pick a time that fits a normal day, not a perfect one. Say you planned 8 a.m., but that’s when you rush out the door. You keep missing it. That suggests **another time may fit better**, because your morning already has a lot in it.',
      },
      {
        kind: 'text',
        text: 'If that time keeps clashing with your day, try another moment, such as after lunch. Describe the new reminder and action together: **“After I put my lunch dishes away, I’ll open my Reset.”** Naming the moment and the action together means there’s nothing left to decide.',
      },
      {
        kind: 'text',
        text: 'Try the new time for a few days. If it still clashes with other things, **adjust it again**. You’re looking for a spot in your day that holds up, **even on busy days**. Once you find it, keep it.',
      },
      {
        kind: 'choice',
        prompt: 'Your Reset time keeps getting squeezed out by other things. What should you try?',
        options: [
          { label: 'Move it next to something you do daily', feedback: 'A familiar daily event, such as lunch, gives you a clear reminder to open the guide. Try that pairing for a few days and notice whether it fits your schedule.' },
          { label: 'Keep the same time and try harder', feedback: 'Trying harder can work once. But if a time keeps failing, the time is the problem, not you. Move it somewhere easier.' },
        ],
      },
      { kind: 'reveal', prompt: 'In **“After lunch, I’ll open my Reset,”** one part names the reminder and the other names the action. Tap each to see how they work together.', items: [
        { label: 'After lunch', detail: 'This is the reminder. Lunch already happens every day, so it tells you when to start without you having to remember.' },
        { label: 'I’ll open my Reset', detail: 'This is the action. It says exactly what to do, so you don’t have to decide in a busy moment.' },
      ] },
      {
        kind: 'do',
        text: 'Check the time you picked for your Reset. If another time would be easier, **move it now**. **Pick a moment that already happens** every day.',
      },
    ],
    source: 'Habit formation: context stability, especially time of day, predicts automaticity more than motivation does.',
  },
  {
    id: 'plan.stacking',
    title: 'Tie your Reset to something you already do',
    step: 'Pick one daily moment that will remind you to do your Reset.',
    blocks: [
      {
        kind: 'text',
        text: 'A Reset is a short session in this app with prompts to guide your breathing or attention. To make starting easier to remember, **place it after something you already do**, such as brushing your teeth.',
      },
      {
        kind: 'text',
        text: 'The hardest part of any new habit is **remembering to start**. Your old habits already happen on their own. So when one ends, that’s your signal. For example, after brushing your teeth, you can open your Reset. That familiar action becomes **a reminder for the new one**.',
      },
      {
        kind: 'text',
        text: 'Choose something that **happens almost every day**, like breakfast, your morning coffee, or getting into bed. Make sure it happens on weekends too. If that old habit ever changes, just pick a new one.',
      },
      {
        kind: 'text',
        text: 'It helps to describe the moment clearly. **“After dinner, before I leave the table”** is clear. “Sometime tonight” is not, because tonight you’ll be tired and busy. When the moment is exact, **there’s nothing left to decide**. You have a clear next action when that moment arrives.',
      },
      { kind: 'choice', prompt: 'You want a reminder for your Reset that works on weekends too. Which one is better?', options: [
        { label: 'After brushing my teeth', feedback: 'Yes. You brush your teeth every day, weekends included. That makes it a steady signal to start your Reset.' },
        { label: 'After a weekday meeting', feedback: 'That works on workdays, but it disappears on weekends. Pick something that happens on every day you want to do your Reset.' },
      ] },
      { kind: 'sequence', prompt: 'Put these steps in order to build your reminder.', steps: [
        'Finish something you already do, like brushing your teeth.',
        'Open your Reset right after.',
        'After a few days, check if this moment is working for you.',
      ], feedback: 'The old habit comes first and tells you to start. If the moment doesn’t fit your day, you can always pick a new one.' },
      {
        kind: 'do',
        text: 'Pick **one moment that already happens every day**. Tomorrow, **open your Reset right after it**.',
      },
    ],
    source: 'Implementation intentions and habit stacking: an existing routine is a more reliable cue than an intention.',
  },
  {
    id: 'plan.low',
    title: 'Your Reset is meant to feel easy',
    step: 'Do today’s short Reset and let it count.',
    blocks: [
      {
        kind: 'text',
        text: 'A Reset is a short session in this app with prompts to guide your breathing or attention. Its short length gives you **a manageable place to begin**. Rather than setting aside a large part of the day, you can look for a small available moment and learn what makes returning tomorrow easier.',
      },
      { kind: 'fact', value: '1–3', caption: 'short Resets a day as your plan grows' },
      {
        kind: 'text',
        text: 'When a new habit feels **too demanding to repeat**, it becomes easier to put it off. So your plan, the day-by-day path you follow in this app, starts easy and grows slowly. You don’t need to add extra minutes. Once you finish its prompts, **a short Reset counts in full** toward that step of the plan.',
      },
      {
        kind: 'text',
        text: 'Picture a packed Tuesday: meetings, errands, dinner to make. A twenty-minute session is the first thing you’d skip. **A short Reset still fits**, between a meeting and a phone call. Showing up on days like that is **what builds the habit**.',
      },
      { kind: 'choice', prompt: 'Today’s Reset feels too short to matter. What should you do?', options: [
        { label: 'Do today’s Reset as planned', feedback: 'Yes. Today’s Reset is enough. Keeping it small makes it easy to repeat tomorrow, and repeating it is what builds the habit.' },
        { label: 'Make every Reset much longer', feedback: 'You can, but a bigger task is harder to start tomorrow. Your plan already grows on its own, step by step. Today’s short Reset counts in full.' },
      ] },
      {
        kind: 'do',
        text: 'If you find yourself wondering whether a short session counts, remember that its length is part of the plan. You can **follow today’s Reset as it is** and let that completed step count. Keeping it manageable makes it **easier to return another day**.',
      },
    ],
    source: 'Behaviour change: starting below capacity protects adherence; difficulty is the most common cause of early dropout.',
  },
  {
    id: 'plan.expect',
    title: 'Week one is for finding what fits',
    step: 'Ask yourself what you noticed, not whether it is working.',
    blocks: [
      {
        kind: 'text',
        text: 'A Reset is a short session in this app with prompts to guide your breathing or attention. Your first week is about **learning how Resets fit your day**. Notice when one is easy to start, and when it’s hard.',
      },
      { kind: 'fact', value: '7 days', caption: 'to find the moments that fit your day' },
      {
        kind: 'text',
        text: 'Small wins show up first. Maybe you **notice tight shoulders sooner** than you used to. Maybe you find a better time for tomorrow’s Reset. Each one is a step forward, and each week builds on the last.',
      },
      {
        kind: 'text',
        text: 'After a Reset, **notice one detail about your experience**. You could think about what helped you start, or how your body felt. For example, noticing raised shoulders while rushing tells you where you were holding tension. That detail is useful even if you still feel tense afterward.',
      },
      { kind: 'choice', prompt: 'After a Reset, you still feel a bit tense. What’s worth noticing this week?', options: [
        { label: 'What changed, even a little', feedback: 'Yes. Notice when the tension started, where you felt it, and which time of day suited you. Small notes like these help you shape a plan that fits.' },
        { label: 'Whether one Reset fixed everything', feedback: 'One Reset is one step. Sleep and busy days shape how you feel too, so look across the whole week to see your progress.' },
      ] },
      {
        kind: 'do',
        text: 'When you wonder “Is this working yet?”, ask **“What have I noticed?”** instead. **One small thing you noticed** is enough for today. Write it down if you like.',
      },
    ],
    source: 'NHS CBT guidance describes noticing thoughts, feelings, and actions and practising between sessions; the seven-day window is the first week of this authored plan.',
  },
  {
    id: 'plan.two',
    title: 'Two Resets give you two breaks a day',
    step: 'Find a spot in your day for each of today’s two Resets.',
    blocks: [
      {
        kind: 'text',
        text: 'A Reset is a short session in this app with prompts to guide your breathing or attention. Today, your daily plan includes **two separate Resets**. Each has its own guide and counts as one activity. You can think of them as **two short pauses in your day**, and choose a comfortable moment for each.',
      },
      { kind: 'fact', value: '2', caption: 'separate Resets to fit into your day' },
      {
        kind: 'text',
        text: 'You don’t have to do them back to back. Spread them out: **one before a hard task and one after it**, or one in the morning and one after work. Each Reset is saved **the moment you finish it**.',
      },
      {
        kind: 'text',
        text: 'The next plan day opens once you finish **the Resets the day lists, its lesson and a check-in**. Each Reset counts for its own step, and unfinished Resets and lessons stay available. Claim one ticked to-do to complete today’s list and earn **today’s room piece**.',
      },
      { kind: 'choice', prompt: 'Both of your planned Reset times clash with work today. What can you do?', options: [
        { label: 'Move one to a free moment', feedback: 'Yes. Your Reset times can move around your day. Both Resets, the lesson and the check-in open tomorrow. Claiming one to-do also completes today’s list for its room piece.' },
        { label: 'Count one Reset as both', feedback: 'Each Reset counts toward its own step, so finishing one leaves the other available. You can look for another free moment later, or return when you have time.' },
      ] },
      {
        kind: 'do',
        text: 'Look at your day and pick **a spot for each Reset**. They don’t need perfect timing. **Two short breaks** are what count.',
      },
    ],
    source: 'Current product rules: programCatalogue.ts prescribes distinct daily activities; advance_program_day_if_ready requires all prescribed activities, the lesson and a check-in. The new UI additionally requires the to-do claim (todo:claim) for its room reward.',
  },
  {
    id: 'plan.consistency',
    title: 'Coming back is what builds the habit',
    step: 'On a busy day, do the part that fits instead of skipping.',
    blocks: [
      {
        kind: 'text',
        text: 'A Reset is a short session in this app with prompts to guide your breathing or attention. Building a habit takes repeated chances to practise, so **returning after a difficult day is useful too**. You can learn which reminders and moments help you start, without needing every session to happen exactly as planned.',
      },
      { kind: 'fact', value: '1 day', caption: 'the only day you need to think about' },
      {
        kind: 'text',
        text: 'Doing your Reset at the same time, day after day, **makes it automatic**. It becomes like brushing your teeth. Your plan, the day-by-day path in this app, adds Resets over time. If a day feels too full, **find the part that’s hard**: the time, the kind of Reset, or finding a quiet minute.',
      },
      {
        kind: 'text',
        text: 'Some days a meeting runs late or the evening fills up. Because **your schedule can change from day to day**, your Reset time may need to change with it. Move your Reset to another free moment, do the other steps, or come back later. When you return, **the steps you finished are still saved**.',
      },
      { kind: 'choice', prompt: 'Yesterday your Reset was easy. Today it feels hard. What helps you come back?', options: [
        { label: 'Use what helped yesterday', feedback: 'Yes. The same reminder, quiet corner or start time can help again today. A harder day doesn’t undo any of your progress.' },
        { label: 'Wait until it feels easy again', feedback: 'Easy days come and go, and waiting can turn into skipping. Start with what you have today, and the habit keeps growing.' },
      ] },
      {
        kind: 'do',
        text: 'If today feels full, ask: **what’s a version I can do?** Maybe it’s one Reset instead of two. Start with that part, then return for the rest when you can. **Continuing from where you are** helps you keep going.',
      },
    ],
    source: 'Habit formation — repetition in a stable context drives automaticity more than session length.',
  },
  {
    id: 'plan.bad',
    title: 'A hard day doesn’t undo your plan',
    step: 'Do one step that fits now, or rest and return later.',
    blocks: [
      {
        kind: 'text',
        text: 'Your plan is your day-by-day path in this app. **Each day has a few small steps**: a short lesson, a quick mood check-in, one to-do and, on most days, a Reset. A Reset is **a short guided session that helps you calm down or wake up**.',
      },
      { kind: 'fact', value: '1 day', caption: 'stays open until you finish it' },
      {
        kind: 'text',
        text: 'Some days you’re tired, busy or low. On those days, **one small step still counts**. Your plan never punishes you. Tomorrow’s plan day opens once the listed Resets, lesson and check-in are done. Claim one to-do as well to earn **today’s room piece**.',
      },
      {
        kind: 'text',
        text: 'A common thought on a bad day is: “If I can’t do it all, why start?” That’s called **all-or-nothing thinking**. It treats “some” as if it were “none.” In practice, **one finished step is still progress**. If today has two Resets and you have time for one, you can do that one now and come back for the other later.',
      },
      {
        kind: 'choice',
        prompt: 'You have time for one Reset, but today asks for two. What’s true about your plan?',
        options: [
          { label: 'One Reset counts, and the day stays open', feedback: 'Right. Your Reset is saved. Tomorrow’s plan day opens once you’ve also done the second Reset, the lesson and the check-in. Claim one to-do too for today’s room piece.' },
          { label: 'One Reset finishes the whole day', feedback: 'The Reset you finished stays saved. The next plan day opens after the remaining Reset, the lesson and the check-in are finished, so you can return to those steps later.' },
        ],
      },
      {
        kind: 'do',
        text: 'Ask what fits right now: **a Reset, the lesson, the check-in, a to-do, or rest**. The Resets and lesson you finish stay saved. Claim one to-do when you can to complete **today’s list**. No rush.',
      },
    ],
    source: 'Current product rules: advance_program_day_if_ready requires the listed Resets, lesson and check-in; the new UI additionally requires the to-do claim (todo:claim) for its room reward. NHS CBT thought-record guidance describes identifying all-or-nothing interpretations.',
  },
  {
    id: 'plan.missed',
    title: 'Missing a day doesn’t lose your place',
    step: 'After a missed day, ask what got in the way, without blame.',
    blocks: [
      {
        kind: 'text',
        text: 'If a busy day goes by without opening the app, **your plan stays where you left it**. The plan follows your completed activities rather than moving ahead with the calendar, so you can return to the next unfinished step without catching up on extra work.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Wrong time', text: 'Move your Reset, the short guided session in this app, to a time that would have worked.' },
          { term: 'Full day', text: 'Some days are packed. That’s normal. Pick an easier time for tomorrow.' },
          { term: 'You forgot', text: 'That’s a reminder problem, not a willpower problem. Tie your Reset to something you already do.' },
        ],
      },
      {
        kind: 'text',
        text: 'There are two kinds of days here. **A calendar day** passes whether you open the app or not. **A plan day** only moves forward when you finish its steps. So a missed calendar day never pushes you back.',
      },
      {
        kind: 'text',
        text: 'A missed day can bring the thought “I always quit.” But **one day is not a pattern**. Ask what actually happened. Were you traveling? Was your phone in another room? Did work run late? Understanding the reason helps you **choose a change that might make returning easier**.',
      },
      {
        kind: 'choice',
        prompt: 'You missed yesterday and think, “I always give up.” Which thought is closer to the truth?',
        options: [
          { label: 'I missed one day, and I can come back today', feedback: 'Yes. That keeps it about one day, not about you. Your plan is waiting on the same day you left it.' },
          { label: 'My earlier days don’t count any more', feedback: 'They still count. Every day you finished stays finished. A missed day never erases them or moves you backward.' },
        ],
      },
      {
        kind: 'do',
        text: 'If you missed a day, ask **what got in the way**, without blaming yourself. Then **pick one fix** for next time.',
      },
    ],
    source: 'Current product rules: programEnrollment.ts keeps programDay in place after a missed date; NHS CBT guidance supports examining a setback without treating one event as a global verdict.',
  },
  {
    id: 'plan.streak',
    title: 'Your streak is there to help, not judge',
    step: 'If your streak resets, start again tomorrow.',
    blocks: [
      {
        kind: 'text',
        text: 'Your streak is **the number of days in a row you showed up**. Do one small thing in this app, like a short lesson, a quick check-in about your mood, or a habit from your list, and that day counts.',
      },
      {
        kind: 'text',
        text: 'A streak is a friendly nudge to come back tomorrow. It’s **only a count**, not a grade. If it breaks, the number starts over, but everything you finished **stays finished**. Your progress doesn’t go anywhere.',
      },
      { kind: 'fact', value: '1', caption: 'day is all it takes to start a new streak' },
      {
        kind: 'text',
        text: 'Your plan is the day-by-day path you follow in this app. Say you finish **three plan days**, skip Thursday, and come back Friday. Your streak starts over, but those days **stay finished**. **Friday is what matters**, not the number.',
      },
      { kind: 'choice', prompt: 'Your streak ended yesterday after a busy weekend. Which thought helps you take the next step?', options: [
        { label: 'My progress is still here; I can come back', feedback: 'Yes. A streak only counts days in a row. Everything you finished, and everything you learned, is still yours. Start a new streak today.' },
        { label: 'I lost all my progress', feedback: 'You didn’t. Only the count started over. Every lesson and session you finished is still there, and your plan is waiting.' },
      ] },
      {
        kind: 'do',
        text: 'When your streak starts over, remember: **your progress didn’t go anywhere**. Tomorrow is **a fresh start**, not a debt. One day back and you’re on a new streak.',
      },
    ],
    source: 'Streak mechanics cut both ways: loss framing raises adherence and raises dropout after a break.',
  },
  {
    id: 'plan.week',
    title: 'Judge your week, not one day',
    step: 'Look back on your week and notice what helped you show up.',
    blocks: [
      {
        kind: 'text',
        text: 'Your plan gives you repeated chances to try short practices in everyday life. Since some days are busier or harder than others, **looking across a week gives you more context**. You can notice which moments helped you start and which ones regularly got in the way.',
      },
      { kind: 'fact', value: '7 days', caption: 'to spot what helps you show up' },
      {
        kind: 'text',
        text: 'A Reset is a short session in this app with prompts to guide your breathing or attention. Look for **a simple pattern** in yours: which times worked, which were too busy, and what reminded you to start.',
      },
      {
        kind: 'text',
        text: 'Say your Reset happens every day after breakfast, but keeps slipping after dinner. **The time is the problem**, not you. Move the evening one earlier and see. When you look back, ask two questions. “**Did the time work?**” is about your schedule. “How did I feel?” can change with sleep or stress. Keep the two apart, and your next change is easy to spot.',
      },
      { kind: 'choice', prompt: 'Your evening Reset got skipped on several busy days. What should you try?', options: [
        { label: 'Move it earlier in the day', feedback: 'Yes. The pattern shows the evening is too crowded. An earlier time is a simple fix to try this week.' },
        { label: 'Decide the whole plan isn’t working', feedback: 'One time slot not working doesn’t mean the plan isn’t. The pattern points to the evening, so try a new time first.' },
      ] },
      {
        kind: 'do',
        text: 'Looking back on your week, choose one thing that **helped you start**. Try keeping that same reminder or moment next week, while adjusting anything that regularly got in the way.',
      },
    ],
    source: 'Self-monitoring is a common CBT method for identifying patterns across situations; no completion threshold is required by the plan to reflect on a week.',
  },
  {
    id: 'plan.after',
    title: 'Keep the one Reset you actually use',
    step: 'Pick the one part of your plan you want to keep.',
    blocks: [
      {
        kind: 'text',
        text: 'Now that you have reached the end of your plan, you have experience with different practices and times of day. You can use that experience to choose **one Reset you want to keep in your routine**, focusing on what fits an ordinary day.',
      },
      {
        kind: 'text',
        text: 'A Reset is a short session in this app with prompts to guide your breathing or attention. Your plan had you try different ones at different times. The point was to **find the one that fits your life**.',
      },
      {
        kind: 'text',
        text: 'It doesn’t have to be the longest Reset, or the one you think you should pick. It just has to be **the one you actually do**. One Reset at one steady time is how the habit lasts.',
      },
      {
        kind: 'text',
        text: 'To choose something you can continue, think of a normal week. Notice which Reset was easiest to start and what happened right before it, then **keep that familiar reminder**. For example: after you put the lunch dishes away, sit down for your Reset.',
      },
      { kind: 'choice', prompt: 'Your plan is ending. Which Reset is best to keep going?', options: [
        { label: 'The one I actually come back to', feedback: 'Yes. A Reset you return to, tied to a steady moment in your day, is the one that keeps working after the plan ends.' },
        { label: 'The longest one I did on my best day', feedback: 'Long Resets are great on calm days. But the habit that lasts is the one that fits an ordinary, busy day.' },
      ] },
      {
        kind: 'do',
        text: 'Choose the part of your plan that was **most useful and manageable to repeat**, then decide when you will return to it in an ordinary week.',
      },
    ],
    source: 'Maintenance phase — narrowing to a single cue-bound behaviour is what survives the end of a structured programme.',
  },
] as const satisfies readonly LessonDefinition[];
