import { TRIAL_STRESS_LESSONS } from './trialStressLessons';
import { TRIAL_OVERTHINKING_LESSONS } from './trialOverthinkingLessons';
import { TRIAL_HOME_LESSONS, TRIAL_HOME_REPLACEMENTS } from './trialHomeLessons';
import type { LessonDefinition } from '../lessonBlock';
import { TRIAL_CHOICE_LESSONS } from './trialChoiceLessons';
import { TRIAL_PHONE_LESSONS, TRIAL_PHONE_REPLACEMENTS } from './trialPhoneLessons';
import { TRIAL_ATTENTION_LESSONS, TRIAL_ATTENTION_REPLACEMENTS } from './trialAttentionLessons';
import { TRIAL_SLEEP_LESSONS, TRIAL_SLEEP_REPLACEMENTS } from './trialSleepLessons';

const PRACTICAL_LESSONS = [
  {
    id: 'quiet.trialpromise', title: 'Choose One Small Promise',
    step: 'Choose one small action and a realistic moment to try it.',
    blocks: [
      { kind: 'text', text: 'When you want to follow through more often, a broad promise like take better care of myself leaves the beginning unclear. **Choose one small action you actually want to try**. It could be reading one page, putting one item away, or stepping outside when that fits your situation.' },
      { kind: 'text', text: 'Make the action specific enough that you can recognize an attempt. **Read one page tells you where to begin and stop**. Read more leaves both open. You can choose something different; the useful part is giving the promise a size that fits the time and energy available.' },
      { kind: 'list', items: [
        { term: 'One action', text: 'Name something visible and small, such as opening the book and reading one page.' },
        { term: 'One moment', text: 'Choose a realistic place in the day, such as after putting lunch dishes away.' },
        { term: 'Room to adapt', text: 'If that moment changes, choose another available time or a smaller action instead of adding catch-up work.' },
      ] },
      { kind: 'choice', prompt: 'You want to read regularly, but tomorrow is busy. Which promise gives you a clear beginning?', options: [
        { label: 'Read one page after putting my lunch dishes away', feedback: 'That names an action and a recognizable moment. Check that the moment really has room for the page you chose.' },
        { label: 'Read as much as possible whenever I get time', feedback: 'That expresses the intention, but leaves the beginning and ending unclear. Name one page and a realistic moment so the attempt is easier to recognize.' },
      ] },
      { kind: 'text', text: 'Choose the promise for your own needs rather than because the example sounds impressive. **A useful small action is enough for this first attempt**. You will have opportunities to notice what helped and adjust the plan; today does not need to prove how the whole week will go.' },
      { kind: 'do', text: 'Complete this sentence: **After ___, I will ___**. Choose one small action you want to try and a realistic moment in today’s actual schedule.' },
    ],
    source: 'Author practical example of specifying a manageable personal commitment and a recognizable cue; no guaranteed habit-formation timeline or psychological outcome is claimed.',
  },
  {
    id: 'quiet.trialkeeppromise', title: 'Keep What Fits Your Day',
    step: 'Keep one useful action small and adjust what got in its way.',
    blocks: [
      { kind: 'text', text: 'At the end of the first week, you may have tried some steps and left others unfinished. **Look for one useful detail rather than grading the week**. An action that fitted after lunch or a reminder you actually noticed gives you information you can use again.' },
      { kind: 'text', text: 'If an attempt did not fit, describe the obstacle specifically. **The evening was already full is information you can act on**. A different time or a smaller action may fit better. You do not need to turn a missed attempt into a judgement about whether you can follow through.' },
      { kind: 'reveal', prompt: 'Tap the parts of a promise you can adapt.', items: [
        { label: 'Keep the useful part', detail: 'If one page after lunch fitted your day, it can stay one page. A useful action does not have to grow immediately.' },
        { label: 'Change the obstacle', detail: 'If the book was never nearby, put it where the reading begins instead of relying on a louder reminder.' },
        { label: 'Return after a miss', detail: 'Use the next realistic opportunity for the small action. There is no extra pile of pages required to earn a return.' },
      ] },
      { kind: 'choice', prompt: 'Your reading plan fitted two days, but a busy evening interrupted the next attempt. What could you try?', options: [
        { label: 'Keep one page and choose a more available moment', feedback: 'That keeps the action manageable while changing the timing that got in the way. Try the adjustment in your actual next day.' },
        { label: 'Double the pages so I can catch up before continuing', feedback: 'That adds work to a plan that already struggled to fit. Return through the small action first, then decide whether anything needs changing.' },
      ] },
      { kind: 'text', text: 'If you have not found a useful detail yet, **choose one simple next attempt**. You can learn from that attempt without rewriting the entire plan. The point is a commitment you can describe and adapt, rather than a perfect record you must protect.' },
      { kind: 'do', text: 'Choose **one small promise to try again**. Keep what fitted, change one obstacle if needed, and give the next attempt a realistic moment in your day.' },
    ],
    source: 'Author practical first-week reflection focused on a specific commitment, actual obstacles and a manageable return; no claims about a completed habit or guaranteed self-trust outcome.',
  },
  {
    id: 'body.trialmorningprep', title: 'Prepare One Morning Step',
    step: 'Put one item where tomorrow’s first action begins.',
    blocks: [
      { kind: 'text', text: 'A rushed morning can begin with a search for something you need. **Choose one item to prepare tonight**, based on the first action you actually want to make easier. Clothes, a bag, or a clean mug may be more useful than planning a whole new routine.' },
      { kind: 'text', text: 'Start with the moment that tends to slow you down. If getting dressed is difficult because you cannot find a clean shirt, **place one suitable outfit where you will use it**. Preparing something unrelated may look organized without helping that particular morning action.' },
      { kind: 'reveal', prompt: 'Tap the parts of one useful preparation.', items: [
        { label: 'The first action', detail: 'I want to get dressed before leaving. This names a task I actually expect to do tomorrow morning.' },
        { label: 'The needed item', detail: 'I will put a suitable shirt and trousers where I can reach them, without sorting the entire wardrobe.' },
        { label: 'The starting place', detail: 'The items belong where I get dressed, so they are available at the moment the action begins.' },
      ] },
      { kind: 'choice', prompt: 'You often spend the morning looking for your keys. Which preparation directly helps?', options: [
        { label: 'Put the keys beside the bag I will take', feedback: 'That addresses the search that actually delays you. You can find the keys at the place where you are preparing to leave.' },
        { label: 'Write a longer list of everything I should do tomorrow', feedback: 'A list can help with planning, but it does not move the missing keys. First prepare the item that this particular action needs.' },
      ] },
      { kind: 'text', text: 'Let one preparation be enough. **Check whether it helped when you reach that moment tomorrow**, then adjust if needed. If you share the space, choose a place that works for the people using it rather than moving someone else’s things without asking.' },
      { kind: 'do', text: 'Tonight, **prepare one item for tomorrow’s first action**. Put it where you will use it and leave the rest of the routine for another decision.' },
    ],
    source: 'Author practical example of reducing a specific morning obstacle by preparing the needed item; no health outcome is claimed.',
  },
  {
    id: 'body.trialmorningfood', title: 'Make Breakfast Easier',
    step: 'Choose one realistic breakfast option for your next morning.',
    blocks: [
      { kind: 'text', text: 'If preparing breakfast is one of the things that makes your morning feel complicated, **choose an easy option in advance**. Start with food you already have and usually eat. This is a practical way to reduce one morning decision, rather than a rule about a particular meal.' },
      { kind: 'text', text: 'Look at the time and equipment you will actually have. A breakfast that needs several pans may not fit a morning with little spare time. **Choose something you can prepare and eat comfortably**, taking your own preferences and any dietary needs into account.' },
      { kind: 'list', items: [
        { term: 'Available', text: 'Check that the food and the items you need are already there. A plan that needs shopping is a separate task.' },
        { term: 'Manageable', text: 'Choose an option that fits the time you expect to have, including any preparation and washing up.' },
        { term: 'Flexible', text: 'Keep a simpler alternative in mind if the morning changes, rather than treating a changed plan as a failure.' },
      ] },
      { kind: 'choice', prompt: 'Tomorrow morning is busy and your usual cooked breakfast will not fit. What could help?', options: [
        { label: 'Choose a simpler option from food I already have', feedback: 'That adapts the plan to the actual morning. Check that the option fits your needs and is practical to prepare.' },
        { label: 'Keep the original plan and hope extra time appears', feedback: 'The original breakfast may suit another day. A simpler option gives this particular morning a more realistic starting point.' },
      ] },
      { kind: 'text', text: 'Notice what this week’s small changes have made easier. **Keep the preparation that actually helped**, whether it was food, clothing, or a first action. You can reuse one useful change without keeping every suggestion or building a bigger routine for next week.' },
      { kind: 'do', text: 'Choose **one breakfast option that fits tomorrow**. Prepare one needed item if useful, and keep the simplest part of your morning plan easy to repeat.' },
    ],
    source: 'Author practical planning example using existing food, personal preferences and dietary needs; no nutritional prescription or energy benefit is claimed.',
  },
  {
    id: 'quiet.trialquietcue', title: 'Give Quiet a Place',
    step: 'Link one brief quiet pause to a moment already in your day.',
    blocks: [
      { kind: 'text', text: 'A quiet pause can be easy to forget when it has no place in the day. **Choose an ordinary moment you already recognize**, such as putting down your lunch dishes. You can use that moment to notice one sound before returning to what comes next.' },
      { kind: 'text', text: 'The moment needs to fit the pause you want. If leaving home is usually rushed, that may be an awkward time to stop. **Choose a moment with a little room around it**, rather than an ideal time that only exists on a completely different day.' },
      { kind: 'sequence', prompt: 'Arrange a small quiet pause in a useful order.', steps: [
        'Choose an ordinary moment that already happens.',
        'At that moment, listen to one nearby sound.',
        'Return to your next activity after the brief pause.',
      ], feedback: 'The familiar moment helps you notice the opportunity. The sound gives the pause a simple focus, and the next activity gives it a natural ending.' },
      { kind: 'choice', prompt: 'Your mornings are always rushed, but you usually sit down after lunch. Where could a small pause fit?', options: [
        { label: 'After I sit down following lunch', feedback: 'That uses a moment with room in the day you actually have. You can listen briefly without redesigning the whole morning.' },
        { label: 'In the busiest part of leaving home', feedback: 'That moment might work on another day. For now, choose the available gap rather than adding a pause to an already rushed task.' },
      ] },
      { kind: 'text', text: 'If the chosen moment passes, the day is still available. **Use the next suitable gap or try again tomorrow**. The cue is a reminder to notice an opportunity, and missing it does not require extra practice or an explanation before returning.' },
      { kind: 'do', text: 'Complete this sentence: **After ___, I will notice one nearby sound**. Choose an ordinary moment with room for a brief pause in your real day.' },
    ],
    source: 'Author practical example of giving an ordinary attention pause a recognizable cue; no sleep or clinical claim is made.',
  },
  {
    id: 'focus.trialquietphone', title: 'Make Room for Quiet',
    step: 'Put unrelated phone checking aside for one brief quiet pause.',
    blocks: [
      { kind: 'text', text: 'A quiet moment can fill with phone checks before you notice that you picked it up. **Give the phone a practical place for one pause** so listening to a sound or noticing your surroundings has a chance to be the next thing you do.' },
      { kind: 'text', text: 'The arrangement should fit your situation. You may need an alarm or a way for someone to reach you. **Keep necessary functions available while leaving unrelated apps aside**. A quiet pause does not depend on making yourself unavailable to everyone or leaving your home.' },
      { kind: 'reveal', prompt: 'Tap the parts of a practical quiet pause.', items: [
        { label: 'What stays available', detail: 'Keep the contact or function you genuinely need according to your situation, without opening unrelated apps.' },
        { label: 'What you notice', detail: 'Choose one ordinary sound or object nearby so the pause has a simple place for your attention.' },
        { label: 'How it ends', detail: 'Return to the next activity when the brief pause is over, without needing to produce a perfectly quiet feeling.' },
      ] },
      { kind: 'choice', prompt: 'You want a quiet pause but need to hear an important call. What arrangement could fit?', options: [
        { label: 'Keep the call available and leave the feed closed', feedback: 'That preserves the necessary contact while giving the pause a clear boundary around unrelated checking.' },
        { label: 'Keep the feed open so I can watch for the call', feedback: 'The call and the feed are different functions. Choose an arrangement that keeps the call available without adding the feed to the pause.' },
      ] },
      { kind: 'text', text: 'Think of one moment this week when returning to a sound or sensation was useful. **Reuse that small action in this pause**. It can remain a brief part of an ordinary day, rather than becoming a longer session or another standard you must meet.' },
      { kind: 'do', text: 'For one brief pause, **leave unrelated phone checking aside and notice one thing nearby**. Keep necessary contact available and return gently if your attention wanders.' },
    ],
    source: 'Author practical example distinguishing necessary phone contact from unrelated checking during a brief attention pause; no device-distance benefit is claimed.',
  },
  {
    id: 'quiet.trialangerfacts', title: 'Check Before You Assume',
    step: 'Separate what happened from your interpretation before responding.',
    blocks: [
      { kind: 'text', text: 'Someone interrupts you, and the thought arrives: they do not respect me. **Separate what happened from what you think it means**. The interruption is something you observed. The reason for it may still be unknown, even when the interpretation feels convincing.' },
      { kind: 'text', text: 'This does not mean pretending the interruption was fine. **Keep the issue clear enough to discuss**. You can say that you were interrupted and ask to finish your sentence, without first proving why the other person acted that way or deciding what kind of person they are.' },
      { kind: 'list', items: [
        { term: 'Observed', text: 'They began speaking before I finished my sentence. This describes the event without guessing an intention.' },
        { term: 'Interpreted', text: 'They do not respect me. This may be what I think, but the event alone does not establish their reason.' },
        { term: 'Available response', text: 'I can ask to finish, clarify what happened, or choose a better time to continue.' },
      ] },
      { kind: 'choice', prompt: 'A colleague interrupts and you think they are dismissing you. What could you say first?', options: [
        { label: 'I had not finished. Can I complete that point?', feedback: 'That addresses the interruption directly and gives the other person a clear request, without requiring you to establish their intention first.' },
        { label: 'You interrupted because my opinion does not matter to you', feedback: 'That combines the event with a conclusion about their reason. State the interruption and your request first so the actual issue stays clear.' },
      ] },
      { kind: 'text', text: 'A pause may help you notice the difference, even while irritation remains. **Choose words that fit what you actually know**. You can set a limit or leave a difficult exchange when needed without using an unconfirmed interpretation as the basis for your response.' },
      { kind: 'do', text: 'In one irritating moment, **name the event, notice your interpretation, and choose a clear request**. You do not have to settle the other person’s intention before responding.' },
    ],
    source: 'Author practical example of distinguishing an observed event from an interpretation and making a specific request, consistent with the existing anger curriculum.',
  },
  {
    id: 'focus.trialphoneplace', title: 'Choose a Phone Boundary',
    step: 'Put unrelated phone checking aside for one small task action.',
    blocks: [
      { kind: 'text', text: 'If checking your phone interrupts a task, choose an arrangement that fits that particular work. **Separate necessary phone use from unrelated checking**. You might need a reference, an authentication code, or important contact while still wanting to leave a feed closed.' },
      { kind: 'text', text: 'Begin with one task action, such as reading a paragraph or completing a question. **Choose where the phone belongs for that action**. Another surface, a bag, or a closed unrelated app may be practical depending on the tools and contact you actually need.' },
      { kind: 'list', items: [
        { term: 'The task', text: 'Name one visible action so you know what the arrangement is meant to support.' },
        { term: 'Necessary use', text: 'Keep the required tool or important contact available in a way that fits your situation.' },
        { term: 'Unrelated checks', text: 'Choose a suitable point for ordinary updates instead of leaving a feed open beside every task action.' },
      ] },
      { kind: 'choice', prompt: 'Your task needs a code on your phone, but a feed keeps interrupting. What arrangement could fit?', options: [
        { label: 'Get the code, close the feed, and put the phone aside', feedback: 'That keeps the tool you need while giving unrelated checking a boundary. Then return to the task action you chose.' },
        { label: 'Keep the feed open because I need the phone for the code', feedback: 'The code and the feed serve different purposes. Needing one function does not require keeping an unrelated app active throughout the task.' },
      ] },
      { kind: 'text', text: 'Try the arrangement for the action you selected. **Adjust it for a real need you discover**, rather than expecting one placement to suit every task. If you check unexpectedly, close the unrelated app and return through the next small work action.' },
      { kind: 'do', text: 'For one task action, **keep necessary phone use available and put unrelated checking aside**. Choose where ordinary updates will fit after that action.' },
    ],
    source: 'Author practical example of setting a task-specific phone boundary; avoids universal claims about device presence, willpower depletion or required device distance.',
  },
  {
    id: 'focus.trialsound', title: 'Match Sound to the Task',
    step: 'Compare one reading or writing action with fewer competing words.',
    blocks: [
      { kind: 'text', text: 'If you keep losing your place while reading or writing, notice the sound around you. **Try changing one source of competing words**, such as a song with lyrics, while keeping the task itself small enough to compare. You are looking for a setup that suits this task.' },
      { kind: 'text', text: 'You may not be able to change every sound in a shared room. Start with something you control, such as pausing your own music or moving away from a speaker when practical. **The change can be modest**, and complete silence is not a requirement.' },
      { kind: 'reveal', prompt: 'Tap the parts of a useful comparison.', items: [
        { label: 'One task', detail: 'Read a short section or write a small part of the message so the attempt has a clear purpose.' },
        { label: 'One change', detail: 'Pause the lyrics or choose wordless sound, while leaving other parts of the setup as practical as possible.' },
        { label: 'What you notice', detail: 'Notice whether following your own words is easier, harder, or much the same. Any of those answers can inform the next attempt.' },
      ] },
      { kind: 'choice', prompt: 'You reread a paragraph while a song plays. What would give you useful information?', options: [
        { label: 'Pause the lyrics and try the next short section', feedback: 'That lets you compare one practical change during the same kind of task. Keep the arrangement that helps you follow the words.' },
        { label: 'Assume all music must be removed from every task', feedback: 'This attempt only needs to tell you about this reading task. Different sounds may suit a different activity or setting.' },
      ] },
      { kind: 'text', text: 'Look back at the useful choices from this week: a clear next action, a note for later, or a practical phone boundary. **Keep one arrangement that helped you begin or return**. You can reuse a small useful change without rebuilding your entire work routine.' },
      { kind: 'do', text: 'Try **one small reading or writing action with fewer competing words**. Notice what fits, then keep one useful setup from this week for your next task.' },
    ],
    source: 'Author practical comparison of an individual sound preference during reading or writing; makes no universal cognitive-performance claim.',
  },
] as const satisfies readonly LessonDefinition[];

