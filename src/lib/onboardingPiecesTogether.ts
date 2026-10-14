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
  const details = joinClauses(echoes.slice(0, 1));
  const goalPhrase = answers.goalPhrase?.trim();
  const promise = goalPhrase
    ? `We’ll help you ${goalPhrase}, one small step a day.`
    : 'We’ll take it one small step a day.';

  return details == null ? promise : `${details} ${promise}`;
}
