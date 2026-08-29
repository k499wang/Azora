import { posthog } from '../../config/posthog';
import {
  createSessionReplayPause,
  type SessionReplayPauseOptions,
} from './sessionReplayPause';

/**
 * Session replay screenshots the window on the main thread, which is the same
 * thread a native-driven animation runs on — every capture during a transition
 * costs frames. Pausing across the animation leaves a gap in the recording
 * rather than ending it: `startSessionRecording(true)` resumes the current
 * session, so one replay still covers the whole flow.
 */

const requestSessionReplayPause = createSessionReplayPause({
  stop: () => posthog.stopSessionRecording(),
  resume: () => posthog.startSessionRecording(true),
});

/**
 * Pauses replay until the returned resume is called. Resume is idempotent and
 * safe to call from a cleanup path — recording restarts once the last pause
 * holder releases.
 */
export function pauseSessionReplay(
  options?: SessionReplayPauseOptions,
): () => void {
  return requestSessionReplayPause(options);
}
