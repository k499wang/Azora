export type ComfortablePaying = 'yes' | 'maybe' | 'no';

export interface CoachingSurveyAnswers {
  helpWith: string;
  differentIn30Days: string;
  triedAndObstacles: string;
  importance: number | null;
  comfortablePaying: ComfortablePaying | null;
  name: string;
  email: string;
  timeZone: string;
  agreedToShare: boolean;
}

export function isCoachingSurveyComplete(answers: CoachingSurveyAnswers): boolean {
  return (
    [
      answers.helpWith,
      answers.differentIn30Days,
      answers.triedAndObstacles,
      answers.name,
      answers.timeZone,
    ].every((text) => text.trim().length > 0) &&
    /^\S+@\S+\.\S+$/.test(answers.email.trim()) &&
    answers.importance != null &&
    answers.comfortablePaying != null &&
    answers.agreedToShare
  );
}
