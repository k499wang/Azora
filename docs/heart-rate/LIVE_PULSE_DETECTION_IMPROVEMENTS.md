# Live Heart Rate Pulse Detection — Accuracy Improvements

> **Scope:** This document targets **live BPM detection and UI pulsing only**.  
> **Out of scope:** Final HRV calculations, capture result post-processing, and RMSSD/SDNN derivations. Those are intentionally kept strict and are not modified here.

---

## Table of Contents

1. [The Cold Finger Problem](#1-the-cold-finger-problem)
2. [Immediate Parameter Tweaks (High Impact, Low Risk)](#2-immediate-parameter-tweaks-high-impact-low-risk)
3. [Signal Processing Improvements](#3-signal-processing-improvements)
4. [Native Frame Processor Enhancements](#4-native-frame-processor-enhancements)
5. [Adaptive Sensitivity Mode](#5-adaptive-sensitivity-mode)
6. [BPM Smoothing & Display Improvements](#6-bpm-smoothing--display-improvements)
7. [Camera & Hardware Optimizations](#7-camera--hardware-optimizations)
8. [Frame Rate & Timing Improvements](#8-frame-rate--timing-improvements)
9. [Noise Resilience Improvements](#9-noise-resilience-improvements)
10. [Implementation Priority](#10-implementation-priority)
11. [What NOT to Change](#11-what-not-to-change)
12. [References](#12-references)

---

## 1. The Cold Finger Problem

When fingers are cold, peripheral vasoconstriction reduces blood flow to fingertips. This causes:

| Symptom | Cause | Effect on Detection |
|---------|-------|---------------------|
| Weak PPG signal amplitude | Less blood volume change per beat | Signal drops below `MIN_AMPLITUDE` threshold |
| Low signal-to-noise ratio | Small AC component vs. noise | Peaks get lost in noise floor |
| Darker ROI readings | Less light transmission through tissue | `classifyFrame()` returns `no_finger` or `too_much_pressure` |
| Reduced red dominance | Less oxygenated blood absorption | `redToSum` and `redToMax` checks fail |
| Jagged waveform | Poor perfusion creates irregular peaks | Peak detector misses or double-counts |
| Signal dropouts | Intermittent perfusion | Frequent re-initialization of filters |

The current detector is tuned for **good perfusion** (warm fingers, good pressure). It needs to gracefully degrade for **poor perfusion** without becoming unstable.

> **Source:** Multiple studies confirm cold-induced PPG amplitude reduction. Elgendi et al. [1] note that "the reduction of PPG amplitude can be directly attributable ... to constriction of the arterioles perfusing the skin" and that "the peripheral blood flow will be influenced by sympathetic activity as well as temperature variations." A 2021 study by Khandan et al. [2] found "a statistically significant decrease" in PPG amplitude following localized cooling, consistent with the volumetric and capillary mechanical movement models of PPG signal generation.

---

## 2. Immediate Parameter Tweaks (High Impact, Low Risk)

These are one-line changes in `src/lib/heartRate/heartRateManager.ts` with immediate effect.

### 2.1 Lower the Minimum Amplitude Threshold

Cold fingers produce 3–5× weaker AC signals. The current floor rejects valid but weak pulses.

```typescript
// In heartRateManager.ts, line 22 — BEFORE:
const MIN_AMPLITUDE = 0.001;

// AFTER:
const MIN_AMPLITUDE = 0.0003;
```

**Rationale:** A weak but consistent pulse should still trigger beats. The peak detector's adaptive threshold and refractory period already guard against noise. Elgendi et al. [1] explicitly state that "detecting the heart beats in low amplitude PPG signals is considered difficult" — lowering the floor is the first step in addressing this.

---

### 2.2 Faster Amplitude Envelope Tracking

The amplitude estimate needs to adapt quicker when signal strength changes (e.g., finger warming up during measurement).

```typescript
// In heartRateManager.ts, line 16 — BEFORE:
const AMPLITUDE_ALPHA = 0.05;

// AFTER:
const AMPLITUDE_ALPHA = 0.10;
```

**Rationale:** With cold fingers, the signal can strengthen mid-session as tissue warms from the flashlight. Faster tracking catches this improvement sooner.

---

### 2.3 Lower Peak Detection Thresholds

The current threshold starts at 40% of amplitude and decays to 30%. For weak signals, this is too high.

```typescript
// In heartRateManager.ts, line 17 — BEFORE:
const INITIAL_PEAK_THRESHOLD_FACTOR = 0.4;

// AFTER:
const INITIAL_PEAK_THRESHOLD_FACTOR = 0.25;

// Line 18 — BEFORE:
const ADAPTIVE_THRESHOLD_BASE_FACTOR = 0.3;

// AFTER:
const ADAPTIVE_THRESHOLD_BASE_FACTOR = 0.18;
```

**Rationale:** A peak at 25% of the amplitude envelope is still well above noise for a band-passed signal. The floor at 18% prevents detecting pure noise. Lee et al. [3] demonstrate that adaptive thresholding methods (DATPD) with lower relative thresholds significantly outperform fixed-threshold approaches for real-time PPG peak detection.

---

### 2.4 Shorter Warmup Period

When signal drops and recovers (common with cold fingers), the 2-second warmup feels like a dead zone.

```typescript
// In heartRateManager.ts, line 30 — BEFORE:
const WARMUP_FRAMES = 60; // ~2 seconds at 30fps

// AFTER:
const WARMUP_FRAMES = 30; // ~1 second at 30fps
```

**Rationale:** The band-pass filter priming and baseline convergence happen quickly. 1 second is sufficient for the filter to settle, especially with the re-priming logic already in place.

---

### 2.5 Allow Faster Short-IBI Confirmation

Cold fingers can have slightly faster apparent heart rates due to vasoconstriction. The deferral window for short IBIs should be tighter.

```typescript
// In heartRateManager.ts, line 28 — BEFORE:
const SHORT_IBI_CONFIRMATION_MS = 360;

// AFTER:
const SHORT_IBI_CONFIRMATION_MS = 320;
```

**Rationale:** This matches `MIN_IBI_MS` more closely, reducing false dicrotic-notch rejection at the lower bound.

---

### 2.6 Soften Finger Placement Classifier

Cold fingers fail the current coverage and darkness checks. Relax these while keeping safety bounds.

```typescript
// In classifyFrame() — lines 219-228 — BEFORE:
if (avgDark > 0.45 || weightedAverage < 12) {
  return { placement: 'too_much_pressure', weightedAverage };
}
if (coverage < 0.35) {
  return { placement: 'no_finger', weightedAverage };
}
if (avgSaturated > 0.55 || coverage < 0.70) {
  return { placement: 'partial', weightedAverage };
}

// AFTER:
if (avgDark > 0.55 || weightedAverage < 8) {
  return { placement: 'too_much_pressure', weightedAverage };
}
if (coverage < 0.25) {
  return { placement: 'no_finger', weightedAverage };
}
if (avgSaturated > 0.60 || coverage < 0.60) {
  return { placement: 'partial', weightedAverage };
}
```

**Rationale:** Cold fingers are genuinely darker and have less red dominance. These new thresholds still reject obviously wrong states (complete darkness, massive saturation) but allow marginal cases through as `partial` or `good`. Research on ice-water immersion PPG [4] showed "an increase in the DC PPG levels, and a decrease in the pulse amplitude," confirming that cold fingers produce characteristically different optical signatures.

---

### 2.7 Relax Per-ROI Coverage Check

The `isRoiCovered` function is the gatekeeper. Cold fingers often fail `redToSum >= 0.58`.

```typescript
// In isRoiCovered() — lines 181-191 — BEFORE:
function isRoiCovered(roi: PpgRoiSample): boolean {
  const value = weightedChannelValue(roi);
  return (
    value >= 25 &&
    value <= 245 &&
    roi.darkPct < 0.35 &&
    roi.saturatedPct < 0.45 &&
    redToSum(roi) >= 0.58 &&
    redToMax(roi) >= 1.08
  );
}

// AFTER:
function isRoiCovered(roi: PpgRoiSample): boolean {
  const value = weightedChannelValue(roi);
  return (
    value >= 15 &&          // Was 25 — cold fingers are dimmer
    value <= 250 &&         // Was 245 — allow slightly brighter
    roi.darkPct < 0.45 &&   // Was 0.35 — cold fingers read darker
    roi.saturatedPct < 0.50 && // Was 0.45
    redToSum(roi) >= 0.50 &&   // Was 0.58 — less red absorption when cold
    redToMax(roi) >= 1.03      // Was 1.08
  );
}
```

**Rationale:** These are still well above noise levels. A `redToSum` of 0.50 means red is still the dominant channel (≥50% of total light), which is true for blood-perfused tissue even when cold. Khandan et al. [2] observed that cold stress produces "the strongest effects" in finger PPG compared to other measurement sites.

---

## 3. Signal Processing Improvements

### 3.1 Add a Notch Filter for 50/60 Hz Fluorescent Flicker

Indoor lighting flicker creates narrowband noise that the current band-pass doesn't fully reject. Add a biquad notch at 60 Hz (US) / 50 Hz (EU).

```typescript
// Add to heartRateManager.ts:
const NOTCH_FREQ_HZ = 60; // or 50 for EU devices

function designNotch(fs: number, f0: number, bandwidthHz: number = 5): BiquadCoeffs {
  const w0 = (2 * Math.PI * f0) / fs;
  const cosw = Math.cos(w0);
  const sinw = Math.sin(w0);
  const alpha = sinw * Math.sinh((Math.log(2) / 2) * bandwidthHz * (w0 / sinw));
  const a0 = 1 + alpha;
  return {
    b0: 1 / a0,
    b1: (-2 * cosw) / a0,
    b2: 1 / a0,
    a1: (-2 * cosw) / a0,
    a2: (1 - alpha) / a0,
  };
}

// In HeartRateManager class, add:
private readonly notch = new Biquad(designNotch(SAMPLE_RATE_HZ, NOTCH_FREQ_HZ));

// In processFrame(), before band-pass:
const notched = this.notch.process(weightedAverage);
const hp = this.bpHp.process(notched);
```

**Rationale:** Analog Devices [5] note that "indoor lights may flicker with fundamental frequencies at 50Hz or 60Hz. This rate is close to the frequency at which PPG signals are sampled. Left uncorrected, ambient flicker can produce a different bias offset for each sample." Advanced PPG ICs like the MAX30112 include "correlated sampling techniques designed specifically to attenuate any 50Hz/60Hz flickering components."

---

### 3.2 Use Green Channel as Fallback for Weak Red Signals

When `redToSum` is marginal, the green channel often retains better pulsatility because hemoglobin absorption at green wavelengths (~540nm) is strong and less sensitive to oxygenation changes.

```typescript
// Add to classifyFrame or as a channel selector:
function selectBestChannel(rois: PpgRoiSample[]): { value: number; channel: 'red' | 'green' | 'weighted' } {
  const weighted = rois.map(weightedChannelValue);
  const red = rois.map((r) => r.r);
  const green = rois.map((r) => r.g);

  // Compute coefficient of variation (pulsatility proxy) for each
  const cv = (values: number[]) => stdDev(values) / mean(values);

  const weightedCv = cv(weighted);
  const redCv = cv(red);
  const greenCv = cv(green);

  if (greenCv > redCv * 1.2 && greenCv > weightedCv * 1.1) {
    return { value: mean(green), channel: 'green' };
  }
  if (redCv > weightedCv * 1.1) {
    return { value: mean(red), channel: 'red' };
  }
  return { value: mean(weighted), channel: 'weighted' };
}
```

**Rationale:** Green PPG is the standard in wearables for good reason. Charlton et al. [6] state that "green light has been found to provide a higher signal-to-noise ratio than red or infrared light in reflectance photoplethysmography, and to be more robust to change in temperature." A 2024 camera-PPG study [7] confirmed that "deoxyhemoglobin and oxyhemoglobin have significantly higher light absorption in the green spectrum (540 nm) than red light."

---

### 3.3 Add Signal Quality Metric to Frame Output

Expose a per-frame signal quality score so the UI can show "weak signal — hold tighter/warm hands" instead of just "lost".

```typescript
// In HeartRateFrameState:
export interface HeartRateFrameState {
  fingerPlacement: FingerPlacementState;
  beatDetected: boolean;
  readyForMeasurement: boolean;
  signalText: string;
  signalQuality: number; // 0-1, new field
  amplitude: number;     // normalized AC amplitude, new field
}
```

**Rationale:** Users with cold fingers often don't know *why* the signal is lost. A quality metric enables better UX guidance.

---

## 4. Native Frame Processor Enhancements

### 4.1 Add Per-ROI Signal Quality Score

Compute a pulsatility metric (variance/mean) for each ROI and return it. This lets the JS side pick the best ROI instead of averaging all 7.

```swift
// In HeartRatePlugin.swift, in sampleROI return dict:
"signalQuality": Double(variance / max(yMean, 1.0)),
"yMean": Double(yMean),
```

Then update `PpgRoiSample` type:

```typescript
export interface PpgRoiSample {
  id: string;
  r: number;
  g: number;
  b: number;
  saturatedPct: number;
  darkPct: number;
  variance: number;
  signalQuality: number; // NEW: variance / yMean
  yMean: number;         // NEW: raw luminance
}
```

---

### 4.2 ROI Selection Strategy for Cold Fingers

Instead of averaging all ROIs, pick the ROI with the best signal quality:

```typescript
function selectBestRoi(rois: PpgRoiSample[]): PpgRoiSample {
  // Filter to ROIs that pass a relaxed coverage check
  const valid = rois.filter((roi) =>
    roi.yMean >= 15 &&
    roi.yMean <= 250 &&
    roi.darkPct < 0.50 &&
    roi.saturatedPct < 0.55
  );

  if (valid.length === 0) return rois[0]; // fallback

  // Pick ROI with highest signalQuality (pulsatility)
  return valid.reduce((best, roi) =>
    (roi.signalQuality ?? 0) > (best.signalQuality ?? 0) ? roi : best
  );
}
```

Then in `classifyFrame`, use `selectBestRoi(sample.rois)` instead of averaging all.

**Rationale:** When fingers are cold, the center/inner ROIs often have better contact and signal than the edges. Averaging dilutes the good signal with bad.

---

### 4.3 Increase Camera Exposure for Cold Fingers

The current exposure is locked at 2.0 EV. Cold fingers need more light penetration.

```typescript
// In useHeartRateCameraControls.ts or native side:
// Increase torch brightness or exposure duration for cold finger mode
```

In the native `HeartRateCameraControls.m`, add:

```objc
// Set higher torch level when available
if (device.hasTorch && device.torchAvailable) {
  [device setTorchModeOnWithLevel:0.8 error:nil]; // Was default (1.0 is max)
}
```

**Note:** iOS limits max torch brightness to prevent overheating. 0.8 is a safe sustained level. Some devices support higher in burst mode.

---

## 5. Adaptive Sensitivity Mode

### 5.1 Auto-Detect Low Signal and Lower Thresholds

Track signal characteristics over time and automatically enter a "cold finger" mode:

```typescript
// Add to HeartRateManager class:
private lowSignalFrameCount = 0;
private coldFingerMode = false;
private readonly COLD_FINGER_ENTRY_FRAMES = 90; // 3 seconds at 30fps
private readonly COLD_FINGER_EXIT_FRAMES = 150; // 5 seconds to exit

// In processFrame(), after amplitude update:
const isMarginalSignal = this.amplitude > MIN_AMPLITUDE && this.amplitude < MIN_AMPLITUDE * 5;

if (isMarginalSignal && placement !== 'no_finger') {
  this.lowSignalFrameCount++;
  if (this.lowSignalFrameCount >= this.COLD_FINGER_ENTRY_FRAMES) {
    this.coldFingerMode = true;
  }
} else if (this.amplitude >= MIN_AMPLITUDE * 5) {
  this.lowSignalFrameCount = Math.max(0, this.lowSignalFrameCount - 1);
  if (this.lowSignalFrameCount <= this.COLD_FINGER_ENTRY_FRAMES - this.COLD_FINGER_EXIT_FRAMES) {
    this.coldFingerMode = false;
  }
} else {
  this.lowSignalFrameCount = 0;
  this.coldFingerMode = false;
}
```

Then use `coldFingerMode` to adjust peak detection:

```typescript
// In adaptivePeakThreshold():
const effectiveInitialFactor = this.coldFingerMode
  ? INITIAL_PEAK_THRESHOLD_FACTOR * 0.7
  : INITIAL_PEAK_THRESHOLD_FACTOR;

const effectiveBaseFactor = this.coldFingerMode
  ? ADAPTIVE_THRESHOLD_BASE_FACTOR * 0.7
  : ADAPTIVE_THRESHOLD_BASE_FACTOR;
```

**Rationale:** This creates a self-tuning system. When the detector sees consistently weak but present signal, it automatically becomes more sensitive. When signal improves, it returns to normal thresholds. Lee et al. [3] demonstrate that multi-stage adaptive algorithms (combining WEPD and DATPD) with automatic mode switching achieve the lowest RMSE for real-time PPG heart rate estimation.

---

### 5.2 Adaptive Bad-Placement Grace Period

Extend the grace period when in cold-finger mode:

```typescript
// In processFrame(), in the bad-placement handling:
const effectiveGraceMs = this.coldFingerMode
  ? BAD_PLACEMENT_GRACE_MS * 2  // 1000ms instead of 500ms
  : BAD_PLACEMENT_GRACE_MS;

if (sample.timestamp - this.badPlacementSinceTs <= effectiveGraceMs) {
  // ... keep previous placement
}
```

**Rationale:** Cold fingers create more micro-movements and pressure variations. A longer grace period prevents constant re-initialization.

---

## 6. BPM Smoothing & Display Improvements

### 6.1 Allow Faster BPM Recovery After Dropouts

The current jump clamp of 8 BPM can feel sluggish when the detector recovers from missed beats.

```typescript
// In bpmSmoothing.ts, line 21 — BEFORE:
const MAX_SAMPLE_JUMP_BPM = 8;

// AFTER:
const MAX_SAMPLE_JUMP_BPM = 12;
```

**Rationale:** A 12 BPM jump is still physiologically plausible (e.g., standing up, stress response). The median-based IBI history in `getCurrentBpm()` already smooths noise.

---

### 6.2 Predictive Beat Timing for UI Pulsing

Instead of only pulsing on detected beats, predict the next beat based on the current IBI and pulse the UI proactively:

```typescript
// In hooks (useHeartRateCapture, useHeartRateStream, useLivePulse):
const predictedBeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  if (beatTick <= 0) return;

  // Clear previous prediction
  if (predictedBeatTimerRef.current) {
    clearTimeout(predictedBeatTimerRef.current);
  }

  const bpm = currentBpmRef.current;
  if (bpm == null || bpm < 40) return;

  const expectedIbiMs = 60000 / bpm;

  // Schedule next predicted pulse
  predictedBeatTimerRef.current = setTimeout(() => {
    // Only pulse if no real beat arrived in the meantime
    setBeatTick((tick) => tick + 1);
  }, expectedIbiMs);

  return () => {
    if (predictedBeatTimerRef.current) {
      clearTimeout(predictedBeatTimerRef.current);
    }
  };
}, [beatTick]);
```

**Rationale:** When a beat is missed due to weak signal, the UI still pulses at the expected interval. This masks transient dropouts and feels more responsive. The prediction is overridden by real beats, so it self-corrects.

---

### 6.3 Beat Confidence-Based Pulse Intensity

Scale the pulse animation intensity by beat confidence:

```typescript
// In HeartRateFrameState, add:
beatConfidence: number; // 0-1

// In UI components, scale animation:
const pulseIntensity = 0.5 + beatConfidence * 0.5; // 0.5 to 1.0
```

**Rationale:** A weak beat gets a gentler pulse, a strong beat gets a full pulse. This gives visual feedback about signal quality.

---

## 7. Camera & Hardware Optimizations

### 7.1 Use Maximum Torch Brightness

The current code turns torch on but doesn't set level. Some iPhones support higher sustained brightness.

```swift
// In HeartRateCameraControls.swift, in lockForHeartRate:
if device.hasTorch && device.isTorchAvailable {
  do {
    try device.setTorchModeOn(level: 0.8)
  } catch {
    device.torchMode = .on // fallback
  }
}
```

**Rationale:** More light = better SNR, especially for cold fingers where tissue absorption is lower. However, iOS enforces thermal limits — 0.8 is a safe sustained level.

---

### 7.2 Lock ISO/Gain in Addition to Exposure

The current code locks focus and white balance but not ISO. Auto-ISO can create gain noise.

```swift
// In HeartRateCameraControls.swift:
if device.isExposureModeSupported(.locked) {
  device.exposureMode = .locked
}
```

**Note:** This requires setting a specific exposure target before locking. The current code locks at 2.0 EV which is good.

---

### 7.3 Consider 60 FPS for Higher Temporal Resolution

The current pipeline assumes 30 FPS. Doubling to 60 FPS improves peak timing accuracy and reduces missed beats between frames.

```typescript
// In useHeartRateCamera.ts:
const format = useCameraFormat(device, [
  { fps: 60 }, // Was 30
  { videoResolution: { width: 640, height: 480 } },
  // ...
]);
```

**Caveat:** This increases CPU load and battery drain. The band-pass filter coefficients would need updating for 60 Hz sample rate.

---

## 8. Frame Rate & Timing Improvements

### 8.1 Actual Frame Rate Detection

The pipeline hardcodes `SAMPLE_RATE_HZ = 30`, but actual camera frame rate can vary. Add runtime detection:

```typescript
// Add to HeartRateManager:
private actualSampleRate = 30;
private frameIntervalHistory: number[] = [];

// In processFrame():
if (this.lastGoodTs > 0) {
  const interval = sample.timestamp - this.lastGoodTs;
  this.frameIntervalHistory.push(interval);
  if (this.frameIntervalHistory.length > 30) {
    this.frameIntervalHistory.shift();
  }
  const medianInterval = medianOfRecent(this.frameIntervalHistory, 30);
  if (medianInterval > 0) {
    this.actualSampleRate = 1000 / medianInterval;
  }
}
```

Then use `actualSampleRate` for filter coefficient recalculation (if implementing dynamic filters) or at least for timing compensation.

---

### 8.2 Frame Timestamp Validation

Reject frames with suspicious timestamps (jumps, duplicates, backwards):

```typescript
// In processFrame(), early return:
if (this.lastGoodTs > 0) {
  const dt = sample.timestamp - this.lastGoodTs;
  if (dt <= 0 || dt > 500) { // backwards or >500ms gap
    // Handle as reinit case
    this.needsBandpassPrime = true;
  }
}
```

**Rationale:** Vision Camera sometimes delivers frames with jittery timestamps. Handling this explicitly prevents filter state corruption.

---

## 9. Noise Resilience Improvements

### 9.1 Motion Artifact Detection

Detect sudden motion (large frame-to-frame value jumps) and temporarily suspend beat detection:

```typescript
// Add to HeartRateManager:
private lastWeightedValue = 0;
private motionHoldoffFrames = 0;
private readonly MOTION_THRESHOLD = 0.15; // 15% jump
private readonly MOTION_HOLDOFF = 5; // frames

// In processFrame():
const valueChange = Math.abs(weightedAverage - this.lastWeightedValue) / Math.max(this.lastWeightedValue, 1);
if (valueChange > MOTION_THRESHOLD) {
  this.motionHoldoffFrames = MOTION_HOLDOFF;
}
this.lastWeightedValue = weightedAverage;

if (this.motionHoldoffFrames > 0) {
  this.motionHoldoffFrames--;
  // Skip beat detection this frame
  return {
    fingerPlacement: placement,
    beatDetected: false,
    readyForMeasurement,
    signalText: 'Hold steady...',
  };
}
```

**Rationale:** Motion creates step changes that look like peaks. Lee et al. [3] use a 3-second motion artifact detection threshold as a first step in their SWEPD method, noting that "motion artifacts in PPG signals can lead to incorrect peak detection."

---

### 9.2 Multi-Frame Peak Confirmation

Require a peak to be present in 2 of 3 consecutive frames before accepting:

```typescript
// Add to HeartRateManager:
private peakCandidateTs: number | null = null;
private peakCandidateCount = 0;

// In the peak detection section:
if (isPeak) {
  if (this.peakCandidateTs != null && Math.abs(rawPeakTs - this.peakCandidateTs) < 50) {
    this.peakCandidateCount++;
  } else {
    this.peakCandidateTs = rawPeakTs;
    this.peakCandidateCount = 1;
  }

  if (this.peakCandidateCount >= 2) {
    // Proceed with normal peak handling
    this.peakCandidateTs = null;
    this.peakCandidateCount = 0;
    // ... rest of peak logic
  }
}
```

**Rationale:** Single-frame noise spikes are common with weak signals. Requiring confirmation in adjacent frames dramatically reduces false positives.

---

### 9.3 Dynamic Baseline Alpha

Use faster baseline tracking when signal is changing rapidly (cold finger warmup):

```typescript
// In processFrame():
const baselineAlpha = this.coldFingerMode
  ? BASELINE_ALPHA * 2  // 0.04 — faster DC tracking
  : BASELINE_ALPHA;

this.baseline += baselineAlpha * (weightedAverage - this.baseline);
```

**Rationale:** Cold fingers warm up during measurement, changing the DC level. Faster baseline tracking prevents DC drift from distorting the AC signal.

---

## 10. Implementation Priority

### Phase 1: Quick Wins (1 day)
1. All parameter tweaks from Section 2
2. BPM jump clamp increase (Section 6.1)
3. Add signal quality to frame state (Section 3.3)

### Phase 2: Signal Processing (2-3 days)
4. Green channel fallback (Section 3.2)
5. Adaptive sensitivity mode (Section 5)
6. Motion artifact detection (Section 9.1)

### Phase 3: Native & Hardware (3-5 days)
7. ROI signal quality + selection (Section 4.1, 4.2)
8. Torch brightness control (Section 7.1)
9. Notch filter (Section 3.1)

### Phase 4: Advanced (1-2 weeks)
10. Predictive beat timing (Section 6.2)
11. 60 FPS support (Section 7.3)
12. Multi-frame peak confirmation (Section 9.2)

---

## 11. What NOT to Change

These are intentionally kept strict and should NOT be modified:

| Area | Why Protected |
|------|---------------|
| `MALIK_THRESHOLD` (0.2) | Outlier rejection for HRV — must remain strict |
| `IBI_HISTORY_SIZE` (8) | BPM median window — affects stability vs. responsiveness tradeoff |
| `MIN_LIVE_BPM_IBIS` (5) | Minimum IBIs before BPM display — prevents early false readings |
| `pushAcceptedIbi()` | IBI recording for final HRV — only clean beats go here |
| `ibiSamples` collection | Final HRV data — live detection can be lenient, this must be strict |
| `HRV_CAPTURE_OPTIONS` | Final capture analysis — higher thresholds are correct for medical-grade HRV |
| `cleanBeatSeries()` | HRV beat cleanup — Malik rule, interval bounds, adjacency tracking |
| `buildCaptureResult()` | Result assembly — depends on clean HRV pipeline |

The architecture already separates **live detection** (`beatDetected`, `getCurrentBpm()`) from **HRV recording** (`pushAcceptedIbi()`, `ibiSamples`). Improvements to live detection should not leak into the HRV path.

---

## 12. References

[1] Elgendi, M., et al. "On the Analysis of Fingertip Photoplethysmogram Signals." *Current Cardiology Reviews*, 2012.  
https://pmc.ncbi.nlm.nih.gov/articles/PMC3394104/

> Key findings: PPG amplitude reduction is directly attributable to constriction of arterioles perfusing the skin. Detecting heart beats in low amplitude PPG signals is considered difficult. Peripheral blood flow is influenced by sympathetic activity and temperature variations.

[2] Khandan, A., et al. "Photoplethysmography upon cold stress—impact of measurement site and recording setup." *Physiological Measurement*, 2023.  
https://pmc.ncbi.nlm.nih.gov/articles/PMC10267461/

> Key findings: Statistically significant decrease in PPG amplitude from baseline to cold stress (ST1) across all measurement sites. Finger PPG shows the strongest effects, attributed to marked vasoconstriction in the finger.

[3] Lee, J., et al. "A Real-Time PPG Peak Detection Method for Accurate Determination of Heart Rate during Sinus Rhythm and Cardiac Arrhythmia." *Sensors*, 2022.  
https://pmc.ncbi.nlm.nih.gov/articles/PMC8869811/

> Key findings: Proposed SWEPD method combining waveform envelope peak detection (WEPD) and differentiator-adaptive threshold peak detection (DATPD). Adaptive thresholding with motion artifact detection achieves lowest RMSE for real-time PPG heart rate estimation.

[4] Alzahrani, A., et al. "Investigation of finger reflectance photoplethysmography in response to local sympathetic stimulation." *Journal of Physics: Conference Series*, 2013.  
https://iopscience.iop.org/1742-6596/450/1/012012/pdf

> Key findings: During ice-water immersion, PPG recordings showed an increase in DC levels and a decrease in pulse amplitude. Vasoconstriction reduces the capacity for pulsatile expansion, contributing to a smaller signal.

[5] Analog Devices. "How Common Noise and Error Sources Affect Optical Biosensing." Application Note.  
https://www.analog.com/en/resources/design-notes/how-common-noise-and-error-sources-affect-optical-biosensing.html

> Key findings: Indoor lights flicker at 50Hz/60Hz fundamental frequencies, close to PPG sampling rates. Advanced PPG ICs (e.g., MAX30112) use correlated sampling to attenuate 50Hz/60Hz flicker components.

[6] Charlton, P. H., et al. "Wearable Photoplethysmography Devices." *Wearable Electronics*, 2021.  
https://peterhcharlton.github.io/publication/wearable_ppg_chapter/Wear_PPG_Chapter_20210323.pdf

> Key findings: Green light provides higher SNR than red or infrared in reflectance photoplethysmography and is more robust to temperature change. Apple Watches switch between infrared (rest) and green (exercise) LEDs.

[7] Zhang, Y., et al. "Optimization of Video Heart Rate Detection Based on Green Channel Analysis." *PMC*, 2024.  
https://pmc.ncbi.nlm.nih.gov/articles/PMC11769212/

> Key findings: Deoxyhemoglobin and oxyhemoglobin have significantly higher light absorption at green spectrum (540 nm) than red light. Green channel has higher SNR and detection advantage for camera-based PPG.

---

*Document version: 1.1*  
*Target: Live BPM detection and pulsing only*  
*HRV pipeline: intentionally untouched*
