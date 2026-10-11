import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROGRAM_SLOT_ORDER,
  programSlotAt,
} from './programSchedule.ts';
test('each position in the day takes its own hour, in order', () => {
  assert.deepEqual(PROGRAM_SLOT_ORDER, ['session', 'handPicked', 'windDown']);
  assert.equal(programSlotAt(0), 'session');
  assert.equal(programSlotAt(2), 'windDown');
  assert.equal(programSlotAt(3), null);
});
