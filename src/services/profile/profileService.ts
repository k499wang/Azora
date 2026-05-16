import { requireSupabaseClient } from '../supabase';
import type { Database } from '../supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type UserGender = 'female' | 'male' | 'nonbinary' | 'prefer_not';

export interface UserProfile {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string;
  onboardingGoal: string | null;
  onboardingCompletedAt: string | null;
  age: number | null;
  gender: UserGender | null;
  dailyMinutes: number | null;
  defaultTechniqueId: string | null;
}

export interface UserPreferences {
  userId: string;
  reminderEnabled: boolean;
  reminderTime: string | null;
  units: string;
  privacySettings: Record<string, unknown>;
}

export interface UpdateProfileInput {
  displayName?: string | null;
  avatarUrl?: string | null;
  timezone?: string;
  onboardingGoal?: string | null;
  onboardingCompletedAt?: string | null;
  age?: number | null;
  gender?: UserGender | null;
  dailyMinutes?: number | null;
  defaultTechniqueId?: string | null;
}

export interface UpdatePreferencesInput {
  reminderEnabled?: boolean;
  reminderTime?: string | null;
  units?: string;
  privacySettings?: Record<string, unknown>;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'user_id, display_name, avatar_url, timezone, onboarding_goal, onboarding_completed_at, age, gender, daily_minutes, default_technique_id',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error != null) {
    throw error;
  }

  if (data == null) {
    return null;
  }

  const row = data as ProfileRow;
  return {
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    timezone: row.timezone,
    onboardingGoal: row.onboarding_goal,
    onboardingCompletedAt: row.onboarding_completed_at,
    age: row.age,
    gender: row.gender as UserGender | null,
    dailyMinutes: row.daily_minutes,
    defaultTechniqueId: row.default_technique_id,
  };
}

export async function updateProfile(
  _input: UpdateProfileInput,
): Promise<UserProfile> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'updateProfile is scaffolded but not wired yet. Upsert into `profiles` for the authenticated user.',
  );
}

export async function updateProfileDisplayName(
  userId: string,
  displayName: string | null,
): Promise<string | null> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        display_name: displayName,
      },
      { onConflict: 'user_id' },
    )
    .select('display_name')
    .single();

  if (error != null) {
    throw error;
  }

  return (data as Pick<ProfileRow, 'display_name'>).display_name;
}

export async function getPreferences(): Promise<UserPreferences | null> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getPreferences is scaffolded but not wired yet. Read from `user_preferences` scoped by the authenticated user.',
  );
}

export async function updatePreferences(
  _input: UpdatePreferencesInput,
): Promise<UserPreferences> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'updatePreferences is scaffolded but not wired yet. Upsert into `user_preferences` for the authenticated user.',
  );
}
