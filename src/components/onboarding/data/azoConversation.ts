export interface AzoReply {
  id: string;
  label: string;
  /** What Azo says it struggles with too, opening the reassurance. */
  struggle?: string;
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
  /** Answered by typing a name; `named` sends it and the other reply skips it. */
  asksName?: boolean;
}

const INTRODUCTION: readonly AzoConversationTurn[] = [
  {
    id: 'name',
    messages: [
      'Hi there! I’m Azo.',
      'I’m so glad you’re here.',
      'What should I call you?',
    ],
    replies: [
      { id: 'named', label: '' },
      { id: 'unnamed', label: 'I’ll skip that for now.' },
    ],
    asksName: true,
  },
  {
    id: 'tell',
    messages: ['Can I tell you something I’ve been putting off?'],
    replies: [
      { id: 'tell', label: 'Of course.' },
      { id: 'listening', label: 'I’m listening.' },
      { id: 'goAhead', label: 'Sure, go ahead.' },
    ],
  },
  {
    id: 'moving',
    messages: [
      'Two weeks ago, I moved into this room.',
      'I still haven’t found any furniture or put up any decorations.',
      'I really want it to feel like my home.',
      'Would you like to help decorate my house?',
    ],
    replies: [{ id: 'help', label: 'I’d love to!' }],
  },
];

/** A short, authored conversation; answers stay local to this opening. */
export const AZO_CONVERSATION: readonly AzoConversationTurn[] = [
  ...INTRODUCTION,
  {
    id: 'recognition',
    messages: [
      'Thank you! I’d also love to help you in return.',
      'What’s been hardest to keep up with in your daily life?',
    ],
    replies: [
      { id: 'tasks', label: 'Getting things done' },
      { id: 'selfCare', label: 'Taking care of myself' },
      { id: 'routine', label: 'Keeping a routine' },
    ],
  },
  {
    id: 'reassurance',
    messages: [
      'Don’t worry, you’re not alone. I struggle with everyday tasks too!',
      'Struggling to keep up doesn’t mean you’re lazy. You might just be missing a way to make your routine work for your brain.',
      'But don’t worry! We’ll figure out what makes everyday tasks hard for you.',
      'After answering some questions, I’ll build you a personalized 7-day life-reset plan!',
      'In 7 days, everyday tasks should feel at least 245% easier for you.',
    ],
    replies: [{ id: 'start', label: 'What would my plan look like?' }],
  },
  {
    id: 'plan',
    messages: ['It’ll just be a mix of short lessons, calming resets, AI tools, and small daily actions.'],
    replies: [{ id: 'tasksHelp', label: 'How will that help me actually get started?' }],
  },
  {
    id: 'cbt',
    messages: [
      'We’ll work on the thoughts and habits that make getting started harder.',
      'Your plan draws on cognitive behavioral therapy, or CBT. It’s been tested over hundreds of clinical trials, and I’m sure it’ll work for you too!',
    ],
    replies: [{ id: 'next', label: 'What if I still don’t know where to start?' }],
  },
  {
    id: 'dailyPlan',
    messages: [
      'We’ll start small and build a routine you can keep.',
      'Your answers will help us choose daily steps that fit your life.',
      'Some days, that might mean a short reset before you start.',
      'Other days, it might mean tackling a task you’ve been putting off.',
      'When you finish your daily plan, you’ll earn a decoration for my room.',
      'You get to choose what we add!',
    ],
    replies: [{ id: 'show', label: 'So we’ll make progress together?' }],
  },
  {
    id: 'room',
    messages: ['Exactly! You’ll help make my room feel like a home while I help you build your routine.'],
    replies: [{ id: 'makePlan', label: 'Let’s make my plan.' }],
  },
];

