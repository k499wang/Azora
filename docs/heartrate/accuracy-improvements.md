# HRV Accuracy Improvements — Catalog

A consolidated catalog of every change identified to improve the accuracy and
reproducibility of the final HRV calculations (RMSSD, SDNN, etc.) in this
app's camera-PPG pipeline.

Each item documents:
- What it does
- Why it improves accuracy (with the underlying mechanism)
- Effort to implement
- Expected impact
- Whether the best-known camera-PPG HRV apps (HRV4Training, Kubios research,
  Elite HRV, Welltory) use it

The catalog is organized by impact-per-effort, not by execution order.

---

## Where finger-PPG accuracy actually comes from

This app uses **finger-contact PPG** (finger on the lens, illuminated by the
flash) — NOT remote/facial PPG (rPPG). The two are different problems with
different solutions. Finger PPG has a strong signal (pulsatile AC is 1-10% of
DC), so accuracy is gained from timing precision, artifact handling, and
measurement protocol — NOT from signal-recovery techniques like ICA/CHROM/POS
(those are rPPG methods; see item 16 for why they do not apply here).

Ranked by leverage for finger-contact PPG specifically:

1. **Measurement protocol** — stillness, consistent finger pressure, stable
   lighting, consistent timing. HRV4Training's #1 lever; mostly product/UX, not
   algorithm. The largest real-world source of day-to-day variance.
2. **Kubios threshold-based artifact correction** — ✅ implemented on this
   branch (detect-and-exclude only; not the full automatic classify-and-correct
   algorithm — see "Already done" for the exact scope).
3. **Smoothness-priors detrending (Tarvainen 2002)** — ✅ implemented on this
   branch. See item 1.
4. **Peak timing refinement (cubic spline)** — directly improves RMSSD. See
   item 4.
5. **ROI selection** — prefer a central ROI, avoid pressure-gradient edges,
   lock the ROI/channel after warmup. See items 2 and 5.
6. **Exposure / white-balance lock** — prevents auto-exposure DC drift from
   contaminating the AC signal. See item 15.
7. **Capture duration + frame rate** — 60 s capture, 30+ FPS. See items 13-14.
8. **Template-correlation beat validation (SQI)** — removes beats whose pulse
   shape is distorted by slight movement (e.g., breathing motion) while
   preserving genuine RSA. The right tool when the person moves slightly during
   measurement. See item 20.

Channel fusion (ICA/CHROM/POS) is deliberately absent from this list — it does
not help finger PPG. The app's existing red-dominant multi-channel scoring is
already the correct approach for this modality.

---

## Already done on this branch

These have been implemented and are live:

- **Kubios threshold-based artifact detection.** `detectHrvArtifacts` in
  `src/lib/hrv.ts` flags a beat when it deviates from the local median (radius
  3, excluding itself) by more than the Kubios "medium" threshold:
  `|ibi − localMedian| > max(250 ms, 0.30 × localMedian)`. Replaced the prior
  MAD + relative + dRR-pair cocktail.
  - **Scope:** this is Kubios' *threshold-based* method (detect, then exclude
    the beat and mark an adjacency break so RMSSD never spans the gap). It is
    **not** the Kubios *automatic* correction (Lipponen & Tarvainen 2019),
    which classifies beats as missed/extra/ectopic/long-short and corrects them
    by interpolating or merging. Detect-and-exclude is the deliberate lean
    choice — it never fabricates IBIs, which is the safer default for HRV.
  - Using the median *excluding the beat under test* is slightly more robust
    than Kubios' local average, which the outlier itself would contaminate.
  - A causal interval sanity filter already runs upstream in `cleanBeatSeries`
    (`signalProcessing.ts`); this is the offline HRV-grade pass on the assembled
    series, not the only artifact handling in the pipeline.
- **Single artifact-correction pass.** The redundant `dev > 0.35` gate inside
  `computeHRVStatsFromCleanIntervals` has been removed. RMSSD math now trusts
  the cleaned series from `preprocessHRVIntervals`.
- **`finalAnalysis.ts` boundary contract.** All HRV gating decisions
  centralized in one module; `captureResult.ts` is now a thin adapter.
