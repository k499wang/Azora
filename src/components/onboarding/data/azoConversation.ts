export interface AzoReply {
  id: string;
  label: string;
}

export type AzoConversationMessage =
  | { id: string; kind: 'azo' | 'reply'; text: string }
  | { id: string; kind: 'room' };

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
    id: 'recognition',
    messages: [
      'hey. I’m Azo.',
      'does this sound familiar?',
      'you have things you want to do',
      'but everything feels like too much',
      'so you put them off',
      'feel guilty',
      'tell yourself “tomorrow”',
      'then tomorrow feels the same',
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
      'it’s okay to feel that way.',
      'you don’t have to fix your whole life today.',
      'let’s find one place to start.',
    ],
    replies: [{ id: 'start', label: 'where do I start?' }],
  },
  {
    id: 'plan',
    messages: [
      'that’s what Azora is for.',
      'we’ll build your Life Reset Plan around what’s getting in your way.',
      'each day: a check-in, a short lesson, and a small thing to do.',
      'guided Resets help you pause along the way.',
      'you can check your heart rate before and after a Reset, too.',
    ],
    replies: [{ id: 'show', label: 'okay, show me' }],
  },
  {
    id: 'room',
    messages: [
      'and there’s a little reward.',
      'this is my room.',
      'finish today’s plan and you earn a decoration.',
      'you choose it. little by little, the room fills up.',
      'miss a day? your decorations stay.',
    ],
    replies: [{ id: 'makePlan', label: 'let’s make my plan' }],
  },
];

/** Keep only a valid answer prefix, so restored or stale choices cannot skip a turn. */
export function getAzoConversation(answers: readonly string[]): AzoConversationState {
  const messages: AzoConversationMessage[] = [];
  const acceptedAnswers: string[] = [];

  for (const [index, turn] of AZO_CONVERSATION.entries()) {
    if (turn.id === 'reassurance') {
      messages.push({
        id: 'acknowledgment',
        kind: 'azo',
        text: acceptedAnswers[0] === 'sometimes'
          ? 'even if it only happens sometimes.'
          : 'you’re not alone in that.',
      });
    }

    turn.messages.forEach((text, messageIndex) => {
      messages.push({ id: `${turn.id}-${messageIndex}`, kind: 'azo', text });
      if (turn.id === 'room' && messageIndex === 1) {
        messages.push({ id: 'room-preview', kind: 'room' });
      }
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
