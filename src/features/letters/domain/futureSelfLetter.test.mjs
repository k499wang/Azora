import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFutureSelfLetter,
  dayCountInWords,
  firstNameOf,
  formatLetterCallingFrom,
  formatLetterStartDate,
} from './futureSelfLetter.ts';
import { ARCHETYPE_FOR_PLAN } from '../../../lib/onboardingArchetype.ts';

const base = {
  displayName: 'Maya Rose Chen',
  startLocalDate: '2026-10-17',
  planPromise: 'Quieter nights, and sleep that comes sooner.',
  futureName: 'The Sound Sleeper',
  dayCount: 28,
};

test('the letter is addressed and signed with the first word of the name', () => {
  assert.equal(firstNameOf('  Maya   Rose '), 'Maya');
  const letter = buildFutureSelfLetter(base);
  assert.equal(letter.heading, 'Maya, do you copy?');
  assert.match(letter.paragraphs[0].text, /^It's me, future Maya\./);
  assert.equal(letter.signOff, 'See you soon,\nFuture Maya');
});

test('a missing or blank name falls back to you', () => {
  for (const displayName of [null, undefined, '', '   ']) {
    const letter = buildFutureSelfLetter({ ...base, displayName });
    assert.equal(letter.heading, 'Hey, do you copy?');
    assert.match(letter.paragraphs[0].text, /^It's me, future you\./);
    assert.equal(letter.signOff, 'See you soon,\nFuture you');
  }
});

test('the start date is a local calendar date and the call comes a year later', () => {
  assert.equal(formatLetterStartDate('2026-10-17'), 'Saturday, October 17, 2026');
  assert.equal(formatLetterStartDate('2027-01-01'), 'Friday, January 1, 2027');
  assert.equal(formatLetterCallingFrom('2026-10-17'), 'October 2027');
  assert.equal(formatLetterCallingFrom('2026-12-31'), 'December 2027');
  assert.equal(formatLetterCallingFrom('2028-02-29'), 'February 2029');

  const letter = buildFutureSelfLetter(base);
  assert.match(letter.paragraphs[0].text, /calling from October 2027, because/);
  assert.deepEqual(letter.paragraphs[1], {
    text: 'Saturday, October 17, 2026 is the day we started our Life Reset Plan.',
    emphasis: true,
  });
});

test('the great-news line names who they became, then the promise', () => {
  const letter = buildFutureSelfLetter(base);
  assert.equal(
    letter.paragraphs[2].text,
    "I have great news. I'm the Sound Sleeper now. Quieter nights, and sleep that comes sooner. That's just our life.",
  );
  const bare = buildFutureSelfLetter({ ...base, planPromise: 'Calmer days' });
  assert.match(bare.paragraphs[2].text, /Calmer days\. That's/);
});

test('without an archetype the great-news paragraph is dropped', () => {
  const letter = buildFutureSelfLetter({ ...base, planPromise: undefined, futureName: undefined });
  assert.equal(letter.paragraphs.length, 4);
  assert.ok(letter.paragraphs.every(({ text }) => !text.includes('great news')));
});

test('plan lengths are spelled out, unknown ones stay digits', () => {
  assert.equal(dayCountInWords(21), 'Twenty-one');
  assert.equal(dayCountInWords(28), 'Twenty-eight');
  assert.equal(dayCountInWords(30), 'Thirty');
  assert.equal(dayCountInWords(42), 'Forty-two');
  assert.equal(dayCountInWords(56), 'Fifty-six');
  assert.equal(dayCountInWords(84), 'Eighty-four');
  assert.equal(dayCountInWords(35), '35');
  const letter = buildFutureSelfLetter({ ...base, dayCount: 42 });
  assert.match(letter.paragraphs[3].text, /Forty-two days of them, with Azo/);
});

test('every plan archetype builds a great-news line', () => {
  for (const [planId, archetype] of Object.entries(ARCHETYPE_FOR_PLAN)) {
    const letter = buildFutureSelfLetter({ ...base, ...archetype });
    const line = letter.paragraphs.find(({ text }) => text.startsWith('I have great news.'));
    assert.ok(line, planId);
    assert.doesNotMatch(line.text, /\.\.|I'm The /);
  }
});
