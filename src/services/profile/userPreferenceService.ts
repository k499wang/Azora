import { requireSupabaseClient } from '../supabase';
import type { Database } from '../supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export async function getUserDefaultTechniqueId(
  userId: string,
): Promise<string | null> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('default_technique_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error != null) throw error;
  return (data as Pick<ProfileRow, 'default_technique_id'> | null)?.default_technique_id ?? null;
}
