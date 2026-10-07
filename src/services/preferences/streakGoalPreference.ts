import AsyncStorage from '@react-native-async-storage/async-storage';

const streakGoalKey = (userId: string) => `streak:goal:${userId}`;

export async function saveStreakGoal(userId: string, days: number): Promise<void> {
  try {
    await AsyncStorage.setItem(streakGoalKey(userId), String(days));
  } catch {
    // Nothing to recover; the goal is simply offered again next time.
  }
}
