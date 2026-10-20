/**
 * Three small things to do after a check-in, picked from the feeling and the
 * answers, offered as today-only to-dos.
 *
 * Behavioural activation: a low or tense mood lifts faster from doing one small
 * concrete thing than from waiting to feel like it. So every action is one
 * step, named in the first person, and finishable today.
 */

import type { IconName } from '../../../components/common/icons/paths';
import {
  moodBand,
  moodScore,
  weakestMoodScale,
  type CompleteMoodAnswers,
} from './moodCheckIn';
import { isMoodFeelingId, type MoodFeelingId } from './moodFeelings';
import { daySeed } from './moodPrompts';

export interface MoodAction {
  id: string;
  title: string;
  icon: IconName;
}

type MoodActionPoolId =
  | 'tense'
  | 'low'
  | 'lonely'
  | 'energy'
  | 'sleep'
  | 'focus'
  | 'good'
  | 'steady';

const ACTIONS = {
  freshAir: { id: 'fresh-air', title: 'Step outside for five minutes', icon: 'todo-fresh-air' },
  worry: { id: 'worry', title: 'Write down what’s on my mind', icon: 'todo-worry-note' },
  oneThing: { id: 'one-thing', title: 'Pick the one thing that matters today', icon: 'todo-priorities' },
  walk: { id: 'walk', title: 'Take a ten-minute walk', icon: 'walk' },
  phoneAway: { id: 'phone-away', title: 'Put my phone away for 20 minutes', icon: 'todo-screen-free' },
  curtains: { id: 'curtains', title: 'Open the curtains', icon: 'todo-curtains' },
  shower: { id: 'shower', title: 'Wash my face or shower', icon: 'todo-shower' },
  textTrusted: { id: 'text-trusted', title: 'Text someone I trust', icon: 'todo-message' },
  daylight: { id: 'daylight', title: 'Get ten minutes of daylight', icon: 'sun' },
  meal: { id: 'meal', title: 'Eat one simple meal', icon: 'todo-meal' },
  callFriend: { id: 'call-friend', title: 'Call a friend for five minutes', icon: 'message' },
  kindMessage: { id: 'kind-message', title: 'Send someone a kind message', icon: 'heart' },
  aroundPeople: { id: 'around-people', title: 'Spend time somewhere with people around', icon: 'coffee-outline' },
  sayHello: { id: 'say-hello', title: 'Say hello to someone new', icon: 'profile' },
  water: { id: 'water', title: 'Drink a glass of water', icon: 'todo-water' },
  stretch: { id: 'stretch', title: 'Stretch for two minutes', icon: 'yoga' },
  protein: { id: 'protein', title: 'Eat something with protein', icon: 'todo-meal' },
  bedtime: { id: 'bedtime', title: 'Pick a bedtime for tonight', icon: 'moon' },
  phoneBed: { id: 'phone-bed', title: 'Phone away 30 minutes before bed', icon: 'todo-screen-free' },
  caffeine: { id: 'caffeine', title: 'No caffeine after 2pm', icon: 'coffee-outline' },
  outside: { id: 'outside', title: 'Get outside in daylight today', icon: 'sun' },
  shortNap: { id: 'short-nap', title: 'Keep any nap under 20 minutes', icon: 'bed-clock' },
  topThree: { id: 'top-three', title: 'Choose my top three tasks', icon: 'todo-priorities' },
  focusTimer: { id: 'focus-timer', title: 'Start a 10-minute focus timer', icon: 'todo-focus-timer' },
  clearSurface: { id: 'clear-surface', title: 'Clear one surface', icon: 'todo-tidy' },
  putOff: { id: 'put-off', title: 'Do one thing I’ve been putting off', icon: 'star' },
  read: { id: 'read', title: 'Read ten pages', icon: 'book' },
  goodNote: { id: 'good-note', title: 'Write down what made today good', icon: 'journal' },
  shareGood: { id: 'share-good', title: 'Share something good with a friend', icon: 'todo-message' },
  lookForward: { id: 'look-forward', title: 'Plan something to look forward to', icon: 'calendar' },
  move: { id: 'move', title: 'Move my body for 20 minutes', icon: 'dumbbell' },
  textFriend: { id: 'text-friend', title: 'Text a friend', icon: 'todo-message' },
} as const satisfies Record<string, MoodAction>;

