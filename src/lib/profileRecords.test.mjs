import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProfileRecords } from './profileRecords.ts';

const room = (dates) => ({ decorations: dates.map((earnedLocalDate) => ({ earnedLocalDate })) });
const fullRoom = (lastDate) =>
  room(['2026-01-01', '2026-01-02', '2026-01-03', lastDate, '2026-01-05', '2026-01-06', '2026-01-04']);

test('a new user sees both records, every one locked', () => {
  const records = buildProfileRecords({ longestStreak: 0, rooms: [room(['2026-03-01'])] });

  assert.deepEqual(
    records.map((record) => [record.key, record.locked, record.localDate]),
    [
      ['longestStreak', true, null],
      ['roomsFinished', true, null],
    ],
  );
});

test('rooms finished counts only full rooms and dates the latest finish', () => {
  const [, roomsFinished] = buildProfileRecords({
    longestStreak: 3,
    rooms: [fullRoom('2026-02-10'), fullRoom('2026-04-20'), room(['2026-05-01'])],
  });

  assert.equal(roomsFinished.value, 2);
  assert.equal(roomsFinished.localDate, '2026-04-20');
  assert.equal(roomsFinished.locked, false);
});

test('the longest streak has no date', () => {
  const [streak] = buildProfileRecords({ longestStreak: 12, rooms: [] });

  assert.equal(streak.value, 12);
  assert.equal(streak.localDate, null);
  assert.equal(streak.locked, false);
});
