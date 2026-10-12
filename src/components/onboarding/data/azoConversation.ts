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
      'I moved in two weeks ago. My room is still empty.',
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
      'In **7 days**, you’ll feel **more confident getting started**.',
    ],
    replies: [{ id: 'start', label: 'What comes next?' }],
  },
  {
    id: 'plan',
    messages: [
      'We’ll start with a few questions about sleep, stress, focus, and daily tasks.',
      'Your answers shape a **personalized life reset plan** to help you **get your life back together**.',
      'Want help with cleaning and keeping a routine?',
      'Your plan breaks those goals into small, manageable steps.',
      'Each day starts with a mood check-in and a short lesson.',
      'Your lesson is **personalized to your goals**.',
      'It’s backed by **CBT and Goal-Setting Theory**.',
      'Next, you’ll take a moment to reset with an activity like a breathing exercise.',
      'Research shows brief breathing can **improve mood and ease anxiety**.',
            'In **14 days**, you’ll feel **less overwhelmed by everyday tasks**.',

    ],
    replies: [
      { id: 'next', label: 'What do I do after the reset?' },
      { id: 'tasksHelp', label: 'How will you help with daily tasks?' },
    ],
  },
  {
    id: 'dailyPlan',
    messages: [
      'Then you’ll complete one small task from your daily routine, **personalized to your goals**.',
      'That might mean cleaning a surface you’ve been putting off.',
      'Repeating small steps makes them more familiar.',
      'Your plan turns that science into clear daily steps.',
      'In **28 days**, you’ll feel **more in control of your day**.',
      'You’ll also have AI tools for practical support.',
      'Take a photo of your room, and I’ll give you step-by-step cleaning instructions.',
      'You’ll join **50,000+ people** resetting their lives, one small step at a time.',
    ],
    replies: [{ id: 'show', label: 'I’d like to see how it works.' }],
  },
  {
    id: 'room',
    messages: [
      'Here’s how we’ll support each other.',
      'When you finish your daily plan, you earn a decoration for my room.',
      'You choose what to add.',
      'As the room fills, you can see the steps you’ve completed.',
      'You help me make this place feel like home.',
      'I help you keep going.',
      'If you miss a day, your decorations stay.',
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