const POOLS: Record<MoodActionPoolId, readonly MoodAction[]> = {
  tense: [ACTIONS.freshAir, ACTIONS.worry, ACTIONS.oneThing, ACTIONS.walk, ACTIONS.phoneAway],
  low: [ACTIONS.curtains, ACTIONS.shower, ACTIONS.textTrusted, ACTIONS.daylight, ACTIONS.meal],
  lonely: [ACTIONS.textTrusted, ACTIONS.callFriend, ACTIONS.kindMessage, ACTIONS.aroundPeople, ACTIONS.sayHello],
  energy: [ACTIONS.water, ACTIONS.daylight, ACTIONS.stretch, ACTIONS.protein, ACTIONS.walk],
  sleep: [ACTIONS.bedtime, ACTIONS.phoneBed, ACTIONS.caffeine, ACTIONS.outside, ACTIONS.shortNap],
  focus: [ACTIONS.topThree, ACTIONS.focusTimer, ACTIONS.clearSurface, ACTIONS.putOff, ACTIONS.read],
  good: [ACTIONS.goodNote, ACTIONS.shareGood, ACTIONS.putOff, ACTIONS.lookForward, ACTIONS.move],
  steady: [ACTIONS.walk, ACTIONS.water, ACTIONS.textFriend, ACTIONS.clearSurface, ACTIONS.read],
};

const POOL_FOR_FEELING: Partial<Record<MoodFeelingId, MoodActionPoolId>> = {
  anxious: 'tense',
  stressed: 'tense',
  overwhelmed: 'tense',
  irritated: 'tense',
  restless: 'tense',
  'on-edge': 'tense',
  unsettled: 'tense',
  sad: 'low',
  flat: 'low',
  numb: 'low',
  hopeless: 'low',
  meh: 'low',
  lonely: 'lonely',
  drained: 'energy',
  tired: 'energy',
  scattered: 'focus',
  bored: 'focus',
  happy: 'good',
  excited: 'good',
  motivated: 'good',
  focused: 'good',
  proud: 'good',
  hopeful: 'good',
  fine: 'steady',
};

const ACTION_COUNT = 3;

function scalePool(answers: CompleteMoodAnswers): MoodActionPoolId {
  const band = moodBand(moodScore(answers));
  if (band === 'good') return 'good';
  switch (weakestMoodScale(answers)) {
    case 'energy':
      return 'energy';
    case 'sleep':
      return 'sleep';
    case 'overall':
      return band === 'low' ? 'low' : 'steady';
  }
}

/** The pool started at a different place each day, so a daily user sees it move. */
function rotated(pool: MoodActionPoolId, localDate: string): MoodAction[] {
  const actions = POOLS[pool];
  const start = daySeed(localDate) % actions.length;
  return [...actions.slice(start), ...actions.slice(0, start)];
}

export function moodActions(
  answers: CompleteMoodAnswers,
  feeling: string | null,
  localDate: string,
): { answering: string; actions: MoodAction[] } {
  const byFeeling = isMoodFeelingId(feeling) ? POOL_FOR_FEELING[feeling] : undefined;
  const secondary = scalePool(answers);
  const primary = byFeeling ?? secondary;

  const picked: MoodAction[] = [];
  const take = (pool: MoodActionPoolId, count: number) => {
    for (const action of rotated(pool, localDate)) {
      if (count === 0 || picked.length === ACTION_COUNT) return;
      if (picked.some((chosen) => chosen.id === action.id)) continue;
      picked.push(action);
      count -= 1;
    }
  };

  if (primary === secondary) {
    take(primary, ACTION_COUNT);
  } else {
    take(primary, ACTION_COUNT - 1);
    take(secondary, 1);
  }
  take('steady', ACTION_COUNT - picked.length);

  return {
    answering: byFeeling != null && feeling != null ? feeling : secondary,
    actions: picked,
  };
}
