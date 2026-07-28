import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';

// Deliberately separate from `saveOnboardingProfile`: that writer runs once at
// the seal step and nulls every column it knows about, so survey answers
// captured mid-flow have to be written by something that touches only its own
// columns. It must never write `onboarding_goal` — that field alone decides
// whether a returning user resumes at the paywall.
interface OnboardingSurveyDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          acquisition_source: string | null;
        };
        Insert: {
          user_id: string;
          acquisition_source?: string | null;
        };
        Update: {
          user_id?: string;
          acquisition_source?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type AcquisitionSource =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'reddit'
  | 'app_store_search'
  | 'google_search'
  | 'friend_or_family'
  | 'other'
  | 'skipped';

export interface OnboardingSurveyAnswers {
  acquisitionSource?: AcquisitionSource;
}

export async function saveOnboardingSurveyAnswers(
  userId: string,
  answers: OnboardingSurveyAnswers,
): Promise<void> {
  const supabase =
    requireSupabaseClient() as unknown as SupabaseClientLike<OnboardingSurveyDatabase>;

  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: userId,
      ...(answers.acquisitionSource != null
        ? { acquisition_source: answers.acquisitionSource }
        : {}),
    },
    { onConflict: 'user_id' },
  );

  if (error != null) {
    throw toError(error);
  }
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return new Error(error.message);
  }

  return new Error(String(error));
}
