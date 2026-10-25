import assert from 'node:assert/strict';
import test from 'node:test';
import { AZO_CONVERSATION, chooseAzoReply, getAzoConversation, splitEmphasis } from './azoConversation';

const maximumTranscriptMessages = AZO_CONVERSATION.reduce(
  (count, turn) => count + turn.messages.length + 1,
  1,
);

test('a choice must belong to the active turn and repeated taps cannot skip ahead', () => {
  assert.equal(chooseAzoReply([], 'makePlan'), undefined);
  assert.equal(chooseAzoReply([], 'recognize'), undefined);
  const moved = chooseAzoReply([], 'help');
  assert.deepEqual(moved, ['help']);
  assert.equal(chooseAzoReply(moved, 'welcome'), undefined);
  const first = chooseAzoReply(moved, 'recognize');
  assert.deepEqual(first, ['help', 'recognize']);
  assert.equal(chooseAzoReply(first, 'recognize'), undefined);
  assert.equal(chooseAzoReply(first, 'sometimes'), undefined);
  const plan = chooseAzoReply(first, 'start');
  assert.deepEqual(plan, ['help', 'recognize', 'start']);
  assert.equal(chooseAzoReply(plan, 'show'), undefined);
  assert.equal(chooseAzoReply(plan, 'makePlan'), undefined);
  assert.equal(chooseAzoReply(plan, 'next'), undefined);
  const tools = chooseAzoReply(plan, 'tasksHelp');
  assert.deepEqual(tools, [...plan, 'tasksHelp']);
  assert.equal(chooseAzoReply(tools, 'tasksHelp'), undefined);
  assert.equal(chooseAzoReply(tools, 'show'), undefined);
  const dailyPlan = chooseAzoReply(tools, 'next');
  assert.deepEqual(dailyPlan, [...tools, 'next']);
  assert.equal(chooseAzoReply(dailyPlan, 'next'), undefined);
  assert.equal(chooseAzoReply(dailyPlan, 'makePlan'), undefined);
});

test('all recognition replies reach the plan and room without losing selected messages', () => {
  for (const first of AZO_CONVERSATION[1].replies) {
    {
      let answers = [];
      for (const id of ['welcome', first.id, 'start', 'tasksHelp', 'next', 'show', 'makePlan']) {
        answers = chooseAzoReply(answers, id);
        assert.ok(answers);
      }
      const conversation = getAzoConversation(answers);
      assert.equal(conversation.complete, true);
      assert.equal(conversation.replies.length, 0);
      assert.equal(conversation.messages.filter(({ kind }) => kind === 'reply').length, 7);
      assert.ok(conversation.messages.some(({ id }) => id === 'tools-0'));
      assert.ok(conversation.messages.some(({ id }) => id === 'dailyPlan-0'));
      assert.ok(conversation.messages.some(({ id }) => id === 'room-0'));
      assert.equal(conversation.messages.at(-1).text, 'Let’s make my plan.');
      assert.equal(chooseAzoReply(answers, 'makePlan'), undefined);
    }
  }
});

test('sometimes gets an acknowledgment that respects the user’s answer', () => {
  const conversation = getAzoConversation(['help', 'sometimes']);
  const acknowledgment = conversation.messages.find(({ id }) => id === 'acknowledgment');
  assert.equal(acknowledgment.text, 'Even when it happens only sometimes, it can still be difficult.');
});

test('Back removes a turn and a different answer replaces the abandoned branch', () => {
  const answers = ['help', 'recognize', 'start', 'tasksHelp', 'next', 'show'];
  const beforeRoom = getAzoConversation(answers.slice(0, -1));
  assert.equal(beforeRoom.replies[0].id, 'show');
  assert.ok(!beforeRoom.messages.some(({ id }) => id === 'room-0'));
  const beforeDailyPlan = getAzoConversation(answers.slice(0, -2));
  assert.equal(beforeDailyPlan.replies[0].id, 'next');
  assert.ok(!beforeDailyPlan.messages.some(({ id }) => id === 'dailyPlan-0'));
  const beforeTools = getAzoConversation(answers.slice(0, -3));
  assert.deepEqual(beforeTools.replies.map(({ id }) => id), ['tasksHelp']);
  assert.ok(!beforeTools.messages.some(({ id }) => id === 'tools-0'));
  const changed = getAzoConversation(chooseAzoReply(['help'], 'sometimes'));
  assert.equal(changed.messages.filter(({ kind }) => kind === 'reply').length, 2);
  assert.equal(changed.messages.findLast(({ kind }) => kind === 'reply').text, 'Sometimes, yes.');
});

test('restored answers retain a valid prefix and transcript size stays bounded', () => {
  const malformed = getAzoConversation(['help', 'recognize', 'makePlan', 'show']);
  assert.deepEqual(malformed.answers, ['help', 'recognize']);
  assert.equal(malformed.replies[0].id, 'start');
  const missingIntermediate = getAzoConversation(['help', 'recognize', 'start', 'next', 'show', 'makePlan']);
  assert.deepEqual(missingIntermediate.answers, ['help', 'recognize', 'start']);
  assert.deepEqual(missingIntermediate.replies.map(({ id }) => id), ['tasksHelp']);
  const completed = ['help', 'recognize', 'start', 'tasksHelp', 'next', 'show', 'makePlan'];
  assert.deepEqual(getAzoConversation([...completed, ...Array(100).fill('show')]), getAzoConversation(completed));
  assert.ok(getAzoConversation(completed).messages.length <= maximumTranscriptMessages);
});

test('ten complete, back, and restart cycles keep a bounded transcript and correct active turn', () => {
  let answers = [];
  for (let cycle = 0; cycle < 10; cycle += 1) {
    const firstReply = cycle % 2 === 0 ? 'recognize' : 'sometimes';
    for (const id of ['help', firstReply, 'start', 'tasksHelp', 'next', 'show', 'makePlan']) {
      answers = chooseAzoReply(answers, id);
      assert.ok(answers);
    }
    const complete = getAzoConversation(answers);
    assert.equal(complete.complete, true);
    assert.ok(complete.messages.length <= maximumTranscriptMessages);

    answers = answers.slice(0, -1);
    assert.equal(getAzoConversation(answers).replies[0].id, 'makePlan');
    assert.ok(!getAzoConversation(answers).messages.some(({ id }) => id === 'room-reply'));

    while (answers.length > 0) answers = answers.slice(0, -1);
    const restarted = getAzoConversation(answers);
    assert.equal(restarted.replies[0].id, 'help');
    assert.equal(restarted.messages.filter(({ kind }) => kind === 'reply').length, 0);
    assert.ok(!restarted.messages.some(({ id }) => id === 'room-0'));
  }
});

test('emphasis markup splits into plain and emphasized runs', () => {
  assert.deepEqual(splitEmphasis('you’d be joining **50,000+ people** today.'), [
    { text: 'you’d be joining ', emphasis: false },
    { text: '50,000+ people', emphasis: true },
    { text: ' today.', emphasis: false },
  ]);
  assert.deepEqual(splitEmphasis('**all of it**'), [{ text: 'all of it', emphasis: true }]);
  assert.deepEqual(splitEmphasis('none'), [{ text: 'none', emphasis: false }]);
});

test('every authored line closes its emphasis', () => {
  for (const turn of AZO_CONVERSATION) {
    for (const line of turn.messages) assert.equal(line.split('**').length % 2, 1, line);
  }
});

