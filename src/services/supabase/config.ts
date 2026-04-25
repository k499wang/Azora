import Constants from 'expo-constants';

type ExpoExtra = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const supabaseConfig = {
  url: extra.supabaseUrl ?? null,
  publishableKey: extra.supabasePublishableKey ?? extra.supabaseAnonKey ?? null,
};

export const isSupabaseConfigured =
  Boolean(supabaseConfig.url) && Boolean(supabaseConfig.publishableKey);
