import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHeartRateBenchmarks,
  describeRestingHeartRate,
  estimateSleepingHeartRateRange,
} from './restingHeartRate.ts';

test('estimates a sleeping range 20–30% below the daytime check', () => {
  assert.deepEqual(estimateSleepingHeartRateRange(72), { low: 50, high: 58 });
});

test('rounds both sleeping estimate boundaries to whole BPM', () => {
  assert.deepEqual(estimateSleepingHeartRateRange(73), { low: 51, high: 58 });
});

test('calculates age-based activity estimates and pace projections', () => {
  assert.deepEqual(calculateHeartRateBenchmarks({ bpm: 72, age: 30 }), {
    estimatedMaximum: 190,
    moderateActivity: { low: 95, high: 133 },
    vigorousActivity: { low: 133, high: 162 },
    beatsPerHour: 4_320,
    beatsPerDay: 103_680,
  });
});

test('rounds activity range boundaries to whole BPM', () => {
  assert.deepEqual(calculateHeartRateBenchmarks({ bpm: 73, age: 31 }), {
    estimatedMaximum: 189,
    moderateActivity: { low: 95, high: 132 },
    vigorousActivity: { low: 132, high: 161 },
    beatsPerHour: 4_380,
    beatsPerDay: 105_120,
  });
});

test('a mid-range reading lands in the typical band', () => {
  const result = describeRestingHeartRate({ bpm: 68, age: 25, sex: 'male' });
  assert.equal(result.band, 'typical');
  assert.equal(result.bandLabel, 'Within typical range');
  assert.ok(result.headline.includes('men around 25'));
});

test('the female band sits a few bpm higher than the male band', () => {
  const male = describeRestingHeartRate({ bpm: 68, age: 25, sex: 'male' });
  const female = describeRestingHeartRate({ bpm: 68, age: 25, sex: 'female' });
  assert.ok(female.typicalLow > male.typicalLow);
  assert.ok(female.typicalHigh > male.typicalHigh);
});

test('the same reading can be above range for men and typical for women', () => {
  const male = describeRestingHeartRate({ bpm: 76, age: 25, sex: 'male' });
  const female = describeRestingHeartRate({ bpm: 76, age: 25, sex: 'female' });
  assert.equal(male.band, 'above');
  assert.equal(female.band, 'typical');
});

test('an athlete reading reads as below the typical range', () => {
  const result = describeRestingHeartRate({ bpm: 48, age: 34, sex: 'unspecified' });
  assert.equal(result.band, 'below');
  assert.equal(result.bandLabel, 'Below typical range');
  assert.ok(result.headline.includes('people around 34'));
});

test('ages past the last band still resolve', () => {
  const result = describeRestingHeartRate({ bpm: 70, age: 92, sex: 'female' });
  assert.equal(result.typicalLow, 65);
  assert.equal(result.typicalHigh, 81);
});
