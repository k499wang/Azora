interface AssessmentSynthesisInput {
  stress: number | null;
  sleep: number | null;
  heartWorry: number | null;
  agreementResponses: Readonly<
    Record<string, 'agree' | 'disagree' | null>
  >;
  primaryPlan: string | null;
  goalPhrases: readonly string[];
}

export function formatGoalList(
  goalPhrases: readonly string[],
): string | null {
  const uniquePhrases: string[] = [];
  const seen = new Set<string>();

  for (const goalPhrase of goalPhrases) {
    const trimmedPhrase = goalPhrase.trim();
    if (!trimmedPhrase || seen.has(trimmedPhrase)) continue;
    seen.add(trimmedPhrase);
    uniquePhrases.push(trimmedPhrase);
  }

  if (uniquePhrases.length === 0) return null;
  if (uniquePhrases.length === 1) return uniquePhrases[0];
  if (uniquePhrases.length === 2) {
    return `${uniquePhrases[0]} and ${uniquePhrases[1]}`;
  }
  if (uniquePhrases.length === 3) {
    return `${uniquePhrases[0]}, ${uniquePhrases[1]}, and ${uniquePhrases[2]}`;
  }

  return `${uniquePhrases.slice(0, 3).join(', ')}, etc`;
}

export function buildAssessmentSynthesis({
  stress,
  sleep,
  heartWorry,
  agreementResponses,
  primaryPlan,
  goalPhrases,
}: AssessmentSynthesisInput): string {
  const stressAnswered = stress != null;
  const sleepAnswered = sleep != null;
  const stressHigh = stress != null && stress >= 7;
  const stressMid = stress != null && stress >= 4 && stress < 7;
  const sleepLow = sleep != null && sleep <= 4;
  const sleepMid = sleep != null && sleep > 4 && sleep <= 7;

  let opener: string | null = null;
  if (stressAnswered && sleepAnswered) {
    if (stressHigh && sleepLow) {
      opener =
        'High stress and light sleep are reinforcing each other right now.';
    } else if (stressHigh && sleepMid) {
      opener =
        'Stress is the strongest signal, and it may be starting to affect your sleep.';
    } else if (stressHigh) {
      opener =
        'Stress is elevated, but solid sleep gives us a strong base to work from.';
    } else if (stressMid && sleepLow) {
      opener =
        'Your stress looks manageable, but light sleep is limiting your recovery.';
    } else if (stressMid) {
      opener = 'You’re carrying some steady background tension.';
    } else if (sleepLow) {
      opener =
        'Your daytime stress is low, but light sleep is limiting your recovery.';
    } else {
      opener = 'You’re starting from a steady base.';
    }
  } else if (stressAnswered) {
    if (stressHigh) {
      opener = 'Stress has been running high this week.';
    } else if (stressMid) {
      opener = 'You’re carrying some steady background tension.';
    } else {
      opener = 'Your stress level looks fairly steady.';
    }
  } else if (sleepAnswered) {
    if (sleepLow) {
      opener = 'Light sleep seems to be limiting your recovery.';
    } else if (sleepMid) {
      opener = 'Your sleep is decent, with some room for better recovery.';
    } else {
      opener = 'Your sleep gives us a strong base to work from.';
    }
  }

  const exhausted = agreementResponses.exhausted === 'agree';
  const racing = agreementResponses.racing === 'agree';
  const reactive = agreementResponses.reactive === 'agree';
  const hasAgreementConcern = exhausted || racing || reactive;

  let agreementLine: string | null = null;
  if (exhausted && racing && reactive) {
    agreementLine =
      'You also seem mentally worn down, with a mind and body that stay switched on.';
  } else if (exhausted && racing) {
    agreementLine =
      'Mental fatigue and a busy mind seem to be feeding each other.';
  } else if (exhausted && reactive) {
    agreementLine =
      'You seem both mentally worn down and more reactive than usual.';
  } else if (racing && reactive) {
    agreementLine = 'Your mind and body both seem to be staying switched on.';
  } else if (exhausted) {
    agreementLine = 'Mental fatigue is part of the picture too.';
  } else if (racing) {
    agreementLine = 'Slowing your mind down is part of the challenge too.';
  } else if (reactive) {
    agreementLine = 'Small stressors seem to be landing harder than you’d like.';
  }

  const heartWorryHigh = heartWorry != null && heartWorry >= 7;
  let supportingConcern = agreementLine;
  if (heartWorryHigh && hasAgreementConcern) {
    supportingConcern =
      'Mental strain is part of the picture, and your heart health is weighing on you too.';
  } else if (heartWorryHigh) {
    supportingConcern = 'Your heart health is weighing on you right now.';
  }

  let fallbackPlan: string;
  if (sleepLow || (stressHigh && sleepMid)) {
    fallbackPlan =
      'We’ll start with a gentle evening reset to help your body wind down.';
  } else if (stressHigh) {
    fallbackPlan =
      'We’ll start with quick calming techniques and longer exhales.';
  } else if (stressMid) {
    fallbackPlan = 'We’ll start with short daily resets you can use anywhere.';
  } else {
    fallbackPlan = 'We’ll start with steady resets for focus and performance.';
  }

  const formattedGoals = formatGoalList(goalPhrases);
  const goalSentence = formattedGoals ? `You want to ${formattedGoals}.` : null;

  return [
    opener,
    supportingConcern,
    goalSentence,
    primaryPlan ?? fallbackPlan,
  ]
    .filter(Boolean)
    .join(' ');
}
