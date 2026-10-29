import assert from 'node:assert/strict';
import test from 'node:test';
import { AZO_CONVERSATION, chooseAzoReply, getAzoConversation, splitEmphasis } from './azoConversation';

const NAME = 'Sam';
const intro = ['named', 'tell'];
const get = (answers, turns = AZO_CONVERSATION) => getAzoConversation(answers, turns, NAME);
const choose = (answers, id, turns = AZO_CONVERSATION) => chooseAzoReply(answers, id, turns, NAME);

const maximumTranscriptMessages = AZO_CONVERSATION.reduce(
  (count, turn) => count + turn.messages.length + 1,
  2,
);

test('Azo asks for a name first, greets it, and the user can decline', () => {
  const opening = getAzoConversation([]);
  assert.deepEqual(opening.messages.map(({ text }) => text), ['Hi there! I’m Azo.', 'I’m so glad you’re here.', 'What should I call you? Just your first name is perfect.']);
  assert.equal(chooseAzoReply([], 'named', AZO_CONVERSATION, '  '), undefined);
  assert.deepEqual(getAzoConversation(['named', 'tell']).answers, []);
  const named = get(['named']);
  assert.equal(named.messages.find(({ id }) => id === 'name-reply').text, NAME);
  assert.equal(named.messages.find(({ id }) => id === 'greeting').text, 'Nice to meet you, Sam!');
  assert.equal(named.messages.at(-1).text, 'Can I tell you something?');
  const declined = getAzoConversation(chooseAzoReply([], 'unnamed'));
  assert.equal(declined.messages.find(({ id }) => id === 'greeting').text, 'That’s okay, nice to meet you!');
  assert.equal(get([...intro]).messages.find(({ id }) => id === 'moving-0').text, 'Two weeks ago, I moved into this room.');
});

test('a choice must belong to the active turn and repeated taps cannot skip ahead', () => {
  assert.equal(choose([], 'makePlan'), undefined);
  assert.equal(choose([], 'recognize'), undefined);
  const moved = choose(intro, 'help');
  assert.deepEqual(moved, [...intro, 'help']);
  assert.equal(choose(moved, 'welcome'), undefined);
  const first = choose(moved, 'recognize');
  assert.deepEqual(first, [...intro, 'help', 'recognize']);
  assert.equal(choose(first, 'recognize'), undefined);
  assert.equal(choose(first, 'sometimes'), undefined);
  const plan = choose(first, 'start');
  assert.deepEqual(plan, [...intro, 'help', 'recognize', 'start']);
  assert.equal(choose(plan, 'show'), undefined);
  assert.equal(choose(plan, 'makePlan'), undefined);
  assert.equal(choose(plan, 'next'), undefined);
  const tools = choose(plan, 'tasksHelp');
  assert.deepEqual(tools, [...plan, 'tasksHelp']);
  assert.equal(choose(tools, 'tasksHelp'), undefined);
  assert.equal(choose(tools, 'show'), undefined);
  const dailyPlan = choose(tools, 'next');
  assert.deepEqual(dailyPlan, [...tools, 'next']);
  assert.equal(choose(dailyPlan, 'next'), undefined);
  assert.equal(choose(dailyPlan, 'makePlan'), undefined);
});

test('all recognition replies reach the plan and room without losing selected messages', () => {
  for (const first of AZO_CONVERSATION[3].replies) {
    {
      let answers = [];
      for (const id of [...intro, 'welcome', first.id, 'start', 'tasksHelp', 'next', 'show', 'makePlan']) {
        answers = choose(answers, id);
        assert.ok(answers);
      }
      const conversation = get(answers);
      assert.equal(conversation.complete, true);
      assert.equal(conversation.replies.length, 0);
      assert.equal(conversation.messages.filter(({ kind }) => kind === 'reply').length, 9);
      assert.ok(conversation.messages.some(({ id }) => id === 'tools-0'));
      assert.ok(conversation.messages.some(({ id }) => id === 'dailyPlan-0'));
      assert.ok(conversation.messages.some(({ id }) => id === 'room-0'));
      assert.equal(conversation.messages.at(-1).text, 'Let’s make my plan.');
      assert.equal(choose(answers, 'makePlan'), undefined);
    }
  }
});

