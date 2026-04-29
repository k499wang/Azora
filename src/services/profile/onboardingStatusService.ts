import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';
import { ensureUserProfile } from './profileBootstrapService';

interface OnboardingDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          onboarding_goal: string | null;
          onboarding_completed_at: string | null;
        };
        Insert: {
          user_id: string;
          onboarding_goal?: string | null;
          onboarding_completed_at?: string | null;
        };
        Update: {
          user_id?: string;
          onboarding_goal?: string | null;
          onboarding_completed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

type ProfileInsert = OnboardingDatabase['public']['Tables']['profiles']['Insert'];

export interface CompleteOnboardingInput {
  onboardingGoal?: string | null;
}

function getOnboardingClient(): SupabaseClientLike<OnboardingDatabase> {
  return requireSupabaseClient() as unknown as SupabaseClientLike<OnboardingDatabase>;
}

export async function getOnboardingStatus(userId: string): Promise<boolean> {
  const supabase = getOnboardingClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  if (data == null) {
    await ensureUserProfile(userId);
    return false;
  }

  return data.onboarding_completed_at != null;
}

export async function completeOnboarding(
  userId: string,
  input: CompleteOnboardingInput = {},
): Promise<void> {
  const supabase = getOnboardingClient();
  const profile: ProfileInsert = {
    user_id: userId,
    onboarding_goal: input.onboardingGoal ?? null,
    onboarding_completed_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' });

  if (error != null) {
    throw error;
  }
}
