/**
 * One writing prompt for the check-in's journal page, chosen by what the user
 * came for and how today felt.
 *
 * A blank box asks the user to think of something to say; a prompt hands them
 * the first half of the sentence. The plan is why they are here, so its prompts
 * lead — but a rough day is never asked about a goal it has no room for.
 */

import type { ProgramPlanId } from '../../program/domain/programCatalogue';
import type { MoodFeelingSetId } from './moodFeelings';

const PLAN_PROMPTS: Record<ProgramPlanId, readonly string[]> = {
  night: [
    'What would make tonight easier to switch off?',
    "What's still buzzing around from today?",
    'What helped you wind down last time it worked?',
    'One thing you can leave for tomorrow-you:',
    'How did last night actually go?',
    'What does a cozy evening look like for you?',
    "What's one thing you can write down so your brain can let it go?",
    'What time did your body start feeling sleepy today?',
    'What kept you up the last time sleep was hard?',
    "What's the last thing you want to do before bed tonight?",
    'How did you feel when you woke up this morning?',
    "What's one screen you could put away a little earlier?",
    'What made today feel finished, or not?',
    'What does your perfect bedtime look like?',
    'What would help you feel safe and settled tonight?',
    'What are three good things from today?',
  ],
  morning: [
    'What woke you up this morning, really?',
    'One small thing to look forward to today:',
    'How do you want the first hour to feel?',
    'What made getting up easier, or harder?',
    'What would future-you thank you for today?',
    "Today's tiny win, planned in advance:",
    "What's the first thing you did after waking up?",
    'How did you feel in the first five minutes of today?',
    "What's one thing you can get ready tonight for tomorrow morning?",
    'What would make tomorrow morning feel a little calmer?',
    'What usually slows down your mornings?',
    'What gave you energy today?',
    'What time did you actually feel awake?',
    "What's one morning habit you'd like to keep?",
    "What's something you can look forward to first thing tomorrow?",
    'How did your morning shape the rest of your day?',
  ],
  pressure: [
    'What pushed your buttons today?',
    'When did you keep your cool, even a little?',
    "What's one thing you can't control right now?",
    'What would you tell a friend in your spot?',
    'Where did you feel the stress in your body?',
    'What helped you bounce back today?',
    'What was the hardest moment today?',
    'How did you react, and how would you like to react next time?',
    "What's one thing that helped you calm down?",
    'Who or what drained your patience today?',
    'What did you need in that tense moment?',
    "What's one boundary that would help this week?",
    "What's taking up the most room in your head?",
    "What's something you handled well under pressure?",
    "What's one thing you can take off your plate?",
    'What would a calmer version of today have looked like?',
  ],
  focus: [
    'What did you actually get done today?',
    'What kept pulling your attention away?',
    "What's the one task that matters most tomorrow?",
    'When did you feel in the zone?',
    'What made starting hard today?',
    'What would make tomorrow’s first hour easier?',
    "What's one distraction you could move out of reach tomorrow?",
    'What helped you get started today?',
    'How long could you focus before your mind wandered?',
    'What task have you been putting off, and why?',
    "What's the smallest first step on your big task?",
    'Where do you focus best?',
    "What did you finish that you're glad about?",
    'What pulled you off track, and when?',
    'How did your energy change through the day?',
    'What would make tomorrow a focused day?',
  ],
  quiet: [
    'Where did you find a quiet moment today?',
    "What's been loud in your head lately?",
    'What sound, place or person calms you down?',
    'One thing you noticed when you slowed down:',
    'What would a calmer day look like?',
    'What can you let go of tonight?',
    "What's one thing you heard, saw or felt today that was calming?",
    'When did your mind feel busiest today?',
    'What helps you feel grounded?',
    'Where could you find five quiet minutes tomorrow?',
    'What thought kept coming back today?',
    'What does calm feel like in your body?',
    "What's something you're ready to stop worrying about?",
    'Who helps you feel calm?',
    'What did you notice when you paused today?',
    'What would you like more of: quiet, rest or space?',
  ],
  home: [
    'Which corner of your space felt good today?',
    "What's one small tidy you're proud of?",
    'What spot at home feels most like you?',
    'What clutter is living rent-free in your head?',
    'One thing you could move, toss or fix tomorrow:',
    'How did being at home feel today?',
    "What's one thing in your space that makes you happy?",
    'Which room needs a little love next?',
    'What did you put back in its place today?',
    'How does your space make you feel right now?',
    "What's one five-minute tidy you could do tomorrow?",
    'What do you keep meaning to sort out?',
    'What makes your home feel cozy?',
    "What's one thing you could let go of?",
    'How did a tidier corner change your mood?',
    'What would make walking in the door feel nicer?',
  ],
  phone: [
    'When did you reach for your phone without meaning to?',
    'What did you do instead of scrolling today?',
    'How did you feel after your last scroll?',
    'What were you looking for on your phone today?',
    'One moment today you were fully offline:',
    'What would you do with an extra phone-free hour?',
    'How many times do you think you picked up your phone today?',
    'What app pulled you in the most?',
    'What did you notice when you put your phone down?',
    'When are you most likely to scroll without thinking?',
    "What's one notification you could turn off?",
    'What did you enjoy doing without your phone today?',
    'How did you feel before you reached for your phone?',
    'Where could your phone live while you sleep?',
    'What would you like to spend more time on instead?',
    "What's one phone rule you'd like to try tomorrow?",
  ],
  recovery: [
    'What did you have energy for today?',
    'What was one gentle thing you did for yourself?',
    "What's okay to skip today?",
    'What helped, even a tiny bit?',
    'What does rest look like for you right now?',
    'Who or what made today a little lighter?',
    'How full is your battery right now?',
    'What drained you today?',
    'What filled you back up today?',
    "What's one thing you can say no to this week?",
    'What does your body need right now?',
    "What's one kind thing someone did for you?",
    'What would make tomorrow a little easier?',
    'What did you do today that counts, even if it was small?',
    "What's one comfort you can lean on tonight?",
    "What would you tell a friend who's as tired as you?",
  ],
  selfTrust: [
    'What promise did you keep to yourself today?',
    'When did you trust your gut today?',
    'What are you quietly proud of?',
    'What would you like to believe about yourself?',
    'One kind thing you can say to yourself right now:',
    'What did you handle better than you expected?',
    'What did you do today that you said you would?',
    'When did you listen to yourself today?',
    "What's one small promise you can keep tomorrow?",
    'What did you do that took courage?',
    "What's one thing you like about yourself?",
    'When did you doubt yourself, and what happened?',
    "What's something you're getting better at?",
    'What decision are you glad you made?',
    'What would you do if you trusted yourself a little more?',
    'What did you learn about yourself today?',
  ],
};

