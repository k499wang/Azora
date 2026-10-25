import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { getAzoDeliveryState, getAzoMessageReadDelay, startAzoChatDelivery } from './azoChatDelivery';
import { AZO_CONVERSATION, chooseAzoReply, getAzoConversation } from './data/azoConversation';
import { runWhileVisible } from '../../lib/ui/runWhileVisible';

const maximumTranscriptMessages = AZO_CONVERSATION.reduce(
  (count, turn) => count + turn.messages.length + 1,
  1,
);

test('reading delays grow with visible text and stay within the reading limits', () => {
  const message = (text) => ({ id: 'test', kind: 'azo', text });
  assert.equal(getAzoMessageReadDelay(message('hi')), 1100);
  assert.equal(getAzoMessageReadDelay(message('  \n  ')), 1100);
  assert.ok(getAzoMessageReadDelay(message('a longer message needs more time to read')) > getAzoMessageReadDelay(message('hi')));
  assert.equal(getAzoMessageReadDelay(message('word '.repeat(100))), 3600);
  assert.equal(getAzoMessageReadDelay(message('  one   two\nthree  ')), 1100);
  assert.equal(
    getAzoMessageReadDelay(message('research shows **brief breathing** can help')),
    getAzoMessageReadDelay(message('research shows brief breathing can help')),
  );
});

test('user replies and missing messages get a short response delay', () => {
  assert.equal(getAzoMessageReadDelay({ id: 'reply', kind: 'reply', text: 'word '.repeat(100) }), 450);
  assert.equal(getAzoMessageReadDelay(), 450);
});

