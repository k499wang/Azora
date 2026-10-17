import AsyncStorage from '@react-native-async-storage/async-storage';

function futureSelfLetterSeenKey(userId: string): string {
  return `letter:future_self_seen:${userId}`;
}

export async function loadFutureSelfLetterSeen(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(futureSelfLetterSeenKey(userId))) === 'true';
  } catch {
    // A storage failure must not pin the envelope to Home forever.
    return true;
  }
}

export async function setFutureSelfLetterSeen(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(futureSelfLetterSeenKey(userId), 'true');
  } catch {
    // Nothing to recover; the envelope simply shows again next launch.
  }
}

export async function clearFutureSelfLetterSeen(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(futureSelfLetterSeenKey(userId));
  } catch {}
}