const FEELING_PROMPTS: Record<MoodFeelingSetId, readonly string[]> = {
  tense: [
    "What's the one thing on your mind?",
    'What would take 10% of the pressure off?',
    'What part of this can wait until tomorrow?',
    "Name it: what's actually bothering you?",
    'What do you need right now?',
  ],
  low: [
    'What made today heavy?',
    'Who would you like to hear from right now?',
    'What is one small thing that might help tonight?',
    'What got you through today, even a little?',
    'Be gentle: what did you manage today?',
  ],
  mixed: [
    "What's one thing that went okay?",
    'What would turn a meh day into a good one?',
    'What surprised you today?',
    'What do you wish had gone differently?',
    'What are you looking forward to?',
  ],
  bright: [
    'What made today good?',
    'What do you want to remember about today?',
    'Who would you share this with?',
    'What did you do that made this happen?',
    'How can you get more days like this?',
  ],
  easy: [
    "What's making things feel easy right now?",
    'What are you grateful for today?',
    'Where did you feel most at ease?',
    'What made today cozy?',
    'What small thing made you smile?',
  ],
};

const GENERAL_PROMPTS: readonly string[] = [
  'What was the best part of today?',
  'What is on your mind right now?',
  'One word for today, and why:',
  'What do you want tomorrow to feel like?',
];

/**
 * Every prompt that fits, without repeats, rotated so the first one changes
 * with the day. The plan's prompts lead, except on a tense or low day, when the
 * feeling's do.
 */
export function moodJournalPrompts(
  planId: ProgramPlanId | null,
  feelingSet: MoodFeelingSetId | null,
  localDate: string,
): string[] {
  const plan = planId == null ? [] : PLAN_PROMPTS[planId];
  const feeling = feelingSet == null ? [] : FEELING_PROMPTS[feelingSet];
  const rough = feelingSet === 'tense' || feelingSet === 'low';
  const lead = rough || plan.length === 0 ? feeling : plan;
  const pool = [...new Set([...lead, ...plan, ...feeling, ...GENERAL_PROMPTS])];
  const leading = lead.length > 0 ? lead.length : pool.length;
  const start = daySeed(localDate) % leading;
  return [
    ...pool.slice(start, leading),
    ...pool.slice(0, start),
    ...pool.slice(leading),
  ];
}

function daySeed(localDate: string): number {
  let seed = 0;
  for (const char of localDate) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  return seed;
}
