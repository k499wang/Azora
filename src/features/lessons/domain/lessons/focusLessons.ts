import type { LessonDefinition } from '../lessonBlock';

/**
 * Attention, and the conditions it needs.
 *
 * `focus` runs on these. Almost none of them are about trying harder — the
 * useful moves in this area are nearly all decisions made in advance, about
 * where things are and when they happen.
 */
export const FOCUS_LESSONS = [
  {
    id: 'focus.ready',
    title: 'You can begin before you feel ready',
    blocks: [
      {
        kind: 'text',
        text: "A big task can feel so hard that you wait to feel ready. **You can start small before that feeling comes.** For example, open the report and write one rough heading. That is a start, even if you stop after two minutes.",
      },
      { kind: 'fact', value: '2 min', caption: 'is enough for a first step' },
      {
        kind: 'text',
        text: 'Thinking about every step at once can make a task feel too big. **Choose only the first action now.** You can decide what comes next after you begin.',
      },
      {
        kind: 'choice',
        prompt: 'A report feels too large to start. Which first step can test whether starting helps?',
        options: [
          { label: 'Open the file and write one rough heading', feedback: 'This is a small test: begin for two minutes, then decide whether to continue.' },
          { label: 'Wait until I feel ready to finish it', feedback: 'Readiness may never arrive first. A tiny start gives you information without committing to the whole task.' },
        ],
      },
      {
        kind: 'text',
        text: "A first step works because it changes the question from 'Can I finish all of this?' to **'Can I do this one action?'** Opening a file or gathering notes does not obligate you to complete the task today.",
      },
      {
        kind: 'text',
        text: '**Try a short test.** Give the first action two minutes, then see how you feel. You can continue, stop, choose a better time, or ask for help.',
      },
      {
        kind: 'do',
        text: 'Think of one task you want to start. **Name the first action you can do in two minutes**, such as opening the file or writing a heading.',
      },
    ],
    source: 'Behavioural activation — action precedes motivation; the two-minute entry rule is the applied form.',
  },
  {
    id: 'focus.switch',
    title: 'Coming back from an interruption is the cost',
    blocks: [
      {
        kind: 'text',
        text: "An interruption pulls your attention away from what you were doing. **Getting back takes another step:** you have to remember where you stopped. For example, after answering a message, you may need to reread your draft before writing again.",
      },
      { kind: 'fact', value: '1 note', caption: 'can make returning easier' },
      {
        kind: 'text',
        text: 'Some interruptions are easy to recover from. After a message interrupts a complicated draft, you may need to remember **what you were trying to say** before you can continue.',
      },
      {
        kind: 'text',
        text: 'Imagine writing a difficult email when a notification arrives. After checking it, you may need to reread the draft to remember its purpose. **The return has steps**: find the place, recall the goal, and resume.',
      },
      {
        kind: 'text',
        text: "If you must stop, **write down your next step** before switching: 'Next, explain the second option.' Read that note when you return. You can check optional messages at a time you choose.",
      },
      {
        kind: 'choice',
        prompt: 'A message interrupts your work. How could you make returning easier?',
        options: [
          { label: 'Write down the next step before replying', feedback: 'A short note reminds you where to begin when you return.' },
          { label: 'Trust I will remember everything', feedback: 'Even brief interruptions can make the next step harder to recover.' },
        ],
      },
      {
        kind: 'do',
        text: 'Before your next work period, **choose one interruption you can reduce**. You might silence an optional alert or tell someone when you will be available.',
      },
    ],
    source: 'Mark et al., time to resume an interrupted task. Widely cited; treat the figure as an estimate, hence the caption.',
  },
  {
    id: 'focus.phone',
    title: 'Put the phone in another room',
    blocks: [
      {
        kind: 'text',
        text: "A phone on your desk can remind you to check it, even when it makes no sound. **Moving it farther away removes that reminder.** Try putting it across the room for one task, while keeping important calls available.",
      },
      {
        kind: 'text',
        text: 'Wanting to check your phone is common. **Making the same choice again and again takes effort.** Moving the phone lets you make that choice once.',
      },
      {
        kind: 'text',
        text: '**Put the phone away before you start.** Then you will see it less often while you work.',
      },
      {
        kind: 'text',
        text: 'Each time the phone lights up, you may wonder whether to check it. **When it is out of sight, you get fewer reminders** to make that choice.',
      },
      {
        kind: 'text',
        text: '**Try this for one work period:** put the phone across the room, keep important calls audible if needed, and notice whether it is easier to stay with the task.',
      },
      {
        kind: 'choice',
        prompt: 'You keep checking your phone during a task. What setup could help?',
        options: [
          { label: 'Put it in another room for one work block', feedback: 'Distance adds a pause between the urge and the check.' },
          { label: 'Rely on willpower with it beside me', feedback: 'Changing the environment can make the task easier than constant self-control.' },
        ],
      },
      {
        kind: 'do',
        text: 'For your next task, **put your phone out of reach** while keeping any calls you need available.',
      },
    ],
    source: 'Mere-presence effects on available attention; precommitment beats repeated in-the-moment self-control.',
  },
  {
    id: 'focus.blocks',
    title: 'Protect thirty minutes, not the whole day',
    blocks: [
      {
        kind: 'text',
        text: "You do not need a free day to get something done. **Choose one short period for one task.** For example, spend thirty minutes making an outline, then stop. A shorter period is fine if that fits today.",
      },
      { kind: 'fact', value: '30 min', caption: 'for one task, if it fits your day' },
      {
        kind: 'text',
        text: 'Knowing when you will stop can make the work feel manageable. **Decide what you want to finish** in that period, such as an outline or one email.',
      },
      {
        kind: 'text',
        text: "Choose **one clear task for that time** before you begin. 'Outline the first section' tells you what to do. 'Work on the report' leaves too many choices.",
      },
      {
        kind: 'text',
        text: '**Interruptions may still happen**. If one does, mark where you stopped and return when possible. A shorter block can work better on a crowded day. The useful boundary is one you can actually keep, not a perfect schedule.',
      },
      {
        kind: 'choice',
        prompt: 'Your day is packed. How much focus time could you protect?',
        options: [
          { label: 'One realistic thirty-minute block', feedback: 'It is easier to find and keep one short period for this task.' },
          { label: 'The entire day or nothing', feedback: 'A useful focus period does not need to take over the day.' },
        ],
      },
      {
        kind: 'do',
        text: 'If a whole day feels impossible to plan, what **small stretch of time** would feel possible to protect?',
      },
    ],
    source: 'Timeboxing: bounded intervals outperform open-ended intent, largely by making protection feasible.',
  },
  {
    id: 'focus.three',
    title: 'Write down three things, not thirty',
    blocks: [
      {
        kind: 'text',
        text: "A long to-do list holds everything you want to remember. It is not a realistic plan for one day. **Pick a few things you can do today** and leave the rest on the larger list for later.",
      },
      { kind: 'fact', value: '3', caption: 'possible tasks to choose for today' },
      {
        kind: 'text',
        text: 'Three clear priorities can make a day feel more manageable. **The number is a guide**, not a rule; what matters is choosing work that fits the time and energy available.',
      },
      {
        kind: 'text',
        text: "A long list can hold urgent tasks, optional ideas, and work for later. **Keep that list as a reminder.** Make a separate short list of what you will try today.",
      },
      {
        kind: 'text',
        text: "**Name an action you can see yourself doing:** 'Email the draft to Sam' is clearer than 'deal with project.' If three tasks are too many, choose one. You can add another later.",
      },
      {
        kind: 'choice',
        prompt: 'Your task list has thirty items. What could you write for today?',
        options: [
          { label: 'Three tasks I can actually start', feedback: 'A short list makes it easier to choose what to do next.' },
          { label: 'Copy every item into a new list', feedback: 'A longer list may preserve the same difficulty choosing where to begin.' },
        ],
      },
      {
        kind: 'do',
        text: 'When your list makes you feel behind, ask which **few things matter today**. Keep the rest on your larger list for another day.',
      },
    ],
    source: 'Goal specificity and attainability: short closed lists produce completion; long open lists produce avoidance.',
  },
  {
    id: 'focus.hard',
    title: 'The hardest thing need not come first',
    blocks: [
      {
        kind: 'text',
        text: "A difficult task can make every other task feel wrong. **There is no rule that it must be first.** You could open the file and make a small outline, or schedule the hard part for a time when you have more energy.",
      },
      {
        kind: 'text',
        text: 'Starting with a small step may help. On another day, it may help to do the hard task early. **Choose the order that helps you begin today.**',
      },
      {
        kind: 'text',
        text: 'Notice when you usually have the energy for a hard task. **You can start with an easier step** if that helps you reach it.',
      },
      {
        kind: 'text',
        text: "CBT is a way to check whether a thought helps you choose what to do. If you think 'I must do the hardest thing first,' **ask what has worked before**: starting early, or doing a small setup step first?",
      },
      {
        kind: 'text',
        text: '**For example**, before a demanding presentation, you might first open the slides and list three points. That is progress toward the hard task, not avoidance. If easier tasks keep replacing it, reserve a clear time for the presentation itself.',
      },
      {
        kind: 'choice',
        prompt: 'A difficult task feels too big to start. Which first move helps?',
        options: [
          { label: 'Choose an easy first step', feedback: 'A small action can help you begin, such as opening the slides or listing three points.' },
          { label: 'Wait until the whole task feels easy', feedback: 'The feeling of readiness may come after you begin.' },
        ],
      },
      {
        kind: 'do',
        text: 'If a task feels hard to face, ask: **could I do one small first step**, or would it help to put the full task earlier in my day? Choose what fits.',
      },
    ],
    source: 'Task ordering under diminishing self-regulatory capacity; avoidance also imposes a standing attentional cost.',
  },
  {
    id: 'focus.inbox',
    title: 'Your inbox is someone else’s list',
    blocks: [
      {
        kind: 'text',
        text: "Emails are requests that arrive on someone else’s schedule. Some need a quick answer; others can wait. **Before you open your inbox, name one task you chose.** That helps you protect time for it.",
      },
      { kind: 'fact', value: '1 task', caption: 'to name before checking mail' },
      {
        kind: 'text',
        text: 'Some messages need a quick answer. Others can wait while you do **the task you planned**. Choose based on what your work and life require.',
      },
      {
        kind: 'text',
        text: 'If your role needs fast replies, keep a way to see urgent messages. Otherwise, **choose when to check email** so each new message does not interrupt your planned task.',
      },
      {
        kind: 'text',
        text: '**Before opening email**, write down one planned task and its next step. If you need urgent alerts, leave those on and check other messages at a time that works for you.',
      },
      {
        kind: 'choice',
        prompt: 'You open email and lose your planned morning. What could you try?',
        options: [
          { label: 'Do one chosen task before checking', feedback: 'Starting with your own priority protects some time from incoming requests.' },
          { label: 'Let every new message choose my task', feedback: 'Incoming messages reflect other people’s timing, not necessarily your priorities.' },
        ],
      },
      {
        kind: 'do',
        text: 'Before opening your inbox, ask whether there is **something you chose** that deserves a little attention first.',
      },
    ],
    source: 'Reactive vs proactive work: email-first mornings shift the day to externally set priorities.',
  },
  {
    id: 'focus.badges',
    title: 'Every red dot asks you a question',
    blocks: [
      {
        kind: 'text',
        text: "The red number on an app means something new is there. It does not tell you whether it matters now. **Each badge can interrupt your attention** by making you decide whether to check. You can hide badges you do not need.",
      },
      {
        kind: 'text',
        text: 'Even if you do not open the app, each red number may make you wonder whether to check it. **Those repeated decisions can interrupt your task.**',
      },
      {
        kind: 'text',
        text: 'If you hide badges you do not need, **you see fewer reminders to check apps** while doing something else.',
      },
      {
        kind: 'text',
        text: 'A badge only means something new happened. **It does not tell you how important it is.** A game update and a family message can both make a red dot appear.',
      },
      {
        kind: 'text',
        text: "**Review one app's alerts**. Ask which notifications need your attention soon, which can wait for a chosen check time, and which you never use. Change one setting, then notice whether it helps you stay with your current task.",
      },
      {
        kind: 'choice',
        prompt: 'A red notification badge catches your eye during work. What could you do?',
        options: [
          { label: 'Hide badges for the work period', feedback: 'Without the red numbers in view, you may find it easier to stay with the task.' },
          { label: 'Check each badge as it appears', feedback: 'Each check can pull you away from the step you were doing.' },
        ],
      },
      {
        kind: 'do',
        text: 'If alerts leave you on edge, ask which ones **you actually need**. Quieting one optional alert is enough to test the difference.',
      },
    ],
    source: 'Notification interruption cost is incurred at the decision point, not only at the switch.',
  },
  {
    id: 'focus.words',
    title: 'Lyrics make reading and writing harder',
    blocks: [
      {
        kind: 'text',
        text: "Reading and writing need your attention on words. Song lyrics and nearby conversation also contain words, so they can make a language task harder. **Try quieter sound for one task** and see whether it helps you think.",
      },
      {
        kind: 'text',
        text: 'Music without words may be easier to work with for some people. **Try different sound levels** and notice which helps with this task.',
      },
      {
        kind: 'text',
        text: 'A nearby conversation may catch your attention because you understand the words. **Sound without words may distract you less.**',
      },
      {
        kind: 'text',
        text: 'Reading and writing require you to track words. Nearby speech or song lyrics can compete for that attention, especially when the task is new or complex. **Match the sound to the task**, rather than assuming one background works for everything.',
      },
      {
        kind: 'choice',
        prompt: 'You are struggling to draft a message while a song with lyrics plays. What is a useful test?',
        options: [
          { label: 'Try a short stretch with quieter sound', feedback: 'See whether it is easier to find the words for your message with the song turned down.' },
          { label: 'Keep the song because music always helps', feedback: 'Music can help with some tasks. Try lowering it briefly to learn whether it is making this writing task harder.' },
        ],
      },
      {
        kind: 'do',
        text: 'If writing feels difficult, **try a few minutes without lyrics** and notice whether the words come more easily.',
      },
    ],
    source: 'Irrelevant speech effect: verbal material interferes selectively with verbal tasks.',
  },
  {
    id: 'focus.place',
    title: 'Give the work one place of its own',
    blocks: [
      {
        kind: 'text',
        text: "A place you use for the same task can remind you what to do there. **You can make a simple work spot** with one chair, desk corner, or notebook. You do not need a separate room.",
      },
      {
        kind: 'text',
        text: 'It does not need to be a room of its own, because **a chair you only use for this** is enough to build the association.',
      },
      {
        kind: 'text',
        text: 'Using the same place for work may make starting feel more familiar. **Try it for several work periods** and notice whether it becomes easier to begin.',
      },
      {
        kind: 'text',
        text: 'A place can remind you to start when you use it for the same task again and again. **Repetition builds that reminder**; you do not need a new desk or a perfect room.',
      },
      {
        kind: 'text',
        text: '**If space is limited**, use a smaller signal: one seat, a particular lamp, or opening a notebook. Begin a short work block after that signal and put it away when finished. Over time, notice whether starting requires less negotiation.',
      },
      {
        kind: 'choice',
        prompt: 'You sit down to work in a distracting spot. What small change helps?',
        options: [
          { label: 'Clear one place for this task', feedback: 'A consistent, prepared spot can make beginning simpler.' },
          { label: 'Wait for a perfect workspace', feedback: 'A workable corner is enough to run the experiment.' },
        ],
      },
      {
        kind: 'do',
        text: 'If starting feels hard, try **using the same simple work spot** next time. A chair or small table is enough.',
      },
    ],
    source: 'Stimulus control applied to work, the same mechanism CBT-I uses on the bed.',
  },
  {
    id: 'focus.stop',
    title: 'Stop while you still know what is next',
    blocks: [
      {
        kind: 'text',
        text: "When you finish working, you may know exactly what should happen next. Tomorrow, that may be harder to remember. **Leave yourself a short note** such as “Add the price example.” Then your next start is clearer.",
      },
      {
        kind: 'text',
        text: 'You can stop after leaving a clue about the next move. **A clear restart point** may spare you some of the work of deciding where to begin.',
      },
      {
        kind: 'text',
        text: 'It works for anything with a thread in it, which is **most of the work worth protecting** a block for.',
      },
      {
        kind: 'text',
        text: "A vague ending makes the next start harder: 'continue project' gives you a new decision to make. **Leave a specific next move** while the task is still fresh in mind.",
      },
      {
        kind: 'text',
        text: "**For example**, write 'Add the price comparison from the notes' at the end of a draft. You can still stop at a sensible point. The point is to preserve your place so tomorrow's first action is clear.",
      },
      {
        kind: 'choice',
        prompt: 'You are ending a work session midtask. What should you leave behind?',
        options: [
          { label: 'A note naming the next action', feedback: 'A clear restart cue makes tomorrow’s first step easier.' },
          { label: 'Nothing; I will remember', feedback: 'A short note protects the context you have right now.' },
        ],
      },
      {
        kind: 'do',
        text: 'When you stop, could you leave yourself **one clue for returning**? A sentence about the next move is enough.',
      },
    ],
    source: 'Unfinished tasks remain more accessible in memory; leaving an obvious next step lowers restart cost.',
  },
  {
    id: 'focus.done',
    title: 'Decide what finished means first',
    blocks: [
      {
        kind: 'text',
        text: "Some tasks can keep growing because you never decide what counts as finished. **Set a finish line before you start.** For example, “Today I will write three headings” tells you when this work period is complete.",
      },
      {
        kind: 'text',
        text: 'Deciding in advance is what makes a block satisfying instead of merely over, and **a sentence is enough**: today this is done when the draft exists.',
      },
      { kind: 'fact', value: '1 line', caption: 'written before you start' },
      {
        kind: 'text',
        text: 'A completion rule should match the time available. **Done for today** might mean a rough outline, not a polished document. Naming that boundary helps you stop without repeatedly asking whether you should do more.',
      },
      {
        kind: 'text',
        text: "**Before starting**, write one observable finish line: 'I have drafted three headings' or 'I have sent the question.' At the end, compare your work with that line. If new work appears, put it on a future list rather than silently moving the finish line.",
      },
      {
        kind: 'choice',
        prompt: 'You keep polishing a task. What question could help you stop?',
        options: [
          { label: 'What would count as complete for this task?', feedback: 'A finish line helps you decide when more work adds little value.' },
          { label: 'How can I make this perfect?', feedback: 'Perfection gives you no clear stopping point.' },
        ],
      },
      {
        kind: 'do',
        text: 'If a task has no visible end, ask **what would count as enough** for the time and energy you have.',
      },
    ],
    source: 'Goal specificity: defined completion criteria improve both performance and post-task disengagement.',
  },
] as const satisfies readonly LessonDefinition[];
