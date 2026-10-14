import { joinClauses } from './onboardingLoad';

interface PiecesTogetherAnswers {
  goalPhrase: string | null;
  contextEcho: string | null;
  energyEcho: string | null;
  sleepEcho: string | null;
  stressEcho: string | null;
}

export function buildPiecesTogetherSubtitle(answers: PiecesTogetherAnswers): string {
  const echoes = [answers.contextEcho, answers.energyEcho, answers.sleepEcho, answers.stressEcho]
    .map((echo) => echo?.trim())
    .filter((echo): echo is string => echo != null && echo.length > 0);
  const details = joinClauses([...new Set(echoes)].slice(0, 2));
  const goalPhrase = answers.goalPhrase?.trim();
  const promise = goalPhrase
    ? `We’ll build small daily steps to help you ${goalPhrase}.`
    : 'We’ll help you choose small daily steps that fit what matters most to you.';

  return details == null ? promise : `${details} ${promise}`;
}
