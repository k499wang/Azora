export interface AzoReply {
  id: string;
  label: string;
}

export interface AzoConversationMessage {
  id: string;
  kind: 'azo' | 'reply';
  /** Azo's lines may mark `**emphasis**`; see `splitEmphasis`. */
  text: string;
}

export interface AzoConversationState {
  messages: AzoConversationMessage[];
  answers: string[];
  replies: readonly AzoReply[];
  complete: boolean;
}

export interface AzoConversationTurn {
  id: string;
  messages: readonly string[];
  replies: readonly AzoReply[];
}

/** A short, authored conversation; answers stay local to this opening. */
export const AZO_CONVERSATION: readonly AzoConversationTurn[] = [
  {
    id: 'moving',
    messages: [
      'Hi, my name is Azo.',
      'I moved in two weeks ago.',
      'My room is still empty.',
      'I still need a rug, a desk, and even a lamp.',
      'By evening, I’m too exhausted to decorate.',
      'Even choosing a lamp feels overwhelming.',
      'I keep putting it off until tomorrow, but nothing changes.',
      'Would you like us to help each other stay on track?',
    ],
    replies: [
      { id: 'help', label: 'I’d like to help.' },
      { id: 'welcome', label: 'Let’s support each other.' },
    ],
  },
  {
    id: 'recognition',
    messages: [
      'I’ll help you stay on track, too.',
      'Maybe you find it hard to switch off.',
      'Your focus drifts, or you feel worn out.',
      'The dishes and laundry pile up.',
      'You want to clean, but getting started feels difficult.',
      'You want a routine, but struggle to keep it going.',
      'Even small tasks get put off.',
      'Does any of that feel familiar?',
    ],
    replies: [
      { id: 'recognize', label: 'Yes, that feels familiar.' },
      { id: 'caught', label: 'I’ve been feeling that way.' },
      { id: 'sometimes', label: 'Sometimes, yes.' },
    ],
  },
  {
    id: 'reassurance',
    messages: [
      'Struggling doesn’t mean you’re lazy.',
      'We’ll look at what feels hardest for you.',
      'In **7 days**, you’ll feel more confident getting started.',
      'Even with tasks you’ve been avoiding.',
    ],
    replies: [{ id: 'start', label: 'What comes next?' }],
  },
  {
    id: 'plan',
    messages: [
      'Answer a few questions, and we’ll build your **personalized life reset plan**.',
      'Your goals and what feels hardest for you shape each daily step.',
      'A mix of short lessons, calming resets, practical tools, and small daily actions.',
      'Your answers help us choose the right mix for you.',
      'Your plan isn’t guesswork.',
      'It’s built by **Stanford researchers** on CBT, a method tested in **hundreds of clinical trials**.',
      'In **14 days**, you’ll feel less overwhelmed by everyday tasks.',
    ],
    replies: [{ id: 'tasksHelp', label: 'How can you help me overcome procrastination?' }],
  },
  {
    id: 'tools',
    messages: [
      'I’ve also got **AI tools** to help along the way.',
      'Overwhelmed? **Brain dump** out loud, and I’ll sort it into small to-dos.',
      'Messy room? **Snap a photo**, and I’ll show you where to start.',
      'Stuck on something? **Ask me** anytime, and we’ll talk it through.',
    ],
    replies: [{ id: 'next', label: 'How will you help me build a routine?' }],
  },
  {
    id: 'dailyPlan',
    messages: [
      'I’ll help you start small and build a routine you can keep.',
      'Your routine is **tailored to your goals**.',
      'Some days, that might mean tackling a chore you’ve been putting off.',
      'Other days, taking a moment to reset before you start.',
      'In **28 days**, you’ll feel more in control of your day.',
      'With support that fits what you want to change.',
    ],
    replies: [{ id: 'show', label: 'I’d like to see how it works.' }],
  },
  {
    id: 'room',
    messages: [
      'Here’s how we’ll support each other.',
      'When you finish your daily plan…',
      'You earn a decoration for my room.',
      'You choose what to add.',
      'As the room fills, you can see the steps you’ve completed.',
      'You help me make this place feel like home.',
      'I help you keep going.',
      'Miss a day? Your decorations stay.',
      'We’ll pick up when you’re ready.',
    ],
    replies: [{ id: 'makePlan', label: 'Let’s make my plan.' }],
  },
];

/**
 * The cleaning-mode opening. Same turns and reply ids as the default, so the
 * acknowledgment and saved answers read the same way.
 */
