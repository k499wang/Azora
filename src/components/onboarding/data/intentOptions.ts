import { colors } from '../../../theme/colors';
import type { IntentOption, PersonalizedIntentOption } from '../types';

export const PERSONALIZED_INTENT_OPTIONS: PersonalizedIntentOption[] = [
  {
    id: 'stress_relief',
    icon: 'waves',
    accent: colors.success[700],
    title: 'Reduce stress',
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
        accent: colors.success[700],
        label: 'Heart rate slows in under 60 seconds',
      },
      {
        icon: 'breath-timer',
        accent: colors.primary.blue600,
        label: '5 min/day cuts cortisol up to 25%',
      },
      {
        icon: 'meditation',
        accent: colors.orange[600],
        label: 'Stress nearly halved after 8 weeks',
      },
    ],
  },
  {
    id: 'calm_fast',
    icon: 'timer',
    accent: colors.orange[600],
    title: 'Calm down fast',
    body: 'Settle spikes of stress or nerves in the moment.',
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
        accent: colors.orange[600],
        label: 'A minute of slow exhales settles the alarm response',
      },
      {
        icon: 'waves',
        accent: colors.primary.blue600,
        label: 'Heart rate starts dropping within seconds',
      },
      {
        icon: 'sparkle',
        accent: colors.success[700],
        label: 'Works anywhere — before a call, mid-argument, on the train',
      },
    ],
  },
  {
    id: 'sleep',
    icon: 'moon',
    accent: colors.primary.blue600,
    title: 'Sleep better',
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
        accent: colors.primary.blue600,
        label: 'Fall asleep up to 37% faster',
      },
      {
        icon: 'breath-timer',
        accent: colors.success[700],
        label: 'A 10 min wind down lifts HRV before bed',
      },
      {
        icon: 'streak',
        accent: colors.orange[600],
        label: 'Add up to 20 min of deep sleep per night',
      },
    ],
  },
  {
    id: 'focus',
    icon: 'meditation',
    accent: colors.primary.blue600,
    title: 'Focus & study',
    body: 'Steady your mind for deep work and exams.',
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
        accent: colors.primary.blue600,
        label: 'A 90-second reset sharpens attention fast',
      },
      {
        icon: 'book',
        accent: colors.success[700],
        label: 'Lower anxiety improves memory and recall',
      },
      {
        icon: 'streak',
        accent: colors.orange[600],
        label: 'Steadier focus across longer study sessions',
      },
    ],
  },
  {
    id: 'energy',
    icon: 'sun',
    accent: colors.orange[600],
    title: 'Boost energy',
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
        accent: colors.orange[600],
        label: 'An energizing reset raises alertness in minutes',
      },
      {
        icon: 'waves',
        accent: colors.primary.blue600,
        label: 'A cleaner lift, no caffeine crash',
      },
      {
        icon: 'heart-glow',
        accent: colors.error[700],
        label: 'A repeatable lift you control any time of day',
      },
    ],
  },
  {
    id: 'spiritual',
    icon: 'arrow-up',
    accent: colors.primary.blue600,
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
        accent: colors.primary.blue600,
        label: 'Slowing down deepens meditative focus',
      },
      {
        icon: 'meditation',
        accent: colors.success[700],
        label: 'Used in yoga and mindfulness for thousands of years',
      },
      {
        icon: 'sparkle',
        accent: colors.orange[600],
        label: 'A few mindful minutes bring you back to now',
      },
    ],
  },
  {
    id: 'yoga',
    icon: 'lotus',
    accent: colors.primary.blue600,
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
        accent: colors.primary.blue600,
        label: 'Pranayama is the breath half of yoga, taught for millennia',
      },
      {
        icon: 'waves',
        accent: colors.success[700],
        label: 'Slow breath steadies your transitions between poses',
      },
      {
        icon: 'meditation',
        accent: colors.orange[600],
        label: 'A few minutes of daily practice deepens post-practice stillness',
      },
    ],
  },
  {
    id: 'heart_health',
    icon: 'heart-bpm',
    accent: colors.error[700],
    title: 'Heart health',
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
        accent: colors.error[700],
        label: 'HRV predicts recovery better than heart rate alone',
      },
      {
        icon: 'heart-glow',
        accent: colors.primary.blue600,
        label: 'Higher HRV = ~25% lower cardiovascular risk',
      },
      {
        icon: 'timer',
        accent: colors.orange[600],
        label: 'Trends surface weeks before symptoms appear',
      },
    ],
  },
  {
    id: 'daily_habit',
    icon: 'streak',
    accent: colors.orange[600],
    title: 'Daily habit',
    body: 'Build a steady daily practice you return to.',
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
        accent: colors.orange[600],
        label: 'Habits solidify in ~66 days — Azora tracks every one',
      },
      {
        icon: 'breath-timer',
        accent: colors.success[700],
        label: '5 min/day beats one long session per week',
      },
      {
        icon: 'sparkle',
        accent: colors.primary.blue600,
        label: 'Daily cues triple retention vs. willpower alone',
      },
    ],
  },
];

const OTHER_INTENT_OPTION: IntentOption = {
  id: 'other',
  icon: 'sparkle',
  accent: colors.warning[700],
  title: 'Something else',
  body: 'Something outside these. Azora keeps the basics covered.',
};

export const INTENT_OPTIONS: IntentOption[] = [
  ...PERSONALIZED_INTENT_OPTIONS,
  OTHER_INTENT_OPTION,
];
