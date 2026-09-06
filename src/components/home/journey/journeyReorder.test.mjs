import assert from 'node:assert/strict';
import test from 'node:test';
import {
  journeyDropIndex,
  journeyRowOffset,
  journeyRowsMeasured,
  moveJourneyRow,
} from './journeyReorder.ts';

const ORDER = ['a', 'b', 'c'];
const HEIGHTS = { a: 100, b: 40, c: 40 };
const GAP = 10;

test('a row offset is the stack above it plus its gaps', () => {
  assert.equal(journeyRowOffset(ORDER, HEIGHTS, GAP, 0), 0);
  assert.equal(journeyRowOffset(ORDER, HEIGHTS, GAP, 1), 110);
  assert.equal(journeyRowOffset(ORDER, HEIGHTS, GAP, 2), 160);
});

test('an unmeasured row contributes nothing rather than NaN', () => {
  assert.equal(journeyRowOffset(ORDER, { a: 100 }, GAP, 2), 120);
});

test('moving a row lifts it out before dropping it back in', () => {
  assert.deepEqual(moveJourneyRow(ORDER, 0, 2), ['b', 'c', 'a']);
  assert.deepEqual(moveJourneyRow(ORDER, 2, 0), ['c', 'a', 'b']);
  assert.deepEqual(moveJourneyRow(ORDER, 1, 1), ORDER);
  assert.deepEqual(moveJourneyRow(ORDER, 1, 9), ['a', 'c', 'b']);
});

test('a row takes a slot once its middle passes the middle of the row there', () => {
  // 'a' is 100 tall at the top; 'b' starts at 110 and its middle is at 130.
  assert.equal(journeyDropIndex(ORDER, HEIGHTS, GAP, 0, 0), 0);
  assert.equal(journeyDropIndex(ORDER, HEIGHTS, GAP, 0, 79), 0);
  assert.equal(journeyDropIndex(ORDER, HEIGHTS, GAP, 0, 81), 1);
  assert.equal(journeyDropIndex(ORDER, HEIGHTS, GAP, 0, 200), 2);
});

test('dragging upward crosses the same middles', () => {
  // 'c' starts at 160, middle 180; 'b' middle is 130, 'a' middle is 50.
  assert.equal(journeyDropIndex(ORDER, HEIGHTS, GAP, 2, 0), 2);
  assert.equal(journeyDropIndex(ORDER, HEIGHTS, GAP, 2, -51), 1);
  assert.equal(journeyDropIndex(ORDER, HEIGHTS, GAP, 2, -131), 0);
});

test('a drag waits for every row to be measured', () => {
  assert.equal(journeyRowsMeasured(ORDER, HEIGHTS), true);
  assert.equal(journeyRowsMeasured(ORDER, { a: 100, b: 40 }), false);
  assert.equal(journeyRowsMeasured(['a'], HEIGHTS), false);
});

test('a row that is not in the order is left where it was laid out', () => {
  // The list changed a frame ago and the live order has not caught up. Nothing
  // may be computed off it: an index of -1 has to fall out as no offset at all,
  // and a move against it has to be refused rather than splice the wrong row.
  assert.equal(journeyRowOffset(ORDER, HEIGHTS, GAP, -1), 0);
  assert.deepEqual(moveJourneyRow(ORDER, -1, 0), ORDER);
  assert.deepEqual(moveJourneyRow(ORDER, 5, 0), ORDER);
});

test('an offset past the end of the order stops at the end', () => {
  // 100 + 40 + 40 and the two gaps between them, then the trailing gap the
  // loop adds for the last row it walked past.
  assert.equal(journeyRowOffset(ORDER, HEIGHTS, GAP, 9), 210);
});

test('moving a row never mutates the order it was given', () => {
  const before = [...ORDER];
  moveJourneyRow(ORDER, 0, 2);
  assert.deepEqual(ORDER, before);
});
