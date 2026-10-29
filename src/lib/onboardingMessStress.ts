const SPACE_POINTS: Record<string, number> = {
  mostly_clean: 0,
  varies: 1,
  cluttered: 1,
  messy: 2,
  overwhelming: 3,
};

/**
 * How heavy the mess feels, read from how clean they say their space is and how
 * many of the cleaning statements they agreed with. Null when neither was answered.
 */
export function messStressEcho(
  spaceState: readonly string[] | undefined,
  statementAnswers: Readonly<Record<string, string | undefined>>,
): string | null {
  const space = spaceState?.length === 1 ? SPACE_POINTS[spaceState[0]] : undefined;
  const answered = Object.values(statementAnswers).filter((answer) => answer != null);
  if (space == null && answered.length === 0) return null;

  const agreed = answered.filter((answer) => answer === 'yes').length;
  const points = (space ?? 0) + (agreed >= 4 ? 2 : agreed >= 2 ? 1 : 0);
  if (points >= 3) return 'high, which is common and exactly what small daily steps are built for';
  if (points >= 1) return 'moderate, so you’re closer than it feels';
  return 'low, so small daily steps will keep it that way';
}
