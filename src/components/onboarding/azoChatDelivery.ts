import type { AzoConversationMessage, AzoConversationState } from './data/azoConversation';

const READING_BASE_DELAY_MS = 1500;
const READING_WORD_DELAY_MS = 275;
const MAX_READING_DELAY_MS = 10000;

/** Reads the `azo_chat_pace` variant payload as a delay multiplier; anything but a positive number reads at 1x. */
export function azoChatPaceFrom(payload: unknown): number {
  return typeof payload === 'number' && Number.isFinite(payload) && payload > 0 ? payload : 1;
}

export interface AzoChatTiming {
  pace: number;
  baseDelayMs: number;
  wordDelayMs: number;
}

const DEFAULT_AZO_CHAT_TIMING: AzoChatTiming = {
  pace: 1,
  baseDelayMs: READING_BASE_DELAY_MS,
  wordDelayMs: READING_WORD_DELAY_MS,
};

function delayFrom(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Reads the `azo_chat_pace` payload: a multiplier, or `{ baseDelayMs, wordDelayMs }`. Anything missing or invalid keeps its default. */
export function azoChatTimingFrom(payload: unknown): AzoChatTiming {
  const fields = typeof payload === 'object' && payload != null ? payload as Record<string, unknown> : {};
  return {
    pace: azoChatPaceFrom(payload),
    baseDelayMs: delayFrom(fields.baseDelayMs, READING_BASE_DELAY_MS),
    wordDelayMs: delayFrom(fields.wordDelayMs, READING_WORD_DELAY_MS),
  };
}

/** Give the visible message, Azo's or the user's reply, time to be read before delivering the next one. */
export function getAzoMessageReadDelay(
  message?: AzoConversationMessage,
  { pace, baseDelayMs, wordDelayMs }: AzoChatTiming = DEFAULT_AZO_CHAT_TIMING,
): number {
  const wordCount = (message?.text ?? '').replace(/\*\*/g, '').trim().split(/\s+/).filter(Boolean).length;
  return Math.round(pace * Math.min(MAX_READING_DELAY_MS, baseDelayMs + wordCount * wordDelayMs));
}

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
