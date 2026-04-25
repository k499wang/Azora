import AsyncStorage from '@react-native-async-storage/async-storage';

function getOnboardingKey(userId: string): string {
  return `onboarding_complete:${userId}`;
}

// Temporary local adapter. Keep this user-scoped shape so it can be replaced
// with a profile-backed Supabase field later without changing navigation code.
export async function getOnboardingStatus(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(getOnboardingKey(userId));
  return value === 'true';
}

export async function completeOnboarding(userId: string): Promise<void> {
  await AsyncStorage.setItem(getOnboardingKey(userId), 'true');
}
