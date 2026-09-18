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
    title: 'Motivation follows starting, not the reverse',
    blocks: [
      {
        kind: 'text',
        text: 'Motivation does not arrive before you start; it usually turns up **once you are already in it**. Waiting to feel ready is why the thing stays undone.',
      },
      { kind: 'fact', value: '2 min', caption: 'of doing it badly, first' },
      {
        kind: 'text',
        text: 'So the only decision worth making is **the first two minutes** of it. That is a far smaller thing to decide than the whole task.',
      },
      {
        kind: 'do',
        text: 'Pick the thing you are avoiding and do **two minutes of it badly**. You are allowed to stop after that.',
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
        text: '**One block today.** Thirty minutes, one thing, notifications off. Protect the block, not the whole day.',
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
        text: 'For your next block of work, put it **in another room**. Not silent, not face-down. Away.',
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
        text: 'Put **one thirty-minute block** in today with a name on it. One thing. Not “work”.',
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
        text: 'Before anything else today, **write down three things**. The rest of the list can stay where it is.',
      },
    ],
    source: 'Goal specificity and attainability: short closed lists produce completion; long open lists produce avoidance.',
  },
  {
    id: 'focus.hard',
    title: 'Do the hard thing first',
    blocks: [
      {
        kind: 'text',
        text: 'The hard thing does not get easier at four in the afternoon. **You get worse**, and it is still there, having hung over the whole day in advance.',
      },
      {
        kind: 'text',
        text: 'Most people spend the morning on the easy things **because they are easy**, then meet the hard one with whatever is left over.',
      },
      {
        kind: 'text',
        text: 'Doing it first also gives the rest of the day back, because **nothing is hanging over it** any more.',
      },
      {
        kind: 'do',
        text: 'Name the thing you are dreading and **put it first tomorrow**, before you open your inbox.',
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
        text: 'Tomorrow, **do one block before you open it**. Thirty minutes of your list before anyone else’s.',
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
        text: 'Open your notification settings and **turn off everything** that is not a person you know. Two minutes.',
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
        text: 'For your next block of written work, **take the lyrics out**. Notice what it costs you, or does not.',
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
        text: 'Pick one spot for the work that needs the most of you, and **use only that one** this week.',
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
        text: 'End today’s block **before the thing is finished**, while you still know the next sentence.',
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
        text: 'Before your next block, **write down what done looks like**. One line, and then work until it is true.',
      },
    ],
    source: 'Goal specificity: defined completion criteria improve both performance and post-task disengagement.',
  },
] as const satisfies readonly LessonDefinition[];
