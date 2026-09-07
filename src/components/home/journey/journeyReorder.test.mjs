import assert from 'node:assert/strict';
import test from 'node:test';
import {
  journeyContentHeight,
  journeyDropIndex,
  journeyRailEnds,
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

test('a rail spans the first and last rows, and refuses an unmeasured one', () => {
  const HEIGHTS = { a: 40, b: 80, c: 60 };
  const shape = ({ firstHeight, lastHeight, lastOffset, height }) => ({
    top: firstHeight / 2,
    bottom: height - (lastOffset + lastHeight / 2),
  });

  // a at 0..40, b at 50..130, c at 140..200, in a 260 tall box
  assert.deepEqual(journeyRailEnds(['a', 'b', 'c'], HEIGHTS, 10, 260, shape), {
    top: 20,
    bottom: 260 - 170,
  });

  // The same rows, rearranged: both ends move with them.
  assert.deepEqual(journeyRailEnds(['b', 'a', 'c'], HEIGHTS, 10, 260, shape), {
    top: 40,
    bottom: 260 - 170,
  });

  // A row that has mounted but not been laid out yet has no rail at all, so a
  // caller can hold the last good one rather than draw a collapsed line.
  assert.equal(journeyRailEnds(['a', 'd'], HEIGHTS, 10, 260, shape), null);
  assert.equal(journeyRailEnds([], HEIGHTS, 10, 260, shape), null);
});

test('a positioned list is as tall as its rows and gaps together', () => {
  // a 100, gap 10, b 40, gap 10, c 40
  assert.equal(journeyContentHeight(ORDER, HEIGHTS, GAP), 200);
  // Rearranging cannot change how tall the list is, which is what lets the box
  // stay put while the rows move inside it.
  assert.equal(journeyContentHeight(['c', 'a', 'b'], HEIGHTS, GAP), 200);
  assert.equal(journeyContentHeight(['a'], HEIGHTS, GAP), 100);
  // A row that has mounted but not been laid out has no height to add.
  assert.equal(journeyContentHeight(['a', 'd'], HEIGHTS, GAP), null);
  assert.equal(journeyContentHeight([], HEIGHTS, GAP), null);
});
