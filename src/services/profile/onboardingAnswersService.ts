import Constants from 'expo-constants';
import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';
import type { Json } from '../supabase/database.types';
import type { OnboardingAnswerValue } from './onboardingAnswers';

type OnboardingAnswerRow = {
  user_id: string;
  question_id: string;
  answer: Json;
  app_version: string | null;
  updated_at: string;
};

interface OnboardingAnswersDatabase {
  public: {
    Tables: {
      onboarding_answers: {
        Row: OnboardingAnswerRow;
        Insert: OnboardingAnswerRow;
        Update: Partial<OnboardingAnswerRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export async function saveOnboardingAnswers(
  userId: string,
  answers: Record<string, OnboardingAnswerValue>,
): Promise<void> {
  const updatedAt = new Date().toISOString();
  const appVersion = Constants.expoConfig?.version ?? null;
  const rows = Object.entries(answers).map(([questionId, answer]) => ({
    user_id: userId,
    question_id: questionId,
    answer: answer as Json,
    app_version: appVersion,
    updated_at: updatedAt,
  }));
  if (rows.length === 0) return;

  const supabase =
    requireSupabaseClient() as unknown as SupabaseClientLike<OnboardingAnswersDatabase>;

  const { error } = await supabase
    .from('onboarding_answers')
    .upsert(rows, { onConflict: 'user_id,question_id' });

  if (error != null) {
    throw new Error(error.message);
  }
}
