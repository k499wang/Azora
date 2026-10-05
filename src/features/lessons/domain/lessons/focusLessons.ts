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
    title: 'You can start before you feel ready',
    step: 'Name a two-minute first step for a task you are avoiding.',
    blocks: [
      {
        kind: 'text',
        text: 'When a task feels large, you may keep putting it off because you do not feel ready. A small start can help you find your way into it. **You can begin with one easy action** and decide about the rest afterward.',
      },
      { kind: 'fact', value: '2 min', caption: 'is all a first step needs to take' },
      {
        kind: 'text',
        text: 'A big task feels heavy because you picture all of it at once. Choosing **a first step that takes about two minutes** gives you something more manageable to try. Starting may help you see what comes next, even if the whole task still feels difficult.',
      },
      {
        kind: 'text',
        text: 'Say you have a report to write. Instead of “write the report,” your first step is **open the file and type one rough heading**. This gives you a small beginning rather than a promise to finish the whole report. The question changes from “Can I finish this?” to “Can I do this one thing?”',
      },
      {
        kind: 'text',
        text: 'To try this, **pick the smallest first step** you can do in two minutes. Do it now. After two minutes, decide: keep going, stop, or pick a time to come back. **Starting does not lock you into finishing today.**',
      },
      {
        kind: 'choice',
        prompt: 'A report feels too big to start. What first step works best?',
        options: [
          { label: 'Open the file and write one rough heading', feedback: 'Yes. It takes two minutes and gets you moving. Once you start, the next step usually feels much easier.' },
          { label: 'Wait until I feel ready to finish it', feedback: 'The ready feeling usually shows up after you start, not before. A tiny first step gets you there faster.' },
        ],
      },
      { kind: 'sequence', prompt: 'Put the steps for starting a big task in order.', steps: [
        'Open the report file.',
        'Write one rough heading.',
        'After two minutes, decide whether to keep going.',
      ], feedback: 'That is it. A tiny start gets you moving, and you only decide about the rest once you are already going.' },
      {
        kind: 'do',
        text: 'Think of one task you have been putting off. **Name a first step you can do in two minutes**, then do it.',
      },
    ],
    source: 'Behavioural activation — action precedes motivation; the two-minute entry rule is the applied form.',
  },
  {
    id: 'focus.switch',
    title: 'Leave a note before you get pulled away',
    step: 'Before you switch tasks, write down your very next step.',
    blocks: [
      {
        kind: 'text',
        text: 'When something interrupts your work, returning can take longer than you expected. You have to remember where you stopped before you can continue. **Leaving a short note about your next step** can make that return easier.',
      },
      { kind: 'fact', value: '1 note', caption: 'is all it takes to find your place again' },
      {
        kind: 'text',
        text: 'When you get pulled away, you lose your place in your head. **Coming back means rebuilding it**: where were you, what were you doing, what came next? That takes time and energy.',
      },
      {
        kind: 'text',
        text: 'Say you are writing a tricky email and a message pops up. After answering it, you reread your whole draft just to remember your point. **A short note saves you that work**, like “Next, explain the second option.”',
      },
      {
        kind: 'text',
        text: 'Before you switch, **write your very next step** in a few words. When you come back, read the note and start right there. For messages that can wait, **pick a time to check them** instead.',
      },
      {
        kind: 'choice',
        prompt: 'A message interrupts your work. How can you make coming back easier?',
        options: [
          { label: 'Write down my next step before replying', feedback: 'Yes. A short note tells you exactly where to restart, so you skip the rebuilding.' },
          { label: 'Trust I will remember everything', feedback: 'Even a short break can wipe your place. A quick note takes seconds and saves you the hunt later.' },
        ],
      },
      { kind: 'sequence', prompt: 'An important message interrupts your draft. Put the steps in order.', steps: [
        'Write a short note naming your next step.',
        'Answer the important message.',
        'Read your note and start again from that step.',
      ], feedback: 'Exactly. The note does the remembering for you, so you can jump straight back in.' },
      {
        kind: 'do',
        text: 'Next time something interrupts you, **write your next step down** before you switch.',
      },
    ],
    source: 'Mark et al., time to resume an interrupted task.',
  },
  {
    id: 'focus.phone',
    title: 'Put your phone in another room',
    step: 'Put your phone in another room during your next task.',
    blocks: [
      {
        kind: 'text',
        text: 'If you keep checking your phone while doing a task, having it nearby may be part of the problem. **Putting it in another room** removes one reminder to check, so you can give the task more of your attention.',
      },
      {
        kind: 'text',
        text: '**A phone in sight pulls at your attention, even when it is silent.** Part of your mind keeps wondering what is on it. Every time you feel the urge to check, you have to say no again.',
      },
      {
        kind: 'text',
        text: 'Saying no over and over wears you out. **Moving the phone lets you decide once**, instead of a hundred times. Out of sight, there is nothing to remind you to check.',
      },
      {
        kind: 'text',
        text: 'Say you sit down to study with your phone face down by your hand. You glance at it, pick it up, put it down. Now picture the same hour with the phone in the kitchen. With the phone out of reach, **there are fewer easy opportunities to check it** while you work.',
      },
      {
        kind: 'text',
        text: '**Before your next task, put the phone in another room** or a drawer. If you need to hear important calls, turn the ringer up. When the task ends, check it and notice the difference.',
      },
      {
        kind: 'choice',
        prompt: 'You keep checking your phone during a task. What setup helps most?',
        options: [
          { label: 'Put it in another room for this task', feedback: 'Yes. Distance takes away the reminder and the temptation, so you only have to decide once.' },
          { label: 'Keep it nearby and use willpower', feedback: 'Willpower gets tired fast. Changing where the phone is works better than saying no over and over.' },
        ],
      },
      {
        kind: 'do',
        text: 'For your next task, **put your phone in another room**. Keep the ringer on if you need important calls.',
      },
    ],
    source: 'Mere-presence effects on available attention; precommitment beats repeated in-the-moment self-control.',
  },
  {
    id: 'focus.blocks',
    title: 'Protect thirty minutes, not the whole day',
    step: 'Protect one thirty-minute stretch for one task today.',
    blocks: [
      {
        kind: 'text',
        text: 'A busy day may not leave you enough time to finish a large task. You can still make room for part of it by choosing **a short period for one specific action**. A clear beginning and ending make that time easier to use.',
      },
      { kind: 'fact', value: '30 min', caption: 'for one task, at a time you choose' },
      {
        kind: 'text',
        text: '**A focus block is a set chunk of time for one task.** It has a clear start and a clear end. Knowing when you get to stop makes it much easier to start.',
      },
      {
        kind: 'text',
        text: 'Say your day is packed. Instead of “work on the report all day,” you choose: **from 2:00 to 2:30, outline section one.** Now you know exactly what to do and when you are done. If thirty minutes is too much today, twenty works too.',
      },
      {
        kind: 'text',
        text: 'To try this, **pick one clear task and a start and stop time.** Silence what you can. If something interrupts you, note where you stopped and come back. **A block you actually keep beats a perfect schedule.**',
      },
      {
        kind: 'choice',
        prompt: 'Your day is packed. How much focus time should you protect?',
        options: [
          { label: 'One thirty-minute block I can keep', feedback: 'Yes. One short block is easy to find and easy to protect, and it moves your task forward.' },
          { label: 'The whole day or nothing', feedback: 'All-or-nothing usually ends in nothing. One short block you can actually keep gets real work done.' },
        ],
      },
      {
        kind: 'do',
        text: 'Today, **pick one thirty-minute block** and one task to do in it. Shorter is fine if your day is full.',
      },
    ],
    source: 'Timeboxing: bounded intervals outperform open-ended intent, largely by making protection feasible.',
  },
  {
    id: 'focus.three',
    title: 'Write down three things, not thirty',
    step: 'Pick the three things that matter today and park the rest.',
    blocks: [
      {
        kind: 'text',
        text: 'A long to-do list can help you remember things, but looking at every item at once can make choosing difficult. **Pick a few things for today** so you can see what needs your attention now and leave the other items safely on the longer list.',
      },
      { kind: 'fact', value: '3', caption: 'things to pick for today' },
      {
        kind: 'text',
        text: 'It helps to use **one list for remembering everything and a shorter list for today**. Keep your big list so nothing gets lost. Then each morning, pick a few things from it to actually do today.',
      },
      {
        kind: 'text',
        text: 'Say your list has thirty items: emails, chores, calls and big projects. Looking at all of them makes you freeze. Instead, you write three: **send the draft to Sam, buy groceries, call the bank.** Now you know what to do next.',
      },
      {
        kind: 'text',
        text: 'To try this, **Write each task as an action you can picture doing**, like “email Sam the draft,” not “deal with project.” If three feels like too many today, pick one. You can always add another later.',
      },
      {
        kind: 'choice',
        prompt: 'Your to-do list has thirty items. What should you write down for today?',
        options: [
          { label: 'Three tasks I can actually start', feedback: 'Yes. A short list makes it easy to pick where to begin, and you get the win of finishing it.' },
          { label: 'Copy every item into a new list', feedback: 'A new long list has the same problem as the old one. Pick three, and leave the rest on your big list.' },
        ],
      },
      {
        kind: 'do',
        text: 'Today, **pick three things that matter** and write them down. Leave the rest on your big list for another day.',
      },
    ],
    source: 'Goal specificity and attainability: short closed lists produce completion; long open lists produce avoidance.',
  },
  {
    id: 'focus.hard',
    title: 'The hardest task does not have to go first',
    step: 'Take one small first step on a task you have been avoiding.',
    blocks: [
      {
        kind: 'text',
        text: 'You may have heard that you should do the hardest task first. That can work, but some people find a small starting step more helpful. **Choose an order that helps you begin the difficult task**, rather than postponing it for the whole day.',
      },
      {
        kind: 'text',
        text: '**The right order is the one that gets you started.** For some people, that means the hard task first thing. For others, it means a small warm-up step first.',
      },
      {
        kind: 'text',
        text: 'Say you have a big presentation to make, and you keep avoiding it all morning. Instead, **open the slides and list three main points.** That is not avoiding the task. That is the first step of it.',
      },
      {
        kind: 'text',
        text: 'Look at what usually happens for you. If you start the hard task when it goes first, keep doing that. If you dodge it all morning, **start with a small setup step**, then give the hard part a set time later.',
      },
      {
        kind: 'text',
        text: 'If you notice that easier tasks keep filling the day, the difficult task may need a more definite place. If that happens, **book a clear time for the hard task** and protect it like an appointment.',
      },
      {
        kind: 'choice',
        prompt: 'A hard task feels too big to start. Which first move helps?',
        options: [
          { label: 'Choose an easy first step', feedback: 'Yes. A small step, like opening the slides and listing three points, gets you moving on the real task.' },
          { label: 'Wait until the whole task feels easy', feedback: 'It may never feel easy before you start. A small first step is what makes the rest feel doable.' },
        ],
      },
      {
        kind: 'do',
        text: 'Pick a task you have been avoiding. **Do one small first step today**, or book a set time to start it.',
      },
    ],
    source: 'Task ordering under diminishing self-regulatory capacity; avoidance also imposes a standing attentional cost.',
  },
  {
    id: 'focus.inbox',
    title: 'Your inbox is someone else’s to-do list',
    step: 'Before opening your inbox, give a little time to your own task.',
    blocks: [
      {
        kind: 'text',
        text: 'You may open your email for a quick check and spend the morning answering requests. Meanwhile, the task you planned stays untouched. When your responsibilities allow it, **start with a few minutes on that task** before checking messages that can wait.',
      },
      { kind: 'fact', value: '1 task', caption: 'of your own, picked before you check email' },
      {
        kind: 'text',
        text: 'Emails arrive on someone else’s schedule. **Some need a fast reply. Many can wait.** If you let each new message decide what you do, your own plans never get a turn.',
      },
      {
        kind: 'text',
        text: 'Say you planned to finish a proposal this morning. You open email “just for a second.” An hour later, you have answered ten messages and the proposal is untouched. **A few minutes on the proposal first gets the important thing moving.**',
      },
      {
        kind: 'text',
        text: '**Before you open your inbox, write down one task you picked** and its first step. Spend a little time on it. If your job needs fast replies, keep alerts on for urgent messages only, and **check the rest at set times**.',
      },
      {
        kind: 'choice',
        prompt: 'You open email and lose your whole planned morning. What could you try?',
        options: [
          { label: 'Do one chosen task before checking', feedback: 'Yes. Starting with your own task protects time for what matters to you before other requests pile in.' },
          { label: 'Let each new message pick my task', feedback: 'New messages follow other people’s timing, not your priorities. Give your own task a turn first.' },
        ],
      },
      {
        kind: 'do',
        text: 'Tomorrow, **spend a few minutes on your own task** before you open your inbox.',
      },
    ],
    source: 'Reactive vs proactive work: email-first mornings shift the day to externally set priorities.',
  },
  {
    id: 'focus.badges',
    title: 'Every red dot asks you a question',
    step: 'Turn off one alert you do not need and notice the difference.',
    blocks: [
      {
        kind: 'text',
        text: 'A red number on an app can catch your eye while you are trying to do something else. You may open it just to find out what is new. **Turning off a badge you do not need** removes one reason to check during your task.',
      },
      {
        kind: 'text',
        text: 'A badge is the red dot or number on an app icon. **Each one asks, “Check me?”** Even if you say no, answering that question pulls you off your task for a moment.',
      },
      {
        kind: 'text',
        text: 'A badge tells you something new is there. **It does not tell you if it matters.** A game update and a message from your mom get the same red dot. So you end up checking just to find out.',
      },
      {
        kind: 'text',
        text: 'Say you are writing and you see a red 3 on your email app. You stop and wonder what it is. Then you check. Then you reply. **One small dot just cost you your train of thought.**',
      },
      {
        kind: 'text',
        text: 'To try this, **pick one app whose badge keeps grabbing you.** Ask yourself: do I need this alert right away, at a set time, or never? Turn off what you do not need. Then notice how it feels to stay on task.',
      },
      {
        kind: 'choice',
        prompt: 'A red badge catches your eye while you work. What could you do?',
        options: [
          { label: 'Hide badges while I work', feedback: 'Yes. With no red numbers in view, nothing is asking for your attention, so you can stay with your task.' },
          { label: 'Check each badge as it appears', feedback: 'Each check pulls you away from what you were doing. Most can wait until you choose to look.' },
        ],
      },
      {
        kind: 'do',
        text: 'Today, **turn off one alert you do not need**. Notice how it feels to work without it.',
      },
    ],
    source: 'Notification interruption cost is incurred at the decision point, not only at the switch.',
  },
  {
    id: 'focus.words',
    title: 'Lyrics make reading and writing harder',
    step: 'Try writing for a few minutes without lyrics playing.',
    blocks: [
      {
        kind: 'text',
        text: 'If you keep losing your place while reading or writing, notice what you can hear around you. Song lyrics and nearby conversations may be drawing your attention. **Try a few minutes without those words** and see whether following your own sentences becomes easier.',
      },
      {
        kind: 'text',
        text: '**Reading and writing run on words.** Lyrics and nearby talking are words too. Your brain cannot help listening to them, so they quietly pull on the attention you need for your own sentences.',
      },
      {
        kind: 'text',
        text: 'Say you are writing a message while a favorite song plays. You keep losing your place or rereading the same line. **Switch to music without words**, or turn it off, and feel how much smoother the writing goes.',
      },
      {
        kind: 'text',
        text: 'This is about matching the sound to the task. Music with lyrics can be great for folding laundry or cleaning. **For reading and writing, pick quiet or wordless sound.** Keep whatever setup makes the words flow.',
      },
      {
        kind: 'choice',
        prompt: 'You are struggling to write a message while a song with lyrics plays. What should you try?',
        options: [
          { label: 'Try a few minutes with no lyrics', feedback: 'Yes. Without words in the music, your brain can give its full attention to the words you are writing.' },
          { label: 'Keep the song because music always helps', feedback: 'Music helps with lots of tasks, but lyrics compete with writing. Try a few minutes without them and compare.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time you read or write, **try a few minutes without lyrics** and notice how the words come.',
      },
    ],
    source: 'Irrelevant speech effect: verbal material interferes selectively with verbal tasks.',
  },
  {
    id: 'focus.place',
    title: 'Give your work one spot of its own',
    step: 'Start your next task in the same simple work spot.',
    blocks: [
      {
        kind: 'text',
        text: 'Getting started can be easier when you have a familiar place to begin. **Using the same simple spot for work** can become a reminder of what you are there to do. It might be a chair or part of a table, rather than a separate room.',
      },
      {
        kind: 'text',
        text: '**Your brain links places with what you do there.** That is why the couch feels like rest. A work spot builds the same kind of link, but for focus.',
      },
      {
        kind: 'text',
        text: 'It does not need to be fancy. **One chair, one corner of a table or one notebook can do it.** You do not need a separate room or a perfect desk.',
      },
      {
        kind: 'text',
        text: 'Say you share a small apartment. Every time you work, you sit in the same chair by the window and open the same notebook. **Over time, starting feels easier**, because the spot already means “work.”',
      },
      {
        kind: 'text',
        text: 'To try this, **pick your spot and use it for the same kind of task.** Start work right after you sit down. When you finish, get up or put the notebook away. Keep the spot for work as much as you can.',
      },
      {
        kind: 'choice',
        prompt: 'You sit down to work in a distracting spot. What small change helps?',
        options: [
          { label: 'Clear one place just for this task', feedback: 'Yes. A spot you keep for work makes starting simpler each time you sit down there.' },
          { label: 'Wait for a perfect workspace', feedback: 'You do not need a perfect desk. One cleared corner is enough to start building the habit.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time you work, **use the same simple spot**. One chair or a corner of a table is enough.',
      },
    ],
    source: 'Stimulus control applied to work, the same mechanism CBT-I uses on the bed.',
  },
  {
    id: 'focus.stop',
    title: 'Stop while you still know what is next',
    step: 'When you stop working, leave a one-line note on your next move.',
    blocks: [
      {
        kind: 'text',
        text: 'When you return to unfinished work, you may spend time remembering where you left off. Before stopping today, **leave one sentence about what to do next**. Tomorrow, that note gives you a place to begin without reconstructing every detail.',
      },
      {
        kind: 'text',
        text: 'When you stop, you know exactly what comes next. By tomorrow, that is gone. **A restart note is one line that tells future you what to do first.**',
      },
      {
        kind: 'text',
        text: 'Say you are halfway through a report. Before closing the laptop, you type, **“Next: add the price example under heading two.”** Tomorrow, you open the file, read the line and get straight to work. The note tells you where to begin.',
      },
      {
        kind: 'text',
        text: 'Make the note specific. “Keep working on the project” leaves you to figure it all out again. **Name a place and an action**, like “Email Sam the second draft.”',
      },
      {
        kind: 'text',
        text: '**Before you stop, write your very next step** in one line. Put it where you will see it first: the top of the file, a sticky note or your notes app. Then stop at a natural break.',
      },
      {
        kind: 'choice',
        prompt: 'You are ending a work session in the middle of a task. What should you leave behind?',
        options: [
          { label: 'A note naming the next step', feedback: 'Yes. A clear note makes tomorrow’s start quick, because you do not have to rebuild where you were.' },
          { label: 'Nothing, I will remember', feedback: 'You know it now, but it fades fast. One line today saves you a slow start tomorrow.' },
        ],
      },
      {
        kind: 'do',
        text: 'When you stop today, **leave yourself one line about your next step**. Put it where you will see it first.',
      },
    ],
    source: 'Unfinished tasks remain more accessible in memory; leaving an obvious next step lowers restart cost.',
  },
  {
    id: 'focus.done',
    title: 'Decide what finished means before you start',
    step: 'Before starting a task, write one line saying what counts as done.',
    blocks: [
      {
        kind: 'text',
        text: 'Some tasks keep offering more things to improve, so it can be difficult to tell when you have done enough for today. **Choose a clear stopping point before you begin**. That gives this part of the work an ending, even if the larger project continues.',
      },
      {
        kind: 'text',
        text: 'Some tasks can grow forever: one more tweak, one more fix. **A finish line is one sentence that says what done looks like**, like “Today I will write three headings.”',
      },
      { kind: 'fact', value: '1 line', caption: 'written before you start, saying what done looks like' },
      {
        kind: 'text',
        text: 'Say you have twenty minutes to work on a report. **Done for today means a rough outline**, not a polished final draft. When the outline is there, you stop. If a new idea pops up, put it on a list for later.',
      },
      {
        kind: 'text',
        text: '**Before you start, write your finish line**: something you can see, like “sent the question” or “drafted three headings.” When you reach it, you are done. Then you can stop, or **choose a new finish line on purpose**.',
      },
      {
        kind: 'choice',
        prompt: 'You keep polishing a task. What question helps you stop?',
        options: [
          { label: 'What would count as done for this task?', feedback: 'Yes. Knowing what done looks like lets you stop with confidence instead of tweaking forever.' },
          { label: 'How can I make this perfect?', feedback: 'Perfect has no finish line, so you never get to stop. Pick a clear, doable version of done instead.' },
        ],
      },
      {
        kind: 'do',
        text: 'Before your next task, **write one line saying what done looks like**. Stop when you get there.',
      },
    ],
    source: 'Goal specificity: defined completion criteria improve both performance and post-task disengagement.',
  },
  {
    id: 'focus.nextstep',
    title: 'Say exactly what comes next',
    step: 'Write one exact next action for a task you need to do.',
    blocks: [
      {
        kind: 'text',
        text: 'A task such as finish the paperwork does not tell you where to start. **Name one action you can see yourself doing.** It could be finding a form, opening an email, or checking one date. You do not need to decide every later step before you can name this one.',
      },
      {
        kind: 'text',
        text: 'Look at what you already have. **Choose the next missing step.** If you have the form but need an address, finding the address comes before filling it in. If you do not know which form to use, asking that question comes before searching through all your documents.',
      },
      {
        kind: 'choice',
        prompt: 'You need to book an appointment but do not know the opening hours. What could you do first?',
        options: [
          {
            label: 'Find the opening hours',
            feedback: 'That gives you the information needed to choose when to call. Booking the appointment can be the next action after that.',
          },
          {
            label: 'Call now and check whether anyone answers',
            feedback: 'This can also work if you have time to call. If nobody answers, look for the hours before trying again.',
          },
        ],
      },
      {
        kind: 'sequence',
        prompt: 'Put these steps in the order you would do them.',
        steps: [
          'Name the task you need to do.',
          'Find the first step that has not been done.',
          'Write the action and how you will know it is finished.',
        ],
        feedback: 'Start by checking the situation. Then choose one clear action and follow the details you have checked.',
      },
      {
        kind: 'text',
        text: 'Your next action should have a clear end. **Write what done means.** Compare two prices is clearer than sort out shopping. When you have compared them, you can stop and choose another action. A clear action also helps you explain what you need if someone offers to help.',
      },
      {
        kind: 'do',
        text: 'Pick one task. **Write its exact next action**, including what you need to open, find, ask, or check. Make the action clear enough to follow later.',
      },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'focus.parkthought',
    title: 'Write the thought down for later',
    step: 'Write down one unrelated thought before returning to your task.',
    blocks: [
      {
        kind: 'text',
        text: 'You are reading a document and remember that you need milk. You want to remember the milk, but you also want to finish reading. **Write a short note.** The note holds the reminder while you return to the document. It does not have to become a new task right now.',
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Reminder',
            text: 'Write the reminder in a place you can find.',
          },
          {
            term: 'Timing',
            text: 'Check whether it needs attention now.',
          },
          {
            term: 'Return',
            text: 'If it can wait, return to the step you were doing.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Keep the note simple. **Write enough to understand it later.** Buy milk is enough. A long shopping list can wait until shopping is the task you chose. If the thought needs a decision, write the question. For example, ask whether the appointment time needs to change.',
      },
      {
        kind: 'choice',
        prompt: 'You remember a bill while reading. It is due next week. What could you do?',
        options: [
          {
            label: 'Write a reminder and keep reading',
            feedback: 'This keeps the reminder available. Choose a time to check the bill so that the note leads to a real decision later.',
          },
          {
            label: 'Pay it now and return afterward',
            feedback: 'That may suit your time today. Before switching, note where you stopped so you can return to the reading without guessing.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Some thoughts need attention now. A safety concern or a time sensitive problem may be a reason to stop. **Check whether it can wait.** If it can, choose a time to look at your note. Then find the sentence or step you were on and continue from there.',
      },
      {
        kind: 'do',
        text: 'During your next task, **write down one unrelated reminder** that can wait. Then return to the sentence or action where you stopped.',
      },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/',
  },
  {
    id: 'focus.readback',
    title: 'Explain the part you just read',
    step: 'Summarize one short section you read in your own words.',
    blocks: [
      {
        kind: 'text',
        text: 'Reading every word does not always mean you understand the message. **Pause after one short section.** Say what it means using words you would use in a conversation. This is a way to check your understanding. You are not trying to repeat the writing exactly or make a perfect summary.',
      },
      {
        kind: 'text',
        text: 'For an instruction, ask what you need to do. **Name the action and any limit.** A notice might say to return a form by Friday. Your summary could be send the form before Friday. If the notice gives a delivery address, include where it needs to go.',
      },
      {
        kind: 'choice',
        prompt: 'You read a message about a changed meeting time. How could you check you understood it?',
        options: [
          {
            label: 'Say the new time and place in my own words',
            feedback: 'This checks the details you will need to act on. Look back at the message to confirm the time and place before relying on your summary.',
          },
          {
            label: 'Read the whole message again',
            feedback: 'Another read can help. Afterward, try saying what changed. That lets you notice whether a particular detail is still unclear.',
          },
        ],
      },
      {
        kind: 'reveal',
        prompt: 'Check these questions before choosing what to do.',
        items: [
          {
            label: 'What is this section about?',
            detail: 'A letter says the meeting moved to Tuesday. Your summary should say which meeting changed and its new day.',
          },
          {
            label: 'What do I need to do, if anything?',
            detail: 'If the letter asks you to confirm attendance, your next action is to reply. If it only gives information, a reply may not be needed.',
          },
          {
            label: 'Which detail do I need to check again?',
            detail: 'Check the time, location, and reply instructions in the letter. A summary should not replace checking details that matter.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'If you cannot explain the section, look at it again. **Find the unclear part.** It might be a word you do not know or a sentence with two possible meanings. Read the nearby sentence for context. If you still need an answer, ask someone who can explain that specific part.',
      },
      {
        kind: 'do',
        text: 'Choose one short section you need to read. **Explain it in your own words**, then look back to check any detail you will use.',
      },
    ],
    source: 'Author-created everyday practice suggestion, not a claim of proven clinical benefit. Related framework for choosing specific practical actions: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'focus.homelaundry',
    title: 'Choose one laundry job at a time',
    step: 'Choose one load to wash or one clean pile to put away.',
    blocks: [
      {
        kind: 'text',
        text: 'Laundry includes several different jobs. Dirty clothes need washing. Wet clothes need drying. Clean clothes need putting away. **Choose one of these jobs first.** Looking at every pile together can make it harder to decide what to do. You can choose one pile without planning the whole room.',
      },
      {
        kind: 'sequence',
        prompt: 'Put these steps in the order you would do them.',
        steps: [
          'Dirty clothes: choose a suitable load to wash.',
          'Wet clothes: follow the care instructions for drying.',
          'Dry clean clothes: put one pile where it belongs.',
        ],
        feedback: 'Start by checking the situation. Then choose one clear action and follow the details you have checked.',
      },
      {
        kind: 'text',
        text: 'If you choose washing, check the care labels and the machine instructions. **Pick clothes that can be washed together.** Do not add a clean pile just because it is nearby. Use the amount of detergent stated on its label. If you are unsure about an item, leave it out while you check.',
      },
      {
        kind: 'choice',
        prompt: 'You have dirty towels and clean shirts on a chair. Which job could you choose?',
        options: [
          {
            label: 'Wash a suitable load of towels',
            feedback: 'Check the care labels first. This is a washing job. The clean shirts can stay separate until you choose to put them away.',
          },
          {
            label: 'Put the clean shirts away',
            feedback: 'This is a putting away job. You can finish it without starting the washing machine or sorting every dirty item today.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'If you choose putting away, start with clothes that are already dry. **Choose one clear place for them.** You might put socks in a drawer or hang shirts in a cupboard. You do not need to reorganize the cupboard first. Clear only the space needed to put this pile away.',
      },
      {
        kind: 'do',
        text: 'Look at your laundry. **Choose one suitable load to wash or one dry pile to put away.** Do that job before choosing another.',
      },
    ],
    source: 'Author-created everyday practice suggestion, not a claim of proven clinical benefit. Related framework for choosing specific practical actions: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'focus.homedishes',
    title: 'Make space to use the sink',
    step: 'Choose one safe dishwashing step that makes your sink easier to use.',
    blocks: [
      {
        kind: 'text',
        text: 'A full sink can include plates, food scraps, glasses, and sharp items. **Look before reaching into it.** You need to know what is there before you move things. If you cannot see the bottom, avoid putting your hand into the water. Find a safe way to see and separate the items first.',
      },
      {
        kind: 'text',
        text: 'You do not have to wash every dish in one go. **Choose one useful step.** You might move suitable plates to the dishwasher or wash the cups needed for breakfast. Follow the dishwasher instructions when using it. Keep knives where you can see them and handle each one carefully.',
      },
      {
        kind: 'choice',
        prompt: 'The sink is full and you need a clean cup. What could you do?',
        options: [
          {
            label: 'Find a cup safely and wash it',
            feedback: 'This meets the immediate need. Check what is around it before moving it, then use a clear place to dry the clean cup.',
          },
          {
            label: 'Clear a safe space beside the sink first',
            feedback: 'This can help if there is nowhere to put clean items. Keep the step small and keep sharp or fragile items visible.',
          },
        ],
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Safety',
            text: 'Look for sharp or broken items before handling dishes.',
          },
          {
            term: 'Dishes',
            text: 'Choose one group you can handle safely.',
          },
          {
            term: 'Drying',
            text: 'Put washed items in a clear stable drying space.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Decide where the clean items will go before washing them. **Use a clear drying space.** A few clean dishes need somewhere safe to drain or dry. Leave heavy or fragile items stable. If there is broken glass, stop the ordinary washing job and arrange safe cleanup with suitable protection.',
      },
      {
        kind: 'do',
        text: 'Check your sink before touching the dishes. **Choose one safe step**, such as washing two cups or moving suitable plates to the dishwasher.',
      },
    ],
    source: 'Author-created everyday practice suggestion, not a claim of proven clinical benefit. Related framework for choosing specific practical actions: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'focus.homeshared',
    title: 'Agree on who does the job',
    step: 'Ask someone you live with to agree on one specific home task.',
    blocks: [
      {
        kind: 'text',
        text: 'People who share a home may have different ideas about what needs doing. One person may expect dishes to be washed each night. Another may think morning is fine. **Say which job you mean.** A clear request gives you something to discuss without guessing what the other person expects.',
      },
      {
        kind: 'reveal',
        prompt: 'Check these questions before choosing what to do.',
        items: [
          {
            label: 'Name the task you want to discuss.',
            detail: 'Choose one job, such as washing the dinner plates. Avoid asking someone to fix every unfinished job in the home at once.',
          },
          {
            label: 'Ask what each person can do and when.',
            detail: 'One person might wash plates while another clears the table. Ask whether they have time tonight before assuming this division will work.',
          },
          {
            label: 'Agree on who handles each part of this task.',
            detail: 'Agree whether washing includes drying and putting away. These details help both people know what they have agreed to do.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Include the part of the job that matters. **Agree on what finished means.** Take out the rubbish could include replacing the bag. Washing clothes might not include putting them away unless you agree on it. Ask what the other person can reasonably do before deciding who will handle each part.',
      },
      {
        kind: 'choice',
        prompt: 'You want help with dishes tonight. What could you ask?',
        options: [
          {
            label: 'Can you wash the plates after dinner while I clear the table?',
            feedback: 'This names two tasks and a time. The other person can say whether that works or suggest a different division of the work.',
          },
          {
            label: 'Which part of cleaning up can you do tonight?',
            feedback: 'This lets the other person offer a task they can manage. Then agree on the details so neither of you has to guess.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'A fair agreement depends on time, ability, and other responsibilities. **Listen to the answer.** Someone may be able to do the job later or need help with part of it. Decide together whether the timing works. If you cannot agree now, choose a time to discuss the specific task again.',
      },
      {
        kind: 'do',
        text: 'Choose one home task you share. **Ask who can do which part and when.** Agree on what the finished job will include.',
      },
    ],
    source: 'Author-created everyday practice suggestion, not a claim of proven clinical benefit. Related framework for choosing specific practical actions: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'focus.phonepurpose',
    title: 'Know why you opened your phone',
    step: 'Name one reason before unlocking your phone.',
    blocks: [
      {
        kind: 'text',
        text: 'You may pick up your phone to check the time and then open several apps. **Name your reason before unlocking it.** You could say check the bus time or reply to Sam. That gives you a clear task to do first. It also gives you a way to decide when that task is finished.',
      },
      {
        kind: 'text',
        text: 'Go to the app that serves your reason. **Finish the task you named.** If you need the bus time, check the route and departure time. You may see other messages while doing this. Decide whether they need attention now or whether you can look at them at another time.',
      },
      {
        kind: 'choice',
        prompt: 'You pick up your phone to set a timer. What could you do after setting it?',
        options: [
          {
            label: 'Put the phone down and start the timed task',
            feedback: 'Your first reason is complete. Putting it down makes it easy to begin the activity you set the timer for.',
          },
          {
            label: 'Choose to check messages before starting',
            feedback: 'That is another task. Decide whether you have time for it and whether the timer should start after you finish checking messages.',
          },
        ],
      },
      {
        kind: 'sequence',
        prompt: 'Put these steps in the order you would do them.',
        steps: [
          'What did I pick up the phone to do?',
          'Which app do I need for that task?',
          'Is that task finished now?',
        ],
        feedback: 'Start by checking the situation. Then choose one clear action and follow the details you have checked.',
      },
      {
        kind: 'text',
        text: 'You can still choose to use your phone for fun. **Make that a separate choice.** After checking the bus, you might decide to watch a video while waiting. Notice that you are choosing another activity. If you need to leave soon, check the time before beginning something that might take longer.',
      },
      {
        kind: 'do',
        text: 'The next time you reach for your phone, **name the reason before unlocking it**. Do that task, then decide whether you need anything else.',
      },
    ],
    source: 'Author-created everyday practice suggestion, not a claim of proven clinical benefit. Related framework for choosing specific practical actions: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'focus.phonemessages',
    title: 'Choose when to check ordinary messages',
    step: 'Choose a time to check nonurgent messages while keeping needed contact available.',
    blocks: [
      {
        kind: 'text',
        text: 'Not every message needs an answer as soon as it arrives. **Separate urgent contact from ordinary replies.** An urgent contact might be someone you care for who needs help. An ordinary reply might be a group chat about weekend plans. Your situation determines which people and messages need quick attention.',
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Necessary contact',
            text: 'Name the people or services that need to reach you.',
          },
          {
            term: 'Ordinary replies',
            text: 'Choose a time for messages that can wait.',
          },
          {
            term: 'Phone settings',
            text: 'Check settings before changing any alerts.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Choose a time to check the ordinary messages. **Use a time that fits your day.** It could be after lunch or when you finish a task. If someone expects a fast reply, discuss the timing with them. Work responsibilities or caring for another person may require you to stay available.',
      },
      {
        kind: 'choice',
        prompt: 'You need to work but must remain available to a family member. What could you choose?',
        options: [
          {
            label: 'Keep their contact available and check group chats later',
            feedback: 'Check the phone settings and your agreement with the person. This separates the contact you need from messages that can reasonably wait.',
          },
          {
            label: 'Keep all alerts on during this task',
            feedback: 'This may fit your needs today. You can still decide which ordinary messages to answer now and which to check after the task.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Before changing alerts, check what your phone settings will allow through. **Keep necessary contact available.** You may need calls from certain people or alerts from a service you rely on. If you are unsure how a setting works, check the instructions. Do not assume that every important call will still ring.',
      },
      {
        kind: 'do',
        text: '**Choose one time to check nonurgent messages.** Keep the calls or messages you need available, and check settings before changing alerts.',
      },
    ],
    source: 'Author-created everyday practice suggestion, not a claim of proven clinical benefit. Related framework for choosing specific practical actions: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'focus.phonebed',
    title: 'Choose a place for your phone',
    step: 'Choose a phone spot that supports needed contact without browsing in bed.',
    blocks: [
      {
        kind: 'text',
        text: 'You may need your phone near your bed for an alarm or an important call. **Decide what you need it for tonight.** Needing the alarm does not require opening a feed. A feed is the list of posts or videos that keeps showing more content as you scroll through an app.',
      },
      {
        kind: 'text',
        text: 'Choose a place that suits your needs. **Check the alarm and contact settings first.** You might use a nearby table instead of holding the phone in bed. Keep it accessible if someone depends on reaching you. Place it on a suitable surface and follow the device instructions when charging it.',
      },
      {
        kind: 'choice',
        prompt: 'You need an alarm and may receive an important call. Where could you put your phone?',
        options: [
          {
            label: 'On a nearby table with the needed settings checked',
            feedback: 'This keeps the phone available while giving it a place to stay. Check that you can hear or access it as needed.',
          },
          {
            label: 'Farther away if contact and access still work',
            feedback: 'This could suit you if you can hear the alarm and handle necessary contact. Choose the location based on your needs, not a fixed distance.',
          },
        ],
      },
      {
        kind: 'reveal',
        prompt: 'Check these questions before choosing what to do.',
        items: [
          {
            label: 'Check tomorrow\'s alarm time.',
            detail: 'Open the alarm settings and check the time and day. Check the sound and volume according to your phone instructions.',
          },
          {
            label: 'Check how necessary contact can reach you.',
            detail: 'Check whether the person who may call can reach you with tonight\'s settings. Make sure you can hear or access the phone if needed.',
          },
          {
            label: 'Place the phone where it can stay without browsing in bed.',
            detail: 'A nearby table may suit your needs. Keep the phone on a suitable surface and follow its charging instructions rather than leaving it under bedding.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'If you want to check something before sleep, decide what it is. **Finish that task before lying down.** You might send one message or check tomorrow\'s meeting time. Close the app when that task is finished. If scrolling in bed is a problem for you, try leaving that activity outside the bed.',
      },
      {
        kind: 'do',
        text: 'Tonight, **choose a safe phone spot near enough for your needs**. Check the alarm and necessary contact, then close any feed before getting into bed.',
      },
    ],
    source: 'Author-created everyday practice suggestion, not a claim of proven clinical benefit. Related framework for choosing specific practical actions: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
] as const satisfies readonly LessonDefinition[];