export const CLEANING_AZO_CONVERSATION: readonly AzoConversationTurn[] = [
  {
    id: 'moving',
    messages: [
      'Hi, my name is Azo.',
      'I moved in two weeks ago.',
      'Most of my things are still in boxes.',
      'The walls are bare, and there’s nowhere to sit.',
      'I really want it to feel like home.',
      'But after a long day, unpacking is the last thing I want to do.',
      'So the boxes just sit there, week after week.',
      'Would you like to help decorate my house?',
    ],
    replies: [
      { id: 'help', label: 'I’d like to help.' },
      { id: 'welcome', label: 'Let’s support each other.' },
    ],
  },
  {
    id: 'recognition',
    messages: [
      'I’ll help you stay on track, too.',
      'Maybe the dishes and laundry pile up.',
      'You look around and don’t know where to start.',
      'You clean one day, and it’s messy again by the weekend.',
      'You want a tidy home, but getting started feels difficult.',
      'Even small chores get put off.',
      'Does any of that feel familiar?',
    ],
    replies: [
      { id: 'recognize', label: 'Yes, that feels familiar.' },
      { id: 'caught', label: 'I’ve been feeling that way.' },
      { id: 'sometimes', label: 'Sometimes, yes.' },
    ],
  },
  {
    id: 'reassurance',
    messages: [
      'A messy home doesn’t mean you’re lazy.',
      'We’ll look at what makes cleaning hardest for you.',
      'In **7 days**, you’ll feel more confident getting started.',
      'Even with the chores you’ve been avoiding.',
    ],
    replies: [{ id: 'start', label: 'What comes next?' }],
  },
  {
    id: 'plan',
    messages: [
      'Answer a few questions, and we’ll build your **personalized cleaning plan**.',
      'Your home, your schedule, and what feels hardest shape each daily step.',
      'A mix of short lessons, quick tidy-ups, practical tools, and small daily actions.',
      'Your plan isn’t guesswork.',
      'It’s built on **CBT**, a method tested in **hundreds of clinical trials**.',
      'CBT has been shown to help people **stop procrastinating** and **get more organized**.',
      'Including people with **ADHD**.',
      'In **14 days**, cleaning will feel less overwhelming.',
    ],
    replies: [{ id: 'tasksHelp', label: 'How can you help me actually start cleaning?' }],
  },
  {
    id: 'tools',
    messages: [
      'I’ve also got **AI tools** made for cleaning.',
      'Messy room? **Snap a photo**, and I’ll give you step-by-step cleaning instructions.',
      'Too many chores in your head? **Brain dump** out loud, and I’ll sort them into small to-dos.',
      'Not sure where to start? **Ask me** anytime, and we’ll pick the first step together.',
    ],
    replies: [{ id: 'next', label: 'How will you help me keep a routine?' }],
  },
  {
    id: 'dailyPlan',
    messages: [
      'I’ll help you start small and build a cleaning routine you can keep.',
      'Your routine is **tailored to your answers**.',
      'Some days, that might mean a five-minute tidy of one surface.',
      'Other days, finally tackling the pile you’ve been putting off.',
      'In **28 days**, keeping your home tidy will feel like part of your day.',
      'Not another thing to catch up on.',
    ],
    replies: [{ id: 'show', label: 'I’d like to see how it works.' }],
  },
  AZO_CONVERSATION[AZO_CONVERSATION.length - 1],
];

export interface EmphasisPart {
  text: string;
  emphasis: boolean;
}

/** A message's words split around `**emphasis**`, in reading order. */
export function splitEmphasis(text: string): EmphasisPart[] {
  return text
    .split('**')
    .map((part, index) => ({ text: part, emphasis: index % 2 === 1 }))
    .filter(({ text: part }) => part.length > 0);
}

/** Keep only a valid answer prefix, so restored or stale choices cannot skip a turn. */
export function getAzoConversation(
  answers: readonly string[],
  turns: readonly AzoConversationTurn[] = AZO_CONVERSATION,
): AzoConversationState {
  const messages: AzoConversationMessage[] = [];
  const acceptedAnswers: string[] = [];

  for (const [index, turn] of turns.entries()) {
    if (turn.id === 'reassurance') {
      messages.push({
        id: 'acknowledgment',
        kind: 'azo',
        text: acceptedAnswers.includes('sometimes')
          ? 'Even when it happens only sometimes, it can still be difficult.'
          : 'You’re not alone in feeling this way. I struggle with it too.',
      });
    }

    turn.messages.forEach((text, messageIndex) => {
      messages.push({ id: `${turn.id}-${messageIndex}`, kind: 'azo', text });
    });

    const reply = turn.replies.find(({ id }) => id === answers[index]);
    if (!reply) {
      return { messages, answers: acceptedAnswers, replies: turn.replies, complete: false };
    }
    acceptedAnswers.push(reply.id);
    messages.push({ id: `${turn.id}-reply`, kind: 'reply', text: reply.label });
  }

  return { messages, answers: acceptedAnswers, replies: [], complete: true };
}

export function chooseAzoReply(
  answers: readonly string[],
  replyId: string,
  turns: readonly AzoConversationTurn[] = AZO_CONVERSATION,
) {
  const conversation = getAzoConversation(answers, turns);
  if (!conversation.replies.some(({ id }) => id === replyId)) return undefined;
  return [...conversation.answers, replyId];
}
