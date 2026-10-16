import type { LessonBlock } from '../lessonBlock';

/** These sources need different teaching, rather than a different introduction. */
const WORK_TEACHING: Readonly<Record<string, readonly LessonBlock[]>> = {
  'sleep.anchor': [
    { kind: 'text', text: 'Opening supplied by the selected phone track.' },
    { kind: 'text', text: 'A starting cue is an ordinary event you can recognize, such as sitting down at your desk. **Link it to one visible work action**, such as opening the document you need. That gives the beginning a purpose before unrelated apps can take the first turn.' },
    { kind: 'text', text: 'Choose a cue that belongs to the day you actually have. If you study in different places, arriving at one particular desk may be too narrow. **Use a moment you can recognize across those places**, such as setting out your notes for the next task.' },
    { kind: 'list', items: [
      { term: 'The moment', text: 'When I set out the notes for this work period, I know the task is about to begin.' },
      { term: 'The first action', text: 'I will open the page I need and read the first paragraph before checking an unrelated app.' },
      { term: 'The phone boundary', text: 'Necessary tools remain available; nonessential checking waits until a suitable task boundary.' },
    ] },
    { kind: 'choice', prompt: 'Which beginning gives this work period a clear purpose?', options: [] },
    { kind: 'text', text: 'If the starting moment passes while you are distracted, you can still begin. **Use the next available task action** instead of waiting for another perfect start. The cue is something to help you notice a beginning, rather than a rule that prevents returning after an interruption.' },
    { kind: 'do', text: 'Action supplied by the selected phone track.' },
  ],
  'focus.phonebed': [
    { kind: 'text', text: 'Opening supplied by the selected phone track.' },
    { kind: 'text', text: 'Before a planned check, write the exact work action that comes next. **A return note should tell you what to do**, such as reading the next paragraph or answering the question under a heading. The name of the whole project usually leaves too much to reconstruct.' },
    { kind: 'text', text: 'Keep the note with the task rather than inside the app that pulls you away. **Make the return easy to see** when the check ends. A line on paper or at the top of your working document can hold the next action while you are away.' },
    { kind: 'sequence', prompt: 'Put this planned check and return in order.', steps: [
      'Write the next visible action beside the task.',
      'Complete the specific phone check you planned.',
      'Close the app and begin the action in your return note.',
    ], feedback: 'The note keeps the return clear. The phone check has an ending, and the next work action is already chosen when you close the app.' },
    { kind: 'choice', prompt: 'Which choice makes returning from the phone easier?', options: [] },
    { kind: 'text', text: 'If the check runs longer than intended, the note is still useful. **Return through the same small action** rather than creating a larger catch-up task. You can review the boundary later; beginning again does not require solving every reason the check became longer.' },
    { kind: 'do', text: 'Action supplied by the selected phone track.' },
  ],
  'sleep.threeam': [
    { kind: 'text', text: 'Opening supplied by the selected phone track.' },
    { kind: 'text', text: 'Noticing an unplanned check gives you a new decision even if some time has passed. **Close the unrelated app before reviewing the interruption**. Otherwise, working out how you became distracted can happen while the same feed is still offering another item to open.' },
    { kind: 'text', text: 'Look at the task you left and choose a small action you can see. **Make the return specific enough to begin now**. Reading the question, opening the correct page, or writing a rough first sentence is clearer than promising to recover the whole lost work period.' },
    { kind: 'list', items: [
      { term: 'Notice', text: 'Recognize that the current phone activity is outside the task or planned break you chose.' },
      { term: 'Close', text: 'Leave the unrelated app rather than finishing every available item before returning.' },
      { term: 'Resume', text: 'Begin one small task action, using a return note if you left one.' },
    ] },
    { kind: 'choice', prompt: 'What is a useful return after an overlong work-time check?', options: [] },
    { kind: 'text', text: 'Later, you can change one detail that invited the interruption, such as an unnecessary prompt. **Keep that review separate from returning** so it does not become another large task before work can begin. One useful adjustment is enough to try during the next work period.' },
    { kind: 'do', text: 'Action supplied by the selected phone track.' },
  ],
  'focus.charger': [
    { kind: 'text', text: 'Opening supplied by the selected phone track.' },
    { kind: 'text', text: 'Choose a phone place based on the work you are doing. If the task needs a phone tool, keep that function usable. **Put unrelated checking outside the immediate path** instead of assuming that every task requires the same distance or arrangement for the device.' },
    { kind: 'text', text: 'For a paper task, the phone might rest on another surface. For a task needing an authentication code, it may stay nearby with unrelated apps closed. **Make the arrangement fit the actual need** so a phone boundary supports the work rather than creating another obstacle.' },
    { kind: 'reveal', prompt: 'Tap the parts of a practical work-time phone place.', items: [
      { label: 'Needed use', detail: 'Keep a required tool or important contact available according to the task and your situation.' },
      { label: 'Unrelated checking', detail: 'Leave feeds or other unnecessary apps outside the immediate next action while you complete the chosen task step.' },
      { label: 'A useful check', detail: 'Choose a suitable task boundary for ordinary checks rather than moving the phone back after every small urge.' },
    ] },
    { kind: 'choice', prompt: 'Which phone arrangement supports this particular task?', options: [] },
    { kind: 'text', text: 'Try the arrangement for one bounded work period. **Adjust it for a real need you discover**, such as missing a required tool, rather than treating every urge to browse as a reason to abandon it. The next work period can use the practical information you learned about necessary phone functions during this attempt.' },
    { kind: 'do', text: 'Action supplied by the selected phone track.' },
  ],
};

const BEDTIME_PHONE_PLACE: readonly LessonBlock[] = [
  { kind: 'text', text: 'Opening supplied by the selected phone track.' },
  { kind: 'text', text: 'Choose the evening activity you actually want to do next, such as reading or getting ready for bed. **Give the phone a practical place during that activity** so another check is not automatically part of every small pause in what you are doing.' },
  { kind: 'text', text: 'Consider which phone functions need to stay available. You may use an alarm or need someone to reach you. **Keep necessary use available while leaving feeds aside**. The arrangement should fit your circumstances rather than depend on making every function impossible to reach.' },
  { kind: 'list', items: [
    { term: 'The next activity', text: 'Name one ordinary thing you want to do after the evening check ends.' },
    { term: 'The phone place', text: 'Choose where the phone can rest while that activity has your attention.' },
    { term: 'Necessary use', text: 'Plan how to use an alarm or needed contact without opening unrelated messages or feeds.' },
  ] },
  { kind: 'choice', prompt: 'Which phone place fits the bedtime activity you chose?', options: [] },
  { kind: 'text', text: 'If you pick up the phone again, check what you need from it. **Finish that specific purpose and put it back** rather than treating one pickup as the end of the boundary. You can return to your evening activity after a necessary check without starting a feed.' },
  { kind: 'do', text: 'Action supplied by the selected phone track.' },
];

export function phoneLessonTeaching(goal: string, sourceId: string): readonly LessonBlock[] | undefined {
  if (goal === 'phoneWork') return WORK_TEACHING[sourceId];
  if (goal === 'phoneBedtime' && ['focus.phone', 'focus.charger', 'focus.phonebed'].includes(sourceId)) return BEDTIME_PHONE_PLACE;
  return undefined;
}
