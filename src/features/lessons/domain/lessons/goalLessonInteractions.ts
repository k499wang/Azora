import type { LessonBlock } from '../lessonBlock';

const NEXT_PRACTICE: Record<string, readonly [when: string, what: string]> = {
  night: ['After I put away my last evening task', 'I will put my phone aside and begin one quiet bedtime activity.'],
  morning: ['After I get out of bed', 'I will open the curtains and begin one small morning action.'],
  focus: ['After I sit down to work', 'I will name one visible next action before opening other tasks.'],
  quiet: ['After I put my lunch dishes away', 'I will listen to one nearby sound for a brief quiet pause.'],
  home: ['After I arrive home', 'I will put one familiar item back in its place.'],
  phone: ['After I finish checking the message I came for', 'I will close the app and put the phone in its chosen place.'],
  phoneBedtime: ['After my last necessary evening check', 'I will put my phone in its chosen place and begin one ordinary bedtime activity.'],
  phoneWork: ['When I begin a work or study period', 'I will choose one clear task action and put unrelated phone checking aside.'],
  recovery: ['After I notice that my energy is low', 'I will choose one small care action that fits my available capacity.'],
  selfTrust: ['After I check my plans for the day', 'I will choose one specific personal promise small enough to keep.'],
  stress: ['Before I answer a new request', 'I will check what I am already carrying and choose a realistic response.'],
  overthinking: ['When I notice the same question repeating', 'I will write any useful next action once, then leave the question for now.'],
  anger: ['When I notice my early anger cue', 'I will pause before replying and choose words that describe what I need.'],
};

const SMALL_START: Record<string, readonly [string, string]> = {
  morning: ['Choose one morning task, such as getting dressed.', 'Put the first item of clothing where you can reach it.'],
  home: ['Choose one household task, such as putting away dishes.', 'Put one clean cup in its usual place.'],
  stress: ['Choose one demand, such as replying to a request.', 'Write the first useful sentence of the reply.'],
  overthinking: ['Choose one action that belongs to the decision in front of you.', 'Write the one question you need answered before the next step.'],
};

/** Illustrative examples change with the goal; the underlying ordering stays shared. */
export function goalLessonInteraction(goal: string, sourceId: string, block: LessonBlock): LessonBlock {
  if (sourceId === 'plan.carry' && block.kind === 'reveal') {
    const [when, what] = NEXT_PRACTICE[goal];
    return {
      kind: 'reveal',
      prompt: 'Tap the parts of a realistic next step for your chosen goal.',
      items: [
        { label: 'When', detail: `${when}. This is an ordinary moment to look for rather than a commitment left somewhere in a busy day.` },
        { label: 'What', detail: `${what} This names one action that supports the goal you chose and has a clear beginning.` },
        { label: 'If the day changes', detail: 'I will choose another available moment or a smaller version of the same action. A changed schedule does not create extra work to make up.' },
      ],
    };
  }
  if (sourceId === 'focus.ready' && block.kind === 'sequence' && SMALL_START[goal]) {
    const [choose, start] = SMALL_START[goal];
    return {
      kind: 'sequence',
      prompt: 'Put this small beginning in a practical order.',
      steps: [choose, start, 'After that small action, decide whether another step fits the time and energy available.'],
      feedback: 'Choose a task that belongs to your goal, then make one small beginning. Deciding about the rest afterward keeps the first action from becoming a promise to finish everything.',
    };
  }
  if (sourceId === 'quiet.gap' && block.kind === 'reveal' && goal === 'focus') {
    return {
      kind: 'reveal',
      prompt: 'Tap the two choices inside a notification pause.',
      items: [
        { label: 'Notice the pull', detail: 'A badge or sound caught my attention while I was working. Noticing the urge does not require opening the message immediately.' },
        { label: 'Choose the next move', detail: 'I can finish the small work step in front of me, or leave a return note if the message genuinely needs attention now.' },
      ],
    };
  }
  if (sourceId === 'quiet.gap' && block.kind === 'reveal' && goal === 'selfTrust') {
    return {
      kind: 'reveal',
      prompt: 'Tap the two parts of giving an answer you can stand behind.',
      items: [
        { label: 'Check before yes', detail: 'I notice the urge to agree quickly. I can check the time and energy the request would need before making a commitment.' },
        { label: 'Choose a real answer', detail: 'I can offer what fits, ask for time to decide, or decline. My answer can respect my own limits as well as the other person.' },
      ],
    };
  }
  return block;
}
