const DAILY_EXERCISE_SEARCH_TERMS = [
  'daily breathhold',
  'daily breath hold',
  'breathhold',
  'breath hold',
  'azora’s breathhold exercise',
  "azora's breathhold exercise",
  'azora breathhold exercise',
  'check-in',
  'check in',
  'azora original',
  'azora protocol',
  'the azora protocol',
  'protocol',
  'daily reset',
  'azora’s reset',
  "azora's reset",
] as const;

export function normalizeExerciseSearch(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function matchesExerciseSearch(
  normalizedQuery: string,
  values: readonly string[],
): boolean {
  return normalizedQuery.length === 0 || values.some((value) =>
    normalizeExerciseSearch(value).includes(normalizedQuery),
  );
}

export function matchesDailyExerciseSearch(searchQuery: string): boolean {
  return matchesExerciseSearch(
    normalizeExerciseSearch(searchQuery),
    DAILY_EXERCISE_SEARCH_TERMS,
  );
}
