import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSerializedAsync } from '../../lib/serializedAsync';
import {
  EMPTY_REVIEW_PROMPT_STATE,
  normalizeReviewPromptState,
  recordCompletedSession,
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

export function markSessionCompleted(): Promise<ReviewPromptState> {
  return update(recordCompletedSession);
}

export function markPromptShown(nowMs: number): Promise<ReviewPromptState> {
  return update((state) => recordPrompt(state, nowMs));
}
