# HRV Capture Performance Optimization

Guide for speeding up the final HRV/BPM computation in
`src/lib/heartRate/signalProcessing.ts`. A 90s capture currently takes ~10s to
produce results. This documents *why*, and a ranked, low-risk plan to bring it
under ~2s without sacrificing HRV accuracy.

---

## TL;DR

| # | Change | Speedup | Risk | Accuracy impact |
|---|--------|---------|------|-----------------|
| 1 | Two-pass candidate selection (cheap freq → top-N peak detect) | ~5–8× on peak path | Medium (refactor) | None if top-2/3 kept |
| 2 | Coarse-to-fine frequency sweep | ~3.5–4× on freq stage | Medium | SNR gates need re-validation |
| 3 | O(n) centered `movingAverage` | 50–300× on each MA call | **Low** | **Zero** (drop-in) |

**Do #3 first** — it is isolated, zero-behavior-change, and the biggest raw win.
Then #1, then #2.

> The cubic spline is *not* the bottleneck. See below.

---

## Diagnosis: where the 10 seconds actually goes

### The cubic spline is innocent

- `buildNaturalCubicSpline` — O(n) Thomas (tridiagonal) algorithm. Cheap.
- `upsampleCubicSpline` — walks segments monotonically (not a binary search per
  output sample), so it is O(n). Cheap.

What the spline *causes* is the problem: it upsamples 30 Hz → 180 Hz, a **6×**
increase in sample count (~2,550 → ~15,300 samples for an 85s stabilized
window), and then **every downstream stage runs on that inflated signal** — and
some of those stages are super-linear.

### The real bottleneck: `movingAverage` is O(n × window)

`signalProcessing.ts` `movingAverage` re-sums the entire window for every
sample:

```ts
for (let i = 0; i < values.length; i++) {
  const start = Math.max(0, i - half);
  const end = Math.min(values.length, i + half + 1);
  let sum = 0;
  for (let j = start; j < end; j++) sum += values[j]; // re-sums every time
  result.push(sum / (end - start));
}
```

`preprocess` calls it three times, with windows of `sampleRate*1.5`,
`sampleRate*2`, and `sampleRate*0.12`. At 180 Hz those windows are **270, 360,
and ~22 samples**. So each large call is ~15,300 × 300 ≈ 4–5M ops, and
`preprocess` runs on the upsampled signal **for every candidate**.

### Cost budget (90s capture, ~16 candidates = 4 ROIs × 4 channels)

| Stage | per candidate | × ~16 |
|-------|--------------:|------:|
| `preprocess` on 180 Hz signal (moving averages) | ~10M | **~160M** |
| `frequencyEstimate` (233 freqs × 3 Goertzel × 2,550) | ~1.8M | ~28M |
| `peakEstimate` on 180 Hz signal | ~1.5M | ~24M |

The moving-average-on-upsampled cost dominates everything else combined. That is
the ~10 seconds.

---

## Optimization 1 — Two-pass candidate selection

**Idea:** don't upsample + peak-detect all ~16 candidates. Run the cheap
frequency pass on every candidate, keep the best few, then run the expensive
upsample + peak detection only on those.

### Why it fits the current code

`frequencyEstimate` already runs on the 30 Hz `resampled.values`, *before* the
expensive `upsampleCubicSpline` / `peakEstimate`. And `consensusEstimate` (the
**BPM** reading) only needs the frequency-based `estimate` — it never touches
peaks. Only the **HRV** beat series needs peaks. So the pipeline splits cleanly:

- **Cheap pass — all candidates:**
  resample → `lightingIsStable` gate → `preprocess`@30Hz → `frequencyEstimate` →
  SNR gate → frequency-only `estimate`.
  Feeds `consensusEstimate` for BPM.
- **Expensive pass — winners only:**
  `upsampleCubicSpline` → `preprocess`@180Hz → `peakEstimate` → `cleanBeatSeries`
  → `hrvScore`.
  Feeds the HRV beat series.

