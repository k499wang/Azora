# PPG Heart Rate System — Improvements Checklist

**Last updated:** 2026-05-07
**Status tracker for all recommended improvements from the technical audit**

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 | Critical — fix immediately |
| 🟡 | High — fix this sprint |
| 🟢 | Medium — fix when convenient |
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Done |

---

## Phase 1: Quick Wins (This Week)

### 🔴 C1 — Lock Camera Exposure and ISO
**File:** `ios/HeartRatePlugin.swift` (HeartRateCameraControls)

**Problem:** Auto-exposure hunts when finger covers lens, creating amplitude artifacts.

**Implementation:**
```swift
try device.lockForConfiguration()

if device.isWhiteBalanceModeSupported(.locked) {
    device.whiteBalanceMode = .locked
}
if device.isFocusModeSupported(.locked) {
    device.focusMode = .locked
}

// ADD THESE:
if device.isExposureModeSupported(.locked) {
    device.exposureMode = .locked
}

// Optional: set custom exposure for consistency
// let targetDuration = CMTimeMake(1, 60)
// let targetISO = min(max(200, device.activeFormat.minISO), device.activeFormat.maxISO)
// try? device.setExposureModeCustom(duration: targetDuration, iso: targetISO)

device.unlockForConfiguration()
```

**Impact:** Eliminates ~30-50% of amplitude artifacts  
**Effort:** 5 minutes  
**Risk:** Low  
**Status:** ⬜

---

### 🔴 C2 — Compensate Filter Group Delay in Live Path
**File:** `src/lib/heartRate/heartRateManager.ts`

**Problem:** Causal biquad bandpass delays signal by 50-80ms. Live haptic pulse feels delayed.

**Implementation:**
```typescript
// In processFrame(), after computing rawPeakTs:
const FILTER_GROUP_DELAY_MS = 65; // approximate

const rawPeakTs = this.prev2Ts > 0
  ? interpolatePeakTimestamp(this.prev2, this.prev1, ac, this.prev2Ts, this.prev1Ts, sample.timestamp)
  : this.prev1Ts;

const peakTs = rawPeakTs - FILTER_GROUP_DELAY_MS;
```

**Impact:** Removes systematic 50-80ms delay from live beat timing  
**Effort:** 10 minutes  
**Risk:** Very low  
**Status:** ⬜

---

### 🔴 C3 — Add Cubic Spline Upsampling to 180Hz
**File:** `src/lib/heartRate/signalProcessing.ts`

**Problem:** 30Hz native sampling creates ±16.7ms quantization error per beat.

**Implementation:** ✅ **DONE** — See `src/lib/heartRate/cubicSpline.ts`

```typescript
// Integrated into analyzeCandidate():
const upsampled = upsampleCubicSpline(
  resampled.values,
  resampledTimestamps,
  UPSAMPLE_TARGET_RATE, // 180 Hz
);
```

**Impact:** Reduces timing quantization from ±16.7ms to ±2.8ms  
**Effort:** 1-2 days  
**Risk:** Low  
**Status:** ✅ Done

---

### 🟡 H1 — Increase Measurement Duration to 60s
**File:** `src/hooks/useHeartRateCapture.ts`

**Problem:** 45s is below 60s minimum for reliable RMSSD.

**Implementation:**
```typescript
const CAPTURE_DURATION_MS = 60000; // was 45000
```

**Impact:** Reduces HRV metric variance by 20-30%  
**Effort:** 2 minutes  
**Risk:** Low (UI: update progress bar, messaging)  
**Status:** ⬜

---

### 🟡 H2 — Reduce Local Deviation Threshold from 20% to 35%
**File:** `src/lib/hrv.ts`

**Problem:** 20% threshold filters legitimate breathing-induced variation (RSA).

**Implementation:**
```typescript
// Change:
if (dev > 0.20 || devPrev > 0.20) continue;
// To:
if (dev > 0.35 || devPrev > 0.35) continue;
```

**Impact:** Prevents filtering of legitimate respiratory variation  
**Effort:** 5 minutes  
**Risk:** Low  
**Status:** ⬜

---

### 🟡 H3 — Remove IBI Interpolation for HRV
**File:** `src/lib/hrv.ts`

**Problem:** Linear interpolation of artifacts assumes constant heart rate, suppressing true variability.

**Implementation:**
```typescript
// In preprocessHRVIntervals:
return {
  correctedIbi: [...ibi], // Do NOT interpolate
  artifactIndices,
};

// In computeHRVStats, skip artifact pairs:
for (let i = 1; i < correctedIbi.length; i++) {
  if (adjacencyBreaks?.[i]) continue;
  if (artifactIndices?.includes(i) || artifactIndices?.includes(i - 1)) continue;
  // ... compute RMSSD from valid pairs only
}
```