- **Phase A/B candidate analysis in offline pipeline.** Faster + slightly
  more stable candidate selection.
- **Sliding-mean BPM graph builder.** Replaced the 9-IBI median smoother
  that produced 70 → 58 stair-step jumps.
- **Smoothness-priors detrending (Tarvainen 2002).** `src/lib/heartRate/detrend.ts`
  replaces the rectangular moving-average detrend in `preprocess()`. The trend
  is the Whittaker smoother `(I + λ²·D₂ᵀD₂)⁻¹·z`, solved with a banded
  (pentadiagonal) Cholesky in O(n). λ is **derived from the sample rate** so the
  half-gain cutoff is fixed at 0.4 Hz regardless of frame rate — the often-quoted
  λ=500 is the Kubios RR-series value and would put the cutoff in the wrong place
  on a 15-180 Hz PPG signal. Validated against a dense reference solve.
- **Frame-rate-aware filter design (live detector).** Reverted on this branch
  — listed here as "tried and rolled back" for context.

---

## Tier 1 — biggest evidence-based wins for HRV accuracy

### 1. Smoothness-priors detrending (Tarvainen 2002) — ✅ DONE

**Status:** Implemented in `src/lib/heartRate/detrend.ts`, wired into
`preprocess()`. Banded (pentadiagonal) Cholesky solve, O(n). λ is derived from
the sample rate to fix the half-gain cutoff at 0.4 Hz (not the RR-series λ=500).
The original design notes below are retained for context.

**What:** Replace the moving-average detrending in `signalProcessing.ts ::
preprocess()` with smoothness-priors detrending. The formula:

```
detrended = signal − (I + λ² · D₂ᵀ · D₂)⁻¹ · signal
```

Where `D₂` is the discrete second-difference operator and `λ` is the smoothness
parameter (Kubios default: 500).

**Why it improves accuracy:** Moving-average detrending has two known
weaknesses:
- Rectangular MA frequency response leaks low-frequency cardiac energy
  (specifically, RSA at 0.15-0.4 Hz can be partially attenuated)
- Fixed time-constant performs poorly across varying signal lengths

Tarvainen's smoothness-priors detrending was specifically designed to remove
very-low-frequency trends (DC drift, respiration-induced baseline sway)
*without altering the cardiac band*. RMSSD computed on the detrended signal
is more reproducible because slow drifts no longer bias adjacent IBI
differences. This is the **single most-cited algorithm improvement for HRV
in the literature**.

**Used by:** Kubios (default detrending), HRV4Training, all academic HRV
papers since ~2003.

**Effort:** Medium. ~80 LOC — build a banded second-difference matrix, solve
the linear system `(I + λ²·D₂ᵀ·D₂)·x = signal` once per capture. Pre-built
JS implementations exist (port from Kubios source or numpy).

**Expected impact:** ~10-15% RMSSD repeatability improvement on captures
with respiration-induced drift. Larger improvement for SDNN. Prerequisite
for accurate frequency-domain HRV (item 5).

---

### 2. Lock ROI/channel after warmup

**What:** During the first 5-8 seconds of capture, rank candidates by Phase A
SNR. Lock the winner. For the remainder of the capture, *only* analyze that
locked candidate. Multi-candidate fallback only if the locked candidate
degrades mid-capture.

**Why it improves accuracy:** `analyzeCapture` currently picks the best
candidate independently each capture via `hrvCandidatePriority`. Two
near-identical captures can pick different winners → different beat timestamp
series → wildly different RMSSD/SDNN. This is **almost certainly the
dominant source of the 15-30 ms run-to-run RMSSD variance** observed during
testing. Even a small score difference between two ROIs flips the winner.

**Used by:** Implicit in most production-grade HRV apps (HRV4Training uses
a single fixed ROI). Academic literature uses ICA which has the same effect
of stable signal selection.

**Effort:** Medium. Add `preferredRoiChannel?: { roiId, channel }` field
to `ComputeBpmOptions`; have `analyzeCapture` short-circuit `buildCandidates`
when set; pass the lock decision from `finalAnalysis.ts` based on early-window
SNR scoring.