export const TRIAL_WEEK_LESSONS = [...TRIAL_STRESS_LESSONS, ...TRIAL_OVERTHINKING_LESSONS, ...TRIAL_HOME_LESSONS, ...TRIAL_CHOICE_LESSONS, ...PRACTICAL_LESSONS, ...TRIAL_ATTENTION_LESSONS, ...TRIAL_PHONE_LESSONS, ...TRIAL_SLEEP_LESSONS] as const;

export const TRIAL_WEEK_REPLACEMENTS = {
  'stress.signs': 'stress.trialsigns',
  'focus.stressinbox': 'stress.trialnext',
  'stress.load': 'stress.trialload',
  'quiet.stressthoughts': 'stress.trialplan',
  'worry.loop': 'worry.trialloop',
  'focus.overthinkinghard': 'worry.trialaction',
  'worry.facts': 'worry.trialfacts',
  'quiet.smalldecision': 'quiet.trialpromise',
  'quiet.askadvice': 'quiet.trialkeeppromise',
  'breath.nightexhale': 'breath.trialnight',
  'breath.wake': 'breath.trialmorning',
  'breath.stressexhale': 'breath.trialstress',
  'breath.overthinkingexhale': 'breath.trialworry',
  'breath.angerexhale': 'breath.trialanger',
  'breath.focusexhale': 'breath.trialfocus',
  'quiet.two': 'breath.trialquiet',
  'body.capacity': 'breath.trialrecovery',
  'quiet.trust': 'breath.trialselftrust',
  'body.morningevening': 'body.trialmorningprep',
  'body.morningappetite': 'body.trialmorningfood',
  'sleep.quietanchor': 'quiet.trialquietcue',
  'focus.quietphone': 'focus.trialquietphone',
  'quiet.angerthoughts': 'quiet.trialangerfacts',
  'quiet.overthinkingvoice': 'quiet.trialworryquestion',
  'focus.phone': 'focus.trialphoneplace',
  'focus.words': 'focus.trialsound',
  ...TRIAL_HOME_REPLACEMENTS,
  ...TRIAL_PHONE_REPLACEMENTS,
  ...TRIAL_SLEEP_REPLACEMENTS,
  ...TRIAL_ATTENTION_REPLACEMENTS,
} as const;
