import Constants from 'expo-constants';
import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';

export type Disappointment = 'very' | 'somewhat' | 'not';

type AppFeedbackInsert = {
  user_id: string;
  disappointment: Disappointment;
  improvement: string | null;
  app_version: string | null;
};

interface AppFeedbackDatabase {
  public: {
    Tables: {
      app_feedback: {
        Row: AppFeedbackInsert & { id: string; created_at: string };
        Insert: AppFeedbackInsert;
        Update: Partial<AppFeedbackInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export async function saveAppFeedback(
  userId: string,
  disappointment: Disappointment,
  improvement: string,
): Promise<void> {
  const supabase =
    requireSupabaseClient() as unknown as SupabaseClientLike<AppFeedbackDatabase>;
  const trimmed = improvement.trim();

  const { error } = await supabase.from('app_feedback').insert({
    user_id: userId,
    disappointment,
    improvement: trimmed.length > 0 ? trimmed : null,
    app_version: Constants.expoConfig?.version ?? null,
  });

  if (error != null) {
    throw new Error(error.message);
  }
}
