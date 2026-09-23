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
        text: 'When a task feels enormous, waiting to feel ready can keep you stuck. **Readiness is not required** for a small beginning, and difficulty starting is not a character flaw.',
      },
      { kind: 'fact', value: '2 min', caption: 'of doing it badly, first' },
      {
        kind: 'text',
        text: 'Your mind may show you the whole task at once. **Only the opening moment** needs a decision right now; the rest can wait until you know more.',
      },
      {
        kind: 'do',
        text: 'If there is something you want to begin, ask **what its smallest opening could be**. You get to decide whether today is the day for it.',
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
        text: 'The interruption itself is not the expensive part; **coming back from it** is. Your attention does not resume where it stopped, but some way behind.',
      },
      { kind: 'fact', value: '23 min', caption: 'the most-cited estimate' },
      {
        kind: 'text',
        text: 'That is why an hour with **six interruptions** in it is not fifty-four minutes of work. It is closer to none at all.',
      },
      {
        kind: 'do',
        text: 'If you want a little more room to focus, ask **what interruption you can soften** for the next short stretch.',
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
        text: 'This is not about willpower, it is about distance. **A phone in another room** beats one face-down on the desk, and both of those beat deciding forty times an hour not to look.',
      },
      {
        kind: 'text',
        text: 'The pull to check it is not a character flaw. **Arguing with it** every few minutes is the part that actually tires you out.',
      },
      {
        kind: 'text',
        text: 'So make the decision **once, in advance**, and you do not have to keep winning it all afternoon.',
      },
      {
        kind: 'do',
        text: 'If your phone keeps pulling at you, consider **a little more distance** during the time you chose for something else.',
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
        text: 'A whole day is too big to protect, while **a block of thirty minutes** is not. Almost nobody can defend eight hours, and almost anybody can defend half an hour of one.',
      },
      { kind: 'fact', value: '30 min', caption: 'is a unit you can actually hold' },
      {
        kind: 'text',
        text: 'It also gives the day an edge. Without one, work spreads to fill everything and **nothing is ever finished**, only abandoned at bedtime.',
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
        text: 'A list of thirty is not a plan, it is **an inventory of guilt**. You will not do thirty of them, and reading the list costs you something every time you look at it.',
      },
      { kind: 'fact', value: '3', caption: 'is a day you can finish' },
      {
        kind: 'text',
        text: 'Three is enough to be a real day and few enough to be **finishable**, and finishing is the part that makes tomorrow easier to start.',
      },
      {
        kind: 'do',
        text: 'When your list starts sounding like a verdict, ask which **few things matter today**. The rest can stay on the list without following you around.',
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
        text: 'A hard task can loom over everything else. Your mind may say you have to tackle it first or **the day is already lost**. That is a thought, not a rule.',
      },
      {
        kind: 'text',
        text: 'Sometimes a small, easy start gives you a way in. Sometimes the hard thing needs an earlier slot. **The useful order** is the one that helps you begin.',
      },
      {
        kind: 'text',
        text: 'You can choose the order based on your energy and what matters. **You do not need to earn** the right to start somewhere easier.',
      },
      {
        kind: 'do',
        text: 'If something is looming, ask: **would an easier entry help**, or would an earlier place for it bring relief? Choose what fits.',
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
        text: 'Opening your inbox first means starting the day on **other people’s priorities**, and then calling whatever is left of the day your own work.',
      },
      { kind: 'fact', value: '2 ×', caption: 'a day is enough for most jobs' },
      {
        kind: 'text',
        text: 'Almost nothing in there needed an answer within the hour. **The urgency is inherited**, and it arrives in the format most likely to be believed.',
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
        text: 'A red dot is not really information, it is **a request to look**. Each one is a small decision, made by you, dozens of times a day.',
      },
      {
        kind: 'text',
        text: 'The cost is not the looking. It is **the deciding**, which happens whether or not you give in, and which you never notice doing.',
      },
      {
        kind: 'text',
        text: 'Turning them off is not discipline. It is **removing the question** so it does not have to be answered forty times a day.',
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
        text: 'Music with lyrics and work that uses language are **using the same channel**, which is why the album you love makes writing harder and washing up easier.',
      },
      {
        kind: 'text',
        text: 'Instrumental music does not have that problem, and neither does anything **familiar enough to be furniture**.',
      },
      {
        kind: 'text',
        text: 'The same goes for an office: a conversation nearby costs you more than **noise with no words in it**.',
      },
      {
        kind: 'do',
        text: 'When words feel hard to hold, notice whether sound is helping. **You can change the background** and see what feels easier.',
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
        text: 'Where you sit gradually becomes **part of the cue**. Work in bed and the bed gets harder to sleep in; work at one desk and the desk starts doing some of the starting for you.',
      },
      {
        kind: 'text',
        text: 'It does not need to be a room of its own, because **a chair you only use for this** is enough to build the association.',
      },
      {
        kind: 'text',
        text: 'The effect is small on any given day and **compounds over weeks**, which is why it is worth setting up once.',
      },
      {
        kind: 'do',
        text: 'If starting feels hard, notice whether a familiar place could become **a gentler cue**. It does not need to be a separate room.',
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
        text: 'Stopping at a clean finish feels tidy and makes tomorrow harder, because you come back to **a blank page and a decision**.',
      },
      {
        kind: 'text',
        text: 'Stop mid-sentence instead, with the next move obvious. **The restart is free** then, because there is nothing to work out first.',
      },
      {
        kind: 'text',
        text: 'It works for anything with a thread in it, which is **most of the work worth protecting** a block for.',
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
        text: 'Work with no definition of done does not really end. It **thins out** instead, and you drift off it rather than finishing, with it still sitting in your head.',
      },
      {
        kind: 'text',
        text: 'Deciding in advance is what makes a block satisfying instead of merely over, and **a sentence is enough**: today this is done when the draft exists.',
      },
      { kind: 'fact', value: '1 line', caption: 'written before you start' },
      {
        kind: 'do',
        text: 'If a task has no visible end, ask **what would count as enough** for the time and energy you have.',
      },
    ],
    source: 'Goal specificity: defined completion criteria improve both performance and post-task disengagement.',
  },
] as const satisfies readonly LessonDefinition[];
