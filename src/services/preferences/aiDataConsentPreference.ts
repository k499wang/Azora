import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (userId: string) => `ai:data_consent:${userId}`;

export async function loadAiDataConsent(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key(userId))) === 'true';
  } catch {
    // Unreadable storage asks again rather than sharing without a recorded yes.
    return false;
  }
}

export async function saveAiDataConsent(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId), 'true');
  } catch {
    // Nothing to recover; they are simply asked again next time.
  }
}

export async function clearAiDataConsent(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}
