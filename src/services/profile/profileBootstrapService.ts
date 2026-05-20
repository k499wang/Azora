import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';

interface ProfileBootstrapDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
        };
        Insert: {
          user_id: string;
        };
        Update: {
          user_id?: string;
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
  const profile: ProfileInsert = { user_id: userId };

  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id', ignoreDuplicates: true });

  if (error != null) {
    throw error;
  }
}
