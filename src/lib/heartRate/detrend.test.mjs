import test from 'node:test';
import assert from 'node:assert/strict';
import {
  smoothnessPriorsDetrend,
  smoothnessPriorsLambdaSquared,
  smoothnessPriorsTrend,
} from './detrend.ts';

// Dense reference: build A = I + λ²·D₂ᵀD₂ explicitly and solve A·x = z with
// Gaussian elimination. Used to validate the banded Cholesky solver.
function denseSmoothnessTrend(z, lambdaSquared) {
  const n = z.length;
  const a = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
  for (let r = 0; r < n - 2; r++) {
    const cols = [
      [r, 1],
      [r + 1, -2],
      [r + 2, 1],
    ];
    for (const [j, vj] of cols) {
      for (const [k, vk] of cols) {
        a[j][k] += lambdaSquared * vj * vk;
      }
    }
  }

  const m = a.map((row, i) => [...row, z[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r][col] / m[col][col];
      for (let c = col; c <= n; c++) m[r][c] -= factor * m[col][c];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

test('smoothnessPriorsTrend matches a dense solve of (I + λ²·D₂ᵀD₂)', () => {
  const z = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
  for (const lambdaSquared of [10, 500, 8000]) {
    const banded = smoothnessPriorsTrend(z, lambdaSquared);
    const dense = denseSmoothnessTrend(z, lambdaSquared);
    for (let i = 0; i < z.length; i++) {
      assert.ok(
        Math.abs(banded[i] - dense[i]) < 1e-6,
        `index ${i} (λ²=${lambdaSquared}): banded ${banded[i]} vs dense ${dense[i]}`,
      );
    }
  }
});

test('smoothnessPriorsDetrend removes a constant (DC) offset', () => {
  const values = new Array(64).fill(7.5);
  const detrended = smoothnessPriorsDetrend(values, 30);
  for (const v of detrended) assert.ok(Math.abs(v) < 1e-9);
});

test('smoothnessPriorsDetrend removes a linear trend', () => {
  // A line has zero second difference, so the smoother passes it through as the
  // trend and the residual is ~0.
  const values = Array.from({ length: 128 }, (_, i) => 2 + 0.05 * i);
  const detrended = smoothnessPriorsDetrend(values, 30);
  for (const v of detrended) assert.ok(Math.abs(v) < 1e-6, `expected ~0, got ${v}`);
});

test('smoothnessPriorsDetrend strongly attenuates a sub-cutoff drift', () => {
  const fs = 30;
  const n = 300;
  const slow = Array.from({ length: n }, (_, i) =>
    Math.sin((2 * Math.PI * 0.1 * i) / fs),
  );
  const detrended = smoothnessPriorsDetrend(slow, fs);
  const before = Math.max(...slow.map(Math.abs));
  const after = Math.max(...detrended.map(Math.abs));
  assert.ok(after < before * 0.35, `0.1 Hz drift should be cut, got ${after} vs ${before}`);
});

test('smoothnessPriorsDetrend preserves the cardiac band', () => {
  const fs = 30;
  const n = 300;
  // 1.2 Hz ≈ 72 bpm, well above the 0.4 Hz cutoff.
  const cardiac = Array.from({ length: n }, (_, i) =>
    Math.sin((2 * Math.PI * 1.2 * i) / fs),
  );
  const detrended = smoothnessPriorsDetrend(cardiac, fs);
  // Compare amplitude away from the edges (boundary rows are not shift-invariant).
  const mid = detrended.slice(50, n - 50);
  const amp = Math.max(...mid.map(Math.abs));
  assert.ok(amp > 0.9, `cardiac band should pass nearly intact, got amplitude ${amp}`);
});

test('smoothnessPriorsLambdaSquared places the half-gain cutoff at the target Hz', () => {
  const fs = 30;
  const cutoff = 0.4;
  const lambdaSquared = smoothnessPriorsLambdaSquared(fs, cutoff);
  const omegaC = (2 * Math.PI * cutoff) / fs;
  const highPassGain =
    (16 * lambdaSquared * Math.sin(omegaC / 2) ** 4) /
    (1 + 16 * lambdaSquared * Math.sin(omegaC / 2) ** 4);
  assert.ok(Math.abs(highPassGain - 0.5) < 1e-9, `expected 0.5 gain at cutoff, got ${highPassGain}`);
});

test('smoothnessPriorsDetrend handles degenerate short inputs', () => {
  assert.deepEqual(smoothnessPriorsDetrend([], 30), []);
  assert.deepEqual(smoothnessPriorsDetrend([5], 30), [0]);
  const two = smoothnessPriorsDetrend([4, 6], 30);
  assert.equal(two.length, 2);
  assert.ok(Math.abs(two[0] + 1) < 1e-9 && Math.abs(two[1] - 1) < 1e-9);
});
