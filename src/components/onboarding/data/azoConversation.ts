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
      'I moved into a new place two weeks ago. my room’s still empty.',
      'no rug, no desk, not even a lamp.',
      'I end each day too exhausted to decorate. even choosing a lamp feels like a huge job.',
      'so I say “tomorrow”… then tomorrow looks the same.',
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
      'deal. and I’ll be your buddy too.',
      'maybe your mind won’t switch off, your focus keeps drifting, or you feel worn out.',
      'the dishes and laundry pile up. you want to clean, but can’t get started.',
      'you want a routine, but it’s hard to stick to one. even small tasks get put off.',
      'any of that sound familiar?',
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
      'struggling doesn’t mean you’re lazy.',
      'we’ll start by finding what’s hardest for you.',
      'then make the next step small enough to try, even on a hard day.',
    ],
    replies: [{ id: 'start', label: 'so how do we fix it?' }],
  },
  {
    id: 'plan',
    messages: [
      'I’ll ask a few questions about your sleep, stress, focus, and daily tasks.',
      'your answers shape a **personalized life reset plan**.',
      'if you want to scroll less, your plan will focus on phone habits.',
      'your daily plan starts with a mood check-in and a short lesson backed by **CBT and Goal-Setting Theory**.',
      'next, it guides you through a quick mental reset, like a breathing exercise.',
      'then you complete one small task from your daily routine, like replying to a message you’ve put off.',
      'repeating those small steps makes them more familiar.',
      'the plan turns that science into daily steps that are easy to understand, so you know what to do next.',
      'you’ll also have AI tools ready when you need a hand. my cleaning helper turns a photo of your room into small, doable steps.',
      'you’d be joining **50,000+ people** resetting their lives one small step at a time.',
    ],
    replies: [{ id: 'show', label: 'okay, show me' }],
  },
  {
    id: 'room',
    messages: [
            'here’s my end of the deal.',

      'every day you finish your plan, we earn a decoration for my room. you choose it.',
      'as the room fills up, you can see the small steps you’ve finished.',
      'you help me make this place feel like home, and I help you keep going.',
      'miss a day? your decorations stay. we pick up when you’re ready.',
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
          : 'you’re not alone in that. ask my empty room.',
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