**Expected impact:** Largest single improvement for run-to-run reproducibility.
Realistic estimate: RMSSD variance between consecutive same-condition captures
drops from current ~15-30 ms to ~5-10 ms.

---

### 3. Cubic-spline interpolation of isolated missed beats

**What:** When the artifact detector flags an isolated bad IBI (1-2 consecutive
artifacts surrounded by valid neighbors), *replace* it with a cubic-spline
interpolated value rather than rejecting it. Longer artifact runs still get
rejected.

**Why it improves accuracy:** Currently the pipeline creates `adjacencyBreaks`
for rejected IBIs, which removes those pairs from RMSSD computation. A 45-beat
capture with 5 rejections loses ~10 pairs from RMSSD calculation → reduced
statistical power. Interpolation preserves more beats in the calculation and
removes the noise from "which beats got rejected."

This is the missing half of the Kubios artifact-correction approach — we have
detection but not correction.

**Used by:** Kubios (default behavior — they call it "automatic correction"),
HRV4Training implicitly via their RMSSD computation.

**Effort:** Low-medium. ~30 LOC in `preprocessHRVIntervals`. Logic: identify
runs of `artifactMask[i] = true` with length ≤ 2 bordered by valid IBIs, fit
cubic spline through neighbors, interpolate.

**Expected impact:** ~5-10% RMSSD repeatability improvement, plus more
captures usable (fewer "not enough clean beats" errors).

---

### 4. Cubic-spline peak-to-peak refinement (HRV4Training approach)

**What:** After coarse peak detection, fit a cubic spline through the
*sequence of detected peak positions* (not the signal samples) and use the
spline-derived precise peak timestamps. Replaces the current per-peak parabolic
refinement.

**Why it improves accuracy:** Current `refinedBeatTimestampsFromPeaks` uses
3-point parabolic interpolation per peak — uses only 3 samples around each
peak. HRV4Training's approach fits a cubic spline through the sequence of
detected peak vertex positions, using inter-peak rhythm information to refine
each peak's timing. More accurate especially when individual peaks are noisy.

