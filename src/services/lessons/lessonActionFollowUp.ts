import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LessonActionFollowUp {
  lessonId: string;
  actionText: string;
  programDay: number;
}

function actionKey(userId: string, enrollmentId: string): string {
  return `lesson-action-follow-up:v1:${userId}:${enrollmentId}`;
}

export async function saveLessonAction(
  userId: string,
  enrollmentId: string,
  action: LessonActionFollowUp,
): Promise<void> {
  await AsyncStorage.setItem(actionKey(userId, enrollmentId), JSON.stringify(action));
}

export async function actionForNextProgramDay(
  userId: string,
  enrollmentId: string,
  programDay: number,
): Promise<LessonActionFollowUp | null> {
  const raw = await AsyncStorage.getItem(actionKey(userId, enrollmentId));
  if (raw == null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (value == null || typeof value !== 'object') return null;
    const action = value as Partial<LessonActionFollowUp>;
    if (
      typeof action.lessonId !== 'string' ||
      typeof action.actionText !== 'string' ||
      !Number.isInteger(action.programDay) ||
      action.programDay !== programDay - 1
    ) return null;
    return action as LessonActionFollowUp;
  } catch {
    return null;
  }
}
