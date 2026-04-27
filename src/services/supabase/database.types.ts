export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          onboarding_goal: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          onboarding_goal?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          onboarding_goal?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          reminder_enabled: boolean;
          reminder_time: string | null;
          units: string;
          privacy_settings: Json;
          created_at: string;
          updated_at: string;
        };
      };
      daily_activity: {
        Row: {
          user_id: string;
          activity_date: string;
          timezone: string;
          daily_breath_hold_completed: boolean;
          breath_hold_count: number;
          best_hold_seconds: number | null;
          breathing_session_count: number;
          breathing_seconds: number;
          heart_rate_capture_count: number;
          xp_earned: number;
          qualifies_for_streak: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      breath_hold_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          local_date: string;
          timezone: string;
          inhale_seconds: number | null;
          hold_seconds: number;
          recovery_seconds: number | null;
          avg_bpm: number | null;
          min_bpm: number | null;
          max_bpm: number | null;
          health_score: number | null;
          lung_age: number | null;
          score_version: number;
          notes: string | null;
          rmssd?: number | null;
          sdnn?: number | null;
          pnn50?: number | null;
          hr_drop?: number | null;
          beat_count?: number | null;
          created_at: string;
        };
      };
      breathing_sessions: {
        Row: {
          id: string;
          user_id: string;
          technique_id: string;
          started_at: string;
          ended_at: string | null;
          local_date: string;
          timezone: string;
          duration_seconds: number;
          target_rounds: number | null;
          rounds_completed: number | null;
          avg_bpm: number | null;
          min_bpm: number | null;
          max_bpm: number | null;
          completed: boolean;
          created_at: string;
        };
      };
      heart_rate_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          local_date: string;
          timezone: string;
          duration_seconds: number;
          avg_bpm: number | null;
          min_bpm: number | null;
          max_bpm: number | null;
          rmssd: number | null;
          sdnn: number | null;
          pnn50: number | null;
          hr_drop: number | null;
          beat_count: number | null;
          created_at: string;
        };
      };
      heart_rate_samples: {
        Row: {
          id: number;
          user_id: string;
          breath_hold_session_id: string | null;
          breathing_session_id: string | null;
          heart_rate_session_id: string | null;
          offset_ms: number;
          bpm: number;
          signal_quality: number | null;
          created_at: string;
        };
      };
      heart_rate_ibi_samples: {
        Row: {
          id: number;
          user_id: string;
          breath_hold_session_id: string | null;
          breathing_session_id: string | null;
          heart_rate_session_id: string | null;
          offset_ms: number;
          ibi_ms: number;
          signal_quality: number | null;
          created_at: string;
        };
      };
      subscriptions: {
        Row: {
          user_id: string;
          revenuecat_app_user_id: string;
          entitlement: string;
          status: string;
          product_id: string | null;
          store: string | null;
          current_period_ends_at: string | null;
          will_renew: boolean | null;
          trial_ends_at: string | null;
          updated_at: string;
          initial_offering_id?: string | null;
          experiment_id?: string | null;
          experiment_variant?: string | null;
        };
      };
    };
    Views: {
      user_streaks_v: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_qualified_date: string | null;
        };
      };
      user_today_breath_hold_v: {
        Row: Database['public']['Tables']['breath_hold_sessions']['Row'];
      };
      user_today_breath_hold_ibi_samples_v: {
        Row: Database['public']['Tables']['heart_rate_ibi_samples']['Row'];
      };
      user_today_heart_rate_v: {
        Row: Database['public']['Tables']['heart_rate_sessions']['Row'];
      };
      user_today_heart_rate_ibi_samples_v: {
        Row: Database['public']['Tables']['heart_rate_ibi_samples']['Row'];
      };
      user_entitlement_v: {
        Row: {
          user_id: string;
          entitlement: string;
          status: string;
          product_id: string | null;
          store: string | null;
          current_period_ends_at: string | null;
          trial_ends_at: string | null;
          will_renew: boolean | null;
          is_pro: boolean;
          initial_offering_id?: string | null;
          experiment_id?: string | null;
          experiment_variant?: string | null;
        };
      };
    };
    Functions: {
      complete_breath_hold: {
        Args: {
          p_session: Json;
          p_samples?: Json;
        };
        Returns: string;
      };
      complete_breathing_session: {
        Args: {
          p_session: Json;
          p_samples?: Json;
        };
        Returns: string;
      };
      complete_heart_rate_session: {
        Args: {
          p_session: Json;
          p_samples?: Json;
        };
        Returns: string;
      };
    };
  };
}
