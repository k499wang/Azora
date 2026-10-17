import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLearningPracticeRecord, parseLearningPractice, type LearningPracticeRecord } from '../../features/lessons/domain/learningPractice';

const writes = new Map<string, Promise<unknown>>();
const keyFor = (userId: string, enrollmentId: string) => `learning-practice:v1:${encodeURIComponent(userId)}:${encodeURIComponent(enrollmentId)}`;

/** Device-local, scoped to the signed-in person and their enrolled course. */
export async function readLearningPractice(userId: string, enrollmentId: string) {
  const key = keyFor(userId, enrollmentId);
  await writes.get(key)?.catch(() => {});
  return parseLearningPractice(await AsyncStorage.getItem(key));
}

export function saveLearningPractice(userId: string, enrollmentId: string, record: LearningPracticeRecord): Promise<LearningPracticeRecord[]> {
  if (!isLearningPracticeRecord(record)) return Promise.reject(new Error('Invalid learning response.'));
  const key = keyFor(userId, enrollmentId);
  const pending = (writes.get(key) ?? Promise.resolve()).catch(() => {}).then(async () => {
    const rows = parseLearningPractice(await AsyncStorage.getItem(key));
    const next = parseLearningPractice(JSON.stringify([...rows, record]));
    await AsyncStorage.setItem(key, JSON.stringify(next));
    return next;
  });
  writes.set(key, pending);
  void pending.finally(() => { if (writes.get(key) === pending) writes.delete(key); }).catch(() => {});
  return pending;
}
