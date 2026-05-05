import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';
import { ensureUserProfile } from './profileBootstrapService';

type AgreementResponses = Record<string, 'disagree' | 'neutral' | 'agree' | null>;

interface OnboardingDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          onboarding_goal: string | null;
          onboarding_completed_at: string | null;
          age: number | null;
          gender: string | null;
          daily_minutes: number | null;
          default_technique_id: string | null;
          display_name: string | null;
          stress_level: number | null;
          sleep_quality: number | null;
          agreement_responses: AgreementResponses | null;
          experience_level: string | null;
        };
        Insert: {
          user_id: string;
          onboarding_goal?: string | null;
          onboarding_completed_at?: string | null;
          age?: number | null;
          gender?: string | null;
          daily_minutes?: number | null;
          default_technique_id?: string | null;
          display_name?: string | null;
          stress_level?: number | null;
          sleep_quality?: number | null;
          agreement_responses?: AgreementResponses | null;
          experience_level?: string | null;
        };
        Update: {
          user_id?: string;
          onboarding_goal?: string | null;
          onboarding_completed_at?: string | null;
          age?: number | null;
          gender?: string | null;
          daily_minutes?: number | null;
          default_technique_id?: string | null;
          display_name?: string | null;
          stress_level?: number | null;
          sleep_quality?: number | null;
          agreement_responses?: AgreementResponses | null;
          experience_level?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

type ProfileInsert = OnboardingDatabase['public']['Tables']['profiles']['Insert'];

export type OnboardingGender = 'female' | 'male' | 'nonbinary' | 'prefer_not';
export type OnboardingExperienceLevel = 'never' | 'little' | 'regular';

export interface CompleteOnboardingInput {
  onboardingGoal?: string | null;
  age?: number | null;
  gender?: OnboardingGender | null;
  dailyMinutes?: number | null;
  defaultTechniqueId?: string | null;
  displayName?: string | null;
  stressLevel?: number | null;
  sleepQuality?: number | null;
  agreementResponses?: AgreementResponses | null;
  experienceLevel?: OnboardingExperienceLevel | null;
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
    age: input.age ?? null,
    gender: input.gender ?? null,
    daily_minutes: input.dailyMinutes ?? null,
    default_technique_id: input.defaultTechniqueId ?? null,
    display_name: input.displayName ?? null,
    stress_level: input.stressLevel ?? null,
    sleep_quality: input.sleepQuality ?? null,
    agreement_responses: input.agreementResponses ?? null,
    experience_level: input.experienceLevel ?? null,
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' });

  if (error != null) {
    throw error;
  }
}
