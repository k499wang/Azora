export type OnboardingAnswerValue =
  | string
  | number
  | boolean
  | null
  | readonly OnboardingAnswerValue[]
  | { readonly [key: string]: OnboardingAnswerValue | undefined };

export type OnboardingAnswers = Record<string, OnboardingAnswerValue | undefined>;

function isUnanswered(value: OnboardingAnswerValue | undefined): boolean {
  if (value == null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Answers that differ from what was last sent. An unanswered question is only
 * sent when it clears an answer that was already saved, so the row stays the
 * latest answer instead of a stale one.
 */
export function changedOnboardingAnswers(
  answers: OnboardingAnswers,
  sent: Readonly<Record<string, string>>,
): Record<string, OnboardingAnswerValue> {
  const changed: Record<string, OnboardingAnswerValue> = {};

  for (const [questionId, value] of Object.entries(answers)) {
    const previous = sent[questionId];
    if (isUnanswered(value) && previous == null) continue;

    const normalized = value ?? null;
    if (JSON.stringify(normalized) === previous) continue;

    changed[questionId] = normalized;
  }

  return changed;
}