**Impact:** Prevents artificial RMSSD suppression  
**Effort:** 2 hours  
**Risk:** Low  
**Status:** ⬜

---

## Phase 2: Signal Quality (Next 2 Weeks)

### 🟡 H4 — Replace Cascaded MAs with Butterworth Bandpass
**File:** `src/lib/heartRate/signalProcessing.ts`

**Problem:** Multiple moving averages compound group delay and smear peaks. Winsorize is non-linear.

**Implementation:**
```typescript
// Replace preprocess() with zero-phase Butterworth:
function preprocess(values: number[], sampleRate: number): number[] {
  const coeffs = designButterworthBandpass(sampleRate, 0.5, 4.0, 4);
  return zeroPhaseFilter(values, coeffs); // forward-backward
}
```

**Impact:** Cleaner signal, less distortion, known frequency response  
**Effort:** 1 day  
**Risk:** Low  
**Status:** ⬜

---

### 🟡 H5 — Fix Goertzel Frequency Resolution
**File:** `src/lib/heartRate/signalProcessing.ts`

**Problem:** 0.01Hz step gives apparent precision but actual resolution is ~0.125Hz (7.5 BPM).

**Options:**
1. Use periodogram/Welch with zero-padding
2. Accept 7.5 BPM quantization and smooth across windows
3. Increase window size to 12-16 seconds for finer resolution

**Impact:** Reduces artificial BPM jitter  
**Effort:** 2-4 hours  
**Risk:** Low  
**Status:** ⬜

---

### 🟢 M1 — Add Lens Switching Lock
**File:** `ios/HeartRatePlugin.swift`

**Problem:** iOS may switch from telephoto to ultrawide when finger covers lens.

**Implementation:**
```swift
if #available(iOS 15.0, *), 
   device.activePrimaryConstituentDeviceSwitchingBehavior != .unsupported {
    try device.lockForConfiguration()
    device.setPrimaryConstituentDeviceSwitchingBehavior(
        .locked, 
        restrictedSwitchingBehaviorConditions: [.all]
    )
    device.unlockForConfiguration()
}
```

**Impact:** Consistent behavior on multi-camera iPhones  
**Effort:** 2 hours  
**Risk:** Low  
**Status:** ⬜

---

### 🟢 M2 — Correct Rolling Shutter Timestamp
**File:** `ios/HeartRatePlugin.swift`

**Problem:** Frame timestamp is readout start, not exposure center (~16ms uncertainty).

**Implementation:**
```swift
let presentationTimestamp = CMSampleBufferGetPresentationTimeStamp(frame.buffer)
let seconds = CMTimeGetSeconds(presentationTimestamp)
let exposureDuration = CMTimeGetSeconds(device.exposureDuration)
let frameDuration = 1.0 / 30.0
let midExposureTime = seconds - exposureDuration * 0.5 + frameDuration * 0.5
return midExposureTime * 1000
```

**Impact:** Reduces ~16ms timing uncertainty  
**Effort:** 1 hour  
**Risk:** Low  
**Status:** ⬜

---

## Phase 3: Robustness (Weeks 3-4)

### 🟢 M3 — Add Skin Tone Validation
**File:** `src/lib/heartRate/fingerQuality.ts`

**Problem:** Absolute intensity thresholds may fail for darker skin tones.

**Implementation:**
- Test coverage across Fitzpatrick types I-VI
- Consider relative thresholds (percentile-based) instead of absolute
- Add skin tone detection or user self-report

**Impact:** Equitable accuracy across users  
**Effort:** 1-2 days  
**Risk:** Low  
**Status:** ⬜

---

### 🟢 M4 — Reduce Camera Resolution for PPG Processing
**File:** `src/hooks/useHeartRateCamera.ts`

**Problem:** 640×480 is higher than needed and increases processing load.

**Implementation:**
```typescript
const format = useCameraFormat(device, [
  { fps: 30 },
  { videoResolution: { width: 320, height: 240 } }, // was 640×480
  { videoHdr: false },
  { photoHdr: false },
  { videoStabilizationMode: 'off' },
]);
```

**Impact:** Faster frame processing, fewer frame drops  
**Effort:** 2 minutes  
**Risk:** Very low  
**Status:** ⬜

---

### 🟢 M5 — Consider Green-Channel-Only for HRV Path
**File:** `src/lib/heartRate/signalProcessing.ts`

**Problem:** Weighted channel (0.67R + 0.33G) may not be optimal for all skin types.

**Implementation:** A/B test:
- Current: weighted > green > red > redRatio
- Test: green-only as primary HRV channel

**Impact:** Potentially better AC/DC ratio for some users  
**Effort:** 1 day  
**Risk:** Low  
**Status:** ⬜