test('sometimes gets an acknowledgment that respects the user’s answer', () => {
  const conversation = get([...intro, 'help', 'sometimes']);
  const acknowledgment = conversation.messages.find(({ id }) => id === 'acknowledgment');
  assert.equal(acknowledgment.text, 'Even when it happens only sometimes, it can still be difficult.');
});

test('Back removes a turn and a different answer replaces the abandoned branch', () => {
  const answers = [...intro, 'help', 'recognize', 'start', 'tasksHelp', 'next', 'show'];
  const beforeRoom = get(answers.slice(0, -1));
  assert.equal(beforeRoom.replies[0].id, 'show');
  assert.ok(!beforeRoom.messages.some(({ id }) => id === 'room-0'));
  const beforeDailyPlan = get(answers.slice(0, -2));
  assert.equal(beforeDailyPlan.replies[0].id, 'next');
  assert.ok(!beforeDailyPlan.messages.some(({ id }) => id === 'dailyPlan-0'));
  const beforeTools = get(answers.slice(0, -3));
  assert.deepEqual(beforeTools.replies.map(({ id }) => id), ['tasksHelp']);
  assert.ok(!beforeTools.messages.some(({ id }) => id === 'tools-0'));
  const changed = get(choose([...intro, 'help'], 'sometimes'));
  assert.equal(changed.messages.filter(({ kind }) => kind === 'reply').length, 4);
  assert.equal(changed.messages.findLast(({ kind }) => kind === 'reply').text, 'Sometimes, yes.');
});

test('restored answers retain a valid prefix and transcript size stays bounded', () => {
  const malformed = get([...intro, 'help', 'recognize', 'makePlan', 'show']);
  assert.deepEqual(malformed.answers, [...intro, 'help', 'recognize']);
  assert.equal(malformed.replies[0].id, 'start');
  const missingIntermediate = get([...intro, 'help', 'recognize', 'start', 'next', 'show', 'makePlan']);
  assert.deepEqual(missingIntermediate.answers, [...intro, 'help', 'recognize', 'start']);
  assert.deepEqual(missingIntermediate.replies.map(({ id }) => id), ['tasksHelp']);
  const completed = [...intro, 'help', 'recognize', 'start', 'tasksHelp', 'next', 'show', 'makePlan'];
  assert.deepEqual(get([...completed, ...Array(100).fill('show')]), get(completed));
  assert.ok(get(completed).messages.length <= maximumTranscriptMessages);
});

test('ten complete, back, and restart cycles keep a bounded transcript and correct active turn', () => {
  let answers = [];
  for (let cycle = 0; cycle < 10; cycle += 1) {
    const firstReply = cycle % 2 === 0 ? 'recognize' : 'sometimes';
    for (const id of [...intro, 'help', firstReply, 'start', 'tasksHelp', 'next', 'show', 'makePlan']) {
      answers = choose(answers, id);
      assert.ok(answers);
    }
    const complete = get(answers);
    assert.equal(complete.complete, true);
    assert.ok(complete.messages.length <= maximumTranscriptMessages);

    answers = answers.slice(0, -1);
    assert.equal(get(answers).replies[0].id, 'makePlan');
    assert.ok(!get(answers).messages.some(({ id }) => id === 'room-reply'));

    while (answers.length > 0) answers = answers.slice(0, -1);
    const restarted = get(answers);
    assert.equal(restarted.replies[0].id, 'named');
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


test('the cleaning opening keeps every turn and reply id of the default, so it completes the same way', async () => {
  const { CLEANING_AZO_CONVERSATION } = await import('./azoConversation');
  assert.deepEqual(
    CLEANING_AZO_CONVERSATION.map(({ id, replies }) => [id, replies.map((reply) => reply.id)]),
    AZO_CONVERSATION.map(({ id, replies }) => [id, replies.map((reply) => reply.id)]),
  );
  let answers = [];
  for (const turn of CLEANING_AZO_CONVERSATION) {
    answers = choose(answers, turn.replies[0].id, CLEANING_AZO_CONVERSATION);
  }
  const done = get(answers, CLEANING_AZO_CONVERSATION);
  assert.equal(done.complete, true);
  assert.ok(done.messages.some(({ text }) => text.includes('**AI tools** made for cleaning')));
});
