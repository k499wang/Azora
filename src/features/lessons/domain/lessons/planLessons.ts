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
        text: 'Your plan is the day-by-day path you follow in this app. **Each day has a few small steps.** First, a Reset: **a short guided session**, usually a few minutes, that helps you calm down or wake up. Then a short lesson like this one, and a quick check-in where you tap how you feel.',
      },
      { kind: 'fact', value: '3', caption: 'the most Resets your plan will ever ask for in one day' },
      {
        kind: 'text',
        text: 'Some Resets guide your breathing. Others walk you through **5-4-3-2-1**, where you name things you can see, hear and touch. And some are **Muscle Release**, where you squeeze and relax each part of your body.',
      },
      {
        kind: 'text',
        text: 'At first, your plan asks for **one Reset a day**. Later days ask for two, and sometimes three. You can spread them out: one after breakfast, one after work. **Each Reset is saved the moment you finish it**, even if the rest of your day gets busy.',
      },
      { kind: 'reveal', prompt: 'Your plan has two parts, and each one does a different job. Tap each to see how it works.', items: [
        { label: 'Today’s plan day', detail: 'Your Resets, a lesson and a check-in. Finish all of them and the next day of your plan opens.' },
        { label: 'Your routine', detail: 'A list of small daily habits on the Routine tab, like getting fresh air. It starts with a few we picked for you, and you can add your own.' },
      ] },
      {
        kind: 'text',
        text: 'Your habits **carry the calm into the rest of your day**. Tick one off on the Routine tab when it’s done. A skipped habit never holds your plan back. And **every habit you finish keeps your streak going**, your count of days in a row.',
      },
      { kind: 'choice', prompt: 'You finish today’s Reset, lesson and check-in, but skip your evening habit. What happens to your plan?', options: [
        { label: 'Tomorrow’s plan day opens as usual', feedback: 'Right. Only the Resets, the lesson and the check-in move your plan forward. Your habit waits on the Routine tab, ready for another try tomorrow.' },
        { label: 'The plan waits until the habit is done', feedback: 'Not quite. Habits sit beside your plan, not inside it. A skipped habit never stops your plan, so tomorrow opens as usual.' },
      ] },
      {
        kind: 'do',
        text: 'Look at **today’s Reset, lesson and check-in**, then open **the Routine tab**. Start with whichever fits right now. One small step done today is a real start.',
      },
    ],
    source: 'Current product rules: programCatalogue.ts defines the daily reset count and duration; advance_program_day_if_ready requires the prescribed resets, lesson, and check-in but not routine habits; recompute_daily_activity_streak_qualification counts a completed routine habit toward the streak.',
  },
  {
    id: 'plan.hour',
    title: 'The same time every day beats willpower',
    step: 'Check your Reset time and move it if another fits better.',
    blocks: [
      {
        kind: 'text',
        text: 'A Reset is a short guided session in this app that helps you calm down or wake up. Here’s the easiest way to stop forgetting it: **do it at the same time every day**.',
      },
      {
        kind: 'text',
        text: 'Think of brushing your teeth at night. You don’t decide to do it. **The moment itself tells you to start.** After a few weeks at the same time, your Reset works the same way. You stop needing willpower to remember.',
      },
      {
        kind: 'text',
        text: 'Pick a time that fits a normal day, not a perfect one. Say you planned 8 a.m., but that’s when you rush out the door. You keep missing it. **That isn’t a willpower problem.** The time was just too crowded.',
      },
      {
        kind: 'text',
        text: 'So move it. Try right after lunch. Then say it as one clear sentence: **“After I put my lunch dishes away, I’ll open my Reset.”** Naming the moment and the action together means there’s nothing left to decide.',
      },
      {
        kind: 'text',
        text: 'Try the new time for a few days. Still missing it? **Move it again.** You’re looking for a spot in your day that holds up, **even on busy days**. Once you find it, keep it.',
      },
      {
        kind: 'choice',
        prompt: 'Your Reset time keeps getting squeezed out by other things. What should you try?',
        options: [
          { label: 'Move it next to something you do daily', feedback: 'Yes. Something that already happens every day, like lunch, reminds you without any effort. Try it for a few days and see.' },
          { label: 'Keep the same time and try harder', feedback: 'Trying harder can work once. But if a time keeps failing, the time is the problem, not you. Move it somewhere easier.' },
        ],
      },
      { kind: 'reveal', prompt: 'Here is a reminder that works: **“After lunch, I’ll open my Reset.”** Tap each part to see its job.', items: [
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
        text: 'A Reset is a short guided session in this app that helps you calm down or wake up. Want it to happen without thinking? **Attach it to a habit you already have**, like brushing your teeth.',
      },
      {
        kind: 'text',
        text: 'The hardest part of any new habit is **remembering to start**. Your old habits already happen on their own. So when one ends, that’s your signal. Teeth brushed? Open your Reset. **The old habit pulls the new one along.**',
      },
      {
        kind: 'text',
        text: 'Choose something that **happens almost every day**, like breakfast, your morning coffee, or getting into bed. Make sure it happens on weekends too. If that old habit ever changes, just pick a new one.',
      },
      {
        kind: 'text',
        text: 'Be exact. **“After dinner, before I leave the table”** is clear. “Sometime tonight” is not, because tonight you’ll be tired and busy. When the moment is exact, **there’s nothing left to decide**. You just do it.',
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
        text: 'A Reset is a short guided session in this app that helps you calm down or wake up. It’s short on purpose, because **small is what makes it stick**. It fits into even your busiest day, so you can come back tomorrow.',
      },
      { kind: 'fact', value: '1–3', caption: 'short Resets a day as your plan grows' },
      {
        kind: 'text',
        text: 'The top reason people quit a new habit early is simple: **it’s too hard**. So your plan, the day-by-day path you follow in this app, starts easy and grows slowly. You don’t need to add extra minutes. **A short Reset counts in full.**',
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
        text: 'If a voice says a short Reset doesn’t count, let it talk. **Do today’s Reset as it is.** **Small and done beats big and skipped.**',
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
        text: 'A Reset is a short guided session in this app that helps you calm down or wake up. Your first week is about **learning how Resets fit your day**. Notice when one is easy to start, and when it’s hard.',
      },
      { kind: 'fact', value: '7 days', caption: 'to find the moments that fit your day' },
      {
        kind: 'text',
        text: 'Small wins show up first. Maybe you **notice tight shoulders sooner** than you used to. Maybe you find a better time for tomorrow’s Reset. Each one is a step forward, and each week builds on the last.',
      },
      {
        kind: 'text',
        text: 'After each Reset, ask yourself one easy question. Did I start when I planned? What did I notice in my body? A good answer sounds like: “I was rushing, and **my shoulders were up near my ears**.” **That’s useful to know.**',
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
        text: 'A Reset is a short guided session in this app that helps you calm down or wake up. Today your plan, the day-by-day path you follow here, has **two Resets** instead of one. That means **two breaks** in your day, not just one.',
      },
      { kind: 'fact', value: '2', caption: 'separate Resets to fit into your day' },
      {
        kind: 'text',
        text: 'You don’t have to do them back to back. Spread them out: **one before a hard task and one after it**, or one in the morning and one after work. Each Reset is saved **the moment you finish it**.',
      },
      {
        kind: 'text',
        text: 'Each plan day has a few steps: your Resets, a short lesson like this one, and a quick check-in where you tap how you feel. **Finish them all and tomorrow’s plan day opens.** One Reset can’t count for both. Run out of time? Whatever is left **waits for you right here**. Nothing piles up. **You just pick up where you stopped.**',
      },
      { kind: 'choice', prompt: 'Both of your planned Reset times clash with work today. What can you do?', options: [
        { label: 'Move one to a free moment', feedback: 'Yes. Your Reset times can move around your day. You still need both Resets, the lesson and the check-in to open tomorrow.' },
        { label: 'Count one Reset as both', feedback: 'Not quite. One Reset is worth doing, but each one counts once. Find a second free moment, even a short one later in the day.' },
      ] },
      {
        kind: 'do',
        text: 'Look at your day and pick **a spot for each Reset**. They don’t need perfect timing. **Two short breaks** are what count.',
      },
    ],
    source: 'Current product rules: programCatalogue.ts prescribes distinct daily activities; advance_program_day_if_ready requires all prescribed activities, the lesson, and a check-in.',
  },
  {
    id: 'plan.consistency',
    title: 'Coming back is what builds the habit',
    step: 'On a busy day, do the part that fits instead of skipping.',
    blocks: [
      {
        kind: 'text',
        text: 'A Reset is a short guided session in this app that helps you calm down or wake up. Here’s the secret to making it stick: **coming back matters more than doing it perfectly**. Every time you come back, the habit gets stronger.',
      },
      { kind: 'fact', value: '1 day', caption: 'the only day you need to think about' },
      {
        kind: 'text',
        text: 'Doing your Reset at the same time, day after day, **makes it automatic**. It becomes like brushing your teeth. Your plan, the day-by-day path in this app, adds Resets over time. If a day feels too full, **find the part that’s hard**: the time, the kind of Reset, or finding a quiet minute.',
      },
      {
        kind: 'text',
        text: 'Some days a meeting runs late or the evening fills up. **Every day is different**, and that’s fine. Move your Reset to another free moment, do the other steps, or come back later. **Everything you’ve done still counts.**',
      },
      { kind: 'choice', prompt: 'Yesterday your Reset was easy. Today it feels hard. What helps you come back?', options: [
        { label: 'Use what helped yesterday', feedback: 'Yes. The same reminder, quiet corner or start time can help again today. A harder day doesn’t undo any of your progress.' },
        { label: 'Wait until it feels easy again', feedback: 'Easy days come and go, and waiting can turn into skipping. Start with what you have today, and the habit keeps growing.' },
      ] },
      {
        kind: 'do',
        text: 'If today feels full, ask: **what’s a version I can do?** Maybe it’s one Reset instead of two. Then do it. **Coming back** is what counts.',
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
        text: 'Your plan is your day-by-day path in this app. **Each day has a few small steps**: a Reset, a short lesson and a quick mood check-in. A Reset is **a short guided session that helps you calm down or wake up**.',
      },
      { kind: 'fact', value: '1 day', caption: 'stays open until you finish it' },
      {
        kind: 'text',
        text: 'Some days you’re tired, busy or low. On those days, **one small step still counts**. Your plan never punishes you. Tomorrow’s plan day simply opens once today’s steps are done, whenever that is.',
      },
      {
        kind: 'text',
        text: 'A common thought on a bad day is: “If I can’t do it all, why start?” That’s called **all-or-nothing thinking**. It treats “some” as if it were “none.” But one step is always more than zero. Say today has two Resets and you have time for one. Do that one. **It’s saved for good.**',
      },
      {
        kind: 'choice',
        prompt: 'You have time for one Reset, but today asks for two. What’s true about your plan?',
        options: [
          { label: 'One Reset counts, and the day stays open', feedback: 'Right. Your Reset is saved. Tomorrow’s plan day opens once you’ve also done the second Reset, the lesson and the check-in.' },
          { label: 'One Reset finishes the whole day', feedback: 'Not quite. That Reset is saved, but tomorrow’s plan day opens only after both Resets, the lesson and the check-in are done.' },
        ],
      },
      {
        kind: 'do',
        text: 'Ask what fits right now: **a Reset, the lesson, the check-in, or rest**. Whatever is left **waits for you** until you come back. No rush.',
      },
    ],
    source: 'Current product rules: advance_program_day_if_ready advances only after the full daily set; NHS CBT thought-record guidance describes identifying all-or-nothing interpretations.',
  },
  {
    id: 'plan.missed',
    title: 'Missing a day doesn’t lose your place',
    step: 'After a missed day, ask what got in the way, without blame.',
    blocks: [
      {
        kind: 'text',
        text: 'Missed a day? **Your plan waits for you right where you left off.** Your plan is the day-by-day path you follow in this app. There’s nothing to make up and no extra work. You just pick up the next step.',
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
        text: 'A missed day can bring the thought “I always quit.” But **one day is not a pattern**. Ask what actually happened. Were you traveling? Was your phone in another room? Did work run late? **A clear reason is easy to fix.**',
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
        text: 'Your plan is the day-by-day path you follow in this app. One hard day in it tells you very little. **A whole week tells you a lot.** Looking back over seven days shows what’s working, so you can do more of it.',
      },
      { kind: 'fact', value: '7 days', caption: 'to spot what helps you show up' },
      {
        kind: 'text',
        text: 'A Reset is a short guided session in this app that helps you calm down or wake up. Look for **a simple pattern** in yours: which times worked, which were too busy, and what reminded you to start.',
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
        text: 'Look back on your week. What **helped you show up**? **Do more of that** next week, and drop what didn’t work.',
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
        text: 'You’ve reached the end of your plan. **That’s a real achievement.** Now the goal is to keep what worked, without keeping everything. Pick **one Reset you can do on a normal day**.',
      },
      {
        kind: 'text',
        text: 'A Reset is a short guided session in this app that helps you calm down or wake up. Your plan had you try different ones at different times. The point was to **find the one that fits your life**.',
      },
      {
        kind: 'text',
        text: 'It doesn’t have to be the longest Reset, or the one you think you should pick. It just has to be **the one you actually do**. One Reset at one steady time is how the habit lasts.',
      },
      {
        kind: 'text',
        text: 'Here’s how to choose. Think of a normal week. Which Reset was easiest to start, and what happened right before it? **Keep that same reminder.** For example: after you put the lunch dishes away, sit down for your Reset.',
      },
      { kind: 'choice', prompt: 'Your plan is ending. Which Reset is best to keep going?', options: [
        { label: 'The one I actually come back to', feedback: 'Yes. A Reset you return to, tied to a steady moment in your day, is the one that keeps working after the plan ends.' },
        { label: 'The longest one I did on my best day', feedback: 'Long Resets are great on calm days. But the habit that lasts is the one that fits an ordinary, busy day.' },
      ] },
      {
        kind: 'do',
        text: 'Which part of your plan was **most useful to come back to**? **Keep that one.** Everything else is a bonus.',
      },
    ],
    source: 'Maintenance phase — narrowing to a single cue-bound behaviour is what survives the end of a structured programme.',
  },
] as const satisfies readonly LessonDefinition[];