**Used by:** HRV4Training (specifically cited as their key precision
improvement in Altini's 2016 paper).

**Effort:** Medium. Replace `refinedBeatTimestampsFromPeaks` to do a cubic
spline through detected peak indices, then resample at the spline-implied
positions.

**Expected impact:** ~3-8 ms peak timing precision improvement → ~5-10%
RMSSD reduction.

---

## Tier 2 — solid algorithmic improvements

### 5. Welch's PSD method for frequency-domain HRV (HF, LF, LF/HF ratio)

**What:** Compute power spectral density of the IBI series using Welch's
periodogram method. Report power in HF (0.15-0.4 Hz, parasympathetic), LF
(0.04-0.15 Hz, mixed sympathetic/parasympathetic), and the LF/HF ratio.

**Why it improves accuracy:** RMSSD measures short-term variability in the
time domain; HF power measures the same physiological process (vagal tone)
in the frequency domain. Reporting both creates a cross-check — when they
disagree, the capture has issues.

**Prerequisites:**
- Smoothness-priors detrending (item 1) — Welch's on undetrended data is
  dominated by low-frequency drift
- Interpolate IBI series to uniform time grid (typically 4 Hz)

**Used by:** Kubios (default frequency-domain method), all clinical HRV
research, HRV4Training reports HF/LF for advanced users.

**Effort:** Higher. ~150 LOC: cubic-spline interpolate IBIs to uniform grid,
windowing (Hamming), segment with 50% overlap, FFT per segment, average
periodograms, integrate power in bands. Alternative: Lomb-Scargle directly on
non-uniform IBIs (~200 LOC) — handles non-uniform sampling natively without
interpolation step.

**Expected impact:** Doesn't directly improve RMSSD precision, but provides
an independent quality cross-check and an industry-standard metric users see
in other apps.

**Caveat:** 45-60 s captures are borderline for HF (need at least 2-3 cycles
of the slowest HF component = ~20 s minimum). HF estimates from 45 s captures
are noisier than from 5 min captures. Consider gating HF output to captures
≥ 60 s, or labeling shorter-capture HF as low-confidence.

---

### 6. Adaptive band-pass narrowing around detected HR

**What:** After the first 5-8 seconds (when HR is roughly estimated), narrow
the band-pass filter to ±50% around the fundamental. E.g., for a 60 BPM user
(1 Hz fundamental), use 0.5-1.5 Hz instead of 0.7-3.5 Hz.

**Why it improves accuracy:** Kills second-harmonic noise from dicrotic
notches and motion artifacts that lie above 2× fundamental. Real cardiac
energy is concentrated at fundamental + 2nd harmonic, so a narrower band
loses very little signal but removes major noise sources.

**Used by:** Academic camera-PPG research (HR-aware adaptive filtering is
standard).

**Effort:** Medium. Add an HR-aware second-pass filter to the offline
pipeline after initial HR estimation.

**Expected impact:** Modest. Mostly helps in noisy captures or those with
strong dicrotic notches.

---

### 7. Multi-window RMSSD with median aggregation

**What:** Compute RMSSD on three or more overlapping windows (e.g., 25-30 s
windows shifted by 5-10 s) of the capture, report the median.

**Why it improves accuracy:** A single RMSSD over the whole capture is
heavily influenced by any local anomaly (one PVC, one breathing-induced IBI
swing). Multiple overlapping windows give a more robust point estimate.

**Used by:** Kubios offers sliding-window analysis, common in research.

**Effort:** Low. Wrap `computeHRVStatsFromCleanIntervals` in a loop over
windows.

**Expected impact:** ~10-15% RMSSD repeatability improvement. Most useful
on captures containing brief anomalies.

**Caveat:** At 45 s with 30 s windows, the windows are heavily overlapping
and not statistically independent. The win is robustness against local
anomalies, not statistical power. Better suited to 60+ s captures.

---

### 8. Multi-candidate HRV aggregation

**What:** Compute RMSSD on the top-3 candidates (by Phase A SNR), report the
median. Or report the mean weighted by candidate confidence.

**Why it improves accuracy:** Even with ROI/channel lock (item 2), the chosen
candidate is one possibility. Aggregating across the top candidates smooths
selection-dependent variance.

**Used by:** Implicit in academic ICA-based pipelines (the ICA component
selection has the same effect).

**Effort:** Medium. Refactor `pickBestBeatSeries` to keep all peakAnalyses,
compute RMSSD per analysis, aggregate at the end.

**Expected impact:** ~10-15% additional RMSSD smoothing on top of ROI lock.

**Note:** Item 2 (ROI lock) and item 8 (multi-candidate aggregation) are
complementary, not competing. Item 2 fixes which candidate is *chosen*; item
8 reduces the variance from *that choice* by aggregating across the top few.

---

## Tier 3 — additional HRV metrics (don't improve RMSSD, add value)

These don't directly improve RMSSD accuracy but add the metrics that
Kubios-trained users and HRV apps display alongside it.

### 9. Stress index (Baevsky)

**Formula:**
```
SI = AMo / (2 × Mo × MxDMn)
where:
  Mo  = mode of RR distribution (binned to 50 ms)
  AMo = % of RR values at the mode
  MxDMn = (max − min) RR
```

**Why include:** International clinical standard stress measure (originally
Russian aerospace medicine, now widely used). Higher SI = more sympathetic
dominance / lower HRV. Range ~10-1000 on a log scale.

**Effort:** ~30 LOC.

---

### 10. Poincaré plot SD1 / SD2

**Formulas:**
- SD1 = stddev(diff(RR) / √2) — short-term variability (correlates with RMSSD)
- SD2 = stddev along the Poincaré plot diagonal — long-term variability
- SD1/SD2 ratio — autonomic balance indicator

**Why include:** SD1 ≈ RMSSD / √2 by construction, so it cross-validates
RMSSD — if they disagree, the capture has issues. Poincaré plot is also a
visually engaging HRV display.

**Effort:** ~40 LOC.

---

### 11. Triangular index (HRV Triangular Index)

**Formula:** Build a histogram of RR intervals at 7.8125 ms bin width.
Divide total RR count by peak histogram height.

**Why include:** Geometric HRV measure that is robust to outliers (based on
histogram shape, not individual values). Good for noisy captures where
single-value statistics like RMSSD are sensitive to artifacts.

**Effort:** ~20 LOC.

---

### 12. Detrended SDNN as separate metric

**What:** Compute SDNN on the detrended IBI series. Report as
`detrendedSdnn`, *do not* replace the canonical SDNN.

**Why include:** Canonical SDNN (per 1996 Task Force standard) reflects total
variability including slow trends. For breath-hold captures where the user
intentionally drives HR drift, canonical SDNN is contaminated by that drift.
A detrended variant isolates the cyclic variability component.

**Why separate:** SDNN by definition includes trends. Renaming detrended SDNN
as "SDNN" silently changes what every historical comparison means. Report
both.

**Effort:** ~20 LOC. (Already partially implemented — `computeDetrendedSdnn`
exists in `hrv.ts`.)

---

## Tier 4 — capture-side improvements (enabling, not algorithm)

### 13. Capture duration 45 s → 60 s

**Why:** RMSSD variance scales as 1/√N (where N = beat count). 45 beats → 60
beats is ~13% statistical variance reduction. First ~5-8 s is warmup anyway,
so usable beats grow more than linearly with capture time.

**Used by:** HRV4Training (60 s standard, sometimes 90 s for high-precision
mode).

**Effort:** One constant change in `useHeartRateCapture.ts`
(`CAPTURE_DURATION_MS = 60000`).

**Trade-off:** UX. Users are already waiting 45 s; 60 s feels longer. Worth
user-testing.

---

### 14. Frame rate 30 → 60 FPS

**Why:** Peak timing quantization is bounded by the sample period.
- 30 FPS → ±16.7 ms quantization
- 60 FPS → ±8 ms quantization

RMSSD lives in the 20-70 ms range, so quantization noise at ±16.7 ms is
significant. 60 FPS roughly halves this contribution.

**Effort:** Constant change in the camera format request. Real cost is CPU
and battery — worth measuring on lower-end devices.

**Expected impact:** Real but bounded. Direct precision improvement on the
order of ~8 ms RMSSD floor reduction. Most useful for users with low RMSSD
(< 30 ms) where the timing floor dominates.

---

### 15. Lock exposure and white balance during capture

**What:** During the capture-start phase, lock the camera's exposure and
white-balance settings via VisionCamera's `exposure` and `whiteBalance`
props. Unlock at capture end.

**Why:** Auto-exposure adjustments during a 45-60 s capture inject
low-frequency DC drift that the band-pass mostly handles but not entirely.
Lighting changes affect AC/DC normalization. Locking removes a major
confounding variable.

**Used by:** HRV4Training, most clinical-grade camera-PPG apps.

**Effort:** Low. Need to capture initial AE state during the camera-check
phase, then lock at the start of measurement.

**Expected impact:** Modest for HRV specifically, larger benefit for live
detector stability. Most useful in variable-lighting environments.

---

## Motion robustness — handling breathing-induced movement

During a seated/standing HRV capture the person moves slightly as they breathe.
This creates a subtle but important problem: breathing produces **both**
- *real* respiratory sinus arrhythmia (RSA) — genuine beat-to-beat timing
  variation we WANT to measure, and
- *motion artifact* — small movement that distorts the optical signal and
  corrupts beat timing, which we do NOT want.

The key discriminator, well established in the PPG literature: **real RSA
changes beat timing but preserves pulse morphology; motion distorts pulse
morphology.** This is what makes the technique below the right tool — it
removes motion-corrupted beats while keeping genuine RSA intact.

### 20. Template-correlation beat validation (Signal Quality Index)

**What:** During offline analysis, after peaks are detected:
1. Extract a fixed-width window around each detected peak (e.g., ±0.3 s) from
   the processed signal.
2. Build an average/median beat template from all windows.
3. Correlate each beat's window against the template.
4. Reject beats whose correlation falls below a threshold (~0.8) before they
   become IBIs.

**Why it improves accuracy (and specifically handles breathing motion):** A
beat corrupted by slight movement has a distorted shape → low correlation with
the clean-beat template → excluded. A beat that is merely *early or late* due
to genuine RSA still has a normal shape → high correlation → kept. So this
filter removes motion artifacts **without** suppressing the real HRV signal —
exactly the distinction that matters for the breathing-motion case. It also
catches dicrotic-notch mis-detections and partial beats.

**Why it fits this codebase (lean):** The offline analyzer already produces the
detected peak indices (`analysis.peaks.peaks`) and the processed signal
(`analysis.processed`) at the point beats are converted to IBIs
(`buildScoredCaptureBeatSeries`). The check is a pure function over data that
already exists — no new capture-time plumbing, no native dependency, no extra
signal pass. Estimated ~50-70 LOC.

**Used by:** Standard signal-quality methodology — Orphanidou et al. (2015,
the canonical SQI paper, validated on both ECG and PPG) and Elgendi (2016,
PPG-specific signal-quality indices). Widely used in wearable and clinical PPG
to gate which beats enter HRV computation.

**Expected impact:** Directly targets the user's stated concern (slight
breathing movement). Removes morphology-distorted beats that the timing-only
Kubios artifact pass (item B / dRR threshold) can miss — a beat can have a
plausible IBI but a corrupted shape. Estimated meaningful RMSSD reproducibility
improvement in real-world (non-perfectly-still) captures, which is the actual
use case.

