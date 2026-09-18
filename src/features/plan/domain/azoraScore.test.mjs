/**
 * The score on the plan screen, and the two ways it could lie.
 *
 * It could flatter — by counting a window the user has not lived yet, or by
 * only ever going up. It could punish — by scoring somebody on their second
 * day out of seven. Both are checked here, because both are invisible until
 * somebody new opens the screen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AZORA_SCORE_WINDOW_DAYS,
  azoraScore,
  azoraScoreBand,
  azoraScoreIfTodayKept,
  azoraScoreWindow,
} from './azoraScore.ts';

const TODAY = '2026-09-18';

test('the window is the last seven days, today first', () => {
  const window = azoraScoreWindow(TODAY, '2026-01-01');
  assert.equal(window.length, AZORA_SCORE_WINDOW_DAYS);
  assert.equal(window[0], TODAY);
  assert.equal(window[6], '2026-09-12');
});

test('a plan three days old is scored out of three', () => {
  // Otherwise somebody who has done everything asked of them since Tuesday is
  // holding a 43, which is a number that punishes people for being new.
  const score = azoraScore({
    todayLocalDate: TODAY,
    startedOn: '2026-09-16',
    keptDates: ['2026-09-16', '2026-09-17', '2026-09-18'],
  });
  assert.equal(score.daysAsked, 3);
  assert.equal(score.daysKept, 3);
  assert.equal(score.score, 100);
});

test('the first day is scored out of one, not out of zero', () => {
  const started = azoraScore({
    todayLocalDate: TODAY,
    startedOn: TODAY,
    keptDates: [],
  });
  assert.equal(started.daysAsked, 1);
  assert.equal(started.score, 0);
  assert.equal(Number.isFinite(started.score), true);
});

test('the window never reaches past seven days however old the plan', () => {
  const score = azoraScore({
    todayLocalDate: TODAY,
    startedOn: '2025-01-01',
    keptDates: [],
  });
  assert.equal(score.daysAsked, AZORA_SCORE_WINDOW_DAYS);
});

test('days outside the window do not count', () => {
  // The score is this week. A fortnight of perfect days two months ago is not
  // evidence about it, and counting them is how a number stops moving.
  const score = azoraScore({
    todayLocalDate: TODAY,
    startedOn: '2026-01-01',
    keptDates: ['2026-08-01', '2026-08-02', '2026-09-11', TODAY],
  });
  assert.equal(score.daysKept, 1);
  assert.equal(score.score, 14);
});

test('a day kept twice is still one day', () => {
  const score = azoraScore({
    todayLocalDate: TODAY,
    startedOn: '2026-01-01',
    keptDates: [TODAY, TODAY, TODAY],
  });
  assert.equal(score.daysKept, 1);
});

test('the score can fall, which is the point of it', () => {
  const week = (kept) =>
    azoraScore({ todayLocalDate: TODAY, startedOn: '2026-01-01', keptDates: kept }).score;
  const good = week([
    '2026-09-18', '2026-09-17', '2026-09-16', '2026-09-15',
    '2026-09-14', '2026-09-13', '2026-09-12',
  ]);
  const thin = week(['2026-09-18']);
  assert.equal(good, 100);
  assert.ok(thin < good);
});

test('no plan yet is scored over the full week rather than crashing', () => {
  const score = azoraScore({
    todayLocalDate: TODAY,
    startedOn: null,
    keptDates: [TODAY],
  });
  assert.equal(score.daysAsked, AZORA_SCORE_WINDOW_DAYS);
});

test('a malformed date produces an empty week, never a wrong number', () => {
  assert.deepEqual(azoraScoreWindow('not-a-date', null), []);
  const score = azoraScore({
    todayLocalDate: 'not-a-date',
    startedOn: null,
    keptDates: [],
  });
  assert.equal(score.score, 0);
  assert.equal(score.daysAsked, 0);
});

test('the bands split the scale and every score has one', () => {
  assert.equal(azoraScoreBand(0), 'quiet');
  assert.equal(azoraScoreBand(35), 'quiet');
  assert.equal(azoraScoreBand(36), 'building');
  assert.equal(azoraScoreBand(70), 'building');
  assert.equal(azoraScoreBand(71), 'strong');
  assert.equal(azoraScoreBand(100), 'strong');
  for (let score = 0; score <= 100; score += 1) {
    assert.ok(['quiet', 'building', 'strong'].includes(azoraScoreBand(score)));
  }
});

test('the card can say what keeping today would make it', () => {
  const score = azoraScore({
    todayLocalDate: TODAY,
    startedOn: '2026-01-01',
    keptDates: ['2026-09-17', '2026-09-16', '2026-09-15'],
  });
  assert.equal(score.todayKept, false);
  assert.equal(score.score, 43);
  assert.equal(azoraScoreIfTodayKept(score), 57);
});

test('a day already kept is not offered again', () => {
  const score = azoraScore({
    todayLocalDate: TODAY,
    startedOn: '2026-01-01',
    keptDates: [TODAY],
  });
  assert.equal(score.todayKept, true);
  assert.equal(azoraScoreIfTodayKept(score), null);
});
