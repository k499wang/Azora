import assert from 'node:assert/strict';
import test from 'node:test';
import { selfCareGoalExistedOnLocalDate } from './selfCareGoalDate.ts';

test('evening additions remain visible when UTC has already advanced to tomorrow', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'America/Toronto';
  try {
    assert.equal(selfCareGoalExistedOnLocalDate({
      created_at: '2026-09-21T02:30:00Z', archived_at: null,
    }, '2026-09-20'), true);
    assert.equal(selfCareGoalExistedOnLocalDate({
      created_at: '2026-09-21T04:00:00Z', archived_at: null,
    }, '2026-09-20'), false);
    assert.equal(selfCareGoalExistedOnLocalDate({
      created_at: '2026-09-20T12:00:00Z', archived_at: '2026-09-21T02:30:00Z',
    }, '2026-09-20'), false);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('positive-offset local dates do not include tomorrow’s additions', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Asia/Tokyo';
  try {
    assert.equal(selfCareGoalExistedOnLocalDate({
      created_at: '2026-09-20T15:01:00Z', archived_at: null,
    }, '2026-09-20'), false);
    assert.equal(selfCareGoalExistedOnLocalDate({
      created_at: '2026-09-19T15:01:00Z', archived_at: null,
    }, '2026-09-20'), true);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