**Verdict: RECOMMENDED.** This is the one motion-robustness technique that is
(a) established in the literature, (b) specifically correct for distinguishing
RSA from motion, (c) applicable to finger-contact PPG, and (d) lean enough to
fit the codebase as a pure function on existing data. It complements — does not
replace — the Kubios dRR artifact pass: Kubios catches bad *timing*, template
correlation catches bad *morphology*. Together they cover both failure modes.

### Accelerometer-based motion gating — considered, NOT recommended for now

**What:** Read the phone IMU (`expo-sensors` Accelerometer) during capture,
compute motion energy, and exclude high-motion windows or reject the capture.

**Used by:** HRV4Training and most wrist wearables (which pair PPG with an
accelerometer for adaptive motion cancellation).

**Why it is NOT added here:** Three honest reasons against it for this app's
"lean and clean" goal:
1. **Heavier integration.** Requires a native sensor dependency plus
   capture-flow plumbing to record timestamped accelerometer samples and align
   them with PPG windows — a cross-cutting concern, not a pure function.
2. **Template-correlation SQI (item 20) better targets the stated problem.**
   Breathing micro-motion can be below the accelerometer's useful threshold
   while still distorting the optical signal. Morphology correlation catches
   that distortion directly; the accelerometer might not see it.
3. **Diminishing returns.** It largely overlaps item 20 for the motion case
   while costing more complexity.

