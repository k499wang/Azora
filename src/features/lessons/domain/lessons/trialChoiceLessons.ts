import type { LessonDefinition } from '../lessonBlock';

interface ChoiceLesson {
  id: string;
  title: string;
  opening: string;
  teaching: string;
  example: string;
  prompt: string;
  response: string;
  feedback: string;
  alternative: string;
  alternativeFeedback: string;
  steps: readonly [string, string, string];
  sequenceFeedback: string;
  action: string;
  closing: string;
}

/** A complete everyday skill; the scheduled guide is one brief supporting aside. */
function choiceLesson<const Definition extends ChoiceLesson>(definition: Definition): LessonDefinition & { id: Definition['id'] } {
  return {
    id: definition.id,
    title: definition.title,
    step: definition.action,
    blocks: [
      { kind: 'text', text: definition.opening },
      { kind: 'text', text: definition.teaching },
      { kind: 'text', text: definition.example },
      { kind: 'choice', prompt: definition.prompt, options: [
        { label: definition.response, feedback: definition.feedback },
        { label: definition.alternative, feedback: definition.alternativeFeedback },
      ] },
      { kind: 'sequence', prompt: 'Put the idea into a practical order.', steps: definition.steps, feedback: definition.sequenceFeedback },
      { kind: 'text', text: 'Today’s one-minute breathing Reset offers another place to try a pause. **Follow its prompts comfortably**, breathe normally or stop if needed, and let the guide handle the timing.' },
      { kind: 'do', text: `**${definition.action}** ${definition.closing}` },
    ],
    source: 'Author practical everyday example: choosing a specific action based on the situation, available information and personal limits. The scheduled guide is supporting context; no health outcome or psychological mechanism is claimed.',
  };
}

