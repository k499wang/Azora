import { colors } from '../../../theme/colors';
import type { OnboardingOption } from '../OnboardingOptionList';
import type { OnboardingOptionIconName } from '../OnboardingOptionIcon';
import type { AzoExpression } from '../../../features/mascot/azoFace';
import type { OnboardingIntent } from '../types';

/**
 * The only place the flow asks about one goal more than once.
 *
 * Every goal gets the same three beats — where it lives, what has already been
 * done about it, and what is riding on it — because those are the three things
 * a plan has to know and the three the assessment never asks. All three are
 * authored per goal: "when does it hit" means nothing to someone whose goal is
 * supporting their yoga, and "what has it cost you" answers itself when the
 * goal is sleep and one of the costs on offer is sleep.
 *
 * The third beat is quoted back on the analyze screen, inside
 * `Everything ahead is shaped to help you {goal}, {echoLead} {echo}.` — so a
 * goal you are repairing leads with "and to give you back" and a goal you are
 * building leads with "and to give you".
 */

export interface IntentFollowUpQuestion {
  id: string;
  question: string;
  expression: AzoExpression;
  multiSelect?: boolean;
  /** Third beat only: the clause the analyze screen says before the echo. */
  echoLead?: string;
  options: OnboardingOption<string>[];
}

const accents = [
  colors.playful.sky.base,
  colors.playful.teal.base,
  colors.playful.amber.base,
  colors.playful.violet.base,
  colors.playful.coral.base,
  colors.playful.blush.base,
];

/**
 * Every row is a picture, a title and an `echo` — the same shape as the rest of
 * the question screens, so these read as part of the assessment rather than as
 * a form bolted onto it.
 */
function options(
  entries: readonly (readonly [
    string,
    string,
    string,
    OnboardingOptionIconName,
  ])[],
): OnboardingOption<string>[] {
  return entries.map(([id, title, echo, icon], index) => ({
    id,
    title,
    echo,
    icon,
    accent: accents[index % accents.length],
  }));
}

/**
 * Beat 1 and beat 3 take one answer, because the plan acts on one and a later
 * screen quotes one. Beat 2 takes several, because "what have you tried" is
 * almost never a single thing.
 */
function where(
  id: string,
  question: string,
  entries: Parameters<typeof options>[0],
): IntentFollowUpQuestion {
  return { id, question, expression: 'listening', options: options(entries) };
}

function tried(
  id: string,
  question: string,
  entries: Parameters<typeof options>[0],
): IntentFollowUpQuestion {
  return {
    id,
    question,
    expression: 'thinking',
    multiSelect: true,
    options: options(entries),
  };
}

function stakes(
  id: string,
  question: string,
  echoLead: string,
  entries: Parameters<typeof options>[0],
): IntentFollowUpQuestion {
  return {
    id,
    question,
    expression: 'thinking',
    echoLead,
    options: options(entries),
  };
}

/** Goals you are repairing: the third beat is what it has taken from you. */
const TAKEN_BACK = 'and to give you back';
/** Goals you are building: the third beat is what it would open up. */
const GIVEN = 'and to give you';

interface FollowUpTriad {
  where: IntentFollowUpQuestion;
  tried: IntentFollowUpQuestion;
  stakes: IntentFollowUpQuestion;
}

/**
 * Written for someone who has not picked a goal, or picked "something else" —
 * so nothing here refers to an "it" they never named.
 */
