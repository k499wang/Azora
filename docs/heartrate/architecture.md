# Heart Rate Architecture

This document explains how the current heart-rate stack works end to end:

- how the camera data enters the app
- how live pulse / live BPM work
- how Quick and Full capture results work
- how final BPM differs from final HRV
- why there are multiple pipelines instead of one

This is a description of the current code, not an aspirational design.

## Files That Matter

Core data and orchestration:

- `src/lib/heartRate/types.ts`
- `src/lib/heartRate/heartRatePlugin.ts` (current JS frame-processor bridge)
- `src/hooks/useLivePulse.ts`
- `src/hooks/useHeartRateCapture.ts`
- `src/hooks/useHeartRateStream.ts`
- `src/lib/heartRate/captureResult.ts`

Live detector:

- `src/lib/heartRate/heartRateManager.ts`

Batch / offline capture analysis:

- `src/lib/heartRate/signalProcessing.ts`
- `src/lib/hrv.ts`

Authored native frame processor sources:

- `native/ios/HeartRatePlugin.swift`
- `native/ios/HeartRatePlugin.mm`

`plugins/with-heart-rate-plugin.js` copies the selected implementation into the
generated, gitignored `ios/` project during Expo prebuild. Do not edit the
generated copies.

## High-Level Mental Model

There are really **three related outputs** in this feature:

1. `beatTick`
   This is the "a heartbeat just happened" signal used for UI pulse feedback.

2. `currentBpm`
   This is the live number shown during streaming / capture.

3. Final reading
   This is the result after the selected capture finishes:
   - final BPM
   - confidence / quality
   - RMSSD / SDNN / pNN50 / HR drop

These outputs are related, but they do **not** all come from the exact same path.

That is intentional.

- Live UI needs to be fast and reactive.
- Final BPM needs to be robust.
- HRV needs accurate beat-to-beat timing much more than rough rate estimation.

## Data Flow Overview

```text
Camera frame
  -> native frame processor plugin
  -> PpgFrameSample { timestamp, rois[] }

Three orchestration consumers use those samples, with two final-analysis modes:

1. Live / streaming consumers
   useLivePulse / useHeartRateStream / useHeartRateCapture
   -> HeartRateManager.processFrame(...)
   -> beatTick + live BPM + live IBI stream

2. Final capture path
   buildCaptureResult(samples, mode, options)
   -> Quick: validated live presentation BPM samples
   -> Full: analyzeCapture(samples)
      -> batch BPM estimate
      -> best capture beat series
      -> HRV statistics
```

The important part is:

- **live BPM** comes from `HeartRateManager`
- **Quick final BPM** comes from validated live presentation BPM samples
- **Full final BPM** comes from the batch analysis in `analyzeCapture(samples)`
- **Full final HRV** comes from the selected capture beat series plus HRV analysis

## The Raw Input Type

The native plugin emits `PpgFrameSample`:

```ts
interface PpgFrameSample {
  timestamp: number;
  rois: PpgRoiSample[];
}
```

Each frame contains several ROI summaries:

```ts
interface PpgRoiSample {
  id: string;
  r: number;
  g: number;
  b: number;
  saturatedPct: number;
  darkPct: number;
  variance: number;
}
```

That means the JS layer does **not** receive full images. It receives compact per-frame summaries:

- average `r/g/b`
- how dark the region is
- how saturated it is
- rough variance

This is good because the heavy image work stays native and the detector logic can run on small numeric streams.

## Native Plugin Layer

### What the plugin does

The Vision Camera frame processor:

- samples several ROIs from the frame
- computes average color statistics for each ROI
- returns a compact `PpgFrameSample`

The JS entry point is:

- `src/lib/heartRate/heartRatePlugin.ts`

That is just a thin bridge around the native plugin.

### Why native timestamps matter

The native plugin now timestamps each sample from the **sample buffer presentation timestamp**, not from `CACurrentMediaTime()`.

That matters because:

- `CACurrentMediaTime()` tells you when the plugin code happened to run
- the sample buffer timestamp tells you when the camera actually captured the frame

For rough BPM, either can sometimes look okay.
For HRV, this difference matters more:

- `RMSSD` and `SDNN` depend on beat-to-beat timing
- timestamp jitter directly pollutes IBI quality

So native frame timestamps reduce one source of timing noise before any detector logic runs.

## Live Streaming Architecture

There are two hooks that matter:

- `useLivePulse.ts`
- `useHeartRateCapture.ts`

Both push frames through `HeartRateManager`.

## `HeartRateManager`: What It Is

`HeartRateManager` is the **streaming detector**.

Its job is:

- classify whether the finger signal is usable
- maintain a running filtered waveform
- detect peaks in real time
- maintain recent IBI history
- expose a live BPM estimate
- store `ibiSamples` during a measurement window

It is stateful. It is not a pure function.

