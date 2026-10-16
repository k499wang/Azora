import type { LessonDefinition } from '../lessonBlock';

/** Authored first-week examples; original lesson IDs remain available to saved plans. */
export const TRIAL_PHONE_LESSONS = [
  {
    id: 'focus.trialphoneworkloop',
    title: 'Notice the Task Escape',
    step: 'Notice one checking cue and choose what the moment needs.',
    source: 'Author practical, nonclinical guidance: notice a work-time cue and choose a task action or deliberate break, with brief guided support.',
    blocks: [
      { kind: 'text', text: 'You reach a difficult paragraph, then find yourself opening a feed. **Look at the moment before the check.** Perhaps the instructions were unclear, a sentence felt awkward, or you needed a break. That moment gives you something specific to respond to.' },
      { kind: 'text', text: 'Try describing the sequence without blaming yourself: “I could not find the answer, so I opened the app.” **The cue is the uncertain moment.** Checking may be familiar, but it does not tell you what the paragraph needs next.' },
      { kind: 'reveal', prompt: 'What might this moment need?', items: [
        { label: 'An unclear instruction', detail: 'Write the question you need answered, then look for that detail or ask someone who can clarify it.' },
        { label: 'A genuine break', detail: 'Choose a short break deliberately and leave a note showing where to resume the task afterward.' },
      ] },
      { kind: 'text', text: 'Today’s **one-minute relaxing Reset** offers a brief pause while you consider the cue. Follow its prompts comfortably, or stop and breathe normally if needed. Your next choice can stay practical and small.' },
      { kind: 'choice', prompt: 'You open a feed after getting stuck on a task. What could help you return?', options: [
        { label: 'Write the question I need to answer', feedback: 'That makes the obstacle visible. Look for the missing detail rather than expecting another scroll to make the instructions clearer.' },
        { label: 'Take a break and leave a return note', feedback: 'A break may fit what you need. Note the paragraph and question first, so returning does not require reconstructing the task.' },
      ] },
      { kind: 'text', text: 'Once you recognise the moment, **choose what fits the cue you noticed**. You might read one instruction again, ask a question, or take a deliberate break. The obstacle may still feel difficult; naming it gives your next step a clearer purpose.' },
      { kind: 'do', text: 'At your next checking urge, **name what happened just before it**. Choose one task action or a deliberate break, and leave a clear place to return.' },
    ],
  },
  {
    id: 'focus.trialphonebedtimeloop',
    title: 'Notice the Evening Cue',
    step: 'Notice your evening checking cue and choose a bedtime action.',
    source: 'Author practical, nonclinical guidance: identify an evening cue and choose an ordinary bedtime action, with brief guided support.',
    blocks: [
      { kind: 'text', text: 'Dinner ends, you sit on the couch, and your hand reaches for the same app. **Notice the moment before scrolling starts.** Your evening cue might be finishing a programme, plugging in the charger, or getting into bed with nothing else chosen.' },
      { kind: 'text', text: 'Describe one real sequence: “I finish watching, pick up the phone, and open the feed.” **Keep the description specific.** You are finding a moment you can recognize tonight, rather than deciding that every part of your evening needs changing.' },
      { kind: 'list', items: [
        { term: 'The moment', text: 'Choose an event you notice, such as turning off the television or putting your evening cup in the sink.' },
        { term: 'The next activity', text: 'Choose something ordinary that fits tonight: wash your face, set out clothes, or read a page somewhere comfortable.' },
      ] },
      { kind: 'text', text: 'Today’s **one-minute relaxing Reset** offers a brief pause at your evening cue. Follow its prompts comfortably, or stop and breathe normally if needed. You can also begin your chosen activity directly.' },
      { kind: 'choice', prompt: 'You reach for a feed as the television finishes. What could fit your evening?', options: [
        { label: 'Put the phone down and wash my face', feedback: 'That connects the end of the programme to a specific bedtime action. Keep what you need available, leave the feed closed, and begin washing your face.' },
        { label: 'Send the message I actually need to send', feedback: 'Necessary contact can still fit. Open that conversation directly, send the message, and choose what you will do after closing it.' },
      ] },
      { kind: 'text', text: 'If you notice the cue after you have already been scrolling, **the next choice is still available**. Close the feed when you notice, then begin your chosen activity. You can practise this from the evening you actually have, even when it starts late.' },
      { kind: 'do', text: 'Tonight, **name the moment before your usual scroll**. Begin one ordinary bedtime action you chose in advance, or complete a necessary phone task directly before moving on.' },
    ],
  },
  {
    id: 'focus.trialphoneworkcompany',
    title: 'Choose a Connection Break',
    step: 'Choose one deliberate way to connect during a work break.',
    source: 'Author practical, nonclinical guidance: purposeful social contact, realistic boundaries, and a clear return to work.',
    blocks: [
      { kind: 'text', text: 'Working alone can leave you wanting company. Opening a feed may bring plenty to watch without giving you the conversation you wanted. **Name the kind of contact you miss**: a quick exchange, hearing someone’s voice, or being around other people.' },
      { kind: 'text', text: 'Choose a form of contact that fits the break available. You might message a friend, arrange a call for later, or speak with a colleague who is free. **Make the invitation specific**, so the other person can decide whether the timing works.' },
      { kind: 'reveal', prompt: 'Make a connection break practical.', items: [
        { label: 'A clear invitation', detail: '“Are you free for a quick chat at lunch?” explains the contact you want without assuming they are available right now.' },
        { label: 'A clear return', detail: 'Leave a note such as “check the date in paragraph two” before you step away from the task.' },
      ] },
      { kind: 'choice', prompt: 'You want company, but your friend has not replied. What could you choose?', options: [
        { label: 'Leave the message and return to my next task step', feedback: 'Their reply can wait until a suitable checking point. An unanswered message does not require keeping the feed open while you wait.' },
        { label: 'Arrange another way to connect later', feedback: 'A later call or shared lunch may fit better. Make the arrangement if possible, then choose an available break for right now.' },
      ] },
      { kind: 'text', text: 'If a conversation starts, **agree on the time you have**. “I can talk until lunch ends” gives the exchange a practical boundary. You can enjoy the contact and still explain when you need to return, without rushing through unrelated recommendations afterward.' },
      { kind: 'text', text: 'When the break ends, notice what you actually received: conversation, company, or simply a message sent. **Use that information next time**. If a feed left you wanting direct contact, you can choose a different kind of break rather than making the same check longer.' },
      { kind: 'do', text: 'For one work break, **choose a specific way to connect**. Leave a small return note, make the contact you intended, and come back to that task step afterward.' },
    ],
  },
  {
    id: 'focus.trialphonebedtimecompany',
    title: 'Choose Evening Connection',
    step: 'Choose one purposeful connection and a comfortable evening ending.',
    source: 'Author practical, nonclinical guidance: purposeful evening contact, availability, and an ordinary bedtime transition.',
    blocks: [
      { kind: 'text', text: 'You may open a feed at night because you want company. **Ask what kind of connection would fit**: sharing something with a friend, hearing a familiar voice, or making a plan to see someone. That helps you choose where to go on the phone.' },
      { kind: 'text', text: 'For example, open a friend’s conversation directly and send the thing you wanted to share. **Keep the purpose visible** instead of passing through unrelated recommendations first. A message can be worthwhile even when the other person will read it tomorrow.' },
      { kind: 'list', items: [
        { term: 'Contact now', text: 'Ask whether someone is free before starting a call. Explain if you have only a few minutes tonight.' },
        { term: 'Contact later', text: 'Send an invitation for another day. You can leave the message there without waiting online for an immediate answer.' },
      ] },
      { kind: 'choice', prompt: 'A friend replies just as you are getting ready for bed. What could work?', options: [
        { label: 'Have a brief exchange and say goodnight', feedback: 'If that fits tonight, tell them when you are signing off. Closing a conversation kindly gives you a clear next moment for your bedtime routine.' },
        { label: 'Let them know I will reply tomorrow', feedback: 'That keeps the connection open without requiring a conversation now. Necessary or urgent contact can still be handled according to your situation.' },
      ] },
      { kind: 'text', text: 'If nobody is available, **let the unanswered message stay unanswered for now**. You might choose a familiar book, music, or another comforting activity. These do not replace the relationship; they give this evening somewhere to go while contact waits.' },
      { kind: 'text', text: 'Before opening the conversation, choose what follows it. **A small ending makes the transition concrete**: send your goodnight, close the app, then wash your face or put your cup away. Keep any alarm and necessary contact available in the way you need.' },
      { kind: 'do', text: 'If you want company tonight, **choose one purposeful contact**. Decide how you will end or leave the conversation, then move to one ordinary bedtime activity.' },
    ],
  },
  {
    id: 'focus.trialphoneworkoffline',
    title: 'Take an Offline Break',
    step: 'Try one simple break away from feeds and leave a return note.',
    source: 'Author practical, nonclinical guidance: try an available offline work break and observe personal preference without promising a particular result.',
    blocks: [
      { kind: 'text', text: 'A break from work can still fill up with new things to read and answer. **Try one break without a feed** and notice whether it suits you. The point is to give yourself another available choice when checking leaves the pause feeling crowded.' },
      { kind: 'text', text: 'Choose something that fits your body, surroundings, and time. You could drink water, look out a window, stretch comfortably, or listen to a familiar song. **An ordinary activity is enough**. The break does not need to become another useful job.' },
      { kind: 'sequence', prompt: 'Give this break a clear beginning and return.', steps: [
        'Write the small task action you will return to.',
        'Choose an available offline activity for the time you have.',
        'End the break and begin the action in your note.',
      ], feedback: 'The note holds your place while you are away. Choosing a manageable activity keeps preparation from taking over the break itself.' },
      { kind: 'choice', prompt: 'You have a short break and cannot leave your desk. What could you try?', options: [
        { label: 'Look away from the screen and have a drink', feedback: 'That is an available change of activity. Stay comfortable and notice whether the pause feels different from your usual checking break.' },
        { label: 'Listen to one familiar song with the feed closed', feedback: 'Audio can fit an offline break even if your phone plays it. Choose the song directly and leave unrelated apps closed.' },
      ] },
      { kind: 'text', text: 'At the end, **notice what the break was like**: pleasant, restless, restful, or much the same. You do not have to prove it worked. If one activity felt awkward, try another available option next time rather than extending the break until your mood changes.' },
      { kind: 'text', text: 'A phone may still be needed for music, accessibility, or necessary contact. **Keep the tool you need available** while leaving the feed closed. What matters here is the activity you chose, and having a clear place to return when that activity ends.' },
      { kind: 'do', text: 'During your next work break, **try one ordinary activity without a feed**. Leave a return note first, then notice your experience and begin that task step afterward.' },
    ],
  },
  {
    id: 'focus.trialphonebedtimeoffline',
    title: 'Choose an Offline Evening',
    step: 'Choose one small offline activity after an evening phone check.',
    source: 'Author practical, nonclinical guidance: prepare an ordinary evening alternative without promising sleep improvement.',
    blocks: [
      { kind: 'text', text: 'You close a feed, then open it again because the next part of the evening is empty. **Choose something small to do afterward**. Having an available activity gives closing the app somewhere to lead, instead of leaving another check as the easiest next step.' },
      { kind: 'text', text: 'Pick an activity that fits the evening you have. Read a page, put away a cup, or listen to familiar music. **Keep the preparation small**. Searching for a book or organising a whole room can become a new project when you wanted a quieter ending.' },
      { kind: 'reveal', prompt: 'Make an evening alternative easy to begin.', items: [
        { label: 'Already available', detail: 'Put a book where you usually sit, or choose the music before your final planned check. Use something you already have.' },
        { label: 'A modest finish', detail: 'Choose one page, one cup, or one song. You can decide what comes next after that small activity is finished.' },
      ] },
      { kind: 'choice', prompt: 'You want to close the feed, but reading feels like too much tonight. What could fit?', options: [
        { label: 'Choose a familiar song and put the phone down', feedback: 'That gives you an activity with little preparation. Start the audio directly and let the phone rest while it plays.' },
        { label: 'Begin the bedtime task I already need to do', feedback: 'Washing your face or setting out clothes can be a useful transition. Choose one ordinary action rather than adding a whole new routine.' },
      ] },
      { kind: 'text', text: 'Keep the room comfortable and **leave enough light to move safely**. You can use your phone for audio, an alarm, accessibility, or necessary contact. Leave unrelated recommendations closed while the activity you selected takes its turn.' },
      { kind: 'text', text: 'If you reach for the feed again, **return to the next available part of your activity**. Read the next line or finish putting the cup away. You do not need to restart the evening or make the activity longer to compensate for checking.' },
      { kind: 'do', text: 'Before your next evening check, **choose one small offline activity**. When the check ends, begin it with what is already available and let that be enough for this transition.' },
    ],
  },
  {
    id: 'focus.trialphoneworkending',
    title: 'End the Check Clearly',
    step: 'Choose what finishes a phone check before opening the app.',
    source: 'Author practical, nonclinical guidance: define a phone-check endpoint and reuse a concrete work return.',
    blocks: [
      { kind: 'text', text: 'You open an app for one message and find several new things to read. **Choose the ending before opening**. An endpoint such as “reply to Sam’s question” tells you when the check you intended is complete, even while other items remain available.' },
      { kind: 'text', text: 'Keep the ending tied to the purpose of this check. If you need an address, finding the address finishes it. **A feed being empty is not a useful finish line** when it keeps loading. Choose an action you can actually recognize as done.' },
      { kind: 'list', items: [
        { term: 'The reason', text: 'Say what you came for: confirm a time, answer a question, or find one practical detail.' },
        { term: 'The ending', text: 'Name what completes that purpose, then close the app when it happens.' },
        { term: 'The return', text: 'Keep the next work action visible, such as checking one date or writing the next sentence.' },
      ] },
      { kind: 'choice', prompt: 'You answered the message, then notice a link you want to read. What could you choose?', options: [
        { label: 'Save the link for a later break and close the app', feedback: 'The original check is complete. Saving the link records your interest while keeping the work return you already chose available now.' },
        { label: 'Decide whether I have time for a separate break', feedback: 'That is a new decision. Check your actual time and responsibilities before changing the plan, rather than letting the next item make the decision automatically.' },
      ] },
      { kind: 'text', text: 'If you have already drifted into another post, **use the original purpose to find the ending again**. Ask whether that message or detail is finished. If it is, close the app and begin your next task action without first reviewing every minute you spent.' },
      { kind: 'text', text: 'Carry one helpful choice from this week into tomorrow: move an app, notice a cue, choose a break, or define an ending. **Keep the choice that fits your real workday**. You can change one detail when a boundary proves impractical.' },
      { kind: 'do', text: 'Before your next work-time check, **say what will make it finished**. Close the app at that point and return to one visible task action. Reuse whichever boundary helped this week.' },
    ],
  },
  {
    id: 'focus.trialphonebedtimeending',
    title: 'Choose the Last Check',
    step: 'Give an evening check a purpose, an ending, and a next activity.',
    source: 'Author practical, nonclinical guidance: define an evening phone-check endpoint and reuse a manageable bedtime boundary.',
    blocks: [
      { kind: 'text', text: 'An evening check can keep growing when each item leads to another. **Give this check a purpose and an ending** before opening the app. “Confirm tomorrow’s meeting place” has a finish you can notice; “see what is happening” leaves the ending much less clear.' },
      { kind: 'text', text: 'Choose an ending you control. You can send a message, but you cannot make someone reply tonight. **Separate your action from their response**. Once you have sent what is needed, decide whether anything truly requires you to stay available right now.' },
      { kind: 'sequence', prompt: 'Give this evening check somewhere to end.', steps: [
        'Name the practical reason for opening the app.',
        'Complete that action and close the app.',
        'Begin the ordinary bedtime activity you chose beforehand.',
      ], feedback: 'The next activity gives closing the app a destination. Necessary contact can stay available without leaving an unrelated feed open.' },
      { kind: 'choice', prompt: 'You confirmed tomorrow’s time and see another interesting recommendation. What could fit?', options: [
        { label: 'Save it for another time and start getting ready', feedback: 'The practical check is finished. Saving the item lets you keep the interest without making it part of tonight’s check.' },
        { label: 'Choose a separate, bounded time to enjoy it', feedback: 'If that fits tonight, make the new choice explicit and give it an ending too. Check whether it leaves room for the bedtime activity you intended.' },
      ] },
      { kind: 'text', text: 'If the check runs longer than you meant, **use the next available ending**. Close the current item and begin washing your face, reading a page, or another activity you chose. You can return to your evening without restarting the routine from the beginning.' },
      { kind: 'text', text: 'Keep one useful choice from this week: moving an app, noticing an evening cue, choosing direct contact, or preparing an offline activity. **Reuse what was practical for you**. A manageable boundary can change with your responsibilities while still giving the feed a clear ending.' },
      { kind: 'do', text: 'For tonight’s next check, **name its purpose and finish line**. When that action is complete, close the app and begin one bedtime activity. Carry one helpful boundary into tomorrow evening.' },
    ],
  },
] as const satisfies readonly LessonDefinition[];

export const TRIAL_PHONE_REPLACEMENTS = {
  'focus.phoneworkloop': 'focus.trialphoneworkloop',
  'focus.phonebedtimeloop': 'focus.trialphonebedtimeloop',
  'focus.phoneworkcompany': 'focus.trialphoneworkcompany',
  'focus.phonebedtimecompany': 'focus.trialphonebedtimecompany',
  'focus.phoneworkoffline': 'focus.trialphoneworkoffline',
  'focus.phonebedtimeoffline': 'focus.trialphonebedtimeoffline',
  'focus.phoneworkending': 'focus.trialphoneworkending',
  'focus.phonebedtimeending': 'focus.trialphonebedtimeending',
} as const;