const DEFAULT_TRIAD: FollowUpTriad = {
  where: where('when_default', 'What would you most like to be different?', [
    ['calm', 'Calmer days', 'calmer days', 'waves'],
    ['nights', 'Better nights', 'better nights', 'moon'],
    ['head', 'A clearer head', 'a clearer head', 'sparkle'],
    ['energy', 'More left in the tank', 'more left in the tank', 'battery-low'],
    ['body', 'A body I look after', 'a body you look after', 'heart-pulse'],
    ['habit', 'A habit I actually keep', 'a habit you actually keep', 'streak'],
  ]),
  tried: tried('tried_default', 'What have you already tried?', [
    ['apps', 'Other apps', 'other apps', 'dots-horizontal-circle-outline'],
    ['meditation', 'Meditation', 'meditation', 'meditation'],
    ['exercise_habit', 'Moving more', 'moving more', 'run'],
    ['therapy', 'Therapy or coaching', 'therapy', 'book'],
    ['supplements', 'Supplements', 'supplements', 'sparkle'],
    ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
  ]),
  stakes: stakes('stakes_default', 'What would that change most?', TAKEN_BACK, [
    ['mornings', 'How my mornings start', 'your mornings', 'weather-sunset-up'],
    ['patience', 'My patience with people I love', 'your patience with the people you love', 'heart-outline'],
    ['work', 'My focus at work', 'your focus at work', 'laptop'],
    ['enjoyment', 'Enjoying things I used to', 'the things you used to enjoy', 'emoticon-sad-outline'],
    ['health', 'My health, long term', 'your health', 'heart-pulse'],
    ['time', 'Time I will not get back', 'time you will not get back', 'clock-fast'],
  ]),
};

const TRIADS: Record<
  Exclude<OnboardingIntent, 'other'>,
  FollowUpTriad