test('the delivery hook schedules each next message from the latest visible message length', () => {
  const source = ts.transpileModule(
    readFileSync(new URL('./useAzoChatDelivery.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const pending = new Map();
  const delays = [];
  let nextTimer = 0;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    setTimeout(callback, delay) {
      const timer = ++nextTimer;
      pending.set(timer, callback);
      delays.push(delay);
      return timer;
    },
    clearTimeout: (timer) => pending.delete(timer),
    require(name) {
      if (name === 'react') return {
        useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
        useRef: (current) => ({ current }),
        useEffect: () => {},
      };
      if (name === 'react-native-reanimated') return { useReducedMotion: () => false };
      if (name === '../../hooks/useWhileVisible') return { useWhileVisible: (start) => start() };
      if (name === '../../theme/motion') return { duration: { beat: 300 } };
      if (name === './azoChatDelivery') return { getAzoDeliveryState, getAzoMessageReadDelay, startAzoChatDelivery };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const conversation = getAzoConversation([]);
  exports.useAzoChatDelivery(conversation, () => assert.fail());
  for (let visibleIndex = 0; visibleIndex < conversation.messages.length - 1; visibleIndex += 1) {
    assert.equal(pending.size, 1);
    assert.equal(delays[visibleIndex], getAzoMessageReadDelay(conversation.messages[visibleIndex]));
    const [timer, deliver] = pending.entries().next().value;
    pending.delete(timer);
    deliver();
  }
  assert.ok(delays[1] > delays[0], 'the longer second bubble has more reading time');
  assert.equal(pending.size, 0);
});

function createClock() {
  let id = 0;
  const pending = new Map();
  return {
    pending,
    schedule(callback) {
      const timer = ++id;
      pending.set(timer, callback);
      return () => pending.delete(timer);
    },
    tick() {
      const next = pending.entries().next().value;
      if (!next) return;
      pending.delete(next[0]);
      next[1]();
    },
    drain() {
      while (pending.size > 0) this.tick();
    },
  };
}

test('a fresh chat reveals one message first, and choices wait for the delivered group', () => {
  const conversation = getAzoConversation([]);
  const state = getAzoDeliveryState(conversation);
  assert.equal(state.visibleCount, 1);
  assert.equal(state.animateFrom, 0);
  const clock = createClock();
  const delivered = [];
  startAzoChatDelivery({
    ...state,
    finishing: false,
    onMessage: (count) => delivered.push(count),
    onFinish: () => assert.fail('the opening must not continue to personalization'),
    schedule: clock.schedule,
  });
  assert.equal(delivered.length, 0);
  clock.tick();
  assert.deepEqual(delivered, [2]);
  assert.equal(clock.pending.size, 1);
  clock.drain();
  assert.equal(delivered.at(-1), conversation.messages.length);
  assert.equal(clock.pending.size, 0);
});

test('a selected reply appears immediately and only the new incoming group is scheduled', () => {
  const first = getAzoConversation([]);
  const delivered = { ...getAzoDeliveryState(first), visibleCount: first.messages.length };
  const next = getAzoConversation(chooseAzoReply([], 'help'));
  const state = getAzoDeliveryState(next, delivered);
  assert.equal(state.visibleCount, first.messages.length + 1);
  assert.equal(next.messages[state.visibleCount - 1].kind, 'reply');
  assert.equal(state.animateFrom, first.messages.length);
  assert.ok(state.visibleCount < state.messageCount);
});

test('Back and remount restore reached messages without replaying their entrances', () => {
  const answers = ['help', 'recognize', 'start', 'tasksHelp', 'next', 'show'];
  const room = getAzoConversation(answers);
  const partial = { ...getAzoDeliveryState(room), visibleCount: room.messages.length - 1 };
  const back = getAzoDeliveryState(getAzoConversation(answers.slice(0, -1)), partial);
  assert.equal(back.visibleCount, back.messageCount);
  assert.equal(back.animateFrom, back.messageCount);
  const intermediate = getAzoConversation(answers.slice(0, -2));
  const backToChoice = getAzoDeliveryState(intermediate, back);
  assert.equal(backToChoice.visibleCount, intermediate.messages.length);
  assert.equal(backToChoice.animateFrom, intermediate.messages.length);
  const restoredDailyPlan = getAzoDeliveryState(getAzoConversation(answers.slice(0, -1)));
  assert.equal(restoredDailyPlan.visibleCount, restoredDailyPlan.messageCount);
  assert.equal(restoredDailyPlan.animateFrom, restoredDailyPlan.messageCount);
  const restored = getAzoDeliveryState(getAzoConversation([...answers, 'makePlan']));
  assert.equal(restored.visibleCount, restored.messageCount);
  assert.equal(restored.animateFrom, restored.messageCount);
});

test('visibility pauses the clock and resumes from the last delivered message', () => {
  const clock = createClock();
  let visible = true;
  let notify;
  let count = 1;
  const deliveries = [];
  const stop = runWhileVisible(() => startAzoChatDelivery({
    visibleCount: count,
    messageCount: 5,
    finishing: false,
    onMessage: (nextCount) => { count = nextCount; deliveries.push(count); },
    onFinish: () => assert.fail(),
    schedule: clock.schedule,
  }), {
    isVisible: () => visible,
    subscribe: (listener) => { notify = listener; return () => {}; },
  });
  clock.tick();
  assert.equal(count, 2);
  const staleCallback = [...clock.pending.values()][0];
  visible = false;
  notify();
  assert.equal(clock.pending.size, 0);
  staleCallback();
  assert.equal(count, 2);
  visible = true;
  notify();
  clock.drain();
  assert.deepEqual(deliveries, [2, 3, 4, 5]);
  stop();
  assert.equal(clock.pending.size, 0);
});

test('the final reply gets one beat, and Back cancels even a queued continuation', () => {
  const clock = createClock();
  let continued = 0;
  const stop = startAzoChatDelivery({
    visibleCount: 27,
    messageCount: 27,
    finishing: true,
    onMessage: () => assert.fail(),
    onFinish: () => { continued += 1; },
    schedule: clock.schedule,
  });
  assert.equal(continued, 0);
  const callback = [...clock.pending.values()][0];
  stop();
  callback();
  clock.drain();
  assert.equal(continued, 0);

  startAzoChatDelivery({
    visibleCount: 27,
    messageCount: 27,
    finishing: true,
    onMessage: () => assert.fail(),
    onFinish: () => { continued += 1; },
    schedule: clock.schedule,
  });
  clock.tick();
  clock.drain();
  assert.equal(continued, 1);
});

test('parent answer changes, Back, and visibility remain bounded across ten conversations', () => {
  const clock = createClock();
  let continued = 0;
  for (let cycle = 0; cycle < 10; cycle += 1) {
    let answers = [];
    let state = getAzoDeliveryState(getAzoConversation(answers));
    let visible = true;
    let notify;
    let dispose = () => {};

    const ownDelivery = (finishing = false) => {
      dispose();
      dispose = runWhileVisible(() => startAzoChatDelivery({
        ...state,
        finishing,
        onMessage: (visibleCount) => { state = { ...state, visibleCount }; },
        onFinish: () => { continued += 1; },
        schedule: clock.schedule,
      }), {
        isVisible: () => visible,
        subscribe: (listener) => { notify = listener; return () => {}; },
      });
    };
    ownDelivery();
    clock.drain();
    for (const id of ['help', cycle % 2 === 0 ? 'recognize' : 'sometimes', 'start', 'tasksHelp', 'next', 'show']) {
      assert.equal(state.visibleCount, state.messageCount);
      answers = chooseAzoReply(answers, id);
      state = getAzoDeliveryState(getAzoConversation(answers), state);
      ownDelivery();
      clock.tick();
      visible = false;
      notify();
      assert.equal(clock.pending.size, 0);
      visible = true;
      notify();
      clock.drain();
    }

    answers = chooseAzoReply(answers, 'makePlan');
    state = getAzoDeliveryState(getAzoConversation(answers), state);
    assert.equal(state.visibleCount, state.messageCount);
    ownDelivery(true);
    const abandonedFinish = [...clock.pending.values()][0];
    answers = answers.slice(0, -1);
    state = getAzoDeliveryState(getAzoConversation(answers), state);
    ownDelivery();
    abandonedFinish();
    assert.equal(continued, cycle);

    answers = chooseAzoReply(answers, 'makePlan');
    state = getAzoDeliveryState(getAzoConversation(answers), state);
    ownDelivery(true);
    clock.drain();
    assert.equal(continued, cycle + 1);
    dispose();
    assert.equal(clock.pending.size, 0);
    assert.ok(state.messageCount <= maximumTranscriptMessages);
  }
});
