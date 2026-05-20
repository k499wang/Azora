import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';
import { ensureUserProfile } from './profileBootstrapService';

type AgreementResponses = Record<string, 'agree' | 'disagree' | null>;

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
type ProfileUpdate = OnboardingDatabase['public']['Tables']['profiles']['Update'];

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

export type SavedOnboardingProfile = CompleteOnboardingInput;

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

export async function saveOnboardingProfile(
  userId: string,
  input: CompleteOnboardingInput,
): Promise<void> {
  const supabase = getOnboardingClient();
  const profile: ProfileInsert = {
    user_id: userId,
    onboarding_goal: input.onboardingGoal ?? null,
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
    throw toError(error);
  }
}

export async function markOnboardingCompleted(userId: string): Promise<void> {
  const supabase = getOnboardingClient();
  const profile: ProfileUpdate = {
    onboarding_completed_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('user_id', userId)
    .select('user_id')
    .single();

  if (error != null) {
    throw toError(error);
  }
}

export async function getSavedOnboardingProfile(
  userId: string,
): Promise<SavedOnboardingProfile | null> {
  const supabase = getOnboardingClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'onboarding_goal, age, gender, daily_minutes, default_technique_id, display_name, stress_level, sleep_quality, agreement_responses, experience_level',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error != null) {
    throw toError(error);
  }

  if (data == null || !hasRecoverableOnboardingProfile(data)) {
    return null;
  }

  return {
    onboardingGoal: data.onboarding_goal,
    age: data.age,
    gender: data.gender as OnboardingGender | null,
    dailyMinutes: data.daily_minutes,
    defaultTechniqueId: data.default_technique_id,
    displayName: data.display_name,
    stressLevel: data.stress_level,
    sleepQuality: data.sleep_quality,
    agreementResponses: toAgreementResponses(data.agreement_responses),
    experienceLevel: data.experience_level as OnboardingExperienceLevel | null,
  };
}

function hasRecoverableOnboardingProfile(data: {
  onboarding_goal: string | null;
  age: number | null;
  gender: string | null;
  daily_minutes: number | null;
}): boolean {
  return (
    data.onboarding_goal != null &&
    data.onboarding_goal.length > 0 &&
    data.age != null &&
    data.gender != null &&
    data.daily_minutes != null
  );
}

function toAgreementResponses(value: unknown): AgreementResponses | null {
  if (typeof value !== 'object' || value == null || Array.isArray(value)) {
    return null;
  }

  const responses: AgreementResponses = {};
  for (const [key, response] of Object.entries(value)) {
    responses[key] = response === 'agree' || response === 'disagree' ? response : null;
  }
  return responses;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error);
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(getErrorMessage(error));
}