Revisit only if item 20 proves insufficient in real-world testing, or if a
contactless/face-PPG mode is added (where accelerometer motion compensation
becomes much more valuable).

---

## Tier 5 — research-grade (probably overkill)

### 16. Channel-fusion techniques (ICA / CHROM / POS) — NOT applicable to finger PPG

**What they are:** Blind source separation and chrominance-projection methods
that combine the R/G/B channels to extract a clean pulse signal:
- **ICA** (Poh, McDuff & Picard 2010) — independent component analysis
- **CHROM** (de Haan & Jeanne 2013) — chrominance-based projection
- **POS** (Wang et al. 2017) — plane-orthogonal-to-skin projection

**Critical context — these are remote-PPG (rPPG) techniques, not finger-PPG
techniques.** They were all developed for *contactless facial video* where the
pulsatile signal is 0.1-1% of pixel intensity and buried in ambient-light and
motion noise. CHROM and POS specifically project RGB onto a plane derived from
the **skin-tone direction under broadband/ambient light** to cancel motion and
specular reflection.

**Why they do NOT help finger-contact PPG (this app):**

1. **Wrong problem.** ICA/CHROM/POS exist to recover a *weak* signal. Finger +
   flash PPG produces a *strong* signal (AC is 1-10% of DC). Channel separation
   is not the bottleneck — there is no weak signal to rescue.
