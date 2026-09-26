/**
 * The contract every source of the day has to meet.
 *
 * These are the rules that stop a new kind of row from quietly breaking the
 * reward: the day is every source's rows end to end, and it is not countable
 * until all of them have finished their first load.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_DAY_UNIT_SOURCE,
  countCompletedDayUnits,
  dayUnitsOfKind,
  isLastUnfinishedDayUnit,
  mergeDayUnitSources,
} from './dayUnit.ts';

const unit = (kind, id, completed = false) => ({
  kind,
  id,
  title: id,
  techniqueId: null,
  completed,
});

const source = (units, isLoading = false, isSettling = false) => ({
  units,
  isLoading,
  isSettling,
});

test('the day is every source in the order it was given', () => {
  const merged = mergeDayUnitSources([
    source([unit('exercise', 'a'), unit('exercise', 'b')]),
    source([unit('mood', 'mood')]),
    source([unit('lesson', 'lesson')]),
  ]);
  assert.deepEqual(
    merged.units.map(({ id }) => id),
    ['a', 'b', 'mood', 'lesson'],
  );
});

test('one source still loading makes the whole day unknown', () => {
  // The day's length is the thing being loaded. Counting four rows while a
  // fifth is on its way reports a fraction of a day as the whole of it, and
  // that is the number the room's reward turns on.
  const merged = mergeDayUnitSources([
    source([unit('exercise', 'a')]),
    source([], true),
  ]);
  assert.equal(merged.isLoading, true);
  assert.equal(merged.units.length, 1);
});

test('one source still settling holds the whole day back', () => {
  const merged = mergeDayUnitSources([
    source([unit('exercise', 'a')]),
    source([unit('mood', 'mood')], false, true),
  ]);
  assert.equal(merged.isSettling, true);
  assert.equal(merged.isLoading, false);
});

test('a day with no sources is empty rather than loading', () => {
  const merged = mergeDayUnitSources([]);
  assert.deepEqual(merged, EMPTY_DAY_UNIT_SOURCE);
});

test('a source that contributes nothing today is not a source that is loading', () => {
  // The check-in on a backend that cannot hold one, or a day with no lesson.
  const merged = mergeDayUnitSources([
    source([unit('exercise', 'a', true)]),
    source([]),
  ]);
  assert.equal(merged.isLoading, false);
  assert.equal(countCompletedDayUnits(merged.units), 1);
});

test('counting is by row, not by kind', () => {
  const units = [
    unit('exercise', 'a', true),
    unit('mood', 'mood', true),
    unit('lesson', 'lesson'),
  ];
  assert.equal(countCompletedDayUnits(units), 2);
  assert.equal(units.length, 3);
});

test('a kind can be picked out without the caller knowing the others', () => {
  const units = [
    unit('exercise', 'a'),
    unit('mood', 'mood'),
    unit('exercise', 'b'),
  ];
  assert.deepEqual(
    dayUnitsOfKind(units, 'exercise').map(({ id }) => id),
    ['a', 'b'],
  );
  assert.deepEqual(dayUnitsOfKind(units, 'lesson'), []);
});

test('only the one row still open finishes the day', () => {
  const units = [unit('exercise', 'a', true), unit('lesson', 'l'), unit('mood', 'm', true)];

  assert.equal(isLastUnfinishedDayUnit(units, 'l'), true);
  assert.equal(isLastUnfinishedDayUnit(units, 'm'), false);
  assert.equal(isLastUnfinishedDayUnit([...units, unit('exercise', 'b')], 'l'), false);
  assert.equal(isLastUnfinishedDayUnit(units, 'missing'), false);
});
