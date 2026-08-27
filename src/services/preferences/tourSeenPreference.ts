import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_SEEN_KEY = 'tour:app_tour_seen';

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
