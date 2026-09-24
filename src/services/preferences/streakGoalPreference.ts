import AsyncStorage from '@react-native-async-storage/async-storage';

const streakGoalKey = (userId: string) => `streak:goal:${userId}`;

export async function loadStreakGoal(userId: string): Promise<number | null> {
  try {
    const days = Number(await AsyncStorage.getItem(streakGoalKey(userId)));
    return Number.isFinite(days) && days > 0 ? days : null;
  } catch {
    return null;
  }
}

export async function saveStreakGoal(userId: string, days: number): Promise<void> {
  try {
    await AsyncStorage.setItem(streakGoalKey(userId), String(days));
  } catch {
    // Nothing to recover; the goal is simply offered again next time.
  }
}
