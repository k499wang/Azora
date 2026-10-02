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
        text: 'Here’s a calming tool you can use anywhere: **a long, slow breath out**. It tells your body it’s safe to settle down. Use it right after a sharp text from your boss, and **nobody around you will notice**.',
      },
      { kind: 'fact', value: '28 days', caption: 'of five minutes a day in a Stanford breathing study' },
      {
        kind: 'text',
        text: 'In that study, people breathed with **a long, slow breath out** for five minutes a day. **Their mood lifted more** than people who did mindfulness instead. Mindfulness means quietly paying attention to what’s happening right now.',
      },
      {
        kind: 'text',
        text: 'Here’s what’s going on inside. Your heart **speeds up a little when you breathe in**. It **slows down a little when you breathe out**. That’s normal and healthy. So a longer breath out gives the slowing part more time.',
      },
      {
        kind: 'choice',
        prompt: 'You feel wound up before a hard conversation. Which breath fits this lesson?',
        options: [
          { label: 'In for four, out for six', feedback: 'Yes. Your breath out is longer than your breath in, so your heart gets more time to slow down. Try a few rounds right now.' },
          { label: 'Big, fast breaths in', feedback: 'Fast breaths in wake your body up instead of calming it. That’s great on a sleepy morning, but not before a tense talk.' },
          { label: 'Hold my breath until it passes', feedback: 'Holding your breath doesn’t give the breath out more time. Try one slow breath out instead. That’s the part that slows you down.' },
        ],
      },
      {
        kind: 'text',
        text: 'Here’s how. Breathe in through your nose for **a count of four**. Breathe out slowly for six. Too long? Use five. Your Reset, a short guided session in this app, practises this with you. Use it anywhere, even **lying in bed with your mind racing**.',
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
        text: 'Groggy mornings don’t have to drag on. Your morning Reset is a short guided session in this app that **nudges your body awake**. Think of turning up a dimmer switch, **slowly**, instead of flicking every light on at once.',
      },
      { kind: 'fact', value: '4 in, 2 out', caption: 'the count your morning Reset uses' },
      {
        kind: 'text',
        text: 'Here’s how it works. Your heart **speeds up a little each time you breathe in**. So a breath in that’s longer than the breath out gives your body **a gentle push toward alert**. It’s the opposite of a calming breath.',
      },
      {
        kind: 'text',
        text: 'Picture your alarm going off and your head feeling heavy. Instead of grabbing your phone, sit up. Breathe in for four, out for two. **Move your body first and your mind follows.** If you feel dizzy, **slow down and breathe normally**.',
      },
      {
        kind: 'choice',
        prompt: 'It’s mid-morning and you feel flat before a meeting. What fits this lesson?',
        options: [
          { label: 'A few quick breaths in', feedback: 'Yes. A short round of breathing led by the breath in gives you a gentle lift. Keep it easy, and stop if you feel lightheaded.' },
          { label: 'A long, slow breath out', feedback: 'A long breath out calms you down. That’s perfect for a tense moment, but right now you want to wake up.' },
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
