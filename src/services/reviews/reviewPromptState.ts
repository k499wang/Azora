import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatLocalDate } from '../../lib/calendar/weekCalendarDays';
import { createSerializedAsync } from '../../lib/serializedAsync';
import {
  EMPTY_REVIEW_PROMPT_STATE,
  normalizeReviewPromptState,
  recordCompletedSession,
  recordPaywallDismissed,
  recordPrompt,
  type ReviewPromptState,
} from './reviewPromptPolicy';

const REVIEW_PROMPT_STATE_KEY = 'reviews:prompt_state';

// Session completions and prompt records can land at the same moment, so every
// read-modify-write goes through one queue to avoid losing an update.
const queue = createSerializedAsync();

async function read(): Promise<ReviewPromptState> {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_PROMPT_STATE_KEY);
    return raw == null
      ? EMPTY_REVIEW_PROMPT_STATE
      : normalizeReviewPromptState(JSON.parse(raw));
  } catch {
    return EMPTY_REVIEW_PROMPT_STATE;
  }
}

async function update(
  reducer: (state: ReviewPromptState) => ReviewPromptState,
): Promise<ReviewPromptState> {
  return queue.run(async () => {
    const next = reducer(await read());
    try {
      await AsyncStorage.setItem(REVIEW_PROMPT_STATE_KEY, JSON.stringify(next));
    } catch {
      // A failed write only costs us prompt accounting, never the session.
    }
    return next;
  });
}

/** The stored state as-is. Callers that only decide never write. */
export function readReviewPromptState(): Promise<ReviewPromptState> {
  return queue.run(read);
}

export function markSessionCompleted(): Promise<ReviewPromptState> {
  const today = formatLocalDate(new Date());
  return update((state) => recordCompletedSession(state, today));
}

export function markPromptShown(): Promise<ReviewPromptState> {
  const now = Date.now();
  return update((state) => recordPrompt(state, now));
}

export function markPaywallDismissed(): Promise<ReviewPromptState> {
  const now = Date.now();
  return update((state) => recordPaywallDismissed(state, now));
}
