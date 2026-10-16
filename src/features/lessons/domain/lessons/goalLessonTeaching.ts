import type { LessonBlock } from '../lessonBlock';
import { phoneLessonTeaching } from './phoneLessonTeaching';

/** Where a source's examples teach a different task, replace the teaching too. */
const HOME_TEACHING: Readonly<Record<string, readonly LessonBlock[]>> = {
  'body.appetite': [
    { kind: 'text', text: 'Context supplied by the household lesson.' },
    { kind: 'text', text: 'A household task can wait while you meet an ordinary need. If you were about to prepare food but the counter is crowded, **clear only the space you need to use**. Putting one plate away can be enough to make that small area available.' },
    { kind: 'text', text: 'Afterward, choose the household action that fits the energy you have. **Make the task smaller if needed**: put away the food you used, or move one cup to the sink. You do not have to turn preparing something to eat into cleaning the entire kitchen.' },
    { kind: 'list', items: [
      { term: 'A basic need', text: 'Decide whether you need something to eat, a drink, or a pause before another chore.' },
      { term: 'A useful space', text: 'Make enough room for the ordinary activity you need to do, without reorganizing the whole surface.' },
      { term: 'One small finish', text: 'Choose a single household action afterward, or leave it for a time when it fits.' },
    ] },
    { kind: 'choice', prompt: 'What would make this kitchen task realistic today?', options: [] },
    { kind: 'text', text: 'If the room still looks untidy, the small change can still be useful. **Judge this attempt by the purpose you chose**: making space for food and leaving one thing easier to use. Other household work can have its own time rather than becoming the price of meeting your needs.' },
    { kind: 'do', text: 'Context supplied by the household lesson.' },
  ],
  'focus.ready': [
    { kind: 'text', text: 'Context supplied by the household lesson.' },
    { kind: 'text', text: 'A whole room can be difficult to begin because it contains many different jobs. **Choose one object and its next place** instead of deciding how to finish the room. You might take a cup to the sink or put a coat on its hook.' },
    { kind: 'text', text: 'The first action should have a clear ending. Taking the cup to the sink finishes that action even if other dishes remain. **Beginning does not commit you to every nearby chore**. You can decide whether another small step fits after this one is complete.' },
    { kind: 'sequence', prompt: 'Put a small household beginning in order.', steps: [
      'Choose one cup that needs moving.',
      'Take that cup to the sink.',
      'Decide whether another small task fits now.',
    ], feedback: 'The first action has its own ending. You can stop after moving the cup without needing to finish the whole kitchen.' },
    { kind: 'choice', prompt: 'Which small household action could you begin now?', options: [] },
    { kind: 'text', text: 'If a cup is not the useful starting point in your home, choose a different object. **Keep the same small boundary**: one thing and one next place. A particular room or kind of mess is not required for you to use this approach.' },
    { kind: 'do', text: 'Context supplied by the household lesson.' },
  ],
  'focus.blocks': [
    { kind: 'text', text: 'Context supplied by the household lesson.' },
    { kind: 'text', text: 'Choose a household job with an area you can name, such as the chair holding clothes. **Give this attempt a clear boundary** before you begin. You might work on the chair for a short available period rather than letting the task spread into every room.' },
    { kind: 'text', text: 'Within that period, stay with the chosen area. If an object belongs elsewhere, put it in its next suitable place and return. **Notice when another chore invites you away**. Opening a cupboard does not mean that sorting the cupboard has become part of the chair task.' },
    { kind: 'list', items: [
      { term: 'One area', text: 'Name the chair, shelf, or small surface you are working on for this attempt.' },
      { term: 'One boundary', text: 'Choose a stopping point that fits the time and energy available today.' },
      { term: 'One review', text: 'At that stopping point, decide whether another small attempt fits or whether to stop.' },
    ] },
    { kind: 'choice', prompt: 'Which response keeps this household attempt manageable?', options: [] },
    { kind: 'text', text: 'Some objects may still need a decision when you stop. **Leave a specific next step** if you plan to return, such as putting the remaining clean clothes away. Your next attempt can start there without requiring you to keep working through every visible job now.' },
    { kind: 'do', text: 'Context supplied by the household lesson.' },
  ],
  'focus.done': [
    { kind: 'text', text: 'Context supplied by the household lesson.' },
    { kind: 'text', text: 'A home keeps being used, so there may always be another object to move. **Define what this attempt includes** before you start. Clearing a place to sit can be the complete task even while a shelf or another chair still needs attention.' },
    { kind: 'text', text: 'Use a stopping point you can recognize by looking at the space. A clear seat is easier to check than a room that feels perfect. **The ending belongs to the task you chose**, rather than to every new thing you notice as you work.' },
    { kind: 'sequence', prompt: 'Put a bounded home task into order.', steps: [
      'Choose clearing one seat as this attempt’s task.',
      'Move the items from that seat to suitable places.',
      'Stop and check that the seat can be used.',
    ], feedback: 'A usable seat meets the boundary you chose. Another chair or shelf can be a separate task at another time.' },
    { kind: 'choice', prompt: 'Which choice gives this household attempt a clear ending?', options: [] },
    { kind: 'text', text: 'Stopping does not require pretending that the rest of the room is finished. **Name what is complete accurately**, then decide whether you want another small task. That next decision is separate from the action you already finished, and it can take your available time into account.' },
    { kind: 'do', text: 'Context supplied by the household lesson.' },
  ],
  'focus.inbox': [
    { kind: 'text', text: 'Context supplied by the household lesson.' },
    { kind: 'text', text: 'Papers can spread because collecting them and deciding about them are different jobs. **Give incoming household papers one obvious place** first. A tray or folder can hold a letter until you have time to read it and choose what needs to happen next.' },
    { kind: 'text', text: 'When you collect papers, avoid opening a new task for every item. **Gathering is one small action**. Later, choose a single paper and check whether it needs a response, a safe place to keep it, or disposal according to the information it contains.' },
    { kind: 'list', items: [
      { term: 'Incoming place', text: 'Choose one place for household papers that have not yet had a decision.' },
      { term: 'One item', text: 'When time allows, read one item and identify its next action or where it should be kept.' },
      { term: 'Useful return', text: 'Choose a realistic moment to check the incoming place so important papers do not remain unseen.' },
    ] },
    { kind: 'choice', prompt: 'Which action makes household papers easier to find?', options: [] },
    { kind: 'text', text: 'Keep the incoming place simple enough to use when you arrive home. **A workable place beats an elaborate sorting job** you avoid starting. If an item already has an obvious safe home, put it there; the incoming place is for papers still waiting for a decision.' },
    { kind: 'do', text: 'Context supplied by the household lesson.' },
  ],
};

