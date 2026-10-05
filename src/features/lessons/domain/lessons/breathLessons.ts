import type { LessonDefinition } from '../lessonBlock';

/**
 * How the home session works, on the day it starts.
 *
 * Day one of a plan explains the reset the user is about to repeat every day,
 * so the idea arrives with something to feel it in. Slow plans lean on a long
 * breath out and the morning plan on a quick breath in, so each gets its own.
 */
export const BREATH_LESSONS = [
  {
    id: 'breath.exhale',
    title: 'A long breath out calms you down',
    step: 'Try five breaths with a breath out longer than in.',
    blocks: [
      {
        kind: 'text',
        text: 'After a sharp message from your boss, you might notice your body feels tense before you know what to say. Taking **a long, slow breath out** gives you a quiet moment to settle, and **you can try it wherever you are**.',
      },
      { kind: 'fact', value: '28 days', caption: 'of five minutes a day in a Stanford breathing study' },
      {
        kind: 'text',
        text: 'In that study, people breathed with **a long, slow breath out** for five minutes a day. **Their mood lifted more** than people who did mindfulness instead. Mindfulness means quietly paying attention to what’s happening right now.',
      },
      {
        kind: 'text',
        text: 'To understand why the breath out matters, it helps to notice what your heart does as you breathe. Your heart **speeds up a little when you breathe in**. It **slows down a little when you breathe out**. That’s normal and healthy. So a longer breath out gives the slowing part more time.',
      },
      {
        kind: 'choice',
        prompt: 'You feel wound up before a hard conversation. Which breath fits this lesson?',
        options: [
          { label: 'In for four, out for six', feedback: 'That pattern gives the breath out more time than the breath in. Try a few comfortable rounds and notice whether you feel a little more settled.' },
          { label: 'Big, fast breaths in', feedback: 'Big, fast breaths can make you feel lightheaded or more wound up. For this calming practice, keep your breath comfortable and let the breath out last a little longer.' },
          { label: 'Hold my breath until it passes', feedback: 'Holding your breath can add strain when you already feel tense. Instead, let the air out slowly and comfortably, then continue breathing normally.' },
        ],
      },
      {
        kind: 'text',
        text: 'You can try this by breathing in through your nose for **a count of four**, then breathing out gently for six. If six feels too long, use five. The short guided breathing session in your plan is called a Reset, and it **shows you when to breathe in and out**.',
      },
      {
        kind: 'do',
        text: 'In a calm minute today, try **five breaths with a longer breath out** than in. Notice how you feel **before and after**.',
      },
    ],
    source: 'Balban et al. 2023 (Stanford), Cell Reports Medicine: 5 min/day of exhale-emphasised cyclic sighing for 28 days improved positive affect more than mindfulness meditation. Respiratory sinus arrhythmia: heart rate rises on inhalation and falls on exhalation (Yasuma & Hayano 2004, Chest).',
  },
  {
    id: 'breath.wake',
    title: 'A quick breath in wakes you up',
    step: 'Sit up and do your Reset before you reach for your phone.',
    blocks: [
      {
        kind: 'text',
        text: 'When you wake up groggy, it can help to begin with something small before tackling the day. Your morning Reset is **a short guided breathing session** in this app. It uses a different rhythm from calming breathing, so you can try it and **notice how awake you feel afterward**.',
      },
      { kind: 'fact', value: '4 in, 2 out', caption: 'the count your morning Reset uses' },
      {
        kind: 'text',
        text: 'The morning guide uses a longer breath in and a shorter breath out. Your heart **speeds up a little each time you breathe in**, which is part of the normal breathing cycle. This rhythm is intended to feel more alerting, although **people respond differently**.',
      },
      {
        kind: 'text',
        text: 'If your alarm goes off and your head feels heavy, start by sitting comfortably before reaching for your phone. The guide asks you to **breathe in for four and out for two**, without forcing deep or fast breaths. If you feel dizzy, **stop and breathe normally**.',
      },
      {
        kind: 'choice',
        prompt: 'It’s mid-morning and you feel flat before a meeting. What fits this lesson?',
        options: [
          { label: 'A comfortable round of the morning breathing pattern', feedback: 'You can try the morning guide’s longer breath in and shorter breath out, without forcing speed or depth. Notice how you feel, and stop if you become lightheaded.' },
          { label: 'A long, slow breath out', feedback: 'A longer breath out is the pattern used for calming practice. Since your aim here is to feel more awake, you could try the morning rhythm gently and see how it feels.' },
        ],
      },
      {
        kind: 'sequence',
        prompt: 'Put a morning wake-up in the right order.',
        steps: [
          'Sit up and put both feet on the floor.',
          'Breathe in for four and out for two, for a couple of minutes.',
          'Notice how awake you feel now.',
        ],
        feedback: 'Moving first, then breathing, gets your morning going. Checking in at the end lets you see the difference for yourself.',
      },
      {
        kind: 'do',
        text: 'Tomorrow morning, **sit up before you reach for your phone** and do your Reset first. Notice how **awake you feel** afterward.',
      },
    ],
    source: 'Inhalation transiently raises heart rate and faster, inhale-led breathing shifts autonomic balance toward sympathetic activity; Balban et al. 2023 (Cell Reports Medicine) included an inhale-emphasised cyclic hyperventilation arm. Direct evidence that brief inhale-led breathing improves morning alertness is limited and short-term.',
  },
] as const satisfies readonly LessonDefinition[];
