# Heart Rate Feature — Commit History

A running log of what each commit changed in the heart-rate capture pipeline. Most recent first. File paths are relative to repo root.

Core files touched:
- `src/lib/heartRate/heartRateManager.ts` — detector, IBI extraction, live BPM
- `src/lib/heartRate/captureResult.ts` — builds the final reading + HRV stats
- `src/lib/hrv.ts` — RMSSD / SDNN / pNN50 / HR-drop math
- `src/hooks/useHeartRateCapture.ts` — camera + state machine
- `src/components/heartRate/ResultScreen.tsx` — post-capture UI

---

## `f16195d` — 30 seconds, show RMSSD and SDNN

- Capture window length is 30 s (`CAPTURE_DURATION_MS = 30000` in `useHeartRateCapture.ts`).
- `ResultScreen.tsx` now surfaces RMSSD and SDNN alongside BPM.
- Minor test additions in `heartRateManager.test.mjs`.

Effect: first time HRV stats are actually visible to the user.

---

## `dedb549` — Faster Timing

- Added `HeartRateManager.beginMeasurementWindow(startTimestamp)`.
  - Clears `ibiSamples` (the persisted HRV stream) but **keeps** `ibiHistory` (the rolling median used for live BPM) and the warmed baseline / smoothing state.
  - Sets `skipNextRecordedIbi` so the very first IBI that straddles the setup → measurement boundary is **not** written into `ibiSamples`. That first interval is contaminated by the transition and would skew SDNN.
- `useHeartRateCapture.ts` calls `beginMeasurementWindow()` when it transitions from `camera_check` to `measuring`.

Effect: measurement starts instantly with a valid live BPM (detector stays warm), and the HRV window isn't polluted by a cross-boundary interval.

---

## `c48ec90` — IBI Accuracy

The big detection upgrade. Three independent improvements in one commit:

1. **Parabolic peak interpolation** (`interpolatePeakTimestamp` in `heartRateManager.ts`).
   - Fits a parabola through the three AC samples around a peak and solves for the true vertex.
   - Recovers sub-frame timing instead of snapping peaks to the 33 ms frame grid.
   - Directly improves RMSSD, which is dominated by small beat-to-beat differences.
   - Adds `prev2Ts` tracking so the interpolation has the timestamps it needs.

2. **Malik 20% ectopic rejection** (`MALIK_THRESHOLD = 0.2`, `MALIK_WINDOW = 5`, `MALIK_MIN_HISTORY = 3`).
   - A new IBI that deviates more than 20% from the median of the last 5 accepted IBIs is rejected.
   - **Anchor preservation**: on rejection, `lastPeakTs` is **not** advanced. The next good beat measures its IBI back to the true predecessor, so a single split/ectopic beat doesn't corrupt the *following* IBI too.
   - Guards against split-beat and double-peak artifacts inflating SDNN.

3. **Real signal quality per beat.**
   - `IbiSample.signalQuality` used to be `null`. Now it's `amplitude / SIGNAL_QUALITY_REF` clamped to `[0, 1]`.
   - Feeds the `MIN_HRV_SIGNAL_QUALITY = 0.6` gate in `captureResult.ts` so low-SNR beats are excluded from HRV stats.

Also: `ibiHistory` is cleared on long-gap reinit; `sessionStartTs` is preserved across short gaps so `offsetMs` values stay monotonic within a session.

Effect: tighter IBI timing, cleaner SDNN/RMSSD, resilience to single bad beats.

---

## `078f74f` — IBI Schemas

- Introduced the `IbiSample` type: `{ offsetMs, ibiMs, signalQuality }`.
- `HeartRateManager` started persisting a per-beat `ibiSamples[]` stream alongside the short `ibiHistory` used for live BPM.
- `captureResult.ts` now derives HRV stats (`rmssd`, `sdnn`, `pnn50`, `hrDrop`, `beatCount`) from `ibiSamples` filtered by signal quality, instead of re-deriving from the raw PPG signal.
- Added Supabase migrations for persisting IBI samples and HRV metrics.

Effect: HRV stats now come from the actual captured beat stream rather than a second pass over the waveform. This is the foundation everything above builds on.

---

## `378d3b9` — Statistics Part (pre-IBI-stream)

- Earlier HRV surface work before `ibiSamples` existed. Stats were computed from the signal and carried on the reading object.

---

## `cd6efe4` — Live BPM Improvements

- Iteration on how `getCurrentBpm()` is computed / gated for the live on-screen number. Median over a short IBI window with a sanity clamp (40–180 BPM).

---

## `f19fe55` — Pulse Style

- UI-only: pulse animation styling. Pulse tick is driven by `frameState.beatDetected` in `useHeartRateCapture.ts`, which fires on every refractory-passing peak (before Malik filtering).

---

## Earlier — foundations

- `9888c65 Heart Rate` — first heart-rate flow wired up.
- `66306ca Refactor Code Changes` — general cleanup around that flow.
- `25f2dab Camera Preview and Other Things` — camera surface.
- `62882cf Azora` — broader project work.
- `4c9ae37 Heart Rate Implementation` — initial detector implementation.
- `efdc8a2 Basic ROI?` — first ROI classification pass.
- `5ea8593 Basic Implementation` — skeleton.

---

## How the pieces fit today

- **Live pulse tick** (`beatTick`) — bumped on every detected peak that passes the refractory check. Fires *before* Malik, so ectopics still animate.
- **Live BPM number** — median of `ibiHistory`. Malik-filtered, so ectopics don't jitter the displayed number.
- **HRV stats (RMSSD/SDNN/pNN50)** — computed in `hrv.ts` from `ibiSamples` filtered by `signalQuality >= 0.6`. Malik-filtered and boundary-IBI-skipped.

The three streams share one detector but diverge at the point of truth: the pulse sees raw peaks, the live number sees the filtered rolling window, and HRV sees the quality-gated persisted stream.
