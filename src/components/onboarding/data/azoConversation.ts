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

interface AzoConversationTurn {
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
      'Then we’ll make the next step small enough to try.',
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
      'Each day starts with a mood check-in.',
      'Then, a short lesson personalized to your goals.',
      'We use your answers to personalize your plan.',
      'It’s built on science-based methods like CBT and Goal-Setting Theory.',
      'Then, we’ll give you a daily exercise personalized to your goals.',
      'To help you feel calmer and make getting started easier.',
      'In **14 days**, you’ll feel less overwhelmed by everyday tasks.',
      'Those steps will start to feel familiar.',
    ],
    replies: [
      { id: 'next', label: 'What do I do after the reset?' },
      { id: 'tasksHelp', label: 'How will you help with daily tasks?' },
    ],
  },
  {
    id: 'dailyPlan',
    messages: [
      'Then, complete one small task from a routine **personalized to your goals**.',
            'That might mean cleaning a surface you’ve been putting off.',
      'You’ll have a clear place to start.',
      'Instead of facing the whole mess at once.',
      'In **28 days**, you’ll feel more in control of your day.',
      'With a routine built around your goals.',
      'You’ll also have AI tools for practical support.',
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
export function getAzoConversation(answers: readonly string[]): AzoConversationState {
  const messages: AzoConversationMessage[] = [];
  const acceptedAnswers: string[] = [];

  for (const [index, turn] of AZO_CONVERSATION.entries()) {
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

export function chooseAzoReply(answers: readonly string[], replyId: string) {
  const conversation = getAzoConversation(answers);
  if (!conversation.replies.some(({ id }) => id === replyId)) return undefined;
  return [...conversation.answers, replyId];
}
