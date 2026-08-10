/**
 * Identifies one finished session for feedback that must not carry over.
 *
 * Built in the app rather than read from the database because the results
 * screen is reached before the session row is written — navigation deliberately
 * does not wait on persistence. The technique plus the instant it ended is
 * unique per session and, unlike a random id, survives a re-render of the
 * results screen, so an answer stays attached to what it was about.
 */
/** The breath hold is not in the technique catalogue, so it carries its own id. */
export const BREATH_HOLD_FEEDBACK_ID = 'breath-hold';

export function buildSessionKey(techniqueId: string, endedAtMs: number): string {
  return `${techniqueId}:${new Date(endedAtMs).toISOString()}`;
}