### Guardrail: keep the top **2–3**, not the top 1

The cheap score (frequency SNR / confidence) is **not** a perfect proxy for the
final HRV pick:

1. `hrvCandidatePriority` ranks on the *actual* IBI series — interval scatter,
   retention ratio, rejection count. The candidate with the best frequency SNR
   can still produce a junk beat-to-beat series.
2. A selected winner can still fail `requirePeakAgreement` or the
   `peaks == null` fallback gate and return `null`. If only one was processed,
   you are left with no HRV.

Process the top 2–3 by cheap score, then sort those by `hrvScore`. Still cuts
~16 expensive passes to ~2–3.

### Expected gain

~5–8× on the peak-detection path (not 10–12×, since 2–3 winners are processed,
not 1).

### Sketch

Split `analyzeCandidate` into two functions:

```ts
// Stage 1 — cheap, runs on every candidate
function analyzeCandidateFrequency(
  series: CandidateSeries,
  options: ResolvedComputeBpmOptions,
): FrequencyCandidate | null {
  // trim stabilization, resampleUniform, lightingIsStable,
  // preprocess(resampled.values), frequencyEstimate, SNR gate.
  // Return { estimate (freq-only), resampled, stableStartTimestamp, freq }.
}

// Stage 2 — expensive, runs on top-N only
function analyzeCandidatePeaks(
  cheap: FrequencyCandidate,
  options: ResolvedComputeBpmOptions,
): PeakCandidateAnalysis | null {
  // upsampleCubicSpline, preprocess(upsampled.values), peakEstimate,
  // peak-agreement gate, confidence, return full CandidateAnalysis.
}
```

Then in `analyzeCapture`:

```ts
const cheap = buildCandidates(samples)
  .map((c) => analyzeCandidateFrequency(c, resolvedOptions))
  .filter((c): c is FrequencyCandidate => c != null);

const estimate = consensusEstimate(cheap.map((c) => c.estimate));

const topN = [...cheap]
  .sort((a, b) => cheapScore(b) - cheapScore(a))
  .slice(0, 3);

const peakAnalyses = topN
  .map((c) => analyzeCandidatePeaks(c, resolvedOptions))
  .filter((a): a is PeakCandidateAnalysis => a != null);
// ...buildScoredCaptureBeatSeries, sort by hrvScore, pick best
```

`cheapScore` = the SNR/confidence portion of the existing scoring that does not
depend on peaks.

### Validation

Run real captures, not just `signalProcessing.test.mjs`. Confirm the HRV winner
matches what full processing would have chosen on a handful of recordings.

---

## Optimization 2 — Coarse-to-fine frequency sweep

**Idea:** `FREQ_STEP = 0.01` Hz sweeps 233 frequencies (× 3 harmonics each).
That is 0.6 BPM resolution — finer than needed to *locate* the peak. Do a coarse
sweep to find the peak bin, then a fine sweep in a narrow window around it.

```
coarse 0.1 Hz  (≈24 points) → find peak bin
fine   0.01 Hz in ±0.2 Hz around the peak (≈40 points)
≈ 64 Goertzel triplets vs 233
```

Goertzel here uses a non-integer `k = (targetFreq/sampleRate)*n` (generalized
form), so it evaluates at any frequency — arbitrary step sizes are valid.

### The non-obvious risk: SNR, not BPM

`frequencyEstimate` derives `noiseFloor` as the **mean of off-peak scores across
the sweep**, and `snrDb` from that. Change the sweep density and you change which
bins enter that mean → `snrDb` shifts → and `snrDb` directly drives:

- the `minSnrDb` gate,
- the `fallbackSnrDbWithoutPeaks` gate,
- `snrFactor` in the confidence calc,
- the quality label.

So this is **not** "negligible accuracy loss" — it is a behavior change in
candidate gating.

### Mitigation

Decouple the two concerns:

- **Noise floor / SNR** — compute from a fixed, consistent-density sweep so the
  SNR distribution stays comparable to today.