const PHONE_NIGHT_TEACHING: readonly LessonBlock[] = [
  { kind: 'text', text: 'Context supplied by the phone lesson.' },
  { kind: 'text', text: 'A night-time check can begin with a useful question about the time and end in an unrelated feed. **Separate the first need from the extra checking**. If you only need the time, choose a way to see it that does not require opening messages or another app.' },
  { kind: 'text', text: 'Decide what should remain available before the night begins. You may need an alarm or a way for someone to reach you. **Keep those needs available while reducing unrelated prompts**. The aim is a practical phone boundary that fits your situation, rather than making every function unavailable.' },
  { kind: 'list', items: [
    { term: 'The actual need', text: 'Identify whether you need the time, your alarm, or necessary contact rather than assuming you need every app.' },
    { term: 'The extra check', text: 'Notice the step from that need into opening messages, a feed, or another nonessential app.' },
    { term: 'The next choice', text: 'Leave that extra check for a suitable daytime moment instead of following it automatically.' },
  ] },
  { kind: 'choice', prompt: 'Which choice keeps a night-time phone check to its purpose?', options: [] },
  { kind: 'text', text: 'If you do open a feed, another choice is still available. **Close the app when you notice** instead of continuing because you already started. Tomorrow, adjust the detail that invited the extra check, such as a visible notification, without turning one night into a judgement about yourself.' },
  { kind: 'do', text: 'Context supplied by the phone lesson.' },
];

export function goalLessonTeaching(goal: string, sourceId: string): readonly LessonBlock[] | undefined {
  if (goal === 'phoneWork' || goal === 'phoneBedtime') {
    if (goal === 'phoneBedtime' && sourceId === 'sleep.threeam') return PHONE_NIGHT_TEACHING;
    return phoneLessonTeaching(goal, sourceId);
  }
  if (goal === 'home') return HOME_TEACHING[sourceId];
  if (goal === 'phone' && sourceId === 'sleep.threeam') return PHONE_NIGHT_TEACHING;
  return undefined;
}