> = {
  stress_relief: {
    where: where('when_stress', 'When is the stress at its worst?', [
      ['morning', 'Before the day has started', 'it starts before the day does', 'weather-sunset-up'],
      ['work', 'While you are working', 'work is when it peaks', 'laptop'],
      ['evening', 'Once things go quiet', 'it arrives once things go quiet', 'weather-night'],
      ['night', 'When you are trying to sleep', 'it peaks when you are trying to sleep', 'bed-outline'],
      ['constant', 'It never really lifts', 'it never really lifts', 'waves'],
    ]),
    tried: tried('tried_stress', 'What have you tried to bring it down?', [
      ['apps', 'Other apps', 'other apps', 'dots-horizontal-circle-outline'],
      ['meditation', 'Meditation', 'meditation', 'meditation'],
      ['exercise_habit', 'Moving more', 'moving more', 'run'],
      ['therapy', 'Therapy or coaching', 'therapy', 'book'],
      ['drinking', 'A drink to take the edge off', 'a drink to take the edge off', 'coffee-outline'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_stress', 'What has the stress taken from you?', TAKEN_BACK, [
      ['patience', 'My patience with people I love', 'your patience with the people you love', 'heart-outline'],
      ['sleep', 'My sleep', 'your sleep', 'moon'],
      ['work', 'My focus at work', 'your focus at work', 'laptop'],
      ['enjoyment', 'Enjoying things I used to', 'the things you used to enjoy', 'emoticon-sad-outline'],
      ['health', 'My health', 'your health', 'heart-pulse'],
      ['time', 'Time I will not get back', 'time you will not get back', 'clock-fast'],
    ]),
  },
  calm_fast: {
    where: where('when_spike', 'What sets the spikes off most?', [
      ['people', 'Being around people', 'being around people', 'emoticon-confused-outline'],
      ['performance', 'Speaking or performing', 'having to perform', 'star'],
      ['conflict', 'Conflict or confrontation', 'conflict', 'alert-circle-outline'],
      ['deadlines', 'Deadlines and pressure', 'deadlines', 'timer'],
      ['nowhere', 'They come out of nowhere', 'spikes that come from nowhere', 'weather-windy'],
    ]),
    tried: tried('tried_spike', 'What do you usually do when one hits?', [
      ['wait', 'Wait it out', 'waiting it out', 'clock-fast'],
      ['leave', 'Leave the room', 'leaving the room', 'home'],
      ['breathe', 'Try to breathe through it', 'breathing through it', 'breath-leaf'],
      ['distract', 'Distract yourself', 'distracting yourself', 'blur'],
      ['nothing', 'Nothing that works', 'nothing that has worked', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_spike', 'What do the spikes cost you?', TAKEN_BACK, [
      ['voice', 'Saying what I actually think', 'the things you did not say', 'emoticon-confused-outline'],
      ['avoid', 'Rooms I have started avoiding', 'the rooms you have been avoiding', 'home'],
      ['day', 'The rest of the day after one', 'the rest of the day after one', 'clock-fast'],
      ['sleep', 'Sleep that night', 'your sleep', 'moon'],
      ['trust', 'Trusting myself to hold it together', 'trust in yourself to hold it together', 'target'],
    ]),
  },
  sleep: {
    where: where('when_sleep', 'Which part of the night goes wrong?', [
      ['falling', 'Falling asleep takes forever', 'falling asleep takes forever', 'moon-waning-crescent'],
      ['waking', 'You wake in the night', 'you wake in the night', 'alarm-snooze'],
      ['early', 'You wake too early', 'you wake too early', 'weather-sunset-up'],
      ['unrested', 'You sleep, but wake unrested', 'you wake unrested', 'battery-low'],
      ['all', 'All of it', 'the whole night is a fight', 'weather-pouring'],
    ]),
    tried: tried('tried_sleep', 'What have you already tried for it?', [
      ['melatonin', 'Melatonin or sleep aids', 'sleep aids', 'sparkle'],
      ['screens', 'Cutting screens at night', 'cutting screens at night', 'laptop'],
      ['caffeine', 'Cutting caffeine', 'cutting caffeine', 'coffee-outline'],
      ['schedule', 'A stricter bedtime', 'a stricter bedtime', 'bed-clock'],
      ['apps', 'Other apps', 'other apps', 'dots-horizontal-circle-outline'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_sleep', 'What do the bad nights spill into?', TAKEN_BACK, [
      ['mornings', 'My mornings', 'your mornings', 'weather-sunset-up'],
      ['work', 'My focus at work', 'your focus at work', 'laptop'],
      ['patience', 'My patience with people I love', 'your patience with the people you love', 'heart-outline'],
      ['mood', 'My mood, all day', 'your mood for the whole day', 'emoticon-neutral-outline'],
      ['training', 'Training and recovery', 'your training', 'dumbbell'],
      ['health', 'My health, long term', 'your health', 'heart-pulse'],
    ]),
  },
  focus: {
    where: where('when_focus', 'Where does your focus go?', [
      ['starting', 'You cannot get started', 'starting is the hard part', 'help-circle-outline'],
      ['minutes', 'It lasts a few minutes', 'focus lasts a few minutes', 'timer'],
      ['afternoon', 'It dies in the afternoon', 'the afternoon is where it dies', 'battery-low'],
      ['phone', 'Your phone takes it', 'your phone takes it', 'blur'],
      ['racing', 'Your head is too busy', 'your head is too busy', 'waves'],
    ]),
    tried: tried('tried_focus', 'What have you leaned on so far?', [
      ['caffeine', 'Caffeine', 'caffeine', 'coffee-outline'],
      ['blockers', 'App blockers', 'app blockers', 'shield-alert-outline'],
      ['timers', 'Timers and pomodoros', 'timers', 'breath-timer'],
      ['lists', 'Lists and planners', 'lists', 'file-document-outline'],
      ['medication', 'Medication', 'medication', 'stethoscope'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_focus', 'What does that end up costing?', TAKEN_BACK, [
      ['evenings', 'Work that drags into my evenings', 'your evenings', 'weather-night'],
      ['results', 'Grades or results', 'the results you are working for', 'star'],
      ['behind', 'Feeling behind all the time', 'the feeling of being on top of it', 'emoticon-confused-outline'],
      ['confidence', 'My confidence', 'your confidence', 'target'],
      ['people', 'Time with the people I like', 'time with the people you like', 'heart-outline'],
      ['time', 'Time I will not get back', 'time you will not get back', 'clock-fast'],
    ]),
  },
  energy: {
    where: where('when_energy', 'When does the energy run out?', [
      ['morning', 'You wake up already flat', 'you wake up already flat', 'weather-sunset-up'],
      ['midday', 'Around the middle of the day', 'the middle of the day empties you', 'white-balance-sunny'],
      ['afternoon', 'The afternoon crash', 'the afternoon crash', 'battery-low'],
      ['evening', 'By the evening there is nothing left', 'evenings have nothing left', 'weather-night'],
      ['constant', 'It is low all day', 'it stays low all day', 'blur'],
    ]),
    tried: tried('tried_energy', 'What have you leaned on so far?', [
      ['caffeine', 'Caffeine', 'caffeine', 'coffee-outline'],
      ['sugar', 'Sugar or energy drinks', 'energy drinks', 'sparkle'],
      ['napping', 'Naps', 'naps', 'sleep'],
      ['exercise_habit', 'Moving more', 'moving more', 'run'],
      ['supplements', 'Supplements', 'supplements', 'lotus'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_energy', 'What does the tiredness take first?', TAKEN_BACK, [
      ['evenings', 'My evenings', 'your evenings', 'weather-night'],
      ['training', 'Training and moving', 'your training', 'dumbbell'],
      ['patience', 'My patience with people I love', 'your patience with the people you love', 'heart-outline'],
      ['work', 'My focus at work', 'your focus at work', 'laptop'],
      ['enjoyment', 'Enjoying things I used to', 'the things you used to enjoy', 'emoticon-sad-outline'],
      ['plans', 'Plans I end up cancelling', 'the plans you keep cancelling', 'calendar-check-outline'],
    ]),
  },
  self_acceptance: {
    where: where('when_critic', 'When is the inner critic loudest?', [
      ['mistake', 'Right after I get something wrong', 'it is loudest right after a mistake', 'alert-circle-outline'],
      ['comparing', 'When I measure myself against people', 'comparison sets it off', 'emoticon-confused-outline'],
      ['mirror', 'When I catch my reflection', 'your reflection sets it off', 'emoticon-neutral-outline'],
      ['quiet', 'Once the day goes quiet', 'it arrives once the day goes quiet', 'weather-night'],
      ['always', 'It is running most of the time', 'it runs most of the time', 'waves'],
    ]),
    tried: tried('tried_critic', 'What have you tried to quiet it?', [
      ['therapy', 'Therapy or coaching', 'therapy', 'book'],
      ['journaling', 'Writing it down', 'writing it down', 'pencil'],
      ['meditation', 'Meditation', 'meditation', 'meditation'],
      ['affirmations', 'Affirmations', 'affirmations', 'sparkle'],
      ['talking', 'Talking to people who know me', 'talking to the people who know you', 'heart-outline'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_critic', 'What does it stop you doing?', TAKEN_BACK, [
      ['chances', 'Taking chances', 'the chances you talk yourself out of', 'star'],
      ['rest', 'Resting without guilt', 'rest without the guilt', 'sleep'],
      ['close', 'Letting people close', 'letting people close', 'heart-outline'],
      ['credit', 'Enjoying what I have done', 'credit for what you have already done', 'emoticon-happy-outline'],
      ['voice', 'Saying what I actually want', 'the things you do not say', 'emoticon-confused-outline'],
    ]),
  },
  emotional_balance: {
    where: where('when_wave', 'What sets the big feelings off?', [
      ['conflict', 'Conflict with someone', 'conflict sets it off', 'alert-circle-outline'],
      ['criticised', 'Feeling criticised', 'feeling criticised sets it off', 'shield-alert-outline'],
      ['overload', 'Too much arriving at once', 'too much arriving at once', 'waves'],
      ['letdown', 'Being let down', 'being let down', 'emoticon-sad-outline'],
      ['nowhere', 'They arrive with no warning', 'waves that arrive with no warning', 'weather-windy'],
    ]),
    tried: tried('tried_wave', 'What do you do when one takes over?', [
      ['push', 'Push it down', 'pushing it down', 'blur'],
      ['talk', 'Talk it out', 'talking it out', 'heart-outline'],
      ['write', 'Write it down', 'writing it down', 'pencil'],
      ['walk', 'Walk it off', 'walking it off', 'walk'],
      ['wait', 'Wait for it to pass', 'waiting for it to pass', 'clock-fast'],
      ['nothing', 'Nothing that works', 'nothing that has worked', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_wave', 'What do the big waves cost you?', TAKEN_BACK, [
      ['words', 'Things I said and regret', 'the words you would take back', 'emoticon-sad-outline'],
      ['hours', 'The hours after one', 'the hours that go after one', 'clock-fast'],
      ['distance', 'People keeping their distance', 'the distance it puts between you and people', 'emoticon-confused-outline'],
      ['sleep', 'Sleep that night', 'your sleep', 'moon'],
      ['trust', 'Trusting my own reactions', 'trust in your own reactions', 'target'],
    ]),
  },
  self_care: {
    where: where('when_time', 'What eats the time first?', [
      ['work', 'Work', 'work takes it first', 'laptop'],
      ['others', 'Family and everyone else', 'everyone else takes it first', 'heart-outline'],
      ['chores', 'Chores that never end', 'chores take it first', 'broom'],
      ['phone', 'My phone', 'your phone takes it first', 'blur'],
      ['guilt', 'Guilt for taking any', 'guilt for taking any', 'emoticon-sad-outline'],
    ]),
    tried: tried('tried_time', 'What have you tried to protect it?', [
      ['calendar', 'Blocking it out in my calendar', 'blocking it out in your calendar', 'calendar-check-outline'],
      ['earlier', 'Getting up before everyone', 'getting up before everyone', 'sunrise'],
      ['saying_no', 'Saying no more often', 'saying no more often', 'shield-alert-outline'],
      ['hobby', 'A hobby or a class', 'a hobby or a class', 'star'],
      ['apps', 'Other apps', 'other apps', 'dots-horizontal-circle-outline'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_time', 'What would a few minutes a day protect?', TAKEN_BACK, [
      ['evenings', 'My evenings', 'your evenings', 'weather-night'],
      ['patience', 'My patience with people I love', 'your patience with the people you love', 'heart-outline'],
      ['mornings', 'My mornings', 'your mornings', 'weather-sunset-up'],
      ['myself', 'Feeling like myself', 'the feeling of being yourself again', 'face-happy'],
      ['health', 'My health, long term', 'your health', 'heart-pulse'],
    ]),
  },
  spiritual: {
    where: where('when_practice', 'What does your practice need most?', [
      ['starting', 'Getting to it at all', 'getting to it at all', 'calendar-check-outline'],
      ['noise', 'Quieting the noise first', 'quieting the noise before you begin', 'waves'],
      ['staying', 'Staying with it longer', 'staying with it longer', 'timer'],
      ['carrying', 'Carrying it into the day', 'carrying it into the day', 'walk'],
      ['returning', 'A way back after a long gap', 'a way back after a long gap', 'arrow-up'],
    ]),
    tried: tried('tried_practice', 'What does your practice look like now?', [
      ['meditation', 'Meditation', 'meditation', 'meditation'],
      ['prayer', 'Prayer', 'prayer', 'heart-glow'],
      ['yoga', 'Yoga', 'yoga', 'yoga'],
      ['reading', 'Reading or study', 'reading and study', 'book'],
      ['outdoors', 'Time outdoors', 'time outdoors', 'walk'],
      ['nothing', 'Nothing regular yet', 'nothing regular yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_practice', 'What would more stillness open up?', GIVEN, [
      ['kept', 'A practice I actually keep', 'a practice you actually keep', 'streak'],
      ['presence', 'Presence with the people in front of me', 'presence with the people in front of you', 'heart-outline'],
      ['quiet', 'A quieter head', 'a quieter head', 'waves'],
      ['space', 'Space before I react', 'space before you react', 'timer'],
      ['connected', 'Feeling connected again', 'the sense of being connected again', 'sparkle'],
    ]),
  },
  yoga: {
    where: where('when_mat', 'Where does your practice need the breath most?', [
      ['holds', 'Holding the hard poses', 'holding the hard poses', 'yoga'],
      ['transitions', 'Transitions between poses', 'your transitions', 'waves'],
      ['savasana', 'Stillness at the end', 'the stillness at the end', 'lotus'],
      ['starting', 'Getting on the mat at all', 'getting on the mat at all', 'calendar-check-outline'],
      ['offmat', 'Carrying it off the mat', 'carrying it off the mat', 'walk'],
    ]),
    tried: tried('tried_mat', 'How does your practice run right now?', [
      ['studio', 'A studio or a class', 'classes at a studio', 'home'],
      ['home', 'At home, following videos', 'practising at home', 'laptop'],
      ['selfled', 'Self-led on the mat', 'a self-led practice', 'yoga'],
      ['pranayama', 'Some pranayama already', 'the pranayama you already do', 'breath-leaf'],
      ['onoff', 'On and off', 'an on-and-off practice', 'clock-fast'],
      ['starting_out', 'Just starting out', 'a practice you are just starting', 'sparkle'],
    ]),
    stakes: stakes('stakes_mat', 'What would steadier breath unlock?', GIVEN, [
      ['longer', 'Longer holds', 'longer holds', 'timer'],
      ['calm', 'Calm in the hard postures', 'calm in the hard postures', 'breath-leaf'],
      ['savasana', 'A deeper savasana', 'a deeper savasana', 'sleep'],
      ['often', 'Getting to the mat more often', 'a practice you get to more often', 'streak'],
      ['offmat', 'The same calm off the mat', 'the same calm off the mat', 'walk'],
    ]),
  },
  heart_health: {
    where: where('when_heart', 'What made you want to watch your heart?', [
      ['checkup', 'A check-up or a number I did not like', 'a number you did not like', 'stethoscope'],
      ['family', 'It runs in my family', 'what runs in your family', 'heart-outline'],
      ['chest', 'Stress I can feel in my chest', 'the stress you feel in your chest', 'heart-pulse'],
      ['training', 'Training and recovery', 'your training and recovery', 'dumbbell'],
      ['ahead', 'Getting ahead of it', 'getting ahead of it', 'shield-alert-outline'],
    ]),
    tried: tried('tried_heart', 'What are you tracking it with now?', [
      ['wearable', 'A watch or a ring', 'the watch you already wear', 'heart-bpm'],
      ['bp', 'Blood pressure at home', 'blood pressure at home', 'heart-pulse'],
      ['bloodwork', 'Check-ups and bloodwork', 'check-ups and bloodwork', 'stethoscope'],
      ['lifestyle', 'Exercise and what I eat', 'exercise and what you eat', 'run'],
      ['nothing', 'Nothing yet, I go on feel', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_heart', 'What would seeing it every day give you?', GIVEN, [
      ['proof', 'Proof that it is working', 'proof that it is working', 'target'],
      ['warning', 'Warning before something does', 'warning before something does', 'alert-circle-outline'],
      ['recovery', 'Confidence in how I am recovering', 'confidence in how you are recovering', 'heart-glow'],
      ['doctor', 'Something to show my doctor', 'something to show your doctor', 'stethoscope'],
      ['worry', 'One less thing to worry about', 'one less thing to worry about', 'emoticon-happy-outline'],
    ]),
  },
  daily_habit: {
    where: where('when_break', 'Where do your habits usually break?', [
      ['weekends', 'Weekends', 'weekends are where it breaks', 'calendar-check-outline'],
      ['missed', 'After one missed day', 'one missed day ends it', 'alarm-snooze'],
      ['busy', 'When work gets heavy', 'a heavy week ends it', 'laptop'],
      ['travel', 'Travel and odd weeks', 'travel ends it', 'clock-fast'],
      ['fortnight', 'After the first week or two', 'it fades after a week or two', 'timer'],
    ]),
    tried: tried('tried_habit', 'What have you tried to make things stick?', [
      ['streaks', 'Streaks and trackers', 'streaks and trackers', 'streak'],
      ['reminders', 'Reminders and alarms', 'reminders and alarms', 'alarm-snooze'],
      ['stacking', 'Pinning it to something I already do', 'pinning it to something you already do', 'arrow-up'],
      ['together', 'Doing it with someone', 'doing it with someone', 'heart-outline'],
      ['apps', 'Other apps', 'other apps', 'dots-horizontal-circle-outline'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_habit', 'What would sticking with it change?', GIVEN, [
      ['mornings', 'How my mornings start', 'a morning that starts right', 'sunrise'],
      ['friday', 'How I feel by Friday', 'something left by Friday', 'battery-low'],
      ['trust', 'Trusting myself to follow through', 'trust in yourself to follow through', 'target'],
      ['rest', 'Everything else I want to build', 'the other things you want to build', 'star'],
      ['health', 'My health, long term', 'a run at your long-term health', 'heart-pulse'],
    ]),
  },
};

/** Where it lives, what has been tried, what is riding on it — always three. */
export function intentFollowUpsFor(
  intent: OnboardingIntent | null,
): IntentFollowUpQuestion[] {
  const triad =
    intent == null || intent === 'other'
      ? DEFAULT_TRIAD
      : TRIADS[intent];
  return [triad.where, triad.tried, triad.stakes];
}
