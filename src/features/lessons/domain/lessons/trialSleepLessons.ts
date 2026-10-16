import type { LessonDefinition } from '../lessonBlock';

/** Authored first-week sleep skills; saved lesson IDs remain available. */
export const TRIAL_SLEEP_LESSONS = [
  {
    id: 'attention.trialnightsenses',
    title: 'Notice the Room Tonight',
    step: 'Separate what is happening now from predictions about tonight.',
    blocks: [
      { kind: 'text', text: 'You finish getting ready for bed and think, “What if I am awake for hours again?” **Notice where the question takes your attention**: into a night that has not happened yet. You can recognise the prediction without trying to settle it before bedtime.' },
      { kind: 'text', text: 'A prediction and an observation give you different information. “Tomorrow will be impossible” guesses at the future. **“The lamp is on and my book is beside me” describes this room**. Observations give you somewhere concrete to place attention while the larger question remains unanswered.' },
      { kind: 'reveal', prompt: 'What belongs to this moment?', items: [
        { label: 'A prediction', detail: '“I will never get through tomorrow” describes an outcome you cannot inspect tonight. Repeating it does not make the answer available.' },
        { label: 'An observation', detail: '“My feet are on the floor and I can hear the fan” describes something available now. From here, you can choose the next ordinary part of your evening.' },
      ] },
      { kind: 'choice', prompt: 'You are holding your book and predicting another difficult night. What could you try?', options: [
        { label: 'Notice the book in my hands and read the next paragraph', feedback: 'That connects something you can observe with an available action. The question about tonight can remain unanswered while you read.' },
        { label: 'Keep calculating tomorrow until I know how it will go', feedback: 'Tonight cannot supply that certainty. Notice that you are predicting, then choose one available action, such as setting the book down or reading a paragraph.' },
      ] },
      { kind: 'text', text: 'This is not a test of how long you can avoid thinking. **When a prediction returns, recognise it and return to something available**. You might notice the chair beneath you or the sound nearby, then continue the ordinary activity you chose.' },
      { kind: 'text', text: 'Today’s **two-minute 5-4-3-2-1 Reset** offers another way to practise noticing your surroundings. Follow or adapt its prompts comfortably; you can also practise during an ordinary evening activity.' },
      { kind: 'do', text: 'Tonight, **notice one prediction and one thing actually present**. Then choose an ordinary action: read a paragraph, put away your cup, or set out what you need for the morning.' },
    ],
    source: 'Author practical distinction between present observation and future prediction, applied to an ordinary evening action. No promise of sleep or a clinical outcome.',
  },
  {
    id: 'sleep.trialnightnote',
    title: 'Leave Tomorrow a Note',
    step: 'Write one available next action and a suitable time to revisit it.',
    blocks: [
      { kind: 'text', text: 'An unfinished task may return while you are getting ready for bed. **Give its next useful action a place on paper** so remembering it does not require continuing the whole discussion tonight. The note can be brief, and it does not need to solve tomorrow in advance.' },
      { kind: 'text', text: 'Write what you can actually do and a suitable time to revisit it. **Ask about the missing date tomorrow** gives you a clearer return than sort everything out. If there is no available action yet, note the question without inventing another task just to make it feel settled.' },
      { kind: 'reveal', prompt: 'Tap the two parts of a useful evening note.', items: [
        { label: 'The available action', detail: 'I will ask which date the form needs. This names information I can request instead of rehearsing every possible outcome tonight.' },
        { label: 'A suitable return', detail: 'I will ask during tomorrow’s office hours. The action has a useful place rather than requiring another check while I am settling for bed.' },
      ] },
      { kind: 'choice', prompt: 'You remember a form with an unclear deadline while preparing for bed. Which note could help?', options: [
        { label: 'Ask about the deadline during tomorrow’s office hours', feedback: 'That gives the practical question a next step and a time. You can leave the parts you cannot answer tonight outside this small note.' },
        { label: 'List every possible consequence until I feel certain', feedback: 'That expands the question without adding the missing deadline. Keep the note to information or an action you can actually revisit.' },
      ] },
      { kind: 'text', text: 'If the concern returns after writing, **check whether it contains genuinely new information**. Remembering the same question does not require another entry. You can recognise that it already has a place and continue getting ready, even if it still feels unfinished.' },
      { kind: 'text', text: 'Today’s **two-minute breathing Reset** supports a pause after your note. Follow its prompts comfortably, breathe normally, or stop when needed. The useful next action stays written down either way.' },
      { kind: 'do', text: 'If a task is on your mind tonight, **write one next action and when you can revisit it**. Keep the note available for that time, then continue one ordinary part of getting ready for bed.' },
    ],
    source: 'Author practical next-action note with brief scheduled two-minute breathing support. No promise that writing or breathing causes sleep; no note is needed when there is no concern to record.',
  },
] as const satisfies readonly LessonDefinition[];

export const TRIAL_SLEEP_REPLACEMENTS = {
  'sleep.threeam': 'attention.trialnightsenses',
  'sleep.worry': 'sleep.trialnightnote',
} as const;
