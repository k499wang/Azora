import assert from 'node:assert/strict';
import test from 'node:test';
import { AZO_CONVERSATION, chooseAzoReply, getAzoConversation } from './azoConversation';

test('a choice must belong to the active turn and repeated taps cannot skip ahead', () => {
  assert.equal(chooseAzoReply([], 'makePlan'), undefined);
  const first = chooseAzoReply([], 'recognize');
  assert.deepEqual(first, ['recognize']);
  assert.equal(chooseAzoReply(first, 'recognize'), undefined);
  assert.equal(chooseAzoReply(first, 'sometimes'), undefined);
  assert.deepEqual(chooseAzoReply(first, 'start'), ['recognize', 'start']);
});

test('all recognition replies reach the plan and room without losing selected messages', () => {
  for (const first of AZO_CONVERSATION[0].replies) {
    let answers = [];
    for (const id of [first.id, 'start', 'show', 'makePlan']) {
      answers = chooseAzoReply(answers, id);
      assert.ok(answers);
    }
    const conversation = getAzoConversation(answers);
    assert.equal(conversation.complete, true);
    assert.equal(conversation.replies.length, 0);
    assert.equal(conversation.messages.filter(({ kind }) => kind === 'reply').length, 4);
    assert.equal(conversation.messages.filter(({ kind }) => kind === 'room').length, 1);
    assert.equal(conversation.messages.at(-1).text, 'let’s make my plan');
    assert.equal(chooseAzoReply(answers, 'makePlan'), undefined);
  }
});

test('sometimes gets an acknowledgment that respects the user’s answer', () => {
  const conversation = getAzoConversation(['sometimes']);
  const acknowledgment = conversation.messages.find(({ id }) => id === 'acknowledgment');
  assert.equal(acknowledgment.text, 'even if it only happens sometimes.');
});

test('Back removes a turn and a different answer replaces the abandoned branch', () => {
  const answers = ['recognize', 'start', 'show'];
  const beforeRoom = getAzoConversation(answers.slice(0, -1));
  assert.equal(beforeRoom.replies[0].id, 'show');
  assert.ok(!beforeRoom.messages.some(({ kind }) => kind === 'room'));
  const changed = getAzoConversation(chooseAzoReply([], 'sometimes'));
  assert.equal(changed.messages.filter(({ kind }) => kind === 'reply').length, 1);
  assert.equal(changed.messages.find(({ kind }) => kind === 'reply').text, 'sometimes');
});

test('restored answers retain a valid prefix and transcript size stays bounded', () => {
  const malformed = getAzoConversation(['recognize', 'makePlan', 'show']);
  assert.deepEqual(malformed.answers, ['recognize']);
  assert.equal(malformed.replies[0].id, 'start');
  const completed = ['recognize', 'start', 'show', 'makePlan'];
  assert.deepEqual(getAzoConversation([...completed, ...Array(100).fill('show')]), getAzoConversation(completed));
  assert.ok(getAzoConversation(completed).messages.length < 32);
});

test('ten complete, back, and restart cycles keep a bounded transcript and correct active turn', () => {
  let answers = [];
  for (let cycle = 0; cycle < 10; cycle += 1) {
    const firstReply = cycle % 2 === 0 ? 'recognize' : 'sometimes';
    for (const id of [firstReply, 'start', 'show', 'makePlan']) {
      answers = chooseAzoReply(answers, id);
      assert.ok(answers);
    }
    const complete = getAzoConversation(answers);
    assert.equal(complete.complete, true);
    assert.ok(complete.messages.length < 32);

    answers = answers.slice(0, -1);
    assert.equal(getAzoConversation(answers).replies[0].id, 'makePlan');
    assert.ok(!getAzoConversation(answers).messages.some(({ id }) => id === 'room-reply'));

    while (answers.length > 0) answers = answers.slice(0, -1);
    const restarted = getAzoConversation(answers);
    assert.equal(restarted.replies[0].id, 'recognize');
    assert.equal(restarted.messages.filter(({ kind }) => kind === 'reply').length, 0);
    assert.ok(!restarted.messages.some(({ kind }) => kind === 'room'));
  }
});
