import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonPages, splitLessonProse } from './lessonPages.ts';

const wordCount = (text) => text.replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;

test('splits at sentence boundaries and keeps prose in order', () => {
  const text = 'First idea has five clear words. Second idea is also easy to read. Third idea finishes this thought.';
  const pages = splitLessonProse(text, 9);
  assert.deepEqual(pages, [
    'First idea has five clear words.',
    'Second idea is also easy to read.',
    'Third idea finishes this thought.',
  ]);
  assert.ok(pages.every((page) => wordCount(page) <= 9));
});

test('preserves emphasis when a long sentence must be divided', () => {
  const text = 'Please **notice the small signal and give yourself a little time** before you decide what to do next.';
  const pages = splitLessonProse(text, 6);
  assert.ok(pages.every((page) => wordCount(page) <= 6));
  assert.ok(pages.every((page) => (page.match(/\*\*/g) ?? []).length % 2 === 0));
  assert.equal(pages.join(' ').replace(/\*\*/g, ''), text.replace(/\*\*/g, ''));
});

test('keeps punctuation attached to emphasized words', () => {
  const text = 'You feel **sleepy again**. That is a useful signal. Pause and notice **what changed**.';
  const pages = splitLessonProse(text, 9);
  assert.deepEqual(pages, [
    'You feel **sleepy again**. That is a useful signal.',
    'Pause and notice **what changed**.',
  ]);
  assert.equal(pages.join(' '), text);
});

test('merges adjacent prose and balances sentence groups', () => {
  const blocks = [
    { kind: 'text', text: 'One two three four five six seven eight nine ten.' },
    { kind: 'text', text: 'Eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty.' },
    { kind: 'text', text: 'Twenty one twenty two twenty three twenty four.' },
  ];
  const pages = lessonPages(blocks, 18);
  assert.equal(pages.length, 2);
  assert.deepEqual(pages.map((page) => wordCount(page.text)), [10, 18]);
});

test('preserves interactive blocks and keeps the closing action intact', () => {
  const choice = { kind: 'choice', prompt: 'What would you try?', options: [{ label: 'A', feedback: 'Try A.' }] };
  const blocks = [
    { kind: 'text', text: 'One clear sentence. Another clear sentence.' },
    choice,
    { kind: 'do', text: 'Notice your next pause. Write one thing you could try. Keep it small.' },
  ];
  const pages = lessonPages(blocks, 5);
  assert.equal(pages.filter((page) => page.kind === 'choice')[0], choice);
  assert.equal(pages.filter((page) => page.kind === 'do').length, 1);
  assert.equal(pages.at(-1), blocks.at(-1));
  assert.ok(pages.filter((page) => page.kind === 'text').every((page) => wordCount(page.text) <= 5));
});