That is appropriate here because live detection depends on:

- previous frames
- previous peaks
- warmup state
- recent accepted IBIs

## Live Frame Classification

Every frame goes through `classifyFrame(sample)` in `heartRateManager.ts`.

This looks at the averaged ROI signal and decides whether the frame is:

- `no_finger`
- `partial`
- `too_much_pressure`
- `good`

The classification uses things like:

- weighted brightness
- dark percentage
- saturation percentage
- red dominance
- ROI coverage

This is the first gate in the system. If the finger classification is bad, later signal processing is not even trusted.

## Live Signal Used By `HeartRateManager`

The streaming manager uses a **single aggregated signal**, not all ROI/channel candidates.

Specifically:

- each ROI gets converted to a `weighted` channel:
  - `0.67 * red + 0.33 * green`
- those ROI signals are effectively reduced to one frame-level average via `classifyFrame(...)`

So the live detector is intentionally simpler than the batch path.

This is one of the biggest architectural differences in the system:

- **live path**: one aggregated weighted signal
- **batch path**: many ROI/channel candidates are evaluated

## Live Filter / Peak Pipeline

Inside `HeartRateManager.processFrame(...)`, the live waveform goes through:

1. baseline tracking
   - slow EMA

2. causal band-pass filter
   - high-pass around `0.7 Hz`
   - low-pass around `3.5 Hz`
   - implemented as two biquads

3. AC normalization
   - `ac = bp / baseline`

4. amplitude envelope
   - EMA of `abs(ac)`

5. thresholded peak detection
   - threshold = amplitude * factor
   - refractory period = `MIN_IBI_MS`

6. parabolic interpolation
   - sub-frame peak timing using the previous / current samples

This path is causal and streaming.

That means it is suitable for:

- live pulse animation
- live BPM
- collecting an online IBI stream

It is not a perfect offline signal-analysis path, because it cannot use future samples.

## Live Beat Detection

When `HeartRateManager` sees a peak:

- it checks refractory period
- it computes `peakTs`
- it derives an `ibi = peakTs - lastPeakTs`

Then it does two important checks:

### 1. Maximum IBI guard

If the interval is too long:

- it is treated as a broken rhythm / gap
- rolling history is cleared

### 2. Malik ectopic rejection

If enough IBI history exists, the new interval is compared to the recent median.

If the new IBI differs too much from that median, it is rejected as likely ectopic / spurious.

Important detail:

- on a rejected ectopic, the anchor is **not** advanced

That means the next real beat still measures back to the true previous beat, instead of chaining the error forward.

This is very important for keeping the live IBI stream from being wrecked by one split beat.

## What `HeartRateManager` Produces

It produces three related outputs:

### 1. `beatDetected`

This is a real-time "pulse just happened" boolean.

Used for:

- `beatTick`

### 2. `ibiHistory`

Short rolling history of accepted IBIs.

Used for:

- live BPM

### 3. `ibiSamples`

Persisted IBI samples for the current measurement window:

```ts
interface IbiSample {
  offsetMs: number;
  ibiMs: number;
  signalQuality: number | null;
}
```

Used historically for:

- HRV

Used currently for:

- still returned in `CaptureResult`
- useful as telemetry / debug data
- no longer the primary source for final HRV

## How Live BPM Is Calculated

`HeartRateManager.getCurrentBpm()`:

1. requires at least 3 accepted recent IBIs
2. takes the median of the recent rolling IBI history
3. returns `60000 / medianIbi`
4. clamps to a sane BPM range

So live BPM is:

- median-based
- streaming
- based on the rolling accepted IBI window

That makes it pretty good for a live number.

It does **not** mean it is the best source for final HRV.

## `useLivePulse.ts`

`useLivePulse.ts` is the exercise/live-session orchestrator around
`HeartRateManager`.

It:

- starts/stops the stream
- runs the frame processor at target FPS
- calls `heartRatePlugin(frame)`
- validates the returned `PpgFrameSample`
- feeds it to `HeartRateManager`
- applies the selected publication and presentation profile
- owns measurement and persisted BPM sample windows
- coordinates suspend/resume lifecycle for exercise sessions
- updates:
  - `fingerPlacement`
  - `beatTick`
  - `currentBpm`

The manager owns signal classification, beat detection, and the raw live BPM
estimate. The hook owns when that estimate is published, how it is presented,
and which samples belong to an exercise measurement.

## Capture Flow Architecture

Standalone Quick and Full measurements live in `useHeartRateCapture.ts`. Their
durations and sensor-rate preferences are defined in `captureModes.ts`.

It is a state machine around:

- camera setup
- finger placement gate
- measurement timer
- live streaming feedback during capture
- final result generation

## Capture States

Important states:

- `camera_check`
- `measuring`
- `processing`
- `done`
- `error`

### `camera_check`

