export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      breath_hold_sessions: {
        Row: {
          avg_bpm: number | null
          beat_count: number | null
          created_at: string
          ended_at: string | null
          health_score: number | null
          hold_seconds: number
          hr_drop: number | null
          id: string
          inhale_seconds: number | null
          local_date: string
          lung_age: number | null
          max_bpm: number | null
          min_bpm: number | null
          notes: string | null
          pnn50: number | null
          recovery_seconds: number | null
          rmssd: number | null
          score_version: number
          sdnn: number | null
          started_at: string
          stress: number | null
          timezone: string
          user_id: string
        }
        Insert: {
          avg_bpm?: number | null
          beat_count?: number | null
          created_at?: string
          ended_at?: string | null
          health_score?: number | null
          hold_seconds: number
          hr_drop?: number | null
          id?: string
          inhale_seconds?: number | null
          local_date: string
          lung_age?: number | null
          max_bpm?: number | null
          min_bpm?: number | null
          notes?: string | null
          pnn50?: number | null
          recovery_seconds?: number | null
          rmssd?: number | null
          score_version?: number
          sdnn?: number | null
          started_at: string
          stress?: number | null
          timezone: string
          user_id: string
        }
        Update: {
          avg_bpm?: number | null
          beat_count?: number | null
          created_at?: string
          ended_at?: string | null
          health_score?: number | null
          hold_seconds?: number
          hr_drop?: number | null
          id?: string
          inhale_seconds?: number | null
          local_date?: string
          lung_age?: number | null
          max_bpm?: number | null
          min_bpm?: number | null
          notes?: string | null
          pnn50?: number | null
          recovery_seconds?: number | null
          rmssd?: number | null
          score_version?: number
          sdnn?: number | null
          started_at?: string
          stress?: number | null
          timezone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breath_hold_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "breath_hold_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      breathing_sessions: {
        Row: {
          avg_bpm: number | null
          completed: boolean
          created_at: string
          duration_seconds: number
          ended_at: string | null
          id: string
          local_date: string
          max_bpm: number | null
          min_bpm: number | null
          rounds_completed: number | null
          started_at: string
          target_rounds: number | null
          technique_id: string
          timezone: string
          user_id: string
        }
        Insert: {
          avg_bpm?: number | null
          completed?: boolean
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          local_date: string
          max_bpm?: number | null
          min_bpm?: number | null
          rounds_completed?: number | null
          started_at: string
          target_rounds?: number | null
          technique_id: string
          timezone: string
          user_id: string
        }
        Update: {
          avg_bpm?: number | null
          completed?: boolean
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          local_date?: string
          max_bpm?: number | null
          min_bpm?: number | null
          rounds_completed?: number | null
          started_at?: string
          target_rounds?: number | null
          technique_id?: string
          timezone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breathing_sessions_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "breathing_technique_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breathing_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "breathing_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      breathing_technique_catalog: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          activity_date: string
          best_hold_seconds: number | null
          breath_hold_count: number
          breathing_seconds: number
          breathing_session_count: number
          created_at: string
          daily_breath_hold_completed: boolean
          heart_rate_capture_count: number
          qualifies_for_streak: boolean
          timezone: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          activity_date: string
          best_hold_seconds?: number | null
          breath_hold_count?: number
          breathing_seconds?: number
          breathing_session_count?: number
          created_at?: string
          daily_breath_hold_completed?: boolean
          heart_rate_capture_count?: number
          qualifies_for_streak?: boolean
          timezone: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          activity_date?: string
          best_hold_seconds?: number | null
          breath_hold_count?: number
          breathing_seconds?: number
          breathing_session_count?: number
          created_at?: string
          daily_breath_hold_completed?: boolean
          heart_rate_capture_count?: number
          qualifies_for_streak?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      heart_rate_ibi_samples: {
        Row: {
          breath_hold_session_id: string | null
          breathing_session_id: string | null
          created_at: string
          heart_rate_session_id: string | null
          ibi_ms: number
          id: number
          offset_ms: number
          signal_quality: number | null
          user_id: string
        }
        Insert: {
          breath_hold_session_id?: string | null
          breathing_session_id?: string | null
          created_at?: string
          heart_rate_session_id?: string | null
          ibi_ms: number
          id?: number
          offset_ms: number
          signal_quality?: number | null
          user_id: string
        }
        Update: {
          breath_hold_session_id?: string | null
          breathing_session_id?: string | null
          created_at?: string
          heart_rate_session_id?: string | null
          ibi_ms?: number
          id?: number
          offset_ms?: number
          signal_quality?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "heart_rate_ibi_samples_breath_hold_session_id_fkey"
            columns: ["breath_hold_session_id"]
            isOneToOne: false
            referencedRelation: "breath_hold_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_breath_hold_session_id_fkey"
            columns: ["breath_hold_session_id"]
            isOneToOne: false
            referencedRelation: "user_today_breath_hold_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_breathing_session_id_fkey"
            columns: ["breathing_session_id"]
            isOneToOne: false
            referencedRelation: "breathing_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_heart_rate_session_id_fkey"
            columns: ["heart_rate_session_id"]
            isOneToOne: false
            referencedRelation: "heart_rate_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_heart_rate_session_id_fkey"
            columns: ["heart_rate_session_id"]
            isOneToOne: false
            referencedRelation: "user_today_heart_rate_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      heart_rate_samples: {
        Row: {
          bpm: number
          breath_hold_session_id: string | null
          breathing_session_id: string | null
          created_at: string
          heart_rate_session_id: string | null
          id: number
          offset_ms: number
          signal_quality: number | null
          user_id: string
        }
        Insert: {
          bpm: number
          breath_hold_session_id?: string | null
          breathing_session_id?: string | null
          created_at?: string
          heart_rate_session_id?: string | null
          id?: number
          offset_ms: number
          signal_quality?: number | null
          user_id: string
        }
        Update: {
          bpm?: number
          breath_hold_session_id?: string | null
          breathing_session_id?: string | null
          created_at?: string
          heart_rate_session_id?: string | null
          id?: number
          offset_ms?: number
          signal_quality?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "heart_rate_samples_breath_hold_session_id_fkey"
            columns: ["breath_hold_session_id"]
            isOneToOne: false
            referencedRelation: "breath_hold_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_samples_breath_hold_session_id_fkey"
            columns: ["breath_hold_session_id"]
            isOneToOne: false
            referencedRelation: "user_today_breath_hold_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_samples_breathing_session_id_fkey"
            columns: ["breathing_session_id"]
            isOneToOne: false
            referencedRelation: "breathing_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_samples_heart_rate_session_id_fkey"
            columns: ["heart_rate_session_id"]
            isOneToOne: false
            referencedRelation: "heart_rate_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_samples_heart_rate_session_id_fkey"
            columns: ["heart_rate_session_id"]
            isOneToOne: false
            referencedRelation: "user_today_heart_rate_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_samples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "heart_rate_samples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      heart_rate_sessions: {
        Row: {
          avg_bpm: number | null
          beat_count: number | null
          created_at: string
          duration_seconds: number
          ended_at: string | null
          hr_drop: number | null
          id: string
          idempotency_key: string | null
          local_date: string
          max_bpm: number | null
          min_bpm: number | null
          pnn50: number | null
          rmssd: number | null
          sdnn: number | null
          started_at: string
          stress: number | null
          timezone: string
          user_id: string
        }
        Insert: {
          avg_bpm?: number | null
          beat_count?: number | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          hr_drop?: number | null
          id?: string
          idempotency_key?: string | null
          local_date: string
          max_bpm?: number | null
          min_bpm?: number | null
          pnn50?: number | null
          rmssd?: number | null
          sdnn?: number | null
          started_at: string
          stress?: number | null
          timezone: string
          user_id: string
        }
        Update: {
          avg_bpm?: number | null
          beat_count?: number | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          hr_drop?: number | null
          id?: string
          idempotency_key?: string | null
          local_date?: string
          max_bpm?: number | null
          min_bpm?: number | null
          pnn50?: number | null
          rmssd?: number | null
          sdnn?: number | null
          started_at?: string
          stress?: number | null
          timezone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "heart_rate_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "heart_rate_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          agreement_responses: Json | null
          avatar_url: string | null
          created_at: string
          daily_minutes: number | null
          default_technique_id: string | null
          display_name: string | null
          experience_level: string | null
          gender: string | null
          onboarding_completed_at: string | null
          onboarding_goal: string | null
          sleep_quality: number | null
          stress_level: number | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          agreement_responses?: Json | null
          avatar_url?: string | null
          created_at?: string
          daily_minutes?: number | null
          default_technique_id?: string | null
          display_name?: string | null
          experience_level?: string | null
          gender?: string | null
          onboarding_completed_at?: string | null
          onboarding_goal?: string | null
          sleep_quality?: number | null
          stress_level?: number | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          agreement_responses?: Json | null
          avatar_url?: string | null
          created_at?: string
          daily_minutes?: number | null
          default_technique_id?: string | null
          display_name?: string | null
          experience_level?: string | null
          gender?: string | null
          onboarding_completed_at?: string | null
          onboarding_goal?: string | null
          sleep_quality?: number | null
          stress_level?: number | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revenuecat_events: {
        Row: {
          environment: string | null
          event_id: string
          event_type: string
          payload: Json
          received_at: string
          user_id: string | null
        }
        Insert: {
          environment?: string | null
          event_id: string
          event_type: string
          payload: Json
          received_at?: string
          user_id?: string | null
        }
        Update: {
          environment?: string | null
          event_id?: string
          event_type?: string
          payload?: Json
          received_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenuecat_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "revenuecat_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          current_period_ends_at: string | null
          entitlement: string
          experiment_id: string | null
          experiment_variant: string | null
          initial_offering_id: string | null
          last_revenuecat_event_id: string | null
          last_revenuecat_event_received_at: string | null
          last_revenuecat_event_timestamp_ms: number | null
          last_revenuecat_event_type: string | null
          last_revenuecat_original_transaction_id: string | null
          last_revenuecat_transaction_id: string | null
          product_id: string | null
          revenuecat_app_user_id: string
          status: string
          store: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          will_renew: boolean | null
        }
        Insert: {
          current_period_ends_at?: string | null
          entitlement?: string
          experiment_id?: string | null
          experiment_variant?: string | null
          initial_offering_id?: string | null
          last_revenuecat_event_id?: string | null
          last_revenuecat_event_received_at?: string | null
          last_revenuecat_event_timestamp_ms?: number | null
          last_revenuecat_event_type?: string | null
          last_revenuecat_original_transaction_id?: string | null
          last_revenuecat_transaction_id?: string | null
          product_id?: string | null
          revenuecat_app_user_id: string
          status: string
          store?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          will_renew?: boolean | null
        }
        Update: {
          current_period_ends_at?: string | null
          entitlement?: string
          experiment_id?: string | null
          experiment_variant?: string | null
          initial_offering_id?: string | null
          last_revenuecat_event_id?: string | null
          last_revenuecat_event_received_at?: string | null
          last_revenuecat_event_timestamp_ms?: number | null
          last_revenuecat_event_type?: string | null
          last_revenuecat_original_transaction_id?: string | null
          last_revenuecat_transaction_id?: string | null
          product_id?: string | null
          revenuecat_app_user_id?: string
          status?: string
          store?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          will_renew?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      web_checkout_intents: {
        Row: {
          checkout_event_id: string | null
          created_at: string
          currency: string | null
          environment: string
          failure_reason: string | null
          id: string
          offer_id: string
          price_amount: number | null
          purchase_event_id: string | null
          purchased_at: string | null
          revenuecat_app_user_id: string
          revenuecat_event_id: string | null
          revenuecat_original_transaction_id: string | null
          revenuecat_product_id: string | null
          revenuecat_purchase_url: string
          revenuecat_transaction_id: string | null
          session_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checkout_event_id?: string | null
          created_at?: string
          currency?: string | null
          environment: string
          failure_reason?: string | null
          id?: string
          offer_id: string
          price_amount?: number | null
          purchase_event_id?: string | null
          purchased_at?: string | null
          revenuecat_app_user_id: string
          revenuecat_event_id?: string | null
          revenuecat_original_transaction_id?: string | null
          revenuecat_product_id?: string | null
          revenuecat_purchase_url: string
          revenuecat_transaction_id?: string | null
          session_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checkout_event_id?: string | null
          created_at?: string
          currency?: string | null
          environment?: string
          failure_reason?: string | null
          id?: string
          offer_id?: string
          price_amount?: number | null
          purchase_event_id?: string | null
          purchased_at?: string | null
          revenuecat_app_user_id?: string
          revenuecat_event_id?: string | null
          revenuecat_original_transaction_id?: string | null
          revenuecat_product_id?: string | null
          revenuecat_purchase_url?: string
          revenuecat_transaction_id?: string | null
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_checkout_intents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "web_funnel_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_checkout_intents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "web_checkout_intents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      web_funnel_answers: {
        Row: {
          answer: Json
          created_at: string
          id: string
          session_id: string
          step_id: string
          updated_at: string
        }
        Insert: {
          answer: Json
          created_at?: string
          id?: string
          session_id: string
          step_id: string
          updated_at?: string
        }
        Update: {
          answer?: Json
          created_at?: string
          id?: string
          session_id?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_funnel_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "web_funnel_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      web_funnel_attribution: {
        Row: {
          appsflyer_c: string | null
          appsflyer_deep_link_value: string | null
          appsflyer_pid: string | null
          checkout_event_id: string | null
          created_at: string
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          landing_event_id: string | null
          lead_event_id: string | null
          purchase_event_id: string | null
          raw_params: Json
          session_id: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          appsflyer_c?: string | null
          appsflyer_deep_link_value?: string | null
          appsflyer_pid?: string | null
          checkout_event_id?: string | null
          created_at?: string
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          landing_event_id?: string | null
          lead_event_id?: string | null
          purchase_event_id?: string | null
          raw_params?: Json
          session_id: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          appsflyer_c?: string | null
          appsflyer_deep_link_value?: string | null
          appsflyer_pid?: string | null
          checkout_event_id?: string | null
          created_at?: string
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          landing_event_id?: string | null
          lead_event_id?: string | null
          purchase_event_id?: string | null
          raw_params?: Json
          session_id?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_funnel_attribution_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "web_funnel_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      web_funnel_sessions: {
        Row: {
          anonymous_id: string
          created_at: string
          funnel_slug: string
          id: string
          initial_url: string
          ip_country: string | null
          landing_path: string
          referrer: string | null
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id: string
          created_at?: string
          funnel_slug: string
          id?: string
          initial_url: string
          ip_country?: string | null
          landing_path: string
          referrer?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string
          created_at?: string
          funnel_slug?: string
          id?: string
          initial_url?: string
          ip_country?: string | null
          landing_path?: string
          referrer?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_funnel_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "web_funnel_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          notification_preferences: Json
          privacy_settings: Json
          units: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          notification_preferences?: Json
          privacy_settings?: Json
          units?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          notification_preferences?: Json
          privacy_settings?: Json
          units?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      user_entitlement_v: {
        Row: {
          current_period_ends_at: string | null
          entitlement: string | null
          experiment_id: string | null
          experiment_variant: string | null
          initial_offering_id: string | null
          is_pro: boolean | null
          product_id: string | null
          status: string | null
          store: string | null
          trial_ends_at: string | null
          user_id: string | null
          will_renew: boolean | null
        }
        Insert: {
          current_period_ends_at?: string | null
          entitlement?: string | null
          experiment_id?: string | null
          experiment_variant?: string | null
          initial_offering_id?: string | null
          is_pro?: never
          product_id?: string | null
          status?: string | null
          store?: string | null
          trial_ends_at?: string | null
          user_id?: string | null
          will_renew?: boolean | null
        }
        Update: {
          current_period_ends_at?: string | null
          entitlement?: string | null
          experiment_id?: string | null
          experiment_variant?: string | null
          initial_offering_id?: string | null
          is_pro?: never
          product_id?: string | null
          status?: string | null
          store?: string | null
          trial_ends_at?: string | null
          user_id?: string | null
          will_renew?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_streaks_v: {
        Row: {
          current_streak: number | null
          last_qualified_date: string | null
          longest_streak: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_today_breath_hold_ibi_samples_v: {
        Row: {
          breath_hold_session_id: string | null
          created_at: string | null
          ibi_ms: number | null
          id: number | null
          offset_ms: number | null
          signal_quality: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heart_rate_ibi_samples_breath_hold_session_id_fkey"
            columns: ["breath_hold_session_id"]
            isOneToOne: false
            referencedRelation: "breath_hold_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_breath_hold_session_id_fkey"
            columns: ["breath_hold_session_id"]
            isOneToOne: false
            referencedRelation: "user_today_breath_hold_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_today_breath_hold_v: {
        Row: {
          avg_bpm: number | null
          beat_count: number | null
          created_at: string | null
          ended_at: string | null
          health_score: number | null
          hold_seconds: number | null
          hr_drop: number | null
          id: string | null
          inhale_seconds: number | null
          local_date: string | null
          lung_age: number | null
          max_bpm: number | null
          min_bpm: number | null
          notes: string | null
          pnn50: number | null
          recovery_seconds: number | null
          rmssd: number | null
          score_version: number | null
          sdnn: number | null
          started_at: string | null
          stress: number | null
          timezone: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "breath_hold_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "breath_hold_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_today_heart_rate_ibi_samples_v: {
        Row: {
          created_at: string | null
          heart_rate_session_id: string | null
          ibi_ms: number | null
          id: number | null
          offset_ms: number | null
          signal_quality: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heart_rate_ibi_samples_heart_rate_session_id_fkey"
            columns: ["heart_rate_session_id"]
            isOneToOne: false
            referencedRelation: "heart_rate_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_heart_rate_session_id_fkey"
            columns: ["heart_rate_session_id"]
            isOneToOne: false
            referencedRelation: "user_today_heart_rate_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "heart_rate_ibi_samples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_today_heart_rate_v: {
        Row: {
          avg_bpm: number | null
          beat_count: number | null
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          hr_drop: number | null
          id: string | null
          local_date: string | null
          max_bpm: number | null
          min_bpm: number | null
          pnn50: number | null
          rmssd: number | null
          sdnn: number | null
          started_at: string | null
          stress: number | null
          timezone: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heart_rate_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "heart_rate_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_streaks_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      complete_breath_hold: {
        Args: { p_samples?: Json; p_session: Json }
        Returns: string
      }
      complete_breathing_session: {
        Args: { p_samples?: Json; p_session: Json }
        Returns: string
      }
      complete_heart_rate_session: {
        Args: { p_samples?: Json; p_session: Json }
        Returns: string
      }
      ensure_profile_exists: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