2. **Wrong color physics.** CHROM/POS assume diffuse reflection of broadband
   light off skin with a known skin-tone vector. Finger PPG is *transmission
   through tissue lit by the flash*, dominated by the red channel — a
   completely different optical model. The skin-tone projection math is derived
   for the wrong case and could degrade the signal.
3. **Red dominates in finger PPG.** Flash light reaching the sensor after
   passing through the finger is overwhelmingly red. The single best channel is
   red (or red-weighted). Green-channel emphasis is an rPPG property and does
   not transfer.

**What finger-PPG apps actually use:** HRV4Training, and validated smartphone
finger-PPG research (Scully et al. 2012; Gregoski et al. 2012), all use
**red-channel (or red-weighted) spatial averaging + band-pass + peak detection
+ artifact correction.** None use blind source separation.

**This app already does the right thing.** `channelValue` in
`signalProcessing.ts` offers `red`, `weighted` (r×0.67 + g×0.33), and
`redRatio` — all red-dominant — and the multi-ROI/channel candidate scoring
picks whichever has the best SNR per capture. For finger+flash that lands on a
red-dominant channel, which is exactly what the literature prescribes. No
fancier channel fusion is needed or beneficial.

**Verdict:** Do not implement ICA, CHROM, or POS. They are solving the rPPG
problem, which this app does not have. They would add significant complexity
and could reduce accuracy. The only scenario where they would matter is a
future contactless/face-PPG mode — not finger-on-lens capture.

---

### 17. Template-matched peak refinement

**What:** Fit a Gaussian or learned PPG-pulse template at each candidate
peak via least-squares. Use the template vertex as the peak timestamp.

**Used by:** Research literature; some clinical devices.

**Effort:** Medium-high. Need to derive or learn a PPG template, then fit
via least-squares per peak. Library code exists.

**Verdict:** Skip. Marginal improvement over cubic-spline peak refinement
(item 4). Only worth pursuing if item 4 turns out to be insufficient.

---

### 18. AR-model PSD

**What:** Autoregressive parametric power spectral density estimation as
alternative to Welch's (item 5).

**Used by:** Kubios offers as an option, used in some research.

**Effort:** ~100 LOC.

**Verdict:** Skip. Marginal benefit over Welch's for typical capture lengths.
Adds complexity without changing what users see.

---

### 19. Non-linear HRV (Sample entropy, DFA, recurrence plots)

**What:** Sample entropy quantifies signal regularity; detrended fluctuation
analysis (DFA) quantifies fractal scaling of HRV; recurrence plots visualize
recurring states.

**Used by:** Research, very rarely consumer apps.

**Effort:** ~150-300 LOC depending on which metrics.

**Verdict:** Skip. Not actionable for consumer users — these are clinical
research tools. Consider only if you target a research-grade user audience.

---

## Recommended execution order

Each item is independently shippable. Recommended sequence by impact and
risk:

1. **Smoothness-priors detrending (item 1)** — biggest evidence-based win,
   one self-contained change in `preprocess()`.
2. **Cubic-spline interpolation of isolated missing beats (item 3)** —
   completes the Kubios approach, small addition to `preprocessHRVIntervals`.
3. **Lock ROI/channel after warmup (item 2)** — biggest reproducibility win,
   needs a small refactor in `analyzeCapture`.
4. **Capture duration 45 s → 60 s (item 13)** — single constant change,
   needs UX consideration.
5. **Cubic-spline peak-to-peak refinement (item 4)** — replaces parabolic
   refinement.
6. **Welch's PSD for HF/LF (item 5)** — adds a cross-check metric.
7. **Stress index, Poincaré SD1/SD2, triangular index (items 9-11)** —
   parallel low-effort additions.
8. **Lock exposure/WB (item 15)** — capture-side enablement.

Optional later:
- Adaptive band-pass narrowing (item 6)
- Multi-window RMSSD aggregation (item 7)
- Multi-candidate HRV aggregation (item 8)
- 60 FPS capture (item 14) — only if base improvements aren't enough
- Detrended SDNN as separate metric (item 12) — straightforward labeling
- ICA, template matching, AR-PSD, non-linear HRV — defer indefinitely

---

## Expected cumulative impact

If all Tier 1 items (1, 2, 3, 4) are implemented:

