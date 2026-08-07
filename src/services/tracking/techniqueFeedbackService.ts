import { requireSupabaseClient, type SupabaseClientLike } from '../supabase';

/** 1 not really, 2 a bit, 3 a lot. */
export type Helpfulness = 1 | 2 | 3;

export interface TechniqueFeedbackRow {
  techniqueId: string;
  localDate: string;
  helpfulness: Helpfulness;
}

interface TechniqueFeedbackDatabase {
  public: {
    Tables: {
      technique_feedback: {
        Row: {
          id: string;
          user_id: string;
          technique_id: string;
          local_date: string;
          helpfulness: number;
        };
        Insert: {
          user_id: string;
          technique_id: string;
          local_date: string;
          helpfulness: number;
        };
        Update: {
          helpfulness?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

function getClient(): SupabaseClientLike<TechniqueFeedbackDatabase> {
  return requireSupabaseClient() as unknown as SupabaseClientLike<TechniqueFeedbackDatabase>;
}

function toHelpfulness(value: number): Helpfulness {
  return value === 1 || value === 2 ? value : 3;
}

export async function getTechniqueFeedback(
  userId: string,
): Promise<TechniqueFeedbackRow[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('technique_feedback')
    .select('technique_id, local_date, helpfulness')
    .eq('user_id', userId);

  if (error != null) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    techniqueId: row.technique_id,
    localDate: row.local_date,
    helpfulness: toHelpfulness(row.helpfulness),
  }));
}

/** Answering again on the same day replaces the earlier answer. */
export async function saveTechniqueFeedback(
  userId: string,
  techniqueId: string,
  localDate: string,
  helpfulness: Helpfulness,
): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase
    .from('technique_feedback')
    .upsert(
      {
        user_id: userId,
        technique_id: techniqueId,
        local_date: localDate,
        helpfulness,
      },
      { onConflict: 'user_id,technique_id,local_date' },
    );

  if (error != null) {
    throw error;
  }
}
