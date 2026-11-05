import Constants from 'expo-constants';
import type {
  ComfortablePaying,
  CoachingSurveyAnswers,
} from '../../features/coaching/domain/coachingSurvey';
import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';

type CoachingSurveyInsert = {
  user_id: string;
  help_with: string;
  different_in_30_days: string;
  tried_and_obstacles: string;
  importance: number;
  comfortable_paying: ComfortablePaying;
  name: string;
  email: string;
  time_zone: string;
  agreed_to_share_at: string;
  app_version: string | null;
};

interface CoachingSurveyDatabase {
  public: {
    Tables: {
      coaching_survey_responses: {
        Row: CoachingSurveyInsert & { id: string; created_at: string };
        Insert: CoachingSurveyInsert;
        Update: Partial<CoachingSurveyInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export async function saveCoachingSurvey(
  userId: string,
  answers: CoachingSurveyAnswers & { importance: number; comfortablePaying: ComfortablePaying },
): Promise<void> {
  const supabase =
    requireSupabaseClient() as unknown as SupabaseClientLike<CoachingSurveyDatabase>;

  const { error } = await supabase.from('coaching_survey_responses').insert({
    user_id: userId,
    help_with: answers.helpWith.trim(),
    different_in_30_days: answers.differentIn30Days.trim(),
    tried_and_obstacles: answers.triedAndObstacles.trim(),
    importance: answers.importance,
    comfortable_paying: answers.comfortablePaying,
    name: answers.name.trim(),
    email: answers.email.trim(),
    time_zone: answers.timeZone.trim(),
    agreed_to_share_at: new Date().toISOString(),
    app_version: Constants.expoConfig?.version ?? null,
  });

  if (error != null) {
    throw new Error(error.message);
  }
}