/** The cleaning-mode opening. Same turn ids as the default; only the recognition replies differ. */
export const CLEANING_AZO_CONVERSATION: readonly AzoConversationTurn[] = [
  ...INTRODUCTION,
  {
    id: 'recognition',
    messages: [
      'Thank you! I’d also love to help you in return.',
      'What’s been hardest to keep up with in your home?',
    ],
    replies: [
      { id: 'chores', label: 'Keeping up with chores' },
      { id: 'declutter', label: 'Decluttering', struggle: 'decluttering' },
      { id: 'tidy', label: 'Keeping things tidy', struggle: 'keeping things tidy' },
    ],
  },
  {
    id: 'reassurance',
    messages: [
      'Don’t worry, you’re not alone. I struggle with chores too!',
      'Having a messy home doesn’t mean you’re lazy. You might just be missing a way to make cleaning work for your brain.',
      'But don’t worry! We’ll figure out what makes chores hard for you.',
      'After answering some questions, I’ll build you a personalized 28-day cleaning plan!',
      'In 7 days, cleaning should feel at least 245% easier for you.',
    ],
    replies: [{ id: 'start', label: 'What would my plan look like?' }],
  },
  {
    id: 'plan',
    messages: ['It’ll just be a mix of short lessons, quick tidy-ups, AI tools, and small daily actions.'],
    replies: [{ id: 'tasksHelp', label: 'How will that help me actually start cleaning?' }],
  },
  AZO_CONVERSATION.find(({ id }) => id === 'cbt')!,
  {
    id: 'dailyPlan',
    messages: [
      'We’ll start small and build a cleaning routine you can keep.',
      'Your answers will help us choose daily steps that fit your life.',
      'Some days, that might mean a five-minute tidy of one surface.',
      'Other days, it might mean tackling a doom pile you’ve been putting off.',
      'When you finish your daily plan, you’ll earn a decoration for my room.',
      'You get to choose what we add!',
    ],
    replies: [{ id: 'show', label: 'So we’ll make progress together?' }],
  },
  {
    id: 'room',
    messages: ['Exactly! You’ll help make my room feel like a home while I help you take care of yours.'],
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
export function getAzoConversation(
  answers: readonly string[],
  turns: readonly AzoConversationTurn[] = AZO_CONVERSATION,
  name = '',
): AzoConversationState {
  const messages: AzoConversationMessage[] = [];
  const acceptedAnswers: string[] = [];
  const typedName = name.trim();
  let struggle: string | undefined;

  for (const [index, turn] of turns.entries()) {
    if (turn.id === 'tell') {
      messages.push({
        id: 'greeting',
        kind: 'azo',
        text: acceptedAnswers.includes('named') ? `Nice to meet you, ${typedName}!` : 'That’s okay, nice to meet you!',
      });
    }

    turn.messages.forEach((text, messageIndex) => {
      const opensReassurance = turn.id === 'reassurance' && messageIndex === 0 && struggle;
      messages.push({
        id: `${turn.id}-${messageIndex}`,
        kind: 'azo',
        text: opensReassurance ? `Don’t worry, you’re not alone. I struggle with ${struggle} too!` : text,
      });
    });

    const reply = turn.replies.find(({ id }) => id === answers[index] && (id !== 'named' || typedName));
    if (!reply) {
      return { messages, answers: acceptedAnswers, replies: turn.replies, complete: false };
    }
    acceptedAnswers.push(reply.id);
    struggle = reply.struggle ?? struggle;
    messages.push({ id: `${turn.id}-reply`, kind: 'reply', text: reply.id === 'named' ? typedName : reply.label });
  }

  return { messages, answers: acceptedAnswers, replies: [], complete: true };
}

export function chooseAzoReply(
  answers: readonly string[],
  replyId: string,
  turns: readonly AzoConversationTurn[] = AZO_CONVERSATION,
  name = '',
) {
  const conversation = getAzoConversation(answers, turns, name);
  if (!conversation.replies.some(({ id }) => id === replyId)) return undefined;
  if (replyId === 'named' && !name.trim()) return undefined;
  return [...conversation.answers, replyId];
}
