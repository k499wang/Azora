import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateLungAge,
  lungAgeGaugeFill,
  medianHoldForAge,
} from './lungAge.ts';

test('a hold at your own median returns your own age', () => {
  const age = 40;
  const result = estimateLungAge(medianHoldForAge(age), age);
  assert.equal(result.years, age);
  assert.equal(result.deltaYears, 0);
  assert.equal(result.label, 'right on your age');
});

test('a longer hold reads younger than the persons age', () => {
  const result = estimateLungAge(90, 45);
  assert.ok(result.years < 45);
  assert.equal(result.label, `${45 - result.years} years younger than you`);
});

test('a short hold reads older than the persons age', () => {
  const result = estimateLungAge(15, 30);
  assert.ok(result.years > 30);
  assert.equal(result.label, `${result.years - 30} years older than you`);
});

test('short holds produce varied whole-year lung ages', () => {
  const expectedYearsByHold = new Map([
    [10, 90],
    [12, 82],
    [15, 72],
    [18, 64],
    [20, 59],
  ]);

  for (const [holdSeconds, expectedYears] of expectedYearsByHold) {
    const result = estimateLungAge(holdSeconds, 30);
    assert.equal(result.years, expectedYears);
    assert.equal(Number.isInteger(result.years), true);
  }
});

test('lung age decreases monotonically as short hold time improves', () => {
  const years = Array.from(
    { length: 11 },
    (_, index) => estimateLungAge(10 + index, 30).years,
  );

  for (let index = 1; index < years.length; index += 1) {
    assert.ok(years[index] < years[index - 1]);
  }
});

test('lung age stays inside the 18-90 range at the extremes', () => {
  assert.equal(estimateLungAge(600, 30).years, 18);
  assert.equal(estimateLungAge(1, 30).years, 90);
  assert.equal(estimateLungAge(9, 30).years, 90);
  assert.equal(estimateLungAge(10, 30).years, 90);
  assert.ok(estimateLungAge(11, 30).years < 90);
});

test('median hold flattens at and below the peak age', () => {
  assert.equal(medianHoldForAge(18), medianHoldForAge(22));
  assert.ok(medianHoldForAge(60) < medianHoldForAge(40));
});

test('lung age gauge fill clamps to its endpoints', () => {
  assert.equal(lungAgeGaugeFill(17), 0);
  assert.equal(lungAgeGaugeFill(18), 0);
  assert.equal(lungAgeGaugeFill(90), 100);
  assert.equal(lungAgeGaugeFill(91), 100);
});

test('lung age gauge fill maps the range midpoint to half fill', () => {
  assert.equal(lungAgeGaugeFill(54), 50);
});
