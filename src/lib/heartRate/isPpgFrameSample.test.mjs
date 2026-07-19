import assert from 'node:assert/strict';
import test from 'node:test';

import { isPpgFrameSample } from './isPpgFrameSample.ts';

const validSample = {
  timestamp: 1_000,
  rois: [
    {
      id: 'center',
      r: 180,
      g: 70,
      b: 50,
      saturatedPct: 0.1,
      darkPct: 0,
      variance: 12,
    },
  ],
};

test('accepts a complete PPG frame sample', () => {
  assert.equal(isPpgFrameSample(validSample), true);
});

test('rejects missing timestamps and empty ROI collections', () => {
  assert.equal(isPpgFrameSample({ rois: validSample.rois }), false);
  assert.equal(isPpgFrameSample({ timestamp: 1_000, rois: [] }), false);
});

test('rejects malformed ROI values', () => {
  assert.equal(
    isPpgFrameSample({
      ...validSample,
      rois: [{ ...validSample.rois[0], variance: Number.NaN }],
    }),
    false,
  );
});
