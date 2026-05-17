import test from 'node:test';
import assert from 'node:assert/strict';
import { createSerializedAsync } from './serializedAsync.ts';

function defer() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test('runs a single task and returns its result', async () => {
  const serializer = createSerializedAsync();
  const result = await serializer.run(async () => 42);
  assert.equal(result, 42);
});

test('serializes overlapping tasks: second waits for the first to settle', async () => {
  const serializer = createSerializedAsync();
  const events = [];

  const first = defer();
  const second = defer();

  const a = serializer.run(async () => {
    events.push('a:start');
    await first.promise;
    events.push('a:end');
    return 'a';
  });

  const b = serializer.run(async () => {
    events.push('b:start');
    await second.promise;
    events.push('b:end');
    return 'b';
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ['a:start']);

  first.resolve();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ['a:start', 'a:end', 'b:start']);

  second.resolve();
  const [aResult, bResult] = await Promise.all([a, b]);
  assert.equal(aResult, 'a');
  assert.equal(bResult, 'b');
  assert.deepEqual(events, ['a:start', 'a:end', 'b:start', 'b:end']);
});

test('a rejected task does not block subsequent tasks', async () => {
  const serializer = createSerializedAsync();
  const events = [];

  const failing = serializer.run(async () => {
    events.push('fail:start');
    throw new Error('boom');
  });

  const next = serializer.run(async () => {
    events.push('next:start');
    return 'ok';
  });

  await assert.rejects(failing, /boom/);
  const result = await next;
  assert.equal(result, 'ok');
  assert.deepEqual(events, ['fail:start', 'next:start']);
});

test('many tasks run strictly one at a time in submission order', async () => {
  const serializer = createSerializedAsync();
  let active = 0;
  let maxActive = 0;
  const order = [];

  const tasks = Array.from({ length: 10 }, (_, index) =>
    serializer.run(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setImmediate(resolve));
      order.push(index);
      active -= 1;
      return index;
    }),
  );

  const results = await Promise.all(tasks);
  assert.equal(maxActive, 1);
  assert.deepEqual(order, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(results, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('a task submitted after the queue drains starts immediately', async () => {
  const serializer = createSerializedAsync();
  await serializer.run(async () => 'first');

  const start = Date.now();
  const result = await serializer.run(async () => 'second');
  assert.equal(result, 'second');
  assert.ok(Date.now() - start < 50);
});
