import { colors } from '../../../theme/colors';
import type { IntentOption, PersonalizedIntentOption } from '../types';

export const PERSONALIZED_INTENT_OPTIONS: PersonalizedIntentOption[] = [
  {
    id: 'scrolling',
    icon: 'timer',
    title: 'Control my doomscrolling',
    legacyTitles: ['Spending less time doomscrolling', 'Stop doomscrolling and reclaim my time', 'Break my doomscrolling habit', 'Stop doomscrolling', 'Stop doomscrolling and take back my time', 'Doomscrolling', 'Spending less time scrolling'],
    body: 'Catch the automatic unlock and choose what to do with your time.',
    hook: 'A pause before the scroll.',
    goalPhrase: 'spend less time scrolling',
    assessmentPlan: 'We’ll start with small phone boundaries, short Resets, and lessons about choosing where your attention goes.',
    reflectionHeadline: 'Take back one moment at a time.',
    reflectionBody: 'Notice what pulls you toward your phone, then make one small change that leaves room for something else.',
    accent: colors.playful.sky.base,
    valuePoints: [
      { icon: 'timer', accent: colors.playful.sky.base, label: 'Notice the moments that lead to an automatic scroll' },
      { icon: 'timer', accent: colors.playful.sky.base, label: 'Put one small boundary between you and your phone' },
      { icon: 'sparkle', accent: colors.playful.sky.base, label: 'Choose a next step that matters to you' },
    ],
  },
  {
    id: 'burnout',
    icon: 'lotus',
    title: 'Feeling less burned out',
    legacyTitles: ['Recover from burnout and regain energy', 'Recover from burnout', 'Recover from burnout and feel like myself', 'Burnout', 'Feeling less burned out'],
    body: 'Make room for rest and manageable steps on drained days.',
    hook: 'Start with what you have.',
    goalPhrase: 'feel less burned out',
    assessmentPlan: 'We’ll start with gentle daily steps, short Resets, and lessons about rest, limits, and asking for support.',
    reflectionHeadline: 'A plan that leaves room for rest.',
    reflectionBody: 'You do not have to push harder to begin. Choose a small step that fits the energy you have today.',
    accent: colors.playful.teal.base,
    valuePoints: [
      { icon: 'lotus', accent: colors.playful.teal.base, label: 'Make the next step fit your energy' },
      { icon: 'timer', accent: colors.playful.teal.base, label: 'Practise taking a break before you run empty' },
      { icon: 'sparkle', accent: colors.playful.teal.base, label: 'Build room for rest and support into your week' },
    ],
  },
  {
    id: 'procrastination',
    icon: 'timer',
    title: 'Stop my procrastination',
    legacyTitles: ['Stop procrastinating and take action', 'Overcome my procrastination', 'Stop procrastinating and get things done', 'Procrastination', 'Putting things off less'],
    body: 'Make the first step small enough to begin.',
    hook: 'Begin with one small thing.',
    goalPhrase: 'put things off less',
    assessmentPlan: 'We’ll start with tiny first steps, short Resets, and lessons about beginning without waiting for motivation.',
    reflectionHeadline: 'Starting can be smaller than you think.',
    reflectionBody: 'Pick one task, make the first action clear, and give yourself permission to stop after a small start.',
    accent: colors.playful.amber.base,
    valuePoints: [
      { icon: 'timer', accent: colors.playful.amber.base, label: 'Turn a vague task into one clear action' },
      { icon: 'timer', accent: colors.playful.amber.base, label: 'Try a short start instead of waiting to feel ready' },
      { icon: 'sparkle', accent: colors.playful.amber.base, label: 'Return to the task without turning a delay into a failure' },
    ],
  },
  {
    id: 'stress_relief',
    icon: 'waves',
    accent: colors.playful.teal.base,
    title: 'Calm my stress & anxiety',
    legacyTitles: [
      'Manage my stress and anxiety',
      'Ease my stress and anxiety',
      'Stress & anxiety',
      'Feeling less stressed',
      'Feeling calmer under pressure',
      'I’m stressed all the time',
      'I feel overwhelmed all the time',
      'Reduce stress',
      'I’m overwhelmed all the time',
      'Always overwhelmed',
      'Everything feels like too much',
    ],
    body: 'Take a pause when demands pile up and choose one manageable next step.',
    hook: 'Make the next step smaller.',
    goalPhrase: 'handle stress and overwhelm',
    assessmentPlan:
      'We’ll start with small plan steps, with short guided Resets and lessons about stress, priorities, and asking for help.',
    reflectionHeadline: 'You do not have to solve the whole day at once.',
    reflectionBody:
      'Notice what feels too much, take a short pause, and choose one task or break that fits the moment.',
    valuePoints: [
      {
        icon: 'waves',
        accent: colors.playful.teal.base,
        label: 'Notice how stress shows up in your body, thoughts, and actions',
      },
      {
        icon: 'breath-timer',
        accent: colors.playful.sky.base,
        label: 'Choose what needs attention today and what can wait',
      },
      {
        icon: 'meditation',
        accent: colors.playful.amber.base,
        label: 'Practise asking for help and setting realistic limits',
      },
    ],
  },
  {
    id: 'calm_fast',
    icon: 'timer',
    accent: colors.playful.amber.base,
    title: 'Overthinking less',
    legacyTitles: [
      'Stop overthinking and calm my mind',
      'Stop overthinking everything',
      'Stop my overthinking',
      'Stop overthinking and quiet my mind',
      'Quieting my overthinking',
      'I overthink everything',
      'I keep overthinking everything',
      'Calm down fast',
      'My thoughts won’t slow down',
      'Racing thoughts',
      'I get overwhelmed and can’t start.',
    ],
    body: 'Notice repeated worries and return to what you can do now.',
    hook: 'A small step out of the worry loop.',
    goalPhrase: 'spend less time caught in repeated worries',
    assessmentPlan:
      'We’ll start with small plan steps, with short guided Resets and lessons about repeated worries, facts, and uncertainty.',
    reflectionHeadline: 'You can take a step without answering every worry.',
    reflectionBody:
      'Practise noticing when a thought repeats, separating what you know from what you fear, and choosing an available action.',
    valuePoints: [
      {
        icon: 'timer',
        accent: colors.playful.amber.base,
        label: 'Notice when thinking repeats without giving you new information',
      },
      {
        icon: 'waves',
        accent: colors.playful.sky.base,
        label: 'Separate a checked fact from a prediction',
      },
      {
        icon: 'sparkle',
        accent: colors.playful.teal.base,
        label: 'Choose a small action even when some answers are unknown',
      },
    ],
  },
  {
    id: 'sleep',
    icon: 'moon',
    accent: colors.playful.sky.base,
    title: 'Sleeping better',
    legacyTitles: [
      'Fall asleep quicker and sleep better',
      'Fall asleep quicker and better',
      'Fall asleep and stay asleep',
      'Fall asleep faster and sleep better',
      'Fix my sleep',
      'Falling asleep faster',
      'I can’t fall asleep',
      'I can’t switch off at night','Sleep better', 'Can’t switch off',
      'Switching off at night'],
    body: 'Build a slower rhythm before rest.',
    hook: 'Tonight can already feel different.',
    goalPhrase: 'sleep better',
    assessmentPlan:
      'We’ll start with small plan steps, with short guided Resets and lessons about winding down and sleeping through the night.',
    reflectionHeadline: 'Fall asleep faster, sleep deeper.',
    reflectionBody:
      'A nightly wind-down teaches your body to slip into rest on cue — no willpower needed.',
    valuePoints: [
      {
        icon: 'moon',
        accent: colors.playful.sky.base,
        label: 'Fall asleep up to 37% faster',
      },
      {
        icon: 'breath-timer',
        accent: colors.playful.teal.base,
        label: 'A 10 min wind down lifts HRV before bed',
      },
      {
        icon: 'streak',
        accent: colors.playful.amber.base,
        label: 'Add up to 20 min of deep sleep per night',
      },
    ],
  },
  {
    id: 'focus',
    icon: 'meditation',
    accent: colors.playful.sky.base,
    title: 'Staying focused',
    legacyTitles: [
      'Improve my focus and stay on track',
      'Get my focus back',
      'Get my focus back and stay on track',
      'Getting my focus back',
      'I’m behind on work or school',
      'Work or school is piling up','Focus & study', 'I can’t get myself to focus', 'Can’t focus',
      'Focusing on work or school'],
    body: 'Make starting feel smaller when your work is waiting.',
    hook: 'Clear head, sharper recall.',
    goalPhrase: 'stay focused while you work or study',
    assessmentPlan:
      'We’ll start with small plan steps, with short guided Resets and lessons about starting work and protecting your focus.',
    reflectionHeadline: 'Find focus in a few minutes.',
    reflectionBody:
      'A paced reset calms pre-exam nerves and pulls your attention back from the noise.',
    valuePoints: [
      {
        icon: 'sparkle',
        accent: colors.playful.sky.base,
        label: 'A 90-second reset sharpens attention fast',
      },
      {
        icon: 'book',
        accent: colors.playful.teal.base,
        label: 'Lower anxiety improves memory and recall',
      },
      {
        icon: 'streak',
        accent: colors.playful.amber.base,
        label: 'Steadier focus across longer study sessions',
      },
    ],
  },
  {
    id: 'energy',
    icon: 'sun',
    accent: colors.playful.amber.base,
    title: 'Having more energy',
    legacyTitles: [
      'I’m always tired',
      'I have no energy to do anything',
      'Boost energy',
      'I’m exhausted before the day starts',
      'Always exhausted',
      'I’m exhausted',
    ],
    body: 'Lift your state without caffeine.',
    hook: 'A cleaner kind of energy.',
    goalPhrase: 'boost your energy',
    assessmentPlan:
      'We’ll start with energizing sessions that lift alertness in minutes.',
    reflectionHeadline: 'Energize without the crash.',
    reflectionBody:
      'An active reset raises alertness and circulation — a natural lift you can repeat anytime.',
    valuePoints: [
      {
        icon: 'sun',
        accent: colors.playful.amber.base,
        label: 'An energizing reset raises alertness in minutes',
      },
      {
        icon: 'waves',
        accent: colors.playful.sky.base,
        label: 'A cleaner lift, no caffeine crash',
      },
      {
        icon: 'heart-glow',
        accent: colors.playful.coral.base,
        label: 'A repeatable lift you control any time of day',
      },
    ],
  },
  {
    id: 'self_acceptance',
    icon: 'heart',
    accent: colors.playful.amber.base,
    title: 'Be kinder to myself',
    body: 'Turn down the inner critic and make peace with where you are.',
    hook: 'You can stop fighting yourself.',
    goalPhrase: 'be kinder to yourself',
    assessmentPlan:
      'We’ll start with slow, warm sessions that leave room for self-compassion.',
    reflectionHeadline: 'Kindness is a practice, not a mood.',
    reflectionBody:
      'Self-criticism keeps the body on alert. Slowing down gives you a moment to meet yourself gently instead.',
    valuePoints: [
      {
        icon: 'heart-glow',
        accent: colors.playful.amber.base,
        label: 'A calm body makes self-criticism easier to set down',
      },
      {
        icon: 'face-calm',
        accent: colors.playful.sky.base,
        label: 'Self-compassion practice is linked to lower anxiety',
      },
      {
        icon: 'sparkle',
        accent: colors.playful.teal.base,
        label: 'Showing up counts, even on the days it feels small',
      },
    ],
  },
  {
    id: 'emotional_balance',
    icon: 'waves',
    accent: colors.playful.sky.base,
    title: 'Being patient with people',
    legacyTitles: [
      'I snap at people too easily',
      'I get irritated and snap too easily','I can’t keep up with myself', 'Steady my emotions', 'I feel everything too intensely', 'Big emotions',
      'Staying calm with people',
      'Keeping my cool with people'],
    body: 'Notice irritation and practise a pause before you respond.',
    hook: 'Give yourself a moment before you react.',
    goalPhrase: 'pause before reacting to irritation',
    assessmentPlan:
      'We’ll start with small plan steps, with short guided Resets and lessons about irritation, pausing, and choosing your response.',
    reflectionHeadline: 'You can practise a pause before responding.',
    reflectionBody:
      'Notice signs such as tense hands or raised shoulders. Your plan gives you short practices and clear steps to try before replying or continuing a difficult conversation.',
    valuePoints: [
      {
        icon: 'waves',
        accent: colors.playful.sky.base,
        label: 'Short breathing and attention practices to try when irritation builds',
      },
      {
        icon: 'face-calm',
        accent: colors.playful.teal.base,
        label: 'Learn to notice tension before you respond',
      },
      {
        icon: 'heart-bpm',
        accent: colors.playful.coral.base,
        label: 'Choose one clear response instead of reacting straight away',
      },
    ],
  },
  {
    id: 'self_care',
    icon: 'lotus',
    accent: colors.playful.teal.base,
    title: 'Make time for myself',
    body: 'Claim a few quiet minutes in the day that belong only to you.',
    hook: 'A few minutes that are yours.',
    goalPhrase: 'make time for yourself',
    assessmentPlan:
      'We’ll start with short, unhurried sessions that fit into the day you already have.',
    reflectionHeadline: 'Small, protected, yours.',
    reflectionBody:
      'Time for yourself does not have to be an hour. A few unhurried minutes, taken daily, is the version that survives a busy week.',
    valuePoints: [
      {
        icon: 'timer',
        accent: colors.playful.teal.base,
        label: 'Two quiet minutes is a real reset, not a compromise',
      },
      {
        icon: 'moon',
        accent: colors.playful.sky.base,
        label: 'A pause you choose beats one your body forces on you',
      },
      {
        icon: 'streak',
        accent: colors.playful.amber.base,
        label: 'Daily and short outlasts long and occasional',
      },
    ],
  },
  {
    id: 'spiritual',
    icon: 'arrow-up',
    accent: colors.playful.sky.base,
    title: 'Deepen practice',
    body: 'Make more room for stillness and presence.',
    hook: 'A way back to stillness.',
    goalPhrase: 'deepen your spiritual practice',
    assessmentPlan:
      'We’ll start with small plan steps, with short guided Resets and lessons about stillness and noticing what is around you.',
    reflectionHeadline: 'Find stillness on purpose.',
    reflectionBody:
      'Stillness has anchored meditation and prayer for millennia — a doorway to presence you carry everywhere.',
    valuePoints: [
      {
        icon: 'lotus',
        accent: colors.playful.sky.base,
        label: 'Slowing down deepens meditative focus',
      },
      {
        icon: 'meditation',
        accent: colors.playful.teal.base,
        label: 'Used in yoga and mindfulness for thousands of years',
      },
      {
        icon: 'sparkle',
        accent: colors.playful.amber.base,
        label: 'A few mindful minutes bring you back to now',
      },
    ],
  },
  {
    id: 'yoga',
    icon: 'lotus',
    accent: colors.playful.sky.base,
    title: 'Support my yoga',
    body: 'Carry your breath off the mat — pranayama to steady every practice.',
    hook: 'The breath half of your practice.',
    goalPhrase: 'breathe better on the mat',
    assessmentPlan:
      'We’ll start with breath-led practices for steadier movement and deeper stillness.',
    reflectionHeadline: 'Bring your breath to the mat.',
    reflectionBody:
      'Pranayama is the breath side of yoga — the same slow, intentional breathing that steadies poses and deepens stillness.',
    valuePoints: [
      {
        icon: 'lotus',
        accent: colors.playful.sky.base,
        label: 'Pranayama is the breath half of yoga, taught for millennia',
      },
      {
        icon: 'waves',
        accent: colors.playful.teal.base,
        label: 'Slow breath steadies your transitions between poses',
      },
      {
        icon: 'meditation',
        accent: colors.playful.amber.base,
        label: 'A few minutes of daily practice deepens post-practice stillness',
      },
    ],
  },
  {
    id: 'heart_health',
    icon: 'heart-bpm',
    accent: colors.playful.coral.base,
    title: 'I want to understand my heart',
    legacyTitles: ['Heart health', 'I want to understand my heart health'],
    body: 'Measure HRV and recovery trends over time.',
    hook: 'Your heart has been waiting for this.',
    goalPhrase: 'look after your heart and recovery',
    assessmentPlan:
      'We’ll start with small plan steps, with short guided Resets and lessons about stress, recovery, and rest.',
    reflectionHeadline: 'See your heart, every day.',
    reflectionBody:
      'HRV is the clearest window into recovery, stress, and long-term cardiovascular health.',
    valuePoints: [
      {
        icon: 'heart-bpm',
        accent: colors.playful.coral.base,
        label: 'HRV predicts recovery better than heart rate alone',
      },
      {
        icon: 'heart-glow',
        accent: colors.playful.sky.base,
        label: 'Higher HRV = ~25% lower cardiovascular risk',
      },
      {
        icon: 'timer',
        accent: colors.playful.amber.base,
        label: 'Trends surface weeks before symptoms appear',
      },
    ],
  },
  {
    id: 'daily_habit',
    icon: 'streak',
    accent: colors.playful.amber.base,
    title: 'Sticking to a routine',
    legacyTitles: ['Build daily habits that actually stick', 'Build daily habits that stick', 'Build habits that stick', 'Build daily habits I can stick to', 'Build daily habits', 'Building a daily habit', 'I procrastinate', 'I keep putting things off', 'I put things off'],
    body: 'Build a daily rhythm that makes starting easier.',
    hook: 'Small reps. Real change.',
    goalPhrase: 'build a daily habit that lasts',
    assessmentPlan:
      'We’ll start with short sessions designed to fit your day and build consistency.',
    reflectionHeadline: 'A practice built to actually last.',
    reflectionBody:
      'Consistency beats intensity. A few focused minutes a day compounds faster than you expect.',
    valuePoints: [
      {
        icon: 'streak',
        accent: colors.playful.amber.base,
        label: 'Habits solidify in ~66 days — Azora tracks every one',
      },
      {
        icon: 'breath-timer',
        accent: colors.playful.teal.base,
        label: '5 min/day beats one long session per week',
      },
      {
        icon: 'sparkle',
        accent: colors.playful.sky.base,
        label: 'Daily cues triple retention vs. willpower alone',
      },
    ],
  },
  {
    id: 'cleaning',
    icon: 'home',
    accent: colors.playful.teal.base,
    title: 'Keeping my home tidy',
    legacyTitles: [
      'Make cleaning my home feel manageable',
      'Keep my home clean',
      'Keep my home under control',
      'Keep my home clean without feeling overwhelmed',
      'Get my home under control',
      'I struggle to keep my space clean',
      'My place is a mess',
      'I have trouble cleaning up my space',
      'My space is getting too messy.',
      'Keeping my space manageable',
      'Making my home feel lighter',
    ],
    body: 'Get unstuck when the mess feels too big to begin.',
    hook: 'Start small. Feel the difference.',
    goalPhrase: 'get started when your space feels overwhelming',
    assessmentPlan:
      'We’ll start with small plan steps, with short guided Resets and lessons about starting small when your space feels like too much.',
    reflectionHeadline: 'One small reset is still a reset.',
    reflectionBody:
      'You do not have to fix everything at once. A calmer body can make one small next step feel possible.',
    valuePoints: [
      {
        icon: 'home',
        accent: colors.playful.teal.base,
        label: 'A reset before the task makes the first step easier to face',
      },
      {
        icon: 'timer',
        accent: colors.playful.sky.base,
        label: 'Small enough to use before one surface, one load, or one room',
      },
      {
        icon: 'sparkle',
        accent: colors.playful.amber.base,
        label: 'Come back without turning a rough day into a clean-everything day',
      },
    ],
  },
];

