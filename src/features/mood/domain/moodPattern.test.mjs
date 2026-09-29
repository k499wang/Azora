import assert from 'node:assert/strict';
import test from 'node:test';
import { moodPatternLine } from './moodPattern';

const day = (n, score, tags = []) => ({
  localDate: `2026-09-${String(n).padStart(2, '0')}`,
  score,
  tags,
});

// Ten days at 50, four of them tagged work at 0 and four tagged walk at 100.
const history = [
  ...[1, 2, 3, 4].map((n) => day(n, 0, ['work'])),
  ...[5, 6, 7, 8].map((n) => day(n, 100, ['walk'])),
  day(9, 50),
  day(10, 50),
].reverse();

test('says which way a tag chosen today runs for this person', () => {
  assert.equal(
    moodPatternLine(history, day(20, 50, ['walk'])),
    'You tend to feel better on days tagged Walk.',
  );
  assert.equal(
    moodPatternLine(history, day(20, 50, ['work'])),
    'Days tagged Work tend to be harder for you.',
  );
});

test('picks the strongest of the tags chosen today, better or harder', () => {
  const skewed = [...history, day(11, 0, ['walk'])];
  // Walk is now weaker than Work, so Work speaks.
  assert.match(
    moodPatternLine(skewed, day(20, 0, ['walk', 'work'])),
    /Work/,
  );
});

test('only speaks about tags chosen today', () => {
  assert.equal(moodPatternLine(history, day(20, 50, ['travel'])), null);
  assert.equal(moodPatternLine(history, day(20, 50)), null);
});

test('says nothing before the run has loaded, or on thin data', () => {
  assert.equal(moodPatternLine(null, day(20, 50, ['walk'])), null);
  assert.equal(
    moodPatternLine(history.slice(0, 2), day(20, 50, ['work'])),
    null,
  );
});

test("today's answers replace today's stored row rather than count twice", () => {
  // Four days in all once today is replaced, which is too few to speak on.
  // Counted twice, today would make five and a fourth Walk day.
  const stored = [
    day(20, 100, ['walk']),
    day(19, 100, ['walk']),
    day(18, 100, ['walk']),
    day(17, 0),
  ];
  assert.equal(moodPatternLine(stored, day(20, 100, ['walk'])), null);
});
