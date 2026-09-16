/**
 * The two load sliders, said inside one of the app's sentences.
 *
 * Same contract as `onboardingEcho`: these are premises, not announcements, and
 * they are only ever asked for once the user has actually moved the slider — a
 * default of 5 is not an answer. Nothing here softens a high answer, because a
 * number that flatters is worse than no number at all.
 */

function bandIndex(level: number): 0 | 1 | 2 | 3 | 4 {
  if (level <= 2) return 0;
  if (level <= 4) return 1;
  if (level <= 6) return 2;
  if (level <= 8) return 3;
  return 4;
}

const STRESS_BANDS = [
  'you’ve felt steady this past week',
  'stress has stayed mild this past week',
  'stress has been building this past week',
  'you’ve been running low this past week',
  'you’re running on fumes',
] as const;

const BRAIN_FOG_BANDS = [
  'your head stays clear',
  'the fog turns up now and then',
  'the fog turns up often',
  'the fog slows you down most days',
  'you’re in a fog most days',
] as const;

export function describeStressBand(level: number): string {
  return STRESS_BANDS[bandIndex(level)];
}

export function describeBrainFogBand(level: number): string {
  return BRAIN_FOG_BANDS[bandIndex(level)];
}

/** Whatever was answered, as one sentence. Nothing answered returns null. */
export function joinClauses(clauses: readonly (string | null)[]): string | null {
  const said = clauses.filter((clause): clause is string => clause != null);
  if (said.length === 0) return null;

  const sentence =
    said.length === 1
      ? said[0]
      : `${said.slice(0, -1).join(', ')} and ${said[said.length - 1]}`;

  return `${sentence[0].toUpperCase()}${sentence.slice(1)}.`;
}
