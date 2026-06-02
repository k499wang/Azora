# HRV Algorithmic Speedups

This note evaluates ways to make the 90s Full HRV result faster without
shortening the capture or loosening accuracy gates.

## Current State

- Full HRV capture remains 90s at 30 FPS.
- Final HRV uses the batch analyzer in `src/lib/heartRate/signalProcessing.ts`.
- The largest historical wins are already present:
  - centered O(n) moving average in `src/lib/heartRate/movingAverage.ts`
  - two-pass candidate selection in `analyzeCapture`
- The current peak pass evaluates the top 4 frequency-ranked candidates.

## Previous Change: Top 5 to Top 4 Candidates

Changing `TOP_CANDIDATES_FOR_PEAKS` from 5 to 4 only changes the final batch
peak/HRV candidate pass. It does not change live beat detection, because live UI
beat feedback uses `latestPeakForPolarity`, not `peakEstimateForPolarity`.

Accuracy impact is expected to be low but not zero:

- BPM consensus still comes from the frequency-only pass across all candidates.
- HRV still chooses the best beat series among multiple candidates.
- The removed fifth candidate could matter if it has lower frequency priority
  but unusually clean beat timing.

Keep this change only if replay validation shows no meaningful drop in HRV
availability or RMSSD stability.

## Best Next Optimization: Rolling-Min Prominence

`peakEstimateForPolarity` detects local peaks and checks prominence by scanning
left and right windows around each candidate peak. At 180 Hz, the prominence
window is about 50 samples per side. That repeated scan is exact but wasteful.

Optimization:

- Precompute rolling minimums for the left and right prominence windows.
- For each peak, look up `leftMin[peakIndex]` and `rightMin[peakIndex]`.
- Keep the same centered/local peak search, height threshold, prominence
  threshold, refractory logic, and polarity ranking.

Expected behavior:

- Accuracy should be unchanged if the rolling windows match the old inclusive
  bounds exactly.
- The selected peaks, BPM, consistency, HRV beat series, and RMSSD should match
  the previous implementation on deterministic fixtures.
- Live beat detection should be unaffected because this is only used by the
  final batch peak estimator.

Expected ROI:

- Medium on slower devices when the final result screen waits on processing.
- Small on desktop/node synthetic captures, where the current analyzer is already
  fast.
- Most useful when paired with real-device timing around `buildCaptureResult`.

Measured local synthetic result after implementing this optimization:

- before: 90s synthetic capture averaged about 94 ms after warmup
- after: the same synthetic capture averaged about 92 ms after warmup
- selected BPM, ROI/channel, and beat interval count were unchanged

That makes the immediate desktop ROI low. The main reason to keep the change is
that it removes a repeated O(candidate peaks x prominence window) scan from the
batch peak path while preserving behavior. Real-device release profiling should
decide whether this matters materially on older phones.

## Other Options

### Safe / Low Risk

- Cache candidate priority before sorting top candidates instead of recomputing
  `frequencyOnlyEstimate`.
- Skip building HRV beat series for Quick mode, since Quick mode does not compute
  or display HRV.
- Reduce allocation in polarity handling by avoiding repeated `signal.map`
  scratch arrays.
- Build candidate series in one pass over frames and ROIs instead of repeatedly
  searching frame ROI arrays.

### Medium Risk

- Coarse-to-fine frequency sweep:
  - coarse scan locates the region
  - fine scan refines the BPM
  - SNR/noise-floor behavior must be preserved or gates will drift

- Adaptive top-N:
  - process top 3 first
  - process candidate 4 only if the first pass fails or is borderline
  - needs replay validation because the final HRV winner is not always the best
    frequency candidate

### Higher Risk

- Lower `UPSAMPLE_TARGET_RATE` from 180 Hz to 120 or 90 Hz.
- Remove full-signal upsampling.
- Process only one polarity.
- Reduce camera FPS below 30 for HRV.
- Relax SNR, artifact, confidence, or retention gates.

These affect beat timing or quality gates directly and should not be changed
without real capture replay fixtures.

## Validation Criteria

Before shipping an algorithmic change, compare old vs new on real 90s captures:

- processing time p50/p95 on release builds
- HRV availability rate
- selected ROI/channel
- beat count
- rejected interval ratio
- RMSSD delta
- SDNN delta
- pNN50 delta
- final BPM delta

For rolling-min prominence specifically, deterministic tests should continue to
pass with unchanged beat-series behavior.