---

## Phase 4: Advanced (Future)

### 🟢 A1 — Explore Frequency Demodulation for HRV
**New file:** `src/lib/heartRate/frequencyDemodulationHRV.ts`

**Concept:** Extract HRV from instantaneous frequency instead of peak detection.

**Benefits:**
- Bypasses quantization error entirely
- No dicrotic notch confusion
- Continuous HRV estimate

**Research:** CameraHRV achieves 6ms error vs 50ms+ for peak detection.

**Impact:** Potentially 5-10× improvement in HRV timing accuracy  
**Effort:** 3-5 days  
**Risk:** Medium (new algorithm, needs validation)  
**Status:** ⬜

---

### 🟢 A2 — Real-Time HRV Display
**Files:** UI components + `src/hooks/useHeartRateCapture.ts`

**Concept:** Show live RMSSD/SDNN during measurement instead of only at end.

**Implementation:**
- Compute rolling HRV over last 60s window
- Update every 5-10 seconds
- Show trend arrow (increasing/decreasing)

**Impact:** Better user engagement, immediate feedback  
**Effort:** 2-3 days  
**Risk:** Low  
**Status:** ⬜

---

### 🟢 A3 — Clinical Validation Study

**Concept:** Validate against ECG or Polar H10 chest strap.

**Protocol:**
1. Recruit 20-50 participants
2. Simultaneous recording: your app + Polar H10
3. Resting state, 5 minutes
4. Metrics: BPM MAE, RMSSD MAPE, ICC, Bland-Altman

**Target:**
- BPM MAE < 3 BPM
- RMSSD ICC > 0.85 vs Polar

**Impact:** Scientific credibility, marketing asset  
**Effort:** 2-4 weeks  
**Risk:** Medium (requires ethics approval if publishing)  
**Status:** ⬜

---

## Summary Table

| # | Improvement | Phase | Effort | Impact | Status |
|---|------------|-------|--------|--------|--------|
| C1 | Lock exposure/ISO | 1 | 5 min | 🔥🔥🔥 | ⬜ |
| C2 | Compensate filter group delay | 1 | 10 min | 🔥🔥🔥 | ⬜ |
| C3 | Cubic spline upsampling | 1 | 1-2 days | 🔥🔥🔥 | ✅ |
| H1 | Increase duration to 60s | 1 | 2 min | 🔥🔥 | ⬜ |
| H2 | Reduce deviation threshold | 1 | 5 min | 🔥🔥 | ⬜ |
| H3 | Remove IBI interpolation | 1 | 2 hours | 🔥🔥 | ⬜ |
| H4 | Butterworth bandpass | 2 | 1 day | 🔥🔥 | ⬜ |
| H5 | Fix frequency resolution | 2 | 2-4 hrs | 🔥 | ⬜ |
| M1 | Lens switching lock | 2 | 2 hours | 🔥 | ⬜ |
| M2 | Rolling shutter correction | 2 | 1 hour | 🔥 | ⬜ |
| M3 | Skin tone validation | 3 | 1-2 days | 🔥 | ⬜ |
| M4 | Reduce resolution | 3 | 2 min | 🔥 | ⬜ |
| M5 | Green channel test | 3 | 1 day | 🔥 | ⬜ |
| A1 | Frequency demodulation | 4 | 3-5 days | 🔥🔥🔥 | ⬜ |
| A2 | Real-time HRV display | 4 | 2-3 days | 🔥 | ⬜ |
| A3 | Clinical validation | 4 | 2-4 weeks | 🔥🔥 | ⬜ |

---

## Expected Outcomes by Phase

### After Phase 1
- Live haptic pulse feels "on the beat" (not delayed)
- BPM display is more stable
- HRV RMSSD accuracy improves from ~20% to ~15% MAPE

### After Phase 2
- HRV RMSSD accuracy improves to ~12% MAPE
- Signal preprocessing is cleaner and faster
- Consistent behavior across iPhone models

### After Phase 3
- Equitable accuracy across skin tones
- Fewer frame drops under load
- Optimized channel selection per user

### After Phase 4
- HRV timing error potentially <10ms (frequency demodulation)
- Clinical-grade validation data
- Real-time biofeedback capability

---

## How to Use This Checklist

1. **Start at the top** — Phase 1 items are highest impact per unit effort
2. **Check off as you go** — Update status markers (⬜ → 🔄 → ✅)
3. **Validate each fix** — Run existing tests + add new ones
4. **Don't skip C1** — Exposure lock is the foundation for everything else
5. **Re-audit after Phase 2** — Re-run accuracy comparison to measure improvement

---

*Generated from Technical Audit Report (2026-05-07)*