- **Run-to-run RMSSD variance** between consecutive captures of the same
  user in same conditions: drops from current 15-30 ms range to estimated
  5-10 ms range.
- **Absolute RMSSD vs ECG reference** (if validated): no improvement
  guaranteed — depends on reference availability. Internal consistency
  improves; accuracy claim requires ground truth.
- **Number of usable captures** (vs "not enough clean beats" errors):
  modest improvement from item 3.
- **SDNN accuracy** in captures with respiration drift: meaningful
  improvement from item 1.

If Tier 2 items are added (5, 6, 7, 8):
- Cross-validation of RMSSD via HF power and SD1.
- Better robustness to noisy captures.

Tier 3 items (9, 10, 11, 12):
- Display richness, comparability with Kubios-trained users and other apps.
- Do not change RMSSD accuracy.

Tier 4 items (13, 14, 15):
- Real precision improvements bounded by hardware/protocol.

---

## Honest accuracy ceilings

Camera-PPG HRV has fundamental limits no amount of algorithm improvement can
overcome:

1. **Sample rate ceiling.** At 30 FPS, peak timing quantization is ±16.7 ms;
   at 60 FPS, ±8 ms. Chest straps sample at 1000 Hz (±1 ms). For users with
   very low RMSSD (10-20 ms, e.g., highly trained athletes at rest), camera
   PPG will always be noisier.
2. **Cubic-spline upsampling and similar peak refinement** cannot recover
   information past the original Nyquist. Refined peak timestamps are
   smoother but not more accurate than ~½ × sample period.
3. **Fingertip arrival timing** vs cardiac electrical activity. Camera PPG
   measures blood-volume changes at the finger; chest straps measure cardiac
   electricity. Even with perfect signal processing, pulse-transit-time
   variability adds noise that ECG doesn't have.

Realistic ceiling at 30 FPS, 60 s captures, after all Tier 1 + Tier 2
improvements: **~5-10 ms RMSSD precision vs ECG reference** for normal RMSSD
values (40-80 ms). Better than the current pipeline by a factor of 2-3×;
still meaningfully worse than chest-strap precision.

To meaningfully exceed this ceiling, the only paths are:
- 60+ FPS capture (item 14)
- Validate against a ground-truth device and tune to it
- Switch input source (Bluetooth chest strap integration) — out of scope
  for a camera-PPG app

---

## References

- Tarvainen et al. (2002) — "An advanced detrending method with application
  to HRV analysis" — smoothness-priors detrending
- Altini & Amft (2016) — "HRV4Training: large-scale longitudinal training
  load analysis in unconstrained free-living settings using a smartphone
  application"
- Plews et al. (2017) — "Comparison of heart-rate variability recording with
  smartphone photoplethysmography, Polar H7 chest strap and electrocardiography"
- Task Force HRV Standards (1996) — "Heart rate variability: standards of
  measurement, physiological interpretation, and clinical use"
- Kubios HRV Methods documentation
- Verkruysse, Svaasand, Nelson (2008) — "Remote plethysmographic imaging
  using ambient light"
- McDuff et al. (2014) — "Improvements in remote cardiopulmonary measurement
  using a five band digital camera"
- Orphanidou et al. (2015) — "Signal-quality indices for the electrocardiogram
  and photoplethysmogram: derivation and applications to wireless monitoring"
  — canonical template-correlation SQI (ECG + PPG)
- Elgendi (2016) — "Optimal signal quality index for photoplethysmogram
  signals" — PPG-specific signal-quality indices
- Poh, McDuff & Picard (2010) — "Non-contact, automated cardiac pulse
  measurements using video imaging and blind source separation" — ICA (rPPG)
- de Haan & Jeanne (2013) — "Robust pulse rate from chrominance-based rPPG"
  — CHROM (rPPG)
- Wang et al. (2017) — "Algorithmic principles of remote photoplethysmography"
  — POS (rPPG)
- Scully et al. (2012) — "Physiological parameter monitoring from optical
  recordings with a mobile phone" — finger-contact PPG, red channel
- Gregoski et al. (2012) — smartphone finger-PPG HRV validation
