import { requireSupabaseClient, type SupabaseClientLike } from '../supabase/client';

interface ProfileBootstrapDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
        };
        Insert: {
          user_id: string;
          timezone: string;
        };
        Update: {
          user_id?: string;
          timezone?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

type ProfileInsert =
  ProfileBootstrapDatabase['public']['Tables']['profiles']['Insert'];

function getProfileClient(): SupabaseClientLike<ProfileBootstrapDatabase> {
  return requireSupabaseClient() as unknown as SupabaseClientLike<ProfileBootstrapDatabase>;
}

export async function ensureUserProfile(userId: string): Promise<void> {
  const supabase = getProfileClient();
  // Completions use the device's calendar day; the streak view must use the
  // same timezone instead of retaining the database's Toronto default.
  const profile: ProfileInsert = {
    user_id: userId,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' });

  if (error != null) {
    throw error;
  }
}
