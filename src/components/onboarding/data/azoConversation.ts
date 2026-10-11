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
      'I moved in two weeks ago. my room’s still empty.',
      'no rug, no desk, not even a lamp.',
      'by evening, I’m too exhausted to decorate.',
      'even choosing a lamp feels huge.',
      'so I say “tomorrow”… but nothing changes.',
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
      'deal. I’ll be your buddy too.',
      'maybe your mind won’t switch off.',
      'your focus drifts, or you feel worn out.',
      'the dishes and laundry pile up.',
      'you want to clean, but can’t start.',
      'you want a routine, but can’t stick to it.',
      'even small tasks get put off.',
      'sound familiar?',
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
      'we’ll find what’s hardest for you.',
      'then make the next step small enough to try.',
      'even on a hard day.',
    ],
    replies: [{ id: 'start', label: "so what's next?" }],
  },
  {
    id: 'plan',
    messages: [
      'first, a few questions about sleep, stress, focus, and daily tasks.',
      'your answers shape a **personalized life reset plan**.',
      'want help cleaning and sticking to a routine?',
      'your plan breaks it into small, doable steps.',
      'each day starts with a mood check-in and short lesson.',
      'your lesson is backed by **CBT and Goal-Setting Theory**.',
      'your lesson is tailored to your answers and needs.',
      'next, a quick mental reset, like a breathing exercise.',
      'research shows brief breathing can **improve mood and ease anxiety**.',
    ],
    replies: [
      { id: 'next', label: 'what do I do after the reset?' },
      { id: 'tasksHelp', label: 'how will you help with daily tasks?' },
    ],
  },
  {
    id: 'dailyPlan',
    messages: [
      'then, finish one small task from your daily routine.',
      'like cleaning a surface you’ve put off.',
      'repeating small steps makes them more familiar.',
      'your plan turns that science into clear daily steps.',
      'so you know what to do next.',
      'you’ll also have AI tools when you need a hand.',
      'take a photo of your messy room, and I’ll give you step-by-step cleaning instructions.',
      'join **50,000+ people** resetting their lives, one small step at a time.',
    ],
    replies: [{ id: 'show', label: 'okay, show me' }],
  },
  {
    id: 'room',
    messages: [
      'here’s my end of the deal.',
      'finish your daily plan and we earn a decoration for my room.',
      'you choose it.',
      'as the room fills, you can see the steps you’ve finished.',
      'you help me make this place feel like home.',
      'I help you keep going.',
      'miss a day? your decorations stay.',
      'we pick up when you’re ready.',
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
