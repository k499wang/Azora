import test from 'node:test';
import assert from 'node:assert/strict';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { actionForNextProgramDay, saveLessonAction } from './lessonActionFollowUp.ts';

const values = new Map();
AsyncStorage.getItem = async (key) => values.get(key) ?? null;
AsyncStorage.setItem = async (key, value) => { values.set(key, value); };

test('an action appears only on the next program day in the same enrollment', async () => {
  values.clear();
  const action = { lessonId: 'sleep.anchor', actionText: 'Try a steady wake time.', programDay: 2 };
  await saveLessonAction('user-one', 'enrollment-one', action);
  assert.deepEqual(await actionForNextProgramDay('user-one', 'enrollment-one', 3), action);
  assert.equal(await actionForNextProgramDay('user-one', 'enrollment-one', 2), null);
  assert.equal(await actionForNextProgramDay('user-one', 'enrollment-one', 4), null);
  assert.equal(await actionForNextProgramDay('user-two', 'enrollment-one', 3), null);
  assert.equal(await actionForNextProgramDay('user-one', 'enrollment-two', 3), null);
});

test('corrupt stored action is ignored', async () => {
  values.clear();
  await saveLessonAction('user-one', 'enrollment-one', {
    lessonId: 'sleep.anchor', actionText: 'Try a steady wake time.', programDay: 2,
  });
  for (const key of values.keys()) values.set(key, '{broken');
  assert.equal(await actionForNextProgramDay('user-one', 'enrollment-one', 3), null);
});