const OTHER_INTENT_OPTION: IntentOption = {
  id: 'other',
  icon: 'sparkle',
  accent: colors.playful.violet.base,
  title: 'Something else',
  body: 'Something outside these. Azora keeps the basics covered.',
};

const ACTIVE_INTENT_IDS = [
  'cleaning',
  'scrolling',
  'burnout',
  'procrastination',
  'calm_fast',
  'stress_relief',
  'sleep',
  'focus',
  'daily_habit',
] as const;

/** The focused choices new users see in onboarding. */
export const INTENT_OPTIONS: IntentOption[] = ACTIVE_INTENT_IDS.map(
  (id) => PERSONALIZED_INTENT_OPTIONS.find((option) => option.id === id)!,
);

/**
 * All titles ever written to a profile. Retired choices stay here solely so a
 * returning user keeps the plan they originally selected.
 */
export const ONBOARDING_INTENT_LOOKUP_OPTIONS: IntentOption[] = [
  ...PERSONALIZED_INTENT_OPTIONS,
  OTHER_INTENT_OPTION,
];

/**
 * The chosen goal as it is said inside one of the app's sentences — "shaped to
 * help you sleep better". "Something else" has no phrase, and so is not quoted.
 */
export function intentGoalPhrase(id: string | null | undefined): string | null {
  if (id == null) return null;
  return (
    PERSONALIZED_INTENT_OPTIONS.find((option) => option.id === id)?.goalPhrase ??
    null
  );
}

/**
 * The one goal a sentence is allowed to name. The prioritised goal if there is
 * one, otherwise the only goal picked — several goals with no priority between
 * them stays unquoted rather than naming one of three.
 */
export function chosenGoalPhrase(
  primaryIntent: string | null | undefined,
  selectedIntents: readonly string[],
): string | null {
  return (
    intentGoalPhrase(primaryIntent) ??
    (selectedIntents.length === 1 ? intentGoalPhrase(selectedIntents[0]) : null)
  );
}
