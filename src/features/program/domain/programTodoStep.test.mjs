import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAN_TODO_ACTIVITY_ID,
  PLAN_TODO_STEP_ENABLED,
  programDayAsksForTodo,
  todoStepState,
} from './programTodoStep.ts';
import { buildProgramEnrollment, programDayForDate } from './programEnrollment.ts';

const ticked = { completedToday: true };
const unticked = { completedToday: false };

test('the claim row id matches what claim_plan_todo_step writes', () => {
  assert.equal(PLAN_TODO_ACTIVITY_ID, 'todo:claim');
});

test('a new enrollment asks for the to-do from day one only while the step is enabled', () => {
  const built = buildProgramEnrollment({
    enrollmentId: 'e1', planId: 'night', presetRevision: 1, enrolledOn: '2026-10-11',
  });
  assert.equal(built.status, 'enrolled');
  assert.equal(built.enrollment.todoStepFromDay, PLAN_TODO_STEP_ENABLED ? 1 : null);
  assert.equal(programDayAsksForTodo(built.enrollment, 1), PLAN_TODO_STEP_ENABLED);
});

test('an unadopted enrollment never asks for the to-do', () => {
  assert.equal(programDayAsksForTodo({ todoStepFromDay: null }, 1), false);
  assert.equal(programDayAsksForTodo({ todoStepFromDay: null }, 20), false);
});

test('an adopted enrollment asks from the day it was adopted on, not before', () => {
  const enrollment = { todoStepFromDay: 6 };
  assert.equal(programDayAsksForTodo(enrollment, 5), false);
  assert.equal(programDayAsksForTodo(enrollment, 6), true);
  assert.equal(programDayAsksForTodo(enrollment, 7), true);
});

test('a day that does not ask for the step has no state', () => {
  assert.equal(todoStepState({ required: false, claimed: false, goals: [ticked] }), null);
  assert.equal(todoStepState({ required: false, claimed: true, goals: [] }), null);
});

test('nothing due today sends the user to add one', () => {
  assert.equal(todoStepState({ required: true, claimed: false, goals: [] }), 'add');
});

test('something due and nothing ticked is open', () => {
  assert.equal(todoStepState({ required: true, claimed: false, goals: [unticked, unticked] }), 'open');
});

test('one ticked to-do makes the step claimable', () => {
  assert.equal(todoStepState({ required: true, claimed: false, goals: [unticked, ticked] }), 'claimable');
});

test('a claim stands after the to-do that earned it is un-ticked', () => {
  assert.equal(todoStepState({ required: true, claimed: true, goals: [ticked] }), 'claimed');
  assert.equal(todoStepState({ required: true, claimed: true, goals: [unticked] }), 'claimed');
  assert.equal(todoStepState({ required: true, claimed: true, goals: [] }), 'claimed');
});

test('adopting on a day already finished today never reopens it', () => {
  const built = buildProgramEnrollment({
    enrollmentId: 'e1', planId: 'night', presetRevision: 1, enrolledOn: '2026-10-01',
  });
  // Day 5 finished today on an older build; adoption stamps the day it moved to.
  const adopted = { ...built.enrollment, programDay: 6, lastAdvancedOn: '2026-10-11', todoStepFromDay: 6 };
  const shownToday = programDayForDate(adopted, '2026-10-11');
  assert.equal(shownToday, 5);
  assert.equal(programDayAsksForTodo(adopted, shownToday), false);
  assert.equal(todoStepState({ required: programDayAsksForTodo(adopted, shownToday), claimed: false, goals: [] }), null);
  // Tomorrow the next day opens, and it is the first to ask.
  assert.equal(programDayAsksForTodo(adopted, programDayForDate(adopted, '2026-10-12')), true);
});

test('days before adoption never ask, so no finished day needs a retroactive claim', () => {
  const adopted = { todoStepFromDay: 6 };
  for (let day = 1; day < 6; day += 1) assert.equal(programDayAsksForTodo(adopted, day), false);
});
