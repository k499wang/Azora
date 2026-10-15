import { colors } from '../../../theme/colors';
import type { OnboardingOption } from '../OnboardingOptionList';
import type { OnboardingOptionIconName } from '../OnboardingOptionIcon';
import type { AzoExpression } from '../../../features/mascot/azoFace';
import type { OnboardingIntent } from '../types';

/**
 * Goal-specific follow-ups, with three extra context questions for cleaning.
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
    ['calm', 'Calmer days', 'you want calmer days', 'waves'],
    ['nights', 'Better nights', 'you want better nights', 'moon'],
    ['head', 'A clearer head', 'you want a clearer head', 'sparkle'],
    ['energy', 'More left in the tank', 'you want more left in the tank', 'battery-low'],
    ['body', 'A body I look after', 'you want to look after your body', 'heart-pulse'],
    ['habit', 'A habit I actually keep', 'you want a habit you actually keep', 'streak'],
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
    ['evenings', 'My evenings', 'your evenings', 'weather-night'],
  ]),
};

const TRIADS: Record<
  Exclude<OnboardingIntent, 'other'>,
  FollowUpTriad
> = {
  stress_relief: {
    where: where('when_stress', 'When does your stress all pile up?', [
      ['morning', 'Before the day has even started', 'it starts before the day does', 'weather-sunset-up'],
      ['work', 'Work, messages, or life admin', 'work, messages, or life admin pile up', 'laptop'],
      ['evening', 'When I get home to more to do', 'coming home to more to do is when it piles up', 'weather-night'],
      ['night', 'When I finally stop moving', 'stopping is when it all catches up with you', 'bed-outline'],
      ['constant', 'It never really stops', 'it never really stops', 'waves'],
    ]),
    tried: tried('tried_stress', 'What have you tried to get on top of it?', [
      ['apps', 'Other apps', 'other apps', 'dots-horizontal-circle-outline'],
      ['meditation', 'Meditation', 'meditation', 'meditation'],
      ['exercise_habit', 'Moving more', 'moving more', 'run'],
      ['therapy', 'Therapy or coaching', 'therapy', 'book'],
      ['drinking', 'A drink to take the edge off', 'a drink to take the edge off', 'coffee-outline'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_stress', 'What is overwhelm taking from you?', TAKEN_BACK, [
      ['patience', 'My patience with people I love', 'your patience with the people you love', 'heart-outline'],
      ['sleep', 'My sleep', 'your sleep', 'moon'],
      ['work', 'My focus at work', 'your focus at work', 'laptop'],
      ['enjoyment', 'Enjoying things I used to', 'the things you used to enjoy', 'emoticon-sad-outline'],
      ['health', 'My health', 'your health', 'heart-pulse'],
      ['time', 'Time I will not get back', 'time you will not get back', 'clock-fast'],
    ]),
  },
  calm_fast: {
    where: where('when_spike', 'When does your brain start spiralling?', [
      ['people', 'Around other people', 'being around people starts the spiral', 'emoticon-confused-outline'],
      ['performance', 'Before I have to show up', 'having to show up starts the spiral', 'star'],
      ['conflict', 'After conflict or a hard text', 'conflict or a hard text starts the spiral', 'alert-circle-outline'],
      ['deadlines', 'When the pressure is on', 'pressure starts the spiral', 'timer'],
      ['nowhere', 'It comes out of nowhere', 'the spiral comes out of nowhere', 'weather-windy'],
    ]),
    tried: tried('tried_spike', 'What do you do when it hits?', [
      ['wait', 'Wait it out', 'waiting it out', 'clock-fast'],
      ['leave', 'Leave the room', 'leaving the room', 'home'],
      ['breathe', 'Try to breathe through it', 'breathing through it', 'breath-leaf'],
      ['distract', 'Distract myself', 'distracting yourself', 'blur'],
      ['nothing', 'Nothing that works', 'nothing that has worked', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_spike', 'What does a spiral steal from you?', TAKEN_BACK, [
      ['voice', 'Saying what I actually think', 'the things you did not say', 'emoticon-confused-outline'],
      ['avoid', 'Places I have started avoiding', 'the places you have been avoiding', 'home'],
      ['day', 'The rest of the day after one', 'the rest of the day after one', 'clock-fast'],
      ['sleep', 'Sleep that night', 'your sleep', 'moon'],
      ['trust', 'Trusting myself to hold it together', 'trust in yourself to hold it together', 'target'],
    ]),
  },
  sleep: {
    where: where('when_sleep', 'Which part of sleep is hardest for you?', [
      ['falling', 'Falling asleep', 'falling asleep feels difficult', 'moon-waning-crescent'],
      ['waking', 'Staying asleep', 'you wake during the night', 'alarm-snooze'],
      ['tooEarly', 'Waking too early', 'you wake earlier than you want', 'weather-sunset-up'],
      ['unrested', 'Waking up unrested', 'you wake up feeling unrested', 'battery-low'],
      ['all', 'Several of these', 'more than one part of sleep feels difficult', 'weather-pouring'],
    ]),
    tried: tried('tried_sleep', 'What have you already tried to improve your sleep?', [
      ['melatonin', 'Melatonin or sleep aids', 'sleep aids', 'sparkle'],
      ['screens', 'Cutting screens at night', 'cutting screens at night', 'laptop'],
      ['caffeine', 'Cutting caffeine', 'cutting caffeine', 'coffee-outline'],
      ['schedule', 'A stricter bedtime', 'a stricter bedtime', 'bed-clock'],
      ['apps', 'Other apps', 'other apps', 'dots-horizontal-circle-outline'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_sleep', 'What would better sleep help you with most?', TAKEN_BACK, [
      ['mornings', 'My mornings', 'your mornings', 'weather-sunset-up'],
      ['work', 'My focus at work', 'your focus at work', 'laptop'],
      ['patience', 'My patience with people I love', 'your patience with the people you love', 'heart-outline'],
      ['mood', 'My mood, all day', 'your mood for the whole day', 'emoticon-neutral-outline'],
      ['training', 'Training and recovery', 'your training', 'dumbbell'],
      ['health', 'My health, long term', 'your health', 'heart-pulse'],
    ]),
  },
  focus: {
    where: where('when_focus', 'What happens when you try to start?', [
      ['starting', 'I avoid it until it is urgent', 'getting started is the hard part', 'help-circle-outline'],
      ['minutes', 'I open it, then drift', 'focus slips away once you begin', 'timer'],
      ['afternoon', 'One interruption derails me', 'an interruption derails you', 'battery-low'],
      ['phone', 'My phone wins every time', 'your phone keeps pulling you away', 'blur'],
      ['racing', 'My mind is already too loud', 'your mind is already too loud', 'waves'],
    ]),
    tried: tried('tried_focus', 'What have you tried to make yourself focus?', [
      ['caffeine', 'Caffeine', 'caffeine', 'coffee-outline'],
      ['blockers', 'App blockers', 'app blockers', 'shield-alert-outline'],
      ['timers', 'Timers and pomodoros', 'timers', 'breath-timer'],
      ['lists', 'Lists I stop checking', 'lists', 'file-document-outline'],
      ['medication', 'Medication or professional support', 'medication or professional support', 'stethoscope'],
      ['nothing', 'Nothing has stuck', 'nothing that has stuck', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_focus', 'What is this stealing from you?', TAKEN_BACK, [
      ['evenings', 'Work that drags into my evenings', 'your evenings', 'weather-night'],
      ['results', 'Grades or results', 'the results you are working for', 'star'],
      ['behind', 'Feeling on top of things', 'the feeling of being on top of it', 'emoticon-confused-outline'],
      ['confidence', 'My confidence', 'your confidence', 'target'],
      ['people', 'Time with the people I like', 'time with the people you like', 'heart-outline'],
      ['time', 'Time I will not get back', 'time you will not get back', 'clock-fast'],
    ]),
  },
  energy: {
    where: where('when_energy', 'When are you already done?', [
      ['morning', 'I wake up tired', 'you wake up tired', 'weather-sunset-up'],
      ['midday', 'By the middle of the day', 'the middle of the day empties you', 'white-balance-sunny'],
      ['afternoon', 'The afternoon crash', 'the afternoon crash hits you', 'battery-low'],
      ['evening', 'There is nothing left after work', 'there is nothing left after work', 'weather-night'],
      ['constant', 'I feel like this all day', 'it stays low all day', 'blur'],
    ]),
    tried: tried('tried_energy', 'What do you reach for to get through?', [
      ['caffeine', 'Caffeine', 'caffeine', 'coffee-outline'],
      ['sugar', 'Sugar or energy drinks', 'energy drinks', 'sparkle'],
      ['napping', 'Naps', 'naps', 'sleep'],
      ['exercise_habit', 'Moving more', 'moving more', 'run'],
      ['supplements', 'Supplements', 'supplements', 'lotus'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_energy', 'What does running on empty take first?', TAKEN_BACK, [
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
    where: where('when_wave', 'When are you most likely to get irritated?', [
      ['conflict', 'Conflict with someone', 'conflict sets it off', 'alert-circle-outline'],
      ['criticised', 'Feeling criticised or rejected', 'feeling criticised or rejected sets it off', 'shield-alert-outline'],
      ['overload', 'Too much arriving at once', 'too much arriving at once sets it off', 'waves'],
      ['tired', 'When I am tired or hungry', 'being tired or hungry sets it off', 'battery-low'],
      ['nowhere', 'It comes out of nowhere', 'it comes out of nowhere', 'weather-windy'],
    ]),
    tried: tried('tried_wave', 'What have you tried to cool down?', [
      ['walk_away', 'Walking away for a minute', 'walking away for a minute', 'walk'],
      ['count', 'Counting or breathing', 'counting or breathing', 'breath-leaf'],
      ['vent', 'Venting to someone', 'venting to someone', 'heart-outline'],
      ['hold_in', 'Holding it in', 'holding it in', 'emoticon-neutral-outline'],
      ['move', 'Moving it out with exercise', 'exercise', 'run'],
      ['nothing', 'Nothing that works', 'nothing that has worked', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_wave', 'What would a pause before reacting help you do?', GIVEN, [
      ['words', 'Say fewer things I regret', 'fewer things you regret saying', 'alert-circle-outline'],
      ['hours', 'Stop replaying it for hours', 'hours back from replaying it', 'clock-fast'],
      ['distance', 'Get along better with people I love', 'calmer time with the people you love', 'heart-outline'],
      ['sleep', 'Have a calmer rest of my day', 'a calmer rest of your day', 'white-balance-sunny'],
      ['trust', 'Ask clearly for what I need', 'the words to ask for what you need', 'target'],
    ]),
  },
  self_care: {
    where: where('when_time', 'What eats the time first?', [
      ['work', 'Work', 'work takes it first', 'laptop'],
      ['others', 'Family and everyone else', 'everyone else takes it first', 'heart-outline'],
      ['chores', 'Chores that never end', 'chores take it first', 'broom'],
      ['phone', 'My phone', 'your phone takes it first', 'blur'],
      ['guilt', 'Guilt for taking any', 'guilt stops you taking any', 'emoticon-sad-outline'],
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
      ['starting', 'Getting to it at all', 'getting to your practice is the hard part', 'calendar-check-outline'],
      ['noise', 'Quieting the noise first', 'you need to quiet the noise before you begin', 'waves'],
      ['staying', 'Staying with it longer', 'you want to stay with it longer', 'timer'],
      ['carrying', 'Carrying it into the day', 'you want to carry it into the day', 'walk'],
      ['returning', 'A way back after a long gap', 'you want a way back after a long gap', 'arrow-up'],
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
    where: where('when_mat', 'Where does your practice need the most help?', [
      ['holds', 'Holding the hard poses', 'the hard poses are where you struggle', 'yoga'],
      ['transitions', 'Transitions between poses', 'your transitions feel rushed', 'waves'],
      ['savasana', 'Stillness at the end', 'staying still at the end is hard', 'lotus'],
      ['starting', 'Getting on the mat at all', 'getting on the mat is the hard part', 'calendar-check-outline'],
      ['offmat', 'Carrying it off the mat', 'you want to carry it off the mat', 'walk'],
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
    where: where('when_heart', 'What do you want more clarity on?', [
      ['checkup', 'A check-up or a number I did not like', 'a number from a check-up worried you', 'stethoscope'],
      ['family', 'Heart trouble in my family', 'heart trouble runs in your family', 'heart-outline'],
      ['chest', 'Stress I can feel in my chest', 'you feel stress in your chest', 'heart-pulse'],
      ['training', 'Training and recovery', 'you want clarity on training and recovery', 'dumbbell'],
      ['ahead', 'Staying ahead of problems', 'you want to stay ahead of problems', 'shield-alert-outline'],
    ]),
    tried: tried('tried_heart', 'What are you using to understand it now?', [
      ['wearable', 'A watch or a ring', 'the watch you already wear', 'heart-bpm'],
      ['bp', 'Blood pressure at home', 'blood pressure at home', 'blood-pressure'],
      ['bloodwork', 'Check-ups and bloodwork', 'check-ups and bloodwork', 'stethoscope'],
      ['lifestyle', 'Exercise and what I eat', 'exercise and what you eat', 'run'],
      ['nothing', 'Nothing yet, I go on feel', 'nothing yet', 'close-circle-outline'],
    ]),
    stakes: stakes('stakes_heart', 'What would more clarity give you?', GIVEN, [
      ['proof', 'Proof my habits are working', 'proof your habits are working', 'target'],
      ['warning', 'Noticing changes early', 'an early look at changes', 'alert-circle-outline'],
      ['recovery', 'Confidence in how I am recovering', 'confidence in how you are recovering', 'heart-glow'],
      ['doctor', 'Something to show my doctor', 'something to show your doctor', 'stethoscope'],
      ['worry', 'One less thing to worry about', 'one less thing to worry about', 'emoticon-happy-outline'],
    ]),
  },
  cleaning: {
    where: where('when_cleaning', 'Which area feels most stressful to start?', [
      ['laundry', 'Laundry', 'laundry feels hardest to start', 'tshirt-crew-outline'],
      ['dishes', 'Dishes', 'dishes feel hardest to start', 'silverware-fork-knife'],
      ['bedroom', 'My bedroom', 'your bedroom feels hardest to start', 'bed-outline'],
      ['clutter', 'General clutter', 'general clutter feels hardest to start', 'broom'],
      ['all', 'Honestly, all of it', 'all of it feels hard to start', 'weather-pouring'],
    ]),
    tried: tried('cleaning_barriers', 'What makes it hard for you to clean?', [
      ['energy', 'I feel too tired', 'feeling too tired', 'battery-low'],
      ['freeze', 'I get overwhelmed', 'getting overwhelmed', 'blur'],
      ['time', 'I don\'t have time', 'not having enough time', 'clock-fast'],
      ['enjoyment', 'I don\'t enjoy it', 'not enjoying cleaning', 'emoticon-sad-outline'],
    ]),
    stakes: stakes('cleaning_impact', 'How is cleaning overwhelm affecting your life?', TAKEN_BACK, [
      ['relax', 'I can\'t relax at home', 'a home you can relax in', 'home'],
      ['guilt', 'I feel guilty or ashamed', 'peace of mind when you look around', 'heart-outline'],
      ['energy', 'It drains my energy', 'energy for the rest of your day', 'battery-low'],
      ['people', 'I avoid inviting people over', 'confidence to invite people over', 'account-group-outline'],
      ['relationships', 'It causes tension with people I live with', 'a calmer home to share', 'account-multiple-outline'],
      ['manageable', 'It isn\'t affecting me much', 'more time for the things you enjoy', 'emoticon-happy-outline'],
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

const CLEANING_EXTRA_QUESTIONS: IntentFollowUpQuestion[] = [
  where('cleaning_living_situation', 'What is your current living situation?', [
    ['alone', 'I live on my own', 'you live on your own', 'account-outline'],
    ['partner', 'I live with a partner', 'you share your home with a partner', 'heart-outline'],
    ['kids', 'I live with children', 'you have children at home', 'tshirt-crew-outline'],
    ['family', 'I live with family', 'you share your home with family', 'home'],
    ['roommates', 'I live with roommates', 'you share your home with roommates', 'account-group-outline'],
    ['other', 'Something else', 'your living situation is your own', 'dots-horizontal-circle-outline'],
  ]),
  where('cleaning_space_state', 'How clean is your space right now?', [
    ['mostly_clean', 'Mostly clean, with a little to tidy', 'your space mostly needs a little tidying', 'chores-clear'],
    ['cluttered', 'A few areas are cluttered', 'a few areas of your space are cluttered', 'chores-small'],
    ['messy', 'Mess is building up in most rooms', 'mess is building up in most rooms', 'chores-pile'],
    ['overwhelming', 'It feels too overwhelming to start', 'your space feels overwhelming to start', 'chores-full'],
    ['varies', 'It changes from week to week', 'your space changes from week to week', 'swap-horizontal'],
  ]),
  where('tidying_challenge', "What's the toughest part about keeping your home tidy?", [
    ['routines', 'Sticking to routines', 'sticking to routines is the toughest part', 'streak'],
    ['clutter', 'Dealing with clutter', 'dealing with clutter is the toughest part', 'broom'],
    ['others', 'Managing messes from others', 'managing messes from others is the toughest part', 'account-group-outline'],
    ['work_chores', 'Balancing work and chores', 'balancing work and chores is the toughest part', 'laptop'],
    ['kids', 'Keeping up with kids\' stuff', 'keeping up with your kids\' stuff is the toughest part', 'tshirt-crew-outline'],
  ]),
];

/**
 * Their second-beat answer, ready for "You've tried {echo}." Null where that
 * sentence would be wrong: a practice they still keep (spiritual, yoga, heart),
 * cleaning's barriers, "nothing", or more than one pick.
 */
const UNQUOTABLE_TRIED: ReadonlySet<OnboardingIntent> = new Set([
  'cleaning',
  'spiritual',
  'yoga',
  'heart_health',
]);

export function triedEchoFor(
  intent: OnboardingIntent | null,
  selected: readonly string[],
): string | null {
  if (intent != null && UNQUOTABLE_TRIED.has(intent)) return null;
  if (selected.length !== 1 || selected[0] === 'nothing') return null;
  const question = intentFollowUpsFor(intent)[1];
  return question.options.find((option) => option.id === selected[0])?.echo ?? null;
}

/** The stakes beat stays at index 2 for analysis; cleaning adds home context. */
export function intentFollowUpsFor(
  intent: OnboardingIntent | null,
): IntentFollowUpQuestion[] {
  const triad =
    intent == null || intent === 'other'
      ? DEFAULT_TRIAD
      : TRIADS[intent];
  const questions = [triad.where, triad.tried, triad.stakes];
  return intent === 'cleaning'
    ? [...questions, ...CLEANING_EXTRA_QUESTIONS]
    : questions;
}