export const TRIAL_CHOICE_LESSONS = [
  choiceLesson({
    id: 'breath.trialnight', title: 'Give the Evening an End',
    opening: 'An evening task can keep growing because finishing one part reveals another thing you could do. **Choose what finished means for this attempt** before letting the next detail decide how the rest of your evening goes. A useful ending can leave some work for tomorrow.',
    teaching: 'Look for an ending you can recognize, such as answering one message or putting away the items you used. **Separate that ending from feeling completely caught up**. The first is an action you can finish; the second may keep changing as more requests or ideas appear.',
    example: 'You are answering a message before bed and notice three older messages underneath it. **Finish the reply you opened the app for**, then note when you can look at the others. Seeing them does not automatically make them part of tonight’s chosen task.',
    prompt: 'You finish tonight’s planned reply and see more nonurgent messages. What could give the evening a clear ending?',
    response: 'Close the app and choose when to revisit the others',
    feedback: 'That completes the task you actually chose. The remaining messages can have a suitable time without extending tonight’s check automatically.',
    alternative: 'Answer one more before deciding where to stop',
    alternativeFeedback: 'That may fit if something genuinely needs attention, but another reply alone does not create an ending. Check its importance and choose a boundary before continuing.',
    steps: ['Name the evening task you are doing.', 'Choose a visible stopping point for this attempt.', 'At that point, leave a return note if needed and move on.'],
    sequenceFeedback: 'A named task and an observable ending make the next decision clearer. Unfinished work can have a return point without occupying the rest of the evening.',
    action: 'Choose a clear ending for one evening task.',
    closing: 'When you reach it, leave a next-step note if useful and move to an ordinary bedtime activity. Let the chosen ending be enough for this attempt.',
  }),
  choiceLesson({
    id: 'breath.trialmorning', title: 'Choose the First Move',
    opening: 'A slow morning can feel difficult when you picture everything you need to do at once. **Choose the first visible action**, such as sitting up or putting on the clothes you prepared. You can begin that action without deciding how the entire day will go.',
    teaching: 'A clear first action tells you what to do and when it is finished. **Get dressed is smaller than get my life together**, and putting on one item can be the beginning of getting dressed. Choose the level that fits the time and energy you actually have.',
    example: 'You need to leave soon, but you are still comparing several possible morning routines. **Start with the action your actual departure needs**, such as getting dressed. After that action, decide whether there is room for breakfast preparation or another task before you leave.',
    prompt: 'You have a busy morning and keep planning the ideal routine. Which beginning fits the situation?',
    response: 'Choose one needed action and begin its first visible part',
    feedback: 'That gives the real morning a starting point. You can choose the next action after completing this one rather than settling every detail before beginning.',
    alternative: 'Finish designing the routine before doing any part',
    alternativeFeedback: 'Planning can be useful at another time. Right now, a needed action with a clear beginning can fit the morning better than continuing to compare routines.',
    steps: ['Look at what this morning actually needs.', 'Choose one small action with a visible beginning.', 'Begin that action before deciding about the whole routine.'],
    sequenceFeedback: 'Start from today’s circumstances, then name a small action. Completing the first part gives you a clearer place to choose the next step.',
    action: 'Begin one small action your actual morning needs.',
    closing: 'Name what you will open, put on, or get ready. Decide about the rest after that first action, without using it to judge the whole day.',
  }),
  choiceLesson({
    id: 'breath.trialstress', title: 'Check Before Saying Yes',
    opening: 'A new request can feel urgent simply because someone has just asked. **Check what the request actually needs** before adding it to everything you already carry. You may need to know its deadline, its size, or which existing task should move to make room.',
    teaching: 'Separate receiving a request from agreeing to it. **A clear answer can include a limit or a question**, such as asking when the result is needed. Taking that small step gives both people more useful information than an immediate yes you have not checked.',
    example: 'Someone asks for help while you are finishing a task due today. **Ask when they need the help** before promising it now. If both tasks really are urgent, discuss priorities or another source of help rather than quietly treating both as the next task.',
    prompt: 'A new request arrives while an agreed deadline is close. What information would help you respond?',
    response: 'Ask when the new request is needed and compare commitments',
    feedback: 'The timing helps you judge what can fit. If the requests compete, make that conflict visible before promising more work.',
    alternative: 'Agree now and decide what to delay afterward',
    alternativeFeedback: 'That leaves the conflict hidden until after the promise. A brief check can lead to a more realistic agreement or a useful discussion about priorities.',
    steps: ['Identify what the new request needs and when.', 'Check what you have already committed to.', 'Offer a realistic response or ask about priorities.'],
    sequenceFeedback: 'Understand the request before fitting it into your day. Then your response can reflect actual capacity rather than only the pressure of being asked.',
    action: 'Check one request before making a new commitment.',
    closing: 'Ask about timing or scope, consider what already fills the day, and state what you can realistically offer. A smaller commitment can still be a clear answer.',
  }),
  choiceLesson({
    id: 'breath.trialworry', title: 'Choose When to Check',
    opening: 'After asking a practical question, you may feel an urge to check for the answer again and again. **Choose what would make another check useful**. The question can remain important without needing your attention every time the same uncertain feeling returns.',
    teaching: 'Distinguish a reason to revisit the situation from a wish to feel certain. **New information or an approaching deadline can change the next action**. Refreshing a page immediately after the last check may show the same information while leaving the uncertainty just as open.',
    example: 'You have asked when a form is due and are waiting for a reply. **Choose a suitable next check based on when an answer could help**. You can return to another task meanwhile, keeping necessary contact available rather than watching the inbox throughout the wait.',
    prompt: 'You checked for a nonurgent reply a moment ago and nothing changed. What could guide the next check?',
    response: 'Choose a useful time or a relevant change in information',
    feedback: 'That ties checking to the situation. The unresolved feeling can remain while you return to another activity until a check has a practical purpose.',
    alternative: 'Refresh whenever the same doubt returns',
    alternativeFeedback: 'The returning doubt may contain no new information. Ask what another check could change before making the feeling itself a reason to refresh.',
    steps: ['Identify what information you are waiting for.', 'Choose a suitable next check or a relevant change to watch for.', 'Return to another activity while the answer remains open.'],
    sequenceFeedback: 'A checking boundary keeps the actual question available without requiring constant monitoring. Change the boundary if a real deadline or important new information calls for it.',
    action: 'Choose a useful next check for one unanswered question.',
    closing: 'Use the timing and importance of the situation to decide. Return to another activity meanwhile, keeping any necessary contact available without monitoring unrelated updates.',
  }),
  choiceLesson({
    id: 'breath.trialanger', title: 'Say What Needs Changing',
    opening: 'An irritating moment may bring a sharp description of the person before a clear description of the problem. **Name what you want to be different**. A request about the actual situation gives the other person something more specific to respond to than a judgement about them.',
    teaching: 'Keep the request tied to an action someone could recognize. **Please let me finish this sentence** is clearer than be more respectful. You can care about respect while describing the interruption and asking for a particular change in how the conversation continues.',
    example: 'Someone starts another topic while you are explaining a problem. **Ask to complete the point you were making**, then listen to what they need to say. The request can be firm without claiming that you know why they interrupted or listing every previous disagreement.',
    prompt: 'You are interrupted halfway through explaining something. Which request makes the needed change clear?',
    response: 'Please let me finish this point, then I will listen',
    feedback: 'That names an observable change and a way for the conversation to continue. The issue can stay clear even while you still feel irritated.',
    alternative: 'Tell them they never care about what I say',
    alternativeFeedback: 'That turns this interruption into a broad judgement. Start with the particular behavior and the change you need, so there is a concrete request to discuss.',
    steps: ['Describe the specific situation you want to address.', 'Name the action you want to be different.', 'Make one clear request and leave room for a response.'],
    sequenceFeedback: 'The situation explains the request, and the requested action makes it usable. You can then listen, clarify, or choose a suitable limit if needed.',
    action: 'Turn one irritated response into a specific request.',
    closing: 'Name the behavior and what you need next. Keep the request about this situation, with room to listen or choose another time to continue if necessary.',
  }),
  choiceLesson({
    id: 'breath.trialfocus', title: 'Leave a Way Back',
    opening: 'An interruption can leave you returning to a task without remembering exactly where you stopped. **Leave a small return note before switching away** when you can. The note holds the next action so you do not have to keep the whole unfinished task in mind.',
    teaching: 'A useful note names the place and the action, rather than only the project. **Check the date in paragraph two is clearer than finish the report**. Leave the note with the work so it is easy to see when the interruption or chosen break ends.',
    example: 'You stop reading a form to answer a necessary call. **Mark the question you reached and note the detail you still need**. When you return, the note tells you where to continue without starting from the top or opening every related document again.',
    prompt: 'You need to leave a half-finished document for a call. Which note makes returning clearer?',
    response: 'Check the date in paragraph two, then complete that sentence',
    feedback: 'That names the place and the next visible action. You can begin there when you return rather than reconstructing the entire project first.',
    alternative: 'Remember to finish the important document',
    alternativeFeedback: 'That keeps the project visible but leaves its next action unclear. Add the particular place or missing detail you want to return to.',
    steps: ['Find the point where the task is stopping.', 'Leave a short note naming the place and next action.', 'On returning, begin with the action in the note.'],
    sequenceFeedback: 'Capture enough information to restart, then let the note hold it while you are away. The return can be small even if the interruption lasted longer than expected.',
    action: 'Leave a clear return note before switching away from one task.',
    closing: 'Name the place and next action in a sentence you can use later. Put the note with the task so returning has a visible beginning.',
  }),
  choiceLesson({
    id: 'breath.trialquiet', title: 'Let a Thought Wait',
    opening: 'A quiet moment can still contain thoughts about dinner, a message, or something unfinished. **Choose one ordinary detail to notice** rather than using the absence of thoughts as your goal. A nearby sound or the feel of your chair gives you something available right now.',
    teaching: 'Attention can move away from the detail you chose. **Noticing that movement gives you a chance to return**. You do not need to finish the thought, explain why it appeared, or begin the whole pause again before listening to the sound in front of you.',
    example: 'You are listening to rain and begin planning tomorrow. **Notice that you are planning, then listen for the rain again**. The plan may still be unfinished. Returning is the action you are trying, rather than a way to prove that nothing else should enter your mind.',
    prompt: 'While listening to a nearby sound, you notice that you are planning dinner. What fits the idea?',
    response: 'Notice the planning and listen to the sound again',
    feedback: 'That is a return to the detail you chose. The thought can remain unfinished without turning the pause into another planning session.',
    alternative: 'Complete the whole dinner plan before returning',
    alternativeFeedback: 'You can plan later if needed. Right now, returning does not require finishing the thought that drew your attention away.',
    steps: ['Choose one ordinary sound or sensation nearby.', 'Notice when your attention has moved to something else.', 'Return to the original detail without restarting the pause.'],
    sequenceFeedback: 'The detail is a place to return, not a test of staying there perfectly. Each return uses the same small action even when thoughts continue to appear.',
    action: 'Notice one nearby detail and return when your attention wanders.',
    closing: 'Listen to a sound or notice a comfortable sensation. Let a brief return be enough, without checking whether you have reached a perfectly quiet feeling.',
  }),
  choiceLesson({
    id: 'breath.trialhome', title: 'Keep One Job Separate',
    opening: 'One small household task can grow when moving an item reveals another job. **Notice the new job without automatically adding it**. Clearing a chair does not have to become sorting a wardrobe simply because you opened the wardrobe to put one coat away.',
    teaching: 'Name the boundary of the task you actually chose. **Putting away the coat finishes that action**, even if nearby shelves need attention. Another job can matter and still belong to a separate decision about your time, rather than becoming part of this attempt by default.',
    example: 'You take a cup to the kitchen and notice a crowded drawer. **Put the cup in its next suitable place first**. Then return to the area you chose, or stop if that was the whole task. The drawer can have a separate time if it needs one.',
    prompt: 'Putting a coat away reveals an untidy wardrobe shelf. What keeps the original task clear?',
    response: 'Finish putting the coat away, then decide about the shelf separately',
    feedback: 'The new job does not erase the ending of the action you chose. You can stop or choose another bounded task with the time available.',
    alternative: 'Start the shelf immediately because I noticed it',
    alternativeFeedback: 'The shelf may deserve attention, but noticing it does not make it part of this attempt. Decide whether it fits after finishing the original action.',
    steps: ['Name the household action you chose.', 'Notice a new job without automatically beginning it.', 'Finish the chosen action before deciding about another job.'],
    sequenceFeedback: 'Keeping the tasks separate gives each one a recognizable ending. You can choose another task afterward without making the first attempt expand indefinitely.',
    action: 'Finish one chosen household action before taking on another job.',
    closing: 'When another chore catches your eye, note it if useful and return to the action you chose. Decide about the extra job separately once that action ends.',
  }),
  choiceLesson({
    id: 'breath.trialrecovery', title: 'Fit the Task to Today',
    opening: 'A task planned on an easier day may ask for more than you have available now. **Check what the task needs against today’s capacity**. You can change its size, timing, or support rather than treating the original plan as the only acceptable version of the day.',
    teaching: 'Name the essential part before deciding what can change. **Put food that needs chilling away** may be the useful part of a larger kitchen job. Other tasks can wait or be shared. The smaller version should fit the situation, and rest remains a real choice.',
    example: 'You planned to sort a cupboard, but now have little energy. **Leave the cupboard and address one immediate need instead**, if there is one. You might put away the food, ask someone for help, or continue resting when no task needs your attention right now.',
    prompt: 'A large household job no longer fits your energy today. What could make the response more realistic?',
    response: 'Check for an essential part, help, or a suitable time to wait',
    feedback: 'That adapts the demand to the situation. You can choose a smaller action or rest without promising to finish the original job afterward.',
    alternative: 'Keep the full job unchanged because it was already planned',
    alternativeFeedback: 'The original plan may have assumed more capacity. Check what actually matters now before treating every part as necessary today.',
    steps: ['Check your available energy and any immediate need.', 'Reduce, postpone, or share the demand where practical.', 'Choose the fitting small action or continue resting.'],
    sequenceFeedback: 'Start from the day you have. An adjusted task or a decision to rest can be specific and realistic without making the original plan a test you must pass.',
    action: 'Resize or postpone one demand to fit your available energy.',
    closing: 'Keep an essential part only if it needs attention and fits your capacity. Ask for help or choose rest when appropriate, without adding catch-up work as a penalty.',
  }),
  choiceLesson({
    id: 'breath.trialselftrust', title: 'Count What You Did',
    opening: 'After trying a small promise, you may judge the whole attempt by what remains unfinished. **Describe what you actually did before giving it a verdict**. Reading the page you chose and leaving the rest of the book unfinished can both be true without cancelling each other.',
    teaching: 'Compare the attempt with the action you named, rather than a larger standard added afterward. **One page remains one page**, even when you notice that you could have read more. A fair description gives you information about the action, its timing, and whether it fitted.',
    example: 'You put away your own plate as planned, then notice a sink full of other dishes. **Name the action you completed accurately**. The remaining dishes may need another decision, but they do not turn putting away the plate into something that never happened.',
    prompt: 'You read the page you chose, but the chapter is unfinished. What description includes the relevant facts?',
    response: 'I read the page I planned, and the chapter still has more pages',
    feedback: 'That recognizes both the completed action and the unfinished larger task. You can choose what comes next without erasing the attempt.',
    alternative: 'The attempt only counts if I finish the chapter too',
    alternativeFeedback: 'That adds a larger requirement after the promise. Start with what you actually chose and did, then make a separate decision about another action.',
    steps: ['Recall the small action you actually chose.', 'Describe what happened without adding a new requirement.', 'Use that information to choose the next realistic attempt.'],
    sequenceFeedback: 'An accurate account keeps the original promise and the outcome visible. You can notice a missed attempt or a completed one without turning either into a judgement about your character.',
    action: 'Describe one attempt fairly before deciding what comes next.',
    closing: 'Name the action you chose and what you actually did. Keep any unfinished larger task separate, then choose the next step using the information you have.',
  }),
] as const;
