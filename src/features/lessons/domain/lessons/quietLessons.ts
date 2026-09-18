import type { LessonDefinition } from '../lessonBlock';

/**
 * Quiet, and what it is actually for.
 *
 * `quiet` runs on these. Most of them are corrections: nearly everybody who has
 * tried this and stopped did so because of a belief about it that was not true,
 * and saying the true version is more use than another instruction.
 */
export const QUIET_LESSONS = [
  {
    id: 'quiet.gap',
    title: 'There is a gap, and it can be widened',
    blocks: [
      {
        kind: 'text',
        text: 'Between the thing happening and your response to it there is **a moment**. It is short, and usually spent before you notice it was there.',
      },
      { kind: 'fact', value: '1 breath', caption: 'is usually the whole gap' },
      {
        kind: 'text',
        text: 'Nearly all of this is about making that moment **long enough to use**. Not calmer. **Longer.**',
      },
      {
        kind: 'do',
        text: 'Once today, when something lands badly, take **one breath before answering**. That is the practice. That is all of it.',
      },
    ],
    source: 'Response inhibition / the stimulus-response gap, the core mechanism claim of mindfulness-based stress reduction.',
  },
  {
    id: 'quiet.notice',
    title: 'Noticing is not suppressing',
    blocks: [
      {
        kind: 'text',
        text: 'The aim was never to stop feeling it. It is to **feel it and still be the one choosing**. Those are different skills, and only one of them holds up.',
      },
      {
        kind: 'text',
        text: 'Pushed down, it does not go anywhere. It waits, and it comes back **louder**, usually at a worse moment.',
      },
      {
        kind: 'text',
        text: 'Named and left alone, it does what feelings do on their own, which is **pass**.',
      },
      {
        kind: 'do',
        text: 'Next time something rises, **name it and leave it there**. “That’s frustration.” Then carry on with what you were doing.',
      },
    ],
    source: 'Affect labelling reduces amygdala response; expressive suppression carries a documented rebound.',
  },
  {
    id: 'quiet.wander',
    title: 'The wandering is the practice',
    blocks: [
      {
        kind: 'text',
        text: 'Your mind will leave. It leaves constantly, and **that is not the failure** — noticing that it left and coming back is the entire repetition.',
      },
      { kind: 'fact', value: '1 return', caption: 'is one repetition' },
      {
        kind: 'text',
        text: 'Which means a session full of distraction was **a session full of practice**, and the still one where nothing happened taught you less.',
      },
      {
        kind: 'do',
        text: 'Today, count the returns instead of judging the drift. **Every one counts.**',
      },
    ],
    source: 'Attention regulation: the noticing-and-returning cycle is the trained component, not sustained stillness.',
  },
  {
    id: 'quiet.beginner',
    title: 'Nobody is good at this at first',
    blocks: [
      {
        kind: 'text',
        text: 'Almost everyone’s first attempt goes badly and almost everyone concludes **they are uniquely bad at it**. They are describing the normal experience.',
      },
      {
        kind: 'text',
        text: 'There is no version of this where your mind sits still on request. Not for you, **not for anyone** who has been doing it for thirty years.',
      },
      {
        kind: 'text',
        text: 'What changes is not the stillness. It is **how quickly you notice** you left.',
      },
      {
        kind: 'do',
        text: 'Today, drop the standard entirely. **Sit through it badly** and count that as having done it.',
      },
    ],
    source: 'Unrealistic expectations of mental quiet are among the most common stated reasons for discontinuation.',
  },
  {
    id: 'quiet.two',
    title: 'Two minutes genuinely counts',
    blocks: [
      {
        kind: 'text',
        text: 'The twenty-minute version is not the real one and the short one a compromise. **Two minutes is a repetition**, and repetitions are what this is made of.',
      },
      { kind: 'fact', value: '2 min', caption: 'done daily beats 20 done rarely' },
      {
        kind: 'text',
        text: 'The long session you keep failing to schedule is worth **less than nothing**, because it also convinces you that you are not doing this.',
      },
      {
        kind: 'do',
        text: 'If today has no room in it, **take two minutes**. Mark it done, because it is.',
      },
    ],
    source: 'Frequency over duration: brief daily practice shows adherence advantages at comparable short-term effect.',
  },
  {
    id: 'quiet.eyes',
    title: 'You do not have to close your eyes',
    blocks: [
      {
        kind: 'text',
        text: 'Closed eyes are a convention, not a requirement. For plenty of people they make it **harder, not quieter** — the inside of the head gets louder.',
      },
      {
        kind: 'text',
        text: 'A soft gaze at a dull patch of floor works. So does looking out of a window at **nothing in particular**.',
      },
      {
        kind: 'text',
        text: 'It also means this can happen **on a train**, in a waiting room, at a desk — which is most of where it is needed.',
      },
      {
        kind: 'do',
        text: 'Try today’s with your **eyes open and low**. See which one your attention prefers.',
      },
    ],
    source: 'Eyes-open practice is standard in several traditions and is preferable where closed eyes raise arousal.',
  },
  {
    id: 'quiet.bodyfirst',
    title: 'Start with the body, it is easier',
    blocks: [
      {
        kind: 'text',
        text: 'Attention is hard to hold on nothing. It is much easier to hold on **something physical** — feet, hands, the weight of you on the chair.',
      },
      {
        kind: 'text',
        text: 'The body is also **always present tense**. It cannot rehearse tomorrow, so going there takes you out of the rehearsal without being told to stop.',
      },
      {
        kind: 'text',
        text: 'When it gets loose, **go back to the feet**. It is the most reliable handle there is.',
      },
      {
        kind: 'do',
        text: 'Today, start with **thirty seconds on your feet** — the actual sensation — before anything else.',
      },
    ],
    source: 'Interoceptive anchoring: somatic anchors are easier to sustain than open monitoring for beginners.',
  },
  {
    id: 'quiet.thoughts',
    title: 'You are the one hearing them',
    blocks: [
      {
        kind: 'text',
        text: 'A thought arrives and it sounds like you. But **you are the one hearing it**, which means you are not the same thing as it.',
      },
      {
        kind: 'text',
        text: 'That gap is small and it is the whole trick. “I am useless” and **“there is the useless thought again”** are not the same sentence to live with.',
      },
      {
        kind: 'text',
        text: 'It is not about arguing with them. Arguing keeps you inside. **Hearing** puts you outside.',
      },
      {
        kind: 'do',
        text: 'Next time a hard one turns up, put **“I notice I’m thinking”** in front of it. Nothing else.',
      },
    ],
    source: 'Cognitive defusion (ACT): altering the relationship to a thought rather than its content.',
  },
  {
    id: 'quiet.boredom',
    title: 'Boredom is the entry fee',
    blocks: [
      {
        kind: 'text',
        text: 'The first few minutes of quiet feel like **nothing is happening**. That is not the practice failing. That is the practice.',
      },
      { kind: 'fact', value: '3 min', caption: 'of nothing, before it turns' },
      {
        kind: 'text',
        text: 'It is also the exact part everybody skips, which is why so many people have tried this and concluded it **does not work for them**.',
      },
      {
        kind: 'do',
        text: 'Sit through the dull part today **without reaching for anything**. Three minutes. It turns.',
      },
    ],
    source: 'Adjustment to low-stimulation states; early restlessness is the most common reported reason for dropping out.',
  },
  {
    id: 'quiet.moving',
    title: 'It counts while you are moving',
    blocks: [
      {
        kind: 'text',
        text: 'None of this requires sitting still. **A walk with your attention on the walk** is the same practice, and for a lot of people an easier one.',
      },
      {
        kind: 'text',
        text: 'Feet, breath, air on your face — the anchor is **whatever is actually happening**, and while you are moving there is more of it.',
      },
      {
        kind: 'text',
        text: 'It also removes the excuse. The ten minutes exists already; **only the attention is new**.',
      },
      {
        kind: 'do',
        text: 'Take a walk you were taking anyway and **leave the phone behind**. Attention on the feet.',
      },
    ],
    source: 'Walking meditation is a standard formal practice, not a substitute for one.',
  },
  {
    id: 'quiet.rested',
    title: 'Unstimulated is not the same as rested',
    blocks: [
      {
        kind: 'text',
        text: 'Scrolling takes the demand away without giving anything back. It is why an evening of it can leave you **as tired as the day did**.',
      },
      {
        kind: 'text',
        text: 'Rest is not the absence of input. It is **input you chose** — or none at all, which is the harder of the two.',
      },
      {
        kind: 'text',
        text: 'The test is simple: **did you feel better afterwards**, or only less demanded of?',
      },
      {
        kind: 'do',
        text: 'Ten minutes with **no screen** tonight. Not a rule for life. Just notice what it is like.',
      },
    ],
    source: 'Attention restoration: passive media use does not produce the recovery that low-demand or natural settings do.',
  },
  {
    id: 'quiet.kind',
    title: 'Talk to yourself like a friend',
    blocks: [
      {
        kind: 'text',
        text: 'Read back what you say to yourself after a bad day. **You would not say it to anyone else**, and you would think less of someone who did.',
      },
      {
        kind: 'text',
        text: 'The hard voice is not what keeps your standards up. It mostly **makes starting harder**, which lowers them.',
      },
      {
        kind: 'text',
        text: 'The alternative is not flattery. It is **accuracy** — what you would actually tell a friend in the same position.',
      },
      {
        kind: 'do',
        text: 'Next time you catch it, ask what you’d say **to someone you liked**. Then say that instead.',
      },
    ],
    source: 'Self-compassion research: self-criticism predicts avoidance; self-compassion predicts re-engagement after failure.',
  },
] as const satisfies readonly LessonDefinition[];
