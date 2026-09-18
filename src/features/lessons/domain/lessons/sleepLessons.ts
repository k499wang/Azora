import type { LessonDefinition } from '../lessonBlock';

/**
 * Sleep.
 *
 * The `night` plan runs on these, but they are not only for it: a short fuse
 * and a flat morning are both downstream of the same nights, so `pressure` and
 * `morning` draw on them too.
 *
 * Sleep restriction is deliberately absent. It is the most effective component
 * of CBT-I and the one that needs supervision to titrate; a general-audience
 * app should not be prescribing time in bed.
 */
export const SLEEP_LESSONS = [
  {
    id: 'sleep.anchor',
    title: 'Your wake time is the anchor',
    blocks: [
      {
        kind: 'text',
        text: 'You cannot decide to fall asleep. You **can** decide to get up — which is why the morning end of the night is the one worth fixing.',
      },
      { kind: 'fact', value: '30 min', caption: 'the most it should move, any day' },
      {
        kind: 'text',
        text: 'Hold it and the sleepiness starts arriving **on its own**, at roughly the same hour, without having to be negotiated with.',
      },
      {
        kind: 'do',
        text: 'Pick **one wake time** for the next seven days. The weekend is the part that does the work.',
      },
    ],
    source: 'CBT-I / circadian entrainment — a fixed rise time is the standard first instruction. sleepfoundation.org CBT-I overview.',
  },
  {
    id: 'sleep.light',
    title: 'Light is the lever',
    blocks: [
      {
        kind: 'text',
        text: 'Morning light sets the clock that decides when you get sleepy, about **sixteen hours later**. It is the strongest signal you have and it is free.',
      },
      { kind: 'fact', value: '10 min', caption: 'outside, before nine' },
      {
        kind: 'text',
        text: 'Through a window is much weaker than standing in it. **Outdoor grey beats indoor bright**, by more than it looks like it should.',
      },
      {
        kind: 'do',
        text: 'Ten minutes outside before nine. **No sunglasses.** The phone can wait until you are back in.',
      },
    ],
    source: 'Circadian phase setting by morning light; outdoor illuminance is one to two orders of magnitude above indoor.',
  },
  {
    id: 'sleep.caffeine',
    title: 'Half of it is still there six hours later',
    blocks: [
      {
        kind: 'text',
        text: 'Caffeine does not wear off, it **halves**. What you drink at three in the afternoon is still **a quarter of a cup** in your blood at bedtime.',
      },
      { kind: 'fact', value: '6 hours', caption: 'before half of it is gone' },
      {
        kind: 'text',
        text: 'You will still fall asleep on it, which is what makes it so hard to notice. It does not keep you up — it **flattens the deep part** and leaves you tired enough tomorrow to want more.',
      },
      {
        kind: 'do',
        text: '**Last one before noon**, for seven days. Judge it at the end of the week, not tomorrow morning.',
      },
    ],
    source: 'Caffeine half-life ~5–6h in healthy adults; slow-wave sleep suppression documented at evening doses.',
  },
  {
    id: 'sleep.wind',
    title: 'The hour before bed is part of the night',
    blocks: [
      {
        kind: 'text',
        text: 'Sleep is not a switch. The hour before it is when the body works out whether it is safe to stop, and **a bright, busy hour** answers no.',
      },
      { kind: 'fact', value: '60 min', caption: 'that the night actually starts in' },
      {
        kind: 'text',
        text: 'It does not need to be a ritual. **Dimmer and slower** is the whole instruction, and doing the same dull things each night matters more than which ones.',
      },
      {
        kind: 'do',
        text: 'Find your bedtime and **take the lights down** thirty minutes before it tonight.',
      },
    ],
    source: 'Pre-sleep arousal is a primary maintaining factor in insomnia; wind-down routines act on it rather than on sleep itself.',
  },
  {
    id: 'sleep.bed',
    title: 'The bed is for sleep',
    blocks: [
      {
        kind: 'text',
        text: 'If the bed is also where you scroll, work and worry, the body stops reading it as a **sleep cue** and starts reading it as **the place you lie awake**.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Twenty minutes awake', text: 'Get up. Sit somewhere dim and dull.' },
          { term: 'Go back sleepy', text: 'Sleepy, not tired. They are not the same feeling.' },
          { term: 'Clock turned away', text: 'The arithmetic is the problem, not the hour.' },
        ],
      },
      {
        kind: 'text',
        text: 'It sounds backwards, and it is the **best-evidenced** thing on this list. You are teaching the bed what it is for.',
      },
      {
        kind: 'do',
        text: 'Tonight, if you are still awake after twenty minutes, **get up**. It will feel wrong. Do it anyway.',
      },
    ],
    source: 'Stimulus control, the highest-evidence component of CBT-I. sleepfoundation.org CBT-I overview.',
  },
  {
    id: 'sleep.threeam',
    title: 'Waking is normal, the thinking is not',
    blocks: [
      {
        kind: 'text',
        text: 'Everyone surfaces between sleep cycles, several times a night. Most of the time you never know, because **nothing happened** — you turned over and went back.',
      },
      { kind: 'fact', value: '90 min', caption: 'from one cycle to the next' },
      {
        kind: 'text',
        text: 'So the waking is not the problem. **Checking the clock** is: the sum you then do about how much is left, and the decision that tomorrow is already ruined.',
      },
      {
        kind: 'do',
        text: 'Turn the clock **away from the bed** tonight. If you cannot know the time, there is no sum to do.',
      },
    ],
    source: 'Sleep cycles ~90 min with brief arousals at boundaries; clock-monitoring is a documented maintaining factor in insomnia.',
  },
  {
    id: 'sleep.worry',
    title: 'Write it down before you get in',
    blocks: [
      {
        kind: 'text',
        text: 'The list does not wait politely until morning. It arrives the moment there is nothing else to look at, which is **the point of lying down**.',
      },
      { kind: 'fact', value: '5 min', caption: 'with a pen, before bed' },
      {
        kind: 'text',
        text: 'Written down, it stops being a thing you have to hold. **Paper remembers** so you do not have to, and that is the entire mechanism.',
      },
      {
        kind: 'do',
        text: 'Tonight, before you get in, **write tomorrow’s list**. Unfinished is fine. It only has to be out of your head.',
      },
    ],
    source: 'Constructive worry / bedtime write-down: offloading reduces pre-sleep cognitive arousal and sleep onset latency.',
  },
  {
    id: 'sleep.alcohol',
    title: 'It trades the first half for the second',
    blocks: [
      {
        kind: 'text',
        text: 'A drink gets you to sleep **faster** and makes the back half of the night worse. It is why you woke at four and could not work out why.',
      },
      { kind: 'fact', value: '3 hours', caption: 'worth leaving before bed' },
      {
        kind: 'text',
        text: 'As it clears, the body **rebounds**: lighter sleep, more waking, and an earlier finish than the one you went to bed for.',
      },
      {
        kind: 'do',
        text: 'If you are drinking tonight, **stop three hours before bed** and put a glass of water beside it.',
      },
    ],
    source: 'Alcohol reduces sleep onset latency, suppresses REM early and causes second-half fragmentation as it metabolises.',
  },
  {
    id: 'sleep.hours',
    title: 'Eight hours is an average, not a target',
    blocks: [
      {
        kind: 'text',
        text: 'Some people need seven and some need nine. **Chasing a number** you read somewhere is its own reason to lie awake doing arithmetic.',
      },
      { kind: 'fact', value: '7–9 hrs', caption: 'is the range, not the rule' },
      {
        kind: 'text',
        text: 'The honest test is the afternoon. If you are not **fighting to stay awake** at three, you are probably getting what you need.',
      },
      {
        kind: 'do',
        text: 'Stop counting hours this week. **Notice the afternoon instead** — that is the measurement that means something.',
      },
    ],
    source: 'Individual sleep need varies; daytime sleepiness is a better indicator than total time in bed.',
  },
  {
    id: 'sleep.weekend',
    title: 'Monday starts on Saturday',
    blocks: [
      {
        kind: 'text',
        text: 'A weekend two hours later is a **two-hour time-zone shift**, and Monday morning is the jet lag. Nobody calls it that, but that is what it is.',
      },
      { kind: 'fact', value: '2 hours', caption: 'is a flight west, and back' },
      {
        kind: 'text',
        text: 'The lie-in feels like repayment and mostly is not. It **moves the clock** rather than settling the debt, and the clock is what you were trying to fix.',
      },
      {
        kind: 'do',
        text: 'This weekend, **get up within an hour** of your weekday time. Nap in the afternoon if you need to.',
      },
    ],
    source: 'Social jet lag: weekend phase delay produces measurable Monday circadian misalignment.',
  },
  {
    id: 'sleep.nap',
    title: 'A nap is a loan against tonight',
    blocks: [
      {
        kind: 'text',
        text: 'Short and early is free. **Long and late** is borrowed from the night, and the interest is the hour you spend awake at eleven.',
      },
      { kind: 'fact', value: '20 min', caption: 'and before three in the afternoon' },
      {
        kind: 'text',
        text: 'The limit is not arbitrary. Past twenty minutes you wake **out of deeper sleep**, which is why a long nap can leave you worse than none at all.',
      },
      {
        kind: 'do',
        text: 'If you nap today, **set a twenty-minute alarm** and take it before three.',
      },
    ],
    source: 'Nap duration and timing: brief early naps avoid slow-wave inertia and preserve homeostatic sleep pressure.',
  },
  {
    id: 'sleep.debt',
    title: 'This is where your fuse went',
    blocks: [
      {
        kind: 'text',
        text: 'After a short night everything lands harder. The same email, the same traffic, and a **shorter distance** between mildly annoyed and genuinely angry.',
      },
      { kind: 'fact', value: '1 night', caption: 'is enough to see it' },
      {
        kind: 'text',
        text: 'Which means the temper you are working on is sometimes **a sleep problem** wearing a different coat. Worth ruling out before you blame yourself for it.',
      },
      {
        kind: 'do',
        text: 'This week, note the night before each day that went badly. **Look for the overlap.**',
      },
    ],
    source: 'Sleep restriction studies show next-day increases in irritability and emotional reactivity after a single short night.',
  },
] as const satisfies readonly LessonDefinition[];
