import { colors } from '../../../theme/colors';
import type { IntentOption, PersonalizedIntentOption } from '../types';

export const PERSONALIZED_INTENT_OPTIONS: PersonalizedIntentOption[] = [
  {
    id: 'stress_relief',
    icon: 'waves',
    accent: colors.playful.teal.base,
    title: 'I feel overwhelmed all the time',
    legacyTitles: [
      'Reduce stress',
      'I’m overwhelmed all the time',
      'Always overwhelmed',
      'Everything feels like too much',
    ],
    body: 'Settle your nervous system in a few minutes.',
    hook: "Stress doesn't stand a chance.",
    goalPhrase: 'reduce stress',
    assessmentPlan:
      'We’ll start with slow exhales and short daily resets.',
    reflectionHeadline: 'Lower stress in one session.',
    reflectionBody:
      "Your body is built to calm down. You're just giving it permission.",
    valuePoints: [
      {
        icon: 'waves',
        accent: colors.playful.teal.base,
        label: 'Heart rate slows in under 60 seconds',
      },
      {
        icon: 'breath-timer',
        accent: colors.playful.sky.base,
        label: '5 min/day cuts cortisol up to 25%',
      },
      {
        icon: 'meditation',
        accent: colors.playful.amber.base,
        label: 'Stress nearly halved after 8 weeks',
      },
    ],
  },
  {
    id: 'calm_fast',
    icon: 'timer',
    accent: colors.playful.amber.base,
    title: 'I keep overthinking everything',
    legacyTitles: [
      'Calm down fast',
      'My thoughts won’t slow down',
      'Racing thoughts',
      'I get overwhelmed and can’t start.',
    ],
    body: 'Find one small next step when everything feels like too much.',
    hook: 'Relief in under a minute.',
    goalPhrase: 'calm down quickly when stress spikes',
    assessmentPlan:
      'We’ll start with quick calming techniques for stressful moments.',
    reflectionHeadline: 'Calm, on demand.',
    reflectionBody:
      'One round of slow exhales can pull your body out of alarm mode in about a minute.',
    valuePoints: [
      {
        icon: 'timer',
        accent: colors.playful.amber.base,
        label: 'A minute of slow exhales settles the alarm response',
      },
      {
        icon: 'waves',
        accent: colors.playful.sky.base,
        label: 'Heart rate starts dropping within seconds',
      },
      {
        icon: 'sparkle',
        accent: colors.playful.teal.base,
        label: 'Works anywhere — before a call, mid-argument, on the train',
      },
    ],
  },
  {
    id: 'sleep',
    icon: 'moon',
    accent: colors.playful.sky.base,
    title: 'I can’t switch off at night',
    legacyTitles: ['Sleep better', 'Can’t switch off'],
    body: 'Build a slower rhythm before rest.',
    hook: 'Tonight can already feel different.',
    goalPhrase: 'sleep better',
    assessmentPlan:
      'We’ll start with a gentle evening reset that helps your body wind down.',
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
    title: 'Work or school is piling up',
    legacyTitles: ['Focus & study', 'I can’t get myself to focus', 'Can’t focus'],
    body: 'Make starting feel smaller when your work is waiting.',
    hook: 'Clear head, sharper recall.',
    goalPhrase: 'stay focused while you work or study',
    assessmentPlan:
      'We’ll start with steady resets that quiet mental noise before work or study.',
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
    title: 'I have no energy to do anything',
    legacyTitles: [
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
    title: 'I can’t keep up with myself',
    legacyTitles: ['Steady my emotions', 'I feel everything too intensely', 'Big emotions'],
    body: 'Ride out big feelings without being swept away by them.',
    hook: 'Feel it without drowning in it.',
    goalPhrase: 'steady your emotions',
    assessmentPlan:
      'We’ll start with longer exhales, the fastest way to take the edge off a spike.',
    reflectionHeadline: 'The wave passes sooner than you think.',
    reflectionBody:
      'Emotions move through the body first. Lengthening your exhale gives the surge somewhere to go before it takes over.',
    valuePoints: [
      {
        icon: 'waves',
        accent: colors.playful.sky.base,
        label: 'Long exhales pull the body out of alarm mode',
      },
      {
        icon: 'face-calm',
        accent: colors.playful.teal.base,
        label: 'A steadier body makes room for a steadier reaction',
      },
      {
        icon: 'heart-bpm',
        accent: colors.playful.coral.base,
        label: 'Higher HRV tracks with better emotional regulation',
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
      'We’ll start with mindful resets that quiet the noise and deepen stillness.',
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
      'We’ll start with a resonance reset to support HRV and recovery.',
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
    title: 'I keep putting things off',
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
    title: 'I have trouble cleaning up my space',
    legacyTitles: ['My space is getting too messy.'],
    body: 'Get unstuck when the mess feels too big to begin.',
    hook: 'Start small. Feel the difference.',
    goalPhrase: 'get started when your space feels overwhelming',
    assessmentPlan:
      'We’ll start with short resets that help you begin before the mess feels bigger.',
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
  'focus',
  'cleaning',
  'stress_relief',
  'calm_fast',
  'emotional_balance',
  'sleep',
  'energy',
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
