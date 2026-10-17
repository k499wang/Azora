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
  tagline: 'Your mind gets loudest right when you want to sleep.',
  planName: 'Sleep Restoration',
  changes: ['A short wind-down tells your mind the day is done.', 'Better nights make the days feel lighter.'],
  planPromise: 'Quieter nights, and sleep that comes sooner.',
  futureName: 'The Sound Sleeper',
  dayCount: 28,
};

test('the letter is addressed and signed with the first word of the name', () => {
  assert.equal(firstNameOf('  Maya   Rose '), 'Maya');
  const letter = buildFutureSelfLetter(base);
  assert.equal(letter.heading, 'Maya, do you copy?');
  assert.match(letter.paragraphs[0].text, /^It's me, future Maya!/);
  assert.equal(letter.signOff, 'See you soon,\nFuture Maya');
});

test('a missing or blank name falls back to you', () => {
  for (const displayName of [null, undefined, '', '   ']) {
    const letter = buildFutureSelfLetter({ ...base, displayName });
    assert.equal(letter.heading, 'Hey, do you copy?');
    assert.match(letter.paragraphs[0].text, /^It's me, future you!/);
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
  assert.match(letter.paragraphs[0].text, /calling from October 2027 with the best news/);
  assert.deepEqual(letter.paragraphs[1], {
    text: 'Saturday, October 17, 2026 is the day we started our Life Reset Plan.',
    emphasis: true,
  });
});

test('the letter remembers where they are, then tells them who they became', () => {
  const texts = buildFutureSelfLetter(base).paragraphs.map(({ text }) => text);
  assert.equal(
    texts[2],
    "I remember exactly where you are right now. Your mind gets loudest right when you want to sleep. It's okay. That's just where our story starts.",
  );
  assert.equal(
    texts[3],
    "And now? I'm the Sound Sleeper. Quieter nights, and sleep that comes sooner. That's just our life.",
  );
  const bare = buildFutureSelfLetter({ ...base, planPromise: 'Calmer days' });
  assert.match(bare.paragraphs[3].text, /Calmer days\. That's/);
});

test('the plan changes are listed one per line under its name', () => {
  const texts = buildFutureSelfLetter(base).paragraphs.map(({ text }) => text);
  assert.match(texts[4], /Sleep Restoration did it one tiny step at a time\./);
  assert.equal(texts[5], '\u2022 A short wind-down tells your mind the day is done.');
  assert.equal(texts[6], '\u2022 Better nights make the days feel lighter.');
});

test('without an archetype only the plan-agnostic paragraphs remain', () => {
  const letter = buildFutureSelfLetter({
    ...base,
    tagline: undefined,
    planName: undefined,
    changes: undefined,
    planPromise: undefined,
    futureName: undefined,
  });
  assert.equal(letter.paragraphs.length, 5);
  assert.ok(letter.paragraphs.every(({ text }) => !text.includes('And now?')));
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
  assert.ok(letter.paragraphs.some(({ text }) => text === "Forty-two days of tiny steps. That's all it took."));
});

test('every plan archetype builds a full letter', () => {
  for (const [planId, archetype] of Object.entries(ARCHETYPE_FOR_PLAN)) {
    const letter = buildFutureSelfLetter({ ...base, ...archetype });
    assert.ok(letter.paragraphs.some(({ text }) => text.startsWith('And now?')), planId);
    assert.ok(letter.paragraphs.some(({ text }) => text.startsWith('I remember')), planId);
    assert.equal(letter.paragraphs.filter(({ text }) => text.startsWith('\u2022 ')).length, archetype.changes.length, planId);
    for (const { text } of letter.paragraphs) assert.doesNotMatch(text, /\.\.|I'm The /, planId);
  }
});
