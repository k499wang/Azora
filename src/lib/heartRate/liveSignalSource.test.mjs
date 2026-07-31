import assert from 'node:assert/strict';
import test from 'node:test';
import { createLiveSignalSource } from './liveSignalSource.ts';

test('live signal source keeps the latest graph snapshot', () => {
  const source = createLiveSignalSource();
  const samples = [{ timestamp: 100, value: 1.25 }];

  source.publish(samples);

  assert.equal(source.read(), samples);
});

test('live signal source clears without replacing the stable source', () => {
  const source = createLiveSignalSource();
  source.publish([{ timestamp: 100, value: 1.25 }]);

  source.clear();

  assert.deepEqual(source.read(), []);
});