The app watches the signal and waits until the finger has been `good` long enough.

Current code waits for:

- `MIN_GOOD_DURATION_MS = 2500`

Only then does it start the actual timed measurement window.

### `measuring`

During measurement:

- every valid `PpgFrameSample` is stored in `samplesRef`
- the same sample is also fed into `HeartRateManager`
- so the user still gets:
  - live pulse ticks
  - live BPM updates

This means one capture session collects:

- the raw batch sample buffer
- the live manager’s IBI stream

Both are available at the end.

## Boundary Handling At Measurement Start

When `measuring` starts, `useHeartRateCapture.ts` calls:

- `managerRef.current.beginMeasurementWindow(measurementStartTs)`

This is an important detail.

It means:

- the warmed streaming detector is preserved
- but `ibiSamples` for the persisted measurement window are reset
- and the first boundary-crossing IBI is skipped

Why:

- you want a warm detector for a good live start
- but you do **not** want the setup->measurement transition to pollute HRV data

## Final Capture Result

When the measurement finishes, `useHeartRateCapture.ts` calls:

```ts
buildCaptureResult(samples, mode, {
  fallbackIbiSamples,
  presentationBpmSamples,
})
```

Where:

- `samples` = every stored `PpgFrameSample` from the selected capture window
- `mode` = `quick` or `full`
- `presentationBpmSamples` = BPM values actually accepted by the live UI path
- `fallbackIbiSamples` = live manager intervals retained as a guarded fallback

These inputs are intentionally used differently by Quick and Full modes.

## Full-Mode Final BPM Path

Full-mode final BPM comes from:

- `computeBPM(samples)` in `signalProcessing.ts`

This is the **batch estimator**.

It is more sophisticated than the live manager.

### What `computeBPM(samples)` does

1. Build candidate time series for many combinations of:
   - ROI
   - channel

Current channels considered:

- `weighted`
- `red`
- `green`
- `redRatio`

2. For each candidate:
   - collect ordered timestamps and values
   - reject obviously bad dark/saturated frames

3. Resample to a uniform sample rate

4. Preprocess:
   - moving baseline
   - AC/DC normalization
   - winsorization
   - slow detrend
   - smoothing

5. Estimate frequency-domain BPM
   - Goertzel-based scan across plausible pulse frequencies
   - harmonic scoring
   - SNR calculation

6. Run independent peak estimation

7. Require enough confidence / agreement

8. Rank candidates and choose a consensus estimate

So Full-mode final BPM is not just:

- "take the live BPM at the end"

It is:

- "analyze the whole capture offline, across multiple ROI/channel candidates, and choose a robust pulse-rate estimate"

That is why Full-mode final BPM and live BPM are different architectural
products. Quick mode intentionally promotes the validated live presentation
reading instead.

## Full-Mode HRV Path

Full-mode HRV comes from:

- `extractBestCaptureBeatSeries(samples)` in `signalProcessing.ts`
- then `computeHRVStats(ibiMs)` in `hrv.ts`

This is the recent architectural change.

### What changed

Before:

- HRV mainly depended on `HeartRateManager.getIbiSamples()`

Now:

- HRV depends on a **batch-selected beat series** derived from the final capture samples

That means Full-mode HRV is tied to the same rich batch analysis family as
Full-mode final BPM, instead of depending on the streaming detector’s persisted
IBIs.

### What `extractBestCaptureBeatSeries(samples)` does

It reuses the same candidate-analysis machinery as `computeBPM`, but instead of stopping at "what is the pulse rate?", it keeps the best candidate’s peak series.

Step by step:

1. Build ROI/channel candidates
2. Analyze each candidate with the batch pipeline
3. Keep only candidates that:
   - have good enough SNR
   - pass lighting stability
   - pass peak agreement
   - have actual detected peaks
4. Rank those candidates
5. Pick the best one
6. Convert its detected peaks into:
   - beat timestamps
   - `ibiMs`

That output is:

```ts
interface CaptureBeatSeries {
  beatTimestamps: number[];
  ibiMs: number[];
  roiId: string;
  channel: PpgChannel;
  confidence: number;
  quality: PpgQuality;
  snrDb: number;
  frequencyBpm: number;
  peakBpm: number;
}
```

## Why This Is Better For HRV

HRV does not care mainly about rough average rate.
It cares about:

- exact beat spacing
- consistency of beat detection
- avoiding missed beats
- avoiding double-counted beats

The batch beat-series path is better for that because it:

- searches multiple ROI/channel candidates
- uses batch resampling
- uses a stronger preprocessing chain
- requires candidate-level quality and agreement

The old live IBI path is still useful, but it is optimized for streaming constraints, not for best-possible final HRV extraction.

## `computeHRVStats(ibiMs)`

Once the final HRV IBI list exists, the math itself is simple and pure.

`src/lib/hrv.ts` computes:

- `RMSSD`
- `SDNN`
- `pNN50`
- mean/min/max HR
- HR drop
- duration
- beat count

This file is intentionally not where the hard signal-quality logic lives.

That is a good separation:

- `signalProcessing.ts` decides which beats are believable
- `hrv.ts` does the math on the chosen IBI series

## The Most Important Architectural Difference

If you remember one thing, remember this:

### Live path

`HeartRateManager`

- one streaming aggregated signal
- causal filtering
- real-time peak detection
- rolling median BPM
- good for responsiveness

### Full-mode final BPM path

`computeBPM(samples)`

- multi-ROI
- multi-channel
- batch resampling
- spectral estimate + peak estimate + candidate ranking
- good for robust final BPM

### Full-mode final HRV path

`extractBestCaptureBeatSeries(samples)` -> `computeHRVStats(ibiMs)`

- same batch candidate family as final BPM
- but preserves beat timestamps / intervals
- good for final RMSSD / SDNN

## Why Full-Mode BPM And HRV Still Use Different Final Functions

This is a subtle but important point.

Even though Full-mode BPM and HRV both come from the batch world, they use
**different final products**:

- Full-mode BPM uses `computeBPM(samples)`
- Full-mode HRV uses `extractBestCaptureBeatSeries(samples)`

Why not force both to be exactly the same function?

Because they answer different questions:

- Full-mode BPM: "what is the most robust estimate of pulse rate over this capture?"
- Full-mode HRV: "what is the best beat-to-beat interval series we can extract from this capture?"

Sometimes those align perfectly.
Sometimes the best "rate estimate" and the best "beat series" are not identical optimization targets.

So the architecture intentionally allows:

- one batch function to optimize for Full-mode final BPM
- another batch function to optimize for HRV beat intervals

That is a reasonable design.

## What Still Uses `ibiSamples`

`ibiSamples` from `HeartRateManager` are still passed through `CaptureResult`.

They are still useful because they preserve:

- the live detector’s interval stream
- offset times
- per-beat `signalQuality`

That makes them helpful for:

- debugging
- comparisons
- future analytics

But they are no longer the primary truth source for final HRV metrics.

## Where The User-Visible Outputs Come From Today

### Live pulse animation

Source:

- `HeartRateManager.processFrame(...)`
- `frameState.beatDetected`

### Live BPM number

Source:

- `HeartRateManager.getCurrentBpm()`

### Final BPM number

Source:

- Quick: validated live presentation BPM samples
- Full: `computeBPM(samples)` through `analyzeCapture(samples)`

### Final RMSSD / SDNN

Source:

- `extractBestCaptureBeatSeries(samples)`
- `computeHRVStats(ibiMs)`

## Why The Current Design Is Reasonable

The stack is intentionally split by runtime needs:

### Streaming path strengths

- cheap enough to run continuously
- low latency
- works frame by frame
- immediate UI feedback

### Batch path strengths

- can compare many candidates
- can resample uniformly
- can reject weak candidates globally
- better for final trust

Trying to force everything through only the live path would hurt final quality.
Trying to force everything through only the batch path would hurt live responsiveness.

So the split is justified.

## Current Tradeoffs / Limitations

The current architecture is better than a single shared simplistic pipeline, but it still has tradeoffs:

1. Live BPM and Full-mode final BPM can differ.
   That is expected because they are different estimators. Quick mode uses the
   validated live presentation readings for its final BPM.

2. Live beat ticks can fire on peaks that never become trusted HRV intervals.
   Also expected. Live UI favors responsiveness.

3. Full-mode final BPM and HRV are from the same batch family, but not from one
   single unified "reading object".
   That is okay, but future work could unify them more tightly if needed.

4. The live detector still uses a simpler single aggregated signal.
   That is probably the biggest remaining architecture gap on the live side.

## If You Want To Improve Accuracy Further

The biggest next architectural improvements would be:

1. Make the batch beat-series extractor even more explicit as a first-class final-capture module.

2. Add clearer debug telemetry per capture:
   - chosen ROI
   - chosen channel
   - beat count
   - rejected candidate count
   - confidence / SNR

3. Potentially let Full-mode final BPM derive from the same chosen beat series
   when that proves more stable on device testing.

4. Improve live-path candidate selection if live BPM becomes a priority.

## Short Version

If you want the simplest possible summary:

- The native plugin turns camera frames into small ROI color summaries with real frame timestamps.
- The live detector (`HeartRateManager`) turns those summaries into:
  - finger placement
  - beat ticks
  - live BPM
  - a streaming IBI list
- Quick final BPM comes from validated live presentation readings.
- Full final BPM uses stored capture samples for stronger batch analysis.
- Full HRV comes from a best ROI/channel batch beat series via
  `extractBestCaptureBeatSeries(samples)`.

That is the core architecture.
