import { requireSupabaseClient } from '../supabase';

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

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = requireSupabaseClient();
  void supabase;

  throw new Error(
    'getProfile is scaffolded but not wired yet. Read from `profiles` scoped by the authenticated user.',
  );
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
