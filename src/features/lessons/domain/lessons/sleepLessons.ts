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
    title: 'A steady wake time fixes your sleep',
    blocks: [
      {
        kind: 'text',
        text: 'You cannot decide to fall asleep at a particular time, but you can decide when to get up, and **that is the end of the night** you can actually control.',
      },
      { kind: 'fact', value: '30 min', caption: 'the most it should move, any day' },
      {
        kind: 'text',
        text: 'If you get up at the same time each morning, sleepiness starts arriving on its own at about the same hour each night, because **your body is timing the whole day** from the moment you woke up.',
      },
      {
        kind: 'do',
        text: 'Pick a single wake time and hold it for the next seven days, including the weekend, because **the weekend is the part** that does the work.',
      },
    ],
    source: 'CBT-I / circadian entrainment — a fixed rise time is the standard first instruction. sleepfoundation.org CBT-I overview.',
  },
  {
    id: 'sleep.light',
    title: 'Morning light decides when you get sleepy',
    blocks: [
      {
        kind: 'text',
        text: 'Daylight in the morning is what tells your body clock what time it is, and that clock decides when you get sleepy about **sixteen hours later** in the evening.',
      },
      { kind: 'fact', value: '10 min', caption: 'outside, before nine in the morning' },
      {
        kind: 'text',
        text: 'Light through a window is much weaker than light on you, so **ten minutes outdoors** does more than an hour spent in a bright room, even on a grey day.',
      },
      {
        kind: 'do',
        text: 'Go outside for ten minutes before nine, and **leave the sunglasses off** while you are there.',
      },
    ],
    source: 'Circadian phase setting by morning light; outdoor illuminance is one to two orders of magnitude above indoor.',
  },
  {
    id: 'sleep.caffeine',
    title: 'Half your coffee is still there six hours later',
    blocks: [
      {
        kind: 'text',
        text: 'Caffeine does not leave your body all at once. It **halves** roughly every six hours, so a coffee at three in the afternoon is still about a quarter of a cup in your blood when you get into bed.',
      },
      { kind: 'fact', value: '6 hours', caption: 'before half of it has gone' },
      {
        kind: 'text',
        text: 'It will not stop you falling asleep, which is why this is easy to miss. What it does is **thin the deep sleep**, so you wake up tired and reach for another coffee the next day.',
      },
      {
        kind: 'do',
        text: 'Have your **last coffee before noon** for the next seven days, and judge it at the end of the week rather than the next morning.',
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
        text: 'Falling asleep is not a switch you flip at bedtime. The hour before it is when your body works out whether it is safe to stop, and **a bright, busy hour** answers no.',
      },
      { kind: 'fact', value: '60 min', caption: 'that the night actually starts in' },
      {
        kind: 'text',
        text: 'It does not need to be a ritual. **Dimmer and slower** is the whole instruction, and doing the same dull things each night matters more than which ones you pick.',
      },
      {
        kind: 'do',
        text: 'Find your bedtime and **turn the lights down** half an hour before it tonight.',
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
        text: 'If the bed is also where you scroll, work and worry, it stops working as a **cue for sleep** and starts working as the place you lie awake.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Twenty minutes awake', text: 'Get up and sit somewhere dim and dull.' },
          { term: 'Go back sleepy', text: 'Sleepy is not the same as tired.' },
          { term: 'Clock turned away', text: 'It is the counting that keeps you up.' },
        ],
      },
      {
        kind: 'text',
        text: 'It sounds backwards, and it is the **best-tested** instruction on this list. What you are doing is teaching the bed what it is for.',
      },
      {
        kind: 'do',
        text: 'Tonight, if you are still awake twenty minutes after getting in, **get up**. It will feel wrong. Do it anyway.',
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
        text: 'Everyone **comes up between sleep cycles** several times a night, and most of the time you never notice, because you turn over and go straight back to sleep.',
      },
      { kind: 'fact', value: '90 min', caption: 'from one cycle to the next' },
      {
        kind: 'text',
        text: 'So waking up is not the problem. **Checking the clock** is, because of the sum you then do about how much is left and the decision that tomorrow is ruined.',
      },
      {
        kind: 'do',
        text: 'Tonight, turn the clock **away from the bed**, because if you cannot know the time there is no sum to do.',
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
        text: 'The list of things you have to do **does not wait for morning**. It arrives as soon as there is nothing else to look at, which is the moment you lie down in the dark.',
      },
      { kind: 'fact', value: '5 min', caption: 'with a pen, before bed' },
      {
        kind: 'text',
        text: 'Written down, it stops being something you have to hold in your head. **Paper remembers** so that you do not have to.',
      },
      {
        kind: 'do',
        text: 'Tonight before you get into bed, **write tomorrow’s list** on paper, unfinished and messy if that is how it comes out.',
      },
    ],
    source: 'Constructive worry / bedtime write-down: offloading reduces pre-sleep cognitive arousal and sleep onset latency.',
  },
  {
    id: 'sleep.alcohol',
    title: 'A drink puts you to sleep, then wakes you',
    blocks: [
      {
        kind: 'text',
        text: 'A drink gets you to sleep **faster**, and then makes the back half of the night worse. That is a common reason for waking at four and not knowing why.',
      },
      { kind: 'fact', value: '3 hours', caption: 'to leave before bed' },
      {
        kind: 'text',
        text: 'As your body clears the alcohol, your sleep gets lighter and you wake more often. The second half of the night is the part **you pay with**.',
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
        text: 'Some people need seven hours of sleep and some need nine, so **chasing one number** you read somewhere is itself a reason to lie awake doing arithmetic.',
      },
      { kind: 'fact', value: '7–9 hrs', caption: 'is the range, not the rule' },
      {
        kind: 'text',
        text: 'The honest test is how you feel in the afternoon. If you are not **fighting to stay awake** at three, you are probably getting what you need.',
      },
      {
        kind: 'do',
        text: 'Stop counting hours this week and **watch the afternoon** instead, because that is the measurement that means something.',
      },
    ],
    source: 'Individual sleep need varies; daytime sleepiness is a better indicator than total time in bed.',
  },
  {
    id: 'sleep.weekend',
    title: 'The weekend lie-in moves your body clock',
    blocks: [
      {
        kind: 'text',
        text: 'Getting up two hours later at the weekend is a **two-hour time-zone shift**, and Monday morning is the jet lag that comes with it.',
      },
      { kind: 'fact', value: '2 hours', caption: 'is a flight west, and back' },
      {
        kind: 'text',
        text: 'The lie-in feels like paying back sleep and mostly is not. It **moves the clock** rather than settling the debt, and the clock is the thing you were trying to fix.',
      },
      {
        kind: 'do',
        text: 'This weekend, **get up within an hour** of your weekday time, and take a short nap in the afternoon if you need the sleep back.',
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
        text: 'A short nap early in the day is free, and **a long one late** is borrowed from the night, with the interest being the hour you spend awake at eleven.',
      },
      { kind: 'fact', value: '20 min', caption: 'and before three in the afternoon' },
      {
        kind: 'text',
        text: 'The limit is not arbitrary. Past twenty minutes you wake **out of deeper sleep**, which is why a long nap can leave you worse than none at all.',
      },
      {
        kind: 'do',
        text: 'If you nap today, **set a twenty-minute alarm** and take it before three in the afternoon.',
      },
    ],
    source: 'Nap duration and timing: brief early naps avoid slow-wave inertia and preserve homeostatic sleep pressure.',
  },
  {
    id: 'sleep.debt',
    title: 'A short night is a short fuse tomorrow',
    blocks: [
      {
        kind: 'text',
        text: 'After a short night, everything lands harder. The same email and the same traffic, but a **much shorter distance** between mildly annoyed and genuinely angry.',
      },
      { kind: 'fact', value: '1 night', caption: 'is enough to see it' },
      {
        kind: 'text',
        text: 'Which means the temper you are working on is sometimes **a sleep problem** wearing a different coat. It is worth ruling out before you blame yourself for it.',
      },
      {
        kind: 'do',
        text: 'This week, note what the night was like before each day that went badly, and **look for the overlap**.',
      },
    ],
    source: 'Sleep restriction studies show next-day increases in irritability and emotional reactivity after a single short night.',
  },
] as const satisfies readonly LessonDefinition[];
