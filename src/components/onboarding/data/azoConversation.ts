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
      'hey! I’m Azo.',
      'so… I just moved into a new place.',
      'it’s been two weeks. no rug, no desk, not even a lamp. just me and an echo.',
      'I keep telling myself I’ll sort it out tomorrow.',
      'I think I need someone to keep me on track.',
      'want to be my accountability buddy?',
    ],
    replies: [
      { id: 'help', label: 'count me in' },
      { id: 'welcome', label: 'deal, buddy!' },
    ],
  },
  {
    id: 'recognition',
    messages: [
      'yay. but it goes both ways, I’ll keep you on track too.',
      'does this sound familiar?',
      'the laundry’s piling up, the dishes can wait one more day',
      'you know what needs doing, but starting feels impossible',
      'so you scroll, feel guilty, and tell yourself “tomorrow”',
    ],
    replies: [
      { id: 'recognize', label: 'yeah, that’s me' },
      { id: 'caught', label: 'okay, you caught me' },
      { id: 'sometimes', label: 'sometimes' },
    ],
  },
  {
    id: 'reassurance',
    messages: [
      'and you’re not lazy.',
      'when everything piles up, your brain gets overwhelmed, not broken.',
      'the hard part isn’t doing things. it’s deciding what to do first.',
    ],
    replies: [{ id: 'start', label: 'so how do we fix it?' }],
  },
  {
    id: 'plan',
    messages: [
      'that’s where I come in.',
      'I’ll build you a **life reset plan**, so you never have to figure out where to start.',
      'each day, I hand you one small step, plus a short lesson on why it works.',
      'like clearing the sink, or answering that one text.',
      'you just do it. no planning, no endless to-do list.',
      'and I’ll check in on you every day. that’s what buddies do.',
      'it’s built on CBT and Goal-Setting Theory, and **made with neuroscientists**.',
      'you’d be joining **50,000+ people** resetting their lives one small step at a time.',
    ],
    replies: [{ id: 'show', label: 'okay, show me' }],
  },
  {
    id: 'room',
    messages: [
      'here’s my end of the deal.',
      'every day you finish your plan, we earn a decoration for my place. you pick it.',
      'so as your life comes together, my home does too.',
      'miss a day? nothing gets taken away. we just pick up tomorrow.',
    ],
    replies: [{ id: 'makePlan', label: 'let’s make my plan' }],
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
          ? 'even if it only happens sometimes.'
          : 'you’re not alone in that. ask my empty apartment.',
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
