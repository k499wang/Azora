import type { AzoConversationState } from './data/azoConversation';

export interface AzoDeliveryState {
  key: string;
  answerCount: number;
  messageCount: number;
  visibleCount: number;
  animateFrom: number;
}

/** Restore history immediately; only a newly answered turn needs delivery. */
export function getAzoDeliveryState(
  conversation: AzoConversationState,
  previous?: AzoDeliveryState,
): AzoDeliveryState {
  const key = conversation.answers.join('|');
  if (previous?.key === key) return previous;

  const messageCount = conversation.messages.length;
  const answeredNextTurn = previous !== undefined
    && conversation.answers.length === previous.answerCount + 1
    && conversation.answers.slice(0, -1).join('|') === previous.key;
  const freshOpening = previous === undefined && conversation.answers.length === 0;

  return {
    key,
    answerCount: conversation.answers.length,
    messageCount,
    visibleCount: answeredNextTurn
      ? Math.min(messageCount, previous.messageCount + 1)
      : freshOpening ? Math.min(1, messageCount) : messageCount,
    animateFrom: answeredNextTurn ? previous.messageCount : freshOpening ? 0 : messageCount,
  };
}

/** A scheduler returns its own cancellation, making the delivery clock testable. */
export type ScheduleAzoChatBeat = (callback: () => void) => () => void;

interface AzoDeliveryOptions {
  visibleCount: number;
  messageCount: number;
  finishing: boolean;
  onMessage: (visibleCount: number) => void;
  onFinish: () => void;
  schedule: ScheduleAzoChatBeat;
}

/** One pending beat at a time, cancelled on Back, blur, or unmount. */
export function startAzoChatDelivery({
  visibleCount,
  messageCount,
  finishing,
  onMessage,
  onFinish,
  schedule,
}: AzoDeliveryOptions): () => void {
  let stopped = false;
  let count = visibleCount;
  let cancelBeat = () => {};

  const next = () => {
    if (finishing) {
      cancelBeat = schedule(() => {
        if (stopped) return;
        onFinish();
      });
    } else if (count < messageCount) {
      cancelBeat = schedule(() => {
        if (stopped) return;
        count += 1;
        onMessage(count);
        if (!stopped) next();
      });
    }
  };

  next();
  return () => {
    stopped = true;
    cancelBeat();
  };
}
