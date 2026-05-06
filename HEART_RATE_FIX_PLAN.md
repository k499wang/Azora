# Heart Rate Live-Tick Fix Plan

Plan to fix two related symptoms in the live heart rate monitor:

1. **Missed live beats** — some real heartbeats don't emit a visual tick.
2. **Off-rhythm ticks** — emitted ticks land slightly early or late relative to the real pulse.

While preserving today's accuracy guarantees (no dicrotic doublets, no noise blips, no spurious ticks).

---

## Diagnosis

All beat-detection logic lives in `src/lib/heartRate/heartRateManager.ts`. The visual tick (`beatDetected`) is currently gated by the **same** logic that decides whether an IBI gets admitted to the BPM history. Anything that rejection logic drops also disappears from the UI, even though the heart actually beat.

### Why beats go missing

1. **Malik 20% ectopic gate** (`heartRateManager.ts:457-468`).
   `MALIK_THRESHOLD = 0.2` rejects any beat whose IBI deviates >20% from the recent median. Real resting HRV — especially after a sigh, swallow, or finger shift — routinely exceeds 20% short-term. When the gate fires, `acceptedPeak` stays false and no tick is emitted.

2. **Cold-start "pending short IBI" defer** (`heartRateManager.ts:447-454`).
   For the first ~3 beats, any IBI <430 ms is held pending and only released if the *next* IBI confirms it within ±25%. If confirmation fails, both peaks are dropped silently. A real ~140 BPM rhythm (IBI ~430 ms) can trip this.

3. **Trough re-arm + 900 ms force-rearm** (`heartRateManager.ts:22-23, 380-387`).
   `armedForPeak` only resets when the signal dips to `-amplitude * 0.1` or after 900 ms. With shallow PPG troughs (common at 60–80 BPM with light finger pressure), the signal never dips far enough, and 900 ms corresponds to 67 BPM — so a real beat at ~70 BPM with a shallow trough is silently swallowed.

### Why timing drifts

- **Filter group delay** dominates the perceived offset. The cascaded HP (0.7 Hz) + LP (3.5 Hz) biquads (`heartRateManager.ts:78-79`) introduce ~80–150 ms of group delay at typical heart-rate frequencies, and the delay shifts with frequency. As HR drifts, the visual tick drifts with it — feeling "late at slow HR, early at fast HR".
- Peak detection runs on `prev1`, so emission is also one frame late (~22 ms at 45 fps). Constant offset; not the source of *variation*.
- When a beat is rejected (Issue 1), the next accepted beat lands ~2 IBIs after the previous one, which reads visually as "tick was very late, then snapped early". This is the strongest perceived irregularity.

### Why we can't simply drop the gates

Several gates exist specifically to suppress the dicrotic notch — the secondary PPG bump ~150–300 ms after the systolic peak that looks like a second beat:

| Gate | What it actually protects against |
|---|---|
| `prev1 > upperThreshold` (amplitude) | Low-amplitude noise blips |
| `armedForPeak` (must dip to trough) | Flat-top / shoulder double-triggers on a single beat |
| `refractoryOk` (≥ `adaptiveMinIbi`, floor 300 ms) | Dicrotic notch doublets |
| Malik 20% deviation from median | HRV outlier statistics, *not* doublets |
| Pending-short cold-start defer | Mostly cold-start dicrotic protection |

The first three keep doublets out. Malik and pending-short are HRV-stats / cold-start guards — they hide real beats without adding doublet protection that the first three don't already provide.

---

## Plan

### 1. Decouple visual tick from IBI admission

In `processFrame`, set `beatDetected = true` the moment `refractoryOk` + amplitude + `armedForPeak` all pass. Move Malik / pending-short gating onto `pushAcceptedIbi` / `ibiHistory` so they only affect BPM and HRV statistics, not the live tick.

Doublet-safe: the 300 ms refractory + amplitude threshold + arm-disarm still gate every emitted tick.

### 2. Tighten doublet defenses on the tick path to compensate

- Raise `MIN_IBI_MS` from **300 → 320 ms** (still allows 187 BPM, well above any real-world live use). Widens the dicrotic-notch refractory by ~one frame.
- Keep the pending-short cold-start defer but lower its threshold from **430 → 360 ms**, so it only catches genuinely suspicious cold-start fast intervals, not legitimate 140 BPM rhythm.

### 3. Stop silently swallowing slow, shallow-trough beats

- Lower `FORCE_REARM_AFTER_MS` from **900 → 600 ms** (= 100 BPM). Ensures a beat at 60–80 BPM with a shallow trough always re-arms before the next peak.
- Optional: lower `TROUGH_REARM_FACTOR` from 0.1 → 0.05 so re-arm triggers more reliably on natural troughs without waiting for the timeout.

### 4. Compensate filter group delay on emission

At the moment `beatDetected` is emitted, subtract the bandpass cascade's group delay so the visible tick lines up with the actual systolic peak.

- Compute group delay analytically from the biquad coefficients at the current dominant frequency (≈ `60000 / medianIbi`).
- Subtract it from the emitted timestamp / fire the tick early by that offset.
- Result: rhythmically locked ticks instead of HR-dependent drift.

(Optional second path: replace cascaded biquads with a single-pole HP at 0.5 Hz + a small moving-average. Roughly halves group delay and flattens its frequency dependence. More invasive — defer unless step 4 alone isn't enough.)

---

## Acceptance criteria

- Every refractory-passed peak emits exactly one visual tick.
- No dicrotic-notch doublets in normal recordings (verify with the existing `signalProcessing.test.mjs` fixtures plus a manual recording at 60–80 BPM with light finger pressure).
- Stored IBIs and the displayed BPM number remain at least as stable as today (Malik still gates the history).
- Tick timing feels rhythmically locked across a 60 → 140 BPM sweep (manual verification on device).
- `npm test` passes; `npx tsc --noEmit` passes.

---

## Files touched

- `src/lib/heartRate/heartRateManager.ts` — all changes.
- `src/lib/heartRate/signalProcessing.test.mjs` — extend fixtures if needed for new edge cases.

No changes expected in `useLivePulse.ts`, `useHeartRateStream.ts`, or any UI component.
