import assert from 'node:assert/strict';
import test from 'node:test';
import { MOOD_INSIGHT_HISTORY_LIMIT, moodInsights } from './moodInsights';

const entry = (date, overall, tags = [], feeling = null) => ({
  localDate: date, score: 50, answers: { overall }, tags, feeling,
});
const input = checkIns => ({ checkIns, todayLocalDate: '2026-10-19' });

test('first check-in immediately shows mood, feelings and impacts', () => {
  const insights = moodInsights(input([entry('2026-10-19', 4, ['work', 'friends'], 'happy')]));
  assert.equal(insights.checkInCount, 1);
  assert.equal(insights.since, '2026-10-19');
  assert.equal(insights.usualLevel, 4);
  assert.equal(insights.feelings[0].label, 'Happy');
  assert.equal(insights.feelings[0].level, 4);
  assert.deepEqual(insights.impacts, [
    { tagId: 'friends', label: 'Friends', roughDays: 0, goodDays: 1 },
    { tagId: 'work', label: 'Work', roughDays: 0, goodDays: 1 },
  ]);
  assert.deepEqual(insights.weekdays.map(day => day.days), [1, 0, 0, 0, 0, 0, 0]);
  assert.equal(insights.trend.length, 14);
  assert.equal(insights.trend.at(-1).value, 4);
});

test('everything up to today is aggregated and future entries are ignored', () => {
  const insights = moodInsights(input([
    entry('2025-12-01', 1), entry('2026-10-13', 2),
    entry('2026-10-19', 5), entry('2026-10-20', 1),
  ]));
  assert.equal(insights.checkInCount, 3);
  assert.equal(insights.since, '2025-12-01');
  assert.deepEqual(insights.distribution.map(bucket => bucket.days), [1, 1, 0, 0, 1]);
  assert.equal(insights.trend[0].localDate, '2025-12-01');
  assert.equal(insights.trend.at(-1).localDate, '2026-10-19');
});

test('the trend is capped at the history limit', () => {
  const insights = moodInsights(input([entry('2020-01-01', 3), entry('2026-10-19', 3)]));
  assert.equal(insights.trend.length, MOOD_INSIGHT_HISTORY_LIMIT);
  assert.equal(insights.checkInCount, 2);
});

test('the usual mood breaks ties toward the lower mood', () => {
  const insights = moodInsights(input([entry('2026-10-18', 2), entry('2026-10-19', 5)]));
  assert.equal(insights.usualLevel, 2);
});

test('feelings are coloured by the mood they were usually logged with', () => {
  const insights = moodInsights(input([
    entry('2026-10-17', 1, [], 'tired'), entry('2026-10-18', 2, [], 'tired'),
    entry('2026-10-19', 5, [], 'happy'), entry('2026-10-16', 2, [], 'not-a-word'),
  ]));
  assert.deepEqual(insights.feelings.map(feeling => [feeling.feelingId, feeling.days, feeling.level]),
    [['tired', 2, 2], ['happy', 1, 5]]);
});

test('impacts count a repeated tag once, skip okay days, and read positive first', () => {
  const insights = moodInsights(input([
    entry('2026-10-17', 1, ['work', 'work', 'study', 'unknown']),
    entry('2026-10-18', 3, ['friends']),
    entry('2026-10-19', 5, ['study', 'walk']),
  ]));
  assert.deepEqual(insights.impacts.map(impact => [impact.tagId, impact.roughDays, impact.goodDays]),
    [['walk', 0, 1], ['study', 1, 1], ['work', 1, 0]]);
});

test('impacts keep the most logged tags before ordering them', () => {
  const tags = ['work', 'study', 'busy', 'rest', 'chores', 'travel', 'exercise', 'walk'];
  const checkIns = tags.flatMap((tag, index) => [entry(`2026-09-${String(index + 1).padStart(2, '0')}`, 1, [tag]),
    entry(`2026-09-${String(index + 11).padStart(2, '0')}`, 1, [tag])]);
  checkIns.push(entry('2026-10-19', 5, ['stretch']));
  const insights = moodInsights(input(checkIns));
  assert.equal(insights.impacts.length, 8);
  assert.equal(insights.impacts.some(impact => impact.tagId === 'stretch'), false);
});

test('weekdays start on Monday and times of day bucket by the saved hour', () => {
  const at = (hour) => new Date(2026, 9, 19, hour).toISOString();
  const insights = moodInsights(input([
    { ...entry('2026-10-13', 4), createdAt: at(8) },
    { ...entry('2026-10-15', 2), createdAt: at(13) },
    { ...entry('2026-10-16', 3), createdAt: at(23) },
    { ...entry('2026-10-17', 3), createdAt: at(2) },
    entry('2026-10-19', 5),
  ]));
  assert.deepEqual(insights.weekdays.map(day => [day.label, day.days]),
    [['Mo', 1], ['Tu', 1], ['We', 0], ['Th', 1], ['Fr', 1], ['Sa', 1], ['Su', 0]]);
  assert.deepEqual(insights.timesOfDay.map(band => [band.label, band.days]),
    [['Morning', 1], ['Afternoon', 1], ['Evening', 0], ['Late', 2]]);
  assert.equal(insights.timesOfDay[0].distribution[3].days, 1);
});

test('an empty history has no summary and five zero mood buckets', () => {
  const insights = moodInsights(input([]));
  assert.equal(insights.checkInCount, 0);
  assert.equal(insights.since, null);
  assert.equal(insights.usualLevel, null);
  assert.deepEqual(insights.feelings, []);
  assert.deepEqual(insights.impacts, []);
  assert.ok(insights.timesOfDay.every(band => band.days === 0));
  assert.deepEqual(insights.distribution.map(bucket => bucket.days), [0, 0, 0, 0, 0]);
});
