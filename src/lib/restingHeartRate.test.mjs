import test from 'node:test';
import assert from 'node:assert/strict';
import { describeRestingHeartRate } from './restingHeartRate.ts';

test('a mid-range reading lands in the typical band', () => {
  const result = describeRestingHeartRate({ bpm: 68, age: 25, sex: 'male' });
  assert.equal(result.band, 'typical');
  assert.equal(result.bandLabel, 'Average');
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

test('an athlete reading reads as below average', () => {
  const result = describeRestingHeartRate({ bpm: 48, age: 34, sex: 'unspecified' });
  assert.equal(result.band, 'below');
  assert.equal(result.bandLabel, 'Below average');
  assert.ok(result.headline.includes('people around 34'));
});

test('ages past the last band still resolve', () => {
  const result = describeRestingHeartRate({ bpm: 70, age: 92, sex: 'female' });
  assert.equal(result.typicalLow, 65);
  assert.equal(result.typicalHigh, 81);
});
