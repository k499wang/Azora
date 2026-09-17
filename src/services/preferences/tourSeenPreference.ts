import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_SEEN_KEY = 'tour:app_tour_seen';
const FIRST_SESSION_ACTIVATION_KEY_PREFIX = 'tour:first_session_activation:';

export async function loadTourSeen(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TOUR_SEEN_KEY)) === 'true';
  } catch {
    // A storage failure must not replay the tour on every launch.
    return true;
  }
}

export async function setTourSeen(seen: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(TOUR_SEEN_KEY, String(seen));
  } catch {
    // Nothing to recover; the tour simply runs again next launch.
  }
}

export async function loadFirstSessionActivation(
  userId: string | null,
): Promise<string | null> {
  if (userId == null) return null;
  try {
    return await AsyncStorage.getItem(`${FIRST_SESSION_ACTIVATION_KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export async function setFirstSessionActivation(
  userId: string,
  techniqueId: string | null,
): Promise<void> {
  const key = `${FIRST_SESSION_ACTIVATION_KEY_PREFIX}${userId}`;
  try {
    if (techniqueId == null) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, techniqueId);
    }
  } catch {
    // The in-memory flow still works; a storage failure only loses relaunch recovery.
  }
}