- **Peak frequency precision** — use the fine, local refinement only to pin the
  peak frequency for the reported BPM (`Math.round(peakFreq * 60)`).

A flat 0.1 Hz grid used directly would quantize BPM to 6 BPM — don't do that; the
hybrid keeps full BPM precision.

### Expected gain

~3.5–4× on the frequency stage. This stage runs on **all** candidates (it is the
cheap pass in #1), so the win compounds with #1.

### Validation

Re-validate the SNR gates against captured fixtures — confirm pass/fail decisions
don't drift.

---

## Optimization 3 — O(n) centered `movingAverage` (do this first)

**Idea:** replace the O(n × window) re-summing with a single running sum.
Biggest raw win, lowest risk.

### Pitfall: must stay **centered**

A naive sliding-sum that trails the index (window `[i-w+1, i]`) is **not**
equivalent to the current centered average (window `[i-half, i+half]`). A
trailing average lags the signal by ~half a window. That matters here:
`preprocess` subtracts a moving-average baseline and slow trend
(`detrended = clipped - slowTrend`). A phase-shifted baseline detrends against
the wrong low-frequency component and distorts the upstroke slope — the exact
feature `upslopeBeatTimestampsFromPeaks` uses for beat timing. That would corrupt
HRV.

Also: the divisor must stay the **true sample count** `(end - start + 1)` so the
window correctly shrinks at *both* ends, and `makeOddWindow` must be preserved.

### Correct O(n) centered version (drop-in, zero behavior change)

```ts
function movingAverage(values: number[], windowSize: number): number[] {
  const window = makeOddWindow(windowSize);
  const half = (window - 1) / 2;
  const n = values.length;
  const result = new Array<number>(n);
  let sum = 0;
  let start = 0;
  let end = -1;
  for (let i = 0; i < n; i++) {
    const newEnd = Math.min(n - 1, i + half);
    const newStart = Math.max(0, i - half);
    while (end < newEnd) sum += values[++end];
    while (start < newStart) sum -= values[start++];
    result[i] = sum / (end - start + 1);
  }
  return result;
}
```

Both pointers only advance forward → O(n) total. Same centered mean, same
true-count divisor, same odd window → effectively identical output (modulo
floating-point rounding).

### Expected gain

For a window of 360 samples, ~360× fewer adds in that call. Across the three
`preprocess` MA calls on the 180 Hz signal × ~16 candidates, this removes the
dominant cost (~160M ops).

### Validation

Assert the new output matches the current `movingAverage` on a fixed input
fixture (within ~1e-9). Add to `signalProcessing.test.mjs`.

---

## Recommended rollout order

1. **#3 — corrected centered `movingAverage`.** Isolated, zero-accuracy-change,
   biggest raw win. Verify output matches current implementation on a fixture.
   This also speeds the #1 cheap pass.
2. **#1 — two-pass selection, keep top-3.** Moderate refactor (split
   `analyzeCandidate`). Validate HRV on real captures.
3. **#2 — coarse-to-fine sweep, consistent noise floor.** Last, because it needs
   SNR-gate re-validation.

Each step is independently shippable and reviewable. Run `npm test` and
`npx tsc --noEmit` after each.

---

## Open question: is the 180 Hz upsample needed at all?

`upslopeBeatTimestampsFromPeaks` already does parabolic sub-sample refinement via
`interpolatePeakOffset` on the upstroke slope, which recovers most of the
sub-sample timing precision the 180 Hz upsample is buying. Options worth a future
spike:

- **Drop the full-signal upsample** and rely on parabolic refinement at 30 Hz.
- **Upsample only a small window around each detected peak** (a few hundred
  samples total instead of 15,300).
- **Lower `UPSAMPLE_TARGET_RATE`** (180 → 90/120) for a linear speedup.

The three optimizations above make the upsample cheap enough that it may stop
mattering — but if further headroom is needed, this is the next lever. Any change
here is an HRV-accuracy change and must be validated against real recordings, not
just unit tests.
